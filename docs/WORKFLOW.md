# Development → Test → Production Workflow

This project uses a **three-repo promotion model**. One codebase, three
GitHub repositories under `theelitesherpas`, each connected to its own
deployment environment:

| Repo | Branch | Purpose | Who deploys |
| --- | --- | --- | --- |
| `dev.savotechnologies` (private) | `main` + feature branches | Active development | Developers (auto-deploy on push) |
| `test.savotechnologies` (private) | `main` | QA / staging / client review | Promotion only |
| `prod.savotechnologies` (public) | `main` | Live production site | Promotion only |

## Local setup (this machine is already configured)

```bash
git remote -v
# origin  → https://github.com/theelitesherpas/dev.savotechnologies.git  (push/pull — development lands here)
# test    → https://github.com/theelitesherpas/test.savotechnologies.git (fetch only; push URL disabled)
# prod    → https://github.com/theelitesherpas/prod.savotechnologies.git (fetch only; push URL disabled)
#
# Re-enable direct push if ever needed (prefer the URL method in Promotion):
# git remote set-url --push test https://github.com/theelitesherpas/test.savotechnologies.git

git config user.name    # theelitesherpas
git config user.email   # theelitesherpas@users.noreply.github.com
```

## Daily development

1. `git checkout -b feat/<short-name>` from `main`
2. Work, commit, push to origin (dev repo)
3. Open a PR against `main` in **dev.savotechnologies**; review, then merge
4. CI (lint + typecheck + unit/integration tests + production build) must pass before merge; use squash/rebase, not merge commits, for new PRs

## Push policy (default on this machine)

**Only `origin` (dev repo) receives pushes during development.** The
`test` and `prod` remotes have their push URLs disabled, so an accidental
`git push test` / `git push prod` fails immediately. Fetch/verification
(`git ls-remote`) still works for both.

## Promotion — dev → test

When a change set is ready for QA, push **explicitly by URL** (works while
the remote push URL is disabled, and makes promotion a deliberate act):

```bash
git checkout main
git pull origin main          # be exactly on the dev main you verified
git push https://github.com/theelitesherpas/test.savotechnologies.git main
```

* Test environment deploys automatically from `test.savotechnologies`.
* Never commit directly on the test repo — it only receives promoted SHAs.

## Promotion — test → prod (go live)

Only after QA signs off on the test environment:

```bash
git checkout main
git push https://github.com/theelitesherpas/prod.savotechnologies.git main
```

* Verify the release: `git ls-remote origin main test main prod main` —
  the three `main` heads should show the intended promotion state.
* After the v7.21.0 runtime migration, production uses the non-root
  `savo-web.service` on loopback4300 behind NGINX/Cloudflare. Root performs
  reviewed maintenance only; the app must not run under root PM2.
* First create and verify a complete current backup, then provide the immutable
  reviewed commit AND tested tree (not a branch/tag name):

  ```bash
  ssh root@50.6.44.47 'bash /var/www/savotechnologies/scripts/server-update.sh --release FULL_COMMIT_SHA --tree FULL_TREE_SHA --backup /root/savo-backups/full-TIMESTAMP'
  ```

  The code-only updater validates the backup and pending source with its installed
  bootstrap policy before executing it, installs with lifecycle hooks disabled,
  explicitly generates the reviewed Prisma client, audits/builds and restarts only
  Savo. It refuses automatic schema/data writes and root PM2 fallbacks. Initial
  migration requires a separate pinned/staged deployment with rollback. See
  [SECURITY-HARDENING.md](SECURITY-HARDENING.md).

## Rules (industry standard)

1. **Same immutable release commit everywhere** — prod always contains code that
   passed through dev → test. Release tags/branches identify the exact published
   SHA in all three repos. Legacy dev/test merge ancestry may leave their `main`
   heads different; use the tree-verified linear-release procedure below, never a
   force-push or an untested hotfix.
2. **Emergency hotfix path**: branch from prod's `main`, fix, push to prod,
   then immediately back-merge the same commit into dev `main` so the
   environments never drift.
3. **No force-push, no branch deletion** on `main` in any repo.
   *Enforced by GitHub branch protection on `prod` (public repo). Branch
   protection for the private `dev`/`test` repos requires GitHub Pro —
   until then this rule is on the honour system; the CI gate on dev is the
   practical guard.*
4. **Secrets never live in code** — `.env` is gitignored; each environment
   (dev/test/prod) holds its own variables in its deployment platform.
5. **Tag releases** so every production push is traceable:

   ```bash
   git tag -a v0.2.0 -m "Release: <summary>"
   git push prod v0.2.0
   ```

## Linear production releases with legacy dev/test merges

Production enforces linear history. At v7.2.1, dev/test `main` contained legacy
merge `c61e119`, while production `2bab92c` had the identical tree without that
merge. At v7.3.0, dev/test `6e5f340` and production `39028a0` again share a tree. Do not push those merge ancestors to protected production or rewrite
existing branches to remove them.

For this ancestry, prepare `release/vX.Y.Z` as a normal commit descended from the
current production `main`, carrying the reviewed feature tree. Push that release
branch to **dev**. If its PR is conflict-free, wait for CI and squash it into dev
`main`. In subsequent releases the prior squash and production commits can have
identical trees but different ancestry, making a direct release PR conflict.
Instead create a feature branch from dev `main`, cherry-pick the release's new
commits onto it, and verify its complete tree equals the untouched linear release.
Run CI and squash that feature PR. Never force-rewrite either existing branch.
Promote dev `main` to test `main`, plus the exact release branch to test; wait for
test CI. Verify `git diff --exit-code <release> <tested-main>` is empty (including
schema, assets and lockfile), and verify there are no merges between production
and the release. Only then fast-forward prod `main` to the release branch.
Publish the same annotated version tag and release-branch SHA in all three
repositories. Record the dev/test SHA and identical Git tree alongside the
published SHA. This preserves all ancestry and branch protection; no force-push,
main deletion, content cherry-pick after QA, or protection change is needed.

Before the VPS update:
- Check the already-loaded production runtime with `verify-runtime-env.mjs live`.
- Create/verify a full private recovery set and retain the current commit/build
  for rollback. Owner policy keeps one latest verified Savo VPS set: never remove
  the old one before its replacement passes extraction and isolated DB-restore
  checks. Off-site backup remains separate.
- Inspect the Prisma schema diff; invoice/project releases add nullable/defaulted
  columns only. Never accept data-loss/reset flags to push this schema.
- Business IDs require the reviewed `prepare-business-id-schema.mjs` additive SQL
  before Prisma synchronization, then `setup-business-ids.mjs --apply` for policy/
  guards. Never accept generic data-loss flags. See `docs/BUSINESS-IDS.md`.
  For the first upgrade from v7.3.0, fetch/check out the verified promoted release
  **before invoking its updated deployment script**: the already-running old
  updater cannot acquire new migration logic mid-execution. Retain the old SHA/
  build and backup first; use only a clean server checkout.
- Apply separately reviewed additive schema changes **before** new code starts,
  using an authorized administrator/schema-owner role, not the limited web role.
  Build with the existing live environment and restart only `savo-web.service`.
  Keep private environment bytes/master key intact; preserve the reminder timer.
- Smoke-test public routes, unauthenticated portal/admin boundaries and PDF
  authorization without changing real invoices/projects or sending test emails.
  Local fixture scripts refuse production and must not be run on the live DB.
- Roll back code/build if needed; additive columns may remain. Never restore an
  old database over new customer activity as a routine code rollback.

## Environment configuration per stage

| Variable | dev | test | prod |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | local/dev URL | test domain (noindex recommended until live) | `https://<production-domain>` |
| `DATABASE_URL` | local Postgres | staging database | production database (backups on) |
| `ENQUIRY_IP_SALT` | any | random per env | `openssl rand -hex 32` |
| `NEXT_PUBLIC_GA_ID` | unset | unset (or test property) | production GA4 ID |

> The site already keeps staging/indexing safe: non-production environments
> should set `NEXT_PUBLIC_SITE_URL` to their real host; robots.txt and
> canonicals derive from it. Add `X-Robots-Tag: noindex` at the hosting layer
> for the test environment until the production domain goes live.
