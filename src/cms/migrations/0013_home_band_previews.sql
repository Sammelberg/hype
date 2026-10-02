-- The home page gains the running band of the stack (techTitle) and the doors to other pages
-- (previewsTitle). A home page's sections written before get both headings — live, drafted and
-- in its versions — so publishing and restoring pass the schema; what is already there wins.
UPDATE "cms"."pages"
SET "sections" = '{"techTitle": "Womit wir bauen", "previewsTitle": "Mehr über uns"}'::jsonb || "sections"
WHERE "sections"->>'kind' = 'home';--> statement-breakpoint
UPDATE "cms"."pages"
SET "draft" = jsonb_set("draft", '{sections}', '{"techTitle": "Womit wir bauen", "previewsTitle": "Mehr über uns"}'::jsonb || ("draft"->'sections'))
WHERE "draft"->'sections'->>'kind' = 'home';--> statement-breakpoint
UPDATE "cms"."versions"
SET "snapshot" = jsonb_set("snapshot", '{sections}', '{"techTitle": "Womit wir bauen", "previewsTitle": "Mehr über uns"}'::jsonb || ("snapshot"->'sections'))
WHERE "snapshot"->'sections'->>'kind' = 'home';
