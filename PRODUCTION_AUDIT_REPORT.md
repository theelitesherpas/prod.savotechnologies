# PRODUCTION AUDIT REPORT — savo.v6 Demo Content System

**Date:** 2026-09-25 · **Scope:** full content audit + Demo Content System implementation
**Policy:** Demo Data & Placeholder Replacement Policy (staging stays visually complete; production never publishes invented facts)

---

## 1. System implemented

| Piece | Location | Purpose |
|---|---|---|
| Mode gate | `src/lib/content-mode.ts` | `NEXT_PUBLIC_CONTENT_MODE=demo\|production` (default **demo** — safe default, unconfigured launches can never publish demo facts). Exports `IS_DEMO`, `demoRecord()`, `productionSafe()`. |
| Centralized demo registry | `src/content/demo/` | Every invented factual value lives here, typed with `status: "demo"`. 18 demo records across 4 modules. Nothing renders without passing the gate. |
| Demo metrics | `src/content/demo/company.ts` | 120+ / 45+ / 12+ / 8+ (Projects Delivered, Clients Supported, Industries Served, Markets Reached) + 25+ team size + 10+ years (unused until a design needs them). |
| Demo case studies | `src/content/demo/case-studies.ts` | Meridian Commerce (web), NovaFlow (AI), Aster Health (mobile), Northstar Logistics (software) + fictional client brand set. |
| Demo testimonial | `src/content/demo/testimonial.ts` | Explicit "Client testimonial preview" structure — never a fabricated endorsement. |
| Demo market presence | `src/content/demo/locations.ts` | India HQ (verified) + Switzerland/GCC/Australia/UK/US as **market presence**, city-level lines only, policy §12 wording. |
| Trust labels | `src/content/demo/index.ts` | Non-certification capability labels (see §2.4 below) — safe in both modes. |
| Build guard | `scripts/verify-content.mjs` (wired as `prebuild`) | Fails the build if: demo+indexable, demo markers outside the registry, ungated imports of `@/content/demo`, or `REPLACE_BEFORE_PRODUCTION` markers in a production build. |
| Staging identifier | `src/app/(site)/layout.tsx` | Unobtrusive "Development Preview" pill, demo builds only. |
| SEO safety | `robots.ts`, `layout.tsx`, `sitemap.ts` | Demo builds force `noindex` + robots `Disallow: /` regardless of `NEXT_PUBLIC_INDEXABLE`. Demo stats/offices never enter JSON-LD, sitemap, OG or `llms.txt`. |
| Admin lifecycle | `prisma/schema.prisma` + admin forms | `ContentItem.contentStatus` (draft → demo → review → verified → published) + `publishedAt`. Public reads require `contentStatus: "published"` — a record is never production-visible merely by existing in PostgreSQL. |
| Replacement docs | `DEMO_CONTENT_REPLACEMENT.md`, `CONTENT_REPLACEMENT_REPORT.md`, `SAVO_INPUT_REQUIRED.md` | Every demo value has a documented replacement path. |

## 2. Violations found and fixed

### 2.1 Fabricated street address & phone (policy §13, §14)
- **Was:** `OFFICES` claimed "Switzerland · Head Office, Bahnhofstrasse 10, 8001 Zürich" with mobile `+41 44 500 12 12` — an invented address and a potentially real third-party number.
- **Also leaked into:** the Ask Savo assistant knowledge (`src/lib/assistant.ts`), `llms-full.txt` (machine-readable), the contact page meta description ("offices in Indore, Zürich, Riyadh, London and Sydney").
- **Now:** removed everywhere. Switzerland/GCC/Australia/UK/US render as market presence with policy wording; only the verified India HQ (+91 75029 01234) carries an address/phone. Assistant and llms.txt answer with the same truth.

### 2.2 Unverified office claims (policy §11)
- **Was:** "Saudi Arabia & GCC · Office (Riyadh · Dubai · Manama)", "Australia · Office (Sydney)", etc.
- **Now:** "market/service presence" treatment, gated to demo mode; production shows the verified HQ + truthful worldwide wording.

### 2.3 Fake compliance certifications (policy §18)
- **Was:** footer badges "GDPR Compliant", "SSL Secured", "PCI DSS Ready", "ISO 27001 Aligned" — certifications Savo does not hold.
- **Now:** non-certification capability labels: Security-Conscious Engineering, Privacy-Aware Development, Secure Delivery Practices, Production-Focused QA.

### 2.4 Invented statistics (policy §4, §15, §28)
- **Was:** About page `FACTS` band — "40+ people, 200+ projects shipped, 3 regions served, 92% client retention" — invented and **rendering in production**. Homepage metrics were already honest pending slots.
- **Now:** gated demo metrics (120+/45+/12+/8+ on staging); production shows pending slots on both pages. No demo number appears in JSON-LD, metadata, SEO copy or sitemap in either mode.

### 2.5 Invented people (policy §10, §21 spirit)
- **Was:** contact team roster (6 members) and About leadership (4 members) — invented names, roles, bios, portraits, LinkedIn slugs (`linkedin.com/in/aarav-mehta` etc. may belong to real strangers) and role emails.
- **Now:** marked `status: "demo"`, render on staging only; suppressed in production until the real roster is supplied.

### 2.6 Invented company history (policy §17)
- **Was:** About milestones ("2016 Jaipur office", "5,000 daily users", "deflects 70% of tier 1 queries", "200,000 students", "Forty people"), "forty engineers" story copy, "Ten years on" / "Ten years, honestly told" wording, "Jaipur to everywhere" caption.
- **Now:** milestones gated to demo; story copy neutralized (team size removed, year referenced only via the configured `foundedYear: "2016"`); caption switches to "Indore to everywhere" in production. Founding year itself is flagged for confirmation in SAVO_INPUT_REQUIRED.md.

### 2.7 Structured-data market claims (policy §32)
- **Was:** Organization JSON-LD `areaServed` listed 8 countries based on the fabricated office map; contact-page ContactPoint did the same.
- **Now:** JSON-LD `areaServed` is verified-only (`India`) in production; contact ContactPoint uses `India + Worldwide`. The multi-market list is restored only when Savo confirms it.

## 3. Verification performed

| Check | Result |
|---|---|
| `tsc --noEmit` | ✅ clean |
| `vitest run` | ✅ 56/56 |
| Demo build (`NEXT_PUBLIC_CONTENT_MODE` unset) | ✅ renders 120+, Meridian/NovaFlow/Aster, testimonial preview, Development Preview pill, market cards, team/leadership/milestones |
| Production build (`NEXT_PUBLIC_CONTENT_MODE=production`) | ✅ zero demo strings in `index/about/contact` HTML; no fabricated address anywhere; pending slots render honestly |
| Content guard | ✅ passes both modes; correctly caught an ungated constant during development |
| Prisma | ✅ schema pushed (`content_status`, `published_at`); public getters filter `contentStatus: "published"` |

## 4. Residual items (documented, not blocking)

- Form placeholder names ("Aarav Sharma") in inputs — standard UX, not factual claims; kept.
- `foundedYear: "2016"`, `since 2016`, hire-page "48 hours / two week trial" — carried from the published version-1 model; flagged for confirmation in SAVO_INPUT_REQUIRED.md.
- Team portraits remain in `/public/team/` for staging use; they must be replaced or removed alongside the real roster.
