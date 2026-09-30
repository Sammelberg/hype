ALTER TABLE "cms"."pages" ADD COLUMN "sections" jsonb;--> statement-breakpoint
-- Each place of the site becomes one document: the texts that only one page shows move from the
-- site settings onto that page. A database without settings (a fresh one) is left alone.
UPDATE "cms"."pages" AS p SET "sections" = jsonb_build_object(
  'kind', 'home',
  'hero', s."data"->'hero',
  'servicesTitle', s."data"->'servicesTitle',
  'stepsTitle', s."data"->'stepsTitle',
  'steps', coalesce(s."data"->'steps', '[]'::jsonb),
  'principlesTitle', s."data"->'principlesTitle',
  'principles', coalesce(s."data"->'principles', '[]'::jsonb)
)
FROM "cms"."site_settings" AS s
WHERE s."id" = 1 AND p."slug" = 'startseite' AND s."data" ? 'hero';--> statement-breakpoint
UPDATE "cms"."pages" AS p SET
  "sections" = jsonb_build_object(
    'kind', 'leistungen',
    'services', coalesce(s."data"->'services', '[]'::jsonb),
    'faq', coalesce(s."data"->'faq', '[]'::jsonb)
  ),
  "lead" = coalesce(p."lead", s."data"->>'servicesIntro')
FROM "cms"."site_settings" AS s
WHERE s."id" = 1 AND p."slug" = 'leistungen' AND s."data" ? 'services';--> statement-breakpoint
INSERT INTO "cms"."pages" ("slug", "path", "title", "lead", "sections", "status", "published_at")
SELECT 'projekte', '/projekte', 'Projekte', s."data"->>'projekteLead',
  jsonb_build_object('kind', 'projekte', 'empty', s."data"->'projekteEmpty'),
  'published', now()
FROM "cms"."site_settings" AS s
WHERE s."id" = 1 AND s."data" ? 'projekteLead'
  AND NOT EXISTS (SELECT 1 FROM "cms"."pages" WHERE "slug" = 'projekte' OR "path" = '/projekte');--> statement-breakpoint
INSERT INTO "cms"."pages" ("slug", "path", "title", "lead", "sections", "status", "published_at")
SELECT 'kontakt', '/kontakt', 'Kontakt', s."data"->>'kontaktLead',
  jsonb_build_object(
    'kind', 'kontakt',
    'nextTitle', s."data"->'kontaktNext'->'title',
    'nextText', s."data"->'kontaktNext'->'text'
  ),
  'published', now()
FROM "cms"."site_settings" AS s
WHERE s."id" = 1 AND s."data" ? 'kontaktLead'
  AND NOT EXISTS (SELECT 1 FROM "cms"."pages" WHERE "slug" = 'kontakt' OR "path" = '/kontakt');--> statement-breakpoint
UPDATE "cms"."site_settings" SET
  "data" = "data" - ARRAY['hero', 'servicesTitle', 'servicesIntro', 'services', 'stepsTitle', 'steps',
    'principlesTitle', 'principles', 'faq', 'projekteLead', 'projekteEmpty', 'kontaktLead', 'kontaktNext'],
  "draft" = "draft" - ARRAY['hero', 'servicesTitle', 'servicesIntro', 'services', 'stepsTitle', 'steps',
    'principlesTitle', 'principles', 'faq', 'projekteLead', 'projekteEmpty', 'kontaktLead', 'kontaktNext'];
