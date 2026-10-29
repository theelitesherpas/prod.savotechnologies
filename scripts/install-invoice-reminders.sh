#!/usr/bin/env bash
# Approved VPS release only. Validates existing private env; never creates or
# prints secrets. Dry-run by default; --apply installs the 15-minute cron job.
set -euo pipefail
APP_DIR=/var/www/savotechnologies
export NVM_DIR="$HOME/.nvm"
[ ! -s "$NVM_DIR/nvm.sh" ] || . "$NVM_DIR/nvm.sh"
cd "$APP_DIR"
set -a; . ./.env.production; set +a
node scripts/verify-runtime-env.mjs live
[ "${INVOICE_REMINDERS_ENABLED:-false}" = true ] || { echo "Enable the approved reminder configuration first."; exit 1; }
node -e 'if(!/^[A-Za-z0-9_-]{32,256}$/.test(process.env.INVOICE_REMINDER_SECRET||""))process.exit(1)'
if [ "${1:-}" != --apply ]; then echo "Configuration valid. Would install the private 15-minute invoice-reminder runner; use --apply."; exit 0; fi
[ "$(id -u)" -eq 0 ] || { echo "Run the approved installation as root."; exit 1; }
umask 077
cat > /usr/local/sbin/savo-invoice-reminders <<'RUNNER'
#!/usr/bin/env bash
set -euo pipefail
umask 077
export NVM_DIR="$HOME/.nvm"
[ ! -s "$NVM_DIR/nvm.sh" ] || . "$NVM_DIR/nvm.sh"
cd /var/www/savotechnologies
exec flock -n /run/savo-invoice-reminders.lock node --env-file=.env.production scripts/run-invoice-reminders.mjs --apply
RUNNER
chmod 700 /usr/local/sbin/savo-invoice-reminders
cat > /etc/cron.d/savo-invoice-reminders <<'CRON'
SHELL=/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
*/15 * * * * root /usr/local/sbin/savo-invoice-reminders >> /var/log/savo-invoice-reminders.log 2>&1
CRON
chmod 644 /etc/cron.d/savo-invoice-reminders
touch /var/log/savo-invoice-reminders.log
chmod 600 /var/log/savo-invoice-reminders.log
cat > /etc/logrotate.d/savo-invoice-reminders <<'ROTATE'
/var/log/savo-invoice-reminders.log {
  daily
  rotate 14
  compress
  missingok
  notifempty
  create 0600 root root
}
ROTATE
chmod 644 /etc/logrotate.d/savo-invoice-reminders
echo "Installed. The application enforces 9 AM IST, due-date stages, eligibility and deduplication. No immediate send was requested by this installer."
