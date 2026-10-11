# Step 07 — public-route performance and unused-code cleanup

**Local-only performance/maintenance work; not production readiness or scale certification.** Provisional readiness stays **4/10**. No deployment, production database access, provider access, mail delivery, or real-user traffic was used. See the [assessment](./ASSESSMENT.md) and [runtime prerequisites](./RUNTIME-OPERATIONS.md).

## Diagnosis

- The branded route veil was global and showed after 320 ms. That makes a short server delay conspicuous; it does not itself explain a delayed route.
- The shared public layout waits for site settings, managed services, industries, and testimonials. Several public routes are deliberately dynamic (`revalidate = 0`) to avoid baking database-free fallback content into a production build. A small page can therefore wait on shared and route-specific database reads regardless of its rendered content size.
- Public collection/slug reads were repeated across requests. Industry dossier code also performed redundant case-study/article reads.
- No production database was available to measure actual query latency or cache hit rates. Loopback timings below are explicitly not representative of production persistence, CDN, or visitor networks.

## Changes

- Added a **60-second tagged Next Data Cache** for publication-filtered managed content, industry authority data, shared navigation collections, and site settings. Managed-content mutations expire the content/chrome tags immediately; existing path revalidation remains. Private/admin/session/operational records are not cached by this wrapper. With `DATABASE_URL=''`, data readers retain their existing no-database behavior instead of caching that fallback as published data.
- A local data-backed smoke test exposed an important cache-boundary bug: the published case-study JSON payload was **8,016,308 bytes**, above Next's 2 MiB Data Cache limit, producing unhandled cache-write rejections. Case-study data is now request-memoized with React `cache` (deduplicated within a render, not persisted), and case-study mutations only invalidate affected routes rather than clearing unrelated CMS caches. This preserves large embedded imagery without failed cache writes.
- Normalized publication dates from direct Prisma `Date`, cached ISO strings, and numeric epoch values. Invalid dates now fail safely instead of throwing during route rendering.
- Increased the SAVO transition-veil delay from 320 ms to **600 ms**; replaced per-frame React progress updates with one CSS transition, removed the full-screen blur, and reset state after fast transitions. The 10-second ceiling and reduced-motion behavior remain.
- Added teardown/cancellation guards for Lenis/GSAP animation work and listeners.
- Removed a dead duplicate meeting editor and wired the existing edit/delete-confirmation flows. Removed additional unused imports/helpers/variables, replaced a raw image element with `next/image`, and cleared all repository lint warnings.

## Verification and measurements

- Full suite: **1,245 tests / 87 files passed**. Typecheck passed. ESLint exits successfully with no warnings/errors.
- Isolated optimized production build passed with `DATABASE_URL=''`, mail delivery off, production content mode, and indexing disabled. No database or mail provider was contacted. The build still reports Next's deprecated `middleware` convention; the Vite config-loader warning appears in Vitest.
- Loopback production-server HTML request medians (five full-body samples, old build → updated build) were: `/` 18→18 ms, `/about` 16→16 ms, `/contact` 16→13 ms, `/services` 7→8 ms, `/insights` 12→11 ms, `/case-studies` 12→11 ms, `/privacy-policy` 7→6 ms. This no-database comparison shows the local HTTP/render baseline only; it cannot establish a production database/cache improvement.
- Isolated Chrome checks returned HTTP 200, one visible `h1`, no page errors, and no horizontal overflow at 1440 px for `/`, `/about`, `/contact`, `/careers`, `/insights`, `/services`, `/case-studies`, and `/privacy-policy`; the tested 390 px pages (`/`, `/about`, `/services`, `/insights`) also had no overflow. `/about` → `/contact` committed in 123 ms and did not show the veil. External requests and non-GET requests were blocked; no forms were submitted.
- Static Next chunks measured 3,008 KiB before and 3,016 KiB after (about +0.3%). The change is not claimed as a bundle-size reduction; the optimization targets repeated server data reads and transition rendering behavior.

## Limits and follow-up

- The **first cache miss**, a cache expiry, or the first request after an admin mutation can still wait on the database. Actual production query latency, warm-hit behavior, invalidation under real writes, and field Core Web Vitals remain unmeasured. Case-study rows remain image-heavy and are intentionally read from the database per request; a future storage/projection change is needed before safely persisting that payload in Next's Data Cache.
- Routes remain dynamic intentionally; this change reduces repeated eligible data reads, not the need for an application server. The Next 16 `unstable_cache` API is retained because Cache Components are not enabled; `public-cache.ts` records a future migration to `use cache` after a separately tested Cache Components rollout.
- The isolated production build had no database; its fallback HTML timing must not be presented as live-site performance. Read-only GET smoke checks against the local review database returned 200 for `/`, `/case-studies`, `/insights`, `/careers`, one Insights detail, and one case-study detail after the fix, with no new cache rejection in the dev log. This local dataset is not production evidence; production database/provider testing requires an isolated approved staging environment.
- Keep the global loader delay aligned with the navigation brief and verify perceived performance on a real staging dataset before promotion. No push or deploy is authorized by this step.
