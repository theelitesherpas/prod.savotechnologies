# Step 04 — bearer-link, credential-receipt, suppression and untrusted-image hardening

**Locally verified milestone only; not a production/ASVS clearance.** The audit remains open and provisional readiness remains **4/10**. This is an incremental continuation of [Step 03](./STEP-03.md); no push/deployment, production database access, schema mutation, real submission or provider delivery occurred. See [initial assessment](./ASSESSMENT.md) and [runtime/release prerequisites](./RUNTIME-OPERATIONS.md).

## High-risk findings and local controls

### Client password URL disclosure

Client create/reset had placed plaintext passwords in `?pw=` after the database mutation. That exposed credentials to browser history and request/referrer/log surfaces. The query value has been removed. A short-lived (120-second), HttpOnly, production-Secure, SameSite=Strict receipt cookie is AES-256-GCM encrypted with a key derived from the current admin session token and is bound to the same admin ID/session. A reauthenticated, clients-authorized Server Action consumes it once; neither the redirect nor the initial page carries the password. Password reset and client-session revocation now commit together in one Prisma transaction; a failed transaction cannot report success or send the reset notice.

**Residual:** the existing welcome/reset workflow still emails the generated or supplied password, and the email archive stores sent content. Client passwords are not forced to change or automatically expired. The UI calls this a client password, not a one-time password. A true one-time onboarding/reset flow, notification copy change, mail-history retention/secret redaction and any schema migration require a separately reviewed design. Existing account credentials were not rotated.

### Meeting reference was an authorization credential

The public meeting reader accepted `STPL-YYYY-XXXXX`/`MTG-...` references as bearer access. Those human references have only about 20 bits of entropy, while the reader returned contact details and meeting information. This bypassed the intended high-entropy token-hash design.

- Public reads/submissions now require a base64url bearer token (minimum 32 characters); new tokens contain 256 random bits. Human references are display identifiers only and are never queried as public credentials.
- Create/send/copy-link paths now use bearer tokens. Existing random 192-bit tokens remain accepted. Missing/mismatched stored tokens are regenerated before a new invitation is sent.
- Submission date, offered-date policy, valid current/future IST time and offered time-window checks now execute server-side. A transactional compare-and-set prevents concurrent availability submissions from overwriting one another. The endpoint has per-IP and per-token process-local limits; attendee JSON is bounded/type-checked.
- **Breaking release effect:** old public URLs containing meeting references will return not-found. Before promotion, inventory active meetings in an approved isolated environment, rotate/reissue every active link and send the replacement through an approved channel. Do not preserve old reference access as a compatibility fallback; that would retain the data-exposure flaw. This audit did not inspect or alter any production meeting.
- The database still holds `tokenPlain` so authorized admins can copy/resend links. Raw path tokens can appear in browser history and ingress access logs. The meeting page uses no-referrer, but that does not redact proxy/application logs. Before promotion, review and redact `/meeting/{token}` logs, restrict database/export access and establish a rotation/reissue process. No path-token log policy was verified.

### Mail suppression and unsubscribe persistence

- A customer template with an unsubscribe preference is now checked centrally in `sendMail`, including admin-initiated template sends. Missing suppression storage or a failed preference lookup fails closed; no SMTP transport/send is attempted. Internal and explicit portal-service mail remains outside this customer-template gate, matching the existing service-email distinction.
- One-click unsubscribe returns **503** if suppression cannot be persisted. The confirmation action no longer redirects to success after a failed/missing database write; its error state offers a retry. A success URL is shown as successful only when its signed email matches a persisted suppression row. The email is rendered only after that verification.
- The change prevents false success and fail-open sends; it does not establish a legal consent basis, delivery, suppression-list retention policy or coverage of every hand-built/service mail path. No real email was sent.

### Case-study image origin safety

`/api/cs-img` already resolves only active, Published managed records. It now serves only canonical base64-encoded JPEG/PNG/WebP/GIF/AVIF values with matching file signatures and rejects SVG/active content or malformed data. Public image responses retain `nosniff` and immutable versioned caching. This does not validate every legacy database row or certify full decode safety; before promotion, check approved published image records in the isolated release dataset and replace any SVG data URL with a raster export. No content row was read or changed in a live database.

### Visitor block fallback

A known blocked chat cookie previously collapsed to the same `null` as an unknown cookie, then silently minted a new visitor identity. Resolution now distinguishes unknown and blocked records; known blocked visitors fail closed. This is **not** a person-wide ban: a visitor who clears/changes the cookie can still create a new anonymous identity. Distributed identity-level abuse prevention remains unimplemented.

## Verification

- Full local suite: **1,228 tests / 81 files passed** (`npm run test:run`). Targeted tests cover encrypted/one-use/session-bound client password receipts, action redirects and transactional reset; meeting-token rejection, token-bearing links, server slot rules and compare-and-set; per-IP submission limits; blocked visitor resolution; fail-closed suppression and verifiable unsubscribe; and active-SVG/canonical image-signature rejection.
- TypeScript and the final isolated production-content/noindex build pass. The build used `DATABASE_URL=''`, a nonindexable origin and mail off; it emitted the existing Next.js middleware-to-proxy deprecation warning. No database was configured or contacted.
- Scoped ESLint has zero errors and one inherited warning: the meetings UI receives an unused `onEdit` callback, so the existing edit affordance appears incomplete. Meeting expiration extension now records the acting admin and new expiry in the activity log.
- `npm audit --omit=dev` currently reports three high-severity affected package entries in the Prisma/deepmerge chain. npm's suggested automatic fix downgrades Prisma to 6.12.0; it was not applied. A compatible patched upgrade requires a separate Prisma-version/config review and regression build.
- No runtime test used a real database, admin account, SMTP provider, CAPTCHA, reverse proxy or deployed app. The meeting/IP rate limits and chat stream/bus remain process-local.

## Remaining P1/release gates

1. **Meeting-link rollout is a hard gate:** rotate active legacy reference links and communicate replacements with owner approval; verify ingress log redaction and token path handling first. New local behavior is not deployed.
2. Replace emailed/archive-stored passwords with a genuinely expiring one-time enrollment/reset mechanism and forced change; review deletion/retention of historic plaintext email records without touching production records in this audit.
3. Continue Server Action/API and field-level DTO review. Recruitment-only detail navigation/action redirects, HR-composer grants, GET side effects, enquiry auto-read during rendering, idempotency, the durable mail outbox, suppression scope and process-local ingress controls remain open.
4. Review live-chat identity creation/abuse controls and prove trusted proxy/edge limits and shared-store behavior. A blocked cookie is not a person-level ban.
5. Review published image inventory and deploy/proxy access logs in staging; verify database connection budgets, outbox/restore/rollback and privacy/legal policy with the owner.
6. Continue factual SEO/AI permission, sitemap/robots, measured performance, accessibility, CI/secret scanning and maintainability review. No security, accessibility, SEO, field-performance or production-readiness certification is claimed.
