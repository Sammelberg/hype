import { type MigrateUpArgs, type MigrateDownArgs, sql } from "@payloadcms/db-postgres";

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "site_settings_clients" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"logo_id" integer NOT NULL
  );
  
  ALTER TABLE "site_settings_clients" ADD CONSTRAINT "site_settings_clients_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_settings_clients" ADD CONSTRAINT "site_settings_clients_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "site_settings_clients_order_idx" ON "site_settings_clients" USING btree ("_order");
  CREATE INDEX "site_settings_clients_parent_id_idx" ON "site_settings_clients" USING btree ("_parent_id");
  CREATE INDEX "site_settings_clients_logo_idx" ON "site_settings_clients" USING btree ("logo_id");`);
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "site_settings_clients" CASCADE;`);
}
