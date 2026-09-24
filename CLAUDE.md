# starter — Next + Payload template

This repo is a **starter template**. In a fresh copy, `pnpm init:project` sets name, database, accent colour and seed identity (see `README.md`); after that, rewrite this file's title line and the home page for the actual project.

Next.js 16 (App Router, React Compiler, typed routes) · Payload CMS 3 (Postgres) · React 19 · TypeScript (strict) · Tailwind CSS v4 · shadcn/ui (radix base, Nova preset) · pnpm. Hosted on our own server at IONOS (Germany) — no Vercel-specific features.

## Product rules

- **German only, Anrede „Sie“.** All visible text, alt texts, metadata and URLs are German (`/kontakt`, `/suche`, `/ueber-uns`). `<html lang="de">`, `og:locale de_DE`. No i18n layer (`next-intl` is installed but unused).
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

- `src/app/(frontend)/globals.css` holds all tokens; it is imported only by the frontend layout, so the admin stays unstyled by it.
- **Dark-only brand palette:** black and its shades + one accent `--brand-accent` (default cyan `#01ccff`; feeds `--primary`, `--ring`, the chart ramp). No light theme, no toggle; `dark:` variants always apply. The accent marks interactive/primary things only. The OG image repeats it as hex (`ACCENT` in `opengraph-image.tsx`).
- **Fibonacci layout system** (overrides any skill that prescribes a 4/8 grid):
  - page shell `page-container` (max 1920px, fluid `px-gutter` 21→55px); sections `py-section`/`mt-section` (55→144px); content grids `gap-grid` (13→34px); fixed steps `*-fib-2xs … *-fib-4xl` (5…233px);
  - golden ratio: `aspect-golden` for covers and cards, `grid-cols-golden` (61.8/38.2) for text + sidebar;
  - Tailwind's default scale stays for component internals; long text keeps a reading width (`max-w-3xl`, `max-w-prose`);
  - `--container-sm…2xl` stay untouched — shadcn's `max-w-*` depend on them.
- **Motion:** `motion/react` for component/UI motion; GSAP (+ Lenis) only for scroll-driven or timeline sequences; one system per element; always honour `prefers-reduced-motion`. Curves are the tokens in `globals.css`: `--ease-out` for entering and UI state, `--ease-in-out` for an element moving on screen, `--ease-drawer` for sheets; scrubbed scroll motion uses `ease: "none"`. UI durations stay on Tailwind's 150/200/300/500; only a single emphasis moment (e.g. a hero line rise) runs 0.8–1.1s. A page that runs Lenis registers it in `src/lib/smooth-scroll.ts` so the menu can pause it.
- `baseline-ui` is the default constraint set. Gradients, glow, custom easing or extra animation need an explicit request or a chosen art direction.
- Reuse existing tokens, components and fonts; a new dependency needs approval.

## Which skill to use

Load the skill before starting the work.

| Task                                      | Skills                                                                                                                      |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| New page, section or visual direction     | `frontend-design`, then `baseline-ui` as the constraint pass                                                                |
| Several design options to choose from     | `variate`                                                                                                                   |
| UI components                             | `shadcn` (existing component first), then `/break` on anything rendering CMS content                                        |
| Typography / colour / tokens              | `better-typography`, `better-colors`                                                                                        |
| Component motion, hovers, dialogs, cmdk   | `animate` + `emil-design-eng`; `apple-design` for springs/gestures                                                          |
| Scroll-driven motion, pinning, parallax   | `gsap-scrolltrigger`, `gsap-react`, `gsap-timeline` for sequences (+ Lenis); `gsap-performance` against jank                |
| Scroll or gesture behaviour to verify     | `verify-interaction` — wheel/trackpad/touch profiles, e2e spec, user's device                                               |
| Where could motion help / audit motion    | `find-animation-opportunities`, `/review-animations`                                                                        |
| Naming an effect the user describes       | `animation-vocabulary` via `skill-router` — settle the term before building                                                 |
| 3D hero / object from a reference image   | `img2threejs` (R3F + drei + postprocessing)                                                                                 |
| Accessibility                             | `better-accessibility` — every new interactive UI                                                                           |
| Metadata, OG, JSON-LD, SEO                | `fixing-metadata`, `schema`, `seo-audit-de`, `ai-seo-de` (DACH versions, not `seo-audit`/`ai-seo`)                          |
| Site copy                                 | `product-marketing-de` (context file `.agents/product-marketing.md` first), `copywriting-de`, `vermenschlichen`             |
| Payload collections / data model          | `domain-modeling`, `codebase-design`; `cms-section` to carry a schema change end to end                                     |
| New feature with logic                    | `tdd` (pure logic with a colocated `*.test.ts`, like `kontakt/_lib/validation.ts`)                                          |
| Bug or regression                         | `diagnosing-bugs`                                                                                                           |
| Security review                           | `security-audit` via `skill-router`                                                                                         |
| Work with 5+ steps or spanning sessions   | `planning-with-files`                                                                                                       |
| Finding code, callers, impact of a change | graft (`graft ask`, `graft callers`) before grep                                                                            |
| Editing CLAUDE.md or a skill              | `writing-for-agents`                                                                                                        |
| Nothing above fits / a specific effect    | the library catalog below first, then `skill-router` for the rest of the ~470-skill library (local only; project rules win) |

`minimalist-ui` and `industrial-brutalist-ui` only on explicit request. `web-design-engineer` is for standalone HTML prototypes.

@.claude/skills/skill-router/CATALOG.md

## Data sovereignty (hard rule)

No user, visitor or content data leaves our own infrastructure.

- **Browser:** the CSP in `next.config.ts` is enforcing and same-origin only. Every third-party origin (CDN, fonts, analytics, captcha, embeds, avatars) needs explicit approval; self-host instead. `e2e/data-sovereignty.spec.ts` fails on any request to another host.
- **Server:** no SaaS calls with user or content data. Telemetry is off (Payload `telemetry: false`, `NEXT_TELEMETRY_DISABLED=1`, Gravatar via `avatar: "default"`). New services are self-hosted or EU-hosted under our control, after approval.
- **Fonts/assets:** local packages or `public/` only (Geist is bundled) — no `next/font/google`, no remote images.
- **Removed on purpose (US SaaS):** Vercel Analytics/Speed Insights/OTel, Sentry, Upstash, Resend, Cloudflare Turnstile, AI SDK. For a needed capability propose the self-hosted route: analytics → Umami/Plausible, errors → GlitchTip, rate limiting → own Valkey, captcha → honeypot (in place) / ALTCHA, files → MinIO.
- **No email adapter:** Payload logs messages to the server console. Password resets happen in `/admin` or via the Local API; form submissions are read in the admin. Login lockout: Payload's built-in 5 attempts → 10 min.
- **Known gap:** Payload's code/JSON field editor (Monaco) loads from `cdn.jsdelivr.net`. Before adding a `code`/`json` field, self-host Monaco (`loader.config({ monaco })` in an admin provider).

## Commands and checks

- Local: `pnpm db:up` (Postgres on the port in `docker-compose.yml`), `pnpm seed`, `pnpm dev`. Scripts are in `package.json`.
- `pnpm check` = typecheck + lint (zero warnings) + Vitest + build.
- `pnpm test:e2e` — Playwright on a running dev server (or starts one): `smoke` (console errors + axe WCAG 2 AA on every `SEED_PATHS` route), `data-sovereignty`, `features` (redirect, search, contact form, dark-only palette + a11y), `menu` (open/close keeps scroll position and layout; runs with real scrollbars). Needs `pnpm seed`.
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
- **Skill names:** user-level skills in `~/.claude/skills` shadow project skills of the same name; project variants get a suffix (`-de`).

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
