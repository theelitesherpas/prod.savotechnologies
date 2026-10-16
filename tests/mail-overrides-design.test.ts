import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ override: vi.fn(), transport: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: { emailTemplate: { findUnique: mocks.override } } }));
vi.mock("nodemailer", () => ({ default: { createTransport: mocks.transport } }));
vi.mock("@/lib/logger", () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));
import { renderTemplate } from "@/lib/mail";
import { UNSUBSCRIBE_PLACEHOLDER } from "@/lib/mail/templates";

beforeEach(() => { mocks.override.mockReset(); mocks.transport.mockClear(); });
afterEach(() => vi.unstubAllEnvs());

describe("custom content inherits v7 email design", () => {
  it("wraps a saved HR override without rewriting the stored subject/body or routing", async () => {
    mocks.override.mockResolvedValue({ subject: "Offer for {{candidateName}}", body: "Dear {{candidateName}},\n\nPosition: {{position}}" });
    const mail = await renderTemplate("offerLetter", { candidateName: "R&D", position: "Engineer" });
    expect(mail?.subject).toBe("Offer for R&D");
    expect(mail?.text).toBe("Dear R&D,\n\nPosition: Engineer");
    expect(mail?.html).toContain("Offer for R&amp;D");
    expect(mail?.html).toContain("Human Resources");
    expect(mail?.html).toContain("People &amp; careers");
    expect(mail?.html).not.toContain("mailto:");
    expect(mail?.html).toContain("Savo v7 correspondence");
    expect(mocks.transport).not.toHaveBeenCalled();
  });
  it("preserves custom HTML while applying the shared customer shell and unsigned unsubscribe placeholder", async () => {
    mocks.override.mockResolvedValue({ subject: "Hello {{name}}", body: '<p><strong>{{name}}</strong>, your brief is received.</p>' });
    const mail = await renderTemplate("enquiryAck", { name: "A < B" }, "sample@example.invalid");
    expect(mail?.html).toContain("<strong>A &lt; B</strong>");
    expect(mail?.html).toContain(UNSUBSCRIBE_PLACEHOLDER);
    expect(mail?.unsubscribeEmail).toBe("sample@example.invalid");
    expect(mail?.html).toContain("Client services");
    expect(mail?.html).not.toContain("mailto:");
    expect(mocks.transport).not.toHaveBeenCalled();
  });
  it("keeps multiline plain-body values readable without treating variable markup as HTML", async () => {
    mocks.override.mockResolvedValue({ subject: "Joining details", body: "Hello {{name}},\n\n{{documents}}" });
    const mail = await renderTemplate("offerLetter", { name: '<strong>Sample</strong>', documents: "Photo ID\nQualification certificate" });
    expect(mail?.html).toContain("&lt;strong&gt;Sample&lt;/strong&gt;");
    expect(mail?.html).not.toContain("<strong>Sample</strong>");
    expect(mail?.html).toContain("Photo ID<br>Qualification certificate");
    expect(mocks.transport).not.toHaveBeenCalled();
  });
  it("adds a validated Pay now action to saved invoice bodies without replacing their content", async () => {
    mocks.override.mockResolvedValue({ subject: "Invoice {{number}}", body: "Dear {{name}},\n\nYour agreed billing details are ready." });
    const vars = { name: "Example", number: "TEST-001", amountMinor: "12345", currency: "USD", paymentLink: "https://rzp.io/i/TEST-123", invoiceStatus: "sent" };
    const mail = await renderTemplate("invoiceIssued", vars);
    expect(mail?.html).toContain("Your agreed billing details are ready.");
    expect(mail?.html).toContain('href="https://rzp.io/i/TEST-123"');
    expect(mail?.html).toContain("Pay now");
    expect(mail?.text).toContain("Pay now: https://rzp.io/i/TEST-123");
    const paid = await renderTemplate("invoicePaid", { ...vars, invoiceStatus: "paid" });
    expect(paid?.html).not.toContain("Pay now");
    expect(paid?.text).not.toContain("Pay now:");
    expect(mocks.transport).not.toHaveBeenCalled();
  });
  it("keeps default HR mail and lookup-failure fallback on the same design", async () => {
    mocks.override.mockResolvedValueOnce(null).mockRejectedValueOnce(new Error("Test lookup failure"));
    const first = await renderTemplate("applicationAck", { name: "Aarav", role: "Engineer" });
    const second = await renderTemplate("applicationAck", { name: "Aarav", role: "Engineer" });
    expect(second?.html).toBe(first?.html);
    expect(second?.html).toContain("People &amp; careers");
    expect(second?.html).not.toContain("mailto:");
    expect(mocks.transport).not.toHaveBeenCalled();
  });
});
