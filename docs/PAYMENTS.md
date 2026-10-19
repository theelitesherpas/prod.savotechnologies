# Payment gateway credentials: Razorpay settings + step-up verification

## Scope

`/admin/settings/payments` (Settings → Payment gateway — Razorpay) stores the
Razorpay API Key ID, Key Secret and optional Webhook Secret used by client-invoice
payment links and webhook confirmation. It is **credential management only**;
link creation and webhooks are separate, audited steps.

## Access model

Three gates, all server-side, in order:

1. **Admin session** (`requireAdminPage`) — the page maps to the `settings`
   section like the rest of Settings.
2. **Admin role** — editors with a `settings` grant are redirected away.
   Payment credentials are admin-only.
3. **Email step-up verification (sudo mode)** — a fresh one-time code must be
   requested and confirmed before anything is queried or rendered.

The page renders no gateway status, forms or metadata before verification, and
every server action on this page (save / verify / clear credentials) re-checks
the grant itself — a hidden POST cannot bypass the UI gate.

## Step-up verification

- **Destination:** `STEP_UP_EMAIL` when set — a fixed security inbox
  (e.g. savotechnologies@hotmail.com), sent from the hello@ mailbox — otherwise
  the signed-in admin's own account email (masked as `r•••@example.com`).
  An invalid `STEP_UP_EMAIL` fails closed at send time with a clear message.
  Environment-only configuration: a stolen admin session cannot redirect
  codes from the panel.
- **Codes:** crypto-random 6 digits, 10-minute expiry, single use, max 5
  attempts, then the challenge burns. Only an HMAC-SHA256 digest keyed with
  `SECRETS_MASTER_KEY` is stored (`step_up_challenges`); a database leak alone
  reveals neither codes nor allows offline brute force. Wrong-code messages
  report remaining attempts; the code itself is never re-displayed.
- **Sends:** max 3 codes per admin per 10 minutes (process-local limiter);
  a new send invalidates the previous active challenge.
- **Grants:** on success an HttpOnly, SameSite=Lax, Secure-in-production
  cookie (`savo_stepup_payments-settings`) carries
  `<expiry>.<HMAC(userId:purpose:expiry)>`, valid 30 minutes, bound to the
  admin id and purpose, verified with constant-time comparison. "Lock now"
  clears it. The grant is not a session — the admin session must still be valid.
- **Email template:** `stepUpCode` in `src/lib/mail/templates.ts`, deliberately
  NOT in the admin-editable template registry (security mail keeps its tested
  default). Sent through the standard `sendMail` + delivery policy.

### Mail-off behaviour (fail closed)

`MAIL_DELIVERY_MODE` off (local dev, previews) → `sendMail` returns false:

- **Production/test deployments:** the challenge is discarded and the admin
  sees "the code could not be sent". No dangling codes.
- **`NODE_ENV=development` only:** the code is written to the server log
  (`stepup.dev_delivery_fallback`) so local review works without SMTP.
  Production never runs `NODE_ENV=development`, so codes are never logged there.

## Secret storage

- `payment_gateway_configs` (one row, `gateway = "razorpay"`): mode (derived
  from the Key ID prefix `rzp_test_`/`rzp_live_`), Key ID, Key Secret and
  Webhook Secret as **AES-256-GCM ciphertext** (`src/lib/secret-box.ts`), key
  material from `SECRETS_MASTER_KEY` (base64, 32 bytes) — never in the DB.
- Ciphertext format `v1.<iv>.<tag>.<ct>` is tamper-evident; a wrong master key
  or altered row fails closed (`getRazorpayConfig` throws rather than falling
  back to environment credentials).
- Secrets are never sent back to the browser: blank fields mean "keep the
  saved value"; changing the Key ID requires re-entering its secret.
- Resolution order (`src/lib/razorpay-config.ts`, 30 s in-process cache,
  invalidated on save): DB row → `RAZORPAY_KEY_ID`/`RAZORPAY_KEY_SECRET`/
  `RAZORPAY_WEBHOOK_SECRET` env fallback (local/scripted use) → unconfigured.
- Audit trail: `razorpay.config.save/verify/clear` and `stepup.send/verified/
  failed/lock` with masked metadata only (mode, key id prefix, updated/kept
  flags). No secret material in audits, redirects or logs.
- **Verify connection** calls `GET api.razorpay.com/v1/payment_links?count=1`
  with the stored credentials (10 s timeout) and records the outcome.

## Losing / rotating SECRETS_MASTER_KEY

Stored credentials become unreadable: the settings page reports the failure,
and runtime resolution fails closed. Re-enter credentials after setting the
new key. The key also signs step-up grants and OTP hashes — rotation
invalidates outstanding grants (harmless; re-verify). Generate:
`node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`.

## Schema / deployment

Additive tables (`prisma db push` locally; reviewed migration for production):
`payment_gateway_configs`, `step_up_challenges`. Both are additive — no
existing table changes. Set `SECRETS_MASTER_KEY` in the production
environment **before** promoting; back up the database first
(docs/WORKFLOW.md). Configure the webhook in the Razorpay dashboard only
after the webhook route ships: `https://savotechnologies.com/api/webhooks/razorpay`.

## Verification

```sh
npx vitest run tests/razorpay-credentials.test.ts tests/step-up.test.ts
# Browser review (local dev server on :4312, mail off, log captured):
npm run dev -- -p 4312 > tmp/razorpay-settings-server.log 2>&1 &
SERVER_LOG=tmp/razorpay-settings-server.log node --env-file=.env scripts/verify-razorpay-settings.mjs
```

`scripts/verify-razorpay-settings.mjs` drives real browser flows: challenge
UI (nothing sensitive rendered), code issue via dev fallback, wrong-code
attempts, success grant, encrypted persistence of synthetic test keys,
masked status, connection-test failure path, danger-zone clear, lock-now,
editor lockout — 28 assertions, synthetic fixtures cleaned up in `finally`,
refuses non-local databases. Evidence screenshots in `tmp/razorpay-settings/`.

## Invoice pipeline (v7.6+)

- **Payment links:** `src/lib/razorpay.ts` (server-only, no SDK) creates
  Payment Links for unpaid invoices with the exact minor-unit amount,
  `reference_id` = invoice number, provider notifications off. **Precedence:
  a manual payment link always wins — the gateway is consulted only when no
  link was provided** (invoice created payable, or first transitioning into
  payable; cleared links are never auto-recreated). Admin actions:
  create/replace (`razorpay.link.create`), stored in `paymentLink` +
  `razorpayLinkId`. Replacing, editing out of sent/overdue, deleting or
  manually overriding an invoice cancels the provider link (best-effort) and
  detaches the managed id. Creation failure never fails the save: the email
  is sent without Pay now and the operator is told why.
- **Webhook:** `POST /api/webhooks/razorpay` — signature-verified
  (constant-time HMAC-SHA256 vs the panel-stored secret), replay-safe
  (`webhook_events` unique event id, effects + dedupe row commit together),
  amount/currency must match exactly or the delivery is recorded `rejected`.
  Payment recording goes through `recordInvoicePaid` (lib/invoice-payments.ts)
  — one transactional routine shared by manual marking, admin sync and the
  webhook: status + `paidAt` + `razorpayPaymentId`, receipt email, project and
  milestone reconciliation.
- **Reconciliation:** Sync status with Razorpay (per invoice) reads the
  provider's own record; `razorpay.sync.paid` audit entry. Webhook audits:
  `razorpay.webhook.paid` / `.mismatch`.
- **Dashboard setup:** Razorpay → Settings → Webhooks → add
  `https://savotechnologies.com/api/webhooks/razorpay`, set a secret, save
  the same secret in the panel, subscribe to `payment_link.paid` and
  `payment_link.cancelled`.
- **Local verification:** `scripts/verify-razorpay-payments.mjs` drives the
  full path against a stub gateway (link creation through the UI, portal Pay
  now, signed webhook, replay, bad signature, mismatch, sync, cancellation) —
  23 browser checks. Unit coverage in `tests/razorpay-payments.test.ts`.
