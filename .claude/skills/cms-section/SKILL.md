---
name: cms-section
description: Carry a CMS-backed change end to end — Payload field, types, query, rendering, revalidation, seed, migration, tests. Use when adding a homepage section, a field, a collection or a global, or changing the Payload schema.
---

# CMS section

A schema change touches seven places; a skipped one surfaces later as a CI failure (missing migration), an empty page (no seed) or stale content (no revalidation). Work through the steps in order; each ends on its completion criterion. Homepage sections are the common case: their content lives in the `SiteSettings` global (`src/cms/globals/SiteSettings.ts`), one `group` or `array` per section.

## Steps

1. **Schema.** Add the field in `src/cms/` with relative imports. Admin text is German: `label` ends in „(Startseite)“ for homepage content, `admin.description` names the section („Abschnitt „Ablauf““). Done when the field shows in `/admin` (dev pushes the schema on save).
2. **Types.** `pnpm generate:types`. Done when `src/payload-types.ts` carries the field and `pnpm typecheck` passes.
3. **Query.** Reads go through `src/data/queries.ts`: `getSiteSettings()` already returns the global; a new collection gets its own `cache`-wrapped, draft-aware query beside the others. Done when the route reads the data only through that module.
4. **Render.** The section renders nothing when its content is empty (`items.length > 0 ? … : null`, as in `page.tsx`), gets an `aria-labelledby` heading, and follows the styling rules in CLAUDE.md. Done when the page renders with the field empty and with it filled.
5. **Revalidation.** `SiteSettings` already revalidates everything on save. A new collection whose documents feed fixed paths gets `revalidatePathsOf(...)` from `src/cms/hooks/revalidate.ts`. Done when publishing in the admin updates the running page without a rebuild.
6. **Seed.** Add German placeholder content (Anrede „Sie“) to `scripts/seed-data.ts`; a new route also goes into `SEED_PATHS`, which feeds the smoke, a11y and data-sovereignty tests. Done when `pnpm seed` runs twice without error and the section shows locally.
7. **Migration.** `pnpm migrate:create <snake_case_name>` (it also fixes imports and formats), then test it on a scratch database as the CLAUDE.md gotcha on dev-push mode describes. Done when migrate and seed succeed on the scratch database and `src/migrations/` (`.ts`, `.json`, `index.ts`) plus `src/payload-types.ts` are ready to commit.
8. **Checks.** Interactive UI goes through `better-accessibility`, scroll or gesture behaviour through `verify-interaction`. Done when the Definition of done in CLAUDE.md holds.
