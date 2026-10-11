import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { isPrivateSurface, isSensitiveResponse } from "@/lib/publication-policy";
import { middleware } from "@/middleware";

const fetchMock = vi.fn();
beforeEach(() => { vi.stubGlobal("fetch", fetchMock); fetchMock.mockReset(); });
afterEach(() => vi.unstubAllGlobals());

function request(path: string, init: NonNullable<ConstructorParameters<typeof NextRequest>[1]> = {}) {
  return new NextRequest(`http://localhost:4312${path}`, init);
}

describe("private discovery/cache boundaries", () => {
  it.each(["/meeting/private-token", "/meeting", "/employee-portal/dashboard", "/portal/dashboard", "/admin/meetings", "/api/admin/meetings", "/insights/preview/example", "/case-studies/preview/example", "/unsubscribe", "/%6deeting/private-token", "/bad%ZZ"])("excludes %s from public discovery", path => {
    expect(isPrivateSurface(path)).toBe(true);
  });

  it.each(["/", "/about", "/services/web-development", "/ai-agents", "/case-studies/client", "/insights/article", "/meeting-room-design"])("does not blanket-block marketing page %s", path => {
    expect(isPrivateSurface(path)).toBe(false);
  });

  it("lets the published case-image handler own its public cache policy", () => {
    expect(isPrivateSurface("/api/cs-img")).toBe(true);
    expect(isSensitiveResponse("/api/cs-img")).toBe(false);
  });

  it.each(["/meeting/private-token", "/employee-portal/dashboard", "/portal/dashboard", "/insights/preview/example", "/api/live-chat/session"])("private Markdown request %s never performs a loopback fetch", async path => {
    const response = await middleware(request(path, { headers: { accept: "text/markdown" } }));
    expect(fetchMock).not.toHaveBeenCalled();
    expect(response.headers.get("x-middleware-next")).toBe("1");
    expect(response.headers.get("link")).toBeNull();
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(response.headers.get("x-robots-tag")).toContain("noindex");
    expect(response.headers.get("referrer-policy")).toBe("no-referrer");
  });

  it("uses configured canonical origin, not forwarded-host/proto or private query values", async () => {
    const response = await middleware(request("/services?email=private-value", { headers: { "x-forwarded-host": "attacker.example", "x-forwarded-proto": "http" } }));
    const link = response.headers.get("link") ?? "";
    expect(link).toContain("https://savotechnologies.com/services");
    expect(link).not.toContain("attacker");
    expect(link).not.toContain("private-value");
    expect(response.headers.get("vary")).toContain("Accept");
  });

  it("public Markdown remains readable without cookies, redirect-following or shared caching", async () => {
    fetchMock.mockResolvedValue(new Response('<title>Services</title><main><h1>Engineering</h1><p>Actual public content</p></main>'));
    const response = await middleware(request("/services", { headers: { accept: "text/markdown", cookie: "savo_admin=private-cookie" } }));
    expect(response.status).toBe(200);
    expect(await response.text()).toContain("Actual public content");
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("vary")).toBe("Accept");
    expect(response.headers.get("x-robots-tag")).toBe("noindex");
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe("http://127.0.0.1:4312/services");
    expect(options.redirect).toBe("manual");
    expect(options.cache).toBe("no-store");
    expect(options.signal).toBeInstanceOf(AbortSignal);
    expect(options.headers.cookie).toBeUndefined();
  });

  it("fails safely when the Markdown origin request fails", async () => {
    fetchMock.mockRejectedValue(new Error("internal database credentials"));
    const response = await middleware(request("/services", { headers: { accept: "text/markdown" } }));
    expect(response.status).toBe(502);
    expect(await response.text()).toBe("");
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("bounds unexpectedly large HTML before conversion", async () => {
    fetchMock.mockResolvedValue(new Response("oversized", { headers: { "content-length": "2000001" } }));
    expect((await middleware(request("/services", { headers: { accept: "text/markdown" } }))).status).toBe(502);
  });

  it("keeps browser HTML negotiation on the normal renderer", async () => {
    const response = await middleware(request("/services", { headers: { accept: "text/html, text/markdown" } }));
    expect(fetchMock).not.toHaveBeenCalled();
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });
});

describe("unsafe API methods", () => {
  it.each(["POST", "PUT", "PATCH", "DELETE"])("rejects cross-origin %s before application logic", async method => {
    const response = await middleware(request("/api/admin/meetings/id", { method, headers: { origin: "https://attacker.example", host: "localhost:4312" } }));
    expect(response.status).toBe(403);
  });

  it.each(["POST", "PUT", "PATCH", "DELETE"])("permits same-origin %s to reach route authorization", async method => {
    const response = await middleware(request("/api/admin/meetings/id", { method, headers: { origin: "http://localhost:4312", host: "localhost:4312" } }));
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  it("rejects browser cross-site metadata even without Origin", async () => {
    expect((await middleware(request("/api/enquiries", { method: "POST", headers: { "sec-fetch-site": "cross-site" } }))).status).toBe(403);
  });

  it("retains non-browser webhook requests without Origin", async () => {
    const response = await middleware(request("/api/email/inbound", { method: "POST" }));
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  it.each(["GET", "HEAD", "OPTIONS"])("does not treat %s as a mutation", async method => {
    const response = await middleware(request("/api/health", { method, headers: { origin: "https://other.example" } }));
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });
});
