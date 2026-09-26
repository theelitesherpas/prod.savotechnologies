import { describe, expect, it } from "vitest";
import { sameOrigin, readJsonBody, isJsonRequest, clientIp } from "@/lib/api";

function req(init: Partial<RequestInit> & { url?: string } = {}) {
  return new Request(init.url ?? "http://localhost:4311/api/test", {
    method: "POST",
    ...init,
  });
}

describe("sameOrigin", () => {
  it("allows matching origin and host", () => {
    const r = req({ headers: { origin: "http://localhost:4311", host: "localhost:4311" } });
    expect(sameOrigin(r)).toBe(true);
  });

  it("rejects a foreign origin (CSRF)", () => {
    const r = req({ headers: { origin: "https://evil.example", host: "localhost:4311" } });
    expect(sameOrigin(r)).toBe(false);
  });

  it("allows absent origin (non-browser clients)", () => {
    const r = req({ headers: { host: "localhost:4311" } });
    expect(sameOrigin(r)).toBe(true);
  });

  it("rejects malformed origin", () => {
    const r = req({ headers: { origin: "http://[::1", host: "localhost:4311" } });
    expect(sameOrigin(r)).toBe(false);
  });
});

describe("readJsonBody", () => {
  it("parses valid JSON", async () => {
    const r = req({ body: JSON.stringify({ a: 1 }) });
    const out = await readJsonBody(r);
    expect(out.ok).toBe(true);
    if (out.ok) expect(out.data).toEqual({ a: 1 });
  });

  it("rejects malformed JSON", async () => {
    const r = req({ body: "{nope" });
    const out = await readJsonBody(r);
    expect(out.ok).toBe(false);
  });

  it("rejects oversized bodies", async () => {
    const r = req({ body: JSON.stringify({ big: "x".repeat(5000) }) });
    const out = await readJsonBody(r, 1000);
    expect(out.ok).toBe(false);
  });
});

describe("request helpers", () => {
  it("detects JSON content type", () => {
    expect(isJsonRequest(req({ headers: { "content-type": "application/json" } }))).toBe(true);
    expect(
      isJsonRequest(req({ headers: { "content-type": "application/x-www-form-urlencoded" } })),
    ).toBe(false);
  });

  it("extracts the proxy-appended (last) forwarded hop - the first hop is client-spoofable", () => {
    const r = req({ headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" } });
    expect(clientIp(r)).toBe("5.6.7.8");
  });

  it("prefers x-real-ip over x-forwarded-for", () => {
    const r = req({ headers: { "x-real-ip": "9.9.9.9", "x-forwarded-for": "1.2.3.4, 5.6.7.8" } });
    expect(clientIp(r)).toBe("9.9.9.9");
  });

  it("ignores malformed forwarded hops", () => {
    const r = req({ headers: { "x-forwarded-for": "evil.example.com, 5.6.7.8" } });
    expect(clientIp(r)).toBe("5.6.7.8");
  });

  it("falls back to unknown", () => {
    expect(clientIp(req())).toBe("unknown");
  });
});
