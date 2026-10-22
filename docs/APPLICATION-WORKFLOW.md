# Application detail: contact and recruitment workflow

## Scope

The candidate detail at `/admin/hr-portal/applications/[id]` now groups management controls in a **top-right Manage application panel**, alongside the candidate facts. On smaller screens the panel stacks above the details. The legacy career detail under `/admin/enquiries/[id]` uses the same controls. Sales enquiry details retain their existing workflow.

This extends the established admin interface without changing its identity, public application form, permission grants or database schema. It needs **no additional migration** beyond the earlier admin-portal release prerequisites.

## Three independent states

| State | Meaning | What changes it |
| --- | --- | --- |
| Contact outcome | What happened when HR tried to reach the applicant | Update contact outcome |
| Recruitment stage | The hiring team's decision/progress | Confirmed recruitment actions |
| Inbox state | Read/handling/closed/archive management | Opening a new application or Manage inbox / archive |

Opening an application is not shortlisting. **Not interested is the applicant's response, not a hiring rejection.** Saving a contact outcome does not send mail, change the hiring stage, close an application or archive it.

### Contact outcomes

- **Not recorded** — truthful fallback for older records without contact history; not selectable as a fabricated interaction.
- **Not contacted** — HR explicitly records that outreach has not happened yet.
- **Contacted** — an actual conversation or message exchange.
- **Not responded** — an attempt was made, without a response.
- **Not interested** — the candidate declined to proceed; a visible warning asks HR to confirm renewed interest before progressing/sending recruitment emails.
- **Callback requested** — requires a future date/time in **IST**, with optional contact method and note.

The callback instant is stored in UTC and displayed/edited as IST independently of browser/server timezone. Calendar rollovers/invalid dates and past callbacks are rejected. Callback due/overdue is shown when the page is rendered/refreshed; this is **not an automatic reminder or outbound-call service**. Changing to another outcome clears the current callback, while the previous request remains in history.

Phone, email, WhatsApp or other can be recorded as the contact method; choosing a method does not send a message. Call/email links open the user's corresponding app and do not automatically claim a successful contact.

The latest outcome, callback and note are visible in Contact & follow-up. Every successful update also creates an attributed, dated activity entry with the previous/new outcome, method, note and callback. Candidate lists expose the outcome and callback, and **Contact outcome** filtering applies in SQL before counts and pagination. Combined filters, page/size and local-only return links are retained.

## Recruitment controls

All relevant controls stay in the same management panel. Unavailable steps remain visible but disabled, with stage-specific guidance; the server enforces the same rules.

| Current stage | Available recruitment actions |
| --- | --- |
| New application | Shortlist, reject |
| Shortlisted | Schedule interview, request documents, reject, reset |
| Interview scheduled | Reschedule, request documents, mark hired, reject, reset |
| Hired | Reset if explicitly correcting the pipeline; complete offers/onboarding separately |
| Rejected | Shortlist again, reset |
| Archived inbox | Restore inbox first |

An older record whose **career stage itself** is `archived` can be reset after its inbox has been restored. Reset is confirmed, clears the interview slot/link/interviewer, and retains contact history, notes, original answers and HR-confirmed facts. It returns the pipeline to New application while keeping the already-open inbox In progress.

Interview scheduling and rescheduling require a future IST slot, HTTP(S) meeting link and interviewer. Rescheduling replaces the existing slot rather than generating another pipeline record. Document requests retain the existing checklist and seven-day deadline; an email address is required, and requesting documents does not invent a new hiring stage.

### Deliberate email handling

Shortlist, interview/reschedule, reject and hire confirmations have an **Also email the candidate** checkbox. It defaults checked to retain the previous workflow, and can be unchecked to record the decision internally only. Candidates without email can still have internal hiring decisions recorded. Existing already-open forms without the new preference retain their original notification behavior.

A document request is explicitly an email action. Contact updates, profile edits, notes, inbox changes and resets send no candidate email. Activity distinguishes a requested email from an internal-only change, and **does not claim delivery just because a template was requested**.

The existing hire email is an offer template with compensation/joining placeholders. Its confirmation explains this and allows opting out when HR will send a finalized offer separately. Mark hired does **not** create an employee account, finalize compensation, produce a signed offer or automatically onboard anyone. Existing related HR offer/document registers remain accessible below the management panel.

## Other management

- **Edit HR profile** opens the existing independently confirmed location/role/experience editor, preserving submitted answers.
- **Edit internal notes** opens the notes editor; the document body displays the current notes read-only instead of scattering another save button down the page.
- **Inbox & more** contains inbox/archive/restore management, confirmed reset, and administrator-only confirmed permanent deletion. HR-only editors cannot delete. Deletion returns to the validated, preserved HR list; existing audit retention is unchanged.
- Resume/portfolio/meeting links stay beside the corresponding candidate facts as resource links, rather than mixing them with hiring decisions.

Dialogs use native modal background isolation plus explicit keyboard boundary wrapping, Escape handling, initial editable-field focus, focus restoration, body scroll locking and pending submit feedback. Forms use the existing inline validation engine; short viewports scroll inside a bounded dialog. Duplicate header email controls and candidate user-agent noise were removed.

## Storage, authorization and concurrency

`form_data.hrContact` stores only the latest reviewed contact outcome. Original application fields and `hrProfile` remain separate; both HR metadata objects are excluded from the **Original application · submitted answers** disclosure.

Every career/contact/profile action independently checks the HR or legacy enquiry grant and canonical career category. Recruitment transitions are server-enforced, not just hidden buttons. Contact/profile/pipeline writes compare `updatedAt` and commit their audit entry in the same transaction; a stale or racing update has no success audit or email side effect. All current detail forms carry a revision. Inbox, notes and admin deletion also honor it, retaining compatibility with already-open older forms. Filter return paths are normalized against the existing local allowlist.

No new schema columns, grants, public JSON directory fields or browser storage of applicant notes were introduced. Real applications were not used as mutation fixtures.

## Verification

- Typecheck, ESLint and production build passed.
- **1,890 tests passed, 16 skipped** across 117 test files (116 passed, 1 skipped).
- **53 dedicated browser checks** in `scripts/verify-application-detail.mjs`: top-right placement; all contact outcomes; callback validation/IST persistence; native-modal focus entry, keyboard boundaries and Escape restoration; original/reviewed data preservation; contact filters; shortlist, schedule/reschedule, document request, hire, reject, reset, archive/restore, internal notes, two-reviewer stale saves, admin-only confirmed deletion and retained list context.
- Prior HR/application browser regression: **44 checks passed**. Admin portal/register regression: **49 checks passed**. The scripts were updated only where profile/notes editing now opens from the management panel.
- Dedicated screenshots: `.impeccable/review/application-detail/` — initial/scheduled desktop views, full-page 390px detail, desktop interview dialog, and 390/320px callback dialogs. At 320px the modal is intentionally internally scrollable, not truncated application content.
- One scoped detector pass: **2 existing-type-ramp advisories, zero non-advisory findings**; no global typography rewrite.
- All browser mutations used disposable localhost candidates/operators/sessions; cleanup is in `finally`. Mail delivery was disabled in the server and scripts. Actual external email delivery, physical devices/IME, automated reminders and a whole-site accessibility certification are not claimed.
- Review/documentation were performed inline because this harness has no independent reviewer tool.
- Local production preview: `http://localhost:4340`. **No production deployment or production database change.**

```sh
npm run typecheck
npm run lint
npm run test:run
npm run build
MAIL_DELIVERY_MODE=off npm run start -- -p 4340
MAIL_DELIVERY_MODE=off BASE_URL=http://localhost:4340 \
  node --env-file=.env --env-file=.env.local scripts/verify-application-detail.mjs
```

Initial validation found a real native-dialog Tab-boundary gap, corrected with explicit boundary wrapping. A script-only storage access in opaque frames and the older regression script's inline-notes locator were corrected separately; these were harness issues, not applicant-data defects. Final runs pass with fixtures cleaned and no browser page errors.
