import { type MigrateUpArgs, type MigrateDownArgs, sql } from "@payloadcms/db-postgres";

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_site_settings_services_glyph" AS ENUM('web', 'mobile', 'integration', 'modernisation', 'operations');
  CREATE TABLE "site_settings_services_examples" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar NOT NULL
  );
  
  CREATE TABLE "site_settings_services" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"short" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"glyph" "enum_site_settings_services_glyph" NOT NULL,
  	"text" varchar NOT NULL
  );
  
  CREATE TABLE "site_settings_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"text" varchar NOT NULL
  );
  
  CREATE TABLE "site_settings_principles" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"text" varchar NOT NULL
  );
  
  CREATE TABLE "site_settings_faq" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"question" varchar NOT NULL,
  	"answer" varchar NOT NULL
  );
  
  ALTER TABLE "site_settings_services_examples" ADD CONSTRAINT "site_settings_services_examples_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings_services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_services" ADD CONSTRAINT "site_settings_services_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_steps" ADD CONSTRAINT "site_settings_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_principles" ADD CONSTRAINT "site_settings_principles_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_faq" ADD CONSTRAINT "site_settings_faq_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "site_settings_services_examples_order_idx" ON "site_settings_services_examples" USING btree ("_order");
  CREATE INDEX "site_settings_services_examples_parent_id_idx" ON "site_settings_services_examples" USING btree ("_parent_id");
  CREATE INDEX "site_settings_services_order_idx" ON "site_settings_services" USING btree ("_order");
  CREATE INDEX "site_settings_services_parent_id_idx" ON "site_settings_services" USING btree ("_parent_id");
  CREATE INDEX "site_settings_steps_order_idx" ON "site_settings_steps" USING btree ("_order");
  CREATE INDEX "site_settings_steps_parent_id_idx" ON "site_settings_steps" USING btree ("_parent_id");
  CREATE INDEX "site_settings_principles_order_idx" ON "site_settings_principles" USING btree ("_order");
  CREATE INDEX "site_settings_principles_parent_id_idx" ON "site_settings_principles" USING btree ("_parent_id");
  CREATE INDEX "site_settings_faq_order_idx" ON "site_settings_faq" USING btree ("_order");
  CREATE INDEX "site_settings_faq_parent_id_idx" ON "site_settings_faq" USING btree ("_parent_id");`);
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "site_settings_services_examples" CASCADE;
  DROP TABLE "site_settings_services" CASCADE;
  DROP TABLE "site_settings_steps" CASCADE;
  DROP TABLE "site_settings_principles" CASCADE;
  DROP TABLE "site_settings_faq" CASCADE;
  DROP TYPE "public"."enum_site_settings_services_glyph";`);
}
