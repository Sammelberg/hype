---
name: cms-section
description: Carry a CMS-backed change end to end — Payload field, types, query, rendering, revalidation, seed, migration, tests. Use when adding a homepage section, a field, a collection (with or without its own URLs) or a global, or changing the Payload schema.
---

# CMS section

A schema change touches up to nine places; a skipped one surfaces later as a CI failure (missing migration), an empty page (no seed), stale content (no revalidation) or a document that search, redirects and the sitemap never see (no path). Work through the steps in order; each ends on its completion criterion. Pick the shape first:

- **Homepage section** (one instance, edited in one place): a `group` or `array` in the `SiteSettings` global (`src/cms/globals/SiteSettings.ts`), rendered in `src/app/(frontend)/page.tsx` next to the `startseite` page content.
- **Field on pages**: a field in `src/cms/collections/Pages.ts`, rendered in `[...slug]/page.tsx` (and `page.tsx` if the home page uses it).
- **Routed collection** (documents with their own URL, e.g. `posts` → `/beitraege/[slug]`): a new collection plus a route; step 5 applies.
- **Unrouted collection** (data shown elsewhere, e.g. team members): a new collection; skip step 5.

## Steps

1. **Schema.** Add the field or collection in `src/cms/` with relative imports; a new collection is registered in `src/payload.config.ts`. Admin text is German: `label` ends in „(Startseite)“ for homepage content, `admin.description` names the section („Abschnitt „Ablauf““). A collection that is public but draftable copies the `access.read` and `versions` of `Pages`. Done when the field shows in `/admin` (dev pushes the schema on save).
2. **Types.** `pnpm generate:types`. Done when `src/payload-types.ts` carries the change and `pnpm typecheck` passes.
3. **Query.** Reads go through `src/data/queries.ts`: `getSiteSettings()` already returns the global; a new collection gets its own `cache`-wrapped, draft-aware query modelled on `getPageBySlug`. Done when the route reads the data only through that module.
4. **Render.** A section renders nothing when its content is empty (`items.length > 0 ? … : null`), gets an `aria-labelledby` heading, and follows the styling rules in CLAUDE.md. A routed collection's page calls `redirectOrNotFound(path)` for a missing document and exports `generateMetadata` via `buildMetadata` (`src/lib/seo.tsx`). Done when the page renders with the content empty and filled.
5. **Path (routed collections only).** Export a path function beside the collection (`postPath = (doc) => …`, like `pagePath`) and add it to `routedCollections` in `src/cms/paths.ts`. That one entry feeds the SEO tab, redirect targets, the search index, live preview and the sitemap. Done when the document appears in `/sitemap.xml`, `/suche` finds it after publishing, and live preview opens its URL.
6. **Revalidation.** `SiteSettings` already revalidates everything on save; `Pages` uses `revalidateCollection(pagePath)`. A routed collection gets `revalidateCollection(itsPath)` in its `hooks`; a collection that feeds fixed paths (a list on the home page) gets `revalidatePathsOf(() => ["/"])` from `src/cms/hooks/revalidate.ts`. Done when publishing in the admin updates the running page without a rebuild.
7. **Seed.** Add German placeholder content (Anrede „Sie“) to `scripts/seed-data.ts` and its upsert to `scripts/seed.ts`; a new route also goes into `SEED_PATHS`, which feeds the smoke, a11y and data-sovereignty tests. Done when `pnpm seed` runs twice without error and the content shows locally.
8. **Migration.** `pnpm migrate:create <snake_case_name>` (it also fixes imports and formats), then test it on a scratch database as the CLAUDE.md gotcha on dev-push mode describes. Done when migrate and seed succeed on the scratch database and `src/migrations/` (`.ts`, `.json`, `index.ts`) plus `src/payload-types.ts` are ready to commit.
9. **Checks.** Interactive UI goes through `better-accessibility`, scroll or gesture behaviour through `verify-interaction`. Done when the Definition of done in CLAUDE.md holds.
