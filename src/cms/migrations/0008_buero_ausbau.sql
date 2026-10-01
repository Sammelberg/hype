CREATE TYPE "buero"."angebot_status" AS ENUM('entwurf', 'versendet', 'angenommen', 'abgelehnt');--> statement-breakpoint
CREATE TYPE "buero"."historie_art" AS ENUM('notiz', 'anruf', 'email', 'termin');--> statement-breakpoint
CREATE TYPE "buero"."rechnung_art" AS ENUM('normal', 'abo', 'abschlag', 'schluss');--> statement-breakpoint
CREATE TABLE "buero"."angebote" (
	"id" serial PRIMARY KEY NOT NULL,
	"nummer" varchar(20),
	"kunde_id" integer NOT NULL,
	"auftrag_id" integer,
	"titel" varchar(300) NOT NULL,
	"einleitung" text,
	"schlusstext" text,
	"positionen" jsonb NOT NULL,
	"gueltig_bis" date,
	"status" "buero"."angebot_status" DEFAULT 'entwurf' NOT NULL,
	"versendet_am" date,
	"entschieden_am" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "angebote_nummer_unique" UNIQUE("nummer")
);
--> statement-breakpoint
CREATE TABLE "buero"."kunden_historie" (
	"id" serial PRIMARY KEY NOT NULL,
	"kunde_id" integer NOT NULL,
	"art" "buero"."historie_art" DEFAULT 'notiz' NOT NULL,
	"text" text NOT NULL,
	"am" timestamp with time zone DEFAULT now() NOT NULL,
	"autor" varchar(200),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "buero"."mahnungen" (
	"id" serial PRIMARY KEY NOT NULL,
	"rechnung_id" integer NOT NULL,
	"stufe" integer NOT NULL,
	"am" date NOT NULL,
	"frist" date NOT NULL,
	"offen" numeric(12, 2) NOT NULL,
	"verzug_seit" date,
	"zinssatz" numeric(5, 2) DEFAULT '0' NOT NULL,
	"zinsen" numeric(12, 2) DEFAULT '0' NOT NULL,
	"pauschale" numeric(12, 2) DEFAULT '0' NOT NULL,
	"gebuehr" numeric(12, 2) DEFAULT '0' NOT NULL,
	"gesamt" numeric(12, 2) NOT NULL,
	"text" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "mahnungen_stufe" CHECK ("buero"."mahnungen"."stufe" between 0 and 2)
);
--> statement-breakpoint
CREATE TABLE "buero"."wiedervorlagen" (
	"id" serial PRIMARY KEY NOT NULL,
	"kunde_id" integer,
	"auftrag_id" integer,
	"vertrag_id" integer,
	"rechnung_id" integer,
	"titel" varchar(300) NOT NULL,
	"notiz" text,
	"faellig_am" date NOT NULL,
	"erledigt_am" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "buero"."zahlungen" (
	"id" serial PRIMARY KEY NOT NULL,
	"rechnung_id" integer NOT NULL,
	"betrag" numeric(12, 2) NOT NULL,
	"am" date NOT NULL,
	"notiz" varchar(300),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "zahlungen_betrag_positiv" CHECK ("buero"."zahlungen"."betrag" > 0)
);
--> statement-breakpoint
ALTER TABLE "buero"."rechnungen" ADD COLUMN "art" "buero"."rechnung_art" DEFAULT 'normal' NOT NULL;--> statement-breakpoint
ALTER TABLE "buero"."rechnungen" ADD COLUMN "abschlaege" jsonb;--> statement-breakpoint
ALTER TABLE "buero"."vertraege" ADD COLUMN "abo_rechnungen" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "buero"."vertraege" ADD COLUMN "abgerechnet_bis" date;--> statement-breakpoint
ALTER TABLE "buero"."angebote" ADD CONSTRAINT "angebote_kunde_id_kunden_id_fk" FOREIGN KEY ("kunde_id") REFERENCES "buero"."kunden"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "buero"."angebote" ADD CONSTRAINT "angebote_auftrag_id_auftraege_id_fk" FOREIGN KEY ("auftrag_id") REFERENCES "buero"."auftraege"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "buero"."kunden_historie" ADD CONSTRAINT "kunden_historie_kunde_id_kunden_id_fk" FOREIGN KEY ("kunde_id") REFERENCES "buero"."kunden"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "buero"."mahnungen" ADD CONSTRAINT "mahnungen_rechnung_id_rechnungen_id_fk" FOREIGN KEY ("rechnung_id") REFERENCES "buero"."rechnungen"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "buero"."wiedervorlagen" ADD CONSTRAINT "wiedervorlagen_kunde_id_kunden_id_fk" FOREIGN KEY ("kunde_id") REFERENCES "buero"."kunden"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "buero"."wiedervorlagen" ADD CONSTRAINT "wiedervorlagen_auftrag_id_auftraege_id_fk" FOREIGN KEY ("auftrag_id") REFERENCES "buero"."auftraege"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "buero"."wiedervorlagen" ADD CONSTRAINT "wiedervorlagen_vertrag_id_vertraege_id_fk" FOREIGN KEY ("vertrag_id") REFERENCES "buero"."vertraege"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "buero"."wiedervorlagen" ADD CONSTRAINT "wiedervorlagen_rechnung_id_rechnungen_id_fk" FOREIGN KEY ("rechnung_id") REFERENCES "buero"."rechnungen"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "buero"."zahlungen" ADD CONSTRAINT "zahlungen_rechnung_id_rechnungen_id_fk" FOREIGN KEY ("rechnung_id") REFERENCES "buero"."rechnungen"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "angebote_kunde_idx" ON "buero"."angebote" USING btree ("kunde_id");--> statement-breakpoint
CREATE INDEX "angebote_status_idx" ON "buero"."angebote" USING btree ("status");--> statement-breakpoint
CREATE INDEX "kunden_historie_kunde_idx" ON "buero"."kunden_historie" USING btree ("kunde_id","am");--> statement-breakpoint
CREATE INDEX "mahnungen_rechnung_idx" ON "buero"."mahnungen" USING btree ("rechnung_id");--> statement-breakpoint
CREATE INDEX "wiedervorlagen_offen_idx" ON "buero"."wiedervorlagen" USING btree ("erledigt_am","faellig_am");--> statement-breakpoint
CREATE INDEX "wiedervorlagen_kunde_idx" ON "buero"."wiedervorlagen" USING btree ("kunde_id");--> statement-breakpoint
CREATE INDEX "zahlungen_rechnung_idx" ON "buero"."zahlungen" USING btree ("rechnung_id");--> statement-breakpoint
CREATE UNIQUE INDEX "rechnungen_abo_zeitraum" ON "buero"."rechnungen" USING btree ("vertrag_id","leistung_von") WHERE "buero"."rechnungen"."art" = 'abo' and "buero"."rechnungen"."typ" = 'rechnung' and "buero"."rechnungen"."status" <> 'storniert';
--> statement-breakpoint
-- GoBD for what 0008 adds: an issued invoice's kind and the invoices on account a final invoice
-- deducts are frozen with it (the function of 0006, two columns more).
CREATE OR REPLACE FUNCTION "buero"."rechnung_festschreibung"() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, buero AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.status <> 'entwurf' THEN
      RAISE EXCEPTION 'GoBD: Die gestellte Rechnung % wird nicht gelöscht; korrigieren Sie sie mit einem Storno.', OLD.nummer;
    END IF;
    RETURN OLD;
  END IF;
  -- The archive: from nothing to a file once, after that never again.
  IF OLD.archiv_xml IS NOT NULL AND (NEW.archiv_xml IS DISTINCT FROM OLD.archiv_xml
      OR NEW.archiv_sha256 IS DISTINCT FROM OLD.archiv_sha256) THEN
    RAISE EXCEPTION 'GoBD: Die archivierte E-Rechnung zu % bleibt, wie sie ist.', OLD.nummer;
  END IF;
  IF OLD.archiv_xml IS NULL AND (NEW.archiv_xml IS NULL) <> (NEW.archiv_sha256 IS NULL) THEN
    RAISE EXCEPTION 'GoBD: Archiv und Prüfsumme der Rechnung % gehören zusammen.', OLD.nummer;
  END IF;
  IF OLD.status <> 'entwurf' THEN
    IF NEW.status = 'entwurf'
      OR NEW.nummer IS DISTINCT FROM OLD.nummer
      OR NEW.typ IS DISTINCT FROM OLD.typ
      OR NEW.art IS DISTINCT FROM OLD.art
      OR NEW.abschlaege IS DISTINCT FROM OLD.abschlaege
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
  ELSIF NEW.archiv_xml IS NOT NULL AND NEW.status = 'entwurf' THEN
    RAISE EXCEPTION 'GoBD: Ein Entwurf hat noch keine E-Rechnung.';
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint
-- A Mahnung is a letter that went out: it is never rewritten (a wrong one is followed by a new
-- one). A payment is recorded or, entered by mistake, removed — never changed; and only against
-- an issued invoice.
CREATE OR REPLACE FUNCTION "buero"."nicht_aendern"() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog AS $$
BEGIN
  RAISE EXCEPTION 'GoBD: % werden nicht geändert.', TG_TABLE_NAME;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER "mahnungen_unveraendert" BEFORE UPDATE OR DELETE ON "buero"."mahnungen"
  FOR EACH ROW EXECUTE FUNCTION "buero"."nicht_aendern"();
--> statement-breakpoint
CREATE TRIGGER "mahnungen_nicht_leeren" BEFORE TRUNCATE ON "buero"."mahnungen"
  FOR EACH STATEMENT EXECUTE FUNCTION "buero"."nicht_leeren"();
--> statement-breakpoint
CREATE TRIGGER "zahlungen_unveraendert" BEFORE UPDATE ON "buero"."zahlungen"
  FOR EACH ROW EXECUTE FUNCTION "buero"."nicht_aendern"();
--> statement-breakpoint
CREATE OR REPLACE FUNCTION "buero"."zahlung_auf_gestellte"() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, buero AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM buero.rechnungen r WHERE r.id = NEW.rechnung_id
      AND r.typ = 'rechnung' AND r.status IN ('gestellt', 'bezahlt')) THEN
    RAISE EXCEPTION '% gehören zu einer gestellten Rechnung.', initcap(TG_TABLE_NAME);
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER "zahlungen_auf_gestellte" BEFORE INSERT ON "buero"."zahlungen"
  FOR EACH ROW EXECUTE FUNCTION "buero"."zahlung_auf_gestellte"();
--> statement-breakpoint
CREATE TRIGGER "mahnungen_auf_gestellte" BEFORE INSERT ON "buero"."mahnungen"
  FOR EACH ROW EXECUTE FUNCTION "buero"."zahlung_auf_gestellte"();
