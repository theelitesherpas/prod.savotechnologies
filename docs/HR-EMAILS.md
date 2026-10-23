# HR application email restoration

Prepared for v7.12.2 promotion. Production activation and SMTP readiness are verified separately; source tests alone do not confirm live delivery.

## Previously paused

Release v7.4.2 removed the automatic `teamApplication` notification to HR from new career submissions. It retained candidate `applicationAck` confirmations, explicit recruitment/employee email actions and manual HR compose/templates. No other HR-specific pause was found in the mail policy or release history.

## Restoration

After a valid new career application is successfully stored, `/api/enquiries` requests:

- The existing `applicationAck` confirmation to the candidate.
- The existing `teamApplication` notification to trimmed `HR_EMAIL`, defaulting to `hr@savotechnologies.com` when unset/blank. The existing registered HR template and HR SMTP department are used.

The notification retains the previous name, email, role, experience, work-link and application-message fields. No historical record is queried or replayed; existing applications are not resent. Validation, CAPTCHA, honeypots, failed storage and non-career submissions do not trigger HR application notifications.

Other HR emails remain tied to their existing explicit workflow actions. Candidate-email opt-outs and recipient suppression are not overridden. No unsolicited broadcast, hiring decision or automatic offer is triggered by this restoration. Client/finance notifications are unchanged.

Live delivery still requires the existing production-only mail policy and configured SMTP. Development/previews must remain mail-off. No environment secrets, templates, recipient suppression or database schema are changed by this patch.

## Verification

Lint, typecheck, production build and **1,918 tests passed / 16 skipped**. Persistence and mail are mocked in the API regressions. Coverage includes candidate plus HR sends, configured/blank HR destination, failed-storage prevention, invalid/honeypot submissions and non-career isolation. No real email or production application was sent during verification.

Before activating: check the effective production mail policy/HR transport without exposing credentials, and deploy through the established backed-up dev → test → production workflow. Do not backfill old emails or submit a real candidate application for a smoke test.
