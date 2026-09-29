import { type MigrateUpArgs, type MigrateDownArgs, sql } from "@payloadcms/db-postgres";

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "site_settings_hero_words" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"word" varchar NOT NULL
  );
  
  ALTER TABLE "pages" ADD COLUMN "lead" varchar;
  ALTER TABLE "_pages_v" ADD COLUMN "version_lead" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "cta_title" varchar DEFAULT 'Erzählen Sie uns von Ihrem Vorhaben.' NOT NULL;
  ALTER TABLE "site_settings" ADD COLUMN "cta_text" varchar DEFAULT 'Wir melden uns mit einer ersten Einschätzung und einem Vorschlag für das weitere Vorgehen.';
  ALTER TABLE "site_settings" ADD COLUMN "cta_label" varchar DEFAULT 'Projekt anfragen' NOT NULL;
  ALTER TABLE "site_settings" ADD COLUMN "hero_headline" varchar DEFAULT 'Wir entwickeln' NOT NULL;
  ALTER TABLE "site_settings" ADD COLUMN "hero_headline_end" varchar DEFAULT 'für den Mittelstand.' NOT NULL;
  ALTER TABLE "site_settings" ADD COLUMN "hero_lead" varchar DEFAULT 'Individuelle Software aus dem Schwarzwald.';
  ALTER TABLE "site_settings" ADD COLUMN "services_title" varchar DEFAULT 'Was wir entwickeln' NOT NULL;
  ALTER TABLE "site_settings" ADD COLUMN "services_intro" varchar DEFAULT 'Von der einzelnen Schnittstelle bis zur kompletten Plattform – geplant für Ihre Abläufe, nicht für einen Standardfall.';
  ALTER TABLE "site_settings" ADD COLUMN "steps_title" varchar DEFAULT 'So arbeiten wir' NOT NULL;
  ALTER TABLE "site_settings" ADD COLUMN "principles_title" varchar DEFAULT 'Unsere Grundsätze' NOT NULL;
  ALTER TABLE "site_settings" ADD COLUMN "projekte_lead" varchar DEFAULT 'Ausgewählte Projekte, die wir für unsere Kundinnen und Kunden gebaut haben.';
  ALTER TABLE "site_settings" ADD COLUMN "projekte_empty" varchar DEFAULT 'Hier stellen wir bald unsere ersten Projekte vor.';
  ALTER TABLE "site_settings" ADD COLUMN "kontakt_lead" varchar DEFAULT 'Erzählen Sie uns von Ihrem Vorhaben. Wir melden uns mit einer ersten Einschätzung und einem Vorschlag für das weitere Vorgehen.';
  ALTER TABLE "site_settings" ADD COLUMN "kontakt_next_title" varchar DEFAULT 'Was danach passiert';
  ALTER TABLE "site_settings" ADD COLUMN "kontakt_next_text" jsonb;
  ALTER TABLE "site_settings_hero_words" ADD CONSTRAINT "site_settings_hero_words_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "site_settings_hero_words_order_idx" ON "site_settings_hero_words" USING btree ("_order");
  CREATE INDEX "site_settings_hero_words_parent_id_idx" ON "site_settings_hero_words" USING btree ("_parent_id");`);

  // The texts that had been written in code: the scalar ones arrive as column defaults above; the
  // hero's changing words and the contact page's next steps (with its link) are filled here.
  const words = ["Web-Anwendungen", "mobile Apps", "Schnittstellen", "Plattformen"];
  for (const [order, word] of words.entries()) {
    await db.execute(sql`
      INSERT INTO "site_settings_hero_words" ("_order", "_parent_id", "id", "word")
      SELECT ${order + 1}, "id", substr(md5(random()::text), 1, 24), ${word} FROM "site_settings";`);
  }
  await db.execute(sql`
    UPDATE "site_settings" SET "kontakt_next_text" = ${JSON.stringify(kontaktNextText)}::jsonb;`);
}

const common = { format: "", indent: 0, version: 1, direction: "ltr" };
const text = (value: string) => ({
  type: "text",
  text: value,
  format: 0,
  detail: 0,
  mode: "normal",
  style: "",
  version: 1,
});
const kontaktNextText = {
  root: {
    type: "root",
    ...common,
    children: [
      {
        type: "paragraph",
        textFormat: 0,
        ...common,
        children: [
          text(
            "Wir lesen Ihre Nachricht und melden uns mit ersten Fragen. Danach klären wir in einem Workshop Ziele, Nutzer und Randbedingungen – wie es weitergeht, ",
          ),
          {
            type: "link",
            fields: { linkType: "custom", url: "/ueber-uns/arbeitsweise", newTab: false },
            ...common,
            version: 3,
            children: [text("zeigt unsere Arbeitsweise")],
          },
          text("."),
        ],
      },
    ],
  },
};

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "site_settings_hero_words" CASCADE;
  ALTER TABLE "pages" DROP COLUMN "lead";
  ALTER TABLE "_pages_v" DROP COLUMN "version_lead";
  ALTER TABLE "site_settings" DROP COLUMN "cta_title";
  ALTER TABLE "site_settings" DROP COLUMN "cta_text";
  ALTER TABLE "site_settings" DROP COLUMN "cta_label";
  ALTER TABLE "site_settings" DROP COLUMN "hero_headline";
  ALTER TABLE "site_settings" DROP COLUMN "hero_headline_end";
  ALTER TABLE "site_settings" DROP COLUMN "hero_lead";
  ALTER TABLE "site_settings" DROP COLUMN "services_title";
  ALTER TABLE "site_settings" DROP COLUMN "services_intro";
  ALTER TABLE "site_settings" DROP COLUMN "steps_title";
  ALTER TABLE "site_settings" DROP COLUMN "principles_title";
  ALTER TABLE "site_settings" DROP COLUMN "projekte_lead";
  ALTER TABLE "site_settings" DROP COLUMN "projekte_empty";
  ALTER TABLE "site_settings" DROP COLUMN "kontakt_lead";
  ALTER TABLE "site_settings" DROP COLUMN "kontakt_next_title";
  ALTER TABLE "site_settings" DROP COLUMN "kontakt_next_text";`);
}
