import { createHmac } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { enquiryAck, shell, UNSUBSCRIBE_PLACEHOLDER } from "@/lib/mail/templates";
import { unsubscribeSig, unsubscribeUrl, withSignedUnsubscribe } from "@/lib/mail/unsubscribe";

const mocks = vi.hoisted(() => ({ send: vi.fn(), suppression: vi.fn(), sent: vi.fn() }));
vi.mock("nodemailer", () => ({ default: { createTransport: () => ({ sendMail: mocks.send }) } }));
vi.mock("@/lib/prisma", () => ({ prisma: { mailSuppress: { findUnique: mocks.suppression }, sentEmail: { create: mocks.sent } } }));
vi.mock("@/lib/logger", () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));
beforeEach(() => { mocks.send.mockReset(); mocks.send.mockResolvedValue({}); mocks.suppression.mockReset(); mocks.suppression.mockResolvedValue(null); mocks.sent.mockReset(); mocks.sent.mockResolvedValue({}); vi.stubEnv("ENQUIRY_IP_SALT", "test-only-mail-salt"); });
afterEach(() => vi.unstubAllEnvs());

describe("server-only unsubscribe signing", () => {
  it("preserves the legacy HMAC algorithm/case normalization", () => {
    const expected = createHmac("sha256", "test-only-mail-salt").update("person@example.test").digest("hex").slice(0, 32);
    expect(unsubscribeSig("Person@Example.Test")).toBe(expected);
    expect(unsubscribeSig("other@example.test")).not.toBe(expected);
  });
  it("encodes email parameters safely", () => {
    const url = new URL(unsubscribeUrl("person+test@example.test"));
    expect(url.searchParams.get("email")).toBe("person+test@example.test");
    expect(url.searchParams.get("sig")).toMatch(/^[a-f0-9]{32}$/);
  });
  it("client previews carry no HMAC or server secret", () => {
    const preview = enquiryAck("Person", "Website", "person@example.test");
    expect(preview.html).toContain(UNSUBSCRIBE_PLACEHOLDER);
    expect(preview.html).not.toContain("sig="); expect(preview.html).not.toContain("test-only-mail-salt");
  });
  it("finalizes and HTML-escapes the link at the server boundary", () => {
    const preview = enquiryAck("Person", "Website", "person@example.test");
    const final = withSignedUnsubscribe(preview);
    expect(final.html).not.toContain(UNSUBSCRIBE_PLACEHOLDER);
    expect(final.html).toContain(unsubscribeUrl("person@example.test").replace(/&/g, "&amp;"));
    expect(preview.html).toContain(UNSUBSCRIBE_PLACEHOLDER);
    expect(withSignedUnsubscribe(final)).toEqual(final);
  });
  it("leaves non-customer mail unchanged", () => {
    const template = { subject: "Internal", html: shell({ preheader: "Internal", heading: "", bodyHtml: "Test" }), text: "Test" };
    expect(withSignedUnsubscribe(template)).toBe(template);
  });
  it("SMTP sends signed body and matching one-click headers", async () => {
    vi.stubEnv("MAIL_HOST", "smtp.invalid");
    vi.stubEnv("MAIL_DELIVERY_MODE", "live");
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_CONTENT_MODE", "production");
    const { sendMail } = await import("@/lib/mail");
    expect(await sendMail("person@example.test", enquiryAck("Person", "Website", "person@example.test"))).toBe(true);
    const message = mocks.send.mock.calls[0][0];
    expect(message.html).not.toContain(UNSUBSCRIBE_PLACEHOLDER);
    expect(message.html).toContain("&amp;sig=");
    expect(message.headers["List-Unsubscribe"]).toBe(`<${unsubscribeUrl("person@example.test")}>`);
    expect(message.headers["List-Unsubscribe-Post"]).toBe("List-Unsubscribe=One-Click");
  });
});
