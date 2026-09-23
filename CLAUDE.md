# port — portfolio + CMS

Next.js 16 (App Router, React Compiler, typed routes) · Payload CMS 3 (Postgres) · React 19 · TypeScript (strict) · Tailwind CSS v4 · shadcn/ui (radix base, Nova preset) · pnpm.

## Layout

- `app/(frontend)/` — public site. `globals.css` here holds Tailwind + shadcn theme tokens; import it only from the frontend layout so styles never leak into the Payload admin.
- `app/(payload)/` — Payload admin (`/admin`) and API (`/api`). Files there and `app/(payload)/admin/importMap.js` are generated — don't hand-edit; run `pnpm generate:importmap` after adding custom admin components.
- `payload.config.ts` + `collections/` (Users, Media, Projects, Pages). Plugins: seo, nested-docs, redirects, search, form-builder, storage-s3 (auto-on when S3 env is set), Resend email (auto-on when key is set). `payload-types.ts` is generated: `pnpm generate:types` after any schema change.
- `lib/payload.ts` — `getPayloadClient()` for server components (Local API, no HTTP).
- `env.ts` — validated env (`@t3-oss/env-nextjs`); import `env` instead of reading `process.env`. New variables go into `env.ts` and `.env.example`.
- `app/reticle-dev.tsx` — dev-only Reticle bridge, mounted in the frontend layout.
- `components/ui/` — shadcn components (add via CLI, then adapt). `components/` — app components. `lib/` — utilities (`cn` comes from the `cn` package via `lib/utils.ts`).
- Import alias: `@/*` → project root.

## Commands

- `pnpm db:up` / `pnpm db:down` — local Postgres (docker-compose, port 5433). Then `pnpm dev`.
- Schema changes: dev auto-pushes; before merging create a migration with `pnpm migrate:create <name>` (auto-fixes type imports), commit `migrations/`. `pnpm migrate` applies them (CI runs it before build).
- `pnpm dev` · `pnpm build`
- `pnpm check` = typecheck + lint + test + build — must pass before a task is called done.
- `pnpm test` (Vitest, jsdom, `*.test.ts(x)`), `pnpm lint` (zero warnings), `pnpm typecheck`, `pnpm format`.
- `pnpm test:e2e` (Playwright, `e2e/`, reuses a running dev server or starts one; `e2e/smoke.spec.ts` checks console errors + axe WCAG 2 AA).
- `pnpm knip` — unused files/deps/exports. Not in `check`/CI yet (every dep is unused until app code exists); add it back once pages exist.
- `pnpm analyze` — bundle analyzer build.
- shadcn: `pnpm dlx shadcn@latest add <component>`.
- Commits: Conventional Commits, enforced by the commit-msg hook (commitlint); pre-commit runs lint-staged.
- Formatting is automatic: Prettier (with Tailwind class sorting for `cn`/`cva`) runs on every file Claude edits via `.claude/hooks/format-on-edit.mjs`. ESLint also checks Tailwind class correctness (conflicts, unknown/deprecated classes).
- CI: `.github/workflows/ci.yml` — Postgres service, format:check, typecheck, lint, test, migrate, build, Playwright e2e. Dependabot updates weekly (grouped).
- Security headers + CSP live in `next.config.ts`. CSP is **Report-Only**: when adding a third-party script/iframe/API origin, add it to the CSP list; switch to enforcing once no violations appear.

## Which skill to use

Pick skills by task; load them before starting the work, not after.

| Task                                      | Skills                                                                                      |
| ----------------------------------------- | ------------------------------------------------------------------------------------------- |
| New page, section or visual direction     | `frontend-design`, then `baseline-ui` as the constraint pass                                |
| Several design options to choose from     | `variate`                                                                                   |
| UI components                             | `shadcn` (use an existing component first), then `/break` on anything rendering CMS content |
| Typography / colour / tokens              | `better-typography`, `better-colors`                                                        |
| Component motion, hovers, dialogs, cmdk   | `motion` (`motion/react`) + `emil-design-eng`; `apple-design` for springs/gestures          |
| Scroll-driven motion, pinning, parallax   | GSAP ScrollTrigger + Lenis (`gsap-scrolltrigger`, `gsap-react`)                             |
| Where could motion help / audit motion    | `find-animation-opportunities`, `/review-animations`                                        |
| 3D hero / object from a reference image   | `img2threejs` (R3F + drei + postprocessing)                                                 |
| Accessibility                             | `fixing-accessibility` — run on every new interactive UI                                    |
| Metadata, OG, JSON-LD, SEO                | `fixing-metadata`, `schema`, `seo-audit`, `ai-seo`                                          |
| Site copy                                 | `product-marketing` (context file first), then `copywriting`                                |
| Payload collections / data model          | `domain-modeling`, `codebase-design`                                                        |
| New feature with logic                    | `tdd`                                                                                       |
| Bug or regression                         | `diagnosing-bugs`                                                                           |
| Work with 5+ steps or spanning sessions   | `planning-with-files`                                                                       |
| Finding code, callers, impact of a change | Graft MCP tools (`graft_find_code`, `graft_trace_calls`) before grep                        |
| Verifying a UI flow actually works        | Reticle MCP (once `reticle init` has run and the dev server is up)                          |

Style skills `minimalist-ui` and `industrial-brutalist-ui` apply only when explicitly requested. `web-design-engineer` is for standalone HTML prototypes, not this app.

## Conflict rules

- Two animation systems, two jobs: `motion/react` for component/UI motion; GSAP (+ Lenis) only for scroll-driven or timeline sequences. Never both on the same element. Always respect `prefers-reduced-motion`.
- `baseline-ui` is the default constraint set. Deviations (gradients, glow, custom easing, extra animation) need an explicit request or a chosen art direction.
- Use the project's existing tokens, components and fonts before adding new ones; no new dependency without asking.
- Keep changes scoped to the request (`karpathy-guidelines`).

## Data sovereignty (hard rule)

No user, visitor or content data may leave our own infrastructure.

- **Browser:** CSP is enforcing and same-origin only (`next.config.ts`). Never add a third-party origin (CDN, fonts, analytics, captcha, embeds, avatars) without explicit approval; prefer self-hosting. `e2e/data-sovereignty.spec.ts` fails on any request to another host — keep it green, extend its page list when adding routes.
- **Server:** no SaaS calls with user/content data. Telemetry is off: Payload `telemetry: false`, `NEXT_TELEMETRY_DISABLED=1`, Gravatar disabled (`avatar: "default"`). New services must be self-hosted or EU-hosted under our control, and need approval first.
- **Fonts/assets:** only from local packages or `public/` (Geist is bundled). Never `next/font/google` or remote images without approval.
- **Known gap:** Payload's code/JSON field editor (Monaco) loads from `cdn.jsdelivr.net` by default — CSP blocks it. Before adding a `code`/`json` field, self-host Monaco (`loader.config({ monaco })` in an admin provider).
- Installed but intentionally NOT wired (US SaaS): `@vercel/analytics`, `@vercel/speed-insights`, `@vercel/otel`, `@sentry/nextjs`, `@upstash/*`, `resend`/`@payloadcms/email-resend`, `@marsidev/react-turnstile`, `ai`/`@ai-sdk/*`. Do not wire them.

## Definition of done

1. `pnpm check` passes.
2. New interactive UI passed `fixing-accessibility`.
3. Once the dev server exists: the changed flow is verified with Reticle.
4. `pnpm test:e2e` passes, including the data-sovereignty test.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
