CREATE SCHEMA IF NOT EXISTS "buchung";
--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS btree_gist WITH SCHEMA "buchung";
--> statement-breakpoint
CREATE TYPE "buchung"."belegung_art" AS ENUM('einsatz', 'sperre');--> statement-breakpoint
CREATE TYPE "buchung"."buchung_quelle" AS ENUM('web', 'telefon', 'instagram', 'admin');--> statement-breakpoint
CREATE TYPE "buchung"."buchung_status" AS ENUM('anfrage', 'reserviert', 'bestaetigt', 'abgelehnt', 'verfallen', 'storniert', 'abgeschlossen');--> statement-breakpoint
CREATE TYPE "buchung"."figur_kategorie" AS ENUM('superhelden', 'prinzessinnen', 'tiere', 'clowns', 'saisonal');--> statement-breakpoint
CREATE TYPE "buchung"."sprache" AS ENUM('de', 'uk', 'ru', 'en');--> statement-breakpoint
CREATE TYPE "buchung"."zahlung_adapter" AS ENUM('mollie', 'rechnung', 'test');--> statement-breakpoint
CREATE TYPE "buchung"."zahlung_art" AS ENUM('anzahlung', 'rest', 'erstattung');--> statement-breakpoint
CREATE TYPE "buchung"."zahlung_status" AS ENUM('offen', 'bezahlt', 'fehlgeschlagen', 'abgebrochen', 'erstattet');--> statement-breakpoint
CREATE TABLE "buchung"."belegungen" (
	"id" serial PRIMARY KEY NOT NULL,
	"darsteller_id" integer NOT NULL,
	"art" "buchung"."belegung_art" NOT NULL,
	"buchung_id" integer,
	"figur_id" integer,
	"von" timestamp with time zone NOT NULL,
	"bis" timestamp with time zone NOT NULL,
	"aktiv" boolean DEFAULT true NOT NULL,
	"grund" varchar(300),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "belegungen_zeit" CHECK ("buchung"."belegungen"."bis" > "buchung"."belegungen"."von"),
	CONSTRAINT "belegungen_art" CHECK (("buchung"."belegungen"."art" = 'einsatz') = ("buchung"."belegungen"."buchung_id" IS NOT NULL))
);
--> statement-breakpoint
CREATE TABLE "buchung"."bewertungen" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"stadt_id" integer,
	"text" text NOT NULL,
	"sterne" smallint DEFAULT 5 NOT NULL,
	"datum" date,
	"veroeffentlicht" boolean DEFAULT false NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bewertungen_sterne" CHECK ("buchung"."bewertungen"."sterne" BETWEEN 1 AND 5)
);
--> statement-breakpoint
CREATE TABLE "buchung"."buchung_extras" (
	"buchung_id" integer NOT NULL,
	"extra_id" integer NOT NULL,
	"preis" numeric(12, 2),
	"dauer_delta_min" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "buchung_extras_buchung_id_extra_id_pk" PRIMARY KEY("buchung_id","extra_id")
);
--> statement-breakpoint
CREATE TABLE "buchung"."buchungen" (
	"id" serial PRIMARY KEY NOT NULL,
	"nummer" varchar(20) NOT NULL,
	"status" "buchung"."buchung_status" DEFAULT 'anfrage' NOT NULL,
	"quelle" "buchung"."buchung_quelle" DEFAULT 'web' NOT NULL,
	"paket_id" integer,
	"figur_id" integer,
	"zweite_figur_id" integer,
	"beginn" timestamp with time zone NOT NULL,
	"fenster_von" timestamp with time zone,
	"fenster_bis" timestamp with time zone,
	"stadt_id" integer,
	"zone_code" varchar(2),
	"ort_freitext" varchar(200),
	"strasse" varchar(300),
	"plz" varchar(10),
	"ort" varchar(200),
	"kontakt_name" varchar(200) NOT NULL,
	"kontakt_email" varchar(320) NOT NULL,
	"kontakt_telefon" varchar(40),
	"kind_name" varchar(100),
	"kind_alter" smallint,
	"kinder_anzahl" smallint,
	"sprache" "buchung"."sprache",
	"notiz_kunde" text,
	"notiz_intern" text,
	"kunde_id" integer,
	"positionen" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"summe" numeric(12, 2),
	"anzahlung" numeric(12, 2),
	"zahlungsart" "buchung"."zahlung_adapter",
	"halten_bis" timestamp with time zone,
	"zugriff_hash" varchar(64),
	"storniert_am" timestamp with time zone,
	"storno_gebuehr" numeric(12, 2),
	"storno_grund" varchar(300),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "buchungen_nummer_unique" UNIQUE("nummer"),
	CONSTRAINT "buchungen_zugriffHash_unique" UNIQUE("zugriff_hash"),
	CONSTRAINT "buchungen_fenster" CHECK (("buchung"."buchungen"."fenster_von" IS NULL AND "buchung"."buchungen"."fenster_bis" IS NULL) OR "buchung"."buchungen"."fenster_bis" > "buchung"."buchungen"."fenster_von")
);
--> statement-breakpoint
CREATE TABLE "buchung"."darsteller" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(200) NOT NULL,
	"email" varchar(320),
	"telefon" varchar(40),
	"aktiv" boolean DEFAULT true NOT NULL,
	"prioritaet" integer DEFAULT 100 NOT NULL,
	"notiz" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "buchung"."darsteller_figuren" (
	"darsteller_id" integer NOT NULL,
	"figur_id" integer NOT NULL,
	CONSTRAINT "darsteller_figuren_darsteller_id_figur_id_pk" PRIMARY KEY("darsteller_id","figur_id")
);
--> statement-breakpoint
CREATE TABLE "buchung"."einstellungen" (
	"id" integer PRIMARY KEY NOT NULL,
	"vorbereitung_min" integer DEFAULT 20 NOT NULL,
	"abbau_min" integer DEFAULT 15 NOT NULL,
	"raster_min" integer DEFAULT 30 NOT NULL,
	"erster_start_min" integer DEFAULT 600 NOT NULL,
	"letzter_start_min" integer DEFAULT 1080 NOT NULL,
	"anzahlung_prozent" smallint DEFAULT 25 NOT NULL,
	"halten_min" integer DEFAULT 30 NOT NULL,
	"halten_lastschrift_min" integer DEFAULT 4320 NOT NULL,
	"mindest_vorlauf_std" integer DEFAULT 48 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "einstellungen_einzeln" CHECK ("buchung"."einstellungen"."id" = 1),
	CONSTRAINT "einstellungen_anzahlung" CHECK ("buchung"."einstellungen"."anzahlung_prozent" BETWEEN 0 AND 100),
	CONSTRAINT "einstellungen_starts" CHECK ("buchung"."einstellungen"."erster_start_min" >= 0 AND "buchung"."einstellungen"."letzter_start_min" >= "buchung"."einstellungen"."erster_start_min" AND "buchung"."einstellungen"."letzter_start_min" < 1440)
);
--> statement-breakpoint
CREATE TABLE "buchung"."extras" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(120) NOT NULL,
	"name" varchar(200) NOT NULL,
	"beschreibung" text,
	"preis" numeric(12, 2),
	"dauer_delta_min" integer DEFAULT 0 NOT NULL,
	"vorlauf_tage" integer DEFAULT 0 NOT NULL,
	"zusatz_figur" boolean DEFAULT false NOT NULL,
	"nur_anfrage" boolean DEFAULT false NOT NULL,
	"aktiv" boolean DEFAULT true NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "extras_slug_unique" UNIQUE("slug"),
	CONSTRAINT "extras_dauer" CHECK ("buchung"."extras"."dauer_delta_min" >= 0),
	CONSTRAINT "extras_vorlauf" CHECK ("buchung"."extras"."vorlauf_tage" >= 0)
);
--> statement-breakpoint
CREATE TABLE "buchung"."figur_fotos" (
	"figur_id" integer NOT NULL,
	"media_id" integer NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "figur_fotos_figur_id_media_id_pk" PRIMARY KEY("figur_id","media_id")
);
--> statement-breakpoint
CREATE TABLE "buchung"."figuren" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(120) NOT NULL,
	"name" varchar(200) NOT NULL,
	"kategorie" "buchung"."figur_kategorie" NOT NULL,
	"alter_von" smallint DEFAULT 3 NOT NULL,
	"alter_bis" smallint DEFAULT 10 NOT NULL,
	"sprachen" "buchung"."sprache"[] DEFAULT '{de}' NOT NULL,
	"kurz" varchar(300),
	"beschreibung" text,
	"programm" text[] DEFAULT '{}' NOT NULL,
	"aktiv" boolean DEFAULT true NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"meta_title" varchar(200),
	"meta_description" varchar(300),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "figuren_slug_unique" UNIQUE("slug"),
	CONSTRAINT "figuren_slug_format" CHECK ("buchung"."figuren"."slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
	CONSTRAINT "figuren_alter" CHECK ("buchung"."figuren"."alter_von" >= 0 AND "buchung"."figuren"."alter_bis" >= "buchung"."figuren"."alter_von")
);
--> statement-breakpoint
CREATE TABLE "buchung"."pakete" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(120) NOT NULL,
	"name" varchar(200) NOT NULL,
	"beschreibung" text,
	"leistungen" text[] DEFAULT '{}' NOT NULL,
	"dauer_min" integer,
	"preis" numeric(12, 2),
	"figuren_anzahl" smallint DEFAULT 1 NOT NULL,
	"nur_anfrage" boolean DEFAULT false NOT NULL,
	"aktiv" boolean DEFAULT true NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pakete_slug_unique" UNIQUE("slug"),
	CONSTRAINT "pakete_figuren_anzahl" CHECK ("buchung"."pakete"."figuren_anzahl" BETWEEN 1 AND 2),
	CONSTRAINT "pakete_buchbar" CHECK ("buchung"."pakete"."nur_anfrage" OR ("buchung"."pakete"."dauer_min" > 0 AND "buchung"."pakete"."preis" IS NOT NULL))
);
--> statement-breakpoint
CREATE TABLE "buchung"."staedte" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(120) NOT NULL,
	"slug" varchar(120) NOT NULL,
	"zone_code" varchar(2) NOT NULL,
	"seite" boolean DEFAULT false NOT NULL,
	"intro" text,
	"bezirke" text,
	"orte" text,
	"bedingungen" text,
	"meta_title" varchar(200),
	"meta_description" varchar(300),
	"sort" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "staedte_slug_unique" UNIQUE("slug"),
	CONSTRAINT "staedte_slug_format" CHECK ("buchung"."staedte"."slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);
--> statement-breakpoint
CREATE TABLE "buchung"."webhook_ereignisse" (
	"adapter" "buchung"."zahlung_adapter" NOT NULL,
	"ereignis_id" varchar(200) NOT NULL,
	"empfangen_am" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "webhook_ereignisse_adapter_ereignis_id_pk" PRIMARY KEY("adapter","ereignis_id")
);
--> statement-breakpoint
CREATE TABLE "buchung"."zahlungen" (
	"id" serial PRIMARY KEY NOT NULL,
	"buchung_id" integer NOT NULL,
	"adapter" "buchung"."zahlung_adapter" NOT NULL,
	"art" "buchung"."zahlung_art" NOT NULL,
	"betrag" numeric(12, 2) NOT NULL,
	"status" "buchung"."zahlung_status" DEFAULT 'offen' NOT NULL,
	"extern_id" varchar(200),
	"payload" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "buchung"."zonen" (
	"code" varchar(2) PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"aufschlag" numeric(12, 2) DEFAULT '0' NOT NULL,
	"fahrt_minuten" integer NOT NULL,
	"nur_anfrage" boolean DEFAULT false NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "buchung"."belegungen" ADD CONSTRAINT "belegungen_darsteller_id_darsteller_id_fk" FOREIGN KEY ("darsteller_id") REFERENCES "buchung"."darsteller"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "buchung"."belegungen" ADD CONSTRAINT "belegungen_buchung_id_buchungen_id_fk" FOREIGN KEY ("buchung_id") REFERENCES "buchung"."buchungen"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "buchung"."belegungen" ADD CONSTRAINT "belegungen_figur_id_figuren_id_fk" FOREIGN KEY ("figur_id") REFERENCES "buchung"."figuren"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "buchung"."bewertungen" ADD CONSTRAINT "bewertungen_stadt_id_staedte_id_fk" FOREIGN KEY ("stadt_id") REFERENCES "buchung"."staedte"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "buchung"."buchung_extras" ADD CONSTRAINT "buchung_extras_buchung_id_buchungen_id_fk" FOREIGN KEY ("buchung_id") REFERENCES "buchung"."buchungen"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "buchung"."buchung_extras" ADD CONSTRAINT "buchung_extras_extra_id_extras_id_fk" FOREIGN KEY ("extra_id") REFERENCES "buchung"."extras"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "buchung"."buchungen" ADD CONSTRAINT "buchungen_paket_id_pakete_id_fk" FOREIGN KEY ("paket_id") REFERENCES "buchung"."pakete"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "buchung"."buchungen" ADD CONSTRAINT "buchungen_figur_id_figuren_id_fk" FOREIGN KEY ("figur_id") REFERENCES "buchung"."figuren"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "buchung"."buchungen" ADD CONSTRAINT "buchungen_zweite_figur_id_figuren_id_fk" FOREIGN KEY ("zweite_figur_id") REFERENCES "buchung"."figuren"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "buchung"."buchungen" ADD CONSTRAINT "buchungen_stadt_id_staedte_id_fk" FOREIGN KEY ("stadt_id") REFERENCES "buchung"."staedte"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "buchung"."buchungen" ADD CONSTRAINT "buchungen_zone_code_zonen_code_fk" FOREIGN KEY ("zone_code") REFERENCES "buchung"."zonen"("code") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "buchung"."buchungen" ADD CONSTRAINT "buchungen_kunde_id_kunden_id_fk" FOREIGN KEY ("kunde_id") REFERENCES "buero"."kunden"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "buchung"."darsteller_figuren" ADD CONSTRAINT "darsteller_figuren_darsteller_id_darsteller_id_fk" FOREIGN KEY ("darsteller_id") REFERENCES "buchung"."darsteller"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "buchung"."darsteller_figuren" ADD CONSTRAINT "darsteller_figuren_figur_id_figuren_id_fk" FOREIGN KEY ("figur_id") REFERENCES "buchung"."figuren"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "buchung"."figur_fotos" ADD CONSTRAINT "figur_fotos_figur_id_figuren_id_fk" FOREIGN KEY ("figur_id") REFERENCES "buchung"."figuren"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "buchung"."figur_fotos" ADD CONSTRAINT "figur_fotos_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "cms"."media"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "buchung"."staedte" ADD CONSTRAINT "staedte_zone_code_zonen_code_fk" FOREIGN KEY ("zone_code") REFERENCES "buchung"."zonen"("code") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "buchung"."zahlungen" ADD CONSTRAINT "zahlungen_buchung_id_buchungen_id_fk" FOREIGN KEY ("buchung_id") REFERENCES "buchung"."buchungen"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "belegungen_darsteller_idx" ON "buchung"."belegungen" USING btree ("darsteller_id","von") WHERE "buchung"."belegungen"."aktiv";--> statement-breakpoint
CREATE INDEX "belegungen_buchung_idx" ON "buchung"."belegungen" USING btree ("buchung_id");--> statement-breakpoint
CREATE INDEX "buchungen_beginn_idx" ON "buchung"."buchungen" USING btree ("beginn");--> statement-breakpoint
CREATE INDEX "buchungen_halten_idx" ON "buchung"."buchungen" USING btree ("halten_bis") WHERE "buchung"."buchungen"."status" = 'reserviert';--> statement-breakpoint
CREATE INDEX "darsteller_figuren_figur_idx" ON "buchung"."darsteller_figuren" USING btree ("figur_id");--> statement-breakpoint
CREATE INDEX "staedte_zone_idx" ON "buchung"."staedte" USING btree ("zone_code");--> statement-breakpoint
CREATE UNIQUE INDEX "zahlungen_extern_idx" ON "buchung"."zahlungen" USING btree ("adapter","extern_id");--> statement-breakpoint
CREATE INDEX "zahlungen_buchung_idx" ON "buchung"."zahlungen" USING btree ("buchung_id");--> statement-breakpoint
-- Hand-written: no performer is ever taken twice at once. Visits (travel and setup included) and
-- time off share the table, half-open ranges let one visit end where the next begins.
ALTER TABLE "buchung"."belegungen" ADD CONSTRAINT "belegungen_keine_ueberschneidung" EXCLUDE USING gist ("darsteller_id" WITH =, tstzrange("von", "bis", '[)') WITH &&) WHERE ("aktiv");--> statement-breakpoint
INSERT INTO "buchung"."einstellungen" ("id") VALUES (1) ON CONFLICT DO NOTHING;
