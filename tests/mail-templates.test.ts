import { describe, expect, it } from "vitest";
import {
  applicationAck,
  askSavoHandoffAck,
  callbackAck,
  clientPasswordReset,
  clientWelcome,
  enquiryAck,
  invoiceIssued,
  invoiceOverdue,
  invoicePaid,
  milestoneUpdate,
  projectUpdate,
  teamApplication,
  teamAskSavo,
  teamCallback,
  teamEnquiry,
} from "@/lib/mail/templates";

/** Every template must render a subject, html and text — no throw, no empty. */
const templates: [string, () => ReturnType<typeof enquiryAck>][] = [
  ["enquiryAck", () => enquiryAck("Priya Sharma", "Website")],
  ["callbackAck", () => callbackAck("Rohan Desai", "India")],
  ["askSavoHandoffAck", () => askSavoHandoffAck("How do you handle <script>alert(1)</script>?")],
  ["applicationAck", () => applicationAck("Aarav Mehta", "Flutter Developer")],
  ["clientWelcome", () => clientWelcome("Sara Khan", "sara@acme.com", "TempPass123!x")],
  ["clientPasswordReset", () => clientPasswordReset("Sara Khan", "NewPass456!y")],
  ["invoiceIssued", () => invoiceIssued("Acme", "SAVO-2026-001", 250000, "INR", new Date("2026-10-01"))],
  ["invoicePaid", () => invoicePaid("Acme", "SAVO-2026-001", 250000, "INR")],
  ["invoiceOverdue", () => invoiceOverdue("Acme", "SAVO-2026-001", 250000, "INR", 7)],
  ["milestoneUpdate", () => milestoneUpdate("Acme", "Commerce Platform", "Design sign-off", "done")],
  ["projectUpdate", () => projectUpdate("Acme", "Commerce Platform", "Weekly demo", "Checkout v2 is live on staging.")],
  ["teamEnquiry", () =>
    teamEnquiry({
      name: "Test Person",
      email: "t@e.com",
      projectType: "AI / AI Agent",
      message: "A message",
      source: "contact",
    })],
  ["teamApplication", () =>
    teamApplication({ name: "Cand", email: "c@e.com", role: "Dev", message: "Hire me" })],
  ["teamCallback", () => teamCallback({ name: "CB", phone: "+911234567890", country: "India" })],
  ["teamAskSavo", () => teamAskSavo({ email: "v@e.com", question: "Deep question?" })],
];

describe("mail templates", () => {
  it.each(templates)("%s renders subject, html and text", (_name, render) => {
    const t = render();
    expect(t.subject.length).toBeGreaterThan(5);
    expect(t.html).toContain("<!doctype html>");
    expect(t.html.length).toBeGreaterThan(500);
    expect(t.text.length).toBeGreaterThan(40);
  });

  it("escapes HTML in user content", () => {
    const t = askSavoHandoffAck('<img src=x onerror="alert(1)">');
    expect(t.html).not.toContain('<img src=x');
    expect(t.html).toContain("&lt;img");
  });

  it("formats invoice amounts in rupees", () => {
    const t = invoiceIssued("Acme", "INV-1", 250000, "INR", null);
    expect(t.subject).toContain("₹2,500");
  });
});
