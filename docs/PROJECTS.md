# Budgeted projects and client delivery

## Admin workflow

`/admin/projects` creates a project and its complete base milestone plan together.
Required: client, title, description, fixed base budget, currency, estimated
project delivery date and at least one milestone. Each base milestone has a
title, positive cost, delivery state, optional notes and optional due date.
Reference codes can be supplied or generated collision-resistantly.

Currencies: INR, USD, CHF, EUR, GBP and AED. All current currencies use integer
minor units (100 paise/cents to a major unit). Decimal strings are parsed
exactly; amounts with more than two decimals, scientific notation, negatives
or values beyond PostgreSQL Int capacity are rejected. Base milestone costs
must sum **exactly** to the fixed budget, both in the browser and server-side.
A forged/invalid plan cannot partially save a project or its allocations.

`/admin/projects/[id]` contains:
- Financial summary: base budget, additional scope, agreed total, payments,
  balance against the agreed total and unpaid issued invoice balance.
- Editable project details and base allocation plan. New project IDs are assigned
  server-side as STPLPR plus five digits, reserved/shown in full before creation
  with Copy ID; saving retains that exact ID. Issued/legacy references are immutable. Milestone IDs stay
  project-scoped and stable; new client-side rows are refreshed from committed
  server state after save. Removing/repricing a base module requires reallocating
  the fixed budget exactly.
- Quick module-status controls; no manually editable progress percentage.
- Separate additional-work editor (title, cost, description, optional estimate
  and delivery status). Additional work increases agreed total, not base budget.
  Edit the project estimate separately when new scope changes the schedule.
- Explicit Complete, Cancel and Reopen controls, with confirmation for completion
  and cancellation. Financial records are not deleted or silently cancelled.
- Linked invoices and a client-visible delivery log.

## Delivery versus financial completion

Delivery progress is cost-weighted: completed module cost / all module costs
(base + additional). In-progress modules do not get unearned partial progress.
100% requires every module to be done, avoiding a rounded 99.999% becoming 100%.
Legacy unpriced rows have a clearly bounded count-based fallback until priced.

As requested, full payment automatically marks a budgeted project Completed
(stored as the existing `delivered` state) when:
1. A real positive budget is configured.
2. Paid, matching-client and matching-currency invoices cover at least the full
   agreed base-plus-additional total.
3. No matching issued unpaid/overdue invoice balance remains.
4. The project is not cancelled.

Paying only the first partial invoice cannot complete the entire engagement.
Draft/cancelled, wrong-owner and other-currency invoices never count. No FX
conversion or automatic invoice issuance is invented; billing remains an
explicit admin operation. Overpayment does not produce fictional refunds.

Payment completion never marks unfinished delivery modules done. The portal
shows payment totals and module delivery progress separately. Automatic
completion is tracked by `completedByPayment`; payment reversal, increased scope
or loss of full coverage reopens ONLY payment-completed projects. Deliberate
manual completions are preserved. Cancelled projects never reactivate from
payment events. An admin may explicitly override state with the visible controls.

Business numbering uses independent CS/PR/IN sequences, never client-number
embedding in projects/invoices. Original primary/foreign keys remain unchanged;
see `docs/BUSINESS-IDS.md` for ranges, locking, migration and exhaustion.

## Invoice connections

Invoice creation/editing filters projects to the selected client. Budgeted
projects lock the invoice to their currency; the server verifies this again.
Invoice edits capture the old row before mutation (the old implementation read
it after saving, preventing transition emails). Mark-paid also produces a real
receipt and reconciles the full agreed project total. Moving an invoice reconciles
both old and new projects. Repeated mark-paid actions are idempotent. Drafts
and cancelled invoices cannot be marked paid; paid invoice history cannot be
deleted via the delete action. Corrections/reversals still use the explicit
invoice edit flow.

After invoices exist, project ownership is locked. Budgeted projects also lock
currency. A legacy unbudgeted project can acquire its correct currency only if
linked active invoices agree; conflicting legacy billing must be corrected or
unlinked first, never silently converted.

Client PDF download/view/print uses current stored invoices and keeps its own
ownership and draft checks. An optional invoice-level hosted payment link adds
Pay now to unpaid/overdue project invoice rows, PDFs and relevant emails. Opening
a link never changes project/invoice state. After confirming provider receipt,
mark the invoice paid in admin to run the existing completion reconciliation.
Changing client/amount/currency while retaining an old link requires explicit
reconfirmation or replacing/clearing it. See `docs/INVOICES.md`.

## Consistency, concurrency and email

Financial/milestone/invoice writes and project reconciliation happen in the
same serializable Prisma transaction, with bounded serialization-conflict
retries. Project and invoice editors reject stale revisions instead of
overwriting newer payment/module changes. Child mutations scope IDs to their
parent project; foreign base/additional module IDs are rejected before writes.
Private client pages continue to read only their owner's project/invoices.
Admin and portal views are invalidated together after commit.

Notifications are scheduled through Next `after` only after a successful commit:
project creation/plan edits, module starts/completions/returns to upcoming,
additional scope additions/edits, explicit project state changes, issued/paid/
overdue invoices, automatic payment completion and automatic reopening. Existing
projectUpdate/milestoneUpdate/invoice templates and saved overrides remain in
use. The default renderers now consume real amount/currency/due date/overdue days;
they no longer send hard-coded INR 2,500 samples or call a started module done.
Fractional money is preserved in financial email copy.

Existing mail delivery/suppression/logging policy is retained. Sending is an
after-response attempt, not a new durable SMTP retry queue; transport failures
are logged and do not roll back saved billing/project data. No real emails were
sent in local verification.

## Schema and deployment

Additive fields only:
- ClientProject: nullable budget (minor units), currency (default INR),
  completedByPayment (default false).
- ProjectMilestone: nullable amount (minor units), description, scope (base or
  additional, default base).

Existing unbudgeted projects/rows remain visible and are not assigned invented
costs or payment-completion rules. Admin setup must supply/allocate a budget.
The local database has been updated after verifying its host is localhost.
Production has **not** been changed. Before releasing the new code, apply the
schema with the project's normal reviewed deploy procedure (`prisma db push`
before build/start); do not run the new code against the old schema.

## Local verification

Start the dev server with mail disabled. The browser script refuses non-local
origins/databases, creates synthetic admins/clients/sessions/billing records,
uses actual authenticated server actions, then deletes fixtures in finally:

```sh
MAIL_DELIVERY_MODE=off npm run dev
MAIL_DELIVERY_MODE=off node --env-file=.env --env-file=.env.local scripts/verify-project-budgets.mjs
npx vitest run tests/project-finance.test.ts tests/project-service.test.ts tests/project-invoice-actions.test.ts
```

Final local gate: 1,454 tests / 103 files, lint, typecheck and production build
pass. Browser: 32 assertions covering real project creation, forged allocation
rejection, live module progress, edits, stale-edit rejection, additional-work
creation/editing, client visibility, invoice ownership/currency, partial/full
payments, reversal, cancellation and explicit completion. Admin/client captures
at 1440/390/320px and the report are in `tmp/project-budget-review/`. Review was
performed in-thread; no independent reviewer or physical-device certification is
claimed. Local review only; no production deployment.
