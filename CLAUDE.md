# starter — Next + Payload template

This repo is a **starter template**. In a fresh copy, `pnpm init:project` sets name, ports, database and seed identity (see `README.md`); after that, fill in „Project“ below and replace the home page.

Next.js 16 (App Router, React Compiler, typed routes) · Payload CMS 3 (Postgres) · React 19 · TypeScript (strict) · Tailwind CSS v4 · shadcn/ui (radix base, Nova preset) · pnpm.

## Project

Filled in per project. When a task depends on a point still marked _offen_, ask instead of assuming.

- **Site / owner:** Schwarzwald Systems (legal form, address and contact e-mail _offen_; seed uses `hallo@example.com`)
- **Purpose and audience:** corporate site of a custom-software company (web apps, mobile apps, integrations, modernisation, operations) for German Mittelstand decision-makers; main job: project inquiries via `/kontakt`. Home copy is a draft — its claims (code handover, fixed contacts, hosting in Germany) await the owner's confirmation.
- **Design direction:** „Deep Space“ — dark-only in space navy and deep blue, one hue family (blue 250–262, clear of violet): near-black navy neutrals with little chroma; sapphire accent in two roles — `primary` (deep fill, white text) and `primary-soft` (ice blue for accent text, icons, the drawn ridge). Tokens and measured contrast in `globals.css`. No violet, orange or green — one exception by the owner's request: the forest lights glow in warm gold and the ridge's highlight arc in copper gold (warm, never plain orange); the triangle motif wears gem tones — diamond peak, bottle emerald, royal sapphire, petrol connectors so they never read as the cold stars. Geist, tight large headings. Brand mark: the fir in `src/components/site/fir-mark.tsx` (icons and share image use it — never the initials). Hero: the owner's mountain block in navy with its draw animation (GSAP: exact path length, starts in view, crossfaded thinning to a 2.5px outline); change the look only on request.
- **Hosting:** own server at IONOS (Germany); no Vercel-specific features.
- **Deviations from the template defaults below:** none.

## Product rules

- **German only, Anrede „Sie“.** All visible text, alt texts, metadata and URLs are German (`/kontakt`, `/suche`, `/ueber-uns`). `<html lang="de">`, `og:locale de_DE`. No i18n layer.
- **Legal pages:** Impressum and Datenschutzerklärung are Payload pages (slugs `impressum`, `datenschutz`, linked in the footer). The owner writes legal text; seeded versions are marked „Platzhalter“.
- **Data sovereignty** is a hard rule — see its section before adding any service, origin, font or asset.

## Code map

Application code lives in `src/` (`@/*` → `src/*`); the root holds configuration, `e2e/` and `scripts/`. Place new code by what it is:

- `src/app/(frontend)/` — routes only: `/` (the Payload page with slug `startseite`), `/[...slug]` (Payload pages, nested via breadcrumbs), `/suche`, `/kontakt`, German `error.tsx`, placeholder monogram icons (`icon.tsx`, `apple-icon.tsx` — swap for designed `icon.png`/`apple-icon.png`), `opengraph-image.tsx`, `next/preview`.
- `src/app/(frontend)/<route>/_components/`, `_lib/` — code used by that one route (`kontakt/_components/contact-form.tsx`, `kontakt/_lib/validation.ts`). Promote it to `src/components/` or `src/lib/` once a second route needs it.
- `src/app/(payload)/` — Payload admin and API, generated; `pnpm generate:importmap` after adding admin components. `src/app/` also holds `global-error.tsx`, `sitemap.ts`, `robots.ts`.
- `src/cms/` — Payload schema: `collections/`, `globals/`, `hooks/` (Payload hooks such as revalidation), `plugins.ts`, `paths.ts` (public URL per routed collection).
- `src/data/` — server-only data layer: `payload.ts` (`getPayloadClient`), `queries.ts` (all frontend reads; React `cache`, draft-aware), `redirect-or-not-found.ts`.
- `src/components/` — `ui/` shadcn (`pnpm dlx shadcn@latest add <name>`, then adapt), `site/` shared site components, `dev/` dev-only tools (Reticle bridge).
- `src/lib/` — pure helpers with colocated `*.test.ts`: `seo.tsx`, `redirects.ts`, `rich-text.ts`, `utils.ts` (`cn` from the `cn` package).
- `src/payload.config.ts`, `src/payload-types.ts` (generated), `src/migrations/`, `src/env.ts` (validated env — import `env`, never `process.env`; new variables go into `env.ts` and `.env.example`).

## CMS (Payload)

- Collections: Users, Media, Pages; global `SiteSettings` (site name, owner, tagline, SEO description, contact email, profile links). Admin UI is German. `src/payload.config.ts`, `src/cms/**` and everything they import (`src/lib/redirects.ts`, `src/env.ts`) use **relative imports** — the Payload CLI does not resolve `@/`.
- **Routed collections:** `src/cms/paths.ts` maps each collection with a frontend route to its path function. Redirects, search, SEO, live preview and the sitemap read it, so a new routed collection (e.g. `posts` → `/beitraege/[slug]`) needs its route, one entry there and revalidation via `revalidateCollection(...)`. Carry it end to end with `cms-section`.
- **Home page:** the page with slug `startseite` (`HOME_SLUG`) renders at `/`; `pagePath` returns `/` for it and the catch-all skips it.
- **Revalidation:** pages are static; publishing rebuilds them instantly via `src/cms/hooks/revalidate.ts`. A collection that feeds fixed paths gets `revalidatePathsOf(...)`.
- **Draft preview:** live preview → `/next/preview?path=…` (needs a Payload session, enables draft mode) → `RefreshOnSave`; `/next/exit-preview` ends it.
- **Plugins:** seo, nested-docs, storage-s3 (auto-on when S3 env is set; self-hosted/EU endpoint only), plus three wired into the site:
  - **redirects** — 301/302, `from` is normalized (`src/lib/redirects.ts`). CMS routes call `redirectOrNotFound(path)` instead of `notFound()`.
  - **search** — index carries `summary` and `url`; `/suche` queries it.
  - **form-builder** — the form titled „Kontakt“ renders at `/kontakt`. The server action (`kontakt/actions.ts`) validates with `kontakt/_lib/validation.ts` (German messages, honeypot, minimum fill time) and writes via the Local API; public REST creation of submissions is closed. Email settings and US-only blocks are removed.
- **Uploads** live on local disk in `/media` (gitignored; a persistent volume in production).
- **Schema changes:** dev pushes automatically. Before merging: `pnpm migrate:create <name>`, then `pnpm generate:types`, commit `src/migrations/` and `src/payload-types.ts`. CI runs `pnpm migrate`.
- **Dev content:** `pnpm seed` (`scripts/seed-data.ts`) — site settings, the `startseite` page with a share image, placeholder legal pages, a nested page (`/ueber-uns/team`), the „Kontakt“ form, redirect `/about` → `/ueber-uns`. Idempotent, local databases only, creates no users (first admin signs up at `/admin`). Every new route gets seeded content and an entry in `SEED_PATHS`, which feeds the e2e tests.

## Styling

- **Every project gets its own design, made fresh.** The template is design-neutral on purpose: shadcn's neutral tokens (light, with a `.dark` set), Geist, Tailwind's default spacing, a plain header and footer. Build the direction from this project's subject and audience with `frontend-design` / `variate`, then record it under „Design direction“ in „Project“. Sources are this brief and material the owner supplies; other projects on this machine and earlier sites stay out of it, so no two sites share a look.
- `src/app/(frontend)/globals.css` holds all tokens; it is imported only by the frontend layout, so the admin stays unstyled by it. A project's palette, radius and spacing rhythm replace the neutral values there; `--container-sm…2xl` stay untouched (shadcn's `max-w-*` depend on them). Colours outside CSS follow it by hand: `themeColor` in `layout.tsx`, `opengraph-image.tsx`, `global-error.tsx`, the icons.
- **Layout:** `page-container` is the page column — up to 1760px (`--container-page`), fluid side gutter 20→80px (`--spacing-gutter`); long text keeps a reading width (`max-w-3xl`, `max-w-prose`). Breakpoints are Tailwind's plus `xs` 480, `3xl` 1920, `4xl` 2560 (`globals.css`); type and the triangle motif step up once more at `3xl`. `.dark` on an element switches everything inside it to the dark token set (the home hero uses it).
- **Home hero:** `_components/mountain-scene.tsx` composes the owner's blocks, back to front: WebGL night sky with moon and mist (`night-sky.ts`), twinkling stars and a random starfall (`starfield.ts`), the mountains and firs, lights rising from the forest (`lights.ts`), the triangle motif (`triangle-motif.tsx`). One GSAP timeline and ticker drive all of it, only while the hero is on screen; reduced motion shows it still. Pure logic of stars, meteors and lights has colocated tests; `e2e/hero.spec.ts` covers the rest.
- **Motion:** `motion/react` for component/UI motion; GSAP (+ Lenis) only for scroll-driven or timeline sequences; one system per element; always honour `prefers-reduced-motion`; looping motion pauses off-screen.
- `baseline-ui` is the default constraint set. Gradients, glow, custom easing or extra animation need an explicit request or a chosen art direction.
- Reuse existing tokens, components and fonts; a new dependency needs approval.

## Which skill to use

Load the skill before starting the work.

| Task                                      | Skills                                                                                                            |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| New page, section or visual direction     | `frontend-design`, then `baseline-ui` as the constraint pass                                                      |
| Several design options to choose from     | `variate`                                                                                                         |
| UI components                             | `shadcn` (existing component first), then `/break` on anything rendering CMS content                              |
| Typography / colour / tokens              | `better-typography`, `better-colors`                                                                              |
| Component motion, hovers, dialogs, cmdk   | `animate` + `emil-design-eng`; `apple-design` for springs/gestures                                                |
| Scroll-driven motion, pinning, parallax   | `gsap-scrolltrigger`, `gsap-react`, `gsap-timeline` for sequences (+ Lenis); `gsap-performance` against jank      |
| Scroll or gesture behaviour to verify     | `verify-interaction` — wheel/trackpad/touch profiles, e2e spec, user's device                                     |
| Where could motion help / audit motion    | `find-animation-opportunities`, `/review-animations`                                                              |
| Naming an effect the user describes       | `animation-vocabulary` via `skill-router` — settle the term before building                                       |
| 3D hero / object from a reference image   | `img2threejs` (R3F + drei + postprocessing)                                                                       |
| Accessibility                             | `better-accessibility` — every new interactive UI                                                                 |
| Metadata, OG, JSON-LD, SEO                | `fixing-metadata`, `schema`, `seo-audit-de`, `ai-seo-de` (DACH versions, not `seo-audit`/`ai-seo`)                |
| Site copy                                 | `product-marketing-de` (context file `.agents/product-marketing.md` first), `copywriting-de`, `vermenschlichen`   |
| Payload collections / data model          | `domain-modeling`, `codebase-design`; `cms-section` to carry a schema change end to end                           |
| New feature with logic                    | `tdd` (pure logic with a colocated `*.test.ts`, like `kontakt/_lib/validation.ts`)                                |
| Bug or regression                         | `diagnosing-bugs`                                                                                                 |
| Security review                           | `security-audit` via `skill-router`                                                                               |
| Work with 5+ steps or spanning sessions   | `planning-with-files`                                                                                             |
| Finding code, callers, impact of a change | graft (`graft ask`, `graft callers`) before grep                                                                  |
| Editing CLAUDE.md or a skill              | `writing-for-agents`                                                                                              |
| Nothing above fits / a specific effect    | read `.claude/skills/skill-router/CATALOG.md` (75 vetted library skills by task and symptom), then `skill-router` |

`minimalist-ui` and `industrial-brutalist-ui` only on explicit request. `web-design-engineer` is for standalone HTML prototypes.

**Where skills live.** Every skill in the table is in `.claude/skills/`: project skills plus core skills vendored from `~/.claude/skills` (list: `skill-router/vendored-skills.txt`; refresh with `skill-router/scripts/vendor-skills.sh`). The library behind the catalog and the router is local symlinks (`.claude/skills-library/`, gitignored): absent in CI, cloud sessions and fresh clones until `skill-router/scripts/link-library.sh` runs. Project rules win over any skill.

## Data sovereignty (hard rule)

No user, visitor or content data leaves our own infrastructure.

- **Browser:** the CSP in `next.config.ts` is enforcing and same-origin only. Every third-party origin (CDN, fonts, analytics, captcha, embeds, avatars) needs explicit approval; self-host instead. `e2e/data-sovereignty.spec.ts` fails on any request to another host.
- **Server:** no SaaS calls with user or content data. Telemetry is off (Payload `telemetry: false`, `NEXT_TELEMETRY_DISABLED=1`, Gravatar via `avatar: "default"`). New services are self-hosted or EU-hosted under our control, after approval.
- **Fonts/assets:** local packages or `public/` only (Geist is bundled) — no `next/font/google`, no remote images.
- **Removed on purpose (US SaaS):** Vercel Analytics/Speed Insights/OTel, Sentry, Upstash, Resend, Cloudflare Turnstile, AI SDK. For a needed capability propose the self-hosted route: analytics → Umami/Plausible, errors → GlitchTip, rate limiting → own Valkey, captcha → honeypot (in place) / ALTCHA, files → MinIO.
- **No email adapter:** Payload logs messages to the server console. Password resets happen in `/admin` or via the Local API; form submissions are read in the admin. Login lockout: Payload's built-in 5 attempts → 10 min.
- **Known gap:** Payload's code/JSON field editor (Monaco) loads from `cdn.jsdelivr.net`. Before adding a `code`/`json` field, self-host Monaco (`loader.config({ monaco })` in an admin provider).

## Commands and checks

- New project from the template: `pnpm init:project` (once, in a fresh copy).
- Local: `pnpm db:up` (Postgres on the port in `docker-compose.yml`), `pnpm seed`, `pnpm dev` (app port in the `dev` script; `PORT=…` overrides). Scripts are in `package.json`.
- `pnpm check` = typecheck + lint (zero warnings) + Vitest + build.
- `pnpm test:e2e` — Playwright on a running dev server (or starts one): `smoke` (console errors + axe WCAG 2 AA on every `SEED_PATHS` route), `data-sovereignty`, `features` (redirect, search, contact form). Needs `pnpm seed`.
- `pnpm knip` — run by hand; it lists planned-but-unused dependencies (motion, gsap, three, …) that stay on purpose.
- Commits: Conventional Commits (commitlint hook); pre-commit runs lint-staged. Prettier with Tailwind class sorting runs on every edited file via `.claude/hooks/format-on-edit.mjs`.
- CI (`.github/workflows/ci.yml`): format:check, typecheck, lint, test, migrate, seed, build, Playwright (production build). Dependabot weekly.

## Gotchas

- **Next 16:** `error.tsx`/`global-error.tsx` receive `retry` (not `reset`); `next/image` uses `preload` (not `priority`); `middleware` is now `proxy.ts`; `<html data-scroll-behavior="smooth">` keeps route changes from animating the scroll. Check `node_modules/next/dist/docs/` before using an API from memory.
- **Typed routes:** hrefs and redirect targets from the CMS need `as never`.
- **React Compiler lint:** `Date.now()` and other impure calls are rejected during render — compute them at module scope or in an effect.
- **Local database runs in Payload dev-push mode:** `pnpm migrate` on it waits for an interactive prompt. Test a migration on a scratch database: `createdb` inside the container, `DATABASE_URL=… pnpm migrate && pnpm seed`, then drop it (seed files land in `/media` — remove the extras).
- **e2e in dev:** Reticle overlays can swallow clicks; `e2e/features.spec.ts` hides them in `beforeEach` — reuse that for new interaction tests.
- **Stale dev SSR:** after a client component is edited, `next dev` can keep serving the old server HTML; a hydration mismatch naming the old `className` means restart it, not a bug.
- **Stopping the dev server:** `pkill -f "[n]ext dev"` — an unbracketed pattern also matches the invoking shell.
- **Skill names:** user-level skills in `~/.claude/skills` shadow project skills of the same name — locally the vendored copies are inactive, so edit a core skill in `~/.claude/skills` and re-vendor. Project variants of a user skill get a suffix (`-de`); the English originals are switched off in `.claude/settings.json` (`skillOverrides`).
- **Several projects side by side:** each has its own app and database port. Playwright reuses whatever server answers on its port — with another project's dev server there, it silently tests the wrong site.
- **graft** keeps its graph in `graft/` (gitignored); a fresh clone needs `graft build`.

## Definition of done

1. `pnpm check` passes.
2. New interactive UI passed `better-accessibility`.
3. The changed flow is verified in the running app (Reticle; scroll and gesture behaviour via `verify-interaction`).
4. `pnpm test:e2e` passes, including data sovereignty; new routes are in `SEED_PATHS`.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
