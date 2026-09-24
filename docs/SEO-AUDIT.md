# SEO / AEO / GEO Audit and Implementation Report

Scope: full pre-production optimization of the Savo Technologies website (this
repository) for brand identity, searchability, structured data, URL architecture
and indexing posture on the canonical domain `https://savotechnologies.com`.

Audit baseline: commit `517e392`. Implementation: commit `922b8d8` and later.
All changes verified with `tsc --noEmit`, ESLint, Vitest (56 tests) and two full
production builds (indexable and non-indexable modes).

---

## 1. What was changed

### Brand consistency
- **"SAVO" → "Savo" across every public-facing surface**: page metadata, OG/Twitter
  cards, JSON-LD, llms.txt/llms-full.txt, hero and section copy, aria-labels,
  footer, not-found page, enquiry dialog, OG image alt, manifest.
  The all-caps **SAVO lockup remains only inside the logotype artwork** (wordmark
  and hero canvas brand motif), which is standard practice for logotypes and not
  "normal website copy".
- Internal identifiers untouched (`WHY_SAVO`, `savo_admin` cookie, env vars,
  DB columns) per the no-breakage rule.
- `src/constants/site.ts` is now the single brand-hierarchy source of truth:
  name `Savo Technologies`, shortName `Savo`, legalName `Savo Technologies
  Private Limited`, legalNameShort `Savo Technologies Pvt Ltd`.

### SEO
- **Canonical origin**: new `canonicalOrigin` (`NEXT_PUBLIC_CANONICAL_ORIGIN`,
  default `https://savotechnologies.com`). Every canonical URL, sitemap entry,
  JSON-LD `@id` and OG absolute URL is built on it — a test deployment can never
  emit its own host into SEO surfaces. Verified in built HTML.
- **Homepage metadata**: title `Savo Technologies | Web, Mobile, AI & Software
  Development Company`; description establishes Indore-based software company
  serving India and worldwide. Title template `%s | Savo Technologies`.
- Per-page titles/descriptions audited for uniqueness (they were already unique;
  casing and dash patterns fixed).
- **URL architecture** (pre-launch, nothing indexed, safe to rename):
  - `/resources` → `/insights` (route, constants, links, sitemap, llms.txt)
  - Service slugs normalized: `/services/mobile-apps` → `/services/mobile-app-development`,
    `/services/ui-ux` → `/services/ui-ux-design`, `/services/custom-software` →
    `/services/custom-software-development`
  - All internal `href`s with trailing slashes normalized (every internal click
    previously cost a 308 redirect)
  - **308 permanent redirects** added for all renamed URLs (single hop, no chains)
  - Legal links fixed from dead `/privacy/`, `/terms/` to live pages
- **New pages**: `/privacy-policy`, `/terms-and-conditions` (honest, scoped to
  what the site actually does; bracketed slot for governing-law confirmation),
  `/locations/indore` (local SEO, FAQPage JSON-LD, services delivered from
  Indore, genuine HQ facts only), `manifest.webmanifest`.
- **Sitemap**: canonical production URLs only; `/portal` removed (utility page);
  new routes added.
- **robots.txt**: `NEXT_PUBLIC_INDEXABLE` gate — non-production serves
  `Disallow: /`; production allows public crawling, disallows `/api/` and
  `/admin`, explicitly welcomes AI/answer-engine crawlers, references the
  production sitemap. Removed the non-standard `host` directive.
- **Internal linking**: Insights added to header nav; Indore Office added to
  footer; nav labels clarified (Case Studies, Hire Developers, Contact);
  breadcrumb labels follow the same names.
- Performance/crawlability posture unchanged (RSC-first, SSG for all public
  pages, next/image everywhere) — verified all routes prerender static.

### AEO
- FAQPage JSON-LD already existed on service pages (kept); added on the Indore
  page with genuinely useful Q&A (location, remote work, services, how to start).
- Meta descriptions rewritten without the "Topic — expansion" dash pattern.

### GEO (generative-engine discoverability)
- Entity facts (who/where/legal name/services) now exist in **rendered HTML
  text** on the homepage (positioning label + introduction paragraph) and About
  page — not only in schema or JS state.
- llms.txt / llms-full.txt regenerated against the canonical origin (never the
  test domain); treated as optional ecosystem documentation, not a ranking
  mechanism. No invented "GEO schema" types were added.

### Schema (structured data)
- **One canonical entity graph** in the site layout:
  - `Organization` `@id: https://savotechnologies.com/#organization` with
    name, `alternateName: [Savo, Savo Technologies Pvt Ltd]`, `legalName:
    Savo Technologies Private Limited`, Indore/Madhya Pradesh/IN PostalAddress,
    `foundingDate: 2016`, contactPoint, `areaServed` (8 genuinely served
    countries per the v1 office map), knowsAbout, hasOfferCatalog.
  - `WebSite` `@id: /#website` with `alternateName: [Savo, Savo Technologies
    Private Limited, Savo Technologies Pvt Ltd, savotechnologies.com]`,
    publisher → Organization.
- All page-level graphs (Service, BreadcrumbList, WebPage, AboutPage,
  ContactPage, JobPosting, FAQPage, Article) reference the stable `@id`s —
  verified no duplicate disconnected entities.
- **sameAs is deliberately empty**: the five social URLs in the config are bare
  platform homepages (linkedin.com, x.com…), not genuine Savo profiles. Slot
  ready in `site.ts` the moment real profile URLs are supplied.
- Logo: stable crawlable asset `https://savotechnologies.com/images/savo-technologies-logo.svg`
  (generated from the official wordmark paths). Supplying a PNG version is
  recommended in the owner actions below.

### Vercel vs production indexing
- Test/preview deployments: `noindex, nofollow` meta + `Disallow: /` robots by
  default (verified on a running build).
- Production: sets `NEXT_PUBLIC_INDEXABLE=true` (verified in a separate build:
  `index, follow`, Allow `/`, canonical + sitemap on savotechnologies.com).
- `.env.example` documents the full matrix.
- Note: the Vercel test project additionally carries SSO deployment protection
  from the account-level restriction investigated earlier — unrelated to this
  code, owner must resolve with Vercel.

### Copy quality
- 28 sentences with the "X — aside — Y" double-dash pattern rewritten into
  natural punctuation (constants + sections).
- All meta descriptions de-dashed.
- Single, grammatical em dashes in body copy were kept (deliberate editorial
  voice, not the artificial pattern the instruction targets).

### Admin SEO controls (existing, verified)
- Services/Industries CRUD already: server-side `slugify` (lowercase, `&`→and,
  hyphen-collapsed, trimmed), zod regex `^[a-z0-9-]+$`, length caps, DB
  uniqueness errors surfaced in the UI. Meets the slug rules; no changes needed.

---

## 2. Remaining items requiring company information (never fabricated)

| Item | Where | Status |
|---|---|---|
| Indore street address + postal code | `SITE.hq` slots | null until supplied |
| CIN / GST | `SITE.registration` slots | null until supplied |
| Real social profile URLs (LinkedIn, Instagram, GitHub, GBP…) | `SOCIAL_LINKS` + Organization `sameAs` | platform placeholders currently shown in footer; excluded from schema |
| Google Business Profile URL | `sameAs` when verified | owner supplies |
| Logo PNG (square) for rich results | `/public/images/` | SVG shipped; PNG recommended |
| Leadership names/metrics on About ("40+ people", "200+ projects", "92% retention", Aarav/Priya/Rohan/Sara) | About page | carried from v1 — **owner must confirm these are real before launch** |
| Office addresses (Zürich, Riyadh, Sydney, London, USA) | `OFFICES` | carried from v1 — confirm or prune before launch |
| Footer compliance badges (GDPR/PCI/ISO) | `BADGES` | v1 claims — confirm certifications exist |
| Governing-law jurisdiction text | Terms page | bracketed for confirmation |
| Case-study entries | `constants/case-studies.ts` | intentionally bracketed "pending verified engagements" until real projects are approved for publication |

## 3. External actions the owner must perform (not doable in code)

1. Resolve the Vercel account restriction (commercial-use review / plan upgrade)
   so deployments serve publicly again.
2. Point savotechnologies.com at the production deployment; set
   `NEXT_PUBLIC_INDEXABLE=true` **only** on that deployment.
3. Redirect `www.savotechnologies.com` and `http://` → `https://savotechnologies.com`
   (Vercel domain settings do this automatically once added — verify).
4. Google Search Console: verify the **Domain** property (DNS TXT), submit
   `https://savotechnologies.com/sitemap.xml`, request indexing for the
   homepage and major service pages.
5. Bing Webmaster Tools: verify, submit sitemap; optionally enable IndexNow
   (`scripts/indexnow.mjs`, key file in `/public`).
6. Google Business Profile: create/verify with exact NAP matching the site
   (Savo Technologies, Indore HQ address once supplied, +91 75029 01234);
   set website to https://savotechnologies.com/; add the GBP URL to `sameAs`.
7. Replace the five placeholder social links with real profile URLs (footer +
   `sameAs` slot in `site.ts`), keep naming consistent ("Savo Technologies").
8. Update LinkedIn/directories (Clutch, GoodFirms, Crunchbase if genuine) to
   the new domain and consistent naming.
9. Post-launch: run the Search Console checklist (indexability, canonicals,
   CWV, mobile rendering, branded queries: Savo / Savo Technologies / Indore
   variants / Pvt Ltd variants).

## 4. Verification evidence

- `tsc --noEmit` clean · ESLint clean · 56/56 Vitest tests pass
- Production build: all public routes prerendered static (SSG)
- Non-indexable build served locally: `noindex, nofollow`, robots `Disallow: /`,
  canonical still `https://savotechnologies.com`
- Indexable build (`NEXT_PUBLIC_INDEXABLE=true`) served locally: `index, follow`,
  robots `Allow: /` + AI crawlers, sitemap URLs all canonical
- JSON-LD graph inspected at runtime: Organization/WebSite names, legalName,
  alternateName, Indore address, logo URL, no sameAs, stable @ids
- Renamed URLs return 308 to the new canonical destinations
- Deployed to the Vercel test project (READY); test env emits noindex by default

No ranking outcome is guaranteed by this work; it implements every legitimate
technical, semantic and entity signal for search engines and AI systems to
discover, understand and associate the Savo Technologies brand.
