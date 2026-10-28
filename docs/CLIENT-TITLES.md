# Optional client titles

Admin → Client directory → New client / Edit client includes an optional native **Title** selector: **No title**, **Mr.**, **Mrs.**, **Ms.**, **Dr.** It has no inferred/default honorific. Use only a title explicitly supplied by the client; do not infer gender, marital status or qualifications.

## Storage and validation

- `ClientUser.title` is a nullable, four-character column; `name` remains the original separate full-name field.
- Server validation allowlists the four canonical values. Blank saves `NULL`. New clients and existing rows default to no title.
- Editing an older form that omits `title` preserves a previously saved title. Explicitly choosing **No title** clears it.
- The additive `prisma/client-titles.sql` adds the column and a database check constraint without backfilling titles, rewriting names or renumbering business IDs. The deployment updater applies it before Prisma synchronization; regenerate Prisma Client for this schema.

## Presentation

Shared functions in `src/lib/client-name.ts` provide consistent formatting:

| Stored name | Title | Full record name | Greeting |
| --- | --- | --- | --- |
| James Miller | Mr. | Mr. James Miller | Mr. James |
| James Miller | Dr. | Dr. James Miller | Dr. James |
| James Miller | none | James Miller | James |

Whitespace is normalized for display only. Known legacy prefixes are handled without doubling them; an explicit stored title takes precedence. Avatar initials exclude the honorific. Names are not split/rearranged in storage; greeting form uses the first whitespace-delimited name component as requested, retaining Unicode, apostrophes and hyphens. No cultural/gender inference or surname guessing is performed.

Full-name formatting covers the client directory, project/invoice displays and selectors, related operational records, client workspace identity, billing/PDF output, meeting client pickers and meeting contact/calendar records. Short greetings cover portal welcome, client welcome/password reset, invoice/receipt/reminder, project/milestone notifications, client OTP mail, meeting invitations/availability/confirmation/reschedule messages and the meeting scheduling page. OTP delivery retains all existing security/archive protections.

Linked meetings resolve the client's current stored title when rendered/emailed; the meeting's saved name remains unchanged. Existing unlinked invitations keep their supplied names and recognize already-written supported prefixes. Editing or removing a client title takes effect without rewriting old meetings or regenerating links. Free-form manually written email body text is not silently rewritten.

## Email overrides and manual sends

For client-recipient registry templates:
- `{{name}}` and `{{firstName}}` resolve to the honorific-aware greeting (`Mr. James`).
- `{{fullName}}` resolves to the complete display name (`Mr. James Miller`).
- Values remain HTML-escaped. Untitled names produce `James` / `James Miller` naturally.
- A template-based manual send to a registered client uses their actual current saved name/title, not stale sample name fields in the composer. Recipient permissions are checked before lookup. Other template recipients retain their existing behavior.

## Verification and release scope

Local verification uses synthetic accounts and session fixtures only, with live mail disabled. `scripts/verify-client-titles.mjs` refuses non-loopback origins/databases. It exercises all four title options and clearing through the real admin form, persistence without changing raw names, meeting DTOs and public invitations, portal short/full-name display, actual PDF text and desktop/phone field layout. Fixtures are deleted afterward. Immutable local draft-number reservations are deliberately retained and never recycled.

Evidence: `.impeccable/review/client-titles/`, including desktop/phone edit captures, an invoice PDF and a 35-check browser/database report. The new field passes the tested accessibility rules. A broader initial scan found inherited contrast issues in the existing save/reset buttons; this small field change does not claim whole-admin accessibility compliance or modify that unrelated styling. Review was performed inline, not independently. The mechanical field/page detector reported zero findings.

Full suite: 2,077 passed / 16 skipped; lint, typecheck and production build passed. The local development and production-preview servers are restarted against the current generated Prisma Client/build rather than serving stale artifacts.

The schema was applied to localhost for development. No production schema, real client record or real-recipient email was changed during this feature's implementation. Publish only through the documented dev → test → production workflow and take the usual database/build backup first.
