# Registered-account portal sign-in

Applies to `/portal` and `/employee-portal`. Password and emailed OTP are alternative sign-in methods, not two-factor authentication. There is no self-registration, Google/Apple sign-in, password-reset endpoint or automatic account creation.

## Compact entrance

The owner requested no unnecessary page scroll and rejected the tilted preview.
The current 1180px split frame has an upright workspace preview; at widths up
to 900px, the illustration is omitted and only the sign-in task remains. The
46px password/OTP actions share one row. Header, form spacing and support
copy are compact without clipping fields, CAPTCHA or focus outlines.

Viewport-fit checks cover both entrances at 1280×720, 1366×768, 1440×900,
768×1000, 375×812, 390×844 and 320×900; OTP screens also fit desktop/phone
viewports. Natural document overflow is retained for smaller screens, browser
zoom, long recovery messages and on-screen keyboards rather than locking
users out with `overflow:hidden`.

## User flow

- Choose client or employee portal; enter the registered email and password, or choose **Sign in with email OTP**. **Forgot password?** switches to OTP without sending mail automatically.
- Solve the existing mandatory CAPTCHA before password verification, initial OTP delivery or account-existence feedback. Unknown addresses receive: “This email is not registered for this portal. Please contact Savo support for access.”
- Successful delivery opens a labelled six-digit input with paste/password-manager support, ten-minute expiry, resend countdown, spam-folder guidance and a back-to-sign-in action.
- Client support is `hello@savotechnologies.com`; employee support is `hr@savotechnologies.com`.
- Unchecked **Remember me** issues a browser-session cookie with a 12-hour database expiry. Explicit opt-in uses a fixed 30-day cookie/database lifetime, for either method and either portal. No sliding extension and no password/email/OTP in local storage.
- An active client account is required. Employee access preserves HR's existing allowed lifecycle states (`joining`, `probation`, `active`, `notice`) and linked panel-account provisioning. Exited, unknown-state and unlinked employees cannot use OTP as a bypass. A linked password may be used; OTP does not issue an admin cookie or change admin permissions.

## Security implementation

`src/lib/portal-login.ts` owns all login paths, including compatibility password actions. Previous action state and hidden inputs confer no authority.

- Six-digit codes use Node crypto randomness. Only a domain-separated HMAC-SHA256 digest is stored, keyed by `SECRETS_MASTER_KEY` and scoped to portal + random challenge ID. A leaked database cannot cheaply enumerate six-digit codes without the separate key.
- Each challenge binds the account, normalized email hash, portal and a cryptographically random HttpOnly/SameSite=Strict browser cookie. A code/challenge ID without the originating browser binding is insufficient.
- Maximum five guesses, ten-minute expiry, single use. PostgreSQL compare-and-swap on attempt count + unconsumed state + expiry prevents parallel guesses/replays from creating a second session. Challenge consumption and session insertion share one transaction.
- Current account eligibility and email are re-read at redemption. Password sign-in performs dummy bcrypt work for unknown emails and re-checks the account/password hash before issuing a session.
- PostgreSQL atomic fixed-window throttles are shared across workers. All portal types share IP limits (20 initial/resend requests and 30 code-verification requests per 15 minutes). Password/initial-code requests additionally have eight attempts per portal/email per 15 minutes.
- OTP delivery has a shared ten-per-IP / three-per-email limit per 15 minutes, plus a one-per-email-per-minute cooldown across both portal types. Browser-bound resend skips a fresh CAPTCHA but never these limits. Requests refused by the minute cooldown do not consume the three-delivery allowance.
- New challenges start only after eligibility checks; failed SMTP acceptance removes the undelivered challenge. Resend replaces the prior browser-bound code only after successful delivery. Expired/missing challenges return to initial sign-in with CAPTCHA.
- Session tokens are crypto-random and stored only as SHA-256 hashes. Session cookies are HttpOnly/SameSite=Lax, Secure in production, with no browser persistence unless explicitly requested. Existing workspace ownership/status/expiry checks remain independent.
- Security mail is code-controlled and bypasses Savo's sent-email database archive (`sensitive: true`). Codes are absent from subjects, logs and action return values. SMTP acceptance must succeed before the UI claims delivery. Both SMTP transports use bounded timeouts and require TLS except for explicit loopback hosts used in local testing.
- Missing keys, schema, CAPTCHA, SMTP acceptance or database availability fail closed with recoverable messages. No production-only test/bypass endpoint was added.

**Account enumeration trade-off:** explicit unregistered-email feedback is owner-requested. It intentionally discloses account existence after CAPTCHA and persistent limits. Those controls mitigate, but do not eliminate, enumeration. Reverse-proxy/edge abuse limits and trusted forwarded-IP configuration remain necessary. A privacy-first alternative would use identical generic responses for registered/unregistered addresses; this implementation does not claim that property.

## Deployment prerequisites

1. Back up the deployment database. Apply the additive `prisma/portal-login.sql` before starting the new application. It creates only login-challenge and throttle tables/indexes; it does not create/edit accounts or invoices. `prisma generate` must run for the changed schema.
2. Configure the existing `SECRETS_MASTER_KEY` (base64, exactly 32 bytes), shared across application instances, outside the database. Do not rotate an existing installation's master key casually: other payment/security features also use it. Rotation invalidates outstanding login codes.
3. Configure real reCAPTCHA v2 checkbox site/secret keys and allowed production hostnames, then rebuild. Google's public test pair is local verification only and must not be published as real protection.
4. Verify transactional SMTP (`MAIL_HOST`, port/TLS, sender credentials and optional HR mailbox). Live delivery requires `MAIL_DELIVERY_MODE=live`, `NODE_ENV=production` and production content. Do not enable live delivery on ordinary previews. If delivery is disabled, password access still works and OTP explicitly reports that sending failed.
5. Schedule a daily job: `node --env-file=.env.production scripts/cleanup-portal-auth.mjs --apply`. It deletes only login challenges/throttle windows expired for over one day; without `--apply` it reports counts only. Restrict database and SMTP access, use HTTPS, configure edge limits and monitor `portal_auth.*` failure events.
6. Verify delivery to an authorized real test recipient after deployment. Local loopback SMTP tests do not establish production inbox delivery, SPF/DKIM/DMARC reputation or physical-device behavior.

Implementation tests apply migrations only to localhost. The release updater applies `prisma/portal-login.sql` before Prisma synchronization and the new server starts. Production release follows `docs/WORKFLOW.md`, with a private database/build backup, dev/test CI and live unauthenticated smoke checks. Synthetic test scripts must never run against production or send live-recipient email.

## Verification

```sh
npm run typecheck
npm run lint
npm run test:run
MAIL_DELIVERY_MODE=off npm run build
node --env-file=.env --env-file=.env.local scripts/verify-portal-login.mjs
# Functional continuation without overwriting already inspected screenshots:
REUSE_PORTAL_LOGIN_CAPTURES=1 node --env-file=.env --env-file=.env.local scripts/verify-portal-login.mjs
```

The browser script refuses non-loopback databases and non-official CAPTCHA test keys. It starts a separate local production server with SMTP forcibly redirected to an in-memory loopback sink that accepts `.invalid` recipients only; synthetic clients/employees/panel users/challenges are deleted in `finally`. It never writes OTP values or bindings into evidence files. Do not aim this script at production.

Current evidence: `.impeccable/review/portal-login-compact/`: 154 browser/database assertions across seven entrance viewports and desktop/phone OTP states. This includes no vertical/horizontal scroll, upright preview, forced-resend cooldown rejection, two racing real server-action submissions, exactly one resulting session, real loopback SMTP delivery, no plaintext archive, and password/OTP cookie lifetimes. Accessibility scans found no violations in the tested A/AA rule set; third-party frame internals and full-site conformance are not certified. Zero browser runtime errors. A route-interception ordering error in the first concurrency harness attempt was fixed in the script, and its interrupted synthetic records were explicitly removed.

Full suite: 2,046 passed / 16 skipped, lint/typecheck/build passed. Detector: 71 design-documentation advisories / zero non-advisory findings. Visual finish review is inline, not independent. No generated raster imagery ships on these entrances.
