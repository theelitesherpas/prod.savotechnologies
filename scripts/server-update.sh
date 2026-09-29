#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# savotechnologies.com — VPS update script. Pulls the promoted main from the
# PUBLIC prod repo (no token needed), applies any database schema changes,
# rebuilds and restarts the app under PM2. Run as root on the VPS:
#
#   ssh root@50.6.44.47 'bash /var/www/savotechnologies/scripts/server-update.sh'
#
# Before running: promote the release through dev → test → prod
# (see docs/WORKFLOW.md). Env files (.env / .env.production) are untracked
# and survive the update.
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

APP_DIR="/var/www/savotechnologies"
REPO="https://github.com/theelitesherpas/prod.savotechnologies.git"
BRANCH="main"

# Load nvm so node/npm/pm2 resolve in non-interactive SSH sessions.
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"

[ "$(id -u)" -eq 0 ] || { echo "Run as root"; exit 1; }

cd "$APP_DIR"

echo "═══ 1/5 Fetching promoted code ($BRANCH from prod repo) ═══"
git fetch "$REPO" "$BRANCH"
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
echo "══════════════ UPDATE COMPLETE ══════════════"
curl -s -o /dev/null -w "local app check: HTTP %{http_code}\n" http://127.0.0.1:4300
echo "Site: https://savotechnologies.com"
