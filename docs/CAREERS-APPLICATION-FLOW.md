# Careers: direct applications

Public application routing shipped in v7.12.0. The compact board follow-up is prepared for v7.12.1 promotion; deployment is verified separately from source QA.

## Job directory

Each published managed job has its own **Apply now** link to `/careers/apply?role=<slug>`. The owner rejected the tall per-job blocks. A compact board now uses a desktop team sidebar, counted team controls, aligned title/focus/experience/outlined Apply rows, and a separate native Details toggle. Descriptions, dates and responsibilities are inside closed disclosures, grouped to allow one expanded role at a time in supporting browsers. Older native implementations can open multiple roles without losing content. On phones filters form a two-by-two grid and experience stacks below each title; General application follows the directory rather than delaying the first result. Every job and application link also works without JavaScript; submission still requires JavaScript or contacting HR.

The application form is only on the separate application route. The chosen published title is selected, and role-keyed remounting prevents stale selection on route changes. A bare apply URL selects General application. Unavailable/unknown job URLs explain the problem and offer current openings or a general application; they never silently select a different vacancy. **Back to jobs** returns directly to the openings section using native document navigation, avoiding a duplicated-fragment client-navigation behavior observed during QA.

On phones the guide sidebar no longer precedes the form. HR remains reachable through a compact email link below it. A one-column `minmax(0,1fr)` form grid and shrinkable fieldsets prevent long role selections clipping the narrow canvas.

## Shorter help

- Both location menus say **Popular cities**, without “Indore first”. The preferred ordering and full cached India directory are unchanged.
- Resume guidance: **Use “Anyone with the link can view” access.** This is an instruction, not a certification of external file permissions.
- The existing 11px location helper, manual entry and ODbL credits remain.

## Verification

- Typecheck, lint, production build: passed. **1,915 tests passed; 16 skipped.**
- `scripts/verify-careers-flow.mjs`: **109 public GET-only checks**, at 1440/768/390/320px, including compact row-height bounds, initially closed/exclusive native details, independently available Apply links, distinct per-job destinations, first/last-job preselection, filters, back navigation, no-JS behavior, unavailable roles, city heading/order/help and short sharing instructions. Separate desktop/phone keyboard probes confirmed Enter activation and exclusive native expansion. Narrow form controls fit; the first personal field is above the 900px viewport fold. All analytics POSTs are intercepted; no real submissions, messages or email.
- HR/view queues **38**, HR/application **44**, admin/register **49**, application workflow **53** browser regressions passed again; disposable local fixtures cleaned. **277 combined browser checks.**
- Private screenshots/report: `.impeccable/review/careers-compact/`. Desktop rows averaged 81.5px versus 339.3px in the read-only live baseline (about 76% less row height); mobile rows averaged 110.9px. Comparison concerns the listing, not the unchanged shared footer or entire page. The production-only Cloudflare RUM telemetry endpoint is now intercepted/recognized by the verification harness along with existing analytics. Review/documentation performed inline, not independently. No new raster assets.
- No schema migration, data backfill, public role changes, application record changes or mail configuration changes are required. Existing intake validation, consent, CAPTCHA, attribution and receipts remain.

Physical devices/software keyboards, external resume-sharing permissions and actual production application/email delivery are not certified by these checks.
