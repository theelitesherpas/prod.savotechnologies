# Runtime and release prerequisites

These are configuration checks and an operations plan, **not verified infrastructure**. Nothing here authorizes deployment, migration, credential rotation or live load testing. Follow [WORKFLOW.md](../WORKFLOW.md) and obtain the reviewed release/staging approval first.

## Environment authority

`NODE_ENV=production` means an optimized Next runtime, not an approved live deployment. Staging can use production content and still be staging. Canonical URLs remain the approved production origin; indexing and notification delivery are independent decisions.

- `src/lib/env.ts` exports public values only.
- `src/lib/server-env.ts` and Prisma are guarded by `server-only`; malformed configuration errors name fields, not values. Blank optional DATABASE_URL means no database.
- Next freezes `NEXT_PUBLIC_*` values at build time. CAPTCHA site key, content/index gate and public URLs must be correct **during the matching build**, not merely changed in PM2 afterward.
- Optional no-DB previews still render truthful empty states; submissions/authentication cannot claim storage success without persistence. This does not qualify as a healthy live deployment.
- The operator must identify the actual environment and load its reviewed variables. This audit did not inspect/copy deployment secrets or modify `.env` files.

## Redacted preflight

```bash
# Run against ALREADY LOADED variables for that environment.
# The script does NOT load .env, connect to services or print values.
node scripts/verify-runtime-env.mjs preview
node scripts/verify-runtime-env.mjs live
```

Preview preflight rejects live mail and indexing. Live preflight requires production runtime/content, PostgreSQL URL with positive explicit `connection_limit` and `pool_timeout`, a private salt of at least 32 characters and explicit mail mode (`off` or `live`). Both profiles reject partial CAPTCHA/SMTP auth and invalid SMTP port/mode values.

Passing proves only these syntactic checks. It does **not** prove environment isolation, secret entropy, valid credentials, the build's public values, pool capacity, health, ingress trust, consent, delivery or release authority. CI/promotion wiring is still pending; the existing updater does not automatically invoke this script.

## Mail delivery — required promotion setup

The application SMTP boundary defaults to **off**, even when MAIL_HOST is present. A reviewed live deployment must intentionally set:

```text
MAIL_DELIVERY_MODE=live
NODE_ENV=production
NEXT_PUBLIC_CONTENT_MODE=production
```

Preview/staging must keep `MAIL_DELIVERY_MODE=off`; never copy a live mail mode with production credentials. The helper cannot independently prove a server is production if the operator deliberately mislabels it with all live settings. Provider dashboards and standalone diagnostic/poller scripts are outside this application boundary and must not be run against real recipients during review.

`sendMail()` returns false when disabled/unconfigured/failed. A true SMTP result is not proof of inbox delivery. Some legacy admin fire-and-forget notices still imply confirmed email; reconcile those with real send/outbox status in the lead/reliability phase. Check actual SPF/DKIM/DMARC, TLS, timeout policy, HR fallback, suppression failure behavior and approved staging sink before release. No real mail was sent for this milestone.

## CAPTCHA

Both keys unset retains the optional gate plus honeypot/local limits. Both configured enables progressive verification. A single key is a configuration error and safely rejects submissions/logins with a verification-unavailable message. Provider verification has a five-second timeout, requires boolean success on a successful HTTP response and does not send optional raw `remoteip`.

Do not promote partially configured keys. Verify actual registered domains, paired build/runtime keys, expiry/replay/provider failure and browser behavior on staging. Google browser widget privacy/consent is still a separate review; removing the optional server remoteip does not make the integration first-party-only.

## Database connection budget

The singleton prevents duplicate clients in **one process/module realm**, including production. It is not a shared pool across PM2 replicas, Next prerender workers or distinct applications.

Inventory and approve:

```text
sum(application-process connection limits)
+ concurrent build/prerender connection limits
+ background tooling/migration/monitoring connections
+ operational reserve
<= approved database connection allowance
```

The isolated build reported nine prerender workers. Actual database capacity/reserved slots, application replica count and simultaneous builds are unknown. Do not select a production pool limit from the local CPU count or copy an arbitrary sample. Use separate staging/build persistence, or an approved pooler with Prisma-version-compatible transaction/prepared-statement settings. `pool_timeout` limits pool acquisition, not arbitrary query execution; establish DB-side statement/lock timeouts separately.

No pool URL, database role, schema, index, backup or server setting was changed. A safe migration/restore rehearsal requires an isolated database, backup proof and an approved expand-only plan before any command is executed.

## Bearer links, credentials and release compatibility

- New public meeting URLs contain 256-bit bearer tokens; the reader and submission endpoint reject the old human-readable `STPL-…`/`MTG-…` reference as authorization. This is an intentional security break: before promotion, inventory active meetings in an isolated, approved release dataset, rotate/reissue links and coordinate client notification. Do not restore reference fallback. No production rows were inspected or changed during this audit.
- The admin detail API still returns the raw current meeting token (`tokenPlain`) to an authenticated, clients-authorized admin so the UI can copy/resend it. Restrict database snapshots/exports and admin API access. Treat `/meeting/{token}` as a password-equivalent secret; browser history and reverse-proxy/application access logs may contain it. Prove path redaction/retention before release. `Referrer-Policy: no-referrer` protects downstream referrers, not server logs.
- Client create/reset redirects no longer carry passwords. The browser receives an encrypted, HttpOnly, session-bound, 120-second one-use receipt. This does **not** force a client to change the credential, expire it after first login, or remove the password from welcome/reset mail and Sent-folder content. Do not describe it as an expiring/one-time password; design and approve a true enrollment/reset lifecycle and historic-mail retention policy first.
- Case-study public image delivery now refuses SVG and checks raster file signatures. Audit the approved release's published managed images for SVG data URLs and rasterize them before promotion; do not delete or bulk-rewrite content without an approved backup/owner review.
- Customer templates with a signed unsubscribe preference fail closed if suppression storage/checks are unavailable. One-click unsubscribe only reports success after its write is confirmed. This does not certify the legal consent/retention policy or all service-email categories.

## Process-local limitations

- Rate limiter: 5000 keys, at most 1000 accepted hits/key, bounded key/policy sizes, each window's own expiry. New keys fail closed when active capacity is exhausted; active login buckets are not evicted to make room. Under deliberate key churn this can deny legitimate requests: an availability tradeoff, not distributed protection.
- Four simultaneous cooperative bcryptjs jobs; excess verification fails safely, new hashing reports busy. This yields between chunks but is not native worker-thread offload. Repository-generated hashes remain cost 12; supported stored costs are 4–16. Review actual stored cost distribution before promotion; higher-cost legacy hashes need an approved compatibility/reset plan. Existing >72-byte passwords still verify with legacy bcrypt truncation; only **new** hashes forbid truncation. No stored password was reset.
- Remembered admin sessions have a fixed 30-day absolute ceiling matching the existing cookie; normal 24h/admin, 12h/client and 7-day employee lifetimes remain. No new MFA or idle-expiry policy is claimed.
- Exited/unknown employee lifecycle status and missing portal link deny future requests. Accounts without a linked employee retain normal admin behavior. Multiple panel accounts for one employee remain ambiguous because employee sessions do not record the originating credential; a credential-version/schema design requires a later approved migration.
- [Step 03](./STEP-03.md) streams re-read the original admin session's current role/lifecycle/grants before bounded event batches and every 15-second heartbeat. Visitor streams recheck existing-cookie ownership, blocking and conversation existence; they never create visitors. Lookup/heartbeat response deadlines are five seconds, not DB query cancellation or a hard real-time/zero-latency revocation guarantee. Already authorized/sent frames cannot be recalled.
- SSE defaults: 128 active streams/process, six/operator (the shell notifier and inbox each use one), four/visitor identity, 15-minute absolute lifetime. Pending events: 64 frames /128KiB; individual frames: 16KiB; the readable byte buffer is also bounded to 128KiB. Overflow/slow consumers/failed authority close and release the lease. These are defensive defaults, **not verified deployment capacity**. Review multi-tab behavior, proxy timeouts and DB/presence-write volume before promotion. Quotas are not shared across processes; reconnecting admin views refetch current DB state, not promised replay/delivery.
- Chat sweep waits for the prior sweep/presence pass to settle; no overlap in the same process. A stuck query can still stall the worker. Multiple processes still need leader/lease coordination and distributed pub/sub.
- SalesBot demo: 500 server sessions, 40 retained transcript messages, 30-minute absolute/idle logical lifetime. Old state is reclaimed on requests; this is not a timed physical-erasure guarantee or a durable chat service. Browser conversation display/structured qualification is unchanged.

Trusted ingress is still unverified. Before exposing the app, prove origin firewalling and proxy replacement of client-supplied forwarding headers. Add distributed edge/shared-store limits and stream/connection budgets against the actual topology; do not run destructive production flood tests.

## Telemetry and privacy

The collector omits private pages/previews, sanitizes top-level URL/referrer context and no longer invokes the HTTP raw-IP geography provider. New geography fields remain empty; existing database records were not altered. Private-page bug reports are dropped, not stored with invitation/account details. Public diagnostics still accept free-form text, which can contain personal data; event names, GA/client transmission, headers/proxy logging, consent, retention/deletion and processor/legal notice accuracy remain unresolved.

Daily visitor hashes are pseudonymous, not guaranteed anonymous/unlinkable. No GDPR/Swiss/India or other legal compliance claim follows from these code changes.
