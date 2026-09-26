import { describe, expect, it } from "vitest";
import { TEMPLATE_REGISTRY } from "@/lib/mail/registry";
import { askSavoHandoffAck, invoiceIssued } from "@/lib/mail/templates";

/** Every registered template must render a subject, html and text — no throw, no empty. */
describe("mail templates", () => {
  it.each(TEMPLATE_REGISTRY.map((e) => [e.key, e] as const))(
    "%s renders subject, html and text",
    (_key, entry) => {
      const t = entry.default(entry.vars);
      expect(t.subject.length).toBeGreaterThan(5);
      expect(t.html).toContain("<!doctype html>");
      expect(t.html.length).toBeGreaterThan(500);
      expect(t.text.length).toBeGreaterThan(40);
    },
  );

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
