# SAVO Technologies — Website (v6)

Production-grade Next.js website for **SAVO Technologies** — a technology
services company (web, mobile, AI, software, design, growth) — with a
PostgreSQL-backed lead pipeline, an operations admin panel, and a strong
SEO / AEO / GEO foundation for classic and AI-driven search.

- **Live (dev server):** http://localhost:4311 · **Admin:** http://localhost:4311/admin
- Stack: **Next.js 16 (App Router) · React 19 · TypeScript (strict) · Tailwind v4 · PostgreSQL + Prisma 6 · Zod · Vitest**

---

## Contents

1. [Quick start](#quick-start)
2. [Environment variables](#environment-variables)
3. [Scripts](#scripts)
4. [Architecture](#architecture)
5. [Admin panel](#admin-panel)
6. [Content model: constants → DB → fallback](#content-model-constants--db--fallback)
7. [Security posture](#security-posture)
8. [SEO / AEO / GEO](#seo--aeo--geo)
9. [Testing & CI](#testing--ci)
10. [Adding a new public page](#adding-a-new-public-page)
11. [Deployment notes](#deployment-notes)

---

## Quick start

```bash
# 1. Install
npm install

# 2. Environment
cp .env.example .env        # then edit values (see below)

# 3. Database (PostgreSQL must be running)
npm run db:push             # apply schema
npm run db:seed             # create the admin user (ADMIN_EMAIL/ADMIN_PASSWORD)

# 4. Run
npm run dev                 # development
npm run build && npm start  # production
```

Prerequisites: **Node 20+** (22 recommended), **PostgreSQL 14+**.

## Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | yes | PostgreSQL connection (enquiries, admin, content) |
| `NEXT_PUBLIC_SITE_URL` | yes | Canonical origin for metadata/sitemap/JSON-LD |
| `ENQUIRY_IP_SALT` | prod | Pepper for hashing enquirer IPs at rest |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | seed only | Initial admin (bcrypt-hashed by `db:seed`) |
| `NEXT_PUBLIC_GA_ID` | no | GA4 id; analytics stay inert when unset |
| `LOG_LEVEL` | no | `debug·info·warn·error` (default `info`) |

Server-only variables are validated and typed in `src/lib/env.ts`; they are
never imported into client components.

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` / `npm start` | Production build / serve |
| `npm run lint` | ESLint (flat config, next/core-web-vitals) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run test:run` | Vitest unit + integration (44 tests) |
| `npm run test:e2e` | Playwright-core smoke suite — needs the server running |
| `npm run db:push` / `db:seed` / `db:studio` | Prisma schema push / seeding / studio |

## Architecture

See **[ARCHITECTURE.md](./ARCHITECTURE.md)** for the full map. Summary:

```text
src/
├── app/
│   ├── (site)/               # public site: chrome + homepage (future pages go here)
│   ├── admin/                # login + (protected)/ panel — own chrome, noindex
│   ├── api/                  # enquiries · callback · health
│   ├── llms.txt/ llms-full.txt/  # AEO/GEO artifacts
│   ├── robots.ts sitemap.ts icon.svg
│   ├── error.tsx global-error.tsx not-found.tsx
│   └── layout.tsx            # root shell: fonts, GA, design contract
├── components/  ui/ layout/ shared/ admin/
├── sections/    home/        # homepage narrative sections (RSC)
├── constants/   site navigation services content
├── lib/         env prisma auth audit api logger phone settings collections
│                rate-limit enquiry-status utils analytics
├── schemas/     enquiry.ts (zod, shared client+server)
└── middleware.ts            # admin gate + API cross-origin guard
scripts/  seed.mjs verify.mjs
tests/    *.test.ts (vitest) + stubs/
prisma/   schema.prisma
```

Layering rule: **routes → features/sections → lib (server-only where marked) →
prisma**. `server-only` imports guard privileged modules from leaking into
client bundles.

## Admin panel

`/admin` — session-based (HttpOnly cookie, SHA-256-hashed token in the DB,
12-hour expiry, revocable). Middleware gates cookie-less requests; every
page/action re-authorizes server-side. Two roles: **admin** (full) and
**editor** (content + inbox, no destructive ops).

- **Dashboard** — lead health at a glance
- **Enquiries** — filter/paginate inbox, status workflow, internal notes,
  delete with two-step confirm (admin role only)
- **Services / Industries** — full CRUD on the managed collections that
  drive the public header panels and future pages; one-click **Import
  version-1 defaults** materializes the canonical baseline
- **Settings** — contact email/phone overrides (footer, structured data)
  with public-page regeneration on save

Every mutation is zod-validated, audited (`audit_logs`), and triggers
`revalidatePath("/", "layout")` so static public pages regenerate on demand.

## Content model: constants → DB → fallback

1. **Constants** (`src/constants/`) are the seed of truth — the version-1
   architecture, editorial homepage copy, design metadata.
2. **Admin import** copies a collection into PostgreSQL (editable rows).
3. **Public pages** read the DB via `src/lib/collections.ts`; if the table
   is empty or the DB is unreachable, they **fall back to constants** — the
   site can never break over content.

## Security posture

- Strict CSP (no external script/font origins; GA only when configured),
  HSTS + full header set in `next.config.ts`
- Zod validation at every trust boundary; honeypots + sliding-window rate
  limits on public forms (5/h/IP) and admin login (8/15min/IP+email)
- IP addresses stored only as salted SHA-256 prefixes (data minimisation)
- Session tokens hashed at rest; bcrypt(12) passwords; constant-time compare
- Server-side authorization on every admin mutation; destructive actions
  require the admin role + explicit confirm step
- Cross-origin POSTs to `/api/*` rejected (middleware + route guards)
- `robots.txt` excludes `/admin`; admin pages carry noindex metadata

## SEO / AEO / GEO

- Per-page metadata via root template + `%s | SAVO Technologies`; canonical
  URLs from `NEXT_PUBLIC_SITE_URL`
- JSON-LD: Organization (contact, offers catalog, areaServed, sameAs) +
  WebSite — mirrors **visible** content only
- `sitemap.xml`, `robots.txt` with explicit AI-crawler welcome (GPTBot,
  ClaudeBot, PerplexityBot, …)
- `/llms.txt` + `/llms-full.txt` — machine-readable company/service facts
  for answer engines (AEO/GEO)
- Semantic landmarks, single h1, skip link, breadcrumb-ready structure

## Testing & CI

- **Vitest**: 44 unit/integration tests — phone rules, rate limiter, API
  helpers (origin/JSON/size), enquiry schema, route handlers with mocked
  Prisma (415/400/429/honeypot/200 paths), auth crypto, status vocabulary
- **`scripts/verify.mjs`** (Playwright-core, Chrome): 42 end-to-end checks —
  responsive overflow, fonts, images, menus, dialog a11y, SEO/AEO endpoints,
  admin gate, CSRF guard, health
- **GitHub Actions** (`.github/workflows/ci.yml`): install → lint →
  typecheck → tests → build → audit report

## Adding a new public page

1. Create `src/app/(site)/<segment>/page.tsx` — it inherits header/footer,
   skip link and JSON-LD from the group layout.
2. Export `metadata` (`title` fills the template; set `alternates.canonical`).
3. Add the route to `src/app/sitemap.ts` and (if applicable) `llms-full.txt`.
4. Navigation: add to `src/constants/navigation.ts` (or the DB collection via
   admin) — future-ready hrefs already resolve to the designed 404.
5. Follow the v6 design tokens (`DESIGN.md`) and section primitives in
   `src/components/ui/`.

## Deployment notes

- Set a **real** `NEXT_PUBLIC_SITE_URL` (production domain) — it drives
  canonicals; changing it later affects SEO.
- Generate `ENQUIRY_IP_SALT` with `openssl rand -hex 32`.
- `npm run db:seed` with real `ADMIN_EMAIL`/`ADMIN_PASSWORD` (required in
  production; rotate the password after first login when a change-password
  flow exists).
- The admin panel assumes an HTTPS-terminating proxy in production
  (Secure cookies auto-enabled when `NODE_ENV=production`).
- Keep Prisma on the pinned major (6.x) — see ENGINEERING report §J.

---

Design system: **[DESIGN.md](./DESIGN.md)** · Product brief:
**[PRODUCT.md](./PRODUCT.md)** · Engineering report:
**[docs/ENGINEERING-REPORT.md](./docs/ENGINEERING-REPORT.md)**
