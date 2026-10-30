# Email attachments and readable replies

Email-only release based on v7.18.0. Work is isolated in `feat/email-attachments`
at `/Users/om/savo-email-attachments`. The uncommitted payment feature, its
credentials and previews remain in `/Users/om/savo.v7`; they are not part of
this branch or release. Do not publish that older payment tree later without
first integrating the intervening email release.

## User workflow

- Both hello and HR **Blank email** composers accept files: the standalone
  compose page and the mailbox's Custom email option. Templates do not silently
  accept/drop uploaded files; choose Blank email for attachments.
- Up to **10 files totaling 10 MB (10,000,000 bytes) per email**, not 10 MB per
  file. Exactly the boundary is accepted; one byte over is rejected. Client
  validation helps the user; server validation and PostgreSQL enforce it too.
- PDF, DOC/DOCX, XLS/XLSX, PPT/PPTX, UTF-8 TXT/CSV and PNG/JPEG. Executables,
  scripts, SVG/HTML, macro extensions and unknown formats are not accepted.
  Signatures are checked, but this is **not antivirus/malware certification**.
  Never automatically open/extract/execute a received document.
- Selected files show names, sizes, combined usage and Remove controls. They
  are cleared when changing compose mode/mailbox or reloading; browsers cannot
  safely restore file inputs after a server-result redirect.
- SMTP carries the real attachment bytes, not public links. The Sent archive
  retains private downloadable copies; Inbox replies list their own documents.
- Existing mailbox readers (`emails` permission or admin) may download. Compose
  permission alone is not mailbox read access. Every file GET independently
  authorizes before querying data. No unauthenticated/signed-public file URLs.

## Storage and sending truth

`email_attachments` holds binary bytes and metadata with one parent: received
`email_replies` or outgoing `sent_emails`. List queries select metadata only.
Downloads force `application/octet-stream`, attachment disposition, UTF-8 safe
filenames, no-store/no-sniff and restrictive CSP. Opaque IDs aren't permission.
Names have paths/control/bidi/header delimiters removed; blobs never go in
`public/` or filesystem paths supplied by a user.

Outgoing attachments are archived **before SMTP**. Archive failure blocks send.
Stable Message-ID and exact archived buffers are used for SMTP. Delivery states
are `pending`, `sent` (SMTP acceptance only), `not_sent` or `uncertain`; ambiguous
outcomes are not auto-retried and the reading pane warns users to check the
mailbox before resending. If final status persistence fails after SMTP accepted,
the archive can remain pending; do not treat pending as proof of non-delivery.
Sensitive authentication mail cannot carry attachments or enter this archive.
No-attachment legacy transactional sending keeps its existing behavior.

The SQL migration adds nullable/defaulted columns, a new private table, named
constraints and parent-lock budget/immutability guards. It does not rewrite old
message bodies, client identities, invoice/payment records or credentials.
Legacy Sent rows default to `sent`; old replies default to body format version 0.
Delete received messages through existing controls to cascade their files.
Outgoing archive retention remains the existing policy; plan capacity/private
backups for the additional bytes. No automatic deletion policy was invented.

## Receiving and proper formatting

The existing authenticated `/api/email/inbound` accepts provider multipart file
parts (including SendGrid attachment-info Content-IDs) or raw RFC822 MIME in
`email`. JSON stays metadata-only; it cannot supply file paths, URLs or arbitrary
base64 attachment objects. Shared-secret auth validates the provider/poller,
**not the original sender**. Existing query auth remains for providers that need
it; prefer the header and redact provider-secret query strings at ingress.

A proper MIME parser decodes transfer encodings, charsets and multipart bodies.
Encoded `=E2=80=93`, base64 and CSS aren't displayed as the message text. Standard
HTML keeps sender formatting inside an opaque-origin sandbox: no scripts/forms,
no parent access, no remote resources by default. HTTPS images require explicit
per-message consent, with a tracking warning. CID PNG/JPEG images are fetched
through the authenticated file endpoint and embedded only in client memory on
consent; file bytes are never serialized in the mailbox list. The parent CSP is
widened for HTTPS images **only on `/admin/emails`**, while the child frame's
policy blocks them until consent. Other pages retain their current CSP.

Legacy records are repaired conservatively for **display only** when recognizable
quoted-printable/base64 HTML markers exist. Original stored text remains available.
New MIME-decoded replies aren't double-decoded. Plain-text previous correspondence
is collapsed under a native disclosure rather than burying the current reply.
No historical bodies are overwritten, and old attachments that were never stored
cannot be recovered without importing the original message again. Proprietary
formats such as TNEF/winmail.dat aren't a supported document decoder.

Oversized/unsupported decoded attachments are omitted with an Inbox notice while
retaining the reply body. Raw transport bodies above the safety budget get 413;
a provider must retry/reject according to its contract. Raw MIME overhead is
allowed up to 16,000,000 HTTP bytes; decoded documents still cannot exceed 10 MB.
Next's proxy clone limit is 17,000,000; admin Server Actions are 11,000,000 to
leave multipart overhead. The reverse proxy must permit these transport sizes
without relaxing the application file budget. Two simultaneous inbound parses
per worker bound peak buffering; overload returns retryable 503.

**The application cannot prevent someone from submitting a >10 MB email to
Hostinger/SendGrid themselves.** It prevents sending/importing those document
bytes in this app. SMTP-level rejection before mailbox delivery requires a
separate provider/MTA size policy, usually including MIME overhead. No bounce or
auto-reply to an unverified sender is generated (avoids backscatter).

## Existing integrations / poller

Public MX inspection shows root mailboxes on Hostinger and reply subdomain on
SendGrid. Existing Reply-To routing and inbound secret are preserved; no DNS or
new provider account is required for the existing reply route. Do not enable a
second poller or change Reply-To blindly. Production preflight found no active
`savo-email-poller`; the active reply route already imports messages via the
provider. The revised poller is available if direct-mailbox import is wanted.

The IMAP poller uses bounded streaming download, MIME decoding, canonical actual
mailbox recipients, and UIDVALIDITY/UID delivery identities. It posts multipart
to loopback with a header secret, never query-secret/raw-message logging. It
marks the exact UID Seen only after a persisted success/dedup acknowledgement;
failed imports remain retryable. A sequential loop prevents overlapping cycles.
Oversized MIME is not downloaded; an omission notice is imported instead.
Retries use mailbox-scoped delivery keys and a unique DB index. No test creates
real inbound messages, changes Seen flags in real mailboxes or submits mail to
real recipients. Poller activation/backfill remains a deliberate operational step.

## Verification and rollout

`npm run test:run`, lint, typecheck, mail-off production build, then
`node scripts/verify-email-attachments.mjs`. Optional
`EMAIL_ATTACHMENT_TEST_ADMIN_DATABASE_URL` must be loopback with CREATEDB.
The verifier creates/drops `savo_email_attachments_verify_<hex>`, uses generated
accounts and an in-memory `.invalid`-only SMTP sink, and exercises real MIME,
10 MB HTTP/SMTP boundaries, private downloads, formatting, scripts/trackers,
legacy display repair and role checks. Never run fixtures on application DBs.

Apply `prisma/email-attachments.sql` before synchronizing/building the new code;
retain reviewed additive changes only. Preserve production `.env.production`,
client identity digests, reminder ledger and the existing systemd reminder timer.
Promote only this email tree through dev/test/prod with CI and private backup.
Rollback code/build if needed; leave additive schema in place, never overwrite
new customer activity with an old database. Payment code/env switches are excluded.
