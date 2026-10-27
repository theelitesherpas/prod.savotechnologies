# Client invoices: PDFs and optional payment links

## Client workflow

Every visible invoice in `/portal/invoices` and project invoice tables offers:

- **Download PDF**: `/portal/invoices/[id]/pdf`, an actual PDF attachment named
  `Savo-Invoice-<reference>.pdf`.
- **View / print**: the same endpoint with `?view=1`, opening the PDF inline in
  a new tab. Use the browser/device PDF viewer's Print action (Ctrl/Cmd+P where
  supported) or its native share/print menu. No unreliable auto-print script.

Available for stored `sent` (shown as **Unpaid**), `paid`, `overdue` and
`cancelled` records. Private drafts and unsupported statuses remain unavailable.
The invoice's stored status remains authoritative; downloading never changes
payment status, creates a new number or automatically marks a record overdue.

## Business references

New invoices get an immutable server-assigned `STPLIN` + five-digit reference,
independent of CS client and PR project sequences. The creation form reserves and
shows the full ID before save, with a Copy ID button, so it can be used externally
in advance. Save claims that exact reservation; abandoned IDs are not recycled. Admin forms cannot choose or
change issued IDs. Existing invoice numbers, ownership, amounts and dates remain
unchanged; no historical renumbering is automatic. Client CS references also
appear in new-client PDFs when assigned. This is identification, not a tax/legal
compliance claim or proof of payment. See `docs/BUSINESS-IDS.md` for initialization,
SQL migration, transaction guarantees, reserved ranges and legacy handling.

## Milestone links

Invoices can optionally link one project milestone (from the invoice forms or
the project page's per-milestone **Raise invoice** shortcut). The link is
validated to the invoice's own client, project and that project's currency;
it never changes amounts. The milestone then derives its payment status from
its linked invoices: fully covered by paid invoices → **Paid**, partly covered →
**Partially paid**, invoiced but unpaid → **Unpaid**, no active link →
**Not invoiced** (cancelled invoices are ignored). This status is shown on the
admin and client project pages. A milestone with linked invoices cannot be
deleted until those invoices are unlinked, preserving billing history.
Milestone payment status is display/tracking only; project completion still
follows the full-project payment rules.

## Work descriptions, task prices and customer addresses

Milestones (base or additional work) can have **up to three tasks**, each with
an optional-to-add, required-once-added short name (2–80 characters) and positive
price. Task prices calculate the milestone cost, and the server requires the
sum to match exactly. Existing aggregate milestones remain valid without tasks.

Selecting a milestone in either invoice creation form copies its title/notes
and task prices. The work description and up to three invoice task prices remain
editable before save; task prices calculate the invoice total. For partial
billing, include only the work/prices being billed now—no automatic prorating or
invented task charges. The server rejects mismatched totals, malformed JSON,
invalid decimals/overflow and fourth tasks, including forged submissions.

`Invoice.items` and `Invoice.description` are issued **work snapshots**. Later
project/milestone changes do not rewrite them. Editing an invoice loads its own
snapshot; an explicit invoice correction can change the work and matching total.
Legacy invoices have null descriptions and can show their linked milestone's
current title/notes; they never acquire invented historic task prices. Unlinked
legacy invoices retain the aggregate “Professional services” fallback. Separate
invoice Notes remain available for payment/other context.

Client add and edit forms contain six entirely optional billing-address fields:
street, apartment/suite, city, state/region, postal/ZIP code and country. Saved
nonblank address lines appear under **Bill to**, in the same style as the supplier
address. Partial addresses are accepted; blank fields create no placeholders or
empty address block. PDFs use the client's current saved address, not a historical
address snapshot. Only allowlisted address fields from the invoice's own client
are selected; no authentication DTO expansion or foreign-account exposure.

Every PDF is **one A4 page**, with at most **three single-line task/price rows**.
The existing logo, fonts, status stamp, neutral table, amount rail and totals
composition are retained. Bounded work notes and optional invoice notes share
the available space; unusually long text is visibly abbreviated with an ellipsis
and disclosure rather than generating continuation pages. Full work details
remain stored and visible in the portal. All task prices and totals stay exact.

## Optional Pay now links

Admin invoice create/edit forms accept **Payment link (optional)**, stored as
nullable `Invoice.paymentLink` (`invoices.payment_link`). Leaving it blank keeps
the existing invoice/document/email experience. Link changes resend the relevant
unpaid/overdue invoice notification after commit, through the existing delivery
policy and saved email-body overrides. No new SMTP or payment-provider SDK.

For positive-amount **Unpaid** (`sent`) and **Overdue** invoices, a supplied link
adds **Pay now** to client invoice/project tables, dashboard next payments,
freshly generated PDFs, and issued/reminder emails (HTML and plain text).
Receipts, paid/cancelled invoices, drafts and unsupported states never receive
an automatic payment action. The stored URL remains editable in admin history.
Portal navigation uses a native external link with a new tab, `noopener`,
`noreferrer` and no-referrer; invoice access remains owner-scoped.

URLs must be HTTPS, at most 2,048 characters including canonical encoding, with
no credentials, non-default ports, control characters or backslashes. PayPal
(`paypal.com`, `paypal.me`), Razorpay (`razorpay.com`, `rzp.io`, `rzp.me`) and
Stripe payment hosts (`buy.stripe.com`, `checkout.stripe.com`,
`invoice.stripe.com`, `billing.stripe.com`) are
allowlisted, including their subdomains. Lookalike suffixes and provider
homepages without a path/query/fragment are rejected. Query tokens and PayPal
invoice fragments are preserved. Other providers require an explicitly reviewed
hostname in **`NEXT_PUBLIC_PAYMENT_LINK_HOSTS`**, comma-separated without schemes,
paths or wildcards. This is public build-time configuration: rebuild/redeploy
after changes; never put API keys there. No URL is fetched for validation.
Invalid legacy/tampered links fail closed at render time rather than becoming
HTML/JavaScript/PDF actions. PDF links use only HTTPS URI annotations.

**Operational safety:** use a live, invoice-specific, preferably single-use link.
Verify merchant/payee, customer, amount, currency and expiry in the provider's
own dashboard. URL validation cannot verify these business details. Changing an
invoice's client/amount/currency while keeping its old link requires explicitly
checking the reconfirmation checkbox, or replacing/clearing that link. Link
changes, provider hostname and reconfirmations are audited without logging URL
tokens. An administrator's checkbox is not proof that funds were received.

**Current Razorpay Standard Checkout:** a manual payment link always wins;
without one, the owner-scoped portal checkout is the PDF's payment destination
when the gateway is configured. A server order is created only when the client
starts online payment, not when an invoice is issued or a PDF is downloaded.
Existing legacy hosted links remain supported. Manual/invalid-link precedence,
fee rules, verification, transaction history and bank-deposit confirmation are
documented in `docs/PAYMENTS.md`. The PDF displays the issued invoice amount,
not a reconstructed provider charge or estimated processing-fee breakdown.

**Automatic confirmation:** `POST /api/webhooks/razorpay` verifies the
`X-Razorpay-Signature` HMAC-SHA256 (constant-time) against the webhook secret
stored encrypted in the panel, deduplicates by event id
(`webhook_events`, replay-safe), matches the invoice by link id or reference,
and records payment only when the server checkout total (or legacy link amount)
and currency match exactly — through `recordInvoicePaid`, the same transactional routine as manual marking (receipt
email, project + milestone reconciliation). Mismatches are recorded as
rejected for human review. **Sync status with Razorpay** on the invoice page
reconciles manually from the provider's own record. Manual Pay now links and
manual marking remain fully supported without any gateway.

**Deployment:** this task/address extension adds `ClientUser` address columns,
`ProjectMilestone.tasks`, and `Invoice.items` / `work_description`. Existing rows
receive empty optional addresses/tasks; null work descriptions identify legacy
invoices. Back up the database/prior build, review the additive schema push, and
apply it through the normal workflow **before starting the new code**. Generate
the Prisma client during install/build. Do not run the new application against
the old schema. Payment rules, keys and webhook configuration are unchanged.
The localhost database was updated for verification; production has not been
changed. Promote through dev → test → production; see `docs/WORKFLOW.md`.

## Document structure and financial truth

`src/lib/invoice-document.ts` defines the public document contract, labels,
integer-minor-unit balances, two-decimal ISO-currency formatting, UTC date
formatting and header-safe filenames. `invoice-pdf.ts` creates a standalone A4
PDF using pdf-lib/fontkit, with verified supplier details and the official logo.
The document includes the existing invoice number, issued/due/paid dates,
client/company and optional billing address, owner-scoped project, work
notes/task amounts (or legacy aggregate service amount), payment status,
paid/due balances, stored invoice notes and status-as-of generation date.
All records use a single page; long text is fitted/visibly abbreviated.

### Balanced single-page A4 design

- Explicit white page, official black logo and fully embedded Inter fonts.
  A shared 48pt outer grid aligns the supplier, client, table and footer;
  invoice title, number and stamp are consistently right-aligned.
- Measured bill-to and date/currency columns preserve long client details
  without moving the metadata. Unusually long text is visibly shortened to
  preserve the one-page layout. Missing optional fields
  disappear cleanly rather than creating placeholder blocks.
- A light service-table header, restrained separators and an independent
  amount rail. Service amount, invoice total, amount paid and balance due all
  end at exactly the same x-coordinate. The highlighted balance adapts only
  its monetary type size for the largest stored amounts; body text stays readable.
- **Status stamp:** stored `paid` → green PAID; `sent` → neutral UNPAID;
  `overdue` → red OVERDUE; `cancelled` → grey CANCELLED. A stamp is a visual
  status label, not a signature, certification or payment mutation. It never
  follows query parameters, and dates do not silently change the stored status.
- The supplier block includes owner-supplied GSTIN `23ABDCS2341B1Z1`, TAN
  `BPLS22850C` and CIN `U72900MP2020PTC050634` from `SITE.registration`.
  The canonical company-facts registry uses the same values. These identifiers
  do not add tax charges, change amounts or claim tax-invoice compliance.
- Payment information and totals are bottom-anchored, with contact/closing text
  consistently above the footer. Short invoices therefore do not leave a large
  empty bottom band. The description table absorbs the available height;
  actual task rows gain measured breathing room (up to 44pt), contracting to
  20pt only for dense single-page content. No blank tasks or filler charges.
  Payment information and totals stay together. Pay now remains a real
  HTTPS URI annotation, with manual-link precedence; paid/cancelled/zero-value
  invoices and unsafe/stale fallbacks never expose a payment action.
- No continuation pages: task names use one line each, notes have bounded
  space and long legacy fields show ellipses/disclosure when abbreviated.
  Footers show status-as-of and Page 1 of 1. Notes are plain text, not interpreted
  HTML. No fabricated quantities, addresses, tax IDs, bank instructions or
  additional tax/fee lines.

The schema stores an invoice total, up to three task charges, issued work notes,
an optional current client billing address and full-payment status. It does not
model quantities/rates, GST/tax breakdowns, bank instructions, refunds or a fully
immutable historical billing identity/address snapshot. The PDF does not
fabricate these or claim tax-invoice compliance.
Paid records show the full amount paid and zero balance. Unpaid/overdue records
show the stored amount outstanding. Cancelled records show no balance due and
an explicit cancellation statement. Contact the team for payment instructions.
A legally complete tax invoice would require approved tax/billing data and
business rules, not merely rendering additional labels.

## Access, privacy and recovery

The Node route handler **independently** calls `getClientUser`; a layout is not
a route-handler security boundary. It reads by invoice ID + current client ID
+ the four allowed statuses. Project selection is independently owner-scoped.
No private account/hash/session fields are selected into the document.
Anonymous, expired, revoked or inactive sessions cannot download; unknown,
foreign and draft IDs all return the same private 404 for signed-in clients.
Responses (including errors) are private/no-store and noindex, with nosniff
and no-referrer. Inline vs attachment is the only supported query variation.
PDF generation is limited to 30 authenticated requests per client per minute.
Generation/storage errors return a safe recovery message, never a stack trace.
No external image/font fetch, user-provided HTML evaluation or PDF disk cache.

## Fonts and packaging

The PDF uses `public/fonts/inter/Inter-PDF-Regular.ttf` and
`Inter-PDF-SemiBold.ttf`, frozen static instances derived from the existing
self-hosted Inter variable font. Source font, glyph contours and web font usage
are unchanged; retain the accompanying OFL license. Full font programs are
embedded deliberately: subsetting in this pipeline produced extractable text
but missing glyph outlines in Apple PDFKit/Preview. This was caught by rendering
actual PDFs, not by checking only the PDF header or extracted text.

Rebuild the two PDF-only font assets with:

```sh
# Build-time tool only; tested with fonttools 4.60.2. Not a server dependency.
python3 scripts/build-invoice-fonts.py
```

Keep those assets and `public/images/email/logo.png` with the deployed app.
Only public brand assets are cached in process memory; PDF records are queried
and rendered afresh for each authorized request.

## Lower-page balance and registration refinement

The owner's downloaded invoice demonstrated a large empty band below the
payment summary. The pending refinement bottom-anchors settlement/closing
content and adds the supplied registration identifiers without changing the
billing data, totals, status, payment links or database schema. The original PDF
was left untouched; a separate private preview was generated in Downloads.
Customer-specific reproduction data stays in ignored local `tmp/` files, never
in source control or synthetic CI fixtures.

Local verification: all **2,008 tests passed / 16 skipped**, lint, typecheck and
production build passed. Apple PDFKit reviewed sparse 0/1/2/3-task documents,
full-address/dense-note cases, status variants, Unicode/long fields and maximum
supported currency amounts: **23 synthetic PDFs / 1,317 geometry/content checks**.
The geometry gate now asserts lower-page contact/closing positions, lower
settlement placement and all three supplier identifiers as well as single-page
bounds and exact price rails. The private owner-supplied before/after document
was additionally checked for unchanged original text and payment destination.
Review performed inline, not independently. Local preparation only; publishing
this refinement requires the normal reviewed release workflow.

## Task/address extension verification

Local gates: **2,004 tests passed / 16 skipped**, lint, typecheck and production
build passed. The new workflow script exercised **39 real authenticated browser
assertions**, including client create/edit/clear-address, task limits/totals,
project and additional-work creation, both invoice entry points, invoice
corrections, issued snapshot preservation, client visibility, owner isolation and
single-page downloads. Synthetic fixtures were removed in `finally`; mail was
disabled and no live charges or production writes were performed.

Apple PDFKit rendered 19 unit-test documents plus two browser-issued documents:
**1,056 geometry/content assertions** covered one-page counts, exactly three
single-line task charges, shared amount rails, status/balances and address
presence/omission. Desktop/390px/320px captures and report:
`tmp/invoice-tasks-browser/`; unit PDF review: `tmp/invoice-task-review/`.
Design review was performed inline (not independently). The single detector
scan returned seven advisory findings about inherited console colours/radii;
no new visual system was introduced and no non-advisory findings were reported.

```sh
npx vitest run --maxWorkers=2
# Start a local server separately with MAIL_DELIVERY_MODE=off.
MAIL_DELIVERY_MODE=off BASE_URL=http://localhost:4312 node --env-file=.env --env-file=.env.local scripts/verify-invoice-tasks.mjs
swift scripts/review-invoice-pdfs.swift tmp/invoice-tasks-browser/pdf tmp/invoice-tasks-browser/{issued,without-address}.pdf
node scripts/check-invoice-pdf-geometry.mjs tmp/invoice-tasks-browser/pdf/geometry.json
```

## Existing verification tools

```sh
npx vitest run tests/invoice-document.test.ts tests/invoice-pdf-route.test.ts tests/portal-workspace.test.tsx tests/payment-links.test.tsx tests/project-invoice-actions.test.ts
BASE_URL=http://localhost:3000 node --env-file=.env --env-file=.env.local scripts/verify-invoice-downloads.mjs
MAIL_DELIVERY_MODE=off node --env-file=.env --env-file=.env.local scripts/verify-payment-links.mjs
```

The integration script refuses non-local origins/databases, creates synthetic
clients/invoices/sessions directly (no login bypass in production code), checks
all statuses, download/inline headers, ownership, expired/inactive sessions,
actual browser attachments and 1440/390/320px layout. Fixtures are deleted in
`finally`; no email send functions are imported. PDF unit tests verify valid
A4 structure, one-page normal documents, currencies/fractional amounts,
single-page long values, three-task/address documents and both complete embedded
static font programs.

For actual-document design verification on macOS (local QA only):

```sh
npx vitest run tests/invoice-document.test.ts
swift scripts/review-invoice-pdfs.swift .impeccable/review/invoice \
  tmp/invoice-pdf/{sent,paid,overdue,cancelled,long-values,minimal,portal-checkout,long-service,long-billing,maximum-INR,maximum-USD,maximum-CHF,maximum-EUR,maximum-GBP,maximum-AED}.pdf
node scripts/check-invoice-pdf-geometry.mjs .impeccable/review/invoice/geometry.json
BASE_URL=http://localhost:4312 SKIP_SCREENSHOTS=1 node --env-file=.env --env-file=.env.local scripts/verify-invoice-downloads.mjs
```

The Swift helper uses Apple PDFKit (Preview's rendering engine), exports every
page to PNG and extracts text/geometry. The checker validates status stamps,
A4 print bounds, the shared monetary right edge, bounded single-page text,
page counts and zero paid/cancelled balances across the synthetic documents.
Largest stored amounts are tested in INR/USD/CHF/EUR/GBP/AED. This is a rendered
PDF review, not an HTML approximation; no physical-printer claim is implied.

Evidence: `tmp/invoice-pdf/` contains sample PDFs, Apple PDFKit-rendered pages,
extracted text, portal screenshots and browser report. PDF review was performed
in-thread, not by a separate reviewer. Payment evidence (HTML email previews,
PDFs and desktop/mobile screenshots) is in `tmp/payment-links/`. The additional
payment script exercises real authenticated admin create/edit actions, rejected
lookalikes/stale checkout terms, owner isolation, provider navigation without a
network request, blank/removal/overdue/paid/cancelled states, PDF URI annotations,
and invoice-based project completion. All synthetic data is cleaned up in
`finally`. Full local gate and browser assertion counts are in its report and
`tmp/payment-links/review.md`. Production
runtime dependency audit has zero findings. Local verification does not mutate real invoices, send real mail or execute
live charges. Production publication is a separate, backed-up release through
`docs/WORKFLOW.md`.
