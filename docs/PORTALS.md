# Savo portal access

## Surfaces

- Client entrance: `/portal`; workspace: dashboard, projects, project details and invoices.
- Employee entrance: `/employee-portal`; employee-owned employment/leave/authored-content dashboard.
- Both entrances share `src/components/portal/entrance.tsx`, the real existing editorial desk image, explicit portal switching and `login-fields.tsx`.
- `site-chrome.tsx` provides focused access chrome and prevents marketing form providers/assistant from mounting on portal routes. Other website routes retain their original provider hierarchy.
- Scoped visual authority: the current portal override in `DESIGN.md`. No new fonts or runtime dependencies.

## CAPTCHA: a release prerequisite

Client and employee sign-in **require Google reCAPTCHA v2 checkbox verification from the first attempt**, enforced server-side before credential processing. Missing/rejected tokens, partial configuration and missing configuration cannot silently bypass verification. Admin retains its previous progressive-attempt policy; other public forms keep their existing configuration policy.

Configure both `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` and `RECAPTCHA_SECRET_KEY`. The public key is frozen at build time: rebuild when it changes. Add the real deployment hostname to the Google key's allowed domains. Keep the secret in server environment settings, never browser code or a commit.

**Do not deploy Google's public testing pair.** Localhost currently uses that official pair for preview and automated integration checks. Its testing notice is intentionally visible; passing these checks is not evidence of real-world bot resistance. Real production keys must be supplied and verified before publication.

Both forms retain visible labels, password-manager autocomplete, show/hide password, pending/disabled feedback, focused error summaries and real account-help links. Native compact CAPTCHA is used when an access form has less than 304px width. Verification expiration clears the token; status failure shows human recovery and disables sign-in. No-JS cannot solve CAPTCHA; the existing human help path remains available.

## Preserve the security boundaries

- Client pages independently validate the current client and query by its ID. Private drafts stay excluded; interactive record DTOs remain allowlisted.
- Employee dashboard preserves expiration, active-employment and linked-panel-user checks, querying authored content by that employee's ID.
- No new HR edits, leave-request submission, payment/download, support inbox or account-reset capability was invented.
- Normal session/password/rate-limit behavior remains intact; existing admin access permissions do not change.

## Verification

```sh
npm run typecheck
npm run lint
npm run test:run
npm run build
# Start local production preview with mail delivery disabled:
MAIL_DELIVERY_MODE=off npm run start -- -p 4326
# AXE_PATH must point to an installed axe-core browser bundle:
AXE_PATH=/path/to/axe.min.js node --env-file=.env --env-file=.env.local scripts/verify-portal.mjs
AXE_PATH=/path/to/axe.min.js node --env-file=.env --env-file=.env.local scripts/verify-employee-portal.mjs
```

Browser scripts permit only localhost origins/databases and Google's official testing pair. They create labeled synthetic records, verify real local sign-in/provider test-token handling, ownership, responsive layout and recovery, then delete fixtures in `finally`. They do not automate real CAPTCHA challenges or send real credentials/email. `REUSE_ENTRANCE_CAPTURES=1` preserves already-inspected entrance evidence while continuing functional checks; default runs cover all widths.

Current evidence: `.impeccable/review/portal-v2/` and `.impeccable/review/employee-portal/`. Desktop/mobile and 320/390/768/1440 captures are available. Final functional continuations passed 130 client and 42 employee assertions, with earlier four-width entrance scans/captures retained. Unit suite: 96 files / 1,370 tests; lint, typecheck and production build passed. Axe scans cover client main-task surfaces and employee body/chrome; third-party CAPTCHA frame internals and whole-site compliance are not certified.

Initial verification found an inline-size containment shrink defect and a broad CAPTCHA iframe locator; the single UI correction widened the form and removed hidden marketing widgets from access routes. A later harness timeout incorrectly waited for a hidden token input to be visible; scripts now wait for attachment. That correction required no app change or rebuild. Finish review/documentation were inline, not independent. Local preview only: no production deployment, physical-device certification or performance profiling.
