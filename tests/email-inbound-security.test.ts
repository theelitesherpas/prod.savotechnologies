import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ find: vi.fn(), create: vi.fn(), publish: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: { projectEnquiry: { findFirst: mocks.find }, emailReply: { create: mocks.create } } }));
vi.mock("@/lib/livechat/pubsub", () => ({ publish: mocks.publish }));
vi.mock("@/lib/logger", () => ({ logger: { info: mocks.info, warn: mocks.warn, error: mocks.error } }));
import { POST } from "@/app/api/email/inbound/route";

const testSecret = "test-shared-secret-not-live";
const email = { from: "Test Sender <sender@example.test>", to: "hello@reply.savotechnologies.com", subject: "Reply", text: "Actual message" };
function request(data: unknown = email, init: RequestInit = {}, query = "") {
  return new Request(`https://example.test/api/email/inbound${query}`, {
    method: "POST", headers: { "content-type": "application/json", "x-webhook-secret": testSecret, "x-real-ip": "192.0.2.80" },
    body: JSON.stringify(data), ...init,
  });
}
beforeEach(() => {
  vi.clearAllMocks(); vi.stubEnv("EMAIL_INBOUND_SECRET", testSecret);
  mocks.find.mockResolvedValue(null); mocks.create.mockResolvedValue({ id: "reply-test-id" });
});
afterEach(() => vi.unstubAllEnvs());

function expectNoWrite() { expect(mocks.find).not.toHaveBeenCalled(); expect(mocks.create).not.toHaveBeenCalled(); expect(mocks.publish).not.toHaveBeenCalled(); }

describe("inbound email authentication and storage", () => {
  it("fails closed when the secret is missing", async () => {
    vi.stubEnv("EMAIL_INBOUND_SECRET", "");
    const response = await POST(request());
    expect(response.status).toBe(503); expectNoWrite();
    expect(await response.text()).toBe("");
  });
  it("rejects a missing secret", async () => {
    expect((await POST(request(email, { headers: { "content-type": "application/json" } }))).status).toBe(401);
    expectNoWrite();
  });
  it.each(["wrong", "test-shared-secret-not-livf"])("rejects wrong secret %s", async secret => {
    expect((await POST(request(email, { headers: { "content-type": "application/json", "x-webhook-secret": secret } }))).status).toBe(401);
    expectNoWrite();
  });
  it("retains authenticated JSON delivery and known reply-subdomain alias", async () => {
    const response = await POST(request());
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ ok: true, id: "reply-test-id" });
    expect(mocks.create.mock.calls[0][0].data).toMatchObject({ fromEmail: "sender@example.test", toEmail: "hello@savotechnologies.com", dept: "hello", bodyText: "Actual message" });
    expect(JSON.stringify(mocks.info.mock.calls)).not.toContain("sender@example.test");
    expect(JSON.stringify(mocks.info.mock.calls)).not.toContain("Actual message");
  });
  it("retains query-secret compatibility for existing providers", async () => {
    const response = await POST(request(email, { headers: { "content-type": "application/json" } }, `?secret=${testSecret}`));
    expect(response.status).toBe(201);
  });
  it("does not use query secret to override a wrong header", async () => {
    const response = await POST(request(email, { headers: { "content-type": "application/json", "x-webhook-secret": "wrong" } }, `?secret=${testSecret}`));
    expect(response.status).toBe(401); expectNoWrite();
  });
  it("accepts a named HR recipient without rerouting it to hello", async () => {
    expect((await POST(request({ ...email, to: "Savo HR <hr@reply.savotechnologies.com>" }))).status).toBe(201);
    expect(mocks.create.mock.calls[0][0].data).toMatchObject({ toEmail: "hr@savotechnologies.com", dept: "hr" });
  });
  it("rejects noncompany recipients instead of silently rerouting", async () => {
    expect((await POST(request({ ...email, to: "someone@other.example" }))).status).toBe(422); expectNoWrite();
  });
  it("rejects header-injection sender data", async () => {
    expect((await POST(request({ ...email, from: "sender@example.test\r\nBcc: private@example.test" }))).status).toBe(422); expectNoWrite();
  });
  it("preserves authenticated multipart deliveries", async () => {
    const form = new FormData(); for (const [key, value] of Object.entries(email)) form.set(key, value);
    const response = await POST(request(undefined, { body: form, headers: { "x-webhook-secret": testSecret } }));
    expect(response.status).toBe(201); expect(mocks.create).toHaveBeenCalledOnce();
  });
  it("preserves urlencoded deliveries", async () => {
    const body = new URLSearchParams(email);
    expect((await POST(request(undefined, { body, headers: { "x-webhook-secret": testSecret, "content-type": "application/x-www-form-urlencoded" } }))).status).toBe(201);
  });
  it("returns retryable failure without exposing the failed database operation", async () => {
    mocks.create.mockRejectedValueOnce(new Error("DATABASE_URL=private-value; SELECT secret"));
    const response = await POST(request());
    expect(response.status).toBe(503); expect(await response.text()).toBe("");
    expect(mocks.publish).not.toHaveBeenCalled();
    expect(JSON.stringify(mocks.error.mock.calls)).not.toContain("private-value");
  });
});

describe("inbound email body bounds", () => {
  it("rejects advertised payload over 1MB before parser/storage", async () => {
    expect((await POST(request(email, { headers: { "content-type": "application/json", "x-webhook-secret": testSecret, "content-length": "1000001" } }))).status).toBe(413); expectNoWrite();
  });
  it("rejects actual oversized payload even when length is unadvertised", async () => {
    expect((await POST(request({ ...email, text: "x".repeat(1_000_001) }))).status).toBe(413); expectNoWrite();
  });
  it.each([null, [], "body"])("rejects non-object JSON %s", async data => {
    expect((await POST(request(data))).status).toBe(400); expectNoWrite();
  });
  it("rejects malformed JSON without success acknowledgement", async () => {
    expect((await POST(request(undefined, { body: "{malformed" }))).status).toBe(400); expectNoWrite();
  });
  it("rejects malformed multipart data", async () => {
    expect((await POST(request(undefined, { body: "invalid", headers: { "x-webhook-secret": testSecret, "content-type": "multipart/form-data; boundary=missing" } }))).status).toBe(400); expectNoWrite();
  });
  it("rejects media-type spoofing", async () => {
    expect((await POST(request(email, { headers: { "x-webhook-secret": testSecret, "content-type": "text/plain; application/json" } }))).status).toBe(415); expectNoWrite();
  });
});
