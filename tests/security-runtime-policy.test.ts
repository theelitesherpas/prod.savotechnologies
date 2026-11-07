import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
describe("production security deployment policy", () => {
  it("runs the web listener as a dedicated, non-root loopback-only principal", () => {
    const unit = read("ops/savo-web.service");
    for (const rule of ["User=savo-web", "Group=savo-web", "--hostname 127.0.0.1 --port 4300", "NoNewPrivileges=yes", "ProtectSystem=strict", "ProtectHome=yes", "PrivateTmp=yes", "CapabilityBoundingSet=", "ProtectProc=invisible", "MemoryMax=1536M"]) expect(unit).toContain(rule);
    const writable = unit.split("\n").find(line => line.startsWith("ReadWritePaths="))!;
    expect(writable).toBe("ReadWritePaths=/var/www/savotechnologies/.next/cache /var/www/savotechnologies/.next/server/route-cache /var/www/savotechnologies/public/uploads");
    expect(unit).not.toContain("User=root");
  });
  it("keeps reminder scheduling non-root without altering stage policy or cadence", () => {
    const unit = read("ops/savo-invoice-reminders.service");
    expect(unit).toContain("User=savo-web"); expect(unit).toContain("run-invoice-reminders.mjs --apply"); expect(unit).toContain("NoNewPrivileges=yes"); expect(unit).not.toContain("User=root");
  });
  it("scopes coarse login throttling away from provider webhooks and mail uploads", () => {
    const http = read("ops/nginx/savo-http-security.conf");
    expect(http).toContain("default \"\""); expect(http).toContain("~^POST:/(admin/login|portal|employee-portal)/?$");
    expect(http).not.toMatch(/~.*(?:webhooks|inbound|compose)/);
    const server = read("ops/nginx/savo-server-security.conf");
    expect(server).toContain("real_ip_header CF-Connecting-IP"); expect(server).not.toContain("set_real_ip_from 0.0.0.0/0"); expect(server).not.toContain("set_real_ip_from ::/0");
  });
  it("refuses mutable-main/root-PM2 deployments or unreviewed automatic schema writes", () => {
    const script = read("scripts/server-update.sh");
    expect(script).toContain("--release FULL_SHA --tree FULL_TREE"); expect(script).toContain("verify-pending-release.mjs"); expect(script).toContain("npm ci --ignore-scripts");
    expect(script).not.toContain("reset --hard FETCH_HEAD"); expect(script).not.toContain("prisma db push"); expect(script).not.toContain("pm2 restart");
    expect(script).not.toContain("backfill-payment-transactions.mjs --apply");
  });
  it("uses bounded image optimization without SVG/private-IP fetching or redirects", () => {
    const config = read("next.config.ts");
    for (const rule of ["dangerouslyAllowSVG: false", "dangerouslyAllowLocalIP: false", "maximumRedirects: 0", "maximumResponseBody: 10_000_000", "maximumDiskCacheSize: 500_000_000"]) expect(config).toContain(rule);
    expect(config).toContain("proxyClientMaxBodySize: 17_000_000"); expect(config).toContain("bodySizeLimit: 11_000_000");
  });
  it("pins workflow actions and keeps credentials/secrets out of dependency execution", () => {
    const ci = read(".github/workflows/ci.yml");
    expect(ci).toContain("contents: read"); expect(ci).toContain("persist-credentials: false"); expect(ci).toContain("verify-source-integrity.mjs --ci"); expect(ci).toContain("npm ci --ignore-scripts");
    expect(ci).not.toMatch(/uses:.*@v\d/); expect(ci).not.toContain("secrets."); expect(ci).not.toContain("npm audit --omit=dev || true");
  });
});
