# Security operations and recovery

Security is layered risk reduction, not a promise that the website/account/host is attack-proof. This release preserves financial truth, currencies/fees, email archives, identity, fresh email step-up, reminder stage policy and private keys.

## Dependency and request hardening

- Next.js/Next ESLint16.4.5 and Zod>=4.6.6 patch the reported advisories. Vitest/Vite and ip-address are patched in the lockfile. A scoped minimatch11.0.1 override for TypeScript ESLint removes its vulnerable glob parser without downgrading Next lint rules; lint/typecheck tests cover compatibility. Node22.23.4 is the reviewed security runtime, isolated from other sites' Node installations.
- SVG/private-IP image optimization and optimizer redirects are disabled; source-image bodies and image-cache disk usage are bounded. Static official SVG logos still work directly. The established17MB proxy/11MB Action budgets and combined10,000,000 attachment bytes are unchanged.
- Public Markdown self-fetches use the server-owned PORT, never an incoming Host/forwarded port. Private discovery/auth boundaries, no-store/referrer controls and bounded HTML reads remain.
- Bootstrap integrity checks run before dependency/configuration execution, reject known root loaders, script/lifecycle changes, unexpected executable package config, tracked env secrets, unapproved registry origins/weak hashes and injected Node/TLS/test flags. Pending release objects can be inspected with the INSTALLED policy without loading their code. These checks do not replace account security or review of the full immutable release tree.

## Repository supply chain

GitHub Actions use immutable verified upstream action commits, read-only repository permissions, no persisted checkout credentials, no production secrets, explicit job timeouts and npm install with lifecycle scripts disabled. Only the reviewed Prisma client generator runs explicitly. Dependency audit now gates CI; a daily read-only audit and reviewable Dependabot PRs monitor later advisories. Updates are not automatically merged or deployed.

2026-11-06 incident:14 current branch heads were maliciously rewritten with `init`/PostCSS loaders and weakened env ignores. Exact trusted original trees were restored using normal single-parent commits; unsafe objects remain quarantined/evidentiary history and must NEVER be checked out or run. Production main/source remained on its trusted release. One tainted GitHub CI run reached build, so the runner/checkout token/source must be treated as potentially exposed; no repo CI secrets were configured and token permissions were read-only. Payload execution/exfiltration was not fully determined.

**Owner action remains essential:** review GitHub security log, active sessions, PAT/OAuth/App grants,2FA and source machines; revoke unrecognized access from a trusted device. Available API access cannot identify the originating machine/token or complete that personal review. Code repair alone cannot prevent another rewrite while compromised access remains. Do not send tokens/passwords/OTPs in chat. Do not blindly replace the encryption master key and strand saved credentials.

## Dedicated runtime

`ops/savo-web.service` runs only Savo as a locked non-login `savo-web` user, binding127.0.0.1:4300 behind NGINX. Root owns code/dependencies/build and the environment; the runtime can write only upload/cache/scratch areas. Private home/tmp/device/process views, read-only system protection, empty capabilities, no privilege escalation, namespace restrictions and process/memory/CPU bounds limit blast radius. Other websites' source/private infrastructure directories are hidden. JIT is deliberately allowed: MemoryDenyWriteExecute would break V8.

`ops/configure-runtime.sh --install-node` verifies the official HTTPS Node archive against official SHA256 sums, installs only a dedicated /opt runtime and leaves shared Node installations unchanged. `--prepare APP_DIR` checks bootstrap metadata and sets narrow permissions without changing env bytes. Never use a root PM2 fallback. The initial migration uses a separately pinned, staged rollout and tested rollback; the generic updater is for the isolated runtime AFTER migration.

The existing reminder timer/cadence is retained. Its worker uses the same non-root principal and reviewed Node, with the original loopback secret/stage/dedup semantics. Never submit real reminder/payment/email fixtures on production for validation.

## Database separation

`ops/harden-database.sql` is an explicitly reviewed administrator-only metadata operation, scoped to savo_prod/savo and a no-login savo_schema_owner. It transfers schema ownership, grants the app CRUD/sequence/function rights, removes schema/DB creation and temporary-table/owner membership, caps connections and sets defensive query/lock/idle defaults. It changes no business rows, credentials, amounts, counters or model columns. The disposable verifier proves forbidden DDL/trigger disabling and the settlement suite under the non-owner runtime role.

**Future migrations must use an authorized administrator / SET ROLE savo_schema_owner**, followed by appropriate app grants/default privileges. The app's DATABASE_URL must not regain ownership or broad DDL rights. Do not run automatic `prisma db push` as the web role. A schema release needs a separate reviewed additive migration; the generic code-only updater refuses Prisma changes.

## Reverse proxy and SSH

Savo-scoped NGINX snippets bound slow clients, hide version details, trust client-IP headers only from official Cloudflare peers and limit only POST login entry points. The deployed vhost must overwrite Host-derived/forwarded-IP/proto/port headers instead of appending caller-controlled chains. Provider webhooks, inbound email, normal GETs and mail/document uploads are NOT subject to the login limiter. Keep17m body ingress, payment query-log redaction and valid direct HTTPS webhook delivery. Check nginx before every reload; never edit unrelated vhosts.

Root SSH is made key-only only after confirming a fresh key-authenticated connection and retaining an independent recovery channel. Do not remove unknown authorized keys blindly or disable other users' access. The owner must review fingerprints/host-panel access and account MFA. Shared-host OS reboot/security work and other applications require coordinated maintenance; do not reboot other live sites silently.

## Deployment and single-backup retention

The old mutable-main updater is prohibited. After initial migration:

```sh
bash /var/www/savotechnologies/scripts/server-update.sh \
  --release FULL_REVIEWED_COMMIT_SHA \
  --tree FULL_TESTED_TREE_SHA \
  --backup /root/savo-backups/full-TIMESTAMP
```

The installed policy checks pending Git objects before code execution. The updater verifies a full backup of the current code/environment, checks immutable commit/tree/linear ancestry, installs without lifecycle hooks, generates the reviewed client, audits/builds and restarts only savo-web. It rejects unreviewed schema changes and never restores a database during automatic code/runtime rollback.

Keep one latest COMPLETE VERIFIED recovery set on the VPS: create/verify the replacement first, then retire the older set. A full set includes code/runtime/public data, database, exact encryption environment, Savo process/service/proxy/TLS and relevant account/DB-privilege recovery metadata. Test archive extraction and an isolated DB restore/content comparison before deletion. Never restore an old DB over new customer activity. Keep root-only permissions; do not transfer backups/secrets in chat.

This same-disk backup is not disaster recovery against host/disk/account loss; independently secured off-site storage is still recommended. File signature/type validation is not antivirus. Basic integrity/persistence checks do not constitute full host forensics. An unresolved account compromise, shared-root applications, or an outstanding OS reboot must be reported rather than described as fully cleared.
