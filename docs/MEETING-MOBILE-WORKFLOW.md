# Mobile-first meeting date and time selection

Prepared for deployment with the pending owner OG-image update. Source QA does not by itself confirm production activation.

## Customer flow

The owner asked to restore the earlier large offered-date choices and distinct alternative-date path. The compact header now identifies the actual meeting, greeting, type, duration and IST timezone instead of placing a long marketing opening and two full summaries before the task.

1. **Choose a date:** three-column calendar-style native radio choices show weekday, large day number, month/year and an explicit selected check. Dates with no remaining start times are disabled and say **No times left**.
2. **Choose another date:** a separate dashed native radio choice expands the calendar input inline. Switching into it clears the previous date/time. The field is hidden and disabled until selected; if no offered dates remain and suggestions are permitted, it opens directly. Admin `allowSuggest=false` remains authoritative.
3. **Choose a time:** choices appear for the selected day, whose full date is repeated immediately above them. AM/before-noon and PM/noon-onwards groups make the time period explicit. All times remain IST (India, UTC+5:30). Changing the date clears the old time.
4. **Review date & time:** an inline selection summary and exact review/edit screen precede the existing Send availability action. A preference/receipt is not falsely presented as a confirmed booking; actual recorded invitation status remains authoritative.

Native radio keyboard behavior is retained. Selecting the alternative does not forcibly move focus away from its radio; Tab reaches the calendar field. Validation explicitly focuses that calendar when it is the missing choice. No modal, third-party calendar, draft storage or new scheduling provider.

## Responsive hierarchy

- Phones/tablets: invitation information is behind **View meeting details**, above the date choices, closed initially. Offered dates are in the first 900px viewport at 390px and 320px widths for the tested invitation. This is a tested example, not a guarantee for arbitrarily long meeting subjects.
- Desktop: scheduling is left; full invitation context is a sticky right sidebar. Compact-header/workspace rail caps at 1120px; terminal/status views retain the existing 1280px rail. Narrow sidebar facts stack labels/values rather than squeezing long links into a small value column.
- Contact details remain available through native disclosure; title/type/duration/location/reference/agenda/client identity/company/contacts are preserved. Unique IDs distinguish the responsive context copies.
- Large date targets are at least 116px on phones, with 36px day figures; desktop day figures are 42px and targets at least 128px. Start-time targets stay at least 48px. Existing Outfit/Inter, white/grey/black surfaces and red actions/focus are retained.

## Unchanged rules and boundaries

The public token service, `/api/meeting/submit`, supported payload fields, permission/privacy and expiry behavior are unchanged. IST, admin dates/window, end-exclusive 30-minute starts and the greater-than-30-minute advance buffer remain. Missing phone/address and optional email/notes retain original validation and contact-record limitations. Notes plus added contact information must fit within 2,000 characters without silent truncation.

Clock refresh, review/send revalidation, HTTP-success-plus-ok checks, synchronous duplicate guard, error recovery, cancelled/completed/confirmed/pending/reschedule states, safe confirmed meeting links and no-JS email recovery remain. No genuine meeting was confirmed/rescheduled or emailed during QA. No schema migration or production fixture is required.

## Verification

- Lint, typecheck and production build passed; **1,958 tests passed / 16 skipped**.
- `scripts/verify-meeting-mobile.mjs`: **111 browser assertions** at 1440/768/390/320, with Los Angeles/Tokyo timezone probes, native keyboard navigation, offered/custom selection, date/time reset, review/edit/note preservation, focused validation, HTTP/network failures, duplicate-send prevention, missing-contact validation, no-offer/fixed/expired/confirmed/reschedule/no-JS states and responsive screenshots.
- Disposable clearly synthetic meetings were created only in the guarded local database and deleted in finally (including cascaded fixture activity). All submission/analytics requests were intercepted; mail off. Receipts in screenshots are mocked UI journeys, not actual backend bookings.
- **250 social-artwork regression assertions** passed again; generic meeting OG/Twitter and token-free metadata are retained.
- Private source backups/logs: `tmp/meeting-mobile/`; captures/report: `.impeccable/review/meeting-mobile/`. One batched inspection plus one confirmation; the only visual correction stacked the narrow sidebar facts. Test-harness timing, attribute-order and disabled-fieldset checks were corrected separately without additional design iterations.
- One detector pass: **92 advisory findings, no non-advisory findings**. Existing pinned typography/field geometry retained. Inline finishing review/documentation, not independent sign-off.

Actual production invitation submissions, calendar/provider/email delivery, optional backend auto-confirm end-to-end behavior and physical-device/native-picker/software-keyboard testing are outside these checks. Do not open or submit genuine customer meetings for deployment verification.
