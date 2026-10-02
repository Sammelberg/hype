-- The second service is no longer "Mobile Apps" but "Geschäftssysteme" (owner, 2026-10-01): its
-- glyph is renamed from "mobile" to "system" wherever a page's sections hold it — live, drafted
-- and in its versions, so restoring an old version still passes the schema.
UPDATE "cms"."pages"
SET "sections" = replace("sections"::text, '"glyph": "mobile"', '"glyph": "system"')::jsonb
WHERE "sections"::text LIKE '%"glyph": "mobile"%';--> statement-breakpoint
UPDATE "cms"."pages"
SET "draft" = replace("draft"::text, '"glyph": "mobile"', '"glyph": "system"')::jsonb
WHERE "draft"::text LIKE '%"glyph": "mobile"%';--> statement-breakpoint
UPDATE "cms"."versions"
SET "snapshot" = replace("snapshot"::text, '"glyph": "mobile"', '"glyph": "system"')::jsonb
WHERE "snapshot"::text LIKE '%"glyph": "mobile"%';
