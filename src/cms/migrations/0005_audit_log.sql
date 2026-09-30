CREATE TABLE "cms"."audit_log" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"at" timestamp with time zone DEFAULT now() NOT NULL,
	"user_id" integer,
	"user_email" text,
	"action" text NOT NULL,
	"target_type" text,
	"target_id" text,
	"details" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"prev_hash" text DEFAULT '' NOT NULL,
	"hash" text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE INDEX "audit_log_action_idx" ON "cms"."audit_log" USING btree ("action","id");--> statement-breakpoint
-- One row's hash: sha256 over the one before and every field, in a fixed text form. Used by the
-- insert trigger and by the chain check (src/cms/audit/log.ts), so both hash alike.
CREATE OR REPLACE FUNCTION "cms"."audit_hash"(
  prev text, id bigint, at timestamptz, user_id integer, user_email text,
  action text, target_type text, target_id text, details jsonb
) RETURNS text AS $$
  SELECT encode(sha256(convert_to(concat_ws('|',
    prev,
    id::text,
    to_char(at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
    coalesce(user_id::text, ''),
    coalesce(user_email, ''),
    action,
    coalesce(target_type, ''),
    coalesce(target_id, ''),
    details::text
  ), 'UTF8')), 'hex');
$$ LANGUAGE sql STABLE;
--> statement-breakpoint
-- Every new row is numbered, stamped and chained here, under a lock held until its transaction
-- ends: the next writer waits and links to it, so rows follow each other in id order and no two
-- point at the same predecessor. What the application sends for id, at and the hashes is ignored.
CREATE OR REPLACE FUNCTION "cms"."audit_chain"() RETURNS trigger AS $$
DECLARE
  last_hash text;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('cms.audit_log'));
  NEW.id := nextval(pg_get_serial_sequence('cms.audit_log', 'id'));
  NEW.at := clock_timestamp();
  SELECT hash INTO last_hash FROM "cms"."audit_log" ORDER BY id DESC LIMIT 1;
  NEW.prev_hash := coalesce(last_hash, 'GENESIS');
  NEW.hash := "cms"."audit_hash"(NEW.prev_hash, NEW.id, NEW.at, NEW.user_id, NEW.user_email,
    NEW.action, NEW.target_type, NEW.target_id, NEW.details);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE TRIGGER "audit_log_chain" BEFORE INSERT ON "cms"."audit_log"
  FOR EACH ROW EXECUTE FUNCTION "cms"."audit_chain"();
--> statement-breakpoint
-- Written once, never changed, never removed: not by the application, not by hand.
CREATE OR REPLACE FUNCTION "cms"."audit_unveraenderlich"() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'Protokoll: Einträge werden weder geändert noch gelöscht (%).', TG_OP;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE TRIGGER "audit_log_unveraenderlich" BEFORE UPDATE OR DELETE ON "cms"."audit_log"
  FOR EACH ROW EXECUTE FUNCTION "cms"."audit_unveraenderlich"();
--> statement-breakpoint
CREATE TRIGGER "audit_log_nicht_leeren" BEFORE TRUNCATE ON "cms"."audit_log"
  FOR EACH STATEMENT EXECUTE FUNCTION "cms"."audit_unveraenderlich"();
