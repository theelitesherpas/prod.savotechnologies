# Architecture

How the v6 codebase is organized, why, and the rules that keep it scalable as
pages are added.

## Principles

1. **Route groups separate experiences** — public site vs admin panel never
   share chrome, metadata, or auth concerns.
2. **Server-first** — data fetching and rendering default to React Server
   Components; client components exist only for interaction (menus, dialogs,
   canvas, forms).
3. **One source of truth per concern** — env via `lib/env`, auth via
   `lib/auth`, content via `lib/collections` + `lib/settings`, validation via
   `src/schemas`, API shape via `lib/api`.
4. **Fail-safe content** — the public site renders from constants whenever
   the database has nothing (or is down). The admin panel enhances; it never
   gates availability.
5. **Security at the server boundary** — middleware is a cheap gate; every
   privileged page/action re-authorizes via `requireAdmin()`.

## Directory map

```text
src/
├── app/
│   ├── (site)/                  # PUBLIC EXPERIENCE
│   │   ├── layout.tsx           #   chrome: header(nav data) · footer(settings)
│   │   │                        #   + skip link + Organization/WebSite JSON-LD
│   │   ├── page.tsx             #   homepage (static)
│   │   └── case-studies/        #   dossier by discipline (placeholders until verified)
│   ├── admin/                   # OPERATIONS EXPERIENCE (noindex)
│   │   ├── login/               #   page + server action (rate-limited)
│   │   └── (protected)/         #   auth-checked shell
│   │       ├── page.tsx         #     dashboard
│   │       ├── enquiries/       #     inbox + [id] detail + actions
│   │       ├── services/        #     CRUD + import + [id] edit
│   │       ├── industries/      #     CRUD + import + [id] edit
│   │       └── settings/        #     contact overrides
│   ├── api/
│   │   ├── enquiries/route.ts   # POST — zod + honeypot + rate limit + prisma
│   │   ├── callback/route.ts    # POST — country-aware phone validation
│   │   └── health/route.ts      # GET  — liveness/readiness (db probe)
│   ├── llms.txt/ llms-full.txt/ # AEO/GEO machine facts (static)
│   ├── robots.ts sitemap.ts icon.svg
│   ├── layout.tsx               # ROOT: fonts · GA · design contract
│   ├── error.tsx                # route error boundary (v6 styled)
│   ├── global-error.tsx         # root failure fallback
│   └── not-found.tsx            # designed "still in production" 404
├── components/
│   ├── ui/                      # primitives: Button, Section, Reveal,
│   │                            # SectionHeader, ImageReveal, Parallax…
│   ├── layout/                  # SiteHeader, SiteFooter, nav panels
│   ├── shared/                  # SavoLogo, EnquiryDialog, CallbackForm
│   └── admin/                   # ServiceFields, IndustryFields
├── sections/home/               # homepage narrative (RSC, one file per chapter)
├── constants/                   # site · navigation · services · content
├── lib/                         # see "lib/ modules" below
├── schemas/enquiry.ts           # zod schema shared by client form + API
└── middleware.ts                # admin cookie gate + API origin guard
```

## lib/ modules

| Module | Responsibility | Server-only |
|---|---|---|
| `env.ts` | Typed env parsing, `absoluteUrl()` | no (client-safe subset) |
| `prisma.ts` | Prisma singleton (null when DATABASE_URL unset) | yes |
| `auth.ts` | Login/sessions/cookies, `requireAdmin(±Role)` | yes |
| `audit.ts` | Append-only admin audit trail | yes |
| `api.ts` | `apiOk/apiError`, origin guard, JSON body reader, `clientIp` | no |
| `logger.ts` | Structured JSON logging with levels | no |
| `phone.ts` | Country→phone rules shared by client form + API | no |
| `rate-limit.ts` | In-memory sliding window (Redis-swappable interface) | no |
| `collections.ts` | Services/industries: DB read, constants fallback, revalidate | yes |
| `settings.ts` | Contact overrides with constant defaults | yes |
| `enquiry-status.ts` | Status enum + metadata | no |
| `analytics.ts` | `track()` → dataLayer (GA4), consent-friendly | client |
| `utils.ts` | `cn()` | no |

## Request/data flows

**Public page render (static, regenerated on admin save):**
`(site)/layout.tsx → getSettings() + getManaged{Services,Industries}() →
Prisma (fallback constants) → SiteHeader/Footer props + JSON-LD`

**Lead capture:** dialog/callback form (client) → `POST /api/{enquiries,callback}`
→ middleware origin guard → zod → honeypot → rate limit → Prisma →
`project_enquiries` (ip hashed). No email/notification side-effects yet.

**Admin mutation:** form POST → server action → `requireAdmin(±Role)` → zod →
Prisma → `audit()` → `revalidatePath("/", "layout")` → redirect with status.

**Auth:** `/admin/login` POST → `login()` (bcrypt, rate-limited, timing-safe)
→ random 32-byte token in HttpOnly cookie · SHA-256 hash in `admin_sessions`
· middleware checks cookie presence · layout/actions verify the session row.

## Data model (prisma/schema.prisma)

- `ProjectEnquiry` — enquiries + callbacks, status workflow, admin notes,
  hashed IP. Indexes: created_at, status, project_type.
- `AdminUser` / `AdminSession` / `AuditLog` — operators, revocable hashed
  sessions, append-only trail (FK indexes; sessions cascade).
- `Service` / `Industry` — managed content, unique slugs, order/active.
- `SiteSetting` — key/value overrides.

## Conventions

- TypeScript strict; no `any`; runtime validation at every trust boundary.
- Imports: `@/` alias. Server-only modules declare `import "server-only"`.
- Server actions live beside their feature (`admin/(protected)/x/actions.ts`),
  one file per concern, `"use server"` at top, zod-parsed FormData.
- Admin UI: server-rendered forms that work without JavaScript; feedback via
  search params (`?saved=1`, `?e=…`), never client state.
- Error handling: `logger.*` structured events; user-facing strings never
  leak internals; route handlers funnel through `lib/api`.
- Styling: Tailwind v4 tokens from `globals.css` (see DESIGN.md); no inline
  styles outside `global-error.tsx` (which must survive without the app).

## Scaling notes

- **New public page:** add under `(site)/`, export metadata, register in
  `sitemap.ts`; constants or a new collection feed the content.
- **New collection:** mirror `services` (model → `lib/collections` reader →
  admin CRUD + import action → wire into a nav panel/page).
- **Horizontal scaling:** swap `rate-limit.ts` for Redis with the same
  signature; sessions already live in Postgres.
- **Notifications (email/CRM):** add a provider module called from the API
  routes after the DB write; keep it failure-tolerant.
