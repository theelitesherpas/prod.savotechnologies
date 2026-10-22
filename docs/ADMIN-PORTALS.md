# Admin portal organization

## Scope

The administration console is organized by department, in this order:
**Dashboard → Website analytics → HR Portal → Client Portal → Employee Portal → Website content → Administration → My profile**.

For the follow-up candidate filters/profile interface, public job-application fields, India city search and reference-style pagination, see **[HR-WORKSPACE.md](HR-WORKSPACE.md)**. The latest candidate-detail management workflow is documented in **[APPLICATION-WORKFLOW.md](APPLICATION-WORKFLOW.md)**. These follow-up verification sections supersede the earlier counts below.

This is an admin-only extension. Public client and employee workspaces, existing account credentials, business IDs, invoice/payment reconciliation and employee leave calculations are unchanged. Existing master records are reused, not copied into new departmental databases.

Navigation definitions and operational module schemas live in `src/lib/admin-portals.ts`. Sidebar items, department directories, related-record shortcuts and section search use this registry. Do not introduce a second hardcoded menu.

## Menu ownership and order

### HR Portal — `/admin/hr-portal`

1. Recruitment pipeline
2. Applications & candidates — `/admin/hr-portal/applications`
3. Interview schedule
4. Job openings — existing careers content editor
5. Hiring requests **(new)**
6. Offers & hiring decisions **(new)**
7. Candidate documents **(new)**
8. HR mailbox
9. Send HR email

Candidate details include the existing contact information, submitted application fields, resume/portfolio references, skills, interview details, internal notes, replies and recruitment activity. Candidate profiles also link to related offers/document registers. The recruitment pipeline and application inbox are paginated server-side; archive/status views remain accessible through the application inbox.

Canonical career categories and explicit legacy full-time/part-time/internship categories own recruitment records. An arbitrary `data.form` or query-string value cannot turn a sales lead into an HR record. Career-prefixed legacy sources are conservatively excluded from sales; records with an invalid category need explicit data review, not automatic reassignment.

### Client Portal — `/admin/client-portal`

1. Overview
2. Client enquiries (project/contact/callback enquiries; separate from recruitment)
3. Live chat (when permitted)
4. Client directory
5. Client contacts **(new)**
6. Proposals & estimates **(new)**
7. Contracts & agreements **(new)**
8. Meetings
9. Projects & milestones
10. Invoices & payments
11. Client documents **(new)**
12. Client support requests **(new)**
13. Client mailbox
14. Send client email

Client profiles link to their operational registers. Existing project budgets, milestones, additional work, delivery updates and invoice/payment history stay in their existing editors. New proposal and support project references are manually entered context, not new project ownership relationships.

### Employee Portal — `/admin/employees`

1. Employee directory
2. Add employee
3. Onboarding **(new)**
4. Employee documents **(new)**
5. Leave management
6. Attendance & timesheets **(new)**
7. Compensation & payroll **(new)**
8. Performance & development **(new)**
9. Assets & access **(new)**
10. Expenses & reimbursements **(new)**
11. Offboarding & clearance **(new)**

Employee profiles remain the employment master and link to these related registers. HR correspondence appears only under HR rather than being duplicated under Employee Portal.

### Shared administration

- Website content retains services, industries, contact-page content, case studies, insights, hire roles, AI services and agents. Job openings are discoverable under HR instead of duplicated here.
- Website analytics is a direct item immediately after Dashboard when permitted. Administration contains site settings, payment-gateway configuration, email templates, panel users/permissions, website errors/reports, audit, proof dashboard and content inventory.
- Website error telemetry is not client support. Client support has its own client-linked register.
- The personal profile remains separate from employee-master management.

## Sixteen new operational registers

All registers have a title, department-specific status, linked subject, responsible owner, start/due dates, internal notes, timestamps, operator identifiers and an optimistic-concurrency version.

| Register | Additional information |
| --- | --- |
| Hiring requests | Department, position, headcount, employment type, location, budget, approver, requirements; candidate link optional |
| Offers | Candidate, position, compensation, proposed joining date, validity, approver, terms |
| Candidate documents | Candidate, category, reference, secure URL, expiry, verifier/date |
| Client contacts | Client, contact name, designation, email, phone, responsibility |
| Proposals | Client, reference, estimate/currency, validity, scope, document URL |
| Contracts | Client, reference/type, signatory, signing/renewal dates, URL, terms |
| Client documents | Client, category, reference, URL, expiry |
| Client support | Client, priority, optional project reference, issue, resolution |
| Onboarding | Employee, task category/checklist, completion date |
| Employee documents | Employee, category, reference, URL, expiry, verifier |
| Attendance | Employee, period, days/hours worked, work mode, summary, reviewer |
| Payroll | Employee, pay period, gross/deductions/net, currency, payment date/reference, approver |
| Performance | Employee, cycle, reviewer, goals, feedback, development plan, next review |
| Assets & access | Employee, equipment/access type, asset tag, condition/access scope, return/revocation date |
| Expenses | Employee, category, amount/currency, expense date, receipt URL, approver, reimbursement reference |
| Offboarding | Employee, clearance category, handover checklist, approver, clearance date |

Each has real persisted create/edit/list/search/status-filter/pagination functionality. Permanent deletion is administrator-only, requires typed `DELETE` and a second button confirmation, and records an audit event. Updates/deletions constrain the database query by **record ID + portal + module + version**. Stale edits cannot overwrite another operator's work. Subject linkage and audit are committed with the mutation in one transaction.

The master selector is capped at 250 records to avoid serializing entire candidate/client/employee databases into forms. To link a person outside that initial selector, open their profile, expand **Related … records**, choose the register, then **Add**; the selected subject is retained even outside the initial 250. Exited employees similarly remain accessible through their own profile and existing links. Deleted masters leave the historical name snapshot and null the foreign key; editing such a record requires an explicit valid relink.

### Deliberate boundaries

- Registers are manual administrative records, not automated HRIS/accounting systems.
- Offer status does not send an offer, legally sign an agreement or create an employee.
- Payroll/expenses do not calculate statutory deductions, disburse funds or initiate payment.
- Attendance does not implement a time clock or modify existing leave balances.
- Offboarding does not change employment status or revoke sessions; use the employee master for those operations.
- Documents are HTTPS references to an access-controlled store, **not uploads**. Do not store government identity numbers, bank credentials, passwords or tokens in notes/URLs.
- Existing candidate pipeline actions still send their established emails; the new register forms do not send email.
- No register is exposed through a public frontend portal or a new public API.

## Permission boundaries

Menu placement never grants data access:

- `hr-portal`: recruitment, candidate details/notes and HR operational registers.
- `clients`: client overview, directory, meetings, projects, invoices and client operational registers.
- `employees`: employee master, leave and employee operational registers, including compensation/payroll. This is a sensitive grant, as employment/CTC access already was.
- `enquiries`: existing sales/legacy enquiry access. Enquiry-only editors retain a separate legacy career-inbox link under HR; they do not gain HR registers.
- `content`: job publishing/content editing, even when the editor is reached through HR navigation.
- `emails`: existing shared-mail read access. Department links filter on the server before fetching, but this grant continues to authorize both departments, including the legacy all-mail view.
- Existing compose grants are preserved: HR mail requires `employees`; client mail requires `clients`; template editing requires `email-templates`. An HR-only recruitment operator can use existing candidate workflow emails but does not silently gain bulk/freeform employee mail access.
- Existing payment-setting step-up verification and administrator-only panel-user rules remain unchanged.

Every new page, shared data reader and server action checks its own permission before querying private data. HR candidate lookups bind the identifier to a career category before reading related audit/reply data. HR-only search is likewise career-scoped. Granting a portal does not grant analytics, content, mailbox reads or another portal.

## Database and deployment — required before production use

New Prisma model: `AdminOperationalRecord`; new table: `admin_operational_records`.

The reviewed additive SQL is **`prisma/admin-portals.sql`**. It creates only the new table, indexes, namespace/date/version checks and nullable foreign keys to existing masters. It does not backfill, rename, delete or rewrite existing client, candidate, employee or financial records.

1. Follow `docs/WORKFLOW.md`, confirm the actual target environment, and take a verified production backup.
2. In the deployment environment, apply the SQL **once**, before starting the updated application:

   ```sh
   npx prisma db execute --file prisma/admin-portals.sql --schema prisma/schema.prisma
   npx prisma generate
   npm run build
   ```

3. Start/restart the updated application through the normal deployment process. Verify all three portal landings, create/edit a controlled record, and review operator permissions.
4. The SQL is transactional and intentionally not silently repeatable: if the table already exists, inspect schema state rather than dropping it or running a reset. Do not use `prisma migrate reset`.
5. Application rollback can leave the additive table in place, unused by the earlier application. Do not drop populated operational registers to roll back navigation.

The SQL was applied **only to local `localhost/savo_v7`**, after a local dump to ignored `tmp/admin-portals/local-before.sql`. **No production SQL or deployment was performed.** If the table/connection is missing, register pages show a setup/retry notice rather than pretending an empty database is valid; existing master workflows are not replaced.

## Verification

```sh
npm run typecheck
npm run lint
npm run test:run
npm run build
# Local-only browser exercise; the server must also have mail delivery disabled:
MAIL_DELIVERY_MODE=off npm run start -- -p 4340
MAIL_DELIVERY_MODE=off BASE_URL=http://localhost:4340 \
  node --env-file=.env --env-file=.env.local scripts/verify-admin-portals.mjs
```

- Typecheck, lint and production build passed.
- Full suite: **1,817 passed, 16 skipped**, including new schema, namespace, permissions, optimistic-concurrency and department-isolation tests.
- Browser verification: **49 passed checks**: actual creation in all 16 registers, edit/version increment, confirmed deletion, foreign-register refusal, HR-only candidate access/notes, cross-portal denials, department-filtered mail, desktop/mobile layouts, 320px form, mobile navigation/Escape, icon-rail expansion and section search. Synthetic fixtures and their audit/session records are removed in `finally`; no mail is delivered.
- Captures/report: `.impeccable/review/admin-portals/`. Existing local recruitment data appears in pipeline screenshots; these are private review artifacts, not public examples.
- The local verifier required corrections for a noncanonical synthetic category, an SSE-incompatible `networkidle` wait, a broad search locator and an initialization script running inside a sandboxed mail iframe. The employee-table viewport overflow found during verification was fixed with shrinkable grid children and table-local scrolling.
- One detector pass: 35 findings, **no severity errors**; two inherited warnings (rail-width animation and unread-enquiry side border) and 33 inherited admin-type-ramp advisories. These are not newly adopted global design rules.
- Visual review was performed inline (no independent reviewer tool available), preserving the existing NextAdmin-style console. No public visual identity change, production deployment, physical-device verification or whole-site accessibility certification is claimed.
