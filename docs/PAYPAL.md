# PayPal invoice checkout

**The owner authorized production release on 2026-11-01.** Publishing the
integration is separate from accepting PayPal payments: production must have
matching Live app credentials, Merchant ID and Webhook ID saved and verified
through the admin email-step-up flow. The initial production rollout keeps
PayPal Off until that protected setup is completed. Existing Razorpay/bank behavior is
unchanged. The local checkout presents **Razorpay first (default), PayPal second,
bank deposit third** when those methods are enabled/ready. Disabled gateways
are hidden; the first remaining method becomes the default. A manually supplied invoice payment link still takes
precedence over all built-in methods.

## Enable/disable and unchanged pricing

The latest owner instruction authorizes production release, but does not waive
credential, webhook, host, account/currency or fresh email-step-up requirements.
Both providers now have independent On/Off switches behind the same admin-role
and email-step-up boundary. See [PAYMENTS.md](PAYMENTS.md#availability-switches)
for live database visibility, race protection, manual-link exceptions and the
distinction between blocking new charges and confirming money already received.
Adding `prisma/payment-availability.sql` is additive; it never changes an invoice
amount or secret. No platform/handling/service fee was added. Existing Razorpay
2% + GST-on-fee for INR and 3% without GST line for non-INR are unchanged;
PayPal retains **Paid by Savo** and the original invoice total.

## India account, currencies and fees

The owner confirmed an Indian PayPal Business account, receiving permitted
original currencies and withdrawing to an INR bank account through PayPal.

- Invoice currency and accounting amount are never converted by this app.
  The order and verified capture must match them exactly.
- PayPal is an international-payment option for this account. INR/AED are not
  PayPal checkout currencies; Indian PayPal buyers should use Razorpay/bank.
- The currency picker includes PayPal's supported order currency codes. PayPal
  remains authoritative for account/country-specific eligibility (notably
  region-restricted currencies); a rejection never triggers silent conversion.
- Existing Razorpay currency scope remains INR/USD/CHF/EUR/GBP/AED. Newly
  added invoice currencies are PayPal/bank options unless separately verified
  for Razorpay; no unverified Razorpay fee quote is shown for those currencies.
- JPY, HUF and TWD require whole PayPal units. Existing accounting storage stays
  at 100 units per major unit across the app; PayPal formatting translates that
  representation exactly and rejects fractional zero-decimal orders.
- **No PayPal-specific buyer surcharge or guessed percentage is added.** The
  client pays the original invoice amount. Checkout says that Savo bears the
  merchant fee, and warns that PayPal may quote buyer currency-conversion costs.
- Actual `paypal_fee` and `net_amount` are retained only from the authenticated,
  verified capture response. Admin settings show original amounts/currencies;
  absent values remain unknown. Net can include other provider deductions.
  Invalid/overflowing optional fee metadata is flagged for statement review;
  it never erases a correctly verified capture or asks the buyer to pay twice.
  We do not invent GST, a fixed fee, an FX spread, or an INR withdrawal amount.
- PayPal handles permitted conversion/INR withdrawal. This integration neither
  initiates a payout nor verifies the later arrival in the merchant's bank.

Reference pages for the merchant's review before any live release:
- https://www.paypal.com/in/webapps/mpp/merchant-fees
- https://www.paypal.com/in/legalhub/paypal/useragreement-full
- https://developer.paypal.com/docs/reports/reference/paypal-supported-currencies/
- https://developer.paypal.com/docs/api/orders/v2/
- https://developer.paypal.com/docs/api/webhooks/v1/#verify-webhook-signature

**Official policy checked 2026-10-30:** network access recovered and the India
merchant-fee page and user agreement above were fetched successfully. The
published standard international commercial rate is **4.40% + a fixed fee**
based on received currency (e.g. USD 0.30, EUR 0.35, GBP 0.20). The India fee
page explicitly limits India users to international payments. These are
published reference terms, not confirmation of this account's negotiated rate,
tax treatment, FX cost or settlement outcome.

The user agreement's **No surcharges** provision prohibits a fee specifically
for accepting PayPal. Its handling-fee exception cannot function as a disguised
PayPal surcharge or exceed handling fees for non-PayPal transactions. Therefore
this feature does not add 4.4%, a fixed fee, GST or guessed FX to PayPal checkout.
Cost recovery requires a separately approved, transparent invoice-pricing or
uniform-handling policy, with appropriate accounting/tax review. No service
prices, invoice amounts or fee snapshots were changed by this UI request.

Actual merchant-owned approval/capture and webhook delivery remain untested;
Live OAuth alone does not certify end-to-end payment readiness.

## Checkout branding and reassurance

The PayPal method uses the unmodified official SVG downloaded on 2026-10-30
from `https://www.paypalobjects.com/paypal-ui/logos/svg/paypal-color.svg`, served
locally as `public/images/payments/paypal.svg`. It shares the Razorpay logo's
placement/size treatment. The customer label is **International Payments**.

The selected PayPal method shows HTTPS/connection information, an attributed
[PayPal security link](https://www.paypal.com/in/digital-wallet/security-and-protection?locale.x=en_GB),
and Visa/Mastercard marks with an explicit country/account/eligibility caveat.
It explains PayPal-hosted approval and that Savo does not receive the buyer's
PayPal password or full card details. It never carries over Razorpay's PCI
badge or implies that Savo has a PCI certification. Bank/Razorpay reassurance
remains provider-specific and unchanged.

## Production activation checklist

1. Open `https://savotechnologies.com/admin/settings/payments` and complete the
   admin email-verification challenge. Do not share keys or OTPs in chat.
2. In the same PayPal **Live** REST app, register the direct HTTPS endpoint
   `https://savotechnologies.com/api/webhooks/paypal`, subscribing to
   `CHECKOUT.ORDER.APPROVED`, `PAYMENT.CAPTURE.COMPLETED` and
   `PAYMENT.CAPTURE.PENDING`.
3. Save that app's Live Client ID, Client Secret, Merchant ID and Webhook ID in
   the protected production PayPal form. Local encrypted credentials do not
   automatically migrate to production; never copy the local encryption key.
4. Verify the connection (OAuth only), confirm the matching webhook registration
   and genuine HTTPS delivery/signature handling, then turn PayPal On through
   the same fresh email-step-up boundary. No real payment is submitted by setup
   verification. A payment/settlement test needs separate explicit authorization.
5. Server rollout must set `PAYPAL_RETURN_ORIGIN=https://savotechnologies.com`
   and the approved `PAYPAL_LIVE_PAYMENTS_ENABLED=true`, preserve every other
   private setting/master key, and redact query/referrer data in access logs.
   Both live flag and provider On preference are required; neither bypasses
   readiness. Bootstrap PayPal Off without changing existing Razorpay preference.

Code is not proof of merchant eligibility or an end-to-end live settlement.
If any setup item is missing, do not describe PayPal as accepting payments.

## Secure admin setup

Use `/admin/settings/payments` → PayPal. The existing admin-role-only and fresh
email step-up checks apply to page reads and **every** mutation, including
verification, reconciliation and credential removal. Editors cannot bypass this.
No PayPal configuration is queried/rendered before the payment-settings grant.

Enter matching **Sandbox** app credentials first:
1. Client ID and Client Secret from PayPal Developer → Apps & Credentials.
2. The matching seller Merchant ID (13 characters).
3. Webhook ID from the same app/environment (not a signing secret).

All four configuration inputs use AES-256-GCM at rest with the existing
`SECRETS_MASTER_KEY`; saved inputs never repopulate the form. Only masked ID
suffixes and safe verification metadata are rendered. A public merchant payee
identifier is also retained on order snapshots to bind financial evidence; it is
not an authentication secret. Return nonces are hashed and separately encrypted
for idempotent create retries. Application logs/audits do not echo credentials or raw provider payloads.
Before live release, redact `paypalState`/`token` query parameters in proxy and
analytics logs and do not share return URLs. Checkout uses no-referrer metadata.
Blank fields keep saved credentials; changing app/environment/merchant requires
matching replacements. Saves and verification results are revision-bound, so
concurrent edits cannot overwrite another app or verify stale credentials.
Step-up emails bypass the sent-email archive. There is no environment fallback to another account if
saved values cannot be decrypted. Preserve the master key; never rotate it
blindly or overwrite unreadable ciphertext.

Verify connection only tests OAuth authentication (no payment). It does not
certify merchant/currency eligibility. Complete a sandbox payment with an
eligible **foreign sandbox payer**, then inspect invoice, receipt, transaction
history and the actual fee/net data under payment settings.

## Money and replay boundaries

- Server actions authenticate the active client and scope the invoice to that
  owner; browser amounts, currencies, payee IDs and paid flags are never trusted.
- Durable `paypal_checkouts` rows snapshot the invoice, merchant, app/environment
  fingerprint, order, nonce hash, expiry and stable create/capture request IDs.
  Row locks serialize create reservations, and capture leases plus PayPal
  idempotency/single-capture orders protect concurrent return/webhook processing.
- Snapshot money/references and verified fee/net evidence are database-protected
  against rewrites. An app/merchant change cannot reuse an old approval.
- Approval links are HTTPS and restricted to the correct PayPal environment,
  `/checkoutnow` and the stored order token. API origins are hard-coded. No
  PayPal SDK script, new card-input surface, or broad CSP exception is needed.
- The return GET only renders status UI. An authenticated, framework-CSRF-checked
  POST verifies owner + random state before provider access. Only a completed
  final capture with exact order, invoice, snapshot, merchant, amount and currency
  binding can record payment. A URL flag/approval/pending payment is not proof.
- Lost capture acknowledgements are resolved by reading the provider order.
  The same durable capture request ID is reused; never start an unrelated capture.
  Unknown/pending captures block another PayPal or Razorpay charge until reviewed.
- Expired unfunded approvals can be retired only after provider checks (or if no
  approval link was ever available). Old expired orders are never newly captured.
  Real completed money is still reconciled after expiry. Pending/unknown captures
  are not silently expired or replaced.
- PayPal reconciliation uses the shared serializable `recordInvoicePaid` path:
  one invoice credit, receipt event and project/milestone reconciliation.
  PayPal IDs never enter Razorpay columns. Payment history identifies PayPal and
  namespaces its capture key. Separate real overpayments remain separate evidence,
  not additional invoice credit; they require human refund/review.
- Captured money for a cancelled/changed invoice is retained in a review state,
  not falsely credited or discarded. Historical receipts use saved evidence,
  never today's fee rules. Removing credentials retains orders/payment history.
- Recheck in admin reads provider evidence without requesting a new capture.
  An administrator can reconcile a review state only after the current invoice
  again matches the captured snapshot and is payable. A disabled live-create
  flag still permits read-only reconciliation of already completed real money.

## Webhooks

Endpoint: `/api/webhooks/paypal`. Configure the same app's Webhook ID and subscribe
at least to `CHECKOUT.ORDER.APPROVED`, `PAYMENT.CAPTURE.COMPLETED`,
`PAYMENT.CAPTURE.PENDING`. A browser return is not required when the approved-order
webhook independently captures and confirms an eligible order.

Headers/events are verified through PayPal's authenticated
`verify-webhook-signature` API. Certificate URLs are checked but **never fetched**
by this server, avoiding certificate-URL SSRF. Verified events bind to stored
provider orders; raw payer payloads are not persisted. Event IDs are namespaced
and idempotent. Transient/pending outcomes request a provider retry; no failed
signature can mutate invoice/payment data.

Refunds, reversals, disputes, subscriptions, payouts and exchange-rate quoting
are not implemented as automatic billing mutations. Other signed events are
recorded without inventing invoice state; monitor PayPal and use an audited
finance workflow. This is one-time invoice capture, not a full PayPal accounting
or dispute-management integration.

## Local setup and verification

`prisma/paypal.sql` is additive: two new tables/indexes/guards, no invoice,
Razorpay or bank-row rewrites. It is integrated into the future updater but was
initially applied **only to a verified loopback local database**. Production
rollout requires a private backup and review of the additive diff first. Generate the
Prisma client and restart local processes after schema/client changes.

Local development overrides (never commit secrets):

```dotenv
PAYPAL_LIVE_PAYMENTS_ENABLED=false
PAYPAL_RETURN_ORIGIN=http://localhost:3000
MAIL_DELIVERY_MODE=off
```

`PAYPAL_RETURN_ORIGIN` is a private, validated runtime setting. It avoids the
public metadata helper, which intentionally points at the production canonical
origin. Sandbox returns must never go to the production domain. For a :4326
preview, explicitly override the return origin and use that same host/session.
Sandbox is allowed on loopback; an explicitly opted-in non-production staging
host is also possible. Canonical production hosts cannot settle sandbox money.
Live create/capture additionally requires a verified configuration + webhook ID,
explicit live enable flag, production runtime/content, canonical HTTPS
origin and an actual canonical production HTTP host. Local forwarded-host
spoofing or copied production env files cannot enable live captures. A live app saved locally cannot charge real money.

```sh
npm run test:run
npm run lint
npm run typecheck
MAIL_DELIVERY_MODE=off PAYPAL_LIVE_PAYMENTS_ENABLED=false npm run build
# Set a loopback CREATEDB admin connection if the app role lacks CREATEDB:
node --env-file=.env --env-file=.env.local scripts/verify-paypal.mjs
```

The verifier creates/drops only its random `savo_paypal_verify_*` database. It runs
real PostgreSQL settlement/concurrency/immutability tests, then browser/admin/
return/webhook checks against a **synthetic loopback provider**, with live PayPal
networking blocked in the isolated child process. App API URLs are not configurable
or weakened to enable this test. No real PayPal app, charges, recipients or live
records are used. Evidence is under `.impeccable/review/paypal/` (gitignored).
Real sandbox testing needs the merchant's own sandbox keys and working PayPal
network access; real webhook delivery additionally needs an approved HTTPS tunnel.
No tunnel or live integration was created by this task.

For interactive review use `http://localhost:3000/admin/settings/payments` and
an owned client invoice's `/portal/invoices/<id>/pay` page. The :4326 production
preview is also kept available with a port-matched local PayPal return origin.
Use your existing local account. For an owned, positive, sent/overdue invoice,
**Pay now** remains visible on loopback when PayPal credentials are configured,
even if Live payments are disabled. Select PayPal to inspect its original-currency
summary and fee disclosure. A local-preview notice explains the disabled CTA;
no create/capture permission is relaxed. Production visibility, emailed links and
PDF payment-target availability do not inherit this UI-only opt-in. Paid,
cancelled, draft and nonpositive invoices do not gain a new payment action.

The owner saved Live credentials locally and successfully verified OAuth on
2026-10-30. This is authentication-only evidence, not an actual payment,
merchant eligibility certificate or webhook-delivery test.

With mail off, the existing development-only
step-up fallback writes the code to the private `tmp/paypal-dev-3000.log` (not a
real inbox); production never logs those codes. No authentication bypass was
added. The isolated verifier's signed fixture grant is confined to its disposable
DB and child server, never the ordinary local or production app.
