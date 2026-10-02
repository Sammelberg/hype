-- The home page gains the E-Rechnung timeline (eRechnungTitle, eRechnungLead, milestones). A home
-- page's sections written before it get the fields with their defaults — live, drafted and in its
-- versions — so publishing and restoring pass the schema; what is already there wins.
UPDATE "cms"."pages"
SET "sections" = '{"eRechnungTitle": "Die E-Rechnung kommt für jedes Unternehmen", "eRechnungLead": null, "milestones": []}'::jsonb || "sections"
WHERE "sections"->>'kind' = 'home';--> statement-breakpoint
UPDATE "cms"."pages"
SET "draft" = jsonb_set("draft", '{sections}', '{"eRechnungTitle": "Die E-Rechnung kommt für jedes Unternehmen", "eRechnungLead": null, "milestones": []}'::jsonb || ("draft"->'sections'))
WHERE "draft"->'sections'->>'kind' = 'home';--> statement-breakpoint
UPDATE "cms"."versions"
SET "snapshot" = jsonb_set("snapshot", '{sections}', '{"eRechnungTitle": "Die E-Rechnung kommt für jedes Unternehmen", "eRechnungLead": null, "milestones": []}'::jsonb || ("snapshot"->'sections'))
WHERE "snapshot"->'sections'->>'kind' = 'home';
