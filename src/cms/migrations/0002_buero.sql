CREATE SCHEMA IF NOT EXISTS "buero";
--> statement-breakpoint
CREATE TYPE "buero"."auftrag_status" AS ENUM('angebot', 'beauftragt', 'in_arbeit', 'abgenommen', 'abgerechnet', 'storniert');--> statement-breakpoint
CREATE TYPE "buero"."intervall" AS ENUM('einmalig', 'monatlich', 'quartal', 'jaehrlich');--> statement-breakpoint
CREATE TYPE "buero"."kunden_art" AS ENUM('firma', 'privat');--> statement-breakpoint
CREATE TYPE "buero"."rechnung_status" AS ENUM('entwurf', 'gestellt', 'bezahlt', 'storniert');--> statement-breakpoint
CREATE TYPE "buero"."rechnung_typ" AS ENUM('rechnung', 'storno');--> statement-breakpoint
CREATE TYPE "buero"."vertrag_art" AS ENUM('werkvertrag', 'dienstvertrag', 'wartung', 'lizenz', 'avv', 'nda', 'sonstiges');--> statement-breakpoint
CREATE TYPE "buero"."vertrag_status" AS ENUM('entwurf', 'aktiv', 'gekuendigt', 'beendet');--> statement-breakpoint
CREATE TABLE "buero"."auftraege" (
	"id" serial PRIMARY KEY NOT NULL,
	"nummer" varchar(20) NOT NULL,
	"kunde_id" integer NOT NULL,
	"titel" varchar(300) NOT NULL,
	"beschreibung" text,
	"status" "buero"."auftrag_status" DEFAULT 'angebot' NOT NULL,
	"betrag_netto" numeric(12, 2),
	"leistung_von" date,
	"leistung_bis" date,
	"beauftragt_am" date,
	"abgenommen_am" date,
	"notizen" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "auftraege_nummer_unique" UNIQUE("nummer")
);
--> statement-breakpoint
CREATE TABLE "buero"."firma" (
	"id" integer PRIMARY KEY NOT NULL,
	"data" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "firma_einzeln" CHECK ("buero"."firma"."id" = 1)
);
--> statement-breakpoint
CREATE TABLE "buero"."kunden" (
	"id" serial PRIMARY KEY NOT NULL,
	"nummer" varchar(20) NOT NULL,
	"art" "buero"."kunden_art" DEFAULT 'firma' NOT NULL,
	"firma" varchar(300),
	"name" varchar(300),
	"email" varchar(320),
	"telefon" varchar(40),
	"strasse" varchar(300),
	"plz" varchar(10),
	"ort" varchar(300),
	"land" varchar(2) DEFAULT 'DE' NOT NULL,
	"ust_id" varchar(20),
	"leitweg_id" varchar(46),
	"zahlungsziel_tage" integer,
	"ansprechpartner" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"notizen" text,
	"archiviert_am" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "kunden_nummer_unique" UNIQUE("nummer")
);
--> statement-breakpoint
CREATE TABLE "buero"."nummernkreise" (
	"praefix" varchar(8) NOT NULL,
	"jahr" integer NOT NULL,
	"letzte" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "nummernkreise_praefix_jahr_pk" PRIMARY KEY("praefix","jahr")
);
--> statement-breakpoint
CREATE TABLE "buero"."rechnungen" (
	"id" serial PRIMARY KEY NOT NULL,
	"nummer" varchar(20),
	"typ" "buero"."rechnung_typ" DEFAULT 'rechnung' NOT NULL,
	"status" "buero"."rechnung_status" DEFAULT 'entwurf' NOT NULL,
	"kunde_id" integer NOT NULL,
	"auftrag_id" integer,
	"vertrag_id" integer,
	"korrigiert_id" integer,
	"leistung_von" date,
	"leistung_bis" date,
	"zahlungsziel_tage" integer DEFAULT 14 NOT NULL,
	"einleitung" text,
	"schlusstext" text,
	"positionen" jsonb NOT NULL,
	"empfaenger" jsonb,
	"verkaeufer" jsonb,
	"kleinunternehmer" boolean,
	"ausgestellt_am" date,
	"faellig_am" date,
	"summe_netto" numeric(12, 2),
	"summe_steuer" numeric(12, 2),
	"summe_brutto" numeric(12, 2),
	"bezahlt_am" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "rechnungen_nummer_unique" UNIQUE("nummer"),
	CONSTRAINT "rechnungen_gestellt_vollstaendig" CHECK ("buero"."rechnungen"."status" = 'entwurf' or ("buero"."rechnungen"."nummer" is not null and "buero"."rechnungen"."ausgestellt_am" is not null and "buero"."rechnungen"."faellig_am" is not null and "buero"."rechnungen"."empfaenger" is not null and "buero"."rechnungen"."verkaeufer" is not null and "buero"."rechnungen"."kleinunternehmer" is not null and "buero"."rechnungen"."summe_brutto" is not null))
);
--> statement-breakpoint
CREATE TABLE "buero"."vertraege" (
	"id" serial PRIMARY KEY NOT NULL,
	"nummer" varchar(20) NOT NULL,
	"kunde_id" integer NOT NULL,
	"auftrag_id" integer,
	"art" "buero"."vertrag_art" NOT NULL,
	"titel" varchar(300) NOT NULL,
	"status" "buero"."vertrag_status" DEFAULT 'entwurf' NOT NULL,
	"beginn" date NOT NULL,
	"laufzeit_monate" integer,
	"verlaengerung_monate" integer,
	"kuendigungsfrist_monate" integer DEFAULT 0 NOT NULL,
	"verguetung_netto" numeric(12, 2),
	"verguetung_intervall" "buero"."intervall",
	"unterzeichnet_am" date,
	"gekuendigt_am" date,
	"endet_am" date,
	"inhalt" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "vertraege_nummer_unique" UNIQUE("nummer")
);
--> statement-breakpoint
ALTER TABLE "buero"."auftraege" ADD CONSTRAINT "auftraege_kunde_id_kunden_id_fk" FOREIGN KEY ("kunde_id") REFERENCES "buero"."kunden"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "buero"."rechnungen" ADD CONSTRAINT "rechnungen_kunde_id_kunden_id_fk" FOREIGN KEY ("kunde_id") REFERENCES "buero"."kunden"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "buero"."rechnungen" ADD CONSTRAINT "rechnungen_auftrag_id_auftraege_id_fk" FOREIGN KEY ("auftrag_id") REFERENCES "buero"."auftraege"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "buero"."rechnungen" ADD CONSTRAINT "rechnungen_vertrag_id_vertraege_id_fk" FOREIGN KEY ("vertrag_id") REFERENCES "buero"."vertraege"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "buero"."rechnungen" ADD CONSTRAINT "rechnungen_korrigiert_id_rechnungen_id_fk" FOREIGN KEY ("korrigiert_id") REFERENCES "buero"."rechnungen"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "buero"."vertraege" ADD CONSTRAINT "vertraege_kunde_id_kunden_id_fk" FOREIGN KEY ("kunde_id") REFERENCES "buero"."kunden"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "buero"."vertraege" ADD CONSTRAINT "vertraege_auftrag_id_auftraege_id_fk" FOREIGN KEY ("auftrag_id") REFERENCES "buero"."auftraege"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "auftraege_kunde_idx" ON "buero"."auftraege" USING btree ("kunde_id");--> statement-breakpoint
CREATE INDEX "auftraege_status_idx" ON "buero"."auftraege" USING btree ("status");--> statement-breakpoint
CREATE INDEX "kunden_archiviert_idx" ON "buero"."kunden" USING btree ("archiviert_am");--> statement-breakpoint
CREATE INDEX "rechnungen_kunde_idx" ON "buero"."rechnungen" USING btree ("kunde_id");--> statement-breakpoint
CREATE INDEX "rechnungen_status_idx" ON "buero"."rechnungen" USING btree ("status");--> statement-breakpoint
CREATE INDEX "vertraege_kunde_idx" ON "buero"."vertraege" USING btree ("kunde_id");--> statement-breakpoint
-- GoBD (§146 Abs. 4 AO): an issued invoice is not changed and not deleted. Only its status and
-- the payment date move on; corrections are Stornos. After boden's gobd_freeze_festschreibung.
CREATE OR REPLACE FUNCTION "buero"."rechnung_festschreibung"() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.status <> 'entwurf' THEN
      RAISE EXCEPTION 'GoBD: Die gestellte Rechnung % wird nicht gelöscht; korrigieren Sie sie mit einem Storno.', OLD.nummer;
    END IF;
    RETURN OLD;
  END IF;
  IF OLD.status <> 'entwurf' THEN
    IF NEW.status = 'entwurf'
      OR NEW.nummer IS DISTINCT FROM OLD.nummer
      OR NEW.typ IS DISTINCT FROM OLD.typ
      OR NEW.kunde_id IS DISTINCT FROM OLD.kunde_id
      OR NEW.korrigiert_id IS DISTINCT FROM OLD.korrigiert_id
      OR NEW.leistung_von IS DISTINCT FROM OLD.leistung_von
      OR NEW.leistung_bis IS DISTINCT FROM OLD.leistung_bis
      OR NEW.zahlungsziel_tage IS DISTINCT FROM OLD.zahlungsziel_tage
      OR NEW.einleitung IS DISTINCT FROM OLD.einleitung
      OR NEW.schlusstext IS DISTINCT FROM OLD.schlusstext
      OR NEW.positionen IS DISTINCT FROM OLD.positionen
      OR NEW.empfaenger IS DISTINCT FROM OLD.empfaenger
      OR NEW.verkaeufer IS DISTINCT FROM OLD.verkaeufer
      OR NEW.kleinunternehmer IS DISTINCT FROM OLD.kleinunternehmer
      OR NEW.ausgestellt_am IS DISTINCT FROM OLD.ausgestellt_am
      OR NEW.faellig_am IS DISTINCT FROM OLD.faellig_am
      OR NEW.summe_netto IS DISTINCT FROM OLD.summe_netto
      OR NEW.summe_steuer IS DISTINCT FROM OLD.summe_steuer
      OR NEW.summe_brutto IS DISTINCT FROM OLD.summe_brutto
    THEN
      RAISE EXCEPTION 'GoBD: Die gestellte Rechnung % ist festgeschrieben.', OLD.nummer;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE TRIGGER "rechnungen_festschreibung" BEFORE UPDATE OR DELETE ON "buero"."rechnungen"
  FOR EACH ROW EXECUTE FUNCTION "buero"."rechnung_festschreibung"();
--> statement-breakpoint
-- The number series only counts up and is never removed: a gap or a reused number is what GoBD
-- forbids. After boden's gobd_invoice_counter_monotonic_trigger.
CREATE OR REPLACE FUNCTION "buero"."nummernkreis_fortlaufend"() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'GoBD: Nummernkreise werden nicht gelöscht.';
  END IF;
  IF NEW.praefix IS DISTINCT FROM OLD.praefix OR NEW.jahr IS DISTINCT FROM OLD.jahr
    OR NEW.letzte < OLD.letzte THEN
    RAISE EXCEPTION 'GoBD: Ein Nummernkreis zählt nur vorwärts.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE TRIGGER "nummernkreise_fortlaufend" BEFORE UPDATE OR DELETE ON "buero"."nummernkreise"
  FOR EACH ROW EXECUTE FUNCTION "buero"."nummernkreis_fortlaufend"();
