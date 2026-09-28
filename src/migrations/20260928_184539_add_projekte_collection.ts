import { type MigrateUpArgs, type MigrateDownArgs, sql } from "@payloadcms/db-postgres";

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_projekte_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__projekte_v_version_status" AS ENUM('draft', 'published');
  CREATE TABLE "projekte" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"slug" varchar,
  	"kunde" varchar,
  	"summary" varchar,
  	"content" jsonb,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"meta_image_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_projekte_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_projekte_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_kunde" varchar,
  	"version_summary" varchar,
  	"version_content" jsonb,
  	"version_meta_title" varchar,
  	"version_meta_description" varchar,
  	"version_meta_image_id" integer,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__projekte_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean,
  	"autosave" boolean
  );
  
  ALTER TABLE "redirects_rels" ADD COLUMN "projekte_id" integer;
  ALTER TABLE "search_rels" ADD COLUMN "projekte_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "projekte_id" integer;
  ALTER TABLE "projekte" ADD CONSTRAINT "projekte_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_projekte_v" ADD CONSTRAINT "_projekte_v_parent_id_projekte_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."projekte"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_projekte_v" ADD CONSTRAINT "_projekte_v_version_meta_image_id_media_id_fk" FOREIGN KEY ("version_meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE UNIQUE INDEX "projekte_slug_idx" ON "projekte" USING btree ("slug");
  CREATE INDEX "projekte_meta_meta_image_idx" ON "projekte" USING btree ("meta_image_id");
  CREATE INDEX "projekte_updated_at_idx" ON "projekte" USING btree ("updated_at");
  CREATE INDEX "projekte_created_at_idx" ON "projekte" USING btree ("created_at");
  CREATE INDEX "projekte__status_idx" ON "projekte" USING btree ("_status");
  CREATE INDEX "_projekte_v_parent_idx" ON "_projekte_v" USING btree ("parent_id");
  CREATE INDEX "_projekte_v_version_version_slug_idx" ON "_projekte_v" USING btree ("version_slug");
  CREATE INDEX "_projekte_v_version_meta_version_meta_image_idx" ON "_projekte_v" USING btree ("version_meta_image_id");
  CREATE INDEX "_projekte_v_version_version_updated_at_idx" ON "_projekte_v" USING btree ("version_updated_at");
  CREATE INDEX "_projekte_v_version_version_created_at_idx" ON "_projekte_v" USING btree ("version_created_at");
  CREATE INDEX "_projekte_v_version_version__status_idx" ON "_projekte_v" USING btree ("version__status");
  CREATE INDEX "_projekte_v_created_at_idx" ON "_projekte_v" USING btree ("created_at");
  CREATE INDEX "_projekte_v_updated_at_idx" ON "_projekte_v" USING btree ("updated_at");
  CREATE INDEX "_projekte_v_latest_idx" ON "_projekte_v" USING btree ("latest");
  CREATE INDEX "_projekte_v_autosave_idx" ON "_projekte_v" USING btree ("autosave");
  ALTER TABLE "redirects_rels" ADD CONSTRAINT "redirects_rels_projekte_fk" FOREIGN KEY ("projekte_id") REFERENCES "public"."projekte"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "search_rels" ADD CONSTRAINT "search_rels_projekte_fk" FOREIGN KEY ("projekte_id") REFERENCES "public"."projekte"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_projekte_fk" FOREIGN KEY ("projekte_id") REFERENCES "public"."projekte"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "redirects_rels_projekte_id_idx" ON "redirects_rels" USING btree ("projekte_id");
  CREATE INDEX "search_rels_projekte_id_idx" ON "search_rels" USING btree ("projekte_id");
  CREATE INDEX "payload_locked_documents_rels_projekte_id_idx" ON "payload_locked_documents_rels" USING btree ("projekte_id");`);
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "projekte" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_projekte_v" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "projekte" CASCADE;
  DROP TABLE "_projekte_v" CASCADE;
  ALTER TABLE "redirects_rels" DROP CONSTRAINT "redirects_rels_projekte_fk";
  
  ALTER TABLE "search_rels" DROP CONSTRAINT "search_rels_projekte_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_projekte_fk";
  
  DROP INDEX "redirects_rels_projekte_id_idx";
  DROP INDEX "search_rels_projekte_id_idx";
  DROP INDEX "payload_locked_documents_rels_projekte_id_idx";
  ALTER TABLE "redirects_rels" DROP COLUMN "projekte_id";
  ALTER TABLE "search_rels" DROP COLUMN "projekte_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "projekte_id";
  DROP TYPE "public"."enum_projekte_status";
  DROP TYPE "public"."enum__projekte_v_version_status";`);
}
