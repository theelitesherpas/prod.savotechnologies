import { describe, expect, it } from "vitest";
import { runInNewContext } from "node:vm";
import { googleAnalyticsBootstrap } from "@/lib/google-analytics-bootstrap";
function execute(path: string, referrer = "") {
  let load = () => {}; const scripts: object[] = [];
  const window: { location: { href: string }; dataLayer?: ArrayLike<unknown>[]; addEventListener: (_: string, callback: () => void) => void } = { location: { href: `https://savotechnologies.com${path}` }, addEventListener: (_, callback) => { load = callback; } };
  const document = { referrer, head: { appendChild: (script: object) => scripts.push(script) }, createElement: () => ({}) };
  runInNewContext(googleAnalyticsBootstrap("G-SYNTHETIC"), { window, document, URL, setTimeout: () => 1, clearTimeout: () => {} });
  load(); return { window, scripts };
}
describe("payment return analytics privacy", () => {
  it.each(["/portal/invoices/owned/pay?paypalState=PRIVATE&token=PRIVATE", "/portal", "/admin/settings/payments", "/employee-portal", "/meeting/private-link", "/unsubscribe?token=PRIVATE", "/api/webhooks/paypal", "/insights/preview/private", "/%70ortal/invoices/x/pay?token=PRIVATE"])("never loads Google analytics on %s", path => {
    const { window, scripts } = execute(path); expect(window.dataLayer).toBeUndefined(); expect(scripts).toEqual([]);
  });
  it("retains deferred public analytics without query/hash or referrer secrets", () => {
    const { window, scripts } = execute("/services?paypalState=PRIVATE#PRIVATE", "https://example.invalid/return?token=PRIVATE#PRIVATE");
    expect(scripts).toHaveLength(1); const config = Array.from(window.dataLayer![1]);
    expect(config).toEqual(["config", "G-SYNTHETIC", { page_location: "https://savotechnologies.com/services", page_referrer: "https://example.invalid/return" }]);
    expect(JSON.stringify(config)).not.toContain("PRIVATE");
  });
  it("omits private referrer paths entirely", () => {
    const { window } = execute("/services", "https://savotechnologies.com/portal/invoices/private/pay?token=PRIVATE");
    expect(Array.from(window.dataLayer![1])[2]).toMatchObject({ page_referrer: "" });
  });
  it("rejects malformed tracking identifiers instead of embedding executable configuration", () => expect(googleAnalyticsBootstrap('G-test"</script>')).toBe(""));
});
