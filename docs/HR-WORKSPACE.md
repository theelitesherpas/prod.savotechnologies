# HR candidate workspace, application fields and pagination

For the latest **top-right application management panel, contact outcomes, callbacks and standard recruitment workflow**, see [APPLICATION-WORKFLOW.md](APPLICATION-WORKFLOW.md). Its current verification supersedes the initial release counts below.

## Local entry points

- HR recruitment overview: `/admin/hr-portal` (active pipeline by default).
- All applications: `/admin/hr-portal/applications`.
- Interviews: `/admin/hr-portal?tab=scheduled` (legacy link retained).
- Candidate profile: `/admin/hr-portal/applications/[id]`.
- Public application: `/careers/apply?role=general-application`.

Website analytics is now a permission-filtered **direct item immediately after Dashboard**, not an Administration submenu entry.

## Candidate filtering and review

The recruitment overview, interview view and application directory share `CandidateWorkspace` and `getCandidatePage` rather than rendering incompatible lists.

Filters combine on the server **before counting, stage summaries and pagination**:

- Candidate name, email, mobile number or application reference.
- Total-experience band, including Fresher and explicit missing/unrecognized information.
- Current city and hometown, independently, with case-insensitive partial matching.
- Role, including managed role titles retained in application data.
- Recruitment stage: all non-archived candidates, active pipeline, new, shortlisted, interview scheduled, hired, rejected or archived.
- Contact outcome: Not recorded, Not contacted, Contacted, Not responded, Not interested or Callback requested; independent of recruitment stage.
- Newest, oldest, name or interview-date sorting.

Current city is never substituted for hometown. Typing/selecting **Not provided** in a location filter finds missing information. Counts in recruitment shortcuts respect other active filters. Application inbox state and recruitment stage remain distinct; merely opening an application cannot shortlist or hire it.

SQL identifiers/expressions are static and filter values are Prisma parameters. Category restrictions are part of every candidate/options query. All list readers independently check the existing HR or legacy enquiry grant before queries; inconsistent JSON `form` flags cannot expose a sales record through an HR lookup. The shared intake now canonicalizes a validated career application to a career category before saving, even if an inconsistent caller supplied a sales category.

Candidate profiles show role, experience, locations, availability, compensation, employment details, skills, resume/work links and interview context together. Original submitted answers are retained in a disclosure; unrelated sales budget/company/IP fields no longer dominate HR review. The original contact/source record, pipeline decisions, notes, correspondence and activity remain available.

### HR-confirmed details

The **Edit HR profile** action in the top-right Manage application panel can record city, hometown, role and exact experience in whole years/months. Updates write only a nested `form_data.hrProfile`, preserving submitted fields, skill/compensation values and links. No schema migration is needed for this follow-up.

- Blank reviewed fields fall back to the original application.
- Unknown experience is not silently converted to zero. Explicit 0 years/0 months means a confirmed fresher.
- Submitted bands remain bands; confirmed totals show their actual years/months. Confirmed totals are classified with boundaries at 12, 36, 60 and 96 months. Reported legacy `0 to 1 year` is supported without labelling every such applicant a fresher.
- Saving checks career ownership and `updatedAt`, with an atomic mutation/audit transaction. A stale profile cannot overwrite another edit. Contact/profile/pipeline changes use the same revision/audit boundary; contact outcomes and optional callback details are stored separately. Audit metadata contains changed field names, not salary/location values.
- Auto-read updates also bind the previously read status/revision, avoiding reopening an application changed by another operator.
- Profile/contact saves send no email. Deliberate pipeline confirmations retain the established email default but now allow an explicit internal-only choice; they use the reviewed role when present.
- Filter/page context is preserved in a validated, local-only `returnTo` link through profile/notes/pipeline actions.
- Interview entry is explicitly interpreted in IST (`+05:30`), independent of the server timezone. Meeting/resume/work URLs must use HTTP(S); opening a link is a deliberate external action.

Existing older applications remain unchanged. Hometown was not previously collected and will show **Not provided** until submitted in a new application or confirmed by HR.

## Public application fields

The application now collects:

- Required mobile number (country-aware entry); required in career API validation as well as the UI. Contact/project enquiries retain their original optional-phone behavior.
- Current city and hometown using the searchable city/town controls.
- Optional current annual CTC, current employer, current designation, expected annual CTC, work preference and LinkedIn profile.
- Existing required role, skills, experience, start availability and consent.
- Existing optional portfolio/GitHub, resume URL and introduction.

Compensation choices include **Not applicable (Fresher)** and **Prefer not to disclose**. CTC is clearly annual INR compensation, not a monthly amount or an offer from Savo. Work preference is not a claim that Savo offers that arrangement for the role.

New clients require hometown before submission. The API allows hometown to be absent for already-open older form versions; a supplied value is still length-validated. Mandatory mobile has no such bypass. Added strings/URLs are bounded, and the existing structured-payload limit, CAPTCHA, rate limits, honeypot, consent and business-reference rules remain in place.

Resume instructions explicitly require a public viewing URL: **“Anyone with the link can view,” not a private or sign-in-only link.** URL format/protocol can be validated, but Drive/Dropbox sharing permissions cannot reliably be certified by the form. The server does not fetch arbitrary resume URLs to test accessibility (avoiding SSRF). Compensation is not added to analytics or acknowledgement-email variables.

The public FAQ and its generated structured data use the same updated required-field and resume-access wording.

## Searchable India city/town directory

`public/data/india-cities.json` contains **4,328 unique city/town + state/territory entries across all 36 Indian states/territories**, extracted from the Countries States Cities Database. Seven duplicate name/state pairs were deduplicated from 4,335 upstream rows. This is the entire available India extract from that source, **not an assertion that every Indian settlement/village is listed**.

- Source commit: `7795d77d6a801543b9bb90d97a182c885f44c458`.
- Source URL, checksum and license are embedded in the distributed JSON.
- ODbL-1.0 license: `public/data/licenses/india-cities-ODbL.txt`.
- The application visibly credits the source and provides both license and machine-readable directory download links.
- Rebuild: `node scripts/build-india-cities.mjs` (pinned source); optionally supply a previously downloaded source JSON path.

The directory loads on first focus, once for both controls; there is no third-party location API call on each keystroke. At most 40 matching suggestions are rendered, but searches cover the full directory. State/territory labels distinguish identical city names, common renamed-city aliases are searchable, and keyboard arrows/Enter/Escape are supported. Suggestions can open above the field when space is limited. Manual entry remains available for missing or overseas locations and when the directory cannot load.

The open directory is separately licensed public data. Applicant names, contact details, salaries and city selections are not added to it or persisted in browser storage.

## Reference-style pagination across admin lists

`Pagination` (server URL-driven lists) and `ClientPager`/`PagedContent` (complete, already-loaded collections) share the owner's reference pattern:

**First → Previous → five consecutive numbered pages → Next → Last**, a distinct active page, disabled edge controls, accurate displayed range/total, 10/25/50/100 per-page choices, and an arbitrary-page **Go** field for long lists. The established Savo admin accent is retained rather than importing the reference's blue identity.

- Server-paged: candidates, client directory, projects, invoices, sales enquiries, audit, bug reports, department mailbox, live-chat conversation inbox, client meeting lists, and all 16 operational registers.
- Client-paged complete collections: content/service/industry/case-study reorder lists; panel users; content inventory; leave requests/history/balances; employee-detail leave history; personal leave/authored-content lists; client-profile projects; candidate replies/activity; project invoices and delivery updates.
- Employee directory slices the fully filtered workforce collection already used for its workforce/leave aggregates; its counts are not calculated from a single displayed page.
- Content reordering still submits the **complete order**, not one page of IDs. Cross-page arrow moves follow the moved item; creation/deletion refreshes cannot strand new rows outside the local order.
- Client/invoice business-ID form refresh keys use complete record counts, not paginated row lengths, so reaching 25 rows cannot leave a consumed reservation in the next creation form.
- Mail search runs against the full department/folder before pagination, including inbox bodies. It is not an in-page search of the first 200 messages. Mail headers distinguish displayed-page counts from unread totals.
- Meetings retain full status summaries; their calendar loads the selected complete month, not just the current list page. Live-chat paging retains view/query context and prevents stale in-flight/bootstrap-timer responses from replacing a newer page.
- Existing bounded dashboard previews, menus, selectors, form checklists and real-time message threads are not artificially split into record-list pages.

Query parameters preserve existing search/filter/client/archive scope. New filters or page-size changes reset to page one; out-of-range/deleted last pages clamp safely. Dense tables scroll locally instead of overflowing the viewport. The sidebar's old width/padding animations were removed to avoid transient mobile overflow and layout animation.

## Verification and release scope (initial HR workspace release)

- Typecheck, ESLint and production build passed.
- Full unit suite: **1,856 passed, 16 skipped** (116 files total).
- **44 HR/application browser checks**: combined server filters, canonical ownership, totals and numbered jumps, precise HR-profile persistence/original-data preservation, safe return context, interviews, mail beyond 200 records, paged meeting/chat APIs, complete calendar month, client/invoice SSR page counts, client-side numbered panel-user pages, analytics menu placement, desktop/mobile forms, India-city keyboard/alias search, mandatory mobile and the added submission payload.
- Existing admin-register regression script: **49 checks passed**, including real CRUD for all 16 new registers and existing permission checks.
- Browser public submissions and CAPTCHA-status checks are explicitly mocked. API validation is separately unit-tested; this is not evidence of real CAPTCHA challenge solving, email delivery or external resume permission verification.
- All controlled admin/client/candidate/mail/meeting/chat/invoice fixtures and their sessions/audit/presence records are deleted in `finally`. Real production accounts and applications are not modified.
- Review evidence: `.impeccable/review/hr-candidates/` (13 screenshots/report; desktop 1440px, mobile 390px and application 320px). The city-picker image is intentionally a viewport capture; other final captures start at document top. Inert off-canvas marketing dialogs are hidden only in screenshot capture styling, not changed in the application.
- One scoped detector pass: **33 design-record advisories, no warnings or severity errors**. Existing/pinned typography/color choices are retained.
- Visual review/documentation were performed inline because this harness has no independent reviewer tool. No physical-device/IME or whole-site accessibility certification is claimed.
- Local preview remains at `http://localhost:4340`. This follow-up requires **no additional database migration**; the earlier admin-register release still needs `prisma/admin-portals.sql` on production. No production deployment was performed.

```sh
npm run typecheck
npm run lint
npm run test:run
npm run build
MAIL_DELIVERY_MODE=off npm run start -- -p 4340
MAIL_DELIVERY_MODE=off BASE_URL=http://localhost:4340 \
  node --env-file=.env --env-file=.env.local scripts/verify-hr-candidates.mjs
```

Initial verification distinguished harness issues from application issues: current skill choices are buttons, not checkboxes; success must be located by its own dialog name; full-page screenshots must begin at document top and hide inert off-canvas overlays. The final run passes without those locator/capture ambiguities. A real transient sidebar-layout overflow and stale mandatory-phone error were corrected before final confirmation. No broad redesign or unrelated marketing content change was made.
