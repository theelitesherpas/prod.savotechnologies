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

## Current invoice pipeline (Standard Checkout)

- **Manual link wins:** a validated manually supplied payment link stays an
  external payment action. The gateway is not started for that invoice;
  unsafe stored URLs fail closed. Otherwise Pay now in portal/email/PDF
  opens the owner-scoped `/portal/invoices/[id]/pay` page.
- **Online payment:** an owner-authenticated, rate-limited server action
  creates a Razorpay order on demand using stored invoice amounts. The client
  receives only the public key ID. Signature verification, the stored order
  binding and a captured provider payment must agree before recording paid.
- **Fees (unchanged by the redesign):** `lib/payment-fees.ts` computes 2%
  processing fee for INR plus 18% GST on that fee; other currencies have a
  3% processing fee and no GST row. The same total is used for orders,
  checkout verification, webhook matching and sync. Labels omit percentages;
  accessible info popups describe only the current currency's rule.
- **Webhook:** `POST /api/webhooks/razorpay` accepts `payment.captured` and
  legacy `payment_link.paid`; signature verification, event-ID deduplication
  and transactional invoice/project reconciliation remain in place. Keep
  these events on the existing dashboard webhook. This redesign needs no
  keys, webhook URL, secret, schema or event changes.
- **Reconciliation:** admin Sync status with Razorpay reads provider order
  payments (or legacy links), then uses shared `recordInvoicePaid`.

## Checkout redesign (v7.9.0)

- Two-panel reference-pinned checkout: methods left, fee/amount review and
  action right. Online is selected by default; script loading begins on
  arrival and supports bounded failure/retry. Phones reflow without horizontal
  scrolling. The existing workspace shell is not redesigned.
- **Bank deposit:** choose Bank Deposit → review invoice amount (no online
  fee) → Get bank deposit instructions → dedicated beneficiary/reference
  document. Bank details remain managed under Settings → Payment gateway;
  incomplete details produce a contact-us path, not invented beneficiary data.
  International instructions require a configured SWIFT code. No currency
  conversion or bank support is fabricated.
- Copyable values, invoice number as the stable unique transfer reference,
  print/save-as-PDF and email of the transfer reference to the real team.
  The last action opens an email draft; it does not claim evidence was
  submitted or mark paid. Invoice status stays unchanged until staff verify
  funds using the existing admin workflow.
- **Confirmation:** every stored paid invoice gets a dedicated receipt page,
  even without a return query. Captured provider amount/method are displayed
  only when bound to the stored payment/order/currency; historical fees are
  never recomputed. If provider retrieval is unavailable, the page shows the
  invoice amount credited without inventing the total charged. Paid/cancelled
  invoices cannot expose old Pay now links. Draft/foreign IDs stay private.
- **Pending/error:** a return flag alone cannot show success; checking states
  suppress a second-pay button and refresh for a bounded minute. Failure text
  is escaped without double decoding. Lost verification responses are treated
  as pending, not proof that nothing was charged.
- **Trust:** HTTPS lock, provider-attributed PCI DSS information and network
  identification marks. No Savo certification, expired certificate seal or
  blanket card-authentication guarantee. Provenance: `docs/PAYMENT-ASSETS.md`.

Verification: `tests/checkout-page.test.tsx` adds 9 page/receipt/access tests.
`scripts/verify-razorpay-payments.mjs` runs 61 local synthetic browser checks,
including online payment/verified receipt, currency fees, both bank states,
confirm-to-instructions without payment, one-page instruction PDF, 320/390px
layouts, loader retry, pending, signature/replay and sync. It restores existing
local bank settings and cleans only its own webhook events. Evidence is in
`tmp/razorpay-payments/`; no live charges or real test emails are part of QA.

## Client transaction history (v7.10.0)

`/portal/transactions`, immediately after Invoices in workspace navigation, lists
**confirmed invoice payments**, not checkout launches, failed attempts, pending
bank transfers or an arbitrary bank-account statement. Search invoice number,
provider reference or project; filter by source/currency; paginate 25 records at
a time. Dates are UTC, amounts keep their original currency and fixed two-decimal
precision. No mixed-currency aggregate is fabricated. Desktop uses a native
aligned table; smaller screens reflow each record with labeled amounts and a
44px-minimum PDF action. Empty/search-empty and loading/error recovery inherit
the workspace conventions.

### Recording and privacy

- Additive `payment_transactions` table snapshots client, invoice number,
  project title, invoice credit, currency and known confirmation date. Stores an
  actual total/method only from verified gateway evidence. Unknown historical
  totals and dates are explicitly **Not recorded**, never today's fee estimate.
- `recordPaymentTransaction` runs inside the same serializable transaction as
  `recordInvoicePaid`; checkout, webhook, admin sync and manual mark-paid share
  it. Admin create/edit transitions directly to paid are also covered. No
  transaction record is written merely by viewing bank instructions.
- Unique provider/payment keys deduplicate callbacks/replays. A later gateway
  confirmation enriches the corresponding unbound manual/historical invoice
  record rather than duplicating it. Distinct genuine provider payment IDs are
  preserved, including another captured payment on an already-paid invoice;
  this does not generate another receipt, and the new capture shows zero
  additional invoice credit rather than pretending the invoice was credited twice.
- Money, owner and original invoice snapshots are not changed by ordinary
  invoice edits. Missing provider facts may be filled, not overwritten. Invoice
  deletion leaves history with an unavailable PDF; deleting a client follows
  the existing client-data cascade policy.
- Authentication and clientId scope are server-derived for rows, counts,
  currencies and search. PDF links are offered only if the currently linked
  invoice still belongs to that client and is published; the PDF endpoint
  independently checks owner/status. A reassigned invoice cannot leak through
  an old ledger link. No provider API call or gateway secret is needed to list
  history, and the list has no mutation action.

### Safe historical import / deployment

After `prisma db push`, run
`node scripts/backfill-payment-transactions.mjs --apply`. The updater runs this
before building/restarting. This batched, repeatable import inserts snapshots
for existing paid invoices without history. It never changes an invoice, sends
mail, contacts Razorpay, guesses a date/method/charge, or resets existing history.
Without `--apply`, it reports only a count. Review additive SQL and retain a DB
and prior-build backup before production deployment; no reset/data-loss flags.
When deploying this updater change, check out the promoted release **before**
invoking the new updater, so the new import step is actually executed.

Verification: `tests/payment-transactions.test.ts`,
`tests/portal-transactions.test.tsx`, and extended invoice/payment regression
tests. `scripts/verify-portal-transactions.mjs` refuses non-local app/DB URLs and
checks import idempotency, owner scope, real PDF content and denial, filters,
pagination, 320/390/760/900/1024px layouts, and retained snapshots after invoice
reassignment/deletion. Its synthetic clients are cleaned up in `finally`.
Evidence: `.impeccable/review/transactions/` (gitignored). No physical-device or
live-card test is implied by these browser checks.
