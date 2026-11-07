#!/usr/bin/env bash
# Code-only pinned updater AFTER migration to the isolated systemd runtime.
# No mutable-main deployment, arbitrary lifecycle hooks or automatic schema/data writes.
# Usage: bash scripts/server-update.sh --release SHA --tree SHA --backup VERIFIED_FULL_DIR
set -euo pipefail
[[ $# = 6 && "$1" = --release && "$3" = --tree && "$5" = --backup ]] || { echo 'Require --release FULL_SHA --tree FULL_TREE --backup VERIFIED_FULL_DIR'; exit 2; }
RELEASE=$2; TREE=$4; BACKUP=$6
[[ "$RELEASE" =~ ^[a-f0-9]{40}$ && "$TREE" =~ ^[a-f0-9]{40}$ && "$BACKUP" =~ ^/root/savo-backups/full-[0-9]{8}T[0-9]{6}Z$ ]] || exit 2
[[ "$(id -u)" = 0 ]] || { echo 'Run as root'; exit 1; }
# A reset must never modify the shell script while bash is still reading it.
if [[ ${SAVO_UPDATER_COPY:-0} != 1 ]]; then
 COPY=$(mktemp /root/savo-pinned-updater.XXXXXX); chmod 700 "$COPY"; cp -- "$0" "$COPY"
 export SAVO_UPDATER_COPY=1
 exec bash "$COPY" "$@"
fi
[[ "$0" =~ ^/root/savo-pinned-updater\.[A-Za-z0-9]{6}$ ]] || { echo 'Invalid updater execution context'; exit 2; }
trap 'rm -f -- "$0"' EXIT
umask 077
APP=/var/www/savotechnologies
REPO=https://github.com/theelitesherpas/prod.savotechnologies.git
NODE_ROOT=/opt/savo-runtime/node-v22.23.4-linux-x64
export PATH="$NODE_ROOT/bin:$PATH" GIT_CONFIG_NOSYSTEM=1 GIT_CONFIG_GLOBAL=/dev/null
[[ -x "$NODE_ROOT/bin/node" ]]
systemctl cat savo-web.service >/dev/null # Never fall back to a root PM2 process.
cd "$APP"
CURRENT=$(git rev-parse HEAD)
test -z "$(git status --porcelain -uno)"
node scripts/verify-source-integrity.mjs --expected-commit="$CURRENT" --expected-tree="$(git rev-parse HEAD^{tree})"
export BACKUP CURRENT
node --input-type=module <<'NODE'
import assert from'node:assert/strict';import{readFileSync,createReadStream}from'node:fs';import{createHash}from'node:crypto';import{execFileSync}from'node:child_process';
const b=process.env.BACKUP,v=JSON.parse(readFileSync(b+'/VERIFIED.json')),m=JSON.parse(readFileSync(b+'/manifest.json')),hashes=JSON.parse(readFileSync(b+'/SHA256.json'));
assert(v.isolatedDatabaseRestore&&v.archiveExtractAndCompare&&m.commit===process.env.CURRENT,'A verified full backup of the CURRENT release is required');
for(const[f,expected]of Object.entries(hashes)){const h=createHash('sha256');for await(const chunk of createReadStream(b+'/'+f))h.update(chunk);assert.equal(h.digest('hex'),expected,'Backup checksum mismatch');}
const archived=execFileSync('tar',['-xzOf',b+'/website.tar.gz','./.env.production']);assert(archived.equals(readFileSync('.env.production')),'Environment changed since backup');
NODE
# No branch name, tag or attacker-controlled remote HEAD substitutes for the pin.
git -c core.hooksPath=/dev/null fetch --no-tags "$REPO" "$RELEASE"
test "$(git rev-parse FETCH_HEAD)" = "$RELEASE"
test "$(git rev-parse "$RELEASE^{tree}")" = "$TREE"
git merge-base --is-ancestor "$CURRENT" "$RELEASE"
test -z "$(git rev-list --merges "$CURRENT..$RELEASE")"
node ops/verify-pending-release.mjs "$RELEASE" "$TREE"
# Schema releases require a separate, reviewed additive migration procedure.
git diff --exit-code "$CURRENT" "$RELEASE" -- prisma > /dev/null
rollback(){
 code=$?; trap - ERR; set +e
 echo 'Update failed: restore code/runtime only; retain all current business data and secrets.'
 systemctl stop savo-web.service
 git -c core.hooksPath=/dev/null reset --hard "$CURRENT"
 rm -rf -- .next node_modules
 tar -xzf "$BACKUP/website.tar.gz" ./.next ./node_modules
 bash ops/configure-runtime.sh --prepare "$APP"
 systemctl restart savo-web.service
 exit "$code"
}
trap rollback ERR
git -c core.hooksPath=/dev/null reset --hard "$RELEASE"
node scripts/verify-source-integrity.mjs --expected-commit="$RELEASE" --expected-tree="$TREE"
npm ci --ignore-scripts --include=dev --registry=https://registry.npmjs.org/
node node_modules/prisma/build/index.js generate
npm audit --audit-level=moderate
node ops/run-with-production-env.mjs verify
node ops/run-with-production-env.mjs build
bash ops/configure-runtime.sh --prepare "$APP"
systemctl restart savo-web.service
for n in {1..20}; do if [[ "$(curl --max-time 5 -s -o /dev/null -w '%{http_code}' http://127.0.0.1:4300/portal)" = 200 ]]; then ready=true; break; fi; sleep 2; done
[[ ${ready:-false} = true ]]
systemctl is-active --quiet savo-invoice-reminders.timer
trap - ERR
echo "Pinned code-only update complete: $RELEASE. Current database/payment configuration retained."
