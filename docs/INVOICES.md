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

**Not a payment gateway integration:** clicking, returning from the provider,
or a URL parameter never changes invoice/project status. Confirm receipt with
the provider, then mark the invoice paid in admin; existing invoice reconciliation
completes a fully funded project. Automatic provider confirmation would need
separately configured, signature-verified, replay-safe webhooks and transaction
reconciliation. Previously delivered emails/downloaded PDFs cannot be revoked
when the portal record changes; expire/revoke old payment links with the provider
to prevent duplicate or outdated payments.

**Deployment:** apply the additive nullable `invoices.payment_link` column before
starting this code, together with the project schema additions. Back up the
production database first; see `docs/WORKFLOW.md` for promotion and deployment.

## Document structure and financial truth

`src/lib/invoice-document.ts` defines the public document contract, labels,
integer-minor-unit balances, two-decimal ISO-currency formatting, UTC date
formatting and header-safe filenames. `invoice-pdf.ts` creates a standalone A4
PDF using pdf-lib/fontkit, with verified supplier details and the official logo.
The document includes the existing invoice number, issued/due/paid dates,
client/company, owner-scoped project, aggregate service amount, payment status,
paid/due balances, stored notes, page numbers and status-as-of generation date.
Long references, names and notes wrap/paginate; normal records fit one page.

The current schema stores one aggregate invoice amount and full-payment status,
not line-item quantities/rates, partial transactions, billing address, GST/tax
breakdowns, bank instructions, refunds or an immutable historical billing
snapshot. The PDF does not fabricate these or claim tax-invoice compliance.
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

## Verification

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
multi-page long values and both complete embedded static font programs.

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
runtime dependency audit has zero findings. No live deployment, real invoice
mutations or real mail sends in this feature implementation.
