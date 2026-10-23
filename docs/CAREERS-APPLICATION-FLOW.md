# Careers: direct applications

Prepared for v7.12.0 promotion. Deployment is verified separately; source QA is not a live-release confirmation.

## Job directory

Each published managed job has its own **Apply now** link to `/careers/apply?role=<slug>`. Its native **Role details** disclosure expands in the same entry, not below a separate role selector. Team filters remain. Every job and application link also works without JavaScript; submission still requires JavaScript or contacting HR.

The application form is only on the separate application route. The chosen published title is selected, and role-keyed remounting prevents stale selection on route changes. A bare apply URL selects General application. Unavailable/unknown job URLs explain the problem and offer current openings or a general application; they never silently select a different vacancy. **Back to jobs** returns directly to the openings section using native document navigation, avoiding a duplicated-fragment client-navigation behavior observed during QA.

On phones the guide sidebar no longer precedes the form. HR remains reachable through a compact email link below it. A one-column `minmax(0,1fr)` form grid and shrinkable fieldsets prevent long role selections clipping the narrow canvas.

## Shorter help

- Both location menus say **Popular cities**, without “Indore first”. The preferred ordering and full cached India directory are unchanged.
- Resume guidance: **Use “Anyone with the link can view” access.** This is an instruction, not a certification of external file permissions.
- The existing 11px location helper, manual entry and ODbL credits remain.

## Verification

- Typecheck, lint, production build: passed. **1,913 tests passed; 16 skipped.**
- `scripts/verify-careers-flow.mjs`: **93 public GET-only checks**, at 1440/768/390/320px, including distinct per-job links, first/last-job application preselection, native inline details, filters, back navigation, no-JS behavior, unavailable roles, city heading/order/help and short sharing instructions. Narrow form controls fit; the first personal field is above the 900px viewport fold. All analytics POSTs are intercepted; no real submissions, messages or email.
- HR/view queues **38**, HR/application **44**, admin/register **49**, application workflow **53** browser regressions passed again; disposable local fixtures cleaned. **277 combined browser checks.**
- Private screenshots/report: `.impeccable/review/careers-flow/`. Review/documentation performed inline, not independently. No new raster assets.
- No schema migration, data backfill, public role changes, application record changes or mail configuration changes are required. Existing intake validation, consent, CAPTCHA, attribution and receipts remain.

Physical devices/software keyboards, external resume-sharing permissions and actual production application/email delivery are not certified by these checks.
