# Savo Technologies — Website (v7)

Next.js corporate website and lead platform for **Savo Technologies**, with
PostgreSQL-backed enquiries, an operations admin panel, client/employee
portals, managed content, chat and meeting scheduling.

- **Current local review:** http://localhost:4312 · **Admin:** http://localhost:4312/admin
- Stack: **Next.js 16.3.8 (App Router) · React 19.2.8 · TypeScript (strict) · Tailwind v4 · PostgreSQL + Prisma 6 · Zod · Vitest**

## Enterprise audit status

Hardening is **in progress**, not a production-readiness certification.
Start with the verified [architecture/risk assessment and prioritized plan](docs/enterprise/ASSESSMENT.md)
and the verified changes in [Steps 01](docs/enterprise/STEP-01.md)–[06](docs/enterprise/STEP-06.md) and the [Step 07 performance and cleanup record](docs/enterprise/STEP-07.md).
Read [runtime/release prerequisites](docs/enterprise/RUNTIME-OPERATIONS.md) before promotion;
live mail now requires explicit opt-in and previews must keep it off.
Legacy sections below are being reconciled incrementally; the audit records
identify unverified deployment, database, email and privacy assumptions.
Production promotion still requires the reviewed [dev → test → prod workflow](docs/WORKFLOW.md).

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
# 1. Deterministic install
npm ci

# 2. Environment
cp .env.example .env        # then edit values (see below)

# 3. LOCAL database only (verify DATABASE_URL before these commands)
# Never use this quick-start schema push/seed against production.
npm run db:push             # local development schema
npm run db:seed             # local admin user (ADMIN_EMAIL/ADMIN_PASSWORD)

# 4. Run
npm run dev -- -p 4312       # development review
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
| `npm run test:run` | Vitest unit + integration suite |
| `npm run test:e2e` | Playwright-core smoke suite — needs the server running |
| `npm run db:push` / `db:seed` / `db:studio` | Prisma schema push / seeding / studio |

## Architecture

See **[ARCHITECTURE.md](./ARCHITECTURE.md)** for the full map. Summary:

```text
src/
├── app/
│   ├── (site)/               # public site: chrome + homepage + case studies + contact + careers (future pages go here)
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

The panel is a NextAdmin-style operations console: light theme, grouped
sidebar with expandable submenus and live counts (collapses to an icon
rail on desktop, drawer on mobile), breadcrumbs, and white rounded cards.

- **Dashboard** — stat tiles, lead pipeline breakdown, latest enquiries,
  recent activity, content status matrix
- **Enquiries** — one inbox for every public form (Start a project,
  Contact, Careers applications, callbacks): status tabs, type filters,
  full-text search, pagination, status workflow, internal notes, complete
  structured form data per submission, two-step delete (admin role only)
- **Website content** — sidebar submenu with a hub page and full CRUD
  (add / edit / hide / reorder / two-step delete / import defaults) for:
  **Services**, **Industries** (dedicated tables) plus the generic
  `content_items` collections — **Insights articles**, **Careers roles**,
  **Case studies**, **Hire roles**, **AI services**, **AI agents**
- **Site settings** — contact email/phone overrides plus an announcement
  line rendered above the site header when set
- **Panel users** (admin role) — create users, change name/role, remove;
  sessions revoke on change
- **Audit log** — filterable, append-only trail of every panel action

Every mutation is zod-validated, audited (`audit_logs`), invalidates the tagged public-content cache where applicable, and triggers `revalidatePath("/", "layout")` for public rendering.

Every public form stores its complete structured payload (`form_data`
JSON: careers city/skills/notice/CTC/links, callback country, form origin)
alongside the enquiry columns, so the inbox shows exactly what was
submitted.

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
- **URL shape policy:** the site serves extension-less, non-trailing-slash
  URLs (`trailingSlash: false` default). `absoluteUrl()` and every canonical/
  sitemap/JSON-LD emitter normalize to that shape so no emitted URL 308-
  redirects — keep new pages on this policy
- Open Graph: `openGraphFor()` in `src/lib/seo.ts` builds the full og:* set
  (type, site_name, locale, image, title, description, url) — Next.js
  *replaces* (not merges) a parent's `openGraph` when a page defines its own,
  so always use the helper instead of an inline object; default social card
  is statically generated by `src/app/opengraph-image.tsx` (pages can pass
  `images` to override, e.g. industry hero photography)
- JSON-LD: Organization (contact, offers catalog, areaServed, sameAs) +
  WebSite — mirrors **visible** content only
- `sitemap.xml`, `robots.txt` with explicit AI-crawler welcome (GPTBot,
  ClaudeBot, PerplexityBot, …)
- `/llms.txt` + `/llms-full.txt` — machine-readable company/service facts
  for answer engines (AEO/GEO)
- Semantic landmarks, single h1, skip link, breadcrumb-ready structure

## Testing & CI

- Current local checkpoint: **1,245 Vitest tests across 87 files**, TypeScript
  typecheck, and ESLint all pass. See the latest [enterprise step record](docs/enterprise/STEP-07.md).
- The production build was verified with database/mail disabled, production
  content mode, and indexing disabled. Its no-database timings are not live
  performance evidence.
- `npm run test:e2e` runs the Playwright-core smoke suite when its local review
  server and Chrome are available. A separate local, no-provider browser check
  is recorded in Step 07; it did not submit forms or make non-GET requests.
- **GitHub Actions** (`.github/workflows/ci.yml`): install → lint →
  typecheck → tests → build → audit report

## Adding a new public page

1. Create `src/app/(site)/<segment>/page.tsx` — it inherits header/footer,
   skip link and JSON-LD from the group layout.
2. Export `metadata` (`title` fills the template; set `alternates.canonical`
   **without** a trailing slash; use `openGraphFor()` from `src/lib/seo.ts`
   for the Open Graph block).
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
