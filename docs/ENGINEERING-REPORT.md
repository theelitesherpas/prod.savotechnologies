# Engineering Refactor Report — savo.v6 Platform Phase

Scope: audit → restructure → harden → test → document the v6 codebase for the
multi-page + admin-panel era, following the enterprise master prompt.
Baseline: commit `936a0ae` (homepage + ported v1 menu/footer/logo, enquiry +
callback pipelines, 33-check E2E suite).

---

## A. Executive Summary

The homepage-era codebase was clean but single-purpose: no route separation,
no authentication, no admin surface, content hard-wired to constants, no
tests, no CI, no error boundaries. This phase turned it into a platform:

- **Route groups** — `(site)/` (public chrome, settings-aware JSON-LD) vs
  `admin/` (own shell, noindex), with a root layout reduced to shell duties.
- **Operations admin panel** — DB-backed sessions (hashed tokens, 12h
  expiry, revocable), bcrypt credentials, admin/editor roles, enquiry inbox
  with status workflow + notes + guarded delete, full Services/Industries
  CRUD with one-click v1-defaults import, contact Settings with public-page
  regeneration. Every mutation zod-validated, audited, revalidating.
- **Content layer** — `lib/collections.ts` reads managed content from
  PostgreSQL with guaranteed constants fallback; admin edits now visibly
  update the public header panels (verified end-to-end).
- **Security** — middleware (admin gate + cross-origin POST guard), shared
  API helpers, uniform 415/400/429/503/500 handling, structured logging
  without PII, `.env.example` finally tracked (gitignore bug fixed).
- **SEO/AEO/GEO** — `/llms.txt` + `/llms-full.txt`, explicit AI-crawler
  robots policy, enriched Organization JSON-LD (offer catalog, areaServed,
  settings-aware contact) — all mirroring visible content only.
- **Quality infrastructure** — Vitest (44 unit/integration), E2E grown to 42
  checks, GitHub Actions CI (lint → typecheck → tests → build → audit),
  `error.tsx`/`global-error.tsx`, `/api/health`.

All functionality preserved: homepage, mega menu, footer, enquiry/callback
flows, analytics, design system — untouched behaviorally.

## B. Original Architecture — problems found

| Severity | Finding |
|---|---|
| High | Site chrome in the root layout — admin pages would inherit the marketing header/footer; no room for future public pages with distinct needs |
| High | Zero admin capability; content (services/industries/contact) immutable without a deploy |
| High | No automated tests; verification was a single E2E script (better than nothing, but no negative-path unit coverage) |
| Medium | `.gitignore`'s `.env*` glob silently kept `.env.example` out of version control — new checkouts had no env contract |
| Medium | No error boundaries (a render throw produced the default Next error page), no health endpoint, no structured logging |
| Medium | Phone rules duplicated between client form and API route (drift risk); route handlers repeated parse/limit/respond scaffolding |
| Medium | `ProjectEnquiry` lacked `updated_at`, `admin_notes`, `phone`, status indexes — inbox workflows impossible |
| Low | `db push` blocked by non-null `updated_at` on a live row (safe manual `ALTER` migration applied) |
| Low | npm audit: 3 high findings, all in the **dev-only** Prisma CLI chain (`deepmerge-ts` via `@prisma/config`); not shipped to runtime |

## C. Final Architecture

See `ARCHITECTURE.md` for the full annotated map and data flows. Summary:

```text
savo.v6/
├── prisma/schema.prisma          # ProjectEnquiry · AdminUser/Session/AuditLog
│                                 # · Service · Industry · SiteSetting
├── src/
│   ├── app/
│   │   ├── (site)/               # public: chrome layout + homepage
│   │   ├── admin/login · admin/(protected)/{dashboard,enquiries,services,
│   │   │                          industries,settings}(+/[id],/actions)
│   │   ├── api/{enquiries,callback,health}/route.ts
│   │   ├── llms.txt · llms-full.txt · robots.ts · sitemap.ts
│   │   ├── layout.tsx (root shell) · error.tsx · global-error.tsx · not-found.tsx
│   ├── components/{ui,layout,shared,admin}/
│   ├── sections/home/            # homepage chapters (RSC)
│   ├── constants/                # site · navigation · services · content
│   ├── lib/                      # env prisma auth audit api logger phone
│   │                             # settings collections rate-limit …
│   ├── schemas/enquiry.ts
│   └── middleware.ts
├── tests/ (6 files, 44 tests)    # vitest + server-only stub
├── scripts/{seed,verify}.mjs
├── .github/workflows/ci.yml
└── README.md · ARCHITECTURE.md · DESIGN.md · PRODUCT.md · docs/
```

## D. Security Improvements

1. **Admin authentication** — opaque 32-byte session tokens (HttpOnly,
   SameSite=Lax, Secure in prod); only SHA-256 hashes stored, so a DB leak
   yields no usable sessions; 12h server-side expiry; revocation by row
   deletion; login rate-limited 8/15min per IP **and** email; timing-safe
   bcrypt(12) verification with uniform work on unknown emails; malformed
   hashes fail closed (caught by a unit test).
2. **Authorization** — middleware cookie gate (cheap) + `requireAdmin()` in
   the protected layout and **every** server action; destructive operations
   additionally require the `admin` role + two-step confirmation; server
   actions carry Next's built-in Origin verification.
3. **API hardening** — cross-origin POSTs rejected at middleware and handler
   level; JSON-only mutations (415 otherwise); body size caps; uniform
   error responses that never disclose internals (details go to structured
   logs); honeypots return indistinguishable success.
4. **Privacy** — enquirer IPs stored only as salted SHA-256 prefixes;
   `admin_notes` and audit `meta` fields excluded from anything public;
   logs carry identifiers, never payloads or credentials.
5. **Headers/CSP** — unchanged strict policy verified still correct for the
   new surface (no new external origins; admin uses zero client-side
   libraries).
6. **Secrets** — no credentials in code or git (`.env` ignored, verified via
   `git ls-files`); `.env.example` documents every variable; admin seed
   password never logged.

## E. Performance Improvements

- Homepage remains **fully static** (○) despite DB-backed content — reads
  happen at build; admin saves call `revalidatePath("/", "layout")` for
  on-demand regeneration (no per-request DB cost on public traffic).
- Admin pages are server-rendered with plain forms (no client JS added to
  the marketing site's bundle).
- Prisma indexes added for the admin query paths (`status`, `project_type`,
  FK/session lookups).
- No new runtime dependencies on the client; `bcryptjs` (pure JS) stays
  server-side.

## F. Accessibility Improvements

- Admin forms: explicit `<label>`s, `role="alert"` error banners,
  `role="status"` confirmations, `aria-pressed` status buttons, native
  form semantics throughout — fully operable without JavaScript.
- Error/404 pages keep landmarks, single `h1`, focus-visible styling, and
  safe navigation paths.
- Public-site a11y was already strong (42-check suite includes dialog trap,
  accordion keyboard, focus returns); unchanged behavior re-verified.

## G. SEO Improvements

- JSON-LD: Organization gained `hasOfferCatalog` (services actually shown
  in the header panel), `areaServed`, `address` country, and contact data
  that tracks admin Settings — schema never asserts invisible content.
- `/llms.txt` + `/llms-full.txt`: factual, visible-content-only dumps for
  answer engines; `/robots.txt` explicitly welcomes major AI crawlers and
  excludes `/api/` + `/admin`.
- Canonical URL strategy unchanged (`NEXT_PUBLIC_SITE_URL`); new admin
  routes are `noindex,nofollow`; sitemap untouched (no URL changes).
- Future-page recipe documented so new pages inherit correct metadata,
  canonicals and sitemap entries by default.

## H. Testing Improvements

| Suite | Coverage |
|---|---|
| `tests/phone.test.ts` | 8 tests — all 19 countries, ranges, rejects |
| `tests/rate-limit.test.ts` | 3 — window, block, bucket isolation |
| `tests/api.test.ts` | 9 — origin guard (match/foreign/absent/malformed), JSON body parse/size, content-type, forwarded IP |
| `tests/enquiry-schema.test.ts` | 7 — valid/optional/invalid email/type/empty/oversize/honeypot bound |
| `tests/api-routes.test.ts` | 9 — both routes: 415, 400, honeypot silent, 200 + stored shape, IP-hash format, 429 + Retry-After, country mismatch |
| `tests/auth-and-misc.test.ts` | 8 — bcrypt roundtrip/reject, token hashing, status vocabulary, `cn` |
| `scripts/verify.mjs` | 42 E2E checks (was 33) — + llms.txt, llms-full.txt, robots AI policy, health, admin gate, login render, CSRF 403 |

Negative paths covered: cross-origin, malformed/oversized bodies, honeypot
bots, rate limiting, unknown countries, wrong passwords, malformed bcrypt
hashes, cookie-less admin access.

## I. Dependency Changes

| Change | Reason |
|---|---|
| + `bcryptjs` (runtime) | Password hashing; pure JS, no native build step |
| + `vitest` 5, `@types/node@^22` (dev) | Unit/integration suite; types aligned to vitest 5's vite 8 peer range |
| Prisma 6.19.3 / zod 4.6.5 / Next 16.3.6 | Unchanged (pinned majors verified working) |

Nothing removed; no unused packages found.

## J. Remaining Risks / Decisions Needed

1. **npm audit (dev-only)** — 3 high findings in the Prisma CLI's transitive
   `deepmerge-ts`. Fix requires prisma <6.12 or ≥8; not shippable risk
   (build-time only). Revisit at the next Prisma major bump.
2. **Single-instance rate limiter** — in-memory by design; swap to Redis
   (same interface) before horizontal scaling.
3. **No email/CRM notifications** on new enquiries — the pipeline stores
   first; a provider module is the natural next increment.
4. **Legal pages** (`/privacy/`, `/terms/`) still render the designed 404 —
   real content requires the company's actual legal text (no fabrication).
5. **Admin account lifecycle** — no change-password/user-management UI yet
   (roles exist; users created via seed). Add before multi-operator use.
6. **Production domain + HTTPS proxy + real `ENQUIRY_IP_SALT`** required at
   deploy; admin Secure cookies assume TLS termination.
7. **Human QA pass** on real devices recommended before launch (programmatic
   QA only, per project constraints).

## K. Verification Results (executed, not assumed)

| Gate | Result |
|---|---|
| ESLint | **0 errors, 0 warnings** |
| TypeScript strict (`tsc --noEmit`) | **clean** |
| Vitest | **44/44 passed** (6 files) |
| Production build | **succeeds** — 21 routes, homepage static, middleware active |
| E2E (`scripts/verify.mjs`) | **42/42 passed** (server on :4311) |
| Live admin journey | login-reject → login → import 10 services → edit service → **public nav reflects edit** → inbox → logout/cookie-cleared — all green |
| Endpoints | `/api/health` `{ok:true,status:"up"}`, `/llms.txt`, `/llms-full.txt`, robots AI policy — 200/verified |
| `npm audit` | 3 high, all dev-chain (documented §J.1) |
| Git hygiene | no secrets tracked; `.env.example` tracked; build/db artifacts ignored |
