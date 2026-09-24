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
# origin  → https://github.com/theelitesherpas/dev.savotechnologies.git  (push/pull)
# test    → https://github.com/theelitesherpas/test.savotechnologies.git (push only)
# prod    → https://github.com/theelitesherpas/prod.savotechnologies.git (push only)

git config user.name    # theelitesherpas
git config user.email   # theelitesherpas@users.noreply.github.com
```

## Daily development

1. `git checkout -b feat/<short-name>` from `main`
2. Work, commit, push to origin (dev repo)
3. Open a PR against `main` in **dev.savotechnologies**; review, then merge
4. CI (lint + typecheck + 56 tests + production build) must pass before merge

## Promotion — dev → test

When a change set is ready for QA:

```bash
git checkout main
git pull origin main          # be exactly on the dev main you verified
git push test main            # same commit SHAs land in the test repo
```

* Test environment deploys automatically from `test.savotechnologies`.
* Never commit directly on the test repo — it only receives promoted SHAs.

## Promotion — test → prod (go live)

Only after QA signs off on the test environment:

```bash
git checkout main
git push prod main            # SHAs already verified in test go live
```

* Verify the release: `git ls-remote origin main test main prod main` —
  the three `main` heads should show the intended promotion state.
* Production deploys automatically from `prod.savotechnologies`.

## Rules (industry standard)

1. **Same SHAs everywhere on release** — prod always contains commits that
   passed through dev → test. Never "hotfix" prod with untested commits.
2. **Emergency hotfix path**: branch from prod's `main`, fix, push to prod,
   then immediately back-merge the same commit into dev `main` so the
   environments never drift.
3. **No force-push, no branch deletion** on `main` in any repo.
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
