ALTER TABLE "cms"."redirects" DROP CONSTRAINT "redirects_type_check";--> statement-breakpoint
ALTER TABLE "cms"."redirects" DROP CONSTRAINT "redirects_to_page_id_pages_id_fk";
--> statement-breakpoint
ALTER TABLE "cms"."redirects" DROP CONSTRAINT "redirects_to_projekt_id_projekte_id_fk";
--> statement-breakpoint
ALTER TABLE "cms"."redirects" ALTER COLUMN "type" SET DEFAULT 308;--> statement-breakpoint
-- What the site sends: Next answers a permanent redirect with 308, a temporary one with 307.
UPDATE "cms"."redirects" SET "type" = CASE WHEN "type" = 302 THEN 307 ELSE 308 END;--> statement-breakpoint
ALTER TABLE "cms"."redirects" ADD CONSTRAINT "redirects_to_page_id_pages_id_fk" FOREIGN KEY ("to_page_id") REFERENCES "cms"."pages"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cms"."redirects" ADD CONSTRAINT "redirects_to_projekt_id_projekte_id_fk" FOREIGN KEY ("to_projekt_id") REFERENCES "cms"."projekte"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cms"."redirects" ADD CONSTRAINT "redirects_type_check" CHECK ("cms"."redirects"."type" in (307, 308));