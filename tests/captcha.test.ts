import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Always-on reCAPTCHA gate — unit tests for the lib plus integration
 * tests for every protected route handler. Google's siteverify is
 * mocked; Prisma is mocked; everything else runs for real.
 */

const prismaCreate = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    projectEnquiry: { create: prismaCreate },
    bugReport: { create: vi.fn(async () => ({})) },
  },
}));

const ORIGINAL_SECRET = process.env.RECAPTCHA_SECRET_KEY;
const ORIGINAL_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
const ORIGINAL_ALLOWED = process.env.RECAPTCHA_ALLOWED_HOSTNAMES;

function googleResponds(body: unknown) {
  return vi.fn(async () => new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } }));
}

function jsonReq(url: string, body: unknown, ip = "203.0.113.7") {
  return new Request(url, {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": ip, "user-agent": "vitest" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.resetModules();
  delete process.env.RECAPTCHA_ALLOWED_HOSTNAMES;
});

afterEach(() => {
  vi.unstubAllGlobals();
  if (ORIGINAL_SECRET === undefined) delete process.env.RECAPTCHA_SECRET_KEY;
  else process.env.RECAPTCHA_SECRET_KEY = ORIGINAL_SECRET;
  if (ORIGINAL_SITE_KEY === undefined) delete process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  else process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY = ORIGINAL_SITE_KEY;
  if (ORIGINAL_ALLOWED === undefined) delete process.env.RECAPTCHA_ALLOWED_HOSTNAMES;
  else process.env.RECAPTCHA_ALLOWED_HOSTNAMES = ORIGINAL_ALLOWED;
});

/* ─────────────────────── lib: enforceCaptcha ─────────────────────── */

describe("lib/captcha enforceCaptcha", () => {
  async function load() {
    return import("@/lib/captcha");
  }

  it("fails open when the secret is not configured (dev safety)", async () => {
    delete process.env.RECAPTCHA_SECRET_KEY;
    const { enforceCaptcha } = await load();
    const check = await enforceCaptcha("1.2.3.4", undefined);
    expect(check.ok).toBe(true);
  });

  it("requires a token on EVERY submission once configured", async () => {
    process.env.RECAPTCHA_SECRET_KEY = "unit-test-secret";
    const { enforceCaptcha } = await load();
    for (const bad of [undefined, null, "", "short", 42, { t: 1 }]) {
      const check = await enforceCaptcha("1.2.3.4", bad);
      expect(check).toEqual({ ok: false, captchaRequired: true });
    }
  });

  it("rejects malformed tokens before calling Google", async () => {
    process.env.RECAPTCHA_SECRET_KEY = "unit-test-secret";
    const fetchMock = googleResponds({ success: true, hostname: "localhost" });
    vi.stubGlobal("fetch", fetchMock);
    const { enforceCaptcha } = await load();
    const check = await enforceCaptcha("1.2.3.4", "tiny");
    expect(check).toEqual({ ok: false, captchaRequired: true });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects when Google says success:false", async () => {
    process.env.RECAPTCHA_SECRET_KEY = "unit-test-secret";
    vi.stubGlobal("fetch", googleResponds({ success: false, "error-codes": ["invalid-input-response"] }));
    const { enforceCaptcha } = await load();
    const check = await enforceCaptcha("1.2.3.4", "a-valid-length-token-string");
    expect(check).toEqual({ ok: false, captchaRequired: true });
  });

  it("accepts a valid token solved on an allowed hostname", async () => {
    process.env.RECAPTCHA_SECRET_KEY = "unit-test-secret";
    vi.stubGlobal("fetch", googleResponds({ success: true, hostname: "localhost" }));
    const { enforceCaptcha } = await load();
    const check = await enforceCaptcha("1.2.3.4", "a-valid-length-token-string");
    expect(check).toEqual({ ok: true });
  });

  it("accepts when Google omits the hostname (test-key shape)", async () => {
    process.env.RECAPTCHA_SECRET_KEY = "unit-test-secret";
    vi.stubGlobal("fetch", googleResponds({ success: true }));
    const { enforceCaptcha } = await load();
    const check = await enforceCaptcha("1.2.3.4", "a-valid-length-token-string");
    expect(check).toEqual({ ok: true });
  });

  it("rejects a token solved on a foreign hostname (farming defence)", async () => {
    process.env.RECAPTCHA_SECRET_KEY = "unit-test-secret";
    vi.stubGlobal("fetch", googleResponds({ success: true, hostname: "evil.example" }));
    const { enforceCaptcha } = await load();
    const check = await enforceCaptcha("1.2.3.4", "a-valid-length-token-string");
    expect(check).toEqual({ ok: false, captchaRequired: true });
  });

  it("honours RECAPTCHA_ALLOWED_HOSTNAMES as the host policy", async () => {
    process.env.RECAPTCHA_SECRET_KEY = "unit-test-secret";
    process.env.RECAPTCHA_ALLOWED_HOSTNAMES = "foo.com, BAR.com";
    const { enforceCaptcha } = await load();
    vi.stubGlobal("fetch", googleResponds({ success: true, hostname: "bar.com" }));
    expect((await enforceCaptcha("1.2.3.4", "a-valid-length-token-string")).ok).toBe(true);
    // The derived allowlist (localhost etc.) is replaced by the override.
    vi.stubGlobal("fetch", googleResponds({ success: true, hostname: "localhost" }));
    expect((await enforceCaptcha("1.2.3.4", "a-valid-length-token-string")).ok).toBe(false);
  });

  it("derives allowed hostnames from the site origin (apex + www)", async () => {
    process.env.RECAPTCHA_SECRET_KEY = "unit-test-secret";
    process.env.NEXT_PUBLIC_SITE_URL = "https://www.savotechnologies.com";
    const { enforceCaptcha } = await load();
    vi.stubGlobal("fetch", googleResponds({ success: true, hostname: "savotechnologies.com" }));
    expect((await enforceCaptcha("1.2.3.4", "a-valid-length-token-string")).ok).toBe(true);
  });

  it("returns a friendly error when Google is unreachable", async () => {
    process.env.RECAPTCHA_SECRET_KEY = "unit-test-secret";
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("network down"); }));
    const { enforceCaptcha } = await load();
    const check = await enforceCaptcha("1.2.3.4", "a-valid-length-token-string");
    expect(check.ok).toBe(false);
    expect(check).toHaveProperty("error");
  });

  it("sends the secret, token and ip to Google", async () => {
    process.env.RECAPTCHA_SECRET_KEY = "unit-test-secret";
    const fetchMock = googleResponds({ success: true, hostname: "localhost" });
    vi.stubGlobal("fetch", fetchMock);
    const { enforceCaptcha } = await load();
    await enforceCaptcha("9.9.9.9", "the-visitor-token");
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(init.method).toBe("POST");
    expect(String(init.body)).toContain("secret=unit-test-secret");
    expect(String(init.body)).toContain("response=the-visitor-token");
    expect(String(init.body)).toContain("remoteip=9.9.9.9");
  });
});

/* ───────────────────── lib: logins + config flag ───────────────────── */

describe("lib/captcha enforceLoginCaptcha", () => {
  it("fails open when unconfigured", async () => {
    delete process.env.RECAPTCHA_SECRET_KEY;
    const { enforceLoginCaptcha } = await import("@/lib/captcha");
    expect((await enforceLoginCaptcha("admin", "1.2.3.4", undefined)).ok).toBe(true);
  });

  it("requires verification on the FIRST attempt (no free tries)", async () => {
    process.env.RECAPTCHA_SECRET_KEY = "unit-test-secret";
    const { enforceLoginCaptcha } = await import("@/lib/captcha");
    const check = await enforceLoginCaptcha("admin", "1.2.3.4", undefined);
    expect(check).toEqual({ ok: false, captchaRequired: true });
  });

  it("accepts a valid token", async () => {
    process.env.RECAPTCHA_SECRET_KEY = "unit-test-secret";
    vi.stubGlobal("fetch", googleResponds({ success: true, hostname: "localhost" }));
    const { enforceLoginCaptcha } = await import("@/lib/captcha");
    expect((await enforceLoginCaptcha("client", "1.2.3.4", "the-visitor-token")).ok).toBe(true);
  });
});

describe("lib/captcha requiredForRequest", () => {
  it("mirrors whether the secret is configured", async () => {
    const { requiredForRequest, captchaConfigured } = await import("@/lib/captcha");
    delete process.env.RECAPTCHA_SECRET_KEY;
    expect(captchaConfigured()).toBe(false);
    expect(requiredForRequest()).toBe(false);
    process.env.RECAPTCHA_SECRET_KEY = "unit-test-secret";
    expect(captchaConfigured()).toBe(true);
    expect(requiredForRequest()).toBe(true);
  });
});

/* ───────────────────── route: /api/captcha/required ───────────────────── */

describe("GET /api/captcha/required", () => {
  it("reports required only when BOTH halves are configured", async () => {
    const { GET } = await import("@/app/api/captcha/required/route");

    delete process.env.RECAPTCHA_SECRET_KEY;
    delete process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
    let res = await GET();
    expect(await res.json()).toMatchObject({ required: false, configured: false });

    process.env.RECAPTCHA_SECRET_KEY = "unit-test-secret";
    res = await GET();
    expect(await res.json()).toMatchObject({ required: false, configured: false });

    process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY = "unit-test-sitekey";
    res = await GET();
    expect(await res.json()).toMatchObject({ required: true, configured: true });
    expect(res.headers.get("cache-control")).toBe("no-store");
  });
});

/* ───────────────────── route: POST /api/enquiries ───────────────────── */

describe("POST /api/enquiries (always-on gate)", () => {
  let POST: typeof import("@/app/api/enquiries/route").POST;

  beforeEach(async () => {
    prismaCreate.mockReset().mockResolvedValue({});
    ({ POST } = await import("@/app/api/enquiries/route"));
  });

  const valid = {
    name: "Priya Mehta",
    email: "priya@example.com",
    projectType: "Website",
    message: "Launch site for our studio.",
  };

  it("rejects a bot submission without a captcha token", async () => {
    process.env.RECAPTCHA_SECRET_KEY = "unit-test-secret";
    const res = await POST(jsonReq("http://localhost/api/enquiries", valid));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error).toMatch(/human verification/i);
    expect(prismaCreate).not.toHaveBeenCalled();
  });

  it("rejects when Google rejects the token", async () => {
    process.env.RECAPTCHA_SECRET_KEY = "unit-test-secret";
    vi.stubGlobal("fetch", googleResponds({ success: false }));
    const res = await POST(jsonReq("http://localhost/api/enquiries", { ...valid, captchaToken: "stolen-or-expired-token" }));
    expect(res.status).toBe(400);
    expect(prismaCreate).not.toHaveBeenCalled();
  });

  it("stores a verified submission", async () => {
    process.env.RECAPTCHA_SECRET_KEY = "unit-test-secret";
    vi.stubGlobal("fetch", googleResponds({ success: true, hostname: "localhost" }));
    const res = await POST(jsonReq("http://localhost/api/enquiries", { ...valid, captchaToken: "the-visitor-token" }));
    expect(res.status).toBe(200);
    expect(prismaCreate).toHaveBeenCalledTimes(1);
  });
});

/* ───────────────────── route: POST /api/meeting/submit ───────────────────── */

describe("POST /api/meeting/submit (always-on gate)", () => {
  let POST: typeof import("@/app/api/meeting/submit/route").POST;

  beforeEach(async () => {
    ({ POST } = await import("@/app/api/meeting/submit/route"));
  });

  it("enforces the captcha BEFORE meeting-token validation", async () => {
    process.env.RECAPTCHA_SECRET_KEY = "unit-test-secret";
    const res = await POST(jsonReq("http://localhost/api/meeting/submit", { preferredDate: "2031-01-01", preferredTime: "10:00" }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/human verification/i); // not "Missing token."
  });

  it("with a valid captcha, falls through to meeting-token validation", async () => {
    process.env.RECAPTCHA_SECRET_KEY = "unit-test-secret";
    vi.stubGlobal("fetch", googleResponds({ success: true, hostname: "localhost" }));
    const res = await POST(
      jsonReq("http://localhost/api/meeting/submit", { preferredDate: "2031-01-01", preferredTime: "10:00", captchaToken: "the-visitor-token" }),
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("Missing token.");
  });
});

/* ───────────────────── route: POST /api/bug-reports ───────────────────── */

describe("POST /api/bug-reports (human reports gated, beacons silent)", () => {
  let POST: typeof import("@/app/api/bug-reports/route").POST;

  beforeEach(async () => {
    ({ POST } = await import("@/app/api/bug-reports/route"));
  });

  it("rejects a user_report without a captcha token", async () => {
    process.env.RECAPTCHA_SECRET_KEY = "unit-test-secret";
    const res = await POST(jsonReq("http://localhost/api/bug-reports", { type: "user_report", message: "contact form broke" }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.captchaRequired).toBe(true);
  });

  it("keeps automatic error beacons silent and token-free", async () => {
    process.env.RECAPTCHA_SECRET_KEY = "unit-test-secret";
    const res = await POST(jsonReq("http://localhost/api/bug-reports", { type: "error", message: "Render failed" }));
    expect(res.status).toBe(201);
  });

  it("accepts a user_report with a valid token", async () => {
    process.env.RECAPTCHA_SECRET_KEY = "unit-test-secret";
    vi.stubGlobal("fetch", googleResponds({ success: true, hostname: "localhost" }));
    const res = await POST(
      jsonReq("http://localhost/api/bug-reports", { type: "user_report", message: "contact form broke", captchaToken: "the-visitor-token" }),
    );
    expect(res.status).toBe(201);
  });
});

/* ───────────────────── route: POST /api/agents/salesbot/demo ───────────────────── */

describe("POST /api/agents/salesbot/demo (session start gated)", () => {
  let POST: typeof import("@/app/api/agents/salesbot/demo/route").POST;

  beforeEach(async () => {
    ({ POST } = await import("@/app/api/agents/salesbot/demo/route"));
  });

  it("rejects starting a session without a captcha token", async () => {
    process.env.RECAPTCHA_SECRET_KEY = "unit-test-secret";
    const res = await POST(jsonReq("http://localhost/api/agents/salesbot/demo", { message: "hi there" }, "198.51.100.9"));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.captchaRequired).toBe(true);
  });

  it("runs the first turn with a valid token and hands back a session", async () => {
    process.env.RECAPTCHA_SECRET_KEY = "unit-test-secret";
    vi.stubGlobal("fetch", googleResponds({ success: true, hostname: "localhost" }));
    const res = await POST(
      jsonReq("http://localhost/api/agents/salesbot/demo", { message: "we need a new website", captchaToken: "the-visitor-token" }, "198.51.100.10"),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.sessionId).toMatch(/^[a-zA-Z0-9_-]{6,64}$/);

    // Follow-up turn inside the established session: no captcha needed.
    vi.stubGlobal("fetch", googleResponds({ success: false }));
    const res2 = await POST(
      jsonReq("http://localhost/api/agents/salesbot/demo", { sessionId: json.sessionId, message: "what would it cost?" }, "198.51.100.10"),
    );
    expect(res2.status).toBe(200);
  });
});
