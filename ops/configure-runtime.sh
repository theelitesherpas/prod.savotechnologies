#!/usr/bin/env bash
# Root-only, reviewed runtime installation/preparation. Does not start/stop apps.
set -euo pipefail
[[ "$(id -u)" = 0 ]] || { echo 'Run as root'; exit 1; }
MODE=${1:-}; APP=${2:-/var/www/savotechnologies}
[[ "$MODE" = --install-node || "$MODE" = --prepare ]] || { echo 'Use --install-node or --prepare APP_DIR'; exit 2; }
VERSION=v22.23.4
NODE_ROOT="/opt/savo-runtime/node-$VERSION-linux-x64"
if [[ "$MODE" = --install-node ]]; then
 [[ "$(uname -m)" = x86_64 ]] || { echo 'Reviewed runtime requires Linux x64'; exit 1; }
 install -d -m 755 /opt/savo-runtime
 if [[ ! -x "$NODE_ROOT/bin/node" ]]; then
  TMP=$(mktemp -d /root/savo-node-install.XXXXXX); trap 'rm -rf -- "$TMP"' EXIT
  FILE="node-$VERSION-linux-x64.tar.xz"
  curl --fail --silent --show-error --location --proto '=https' --proto-redir '=https' --tlsv1.2 "https://nodejs.org/dist/$VERSION/$FILE" -o "$TMP/$FILE"
  curl --fail --silent --show-error --location --proto '=https' --proto-redir '=https' --tlsv1.2 "https://nodejs.org/dist/$VERSION/SHASUMS256.txt" -o "$TMP/SHASUMS256.txt"
  HASH=$(awk -v f="$FILE" '$2==f {print $1}' "$TMP/SHASUMS256.txt")
  [[ "$HASH" =~ ^[a-f0-9]{64}$ ]]
  (cd "$TMP"; printf '%s  %s\n' "$HASH" "$FILE" | sha256sum --check --status)
  tar -xJf "$TMP/$FILE" -C /opt/savo-runtime
  chown -R root:root "$NODE_ROOT"; chmod -R go-w "$NODE_ROOT"
  sha256sum "$NODE_ROOT/bin/node" > "$NODE_ROOT/verified-node.sha256"
 fi
 sha256sum --check --status "$NODE_ROOT/verified-node.sha256"
 [[ "$("$NODE_ROOT/bin/node" --version)" = "$VERSION" ]]
 echo 'Verified dedicated Node runtime available; shared Node installations unchanged.'
 exit 0
fi
APP=$(readlink -f "$APP")
[[ "$APP" =~ ^/var/www/savotechnologies-v7\.[A-Za-z0-9.-]+$ ]]
[[ -f "$APP/.env.production" && -d "$APP/.next" && -d "$APP/node_modules" ]]
"$NODE_ROOT/bin/node" "$APP/scripts/verify-source-integrity.mjs"
if ! getent passwd savo-web >/dev/null; then useradd --system --user-group --no-create-home --home-dir /nonexistent --shell /usr/sbin/nologin savo-web; fi
[[ "$(getent passwd savo-web | cut -d: -f7)" = /usr/sbin/nologin ]]
# Protect source/dependencies/build from the public runtime. Never follow links.
find "$APP" \( -path "$APP/.git" -o -path "$APP/.env.production" -o -path "$APP/public/uploads" -o -path "$APP/.next/cache" -o -path "$APP/.next/server/route-cache" \) -prune -o -type d -exec chown root:root {} + -exec chmod 755 {} + -o -type f -exec chown root:root {} + -exec chmod u+rw,go+r,go-w {} +
chmod 700 "$APP/.git"
chown root:savo-web "$APP/.env.production"; chmod 640 "$APP/.env.production"
for p in .next/cache .next/server/route-cache public/uploads; do
 install -d -o savo-web -g savo-web -m 750 "$APP/$p"
 chown -R savo-web:savo-web "$APP/$p"
 find "$APP/$p" -type d -exec chmod 750 {} +
 find "$APP/$p" -type f -exec chmod 640 {} +
done
runuser -u savo-web -- test -r "$APP/.env.production"
if runuser -u savo-web -- test -w "$APP/package.json"; then echo 'Source ownership validation failed'; exit 1; fi
if runuser -u savo-web -- test -w "$APP/.env.production"; then echo 'Environment ownership validation failed'; exit 1; fi
echo 'Non-login principal and narrow writable paths prepared; source/environment bytes retained.'
