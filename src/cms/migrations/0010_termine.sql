CREATE TABLE "buero"."termine" (
	"id" serial PRIMARY KEY NOT NULL,
	"titel" varchar(300) NOT NULL,
	"beginn" timestamp with time zone NOT NULL,
	"ende" timestamp with time zone,
	"ganztags" boolean DEFAULT false NOT NULL,
	"ort" varchar(300),
	"notiz" text,
	"kunde_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "termine_ende_nach_beginn" CHECK ("buero"."termine"."ende" is null or "buero"."termine"."ende" >= "buero"."termine"."beginn")
);
--> statement-breakpoint
ALTER TABLE "buero"."termine" ADD CONSTRAINT "termine_kunde_id_kunden_id_fk" FOREIGN KEY ("kunde_id") REFERENCES "buero"."kunden"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "termine_zeit_idx" ON "buero"."termine" USING btree ("beginn");--> statement-breakpoint
CREATE INDEX "termine_kunde_idx" ON "buero"."termine" USING btree ("kunde_id");