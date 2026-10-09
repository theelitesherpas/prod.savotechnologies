# Always-on Captcha (Google reCAPTCHA v2)

Every public form submission and every login attempt on the website
requires a solved Google reCAPTCHA v2 challenge. There is **no free
allowance** — a bot cannot submit even once. This replaced the previous
"progressive" model (2 free submissions per IP per day).

## Defence in depth (all layers active on every form)

| Layer | Where | Notes |
|---|---|---|
| 1 · Honeypot field | server routes | Bots get a silent fake success |
| 2 · Hard rate limit per IP | server routes | 5/hour enquiries, 40/10min salesbot, logins 10/15min… |
| 3 · reCAPTCHA v2 (always-on) | server + client | Every submission & login, verified with Google |
| 4 · Hostname policy | `lib/captcha.ts` | Tokens solved on foreign domains are rejected |
| 5 · CSRF guards | `lib/api.ts` | JSON-only mutations + same-origin checks |

## Protected surface (complete matrix)

| Form / flow | Endpoint / action | Gate |
|---|---|---|
| Start-a-project dialog (header CTA) | `POST /api/enquiries` | every submission |
| Contact form | `POST /api/enquiries` | every submission |
| Start-page brief | `POST /api/enquiries` | every submission |
| Careers application | `POST /api/enquiries` | every submission |
| Footer callback request | `POST /api/callback` | every submission |
| Meeting scheduler (client link) | `POST /api/meeting/submit` | every submission (before token validation) |
| Ask Savo → live chat / leave a message | `POST /api/live-chat/qualify` | every submission |
| Ask Savo AI — first message of a thread | `POST /api/live-chat/ask` | conversation creation only; later turns are visitor-rate-limited (per-message challenges would kill chat UX) |
| SalesBot live demo — session start | `POST /api/agents/salesbot/demo` | session creation only; turns in an established session are rate-limited |
| Bug report (error screens, human) | `POST /api/bug-reports` `type=user_report` | human reports only; automatic error/404 beacons stay token-free & silent |
| Admin login | `loginAction` server action | every attempt |
| Employee portal login | `employeeLoginAction` | every attempt |
| Client portal login | `clientLoginAction` | every attempt |

Not gated (by design): analytics beacons (no store), automatic error/404
reports, the unsubscribe action (signed-token protected, no lead value),
authenticated admin-panel forms (behind session auth + middleware).

## Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` | prod | Public v2 checkbox key (client widget) |
| `RECAPTCHA_SECRET_KEY` | prod | Server secret for `siteverify` |
| `RECAPTCHA_ALLOWED_HOSTNAMES` | no | Strict hostname policy override, comma-separated. Replaces the derived list entirely |

**Local dev ships Google's official TEST keys** (`6LeIxAcT…` pair: the
widget renders with a red warning and every solve passes). They are safe
for development and cannot be used on the real domain.

**Fail-open caveat:** if `RECAPTCHA_SECRET_KEY` is unset, the gate logs a
warning and lets submissions through (layers 1–2 still protect). This is
deliberate so a missing env var can never lock real customers out — but
production **must** always set real keys. Verify after every deploy:

```bash
curl -s https://savotechnologies.com/api/captcha/required
# → {"required":true,"configured":true}
```

## Go-live checklist (savotechnologies.com)

1. Register a **v2 Checkbox** keypair at <https://www.google.com/recaptcha/admin>
   for domains: `savotechnologies.com`, `www.savotechnologies.com`, the
   test deployment host, and `localhost` (local verification against prod keys).
2. Put the real keys in the **dev**, **test** and **prod** environments
   (`NEXT_PUBLIC_RECAPTCHA_SITE_KEY`, `RECAPTCHA_SECRET_KEY`).
3. The hostname policy derives from `NEXT_PUBLIC_SITE_URL` /
   `NEXT_PUBLIC_CANONICAL_ORIGIN` (apex + www both allowed). If the site
   is ever served from another host, set `RECAPTCHA_ALLOWED_HOSTNAMES`.
4. Deploy through the normal dev → test → prod promotion, then run the
   curl check above and solve one form by hand on the live domain.

## Testing

- **Unit/integration:** `npx vitest run tests/captcha.test.ts` — 26 tests
  covering fail-open, missing/short/invalid tokens, Google rejections,
  hostname farming defence, override policy, and every protected route
  (enquiries, callback, meeting, salesbot, bug-reports, gate endpoint).
- **Browser e2e:** `npm run verify:captcha` (server must be running) —
  drives Chrome through the real widget: renders on every protected form,
  blocks submission until solved, and a solved challenge lets the enquiry
  through (verified against Google's servers with the test keys).
- **Manual negative matrix (curl):**

  | Request | Expected |
  |---|---|
  | `POST /api/enquiries` without `captchaToken` | `400` human-verification error |
  | `POST /api/callback` without token | `400` |
  | `POST /api/meeting/submit` without token | `400` captcha (before token check) |
  | `POST /api/agents/salesbot/demo` (new session, no token) | `400` + `captchaRequired` |
  | `POST /api/live-chat/ask` (new conversation, no token) | `400` |
  | `POST /api/live-chat/qualify` without token | `400` |
  | `POST /api/bug-reports` `type=user_report` w/o token | `400` + `captchaRequired` |
  | same calls **with** a verified token | `200` and stored |

## How it works

- Client: `src/components/shared/captcha.tsx` — `useCaptcha()` asks
  `/api/captcha/required` (both key halves configured?), `CaptchaGate`
  renders the v2 checkbox, `captchaBlocked()` guards the submit handler,
  the token travels as `captchaToken`. Widgets re-arm (`reset()`) after
  every submission attempt because tokens are single-use.
- Server: `src/lib/captcha.ts` — `enforceCaptcha()` / `enforceLoginCaptcha()`
  verify every token with Google (`siteverify`, 10s timeout, client IP)
  and enforce the hostname policy. Unconfigured secret → loud warn + open.
- Chat-style flows (Ask Savo AI, SalesBot demo) gate **thread/session
  creation** only — a bot can never start one, and humans never solve a
  challenge per message.
