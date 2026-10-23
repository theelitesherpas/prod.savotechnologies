# HR review queues, compact filters and location suggestions

## Scope

Owner-requested follow-up to v7.11.0: remove repeated location instructions, prefer common cities, distinguish viewed/unviewed applications, remove redundant HR shortcut panels, collapse filters, and select multiple locations/skills. These changes are **local and verified, not deployed**. No schema migration or existing-record backfill is needed.

## List first, filters when needed

The HR recruitment overview, applications list, interviews and legacy career inbox share the same candidate workspace. The redundant **Manage HR Portal · … sections** block and redundant overview/all-applications header links are removed; the sidebar remains the navigation authority.

- Filters start collapsed, with a chevron and applied-group count. Applying filters collapses the panel so the results are visible.
- All / Not viewed / Viewed controls remain visible, with counts respecting the current recruitment/search/qualification filters.
- Recruitment-stage counts moved into the stage selector, rather than another row of shortcut chips.
- Chosen filters remain visible as concise result chips. Filters and controls remount when URL criteria change, fixing stale uncontrolled values when switching, for example, from recruitment to Interview schedule.
- The user's 3412×1832 Retina screenshot is represented by a 1706×916 CSS-pixel check. The candidate rows are now visible in that first viewport, rather than below the expanded shortcuts/filters.

## Multiple locations and skills

Expand Filters to use searchable checkbox groups for **Current cities**, **Hometowns** and **Skills**. These show actual values recorded in authorized career applications, not inferred qualifications or a forced India-only HR catalog.

- Any checked city matches; any checked hometown matches. The two groups combine with AND, as do role, experience, stage, contact outcome and view status.
- **Any selected skill** matches at least one checked skill. **All selected skills** requires every checked skill. Skill comparison is trimmed, case-insensitive and exact to the recorded skill label.
- Skills stored as arrays and legacy comma-separated strings are supported; malformed objects/non-string array members are not treated as skill names.
- Location matching retains the previous case-insensitive partial-text behavior. Not provided matches missing locations without substituting current city for hometown.
- Each group supports up to 20 selections, selected chips/removal and Clear. Searches cover the complete available options; only 40 matching choices render at once. Hidden selections still submit, and Enter in option-search fields does not accidentally apply the form.
- Obvious numeric-only/email/URL entries are not offered as normal location suggestions, unless already selected by a legacy URL. This is picker hygiene, not a location-verification claim, and does not rewrite or hide the underlying application.
- Repeated query parameters preserve all checked values and the any/all rule through pagination and validated return links. Old single-city URLs still work. SQL filters all groups before counting/paging; no in-page filtering or arbitrary 250-option truncation.

## Shared viewed state

Not viewed corresponds to the existing team inbox's New state. Other inbox states represent previously opened/handled items, retaining the prior workflow without inventing historical view timestamps or viewers. Read state is shared across the team, not per operator, and remains independent of the hiring stage and contact outcome.

Unread rows/cards have a subtle existing-accent tint, bold name, visible dot and **Not viewed** label. Viewed rows return to the normal surface/weight and say **Viewed**; meaning is not conveyed by color alone.

Career details no longer mutate their read state during a server GET. After a visible, JavaScript-enabled detail actually mounts, an authenticated Server Action conditionally changes only `status: new → in_progress` and creates an attributed `enquiry.viewed` audit entry in the same transaction. Duplicate/concurrent opens have no second transition/audit. Prefetching, hovering or fetching HTML does not count as a view. Management controls wait for this transition so their revision fields cannot be stale on arrival; failures have an explicit retry.

Candidate/search links disable prefetch. Server revalidation refreshes the team inbox, and lists refresh on tab focus/back navigation without polling or storing candidate information in the browser. Other users see the shared state on the next refreshed read; no real-time push guarantee is made.

**Inbox & more → Mark as not viewed** intentionally returns an application to New, preserves hiring/contact/original data and existing audit history, then returns to the validated filtered list instead of immediately reopening/marking it viewed again. Archived items must be restored first. Selecting New from HR inbox management similarly returns to the list.

View changes send no email and do not shortlist/contact/reject candidates. Existing authorization/category checks remain mandatory for the list and mutations. No per-user read receipts, fabricated historical dates or new database columns are introduced.

## Public application and local directory

The duplicate “City/town directory: … Download directory …” paragraph is removed. Both fields now have one short **11px** helper: **Search by city or state, or enter it manually.** The scoped selector overrides the older general paragraph rule; it does not shrink other form copy.

Empty searches show owner-curated shortcuts starting **Indore, Delhi, Pune, Bengaluru**, then nearby Bhopal/Ujjain/Dewas and other common cities. Search relevance still wins over shortcut order, renamed-city aliases work, and all 4,328 entries across 36 states/territories remain searchable. Nothing is preselected and no applicant location is inferred. This is a convenience order, not an official population ranking.

The directory was already hosted locally. It now uses a pinned versioned URL with a one-year immutable browser-cache header, shared lazy loading between both fields, and a reusable normalized in-memory search index. Unversioned downloads are not marked immutable. Update `INDIA_CITY_DIRECTORY_VERSION` whenever the extracted data changes. There is no new third-party query service, localStorage copy or persistence of applicants' typed locations.

Required ODbL attribution is retained on `/data-sources#india-cities`, linked by a small **City data credits** link inside the dropdown, not a paragraph under the fields. Source, license and extracted JSON download remain available. The link/manual fallback are keyboard reachable; the credits page reuses the incumbent legal reading styles.

## Verification

- Typecheck, lint and production build passed.
- **1,909 tests passed, 16 skipped** (117 passed test files / 1 skipped).
- **38 focused browser checks** in `scripts/verify-candidate-viewed.mjs`: collapsed filters/list placement; unread tint/weight/labels; GET/prefetch and hover safety; actual view mutation/original-data preservation; idempotence; second-user shared state; return-to-unread; multi-city/skill any/all counts and numbered URLs; menu/filter synchronization; reduced helper; preferred city order; one shared directory fetch/cache header; keyboard fallback/credit access; responsive overflow.
- Regressions: **44 HR/application**, **49 admin/register**, **53 application-workflow** browser checks passed. Total across four scripts: **184** checks. Local disposable fixtures are cleaned in `finally`; mail is disabled. Public submissions/CAPTCHA delivery are not exercised as real applications.
- Nine private captures in `.impeccable/review/candidate-viewed/`: default desktop, user 1706px, mobile list, expanded selections, focused mobile city picker, application top at 390/320, desktop application and relocated credits. Public mobile overview shots are viewport captures, not claims to show the entire long form.
- One scoped detector pass: **12 advisories, zero non-advisory findings**. The owner-requested smaller helper and incumbent typography are retained; no global token rewrite.
- Review/documentation were performed inline; no independent review, physical-device/IME or whole-site accessibility certification is claimed.
- Local preview: `http://localhost:4340/admin/hr-portal/applications`. Production still serves v7.11.0 until separately promoted.
