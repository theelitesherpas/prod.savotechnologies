# Step 02 — runtime, authentication and process reliability

**Verdict: locally verified second milestone, not production/ASVS clearance.** Initial readiness remains provisional 4/10; material deployment, authorization, database and privacy risks remain. [Initial assessment](./ASSESSMENT.md) · [Step 01](./STEP-01.md) · [Runtime/release prerequisites](./RUNTIME-OPERATIONS.md).

## Findings → implementation → verification

### Server/client and release configuration

- The old environment module mixed public configuration with DATABASE_URL/IP salt and an `isServer` branch. Public `env.ts` now exports **only public fields**; new `server-env.ts` and Prisma have actual `server-only` guards. Private configuration errors name fields, not credential values. Blank optional DATABASE_URL is treated as unconfigured, preserving honest no-DB previews.
- New `scripts/verify-runtime-env.mjs` checks an **already loaded** preview/live environment, with no dotenv reads, network, DB writes or secret-value output. Live requires production content/runtime, private salt, explicit mail mode and explicit positive connection-limit/pool-timeout URL parameters. Preview rejects live mail/indexing; partial CAPTCHA/SMTP credentials are rejected.
- A compiler boundary review found browser `compose-form.tsx` imported employee formatting from a module that also imported Prisma. Split pure `employee-model.ts` from server-only `employees.ts`; only the composer's import path changed. Existing labels, leave-credit calculation, date formatting, employee-code contracts and every template variable remain. No demonstrated prior browser credential leak is claimed.
- SMTP is **off by default**, even if credentials are present; `MAIL_DELIVERY_MODE=live` plus production runtime/content is the explicit application opt-in. Preview/off paths create no transport. Existing configured production sends, signing, SMTP payload and unsubscribe signature contract remain when intentionally enabled. Mail logs no longer echo recipients, subjects or provider error strings.

Files: `src/lib/{env,server-env,prisma,employee-model,employees}.ts`, `src/components/admin/compose-form.tsx`, `src/lib/mail.ts`, `src/lib/mail/delivery-policy.ts`, existing env consumers, `.env.example`, new preflight script.

Verification: public config has no secret fields; blank/invalid private config; redacted CLI success/denial matrix; actual deterministic isolated install, generation and **Webpack/Turbopack builds** with poison guards; pure employee fixtures; disabled/demo/test SMTP and enabled/failing SMTP with mocked transport. The existing signed-SMTP regression test now explicitly establishes an enabled production test context, rather than accidentally sending by presence of MAIL_HOST alone.

**Promotion gates:** configure the live mail opt-in intentionally, review actual legacy hash costs/long credentials, paired build/runtime CAPTCHA, actual DB budget and matching deployment environment. Preflight is not yet wired into the old updater/promotion pipeline; it does not independently prove environment authority or valid credentials. No `.env` file was inspected/copied/changed. SMTP provider/TLS/timeout/outbox/receipt checks remain open.

### Password work, lifecycle and session revocation

- Admin/client synchronous bcrypt hashing and employee `compareSync` became a shared **cooperative async bcryptjs** verifier. Four simultaneous jobs, no unbounded queue; overload fails safely. New hashes remain bcrypt cost 12 and refuse inputs exceeding **72 UTF-8 bytes**, including multilingual overflow.
- Existing ≤200-character long-password logins keep the prior bcrypt truncation contract; no existing password/hash was modified. Supported stored costs are 4–16, bounding pathological work. Actual higher-cost legacy hashes are unverified and require a compatibility/reset plan **before promotion**. This is not a migration to Argon2, a native worker pool, or a full constant-time/network-enumeration proof.
- Unknown client and employee accounts perform dummy bcrypt work; unknown/unlinked/exited employee logins share a generic failure. Client/employee logs no longer echo failed email addresses or account-existence flags. Per-email limiter keys are hashes; employee login now also has an email limit.
- Admin login/session resolution rechecks linked employee lifecycle and recognized roles. Unlinked legitimate administrators still work. Employee dashboard rechecks current lifecycle and existence of portal access **before authored-content queries**; missing links/exited/unknown states deny access.
- Session resolvers reject exact expiry. Remembered admin sessions now have a fixed **30-day absolute ceiling**, matching the already-existing cookie; the prior DB-only infinite sliding renewal was removed. Normal login/cookie formats and the 24h admin /12h client /7-day employee lifetimes remain.
- Password reset is a Prisma transaction: optimistic check of the prior hash, credential change, related admin-session revocation and linked employee-session revocation together. The current reauthenticated actor's own admin session is the sole keep exception. The employee link is taken from the row returned **inside the transaction**, not a stale pre-hash lookup.
- Authenticated session/login queries select the needed fields; resolving admin sessions does not fetch a password hash or full employee record.

Files: new `src/lib/{passwords,employee-access}.ts`, `auth.ts`, `client-auth.ts`, `admin-account.ts`, employee actions/dashboard, admin user actions.

Verification: real bcrypt roundtrip/legacy compatibility, byte boundaries, malformed/cost bounds, async-not-sync calls, held/rejected work/capacity recovery; mocked real login/action/session calls covering cookie/token contracts, role/lifecycle/expiry, generic denial/dummy work, granted paths, before-query denial, transaction arguments, stale-link prevention and failure without fake audit/success. **No real PostgreSQL transaction/rollback, account login, credential rotation or session deletion occurred.**

Remaining: idle expiry/MFA/reset-token design, revocation during existing SSE connections, comprehensive page/Server Action/DTO authorization, multiple panel accounts per employee, authentic old-cost inventory and real isolated DB race tests. These controls do not close all ASVS authentication/access-control requirements.

### Hard-bounded process-local rate limits and CAPTCHA

- The old map could exceed its 5000-key cap when no bucket was expired, and cleanup used the incoming request's window. The limiter now has hard bounds on keys, retained hits and policy values; cleanup uses **each bucket's own TTL**.
- New keys fail closed at active capacity, without evicting active login protection. Conflicting window policies fail closed. Cleanup runs at most once/second under saturation. `rateCount` is read-only and fails closed under saturation.
- `clearRateLimit(key)` replaces the broken zero-limit/1ms CAPTCHA-clearing workaround. Successful login immediately clears its own failure bucket, without touching another key.
- Both CAPTCHA keys absent retains the existing optional integration. A **partial pair** now returns an honest verification-unavailable error instead of bypassing verification or trapping forms. Provider checks have a five-second timeout, require successful HTTP + boolean success, omit raw `remoteip`, and use sanitized failure logs. The required-check API retains existing fields and adds `unavailable`.

Files: `src/lib/rate-limit.ts`, `captcha.ts`, CAPTCHA check API.

Verification: actual 5000-key saturation + additional denied keys, 1000-hit ceiling, mixed TTL cleanup, exact expiry, invalid policy/key inputs, no active eviction, per-key immediate reset; optional/partial/valid CAPTCHA, HTTP/network/error/falsy-provider responses and timeout signal without raw-IP submission, all provider requests mocked.

Remaining: **not distributed protection**. Key-churn saturation can deny legitimate users; proxy/header trust, origin firewalling, shared-store/edge limits and connection quotas must be implemented against verified topology. No live flood/load test or new Redis dependency.

### Public parser bounds and privacy minimization

- Remaining analytics/report/SalesBot `req.json()` calls now use the streaming byte/deadline reader. Reports receive a 64KB envelope for their existing multilingual diagnostic limits; ordinary beacons/demo remain 32KB. Null/arrays/non-object collector payloads cannot reach writes. Existing response/error contracts are retained.
- New pure telemetry policy excludes private portals/admin/meeting/unsubscribe/API/previews, including encoded/normalized paths; public top-level URL/referrer context loses credentials/query/fragments. Private-page report payloads are dropped entirely rather than storing invitation/account details in messages/stacks.
- Analytics no longer calls the external **HTTP raw-IP geolocation** provider. New geography fields remain unset; historic data and dashboard routes are unchanged. The old geo helper remains unused; it is not an approved integration.
- Collector persistence errors no longer echo raw error strings. Visitor hashes are correctly described as **pseudonymous**, not guaranteed anonymous/unlinkable.
- SalesBot now enforces its 500-session cap **before insertion**, retains at most 40 server transcript messages and enforces 30-minute absolute/idle logical expiry. Engine slots/turn counts and browser conversation presentation remain; there is no CRM/delivery guarantee.

Files: new `src/lib/telemetry-policy.ts`, analytics/report/demo routes.

Verification: private/encoded/dot-segment cases, public context sanitation, collector happy paths/denial/oversize/multilingual reports, no geo invocation/log echo, real demo engine happy path/history/capacity/absolute expiry; real oversized/malformed HTTP demo requests against compiled server.

Remaining: client transmissions/GA/event-name allowlist, free-form **public** diagnostic data, other logger call sites/proxy logs, consent/retention/deletion/processor approvals and actual privacy-notice accuracy. Existing stored private URLs were not altered/deleted. Logical memory expiry is not physical timed erasure. No legal-compliance certification.

### Database/worker reliability

- Prisma is one guarded client per process/module realm in production too, with explicit parsed URL and no configured raw engine-error logging. No database URL/pool value/schema/index was changed.
- Chat interval skips ticks while a sweep/presence pass is running; completion/error releases its in-flight guard. Existing once-per-process timer and schedule remain.
- Wrote a connection-budget/topology checklist instead of guessing production pool limits. Isolated builds use no database; previous connection-exhaustion evidence is still unresolved in the actual deployment.

Verification: constructor mocked to prove one production client across module reloads/no client for blank DB; held/rejected worker passes prove nonoverlap and recovery. No actual database connection budgeting, PM2 clustering, worker leader lease, pub/sub delivery or stuck-query recovery proof.

## Final checks and scope

Evidence: `tmp/enterprise-audit/step-02/` (originals, before hashes, logs, runtime harness/result and scope/built-input checks).

- **939 tests /59 files pass**, up from 801/49: 138 added checks in ten files. TypeScript passes. Lint **0 errors /24 inherited warnings**.
- Isolated deterministic `npm ci --ignore-scripts` and explicit Prisma generation succeed. No migration/seed/schema push.
- **Webpack and default Turbopack production-content/noindex builds pass.** Middleware deprecation warning remains. Builds used no DATABASE_URL, no SMTP/GA, mail off; no production capacity or managed-content availability claim.
- **44 compiled HTTP/Chromium checks pass**, no unexpected browser errors, widths 320/390/1440: public canonicals/headers/noindex/routes/404, private Markdown, anonymous/forged-cookie recovery, honest health/enquiry/webhook failure, CAPTCHA optional-off and demo happy/malformed/oversized paths. Authenticated DB/privacy persistence/provider behavior was tested with mocks, not real storage/mail/CAPTCHA.
- No dependencies/lockfile changed. Fresh audit still reports **8 high affected-package entries** (Prisma/deepmerge and ESLint/glob chains); no Next entry. No forced audit fix or downgrade.
- 716-file baseline: **25 existing files changed, 691 unchanged, no deletion**; six shipping helpers, one script, ten tests and two audit documents added. No CSS/image/public business-content change; the sole browser-composer change is an import path. Original public URLs/layouts/hero/portfolio/copy/assets are preserved.
- Isolated project: `/Users/om/savo-enterprise-build-step02`. Its temporary 4317 server is stopped after checks; main dev/other previews were not restarted/deployed. The original long-running process may still carry earlier loaded modules until restart.
- Finish review/documentation performed inline, not independently. Local builds/tests are not production, infrastructure, browser matrix, actual credentials, backend delivery, database or legal verification.

## Next milestone — remaining P1 access/reliability boundaries

1. **Page-level/DTO authorization first.** Installed Next authentication docs explicitly warn that layouts do not prevent children/parallel RSC segments from executing or appearing in payloads. A direct guard-call inventory found only 2 of 38 protected admin page files referencing guards; this is a review lead, not proof every other page leaks. Inspect/guard data readers and prove private sentinel data absent from direct/RSC/partial-navigation requests, with synthetic role fixtures.
2. SSE session/lifecycle/section-grant revalidation, stream lifetime/concurrency limits, client ownership and all Server Actions. Do not rely solely on navigation hiding or the protected layout.
3. Outbox/idempotency/suppression/retry and truthful admin email status; real isolated Postgres tests need approved isolation/schema plan before migrations.
4. Actual ingress/distributed limits, database budget, staging credentials/sink and release preflight wiring require owner/operations evidence from RUNTIME-OPERATIONS.md.

Then continue safe JSON-LD/image validation, factual SEO/AI crawler manifests and measurement/UX/CI phases. No deployment or destructive production testing is authorized by this document.
