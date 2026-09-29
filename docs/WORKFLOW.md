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
4. CI (lint + typecheck + 56 tests + production build) must pass before merge

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
* Production is served by the VPS (`root@50.6.44.47`, `/var/www/savotechnologies`,
  PM2 `savo` on port 4300 behind Cloudflare). Publish the promoted main
  with one command:

  ```bash
  ssh root@50.6.44.47 'bash /var/www/savotechnologies/scripts/server-update.sh'
  ```

  The script pulls `main` from the public prod repo (no token needed),
  runs `npm ci`, `prisma db push`, the production build and restarts PM2.

## Rules (industry standard)

1. **Same SHAs everywhere on release** — prod always contains commits that
   passed through dev → test. Never "hotfix" prod with untested commits.
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
