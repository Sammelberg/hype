# port — portfolio + CMS

Next.js 16 (App Router, React Compiler, typed routes) · Payload CMS 3 (Postgres) · React 19 · TypeScript (strict) · Tailwind CSS v4 · shadcn/ui (radix base, Nova preset) · pnpm. Hosted on our own server at IONOS (Germany) — no Vercel-specific features.

## Product rules

- **German only, Anrede „Sie“.** All visible text, alt texts, metadata and URLs are German (`/projekte/…`, `/kontakt`). `<html lang="de">`, `og:locale de_DE`. No i18n layer (`next-intl` is installed but unused).
- **Legal pages:** Impressum and Datenschutzerklärung are Payload pages (slugs `impressum`, `datenschutz`, linked in the footer). The owner writes legal text; seeded versions are marked „Platzhalter“.
- **Data sovereignty** is a hard rule — see its section before adding any service, origin, font or asset.

## Code map

- `app/(frontend)/` — public site: `/`, `/projekte/[slug]`, `/[...slug]` (Payload pages, nested via breadcrumbs), `/suche` (dynamic, noindex), `/kontakt`, German `error.tsx` + `app/global-error.tsx`, placeholder `icon.tsx`/`apple-icon.tsx`, `opengraph-image.tsx` (next/og, local). `app/sitemap.ts`, `app/robots.ts`.
- `app/(payload)/` — admin (`/admin`) and API (`/api`); generated, including `admin/importMap.js` → `pnpm generate:importmap` after adding admin components.
- `lib/queries.ts` — all frontend data access (React `cache`, draft-mode aware). `lib/seo.tsx` — `buildMetadata`, `JsonLd`, `mediaUrl`. `lib/payload.ts` — `getPayloadClient()` (Local API).
- `env.ts` — validated env; import `env`, never `process.env`. New variables go into `env.ts` and `.env.example`.
- `components/ui/` — shadcn (add via `pnpm dlx shadcn@latest add <name>`, then adapt). `components/site/` — app components. `cn` comes from the `cn` package (`lib/utils.ts`).
- `app/reticle-dev.tsx` — dev-only Reticle bridge in the frontend layout.

## CMS (Payload)

- `payload.config.ts`, `collections/` (Users, Media, Projects, Pages), `globals/SiteSettings.ts` (site name, owner, tagline, SEO description, contact email, profile links). Admin UI is German. These files use **relative imports** — the Payload CLI does not resolve `@/`.
- **Revalidation:** pages are static; publishing rebuilds them instantly via `hooks/revalidate.ts`. A collection that feeds fixed paths gets `revalidatePathsOf(...)`.
- **Draft preview:** live preview → `/next/preview?path=…` (needs a Payload session, enables draft mode) → `RefreshOnSave`; `/next/exit-preview` ends it.
- **Plugins:** seo, nested-docs, storage-s3 (auto-on when S3 env is set; self-hosted/EU endpoint only), plus three wired into the site:
  - **redirects** — 301/302, `from` is normalized (`lib/redirects.ts`). CMS routes call `redirectOrNotFound(path)` instead of `notFound()`.
  - **search** — index carries `summary` and `url`; `/suche` queries it.
  - **form-builder** — the form titled „Kontakt“ renders at `/kontakt`. The server action validates with `lib/contact.ts` (German messages, honeypot, minimum fill time) and writes via the Local API; public REST creation of submissions is closed. Email settings and US-only blocks are removed.
- **Uploads** live on local disk in `/media` (gitignored; a persistent volume in production).
- **Schema changes:** dev pushes automatically. Before merging: `pnpm migrate:create <name>`, then `pnpm generate:types`, commit `migrations/` and `payload-types.ts`. CI runs `pnpm migrate`.
- **Dev content:** `pnpm seed` (`scripts/seed-data.ts`) — fictional projects, placeholder legal pages, a nested page, the „Kontakt“ form, redirect `/projekte/museum`. Idempotent, local databases only, creates no users (first admin signs up at `/admin`). Every new route gets seeded content and an entry in `SEED_PATHS`, which feeds the e2e tests.

## Styling

- `app/(frontend)/globals.css` holds all tokens; it is imported only by the frontend layout, so the admin stays unstyled by it.
- **Dark mode follows the OS** (`prefers-color-scheme`); `dark:` variants and dark tokens are media-query based — there is no `.dark` class or toggle.
- **Fibonacci layout system** (overrides any skill that prescribes a 4/8 grid):
  - page shell `page-container` (max 1536px, fluid `px-gutter` 21→55px); sections `py-section`/`mt-section` (55→144px); content grids `gap-grid` (13→34px); fixed steps `*-fib-2xs … *-fib-4xl` (5…233px);
  - golden ratio: `aspect-golden` for covers and cards, `grid-cols-golden` (61.8/38.2) for text + sidebar;
  - Tailwind's default scale stays for component internals; long text keeps a reading width (`max-w-3xl`, `max-w-prose`);
  - `--container-sm…2xl` stay untouched — shadcn's `max-w-*` depend on them.
- **Motion:** `motion/react` for component/UI motion; GSAP (+ Lenis) only for scroll-driven or timeline sequences; one system per element; always honour `prefers-reduced-motion`.
- `baseline-ui` is the default constraint set. Gradients, glow, custom easing or extra animation need an explicit request or a chosen art direction.
- Reuse existing tokens, components and fonts; a new dependency needs approval.

## Which skill to use

Load the skill before starting the work.

| Task                                      | Skills                                                                                                          |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| New page, section or visual direction     | `frontend-design`, then `baseline-ui` as the constraint pass                                                    |
| Several design options to choose from     | `variate`                                                                                                       |
| UI components                             | `shadcn` (existing component first), then `/break` on anything rendering CMS content                            |
| Typography / colour / tokens              | `better-typography`, `better-colors`                                                                            |
| Component motion, hovers, dialogs, cmdk   | `animate` + `emil-design-eng`; `apple-design` for springs/gestures                                              |
| Scroll-driven motion, pinning, parallax   | `gsap-scrolltrigger`, `gsap-react` (+ Lenis)                                                                    |
| Where could motion help / audit motion    | `find-animation-opportunities`, `/review-animations`                                                            |
| 3D hero / object from a reference image   | `img2threejs` (R3F + drei + postprocessing)                                                                     |
| Accessibility                             | `fixing-accessibility` — every new interactive UI                                                               |
| Metadata, OG, JSON-LD, SEO                | `fixing-metadata`, `schema`, `seo-audit-de`, `ai-seo-de` (DACH versions, not `seo-audit`/`ai-seo`)              |
| Site copy                                 | `product-marketing-de` (context file `.agents/product-marketing.md` first), `copywriting-de`, `vermenschlichen` |
| Project pages / case studies              | `case-study`, then `copywriting-de`                                                                             |
| Payload collections / data model          | `domain-modeling`, `codebase-design`                                                                            |
| New feature with logic                    | `tdd` (pure logic in `lib/` with `*.test.ts`, like `lib/contact.ts`)                                            |
| Bug or regression                         | `diagnosing-bugs`                                                                                               |
| Work with 5+ steps or spanning sessions   | `planning-with-files`                                                                                           |
| Finding code, callers, impact of a change | graft (`graft ask`, `graft callers`) before grep                                                                |
| Editing CLAUDE.md or a skill              | `writing-for-agents` (via `skill-router`)                                                                       |
| Nothing above fits / a specific effect    | `skill-router` — the ~460-skill library in `.claude/skills-library/` (local only; project rules win)            |

`minimalist-ui` and `industrial-brutalist-ui` only on explicit request. `web-design-engineer` is for standalone HTML prototypes.

## Data sovereignty (hard rule)

No user, visitor or content data leaves our own infrastructure.

- **Browser:** the CSP in `next.config.ts` is enforcing and same-origin only. Every third-party origin (CDN, fonts, analytics, captcha, embeds, avatars) needs explicit approval; self-host instead. `e2e/data-sovereignty.spec.ts` fails on any request to another host.
- **Server:** no SaaS calls with user or content data. Telemetry is off (Payload `telemetry: false`, `NEXT_TELEMETRY_DISABLED=1`, Gravatar via `avatar: "default"`). New services are self-hosted or EU-hosted under our control, after approval.
- **Fonts/assets:** local packages or `public/` only (Geist is bundled) — no `next/font/google`, no remote images.
- **Removed on purpose (US SaaS):** Vercel Analytics/Speed Insights/OTel, Sentry, Upstash, Resend, Cloudflare Turnstile, AI SDK. For a needed capability propose the self-hosted route: analytics → Umami/Plausible, errors → GlitchTip, rate limiting → own Valkey, captcha → honeypot (in place) / ALTCHA, files → MinIO.
- **No email adapter:** Payload logs messages to the server console. Password resets happen in `/admin` or via the Local API; form submissions are read in the admin. Login lockout: Payload's built-in 5 attempts → 10 min.
- **Known gap:** Payload's code/JSON field editor (Monaco) loads from `cdn.jsdelivr.net`. Before adding a `code`/`json` field, self-host Monaco (`loader.config({ monaco })` in an admin provider).

## Commands and checks

- Local: `pnpm db:up` (Postgres on 5433), `pnpm seed`, `pnpm dev`. Scripts are in `package.json`.
- `pnpm check` = typecheck + lint (zero warnings) + Vitest + build.
- `pnpm test:e2e` — Playwright on a running dev server (or starts one): `smoke` (console errors + axe WCAG 2 AA on every `SEED_PATHS` route), `data-sovereignty`, `features` (redirect, search, contact form, dark-mode a11y). Needs `pnpm seed`.
- `pnpm knip` — run by hand; it lists planned-but-unused dependencies (motion, gsap, three, …) that stay on purpose.
- Commits: Conventional Commits (commitlint hook); pre-commit runs lint-staged. Prettier with Tailwind class sorting runs on every edited file via `.claude/hooks/format-on-edit.mjs`.
- CI (`.github/workflows/ci.yml`): format:check, typecheck, lint, test, migrate, seed, build, Playwright (production build). Dependabot weekly.

## Gotchas

- **Next 16:** `error.tsx`/`global-error.tsx` receive `retry` (not `reset`); `next/image` uses `preload` (not `priority`); `middleware` is now `proxy.ts`; `<html data-scroll-behavior="smooth">` keeps route changes from animating the scroll. Check `node_modules/next/dist/docs/` before using an API from memory.
- **Typed routes:** hrefs and redirect targets from the CMS need `as never`.
- **React Compiler lint:** `Date.now()` and other impure calls are rejected during render — compute them at module scope or in an effect.
- **Local database runs in Payload dev-push mode:** `pnpm migrate` on it waits for an interactive prompt. Test a migration on a scratch database: `createdb` inside the container, `DATABASE_URL=… pnpm migrate && pnpm seed`, then drop it (seed files land in `/media` — remove the extras).
- **e2e in dev:** Reticle overlays can swallow clicks; `e2e/features.spec.ts` hides them in `beforeEach` — reuse that for new interaction tests.
- **Stopping the dev server:** `pkill -f "[n]ext dev"` — an unbracketed pattern also matches the invoking shell.
- **Skill names:** user-level skills in `~/.claude/skills` shadow project skills of the same name; project variants get a suffix (`-de`).

## Definition of done

1. `pnpm check` passes.
2. New interactive UI passed `fixing-accessibility`.
3. The changed flow is verified in the running app (Reticle; a Playwright script for viewport-dependent checks).
4. `pnpm test:e2e` passes, including data sovereignty; new routes are in `SEED_PATHS`.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
