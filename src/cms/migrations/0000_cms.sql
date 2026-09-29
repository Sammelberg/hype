CREATE SCHEMA IF NOT EXISTS "cms";
--> statement-breakpoint
CREATE TYPE "cms"."doc_status" AS ENUM('draft', 'published');--> statement-breakpoint
CREATE TABLE "cms"."form_submissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"form_id" integer NOT NULL,
	"data" jsonb NOT NULL,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cms"."forms" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(200) NOT NULL,
	"fields" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"submit_button_label" varchar(100),
	"confirmation_message" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "forms_title_unique" UNIQUE("title")
);
--> statement-breakpoint
CREATE TABLE "cms"."media" (
	"id" serial PRIMARY KEY NOT NULL,
	"filename" varchar(255) NOT NULL,
	"mime_type" varchar(100) NOT NULL,
	"filesize" integer NOT NULL,
	"width" integer,
	"height" integer,
	"alt" varchar(500) NOT NULL,
	"focal_x" real DEFAULT 50 NOT NULL,
	"focal_y" real DEFAULT 50 NOT NULL,
	"sizes" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "media_filename_unique" UNIQUE("filename")
);
--> statement-breakpoint
CREATE TABLE "cms"."pages" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(200) NOT NULL,
	"parent_id" integer,
	"path" text NOT NULL,
	"title" varchar(300) NOT NULL,
	"lead" text,
	"content" jsonb,
	"meta_title" varchar(200),
	"meta_description" varchar(500),
	"meta_image_id" integer,
	"status" "cms"."doc_status" DEFAULT 'draft' NOT NULL,
	"published_at" timestamp with time zone,
	"draft" jsonb,
	"content_text" text,
	"search" "tsvector" GENERATED ALWAYS AS (setweight(to_tsvector('german', coalesce("cms"."pages"."title", '')), 'A') || setweight(to_tsvector('german', coalesce("cms"."pages"."lead", '') || ' ' || coalesce("cms"."pages"."meta_description", '')), 'B') || setweight(to_tsvector('german', coalesce("cms"."pages"."content_text", '')), 'C')) STORED,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pages_slug_unique" UNIQUE("slug"),
	CONSTRAINT "pages_path_unique" UNIQUE("path"),
	CONSTRAINT "pages_slug_check" CHECK ("cms"."pages"."slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);
--> statement-breakpoint
CREATE TABLE "cms"."projekte" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(200) NOT NULL,
	"title" varchar(300) NOT NULL,
	"kunde" varchar(300) NOT NULL,
	"summary" text NOT NULL,
	"content" jsonb,
	"meta_title" varchar(200),
	"meta_description" varchar(500),
	"meta_image_id" integer,
	"status" "cms"."doc_status" DEFAULT 'draft' NOT NULL,
	"published_at" timestamp with time zone,
	"draft" jsonb,
	"content_text" text,
	"search" "tsvector" GENERATED ALWAYS AS (setweight(to_tsvector('german', coalesce("cms"."projekte"."title", '') || ' ' || coalesce("cms"."projekte"."kunde", '')), 'A') || setweight(to_tsvector('german', coalesce("cms"."projekte"."summary", '') || ' ' || coalesce("cms"."projekte"."meta_description", '')), 'B') || setweight(to_tsvector('german', coalesce("cms"."projekte"."content_text", '')), 'C')) STORED,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "projekte_slug_unique" UNIQUE("slug"),
	CONSTRAINT "projekte_slug_check" CHECK ("cms"."projekte"."slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);
--> statement-breakpoint
CREATE TABLE "cms"."redirects" (
	"id" serial PRIMARY KEY NOT NULL,
	"from" varchar(500) NOT NULL,
	"type" smallint DEFAULT 301 NOT NULL,
	"to_page_id" integer,
	"to_projekt_id" integer,
	"to_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "redirects_from_unique" UNIQUE("from"),
	CONSTRAINT "redirects_type_check" CHECK ("cms"."redirects"."type" in (301, 302)),
	CONSTRAINT "redirects_one_target" CHECK (num_nonnulls("cms"."redirects"."to_page_id", "cms"."redirects"."to_projekt_id", "cms"."redirects"."to_url") = 1)
);
--> statement-breakpoint
CREATE TABLE "cms"."sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cms"."site_settings" (
	"id" integer PRIMARY KEY NOT NULL,
	"data" jsonb NOT NULL,
	"draft" jsonb,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "site_settings_singleton" CHECK ("cms"."site_settings"."id" = 1)
);
--> statement-breakpoint
CREATE TABLE "cms"."users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(320) NOT NULL,
	"name" varchar(200),
	"password_hash" text NOT NULL,
	"failed_attempts" integer DEFAULT 0 NOT NULL,
	"locked_until" timestamp with time zone,
	"must_change_password" boolean DEFAULT false NOT NULL,
	"sessions_revoked_at" timestamp with time zone,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cms"."versions" (
	"id" serial PRIMARY KEY NOT NULL,
	"collection" varchar(40) NOT NULL,
	"doc_id" integer NOT NULL,
	"snapshot" jsonb NOT NULL,
	"kind" varchar(20) NOT NULL,
	"created_by" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "versions_collection_check" CHECK ("cms"."versions"."collection" in ('pages', 'projekte', 'site_settings')),
	CONSTRAINT "versions_kind_check" CHECK ("cms"."versions"."kind" in ('published', 'manual', 'restored'))
);
--> statement-breakpoint
ALTER TABLE "cms"."form_submissions" ADD CONSTRAINT "form_submissions_form_id_forms_id_fk" FOREIGN KEY ("form_id") REFERENCES "cms"."forms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cms"."pages" ADD CONSTRAINT "pages_parent_id_pages_id_fk" FOREIGN KEY ("parent_id") REFERENCES "cms"."pages"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cms"."pages" ADD CONSTRAINT "pages_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "cms"."media"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cms"."projekte" ADD CONSTRAINT "projekte_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "cms"."media"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cms"."redirects" ADD CONSTRAINT "redirects_to_page_id_pages_id_fk" FOREIGN KEY ("to_page_id") REFERENCES "cms"."pages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cms"."redirects" ADD CONSTRAINT "redirects_to_projekt_id_projekte_id_fk" FOREIGN KEY ("to_projekt_id") REFERENCES "cms"."projekte"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cms"."sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "cms"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cms"."versions" ADD CONSTRAINT "versions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "cms"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "form_submissions_form_idx" ON "cms"."form_submissions" USING btree ("form_id","created_at");--> statement-breakpoint
CREATE INDEX "pages_parent_idx" ON "cms"."pages" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "pages_status_idx" ON "cms"."pages" USING btree ("status");--> statement-breakpoint
CREATE INDEX "pages_search_idx" ON "cms"."pages" USING gin ("search");--> statement-breakpoint
CREATE INDEX "projekte_status_idx" ON "cms"."projekte" USING btree ("status");--> statement-breakpoint
CREATE INDEX "projekte_search_idx" ON "cms"."projekte" USING gin ("search");--> statement-breakpoint
CREATE INDEX "sessions_user_idx" ON "cms"."sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sessions_expires_idx" ON "cms"."sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_lower_idx" ON "cms"."users" USING btree (lower("email"));--> statement-breakpoint
CREATE INDEX "versions_doc_idx" ON "cms"."versions" USING btree ("collection","doc_id","created_at");