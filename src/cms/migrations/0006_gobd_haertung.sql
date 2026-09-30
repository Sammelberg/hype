ALTER TABLE "buero"."rechnungen" ADD COLUMN "archiv_xml" text;--> statement-breakpoint
ALTER TABLE "buero"."rechnungen" ADD COLUMN "archiv_sha256" varchar(64);--> statement-breakpoint
-- GoBD, second pass after boden's gobd_freeze_festschreibung_and_series,
-- gobd_invoice_immutability_trigger and gobd_invoice_counter_monotonic_trigger. The functions of
-- 0002 are replaced whole. New: the XRechnung archive is written once; TRUNCATE is refused; the
-- functions run as their owner with a fixed search_path, so no object of the caller's can stand
-- in for one of ours.
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
-- A series counts by exactly one: no number twice, none skipped, none taken back (§14 Abs. 4
-- Nr. 4 UStG). It starts at one or above (above: continuing the numbers of an earlier tool).
CREATE OR REPLACE FUNCTION "buero"."nummernkreis_fortlaufend"() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, buero AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'GoBD: Nummernkreise werden nicht gelöscht.';
  END IF;
  IF TG_OP = 'INSERT' THEN
    IF NEW.letzte < 1 THEN
      RAISE EXCEPTION 'GoBD: Ein Nummernkreis beginnt bei 1.';
    END IF;
    RETURN NEW;
  END IF;
  IF NEW.praefix IS DISTINCT FROM OLD.praefix OR NEW.jahr IS DISTINCT FROM OLD.jahr THEN
    RAISE EXCEPTION 'GoBD: Präfix und Jahr eines Nummernkreises bleiben.';
  END IF;
  IF NEW.letzte IS DISTINCT FROM OLD.letzte + 1 THEN
    RAISE EXCEPTION 'GoBD: Der Nummernkreis %-% zählt nur um eins weiter (war %, sollte % werden).',
      OLD.praefix, OLD.jahr, OLD.letzte, NEW.letzte;
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint
DROP TRIGGER IF EXISTS "nummernkreise_fortlaufend" ON "buero"."nummernkreise";
--> statement-breakpoint
CREATE TRIGGER "nummernkreise_fortlaufend" BEFORE INSERT OR UPDATE OR DELETE ON "buero"."nummernkreise"
  FOR EACH ROW EXECUTE FUNCTION "buero"."nummernkreis_fortlaufend"();
--> statement-breakpoint
CREATE OR REPLACE FUNCTION "buero"."nicht_leeren"() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog AS $$
BEGIN
  RAISE EXCEPTION 'GoBD: % wird nicht geleert.', TG_TABLE_NAME;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER "rechnungen_nicht_leeren" BEFORE TRUNCATE ON "buero"."rechnungen"
  FOR EACH STATEMENT EXECUTE FUNCTION "buero"."nicht_leeren"();
--> statement-breakpoint
CREATE TRIGGER "nummernkreise_nicht_leeren" BEFORE TRUNCATE ON "buero"."nummernkreise"
  FOR EACH STATEMENT EXECUTE FUNCTION "buero"."nicht_leeren"();
