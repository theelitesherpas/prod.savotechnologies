# MONITORING REGISTER (master spec Parts 75–78, 98, 108–109, 114–115)

Everything that must be watched, on what cadence, by whom, and what
"healthy" looks like. Local-development items run now; production items
activate at go-live (Stage 6).

## A. Local development (now — savo.v7)

| What | Cadence | Healthy | Where to look |
|---|---|---|---|
| Dev server + DB | continuous | 200s, health `ok` | `curl localhost:4312/api/health`; `tmp-dev.log` |
| Typecheck / lint / tests | every change | 0 errors, 156+ pass | `npm run typecheck && npm run lint && npm run test:run` |
| Route sweep | after page changes | all routes 200 | curl loop over key routes |
| Sitemap correctness | after route changes | new URLs present, no stale | `curl localhost:4312/sitemap.xml` |
| llms.txt freshness | after page changes | new pages listed | `curl localhost:4312/llms.txt` |
| Build integrity | before milestones | `npm run build` clean | full production build |
| Backups (no git!) | every session end | `savo.v7-backup-NN.tar.gz` | `/Users/om/` |

## B. Proof & content integrity (Parts 98, 108–109)

| What | Cadence | Action owner | Trigger |
|---|---|---|---|
| Proof dashboard gaps (missing testimonials/metrics/tech/verification) | monthly | content lead | `/admin/proof` |
| Case-study verification links live (Part 98 "broken verification links") | quarterly | content lead | script/curl the `verificationLinks` + `liveUrl` of every published study |
| Certification expiry | quarterly | ops | `validUntil` in `recognition.ts` — expired entries auto-hide; remove + renew |
| Third-party rating values still accurate | quarterly | ops | re-check C1/C2 profiles vs `THIRD_PARTY_RATINGS.checkedOn` |
| Claims review dates | quarterly | claim owner | `reviewDate` in `claims.ts`; overdue ⇒ re-verify or archive |
| Company facts review | quarterly | leadership | `company-facts.ts` `verifiedDate`s |
| Core services / technology / industry pages | twice yearly | content lead | full Content Quality Gate re-run |
| Content inventory statuses | monthly | content lead | `/admin/content-inventory` |
| Competitor scorecard re-crawl | quarterly | strategy | refresh `tmp-benchmark/`, update scorecard |

## C. Production (activates at go-live — Stage 6)

| What | Cadence | Spec |
|---|---|---|
| GSC: queries, pages, countries, indexation, CWV, structured-data errors, sitemaps, manual actions | weekly | Part 76 |
| Bing Webmaster: indexation, queries, IndexNow status | monthly | Part 77 |
| Server logs: crawler behavior, 404s, redirect chains, crawl traps | quarterly | Part 78 |
| IndexNow notifications firing on new/updated/deleted pages | on deploy | Part 75 |
| Core Web Vitals field data (LCP ≤2.5s, CLS ≤0.1, INP ≤200ms) | monthly | Part 91 |
| Analytics events flowing (enquiry, ask-savo, case-study engagement) | weekly | Part 89 |
| Business metrics: qualified leads, meetings, case-study engagement, AI referrals | monthly | Part 90 |
| Accessibility regression spot-check | after major UI changes | Part 93 |
| Security: dependency advisories, header audit | monthly | Part 95 |
| Post-launch measurement vs baseline (Part 114 snapshot) | 30/60/90 days | Part 115 |

## D. Baseline discipline (Parts 114–115)

Before go-live, snapshot and record here: indexed pages, organic
traffic, queries, backlinks, CWV, Lighthouse, conversions, meetings,
case-study traffic, top pages, international traffic, brand search.
Compare at 30/60/90 days. More traffic ≠ better: qualified leads,
meetings and case-study engagement are the success measures.
