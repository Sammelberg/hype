DROP INDEX "cms"."pages_parent_idx";--> statement-breakpoint
ALTER TABLE "cms"."media" ADD COLUMN "ordner" varchar(100);--> statement-breakpoint
ALTER TABLE "cms"."pages" ADD COLUMN "sort_order" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "cms"."pages" ADD COLUMN "publish_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "cms"."projekte" ADD COLUMN "publish_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "pages_parent_idx" ON "cms"."pages" USING btree ("parent_id","sort_order");--> statement-breakpoint
-- The order the site showed until now (src/lib/site-nav.ts ORDER, then creation), written down so
-- nothing moves: the known sections first, every other top-level page after them by age, the
-- pages below a page by age.
UPDATE "cms"."pages" p SET "sort_order" = o.n FROM (
  SELECT id, row_number() OVER (
    PARTITION BY parent_id
    ORDER BY
      CASE WHEN parent_id IS NULL THEN coalesce(array_position(ARRAY['leistungen','branchen','projekte','ueber-uns']::text[], slug::text), 100) ELSE 0 END,
      created_at, id
  ) AS n FROM "cms"."pages"
) o WHERE o.id = p.id;
