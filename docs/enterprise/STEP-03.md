# Step 03 — page authorization, department DTOs and live-stream authority

**Locally verified milestone; not production/ASVS clearance.** The enterprise audit remains open, with provisional readiness **4/10** unchanged. No deployment, real account/credential operation, database/schema mutation or provider delivery occurred. [Assessment](./ASSESSMENT.md) · [Step 02](./STEP-02.md) · [Operations prerequisites](./RUNTIME-OPERATIONS.md).

## Findings and controls

### Independent admin-page authorization

Installed Next authentication/data-security documentation warns that layouts do not guard independently executing child RSC segments. The initial two-of-38 direct-guard inventory was a review lead, not proof every page leaked.

- All **38 protected admin leaves** now await `requireAdminPage()` with a **page-owned route policy**, before private queries. The composer first reads its untrusted department parameter, then checks that exact scope before recipient queries. Neither a forwarded pathname nor navigation hiding supplies page authority.
- Authentication comes from the current server-side session, including Step 02 role/linked-employee lifecycle checks. Users management stays administrator-only; dashboards retain the limited editor workspace. Unknown page policies fail closed. Route mapping uses segment boundaries; Content Inventory now matches its existing **Audit** navigation grant rather than the misleading `content` prefix.
- The protected shell queries counts only for granted sections. Emails, Bug Reports and HR-compose navigation match their actual grants; a non-chat actor no longer mounts a doomed chat subscription. No public chrome/layout or admin styling changed.
- `getAdminItems()` and `nextEmployeeCode()` independently guard their private reads. This is incremental reader protection, **not a complete DAL/Server Action rewrite**.
- Self-profile selects the linked employee relation rather than retrieving the panel account's password hash and unrelated account fields.

### Department and client ownership boundaries

- The old composer fetched **both** active client contacts and employee records (including compensation), even for a single department. It now queries and serializes only the authorized selected department; explicitly dual-granted unscoped composition retains both pools. Existing form/template fields and send actions are unchanged.
- Recruitment listing requires both the canonical career category and its JSON form marker. It cannot pull ordinary sales enquiries solely because a JSON marker says `careers`. Legacy/misclassified records need reviewed correction, not silent authorization broadening.
- All four authenticated client leaves already checked sessions and primary ownership independently of the layout; new regressions prove those clauses. Two related-reader gaps were repaired: project-detail invoices must belong to the same client and exclude drafts; invoice-linked project metadata must also belong to that client. Independent foreign keys alone do not establish common ownership.
- No actual client/invoice relationship or record was modified. Prisma 6.19.3's filtered nullable-relation arguments pass typechecking and both compilers; real PostgreSQL isolation/integrity testing remains unapproved/unperformed.

### Stream revocation and bounded resources

The old streams authenticated once, captured grants indefinitely, had no lifetime/connection/byte budget and relied on consumer cancellation for cleanup.

- Admin streams capture only the original cookie's **hashed credential**; an uncached resolver rereads the session, absolute expiry, recognized role, linked lifecycle and current grants before every bounded event batch and idle heartbeat. Email/enquiry notifications use those fresh section grants. Removing chat authority closes the stream; narrowing email authority suppresses that PII while chat continues.
- Visitor streams use an **existing cookie only**, with SQL ownership/blocking predicates and minimal `id/visitorId/status/mode` selection. They recheck the same identity/conversation and supplied public token. Anonymous stream requests do not create orphan visitor rows; foreign/deleted/blocked authority cannot remain streaming. Conversation-channel filtering also rejects mismatched-thread/admin events.
- Shared server-only `authorized-stream.ts` bounds each process to **128 streams**, six/operator and four/visitor identity; **15-minute** absolute lifetime; **64 pending frames /128KiB**, **16KiB/frame**, and a separate **128KiB readable buffer**. Excess opening returns 429 without evicting an existing lease. Overflow/backpressure/failure/timeout/abort/cancel/lifetime closes and releases subscriptions, timers and quota idempotently.
- Authority is polled every **15 seconds** when idle; authority/heartbeat responses have five-second deadlines. This is not zero-latency revocation, a real-time scheduling guarantee or cancellation of a stuck database query. Already authorized buffered/sent data cannot be recalled; each event batch uses an authorization snapshot.
- Opening/pinging updates authorized presence only, preserving manually chosen away/busy status. Streams explicitly use private no-store/no-transform, no-referrer and noindex headers.
- Admin inbox and notifier handle `ready` by refreshing current data after reconnection. Existing event names/payloads and visitor reconnect behavior remain. The in-process bus/replay is **not durable delivery**; no replay reliability certification follows.

## Verification

Evidence: `tmp/enterprise-audit/step-03/` — source hashes/originals, checks/build logs, runtime harnesses/results, synthetic query traces and scope/built-input checks.

- **1119 tests /62 files pass**: 180 added checks in three files (`admin-page-access`, `client-page-ownership`, `livechat-stream-access`). Anonymous/ungranted calls invoke the actual leaves without a layout; AST coverage checks guard ordering on all 38. Department sentinels, mapped grants, protected readers, related ownership clauses, real session resolver revocation, stream saturation, held validation, timeout, byte pressure, cancellation and lifecycle are covered with mocks.
- TypeScript passes; lint **0 errors /24 inherited warnings**.
- Isolated deterministic `npm ci --ignore-scripts`, explicit Prisma generation, **Webpack and default Turbopack production-content/noindex builds pass**. No `.env`, DATABASE_URL, SMTP, CAPTCHA or GA was copied/used. Mail stayed off. The inherited middleware deprecation remains; builds use nine prerender workers, not proof of real DB capacity.
- **171 compiled HTTP/Chromium checks pass**: 44 public/no-DB checks at 320/390/1440; **127 synthetic-authority checks** against the compiled app. They cover all 36 section-controlled leaves in direct HTML, RSC and cached-layout partial-navigation modes; workspace count isolation; department DTOs; live grant narrowing/session revocation; and real hydrated Next partial navigation for three limited-role fixtures. No unexpected public or authenticated-fixture browser errors.
- The synthetic runtime uses a **local-only preloaded Prisma double**, no database, real accounts or provider. Per-request observed query traces prove denial before private queries; checked payloads lack unauthorized department sentinels. This is compiled framework integration, not actual persistence, credential or infrastructure verification.
- Early harness failures were corrected transparently: Vite glob parentheses matched zero pages, test mock implementations persisted across cases, Next redirected RSC requests to their cache-busting key, and `Next-Router-Prefetch: 1` returned an optimized route skeleton without executing a dynamic leaf. Final partial-navigation tests do not confuse that skeleton with an authorization check. Early logs/results are retained; no app weakening was used. A shell count-fallback TypeScript inference error was fixed before final checks/builds.
- **743-file baseline: 52 existing files changed, 691 unchanged, zero deletions; five additions** (one shipping helper, three tests, this report). Changed originals match baseline hashes; compiled shipping inputs have zero drift. No dependency/lockfile, schema, public copy, CSS, asset, homepage horizon/portfolio or public URL change. Fresh install still reports eight high affected-package entries; no clean-audit claim.
- Isolated build: `/Users/om/savo-enterprise-build-step03`. Temporary 4318 no-DB and 4319 synthetic-authority servers are stopped after verification. Main development/other previews and production were not restarted.
- Finish review/documentation performed inline, **not independently**.

## Remaining P1 work and release gates

1. Complete **Server Action/API/resource/field-level DTO** review. Guards on these leaves/readers do not certify every endpoint. Recruitment-only detail navigation/action redirects and HR-compose grants need an explicit narrow workflow, not access to the entire lead inbox or employee directory. Existing enquiry auto-read still mutates/revalidates during rendering; move this to an authenticated mutation without unintended prefetch side effects. Existing one-time-password URL receipts and legacy mail-success/audit claims need separate correction.
2. Visitor blocking is identity/cookie scoped, not a person-wide ban. Other visitor HTTP resolution paths still need review of known-blocked-cookie fallback; this milestone does not certify them or prevent an anonymous user creating a new identity.
3. Durable lead/mail outbox, idempotency, suppression failure, replay/deduplication and honest acceptance/delivery status. Real transaction/race/provider tests need approved isolated PostgreSQL and a mail sink before any schema operation.
4. Verify trusted ingress, shared-store/edge limits, actual DB/presence-query budget, stream/proxy timeouts and multi-tab behavior. Process-local stream quotas, bus, limiter and worker guard are not cluster coordination. A response deadline does not replace DB statement/lock timeouts.
5. Reviewed release source/staging sign-off, backups/restore/rollback, mail opt-in, paired CAPTCHA and preflight promotion wiring remain mandatory. No deployment authority is implied by passing local checks.

Then continue safe JSON-LD/image handling, factual SEO/AI crawler policy and measurement/accessibility/CI work, preserving the approved public identity and factual/publication authority.
