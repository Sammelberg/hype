import { type MigrateUpArgs, type MigrateDownArgs, sql } from "@payloadcms/db-postgres";

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "site_settings_hero_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"href" varchar NOT NULL
  );
  
  ALTER TABLE "site_settings" ADD COLUMN "hero_eyebrow" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "hero_headline" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "hero_intro" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "hero_keywords" varchar;
  ALTER TABLE "site_settings_hero_links" ADD CONSTRAINT "site_settings_hero_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "site_settings_hero_links_order_idx" ON "site_settings_hero_links" USING btree ("_order");
  CREATE INDEX "site_settings_hero_links_parent_id_idx" ON "site_settings_hero_links" USING btree ("_parent_id");`);
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "site_settings_hero_links" CASCADE;
  ALTER TABLE "site_settings" DROP COLUMN "hero_eyebrow";
  ALTER TABLE "site_settings" DROP COLUMN "hero_headline";
  ALTER TABLE "site_settings" DROP COLUMN "hero_intro";
  ALTER TABLE "site_settings" DROP COLUMN "hero_keywords";`);
}
