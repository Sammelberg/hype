CREATE TABLE "buero"."rechnung_pdfs" (
	"rechnung_id" integer PRIMARY KEY NOT NULL,
	"pdf" "bytea" NOT NULL,
	"sha256" varchar(64) NOT NULL,
	"zugferd" boolean NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "buero"."rechnung_pdfs" ADD CONSTRAINT "rechnung_pdfs_rechnung_id_rechnungen_id_fk" FOREIGN KEY ("rechnung_id") REFERENCES "buero"."rechnungen"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE OR REPLACE FUNCTION "buero"."pdf_einer_gestellten"() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, buero AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM buero.rechnungen r WHERE r.id = NEW.rechnung_id
      AND r.status <> 'entwurf' AND r.nummer IS NOT NULL) THEN
    RAISE EXCEPTION 'Nur eine gestellte Rechnung bekommt ihr archiviertes PDF.';
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER "rechnung_pdfs_auf_gestellte" BEFORE INSERT ON "buero"."rechnung_pdfs"
  FOR EACH ROW EXECUTE FUNCTION "buero"."pdf_einer_gestellten"();
--> statement-breakpoint
CREATE TRIGGER "rechnung_pdfs_unveraendert" BEFORE UPDATE OR DELETE ON "buero"."rechnung_pdfs"
  FOR EACH ROW EXECUTE FUNCTION "buero"."nicht_aendern"();
--> statement-breakpoint
CREATE TRIGGER "rechnung_pdfs_nicht_leeren" BEFORE TRUNCATE ON "buero"."rechnung_pdfs"
  FOR EACH STATEMENT EXECUTE FUNCTION "buero"."nicht_leeren"();
