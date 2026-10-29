# Client and HR email composer

Both `/admin/email-compose?dept=hello` and `?dept=hr` offer **From template**
and **Blank email**. Blank mode provides recipient, subject, message and a
sandboxed live preview using the same branded letter as template messages.
HR previews use People & careers; client previews use Client services.

- The posted department determines blank-mail routing, not the preview alone.
  A hidden department field is validated again on the server; invalid explicit
  departments are rejected rather than silently changed to hello.
- Admins can compose for either department. Editors need `employees` for HR or
  `clients` for client email. Page and action checks are independent; changing
  hidden fields cannot grant access to the other mailbox.
- Interactive sends require the selected mailbox and SMTP acceptance. An HR
  compose request does **not** silently fall back to the hello mailbox when HR
  credentials are missing. Existing legacy automated-notification fallback is
  unchanged. Configure `MAIL_HR_USER` / `MAIL_HR_PASS` privately; never commit them.
- Successful sends retain the existing sent-folder archive and audit trail.
  Custom-send audit metadata records the department. Acceptance is not a promise
  of final inbox placement.
- Both outcomes return to the selected department/mode; `mode=blank` also opens
  blank mode directly. Switching modes retains the current in-page draft. A full
  page navigation/server redirect does not persist draft contents.
- Return URLs are constrained to local admin paths. Result parameters preserve
  existing scope/query parameters and are encoded once. Validation errors do
  not initiate SMTP; configured mail-off environments remain unable to send.

Verification: unit action/interface/mail-routing tests plus
`scripts/verify-hr-compose.mjs`. Build first, then run that script with local env
files and, if necessary, an explicit loopback `REMINDER_TEST_ADMIN_DATABASE_URL`
with CREATEDB permission. It creates/drops its own randomly named database,
uses synthetic accounts and a `.invalid`-only loopback SMTP sink, tests both
mailbox senders and editor scope tampering, and captures desktop/mobile states.
No real-recipient email or production records are needed. Never run fixtures
against the live database.
