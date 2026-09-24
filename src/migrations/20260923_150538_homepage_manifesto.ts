import { type MigrateUpArgs, type MigrateDownArgs, sql } from "@payloadcms/db-postgres";

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "site_settings_manifesto_phrases" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar NOT NULL
  );
  
  ALTER TABLE "site_settings" ADD COLUMN "manifesto_caption" varchar;
  ALTER TABLE "site_settings_manifesto_phrases" ADD CONSTRAINT "site_settings_manifesto_phrases_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "site_settings_manifesto_phrases_order_idx" ON "site_settings_manifesto_phrases" USING btree ("_order");
  CREATE INDEX "site_settings_manifesto_phrases_parent_id_idx" ON "site_settings_manifesto_phrases" USING btree ("_parent_id");`);
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "site_settings_manifesto_phrases" CASCADE;
  ALTER TABLE "site_settings" DROP COLUMN "manifesto_caption";`);
}
