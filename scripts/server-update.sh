#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# savotechnologies.com — VPS update script. Pulls the latest code, applies
# any database schema changes, rebuilds and restarts the app under PM2.
# Run as root. Requires GIT_TOKEN in the environment.
# Env files (.env / .env.production) are untracked and survive the update.
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

APP_DIR="/var/www/savotechnologies"
BRANCH="feat/admin-console"

[ "$(id -u)" -eq 0 ] || { echo "Run as root"; exit 1; }
[ -n "${GIT_TOKEN:-}" ] || { echo "export GIT_TOKEN first"; exit 1; }

cd "$APP_DIR"

echo "═══ 1/5 Fetching latest code ═══"
git fetch "https://x-access-token:${GIT_TOKEN}@github.com/theelitesherpas/dev.savotechnologies.git" "$BRANCH"
git reset --hard FETCH_HEAD
git log -1 --oneline

echo "═══ 2/5 Dependencies ═══"
npm ci --include=dev

echo "═══ 3/5 Database schema ═══"
set -a; . ./.env.production; set +a
npx prisma db push

echo "═══ 4/5 Production build ═══"
NEXT_PUBLIC_CONTENT_MODE=production NEXT_PUBLIC_INDEXABLE=true npm run build

echo "═══ 5/5 Restart ═══"
pm2 restart savo || pm2 start npm --name savo --cwd "$APP_DIR" -- run start -- -p 4300
pm2 save

sleep 3
echo ""
echo "════════════ UPDATE COMPLETE ════════════"
curl -s -o /dev/null -w "local app check: HTTP %{http_code}\n" http://127.0.0.1:4300
echo "Site: https://savotechnologies.com"
