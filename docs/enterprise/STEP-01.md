# Step 01 — architecture map and first high-priority fixes

**Verdict: locally verified milestone, not enterprise/production clearance.** Continue with the open ledger in [ASSESSMENT.md](./ASSESSMENT.md). No deployment, database migration, credential rotation, real email or aggressive/live security test was performed.

## What was found, changed and verified

### Dependencies / build boundary

- Next 16.3.6 was affected by registry advisories. Updated **Next and eslint-config-next to exact 16.3.8**; source-map-js **1.2.1 → 1.2.2** is a compatible transitive lockfile patch. No major upgrade, forced audit fix or dependency downgrade.
- Official Next support policy confirms 16.x is Active LTS. Official 16.3.8 release and advisory sources were retrieved and retained. **Image SSRF applicability:** the advisory requires attacker-controlled allowlisted remote image URLs; this configuration has no `images.remotePatterns`, so that particular exploit path is not demonstrated. Other cache/metadata advisories still justify the patch. An audit hit is not proof of exploitability.
- Initial Webpack validation found the existing instrumentation early-return guard did not eliminate Node dependencies from its Edge compilation. Changed to the documented positive `NEXT_RUNTIME === "nodejs"` import branch; Node worker behavior is unchanged.
- The next build exposed Node HMAC signing inside browser-imported mail templates. Moved signing to server-only `src/lib/mail/unsubscribe.ts`; previews render a non-signed placeholder, and the server send boundary stamps the signed URL. The **existing lowercase-email HMAC/SHA256/salt/32-hex signature contract is retained**, so prior links remain valid. This was a build/server-client boundary finding, not a demonstrated leaked production secret.
- Template appearance/copy and existing admin preview interfaces were not redesigned.

Files: `package.json`, `package-lock.json`, `src/instrumentation.ts`, `src/lib/mail.ts`, `src/lib/mail/templates.ts`, new `src/lib/mail/unsubscribe.ts`, unsubscribe API/page/action imports.

Verification: deterministic isolated `npm ci --ignore-scripts` + explicit `prisma generate` (generation only, no database connection); successful **Webpack and default Turbopack production-content/noindex builds**; instrumentation and signed SMTP tests with mocked transport.

Remaining: **8 high affected-package entries across 2 underlying advisory chains** (`braces` and `deepmerge-ts` plus parent packages). `npm audit --omit=dev` still reports 3 Prisma/config/deepmerge entries because of the client/tool dependency graph. These are not proven remotely reachable request-path flaws. Review compatible upstream fixes/backports; do not accept the audit tool's proposed framework/Prisma downgrades. No clean-audit certification.

### Admin authorization and data minimization

- Meeting list/create/detail/update/delete handlers now enforce `clients` permission **before** DB/service operations. Permanent deletion additionally requires administrator role. Non-object JSON mutations are rejected rather than dereferenced.
- Admin search performs **only** queries for granted content/enquiry sections, caps query length, limits per-user search, and returns private/no-store. Hidden data is not fetched and then merely filtered visually.
- Career actions now authenticate and enforce either existing enquiries or recruitment (`hr-portal`) grants. Records must have a supported career project type; recruitment access cannot mutate unrelated sales enquiries.
- The cross-department aggregate dashboard remains available to administrators. Editors receive a permission-scoped workspace without fetching lead/finance/audit records. Their section workflows are preserved.
- Meeting page mapping now belongs to `clients`; proof mapping belongs to `audit`; query strings are stripped before path mapping. Unknown roles cannot inherit editor permissions.
- Chat notification transport filters `email.new`/`enquiry.new` payloads by corresponding section grant, instead of exposing them to every chat-granted editor.

Files: `src/lib/permissions.ts`, admin dashboard/career actions, admin search/meeting APIs, `src/lib/livechat/admin-guard.ts`, admin SSE route.

Verification: real handler/action calls with mocked persistence and notifications; denial before queries/writes/sends; permitted search/create/send/shortlist paths; admin vs editor permanent deletion; editor rendered HTML; cross-section event policy.

Remaining: this is **not** an exhaustive authorization audit of every page/Server Action. Layout-only protection, all read DTOs, recruitment field filtering, HR/compose scope consistency, private SSE revalidation/revocation, pagination, race/transaction behavior and live DB permission tests remain in later batches.

### Inbound email security/reliability

- Missing `EMAIL_INBOUND_SECRET` now returns **503**, incorrect/missing supplied secret **401**. Unauthenticated delivery no longer enters the inbox.
- Existing header-secret and query-secret provider contracts remain; header is preferred. Query values must be redacted in ingress logs.
- Stream-counted **1MB** cap and deadline precede multipart/urlencoded/JSON parsing. Invalid payloads do not receive a fake storage acknowledgement.
- Recognized root and existing `reply.savotechnologies.com` recipients are mapped explicitly. Unknown recipients are rejected rather than rerouted to hello. Sender/recipient mailbox format and newline injection are validated.
- Failed storage returns **503**, allowing provider retries. The route does not log sender/subject/raw database error content on successful or failed storage.
- `.env.example` documents the required shared-secret integration setting using a placeholder only.

Files: inbound route, `.env.example`, shared bounded body reader.

Verification: mock-backed JSON/multipart/urlencoded positive paths, missing/wrong secret, recipient rejection, oversized bodies with/without Content-Length, malformed payload, storage outage, safe logs/responses.

**Promotion prerequisite:** configure the shared secret in the actual provider and deployment before enabling/promoting this integration. No production secret was changed. Shared-secret authentication proves provider possession, not that the original email sender is authentic. Retry deduplication/transactional uniqueness, provider replay signatures, attachment policy, legitimate mailbox variations and actual deliveries still require review. Returning 5xx avoids deliberate acknowledgement of loss but does not guarantee provider retries.

### HTTP / private discovery boundaries

- New byte-stream body reader counts actual bytes (not JS character count), rejects overflow before full buffering, cancels rejected reads, and bounds stalled streams. Shared JSON envelopes are **32KB** to accommodate validated 4000-character multilingual messages plus metadata; schema field caps are unchanged. JSON media types are matched precisely.
- Unsafe API methods **POST/PUT/PATCH/DELETE** receive the existing Origin check; browser `Sec-Fetch-Site: cross-site` is rejected. Non-browser webhook clients without Origin retain their contract and must authenticate independently.
- Private portal/admin/API/employee/meeting/unsubscribe and editorial-preview paths never negotiate Markdown or receive AI discovery permissions. Malformed encoded paths fail closed in the publication policy.
- Sensitive matched routes receive no-store/no-referrer/noindex response policy. The published image API retains its own cache authority.
- Public discovery Link URLs use the configured canonical origin, not forwarded Host/proto or query parameters.
- Public Markdown is unauthenticated loopback HTML only (no forwarded cookies), time/size bounded, no redirect following, no-store and Vary: Accept. HTML negotiation also varies on Accept. Matched nonindexable deployments receive X-Robots-Tag regardless of child metadata overrides.

Files: `src/lib/api.ts`, new `src/lib/http-body.ts`, new `src/lib/publication-policy.ts`, `src/middleware.ts`.

Verification: chunked/advertised/forged body lengths, UTF-8, parser errors, timeout/cancellation, private/no-fetch paths, host/query poisoning guard, Origin method matrix, normal HTML vs public Markdown. Compiled server verifies actual merged headers, not merely helper output.

Remaining: raw `req.json()` users (analytics, reports, SalesBot) still need conversion to bounded parsing; proxy body buffering/slowloris controls are infrastructure responsibilities. No Origin is **not** authentication, and proxy header trust is still an unverified deployment assumption. Middleware convention remains deprecated; a separate reviewed proxy migration is queued. Existing crawler training signals on public pages have **not** been treated as approved owner policy or changed in this batch. Official OpenAI docs confirm search and training controls are independent; owner training policy is still required.

### Lint gate hygiene

Global lint previously analyzed generated local browser fixtures (58 errors, 3341 warnings). `eslint.config.mjs` now excludes `tmp/**`, benchmark artifacts and root temporary scripts, not application/test files. Application lint passes with **0 errors / 24 existing warnings**. No rule was disabled to conceal application findings.

### Repository artifact safety

`.gitignore` now excludes local review evidence, benchmark captures, temporary request logs/scripts and Vitest caches in addition to existing environment/private-key exclusions. These artifacts can contain private request data and must not enter a public release repository. Fourteen actual `git check-ignore` checks passed in a throwaway fixture; `.env.example`, application/tests/docs, migration SQL and the lockfile remain eligible. The actual project was not initialized or committed. Ignore rules do not remove already tracked files/history; the real release repository still needs a history/secret review.

Files: `.gitignore`, README (v7 brand/stack, audit links, deterministic install and local-only schema/seed warnings).

## Final verification

Evidence directory: `tmp/enterprise-audit/step-01/`.

- **801 tests / 49 files pass** (baseline 673 / 43; 128 regression checks added in six test files).
- TypeScript passes; application lint has 0 errors/24 warnings.
- Deterministic isolated install succeeds. Prisma client generation succeeds; no schema push or migration.
- Webpack production-content/noindex build succeeds after two discovered boundary repairs.
- **Default Turbopack build succeeds with final package lock.** Built application/config/manifest inputs match current source hashes; no application drift.
- **36 compiled-runtime/browser checks pass**, zero unexpected browser runtime errors. Includes public routes/canonicals/security headers, robots/sitemap, 404, private Markdown, unsafe methods, anonymous search, honest no-DB enquiry failure and unconfigured webhook; Chromium layouts at 320/390/1440.
- Builds and runtime ran from `/Users/om/savo-enterprise-build-step01`, with **DATABASE_URL unset, SMTP unset, no GA, production content, indexing false**. Managed content is absent there; this does not prove production database availability or real featured-case content delivery. No live admin accounts, mail, CAPTCHA/provider, calendar, backup, load or infrastructure tests.
- Initial runtime assertion wrongly expected a private page to have no Link header at all; Next legitimately adds font preloads. Corrected the harness to reject **AI/discovery Link relations**, not safe font preloads. No app change was needed. First result 35/36; confirmation and final 36/36.
- A build attempt used empty DATABASE_URL and was correctly rejected by current Zod config. Subsequent isolated builds **unset** it. Optional-empty normalization and production-required env validation are next-phase work; this was not fixed by bypassing validation.
- Source scope: 707 initial hashed files, plus pre-edit archived ESLint config outside that manifest; **23 existing files changed** (including README and ignore-policy corrections), 3 new shipping helpers, 6 new tests, audit documentation only otherwise. 685 initially hashed files remain unchanged; no file/route/asset deletion. All homepage/hero/portfolio CSS/copy/assets and other public layouts remain unchanged. The live-chat guard original was reconstructed from its prior full tool read and verified against its pre-edit hash.

The isolated 4316 verification server was stopped after the final checks. The original dev/other previews were not restarted or deployed; a long-running dev process may still identify its previously loaded framework version until restarted. Patch validation applies to the matching isolated production builds/runtime, not the older live deployment.

## Next controlled batch (Step 02)

1. Runtime/env separation: server-only configuration, missing critical production settings fail safely, optional integrations explicit, CAPTCHA pairing, no real mail in preview/staging. Establish environment authority before adding enforcement that might break legitimate releases.
2. Auth/session reliability: async bounded password verification, bcrypt input-byte policy/compatibility, exited employee and linked-account revocation checks, client timing/log privacy, session expiration/revocation tests. Do not invent MFA enrollment or lock out current operators.
3. Hard-bounded local limiter with per-bucket windows and explicit clear operation; deployment-specific distributed limiter/ingress trust design. No claim that local memory limits withstand distributed attacks.
4. Bound remaining public parsers; redact private path tokens from analytics/reports and logger call sites; remove or explicitly authorize raw-IP geo processing. Resolve genuine privacy policy mismatch with owner/legal input, not an unsupported compliance claim.
5. Establish a PostgreSQL connection budget, server-only client guard, worker nonoverlap and query DTO/pagination plan. No migration until isolation, backup and approved expand-only plan are available.

Then continue phases 6–15 from the master plan. P1 risks remain open; the readiness estimate is not increased merely because tests pass.
