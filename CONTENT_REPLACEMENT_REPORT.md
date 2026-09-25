# CONTENT REPLACEMENT REPORT — where demo data lives and how it flows

Technical companion to `DEMO_CONTENT_REPLACEMENT.md`: the exact source → gate → render path
for every demo dataset, so replacements land in one place.

## Architecture

```
src/content/demo/            ← ALL invented facts live here (status: "demo")
   company.ts  case-studies.ts  testimonial.ts  locations.ts  index.ts
        │
        ▼  imported ONLY by gated consumers (enforced by scripts/verify-content.mjs)
src/lib/content-mode.ts      ← IS_DEMO / demoRecord / productionSafe
        │
        ▼
src/constants/*.ts           ← gates demo data into the normal content pipeline
src/app/**, src/sections/**  ← render constants exactly as before
```

- Mode: `NEXT_PUBLIC_CONTENT_MODE=production` ⇒ demo suppressed. Anything else (incl. unset)
  ⇒ demo. **Demo is the default so an unconfigured launch can never publish demo facts.**
- Build guard (`npm run build` → `prebuild`): fails on demo markers outside the registry,
  ungated `@/content/demo` imports, demo+indexable combos, or `REPLACE_BEFORE_PRODUCTION`
  markers during production builds.

## Dataset flows

| Dataset | Source (demo) | Gate | Renders in | Production behavior |
|---|---|---|---|---|
| Impact metrics | `company.ts → DEMO_METRICS` | `constants/content.ts → METRICS` | `sections/home/metrics.tsx`, About `FACTS` | Honest "…" pending slots, same labels |
| Selected work cards | `case-studies.ts → DEMO_CASE_STUDIES[0..2]` | `sections/home/selected-work.tsx` | Homepage selected work ("Design concept" badge) | Existing `[Project Name]` placeholders ("In preparation" badge) |
| Discipline specimens | `DEMO_CASE_STUDIES` (by discipline) | `constants/case-studies.ts → CASE_DISCIPLINES` | `/case-studies` boards | Pending specimen slots |
| Testimonial preview | `testimonial.ts → DEMO_TESTIMONIAL` | `selected-work.tsx` (inline `IS_DEMO`) | Homepage, after work grid | Section absent |
| Market presence | `locations.ts → DEMO_MARKET_PRESENCE` | `constants/site.ts → OFFICES` | Contact offices · footer · About presence | HQ-only + `PRESENCE_FALLBACK_NOTE` |
| Trust labels | `index.ts → TRUST_CAPABILITY_LABELS` | `constants/site.ts → BADGES` | Footer | Same (truthful capability wording, both modes) |
| Contact team | `constants/contact.ts → CONTACT_TEAM_SEED` | `CONTACT_TEAM = IS_DEMO ? … : []` + `team.tsx` early return | Contact page team grid | Section absent |
| Leadership | `about/page.tsx → LEADERSHIP_SEED` | `LEADERSHIP = IS_DEMO ? … : []` | About leadership | Section absent |
| Milestones | `about/page.tsx → MILESTONES_SEED` | `MILESTONES = IS_DEMO ? … : []` | About timeline | Section absent |
| Team size / years / client brands | `company.ts`, `case-studies.ts` | reserved — not consumed yet | (available for future cards) | n/a |

## Machine-readable surfaces (always factual, both modes)

- **JSON-LD Organization:** `areaServed` = `["India"]` (verified only); no demo stats,
  no demo addresses, `foundingDate` from configured `foundedYear`.
- **robots.txt / meta robots:** demo mode forces `noindex` + `Disallow: /`.
- **sitemap.ts:** contains only canonical routes; no demo case-study URLs exist to include.
- **llms.txt / llms-full.txt:** market-presence wording, verified HQ only.
- **Ask Savo assistant:** answers "where are you located" with HQ + (demo: market list /
  production: worldwide) — never the old fabricated address.

## Admin / DB lifecycle

- `ContentItem.contentStatus`: `draft | demo | review | verified | published` (+ `publishedAt`).
- Public reads (`src/lib/content-items.ts`) require `active AND contentStatus = "published"`.
- Consequence: seeded/imported rows (default `draft`) never render publicly — the constants
  fallback covers the site until an editor explicitly publishes. Publication is a deliberate act.
- The admin edit/new form exposes the lifecycle select next to visibility/order.

## Deployment modes

| Environment | CONTENT_MODE | INDEXABLE | Result |
|---|---|---|---|
| Local dev / Vercel preview | unset → demo | unset → false | Full demo design, noindex, "Development Preview" pill |
| Vercel production (current) | unset → demo | unset → false | Staging-style preview deployment (noindex) |
| Final launch (savotechnologies.com) | `production` | `true` | Verified-only content, indexable |
