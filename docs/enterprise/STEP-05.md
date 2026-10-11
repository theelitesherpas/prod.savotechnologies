# Step 05 — truthful sitemap freshness and crawler exclusions

**Local SEO/discoverability checkpoint only; not a search-performance or indexing certification.** The broader audit remains open and readiness remains provisionally **4/10**. See [Steps 01–04](./ASSESSMENT.md) and [runtime/release prerequisites](./RUNTIME-OPERATIONS.md). No deployment, Search Console access, provider crawl, production database read or content mutation occurred.

## Changes

- Sitemap entries no longer claim every URL was modified at build/request time. `lastModified` is omitted until each source supplies a trustworthy edit timestamp. This avoids sending fabricated freshness signals; crawlers can still use actual crawl behavior and the declared change frequencies.
- Published-content mutations explicitly invalidate `/sitemap.xml` along with the public layout, so newly published/unpublished managed routes can be reflected after the existing cache invalidation path runs.
- Production `robots.txt` now excludes API/admin, client and employee portals, bearer-token meeting routes, signed unsubscribe URLs and unpublished preview routes for both the general rule and the explicitly listed AI/answer-engine crawlers. Staging/demo still follows the existing global disallow gate.
- The sitemap retains the current canonical origin, route set and publication-backed readers; no URL, public copy, metadata claims or AI training policy was changed.

Robots directives are crawl hints, not authorization. Sensitive endpoints still require their server-side controls and private/no-store/noindex response policy. The public `Content Signals` policy still declares AI training permitted; changing that is an owner/legal decision and remains open.

## Verification

- Full local suite: **1,232 tests / 83 files passed**. New coverage checks absence of fabricated `lastModified`, sitemap invalidation, exclusion of private/token/preview paths, and matching private-route disallows for both robots rules.
- `npm run typecheck` passes. `npm run lint` exits successfully with **0 errors / 21 warnings** (mostly pre-existing unused-code warnings; one existing `<img>` performance warning in AI pages, plus the unused meeting `onEdit` callback).
- Isolated production-content, nonindexable build passes with `DATABASE_URL=''` and mail delivery off; no database/provider connections or mail deliveries were used. The existing Next.js middleware-to-proxy deprecation and Vite config-loader warning remain.
- No live robots/sitemap response, Search Console state, crawl logs, CWV/field performance, rich-result eligibility or AI-crawler behavior was checked.

## Remaining SEO/AI work

1. Owner/legal review of AI training permission and the factual authority of `llms.txt`/`llms-full.txt`; do not infer training consent from search permission.
2. Verify production/preview build-time index gates, canonical origin, noindex headers and generated sitemap on the approved staging origin before promotion.
3. Confirm article/case/service CMS freshness timestamps, redirects and URL inventory against an approved content export; avoid invented `lastModified` values.
4. Measure Search Console indexing/crawl outcomes only with owner authorization; validate structured data using published facts and do not manufacture review/FAQ/result schema.
5. Continue performance/accessibility audits with representative browser/device and field data. Passing unit tests/build does not certify CWV, assistive technology or cross-browser behavior.
