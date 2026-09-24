import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Integration-style tests for the enquiry + callback route handlers.
 * Prisma is mocked; everything else (validation, honeypot, rate limiting,
 * IP hashing, response shape) runs for real.
 */

const create = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: { projectEnquiry: { create } },
}));

describe("POST /api/enquiries", () => {
  let POST: typeof import("@/app/api/enquiries/route").POST;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();
    ({ POST } = await import("@/app/api/enquiries/route"));
  });

  const validBody = {
    name: "Priya Mehta",
    email: "priya@example.com",
    projectType: "Website",
    message: "Launch site for our studio.",
  };

  function jsonReq(body: unknown, ip: string) {
    return new Request("http://localhost/api/enquiries", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-forwarded-for": ip,
        "user-agent": "vitest",
      },
      body: JSON.stringify(body),
    });
  }

  it("rejects non-JSON content type with 415", async () => {
    const r = new Request("http://localhost/api/enquiries", { method: "POST" });
    const res = await POST(r);
    expect(res.status).toBe(415);
  });

  it("rejects invalid payloads with 400 and a friendly message", async () => {
    const res = await POST(jsonReq({ name: "", email: "nope" }, "10.0.0.1"));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(typeof json.error).toBe("string");
    expect(create).not.toHaveBeenCalled();
  });

  it("stores a valid enquiry and returns ok", async () => {
    create.mockResolvedValue({});
    const res = await POST(jsonReq(validBody, "10.0.0.2"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(create).toHaveBeenCalledTimes(1);

    const stored = create.mock.calls[0][0].data;
    expect(stored.name).toBe("Priya Mehta");
    expect(stored.source).toBe("homepage");
    // IP stored as salted hash prefix — never raw.
    expect(stored.ipHash).toMatch(/^[0-9a-f]{32}$/);
  });

  it("gives honeypot fills a silent success without storing", async () => {
    const res = await POST(jsonReq({ ...validBody, website: "http://spam.example" }, "10.0.0.3"));
    expect(res.status).toBe(200);
    expect(create).not.toHaveBeenCalled();
  });

  it("rate-limits after 5 requests from one IP", async () => {
    create.mockResolvedValue({});
    const ip = "10.7.7.7";
    for (let i = 0; i < 5; i++) {
      const res = await POST(jsonReq(validBody, ip));
      expect(res.status).toBe(200);
    }
    const sixth = await POST(jsonReq(validBody, ip));
    expect(sixth.status).toBe(429);
    expect(sixth.headers.get("retry-after")).toBeTruthy();
    expect(create).toHaveBeenCalledTimes(5);
  });
});

describe("POST /api/callback", () => {
  let POST: typeof import("@/app/api/callback/route").POST;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();
    ({ POST } = await import("@/app/api/callback/route"));
  });

  function jsonReq(body: unknown, ip: string) {
    return new Request("http://localhost/api/callback", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-forwarded-for": ip,
        "user-agent": "vitest",
      },
      body: JSON.stringify(body),
    });
  }

  it("stores a valid callback with normalized phone", async () => {
    create.mockResolvedValue({});
    const res = await POST(jsonReq({ name: "", country: "India", phone: "+919876543210" }, "10.1.1.1"));
    expect(res.status).toBe(200);

    const stored = create.mock.calls[0][0].data;
    expect(stored.projectType).toBe("Callback");
    expect(stored.email).toBeNull();
    expect(stored.phone).toBe("+919876543210");
    expect(stored.message).toContain("India");
    expect(stored.source).toBe("footer-callback");
  });

  it("rejects a phone that does not match the country", async () => {
    const res = await POST(jsonReq({ country: "Singapore", phone: "123456789012" }, "10.1.1.2"));
    expect(res.status).toBe(400);
    expect(create).not.toHaveBeenCalled();
  });

  it("rejects an unknown country", async () => {
    const res = await POST(jsonReq({ country: "Mars", phone: "123456789" }, "10.1.1.3"));
    expect(res.status).toBe(400);
  });

  it("gives honeypot fills a silent success", async () => {
    const res = await POST(
      jsonReq({ country: "India", phone: "9876543210", website: "x" }, "10.1.1.4"),
    );
    expect(res.status).toBe(200);
    expect(create).not.toHaveBeenCalled();
  });
});
