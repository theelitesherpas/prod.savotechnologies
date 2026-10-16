# Business identification architecture

## Policy and scope

Human business references use **`STPL` + two-letter type + five-digit reference**.
The sole range/seed policy is `src/lib/business-id-config.ts`. Seeds are intentional
numbering offsets, **not counts or evidence of historical transactions**. No
historical clients, invoices or other records are fabricated to fill unused slots.

| Type | Entity | Exclusive range | Initial current | First new reference |
|---|---|---|---|---|
| CS | Client | 01400–01999 | 01436 | STPLCS01437 |
| PR | Project | 02000–03999 | 02683 | STPLPR02684 |
| IN | Invoice | 04000–06999 | 05147 | STPLIN05148 |
| LD | Lead/enquiry | 07000–07999 | 07320 | STPLLD07321 |
| QP | Proposal | 08000–08999 | 08345 | STPLQP08346 |
| QT | Quotation | 09000–09999 | 09427 | STPLQT09428 |
| CT | Contract | 11000–11999 | 11361 | STPLCT11362 |
| SA | Service agreement | 12000–12999 | 12417 | STPLSA12418 |
| ND | NDA | 13000–13999 | 13356 | STPLND13357 |
| PO | Purchase order | 14000–14999 | 14280 | STPLPO14281 |
| RC | Payment receipt | 15000–16999 | 15425 | STPLRC15426 |
| CN | Credit note | 17000–17999 | 17313 | STPLCN17314 |
| VN | Vendor | 18000–18999 | 18242 | STPLVN18243 |
| TK | Support ticket | 19000–21999 | 19486 | STPLTK19487 |

All 14 allocators are ready. Current application creation paths integrate CS,
PR, IN, LD and TK. Categories without an actual domain module remain provisioned
but unused; this does **not** introduce a proposal, contract, purchase-order,
vendor, credit-note or separate payment-receipt product. A paid-invoice email is
still tied to its invoice, not an invented payment transaction/receipt record.

- Clients receive CS IDs when created through admin; shown in admin, client
  selection controls, the client's own workspace, welcome email and invoice PDF.
- Projects receive PR IDs independent of client numbering. Relationships still
  use the original database `clientId`/`projectId` foreign keys.
- Invoices receive IN IDs, propagated through admin, portal, PDFs and mail.
  Drafts reserve their IDs too; deletion/cancellation never recycles a reference.
- Business enquiries and callbacks share LD. Validated HR applications do not
  spend sales-lead IDs or alter employee identification.
- Human `user_report` support submissions use TK. Automated error/404 telemetry
  is technical logging, not a business ticket, and cannot consume this block.
- **Employee IDs and their creation/editing logic are unchanged.**
- Meetings, chat/security tokens, infrastructure keys and editorial CMS records
  are not silently assigned invented type codes. Additional categories need
  specifically approved allocations; unused gaps stay unused.

## Three distinct kinds of identifier

1. Existing opaque primary keys (`id`, currently Prisma CUIDs): relationships,
   sessions and routes. Not rewritten, parsed or derived from business IDs.
2. Business IDs: stable, predictable, public-facing references, **not secrets**.
3. Authentication/invitation/public-receipt tokens: retain cryptographic entropy.
   A guessed `STPLLD07321` must never authorize a thank-you confirmation or expose
   an enquiry; the legacy receipt-token validator explicitly rejects this format.

Owner-scoped portal/PDF access and all existing admin permissions remain intact.
No public counter or unauthenticated business-record lookup endpoint is added.

## Allocation and transactions

`src/lib/business-ids.ts` is server-only. Normal record creation MUST enlist the
allocation or reservation claim and domain insert in the **same transaction**:

```ts
const client = await businessTransaction(async tx => {
  const businessId = await claimBusinessId(form, "CS", user.id, tx)
    ?? await generateBusinessId("CS", tx);
  return tx.clientUser.create({ data: { ...validatedFields, businessId } });
});
```

The service validates the configured type, takes a shared transaction advisory
lock (provisioning takes its exclusive counterpart), locks the category counter
with `SELECT ... FOR UPDATE`, checks stored range/seed/current against code,
increments exactly once, validates the boundary, formats five digits and inserts
an immutable reservation. The transaction commits both record and reference or
rolls both back. There is no randomness, date/year reset, `MAX(id)+1`, modulo
wraparound, process-local mutex or yearly reseeding in reference generation.

Read-committed allocation transactions use row locks for sequencing. Financial
project/invoice transactions remain serializable. The whole callback is retried
with bounded exponential backoff only for aborted serialization/deadlock errors:
Prisma `P2034`, and PostgreSQL `40001` / `40P01` wrapped in raw-query `P2010`.
Constraint violations and ambiguous network/commit errors are not blindly retried.
Keep mail, auditing and all other external effects **outside retry callbacks**.

`generateBusinessId("CS")` without a transaction is also supported, but permanently
reserves the ID immediately—even if the caller never attaches a domain record.
It is not a preview API. Prefer the enlisted form above for all creation paths.

## Exact IDs before creation

Client, project and invoice creation forms now show a **real, fully reserved ID**,
not `#####` or an estimated next counter. The shared `BusinessIdField` requests it
through an authenticated, permission-checked, rate-limited POST when the browser
mounts the creation form. GET rendering/prefetch does not allocate IDs. Each field
has a **Copy ID** button; the full value remains visible on narrow screens.

`business_id_drafts` binds each reservation to its administrator, type and browser
idempotency key. Repeated/parallel requests with the same key return the same ID.
Session storage retains the browser draft across ordinary refresh/navigation;
where browser storage is unavailable, keep the form open. A different browser/tab
may have a separate draft. Duplicated tabs can share a browser draft: only one can
save it; the other must reload to obtain a new ID rather than silently reusing it.

Saving claims the reserved ID exactly once **in the record's transaction**.
A failed validation/domain write retains the ID for retry. Another administrator
cannot claim it. After successful creation a fresh draft gets a fresh ID. If the
request includes a reservation, failure never silently substitutes another ID;
old integrations without one can still use the direct allocator. Employee IDs,
legacy issued references and public enquiry/support intake remain unchanged.

**Opening a creation form now reserves a number even before data is entered.**
Abandoned IDs are retained, never recycled/expired into someone else's record.
Capacity counts these reservations. Numbering is sequential by **reservation**,
not necessarily by save time. A reservation is not an invoice/client/project row:
no balance, payment status, email or business document is created until save.
This is not a claim of legal/tax invoice numbering compliance.

## Database guarantees

The additive Prisma schema adds nullable, unique `businessId` foreign keys on
existing entities (for legacy compatibility), plus:

- `business_id_counters`: one policy row per type, with immutable bounds/seed and
  persisted current position. Runtime never initializes missing state.
- `business_ids`: permanent issuance ledger. ID is unique and numeric reference
  is **globally unique across types**. Deleting an associated business record
  never deletes/recycles its reservation.
- `business_id_drafts`: owner-bound, idempotent pre-creation holds; identity fields
  cannot be transferred/changed/deleted, and consumption can occur only once.

`setup-business-ids.mjs` installs PostgreSQL invariants from the same configuration:
exact type/range/format checks; counter policy immutability and +1-only increments;
a deferred constraint requiring a reservation in the same transaction; immutable
issued references; and entity-type/foreign-key guards. For example, attaching a
CS reference to a project or inserting `STPLIN02684` fails at the DB boundary.

Nullable fields permit existing records/controlled legacy imports to remain
unassigned; they are not permission to bypass the service in new application
creation paths. Imports/integrations must explicitly adopt the allocator and
appropriate entity type. A raw Prisma insert is not automatically numbered.
The provisioner refuses unregistered canonical STPL references from an older
import and refuses policy/ledger inconsistency instead of silently skipping IDs.

## Legacy records and legal/audit history

Existing clients, project codes, issued invoice numbers, enquiry references,
primary keys, ownership, values, dates and financial history are retained.
There is **no automatic backfill or renumbering**. New references are read-only,
and issued legacy references are immutable on normal edits too. Legacy searches
continue to work; missing business IDs are not replaced by fabricated values.

An old record's continued legacy number is intentional, not a new ID generated
by this system. If historical assignment is requested later, first review a
mapping/dry run, collisions, capacity, legal invoice-number requirements and audit
aliases. Do not overwrite already delivered invoice numbers or reset counters to
make a backfill fit. That migration requires separate approval.

## Provision, deploy and operate

Requires Node 22.18+ (native TypeScript policy import) and PostgreSQL. With the
**intended database environment already loaded**:

```sh
node scripts/prepare-business-id-schema.mjs # reviewed additive DDL, no seeds
npx prisma db push
node scripts/setup-business-ids.mjs --apply  # explicit, idempotent, never resets
node scripts/setup-business-ids.mjs         # read-only status/capacity
```

`prisma/business-ids.sql` prepares three tables/five nullable columns, unique indexes
and foreign keys transactionally/idempotently before Prisma synchronization.
This avoids Prisma's generic warning about adding unique nullable columns to
populated legacy tables without using `--accept-data-loss` or destructive flags.
It also supports a fresh database. Counter policies/guards are provisioned only
in the subsequent explicit setup step.

`npm run db:push` also provisions the invariants; its subprocess loads `.env`
only, matching Prisma's default. Export the intended DATABASE_URL explicitly to
override defaults; do not assume `.env.local`/`.env.production` precedence is the
same in every CLI. Dedicated scripts: `db:business-ids`, `db:business-ids:status`.

Both VPS setup/update scripts provision after Prisma schema application and before
building/starting the new code. Back up the database first, inspect the additive
diff, retain the previous build, and follow dev → test → production promotion.
A missing counter fails closed with an administrator-facing setup message.
Never lazily recreate/reset numbering when the app starts or a row is missing.

Every status report gives remaining capacity and an attention flag at the final
10% (minimum 10 slots). These finite blocks are **not unlimited**: CS allows 563
new allocations after its seed. Exhaustion stops allocation atomically with a
clear error; no rollover, borrowed range, random fallback or automatic gap usage.
An authorized future expansion requires an explicitly reviewed policy/DB
migration. A DB backup/restore must restore counters and ledger together; status
provisioning detects missing/advanced reservations rather than reseeding them.
Database owners can of course bypass/drop DB objects; ordinary app/admin users
have no counter-edit/reset API.

## Verification and local review

```sh
npm run test:run
# Actual PostgreSQL locks, concurrency, rollback, invariants and exhaustion:
node --env-file=.env --env-file=.env.local scripts/verify-business-ids.mjs
# Adds a mail-disabled local production preview on 4317 and browser regressions:
node --env-file=.env --env-file=.env.local scripts/verify-business-ids.mjs --browser
```

The harness refuses non-local/live configuration, creates uniquely named isolated
QA schemas, and drops them in `finally`. It never resets/consumes real application
counters. Default tests skip the real-DB suite; a dedicated CI job runs it against
a temporary PostgreSQL service. The browser pass tests real client creation,
exact initial/sequential IDs, two simultaneous authenticated administrators,
forged references, immutable issued references, ownership, PDF generation and
1440/320px layouts. Existing project/payment/PDF workflows run in the same isolated
preview. Tests send no real emails and make no payments/provider requests.
RSC action streams may outlive committed navigation: QA waits for response headers,
committed redirect and DB assertions, not an indefinitely open response stream.

Evidence: `tmp/business-ids/` and `/tmp/savo-business-id-*.log`. These checks use
isolated local/CI schemas and never consume production references. Deployment
requires an explicitly authorized, backed-up release through `docs/WORKFLOW.md`;
initialize production policy only as part of that release, never through QA.
