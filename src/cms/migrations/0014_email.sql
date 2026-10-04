CREATE TABLE "cms"."email_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"sent_at" timestamp with time zone DEFAULT now() NOT NULL,
	"to" varchar(500) NOT NULL,
	"subject" varchar(500) NOT NULL,
	"kind" text NOT NULL,
	"sent_by_id" integer,
	"message_id" varchar(500)
);
--> statement-breakpoint
CREATE TABLE "cms"."mail_settings" (
	"id" integer PRIMARY KEY NOT NULL,
	"data" jsonb NOT NULL,
	"password_sealed" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "mail_settings_single" CHECK ("cms"."mail_settings"."id" = 1)
);
--> statement-breakpoint
CREATE TABLE "cms"."password_resets" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cms"."email_log" ADD CONSTRAINT "email_log_sent_by_id_users_id_fk" FOREIGN KEY ("sent_by_id") REFERENCES "cms"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cms"."password_resets" ADD CONSTRAINT "password_resets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "cms"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "email_log_sent_idx" ON "cms"."email_log" USING btree ("sent_at");--> statement-breakpoint
CREATE INDEX "password_resets_user_idx" ON "cms"."password_resets" USING btree ("user_id");