# Client meeting and invoice reminders

## Manual buttons

- **Invoices & payments:** **Send payment reminder** appears on unpaid issued
  invoices, in both the register and invoice editor.
- **Meetings:** **Send meeting reminder** appears on active invitation/meeting
  details with a saved recipient.
- Confirm before sending. The control shows pending state, then the server's
  recorded result. Keyboard focus stays inside the dialog; Escape cancels before
  submission and focus returns to the trigger.
- Existing admin authentication and client-section permissions apply. Recipient,
  amount, payment link and meeting invitation are loaded on the server, never
  accepted from a browser-supplied email address.
- A current record revision is required. Details, payment history, client state
  and eligibility are checked again immediately before SMTP.
- The 15-minute cooldown is database-backed across users, sessions and workers.
  An in-flight or uncertain delivery cannot be manually repeated.
- Sending a reminder **does not** mark an invoice paid/overdue, change its amount,
  confirm/reschedule a meeting, or rotate its private invitation link.

Manual invoices can have no due date. They must be `sent`/`overdue`, have a positive
amount, an active client and no paid timestamp or positive confirmed payment
transaction. Draft, paid and cancelled invoices are excluded.

Meeting reminders require an active, unexpired invitation with its valid saved
bearer token and recipient; linked clients must be active. Past dated meetings,
completed/cancelled/deleted/draft meetings and stale revisions are rejected.
Unconfirmed invitations are never described as confirmed. For a new availability
request the preferred date is used, not an earlier confirmation's date.

## Automatic invoice schedule

The business timezone is **Asia/Kolkata**, independently of the server timezone.
Invoice due dates remain calendar dates stored at UTC midnight.

For an invoice due **10 November**, the only automatic stages are:

| Date | Stage | Template key |
| --- | --- | --- |
| 9 November | Due tomorrow | `invoiceDueTomorrow` |
| 10 November | Due today | `invoiceDueToday` |
| 11 November | One day overdue, still unpaid | `invoiceOverdueReminder` |

The job begins sending at/after **09:00 IST**. Cron polls every 15 minutes so a
missed/failed invocation can recover during the same calendar day. There is no
historical backfill or daily overdue email after the one-day-overdue stage.
Manual templates are `invoicePaymentReminder` and `meetingReminder`; all five are
available through the existing editable template registry. Saved honorifics,
registered names, currency formatting and validated payment URLs are preserved.

The same unpaid/active-client/payment-history eligibility applies automatically.
An invoice without a due date or issued in the future is not selected. Paid,
cancelled and draft invoices are never candidates. A provider URL is not payment
evidence. Payments arriving **after** SMTP submission cannot recall an email.

A completed reminder suppresses another automatic nudge for that invoice on the
same IST calendar day, including after a due-date edit. Editing a due date creates
a new future date/stage identity; it does not replay an already sent identity.
Manual and automatic claims for an invoice cannot submit concurrently.

## Durable delivery and failures

`ReminderDelivery` / `reminder_deliveries` stores target, stage/due-date identity,
status, attempts, claim token/time, retry time, stable SMTP Message-ID and a safe
error code. It stores no provider credentials, SMTP error bodies or meeting token.

- Invoice/meeting row locks serialize claims; unique keys plus compare-and-swap
  prevent the same automatic stage being claimed concurrently.
- No database transaction is held open across template rendering or SMTP.
- Success means **SMTP acceptance recorded in the ledger**, not guaranteed inbox
  placement. The existing sent-email archive remains best-effort.
- Only conclusive temporary non-acceptance can retry automatically: maximum
  three attempts, at least one hour apart, within the stage's calendar day.
  Permanent rejection is final. Manual failures are never silently retried.
- Lost DATA acknowledgements and generic connection closures are ambiguous.
  They become `uncertain`, not an automatic resend. Abandoned `sending` claims
  older than 15 minutes are also quarantined, never replayed automatically.
- Unknown deliveries on the same business day block a second scheduled nudge.
  A later distinct calendar stage is not a replay of an earlier uncertain stage.
- Old pending/retry windows are marked `skipped`. Each invocation caps submitted
  messages at 25, scanning at 5,000 candidates and processing at about eight
  minutes; subsequent cron ticks continue using the ledger.

**SMTP cannot provide transactional exactly-once delivery with PostgreSQL.** The
ledger's conservative quarantine favors avoiding duplicates over blindly
retrying an unknown outcome.

## Approved VPS activation (not automatic on deploy)

Follow [WORKFLOW.md](WORKFLOW.md): dev → test → production, backup, reviewed
additive schema change, build and PM2 restart. `scripts/server-update.sh` applies
`prisma/reminders.sql` before the Prisma synchronization/build. No invoice/client
record is changed by this migration. Do not use data-loss/reset flags.

Keep automation disabled in development, previews and staging:

```dotenv
MAIL_DELIVERY_MODE=off
INVOICE_REMINDERS_ENABLED=false
```

On the **approved live VPS only**, configure the private `.env.production` with
`INVOICE_REMINDERS_ENABLED=true` and an independently generated
`INVOICE_REMINDER_SECRET` (`openssl rand -hex 32`, never commit or log it). Live
mail, production runtime/content and valid SMTP must already pass preflight.
The default private runner origin is `http://127.0.0.1:4300`; its optional override
`INVOICE_REMINDER_BASE_URL` must also be loopback HTTP, with no credentials/path.

Restart the approved app with that configuration before installing cron. From
`/var/www/savotechnologies`, with NVM loaded:

```sh
# Read-only: counts eligible dates, never writes a ledger entry or sends mail.
node --env-file=.env.production scripts/run-invoice-reminders.mjs
# Validate only; no cron installed and no immediate send.
bash scripts/install-invoice-reminders.sh
# After approval, install polling, private wrapper and bounded log rotation.
bash scripts/install-invoice-reminders.sh --apply
```

The installer does **not** call the sending job, but the next installed cron tick
can deliver eligible real client reminders. Cron uses `flock`, a root-only runner
and a 0600 log; the app ledger remains the concurrency authority. The internal
POST `/api/internal/invoice-reminders` additionally requires the private bearer
secret, JSON and an explicit `apply: true`; its default is read-only. Callers
cannot supply an invoice, email, date or send time. Responses/logs contain counts
and safe status codes, not invoice contents or recipient addresses.

### Operations / ambiguous outcomes

Monitor `/var/log/savo-invoice-reminders.log`, job exit status and ledger rows
with `failed`, `retry`, `uncertain` or stale `sending` status. A successful HTTP
response is not proof that every candidate was sent: inspect `failed`/`capped`
counts. A clock earlier than 09:00 returns `before_send_hour` without sending.

Authorized operators can inspect ledger IDs/Message-IDs and correlate provider
acceptance, bounce logs and the existing sent-email folder. Do not delete ledger
rows or reset attempts to make a reminder resend. Quarantined outcomes require
conclusive provider evidence and an audited operator resolution: mark confirmed
acceptance as sent, or confirmed non-acceptance as failed before a deliberate
new manual request. If evidence remains inconclusive, leave it quarantined.
There is intentionally no browser override for unknown deliveries.

Disable the cron file and set `INVOICE_REMINDERS_ENABLED=false` plus restart to
stop automation. This leaves explicitly confirmed manual reminders available.
Set `MAIL_DELIVERY_MODE=off` and restart to stop all outgoing mail. Keep the
additive ledger on code rollback; never restore an old database over new activity.

## Local verification only

```sh
npm run test:run
npm run lint
npm run typecheck
MAIL_DELIVERY_MODE=off npm run build
# Runs the opt-in PostgreSQL suite, then browser + real loopback SMTP checks:
node --env-file=.env --env-file=.env.local scripts/verify-reminders.mjs
```

The browser script creates/drops **only its own randomly named loopback test
database**. When the normal app role lacks CREATEDB (as it should), explicitly
supply a local `REMINDER_TEST_ADMIN_DATABASE_URL` authorized to create a database
owned by that app role. It never changes role privileges. The opt-in DB suite
refuses ordinary application database names and runs inside that disposable
database too, so its broad scheduled-job queries cannot touch real local records.
It launches an isolated
loopback app and in-memory SMTP sink that rejects all non-`.invalid` recipients;
no real client, invoice, payment or inbox is used. Screenshots and the sanitized
report go to `.impeccable/review/reminders/`. Screenshots contain only synthetic
records/links, invalidated when their database is dropped; the sanitized report
omits email bodies and tokens.
Do not run this verification script or opt-in database fixtures against live data.
