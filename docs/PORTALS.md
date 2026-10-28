# Savo portal access

## Admin organization

The admin console groups recruitment under HR Portal, client relationships/delivery/billing under Client Portal, and employment operations under Employee Portal. Sixteen new admin-only operational registers require the additive SQL in `prisma/admin-portals.sql` before deployment. See **[ADMIN-PORTALS.md](ADMIN-PORTALS.md)** for menu ownership/order, record fields, permission boundaries, migration and verification. Public frontend portal functionality is unchanged.

## Surfaces

- Client entrance: `/portal`; workspace: dashboard, projects, project details and invoices.
- Employee entrance: `/employee-portal`; employee-owned employment/leave/authored-content dashboard.
- Both entrances share `src/components/portal/entrance.tsx`, explicit portal switching and `login-fields.tsx`. The current owner-reference layout places the form left and a Savo-red, labelled workspace illustration right; the previous desk photograph is no longer used here.
- Password and registered-email OTP sign-in, remember-device lifetimes, persistent abuse limits, additive schema and deployment prerequisites are documented in **[PORTAL-LOGIN.md](PORTAL-LOGIN.md)**. This supersedes earlier password-only entrance notes below, not independent workspace ownership checks.
- `site-chrome.tsx` provides focused access chrome and prevents marketing form providers/assistant from mounting on portal routes. Other website routes retain their original provider hierarchy.
- Scoped visual authority: the current portal override in `DESIGN.md`. No new fonts or runtime dependencies.

## Budgeted delivery and invoice completion

Admin projects now include a fixed currency/budget, exactly allocated base
milestones, required description/estimate and separate additional paid work.
Client project pages expose agreed costs, delivery progress and additional scope.
Progress follows done module costs; full-payment completion is reconciled against
the entire agreed project total, not just a paid first invoice. Manual completion/
cancellation and payment-completion reversals retain their distinct rules.
See `docs/PROJECTS.md` for schema, ownership, atomicity and notification contracts.
This extension requires the additive project/invoice schema before starting the
updated application; back up production first and follow `docs/WORKFLOW.md`.

## Business identification

New client/project/invoice records use separate STPL CS/PR/IN references. IDs are
reserved and shown in full before creation, with Copy ID; saving retains the
same ID. Reservations remain read-only; the client's own CS reference is shown
in their workspace and PDFs. Original database keys/ownership checks and employee
IDs are unchanged. Legacy issued references remain intact. Business references
are predictable, never authentication or public-receipt tokens. Before deployment,
apply the reviewed additive SQL and initialize policy/guards without resetting
counters; see `docs/BUSINESS-IDS.md`.

## CAPTCHA: a release prerequisite

Client and employee sign-in **require Google reCAPTCHA v2 checkbox verification from the first attempt**, enforced server-side before credential processing. Missing/rejected tokens, partial configuration and missing configuration cannot silently bypass verification. Admin retains its previous progressive-attempt policy; other public forms keep their existing configuration policy.

Configure both `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` and `RECAPTCHA_SECRET_KEY`. The public key is frozen at build time: rebuild when it changes. Add the real deployment hostname to the Google key's allowed domains. Keep the secret in server environment settings, never browser code or a commit.

**Do not deploy Google's public testing pair.** Localhost currently uses that official pair for preview and automated integration checks. Its testing notice is intentionally visible; passing these checks is not evidence of real-world bot resistance. Real production keys must be supplied and verified before publication.

Both forms retain visible labels, password-manager autocomplete, show/hide password, pending/disabled feedback, focused error summaries and real account-help links. Native compact CAPTCHA is used when an access form has less than 304px width. Verification expiration clears the token; status failure shows human recovery and disables sign-in. No-JS cannot solve CAPTCHA; the existing human help path remains available.

## Preserve the security boundaries

- Client pages independently validate the current client and query by its ID. Private drafts stay excluded; interactive record DTOs remain allowlisted.
- Employee dashboard preserves expiration, active-employment and linked-panel-user checks, querying authored content by that employee's ID.
- The public frontend portals still introduce no self-service HR edits, leave-request submission, support inbox or account-reset capability. The new admin-only operational registers are separate from these public surfaces; see `docs/ADMIN-PORTALS.md`. Authorized invoice extensions add real PDF download/native printing and optional trusted-provider **Pay now** links. Status changes still require confirmed admin recording; see `docs/INVOICES.md`.
- Existing admin access permissions do not change. Current portal sign-in paths share the password/OTP service and database-backed limits; unchecked remember is a 12-hour browser session, explicit remember is a fixed 30 days. See [PORTAL-LOGIN.md](PORTAL-LOGIN.md).

## Verification

```sh
npm run typecheck
npm run lint
npm run test:run
npm run build
# Start local production preview with mail delivery disabled:
MAIL_DELIVERY_MODE=off npm run start -- -p 4326
# AXE_PATH must point to an installed axe-core browser bundle:
AXE_PATH=/path/to/axe.min.js node --env-file=.env --env-file=.env.local scripts/verify-portal.mjs
AXE_PATH=/path/to/axe.min.js node --env-file=.env --env-file=.env.local scripts/verify-employee-portal.mjs
```

Browser scripts permit only localhost origins/databases and Google's official testing pair. They create labeled synthetic records, verify real local sign-in/provider test-token handling, ownership, responsive layout and recovery, then delete fixtures in `finally`. They do not automate real CAPTCHA challenges or send real credentials/email. `REUSE_ENTRANCE_CAPTURES=1` preserves already-inspected entrance evidence while continuing functional checks; default runs cover all widths.

Invoice PDF verification (local fixtures only, no mail):

```sh
BASE_URL=http://localhost:3000 node --env-file=.env --env-file=.env.local scripts/verify-invoice-downloads.mjs
# Also disable mail in the local server. Generates email review fixtures first:
npx vitest run tests/payment-links.test.tsx
MAIL_DELIVERY_MODE=off node --env-file=.env --env-file=.env.local scripts/verify-payment-links.mjs
```

This covers PDF downloads/inline printing, drafts/foreign invoice exclusion,
expired/inactive sessions, real browser downloads and 1440/390/320px controls.
Synthetic clients and invoices are deleted in `finally`. Payment-link checks additionally
cover actual admin forms, trusted-host validation, changed-term reconfirmation,
client ownership, external navigation without making a real provider request,
HTML/plain-text email actions, blank/removal/non-payable states and financial
project completion. Payment screenshots/PDFs/report: `tmp/payment-links/`.

Current entrance evidence and deployment instructions are in [PORTAL-LOGIN.md](PORTAL-LOGIN.md), including both methods at desktop/mobile sizes. The following is historical workspace evidence, not the current entrance release: `.impeccable/review/portal-v2/` and `.impeccable/review/employee-portal/`. Desktop/mobile and 320/390/768/1440 captures are available. Final functional continuations passed 130 client and 42 employee assertions, with earlier four-width entrance scans/captures retained. Unit suite: 96 files / 1,370 tests; lint, typecheck and production build passed. Axe scans cover client main-task surfaces and employee body/chrome; third-party CAPTCHA frame internals and whole-site compliance are not certified.

Initial verification found an inline-size containment shrink defect and a broad CAPTCHA iframe locator; the single UI correction widened the form and removed hidden marketing widgets from access routes. A later harness timeout incorrectly waited for a hidden token input to be visible; scripts now wait for attachment. That correction required no app change or rebuild. Finish review/documentation were inline, not independent. Local preview only: no production deployment, physical-device certification or performance profiling.
