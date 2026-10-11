# Enterprise engineering audit — initial assessment

Status: **in progress; not a production-readiness certificate**. Scope is the local `savo.v7` snapshot. No Git history or deployed infrastructure access is available. Evidence: `tmp/enterprise-audit/step-01/`. Existing visual identity and public URLs are pinned.

This is the **initial** assessment, before fixes. See [Step 01 outcomes](./STEP-01.md), [Step 02 outcomes](./STEP-02.md), [Step 03 authorization/stream outcomes](./STEP-03.md), [Step 04 bearer-link/credential/mail controls](./STEP-04.md), [Step 05 crawler/sitemap controls](./STEP-05.md), [Step 06 scoped content queries](./STEP-06.md), [Step 07 public-route performance and cleanup](./STEP-07.md), and [runtime/release prerequisites](./RUNTIME-OPERATIONS.md) for implemented controls, checks and remaining risks; the master audit is not complete. The provisional readiness estimate is not increased on local tests alone.

## Executive assessment

| Area | Initial verdict | Evidence / limits |
|---|---|---|
| Architecture | Good modular-monolith foundation | App Router routes, feature sections, shared validation, Prisma services; direct DB access remains common in admin pages |
| Security risk | **High** | Verified permission gaps, fail-open email webhook, private Markdown/cache exposure path, vulnerable Next version |
| Scalability risk | **High beyond a single process** | Local rate-limit map, SSE pub/sub and workers; dynamic DB-backed pages; previous build connection exhaustion; no distributed coordination |
| SEO health | Mixed | Canonical helper, redirects, SSR, JSON-LD, sitemap and index gate exist; child robots overrides, private crawler policy, invented lastmod, entity guards need review |
| AI discovery | Mixed | llms files and Markdown exist; unsupported factual/response promises and training permissions need correction/owner policy; private routes must be excluded |
| Performance | Not yet measured for this audit | Canvas optimizations and responsive assets exist; managed images stored in JSON/base64, SSR reads and multiple fonts are potential costs; no field CWV evidence |
| Accessibility | Strong prior local coverage, incomplete enterprise review | Existing keyboard/reduced-motion/form tests; fresh cross-browser/screen-reader review still needed |
| Lead generation | Working architecture with reliability gaps | Durable enquiry records, validation, progressive CAPTCHA, shared CTAs; fire-and-forget email, no durable outbox/idempotency guarantee |
| Code quality | Mixed-good | Strict TS, 673 passing tests/43 files, typecheck passes; global lint fails on local generated fixtures; stale v6 architecture docs |
| Production readiness | **Provisional 4/10** | Engineering judgment, not a benchmark/certification: solid foundation but high-risk gaps and unverified release, mail, backups, proxy, DB isolation and operational controls |

No P0 exploit or exposed live source credential is confirmed in the inspected snapshot. This does **not** mean none exists. A heuristic redacted scan found example/template candidates only; there is no Git history to inspect and no infrastructure secret scan. Local `.env` files are excluded by `.gitignore`; never copy them into audit evidence.

## Verified stack and architecture map

- npm + `package-lock.json`; `npm ci` is the deterministic deployment command. Runtime compatibility: Next requires Node >=20.9; CI uses Node 22. Actual local version is recorded separately.
- Next **16.3.6**, React/React DOM **19.2.8**, TypeScript **5.9.3** (`strict: true`), Tailwind **4.3.3**, Zod **4.6.5**.
- PostgreSQL through Prisma **6.19.3**. No migrations directory; `db push` is the documented deployment approach. Schema has leads, content, admin/client/employee sessions, projects/invoices, employee leaves, analytics, bug reports, email, chat and meetings.
- Modular monolith: `src/app` HTTP/rendering boundaries; `src/sections` page features; `src/components` shared public/admin/portal/UI components; `src/lib` domain/data/integrations; `src/schemas` shared validation; `src/constants` business/content defaults; `src/content` demo/editorial material; `prisma` persistence; `tests` Vitest; `scripts` operational/manual tasks.
- App Router `(site)` marketing layout owns navigation/footer, enquiry providers, project popup, chat and first-party analytics. Homepage now uses `home-v2`, not legacy `home`.
- Admin has separate protected shell and Server Actions. DB-backed opaque random session cookies, SHA-256 token hashes, bcrypt cost 12, HttpOnly/SameSite=Lax/Secure in production. Roles `admin`/`editor` with section grants. No implemented MFA/reset-token service found. Admin password changes are management/self-service operations, not a public reset flow.
- Client portal has independent hashed sessions and active-account checks; ownership filters exist in project/invoice pages and need systematic test coverage. Employee portal authenticates through linked panel account; dashboard fails to recheck exited status (follow-up).
- APIs: enquiry/callback, CAPTCHA-required, analytics, bug reports, image delivery, health, email inbound/unsubscribe, visitor chat/SSE, admin chat/search/meeting management, token-based public meeting submission, scripted SalesBot demo. No GraphQL endpoint found.
- Chat/assistant uses repository-authored logic (`assistant.ts`/`salesbot.ts`); no external paid LLM integration was found in the inspected call inventory. Human chat persists to PostgreSQL; local pub/sub and 5-second worker support transitions. No durable distributed queue.
- Content: generic `ContentItem` collection JSON + services/industries/settings. Published-only readers for managed case studies/articles; schema validation and honest empty states. Preview routes are labelled/noindex but available publicly; they must not participate in AI permission/Markdown publishing. No scheduling/slug-history service is established.
- Images: Next Image, local public assets, attached case-image base64 JSON rendered through `/api/cs-img`, browser-side crop/compression; no separate object storage/upload endpoint found. Image MIME/content safety requires deeper review; SVG acceptance cannot be inferred safe from a `data:image/` prefix.
- Email: Nodemailer SMTP, optional HR transport, editable templates, sent records, suppression list, inbound shared-secret webhook, separate IMAP poller script. Public submissions trigger fire-and-forget notifications after storage. SPF/DKIM/DMARC and actual delivery are not verified.
- Analytics: central `track()` → GA dataLayer + first-party collector, AnalyticsBeacon, delayed GA loader. Collector strips query strings but private path tokens can remain. External raw-IP geolocation currently uses HTTP ip-api.com. Consent policy and retention are not implemented/verified.
- CAPTCHA: Google reCAPTCHA v2, progressive after submission/login thresholds. Optional keys, fail-open if secret missing; no fetch timeout. Deployment pairing needs validation.
- SEO: root/page Metadata, canonical production origin helper, noindex-by-default environment gate, robots, generated sitemap, per-page JSON-LD, OG images, redirects for legacy resources/career/service slugs. English only; no i18n routing/hreflang implementation found.
- Crawler layer: middleware cookie gate + POST Origin guard, content signals/training permissions, loopback HTML→Markdown negotiation. Existing deployment headers include CSP (production no unsafe-eval, inline bootstrap permitted), HSTS, nosniff, referrer/permissions policy. CDN/host/proxy trust is assumed in code, not verified.
- Monitoring: JSON logger, public DB health probe, error boundaries and database bug reports; no external APM/RUM vendor found. Logging call sites can include PII/raw provider error messages.
- Tests: Vitest integration-style tests with mocked Prisma, Playwright-core/installed browser manual scripts. Existing GitHub Actions: npm ci, lint, typecheck, tests, build, **nonblocking** npm audit. No secret-scan or dependable migration/restore gate.
- Deployment scripts describe Cloudflare → nginx → PM2/Next port 4300, dev→test→prod promotion. This local folder is **not a Git checkout**. Updater performs reset-hard, schema push, build then restart; no atomic release/backup/rollback proof. Do not execute during this audit.

## Boundary/data map

| Input | Processing/storage | Recipients/access | Follow-up |
|---|---|---|---|
| Public enquiry/callback/career data | Zod, honeypot, rate limits/CAPTCHA → ProjectEnquiry, salted IP | Granted admin sections, SMTP/internal notification | Idempotency, outbox, consent/attribution, retention |
| Admin/client/employee credentials | bcrypt → hashed DB session token + essential cookie | Corresponding account | MFA/idle/absolute expiry, credential limits/revocation |
| Chat contact details/messages | visitor cookie + public token → chat tables | Visitor-owned thread, chat-granted agents | Stream quotas/revocation, private-event scope, raw-IP salt, retention |
| Meeting token/preferences | hash lookup → meeting, attendees/activity | Bearer link + client/admin flow | Never publish/cache private URL; lifecycle/race validation |
| Inbound email | shared secret → emailReply + matching enquiry | Email-granted admin | Fail closed, bounded body, delivery failure status, dedupe |
| Analytics/report data | daily visitor hash/path/referrer or report details → DB | Granted operations users | Private-token scrubbing, consent, retention, geo processor |
| CMS text/images | schema → content JSON / image API / HTML & JSON-LD | Published public records; drafts admin | Safe serialization/MIME, slug history, payload projections |

## Prioritized remediation ledger

| ID | Priority | Finding | Planned control | Phase |
|---|---|---|---|---|
| SEC-01 | P1 | Next 16.3.6 affected by current advisories (npm registry report) | Verified same-line 16.3.8 patch + aligned eslint-config-next; no force upgrade | 4 |
| SEC-02 | P1 | Admin meeting APIs/page mapping omit clients grant; search ignores grants | Explicit per-operation authorization and permission-scoped queries | 4 |
| SEC-03 | P1 | Career actions authenticate only | Action-level career grant checks before reads/writes/email | 4 |
| SEC-04 | P1 | Common dashboard shows all leads/finance/audit to editors; admin stream includes cross-section PII | Safe editor workspace; scope notification events | 4 |
| SEC-05 | P1 | Unconfigured inbound webhook accepts unauthenticated email; advertised body limit absent; failures return 200 | Fail closed, actual bounded body, mailbox validation, safe 5xx | 4 |
| SEC-06 | P1 | Markdown private meetings, trusted forwarded host, public cache, no negotiation isolation | Exclude private/previews, safe canonical origin, bounded noncached fetch, content Vary | 4 |
| SEC-07 | P1 | Mutation guard covers only POST; body checks after full read | Guard unsafe API methods, byte-stream bounds + timeout | 4 |
| SEC-08 | P1 | Local limiter cap not a hard cap; no distributed guarantees | Bounded limiter then deployment-specific shared store; ingress trust tests | 5 |
| REL-01 | P1 | DB connection exhaustion observed in earlier build; SSR amplification | Connection budget/pool, query projections/cache policy, build worker limits | 5 |
| REL-02 | P1 | Email fire-and-forget/lead retries no durable dedupe | Approved expand-only migration for outbox/idempotency; safe retry semantics | 5/12 |
| OPS-01 | P1 | Release reset/db push/no backup or tested rollback evidence | Reviewed release/migration and restore plans; no destructive execution | 14/15 |
| SEC-09 | P1 | Employee session outlives exited status; sync bcrypt blocks event loop | Recheck access + bounded async password work; test revocation | 5 |
| SEO-01 | P1 | Page robots:true overrides global staging gate | Enforced nonproduction X-Robots-Tag/index gate tests | 8 |
| PRIV-01 | P1 | Private URLs in analytics/report data; external raw-IP HTTP geo; policy understates collection | Data minimization + actual consent/processor review | 5/12 |
| DATA-01 | P2 | Some CMS JSON-LD serialized without escaping '<'; broad image MIME accepted | Central safe serializer + actual raster validation | 6/9 |
| SEO-02 | P2 | Sitemap uses current time as every lastmod; robots omits portals/meetings/previews | Truthful dates/public URL registry and private-policy tests | 8 |
| AI-01 | P2 | Training permission hardcoded, llms facts bypass approval, some industry URLs wrong | Owner training choice; canonical factual manifests; current official crawler docs | 10 |
| PERF-01 | P2 | Public readers fetch image-bearing JSON; production DB/render timing unknown | Tagged 60s public-data cache with immediate CMS invalidation; local build/browser measurements; live query-plan/CWV review remains open | 7 |
| TEST-01 | P2 | Global lint includes generated local review artifacts | Exclude artifacts, retain application/test checks; future CI scans | 14 (early hygiene) |
| ARCH-01 | P3 | v6/stale architecture and workflow docs | Incremental verified docs and ADRs; avoid folder rewrite | 6/14 |
| FUT-01 | P4 | Distributed cache/chat worker, IndexNow change feed, field CWV | Add when actual deployment/provider/scale decisions justify | 10/15 |

## Ordered execution and change gates

1. Reconnaissance + map (this document), baseline checks, redacted source scan and registry advisories.
2. Small P1 boundary-fix batches. Prove denial **before** database/email, authorized happy paths, malformed/oversized/chunked requests, private Markdown/cache behavior.
3. Reliability/database/environment work. Establish production/staging isolation and connection budget before load tests or migrations. No live schema mutations.
4. Architecture/performance/SEO/entity/crawler work, preserving URL map and factual approval gates. Read current official crawler policies before crawler-specific changes; training is a business choice, not search opt-in.
5. Content/lead/accessibility work. Do not invent proofs, staff, outcome metrics, legal compliance, security mailbox or privacy consent choices.
6. CI/release/readiness: build in isolated nonindexable configuration with no real notification sending; route smoke, restore rehearsal and staging approval before promotion.

Security baseline: OWASP ASVS **5.0**, target an L2-oriented applicable-control review (not certified compliance). Track controls by security domain initially; exact requirement-level coverage and gaps will be added as each domain is tested. OWASP Top 10 complements, not replaces, ASVS. Evidence-based source review/mocked integration tests are not penetration testing or infrastructure verification.

### Baseline check results

- 673 tests pass / 43 files; TypeScript passes.
- Global lint: 58 errors / 3341 warnings, predominantly generated `tmp` fixtures; application-only results will be recorded separately.
- npm audit: 10 high affected-package entries, **not ten independent vulnerabilities**. Includes Next runtime advisories and transitive tooling issues. npm proposes unsafe downgrades for some chains; do not run `npm audit fix --force`.
- Current registry advertises Next 16.4.0; choose 16.3.8 security patch first, not an unnecessary minor upgrade. Framework support policy and advisory sources must be captured, not guessed from installed version.

## Current local checkpoint — Step 07

The initial risk ratings and stack table above remain historical. The current local snapshot includes Steps 01–07: narrowed admin authorization, bounded/revalidated streams, encrypted one-use password receipts, high-entropy meeting-link authorization, server-side meeting-slot/concurrency checks, fail-closed unsubscribe persistence/suppression, passive-raster case-image delivery, blocked-cookie denial, truthful sitemap/crawler controls, selected single-record published-content reads, and tagged public-data caching with immediate CMS invalidation. Step 07 also delays the transition veil to 600 ms, replaces per-frame React loader updates with CSS transitions, and cleans unused code.

Current local verification is **1,245 tests / 87 files**, typecheck, an isolated no-database/no-mail production build, and lint with **0 warnings / 0 errors** (see [Steps 04](./STEP-04.md)–[07](./STEP-07.md)). Local loopback/browser checks are documented in Step 07 and do not establish live database latency, cache-hit performance, field CWV, or production readiness.

**Readiness remains provisionally 4/10.** Important release blockers remain: old meeting-reference links are intentionally rejected by the new local code and require owner-approved rotation/re-issue before promotion; ingress logs may contain path bearer tokens; client passwords remain emailed and retained in the Sent archive without forced change/expiry; Prisma/deepmerge still has three high affected-package entries in the production-audit report; process-local limits/streams are not distributed; and release/database/mail/privacy/accessibility/performance evidence is not certified. No production database, deployed source or infrastructure was accessed in Steps 04–07.

### Required owner/operations evidence (continue safe work without these)

Reviewed Git release source; staging/production database isolation; nginx/Cloudflare trusted-header configuration and origin firewall; actual pool/max-connections; SMTP staging sink + delivery/domain-auth checks; privacy/consent/retention decisions; public fact/media authority; AI training decision; real security disclosure contact; backup/restore test and release rollback procedure. No fabricated placeholders will be published as facts.
