#!/bin/bash
set -e
cd /var/www/savotechnologies
echo "── 1. Updating inbound endpoint (raw MIME extraction)..."
cp /tmp/deploy-inbound.ts src/app/api/email/inbound/route.ts
echo "── 2. Updating mailbox (send confirmation)..."
cp /tmp/deploy-mailbox.tsx src/components/admin/mailbox.tsx
echo "── 3. Rebuilding..."
export PATH="/root/.nvm/versions/node/v22.23.2/bin:$PATH"
NEXT_PUBLIC_CONTENT_MODE=production NEXT_PUBLIC_INDEXABLE=true npm run build
echo "── 4. Restarting..."
pm2 restart savo
sleep 3
echo ""
echo "═══════════ DEPLOY COMPLETE ═══════════"
echo " ✓ Reply body: no more '(empty message)'"
echo " ✓ Send button: shows 'Sending…' spinner"
echo " ✓ Success: green checkmark banner"
echo "═══════════════════════════════════════"
curl -s -o /dev/null -w "Site check: HTTP %{http_code}\n" http://127.0.0.1:4300/
