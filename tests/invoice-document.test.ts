import { describe, expect, it } from "vitest";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { PDFDict, PDFDocument, PDFName, PDFString, PDFRawStream, decodePDFRawStream } from "pdf-lib";
import { renderInvoicePdf } from "@/lib/invoice-pdf";
import { invoiceBalances, invoiceDate, invoiceMoney, invoiceFilename, type InvoiceDocument } from "@/lib/invoice-document";

const invoice: InvoiceDocument = {
  number: "TEST-2026-001", amount: 250050, currency: "INR", status: "sent",
  issuedAt: new Date("2026-10-01T00:00:00Z"), dueDate: new Date("2026-10-15T00:00:00Z"), paidAt: null,
  notes: "Synthetic invoice for local review only. Not payable.",
  client: { name: "Sara Meier", company: "Example Zürich AG", email: "sample@example.invalid" },
  project: { code: "TEST-PRJ-001", title: "Example product development" },
};
const now = new Date("2026-10-16T12:00:00Z");
describe("invoice financial document", () => {
  it.each([
    ["sent", { total: 250050, paid: 0, due: 250050 }],
    ["overdue", { total: 250050, paid: 0, due: 250050 }],
    ["paid", { total: 250050, paid: 250050, due: 0 }],
    ["cancelled", { total: 250050, paid: 0, due: 0 }],
  ] as const)("uses exact stored amounts for %s balances", (status, expected) => {
    expect(invoiceBalances({ amount: invoice.amount, status })).toEqual(expected);
  });
  it.each(["INR", "USD", "CHF", "EUR", "GBP", "AED"])("retains %s and fractional minor units with two decimals", currency => {
    expect(invoiceMoney(250050, currency)).toContain(currency);
    expect(invoiceMoney(250050, currency)).toContain("2,500.50");
    expect(invoiceMoney(250000, currency)).toContain("2,500.00");
    expect(invoiceMoney(0, currency)).toContain("0.00");
  });
  it("does not silently publish malformed financial values", () => {
    for (const amount of [-1, 1.5, NaN, Infinity]) expect(() => invoiceMoney(amount, "INR")).toThrow();
    expect(() => invoiceMoney(100, "BAD-CURRENCY")).toThrow();
  });
  it("uses stable dates and safe filenames", () => {
    expect(invoiceDate(invoice.issuedAt)).toBe("01 Oct 2026");
    expect(invoiceDate(null)).toBe("Not specified");
    expect(invoiceFilename('INV/2026\r\n"')).toMatch(/^Savo-Invoice-[A-Za-z0-9_-]+\.pdf$/);
  });
  it.each(["sent", "paid", "overdue", "cancelled"] as const)("generates a valid standalone A4 PDF for %s", async status => {
    const bytes = await renderInvoicePdf({ ...invoice, status, paidAt: status === "paid" ? now : null }, now);
    expect(new TextDecoder().decode(bytes.slice(0, 5))).toBe("%PDF-");
    const loaded = await PDFDocument.load(bytes);
    expect(loaded.getTitle()).toBe("Invoice TEST-2026-001");
    expect(loaded.getPageCount()).toBe(1);
    expect(loaded.getPage(0).getSize().width).toBeCloseTo(595.28);
    expect(loaded.getPage(0).getSize().height).toBeCloseTo(841.89);
    expect(bytes.byteLength).toBeLessThan(500_000);
    // A text-extractable PDF can still have broken subset outlines in Apple
    // Preview. Require both complete static font programs, not just a title.
    const fontPrograms = loaded.context.enumerateIndirectObjects()
      .map(([, object]) => object)
      .filter((object): object is PDFRawStream => object instanceof PDFRawStream)
      .map(stream => Buffer.from(decodePDFRawStream(stream).decode()));
    for (const style of ["Regular", "SemiBold"]) {
      const original = readFileSync(`public/fonts/inter/Inter-PDF-${style}.ttf`);
      expect(fontPrograms.some(program => program.equals(original))).toBe(true);
    }
    mkdirSync("tmp/invoice-pdf", { recursive: true });
    writeFileSync(`tmp/invoice-pdf/${status}.pdf`, bytes);
  });
  it.each(["INR", "USD", "CHF", "EUR", "GBP", "AED"])("keeps the largest stored %s amount in a one-page document without shrinking body type", async currency => {
    const bytes = await renderInvoicePdf({ ...invoice, amount: 2147483647, currency, client: { ...invoice.client, businessId: "STPLCS02684" } }, now);
    const pdf = await PDFDocument.load(bytes);
    expect(pdf.getPageCount()).toBe(1);
    expect(bytes.byteLength).toBeLessThan(500000);
    mkdirSync("tmp/invoice-pdf", { recursive: true });
    writeFileSync(`tmp/invoice-pdf/maximum-${currency}.pdf`, bytes);
  });
  it.each(["sent", "overdue", "paid", "cancelled"] as const)("preserves the status and gates stale portal payment actions for %s", async status => {
    const payUrl = "https://www.savotechnologies.com/portal/invoices/synthetic-review-only/pay";
    const bytes = await renderInvoicePdf({ ...invoice, status, payUrl }, now);
    const pdf = await PDFDocument.load(bytes);
    const annotations = pdf.getPages().flatMap(page => {
      const annotations = page.node.Annots();
      return annotations ? Array.from({ length: annotations.size() }, (_, index) => annotations.lookup(index, PDFDict)) : [];
    });
    expect(pdf.getPageCount()).toBe(1);
    expect(annotations).toHaveLength(["sent", "overdue"].includes(status) ? 1 : 0);
    if (annotations.length) {
      expect(annotations[0].lookup(PDFName.of("A"), PDFDict).lookup(PDFName.of("URI"), PDFString).decodeText()).toBe(payUrl);
    }
    if (status === "sent") writeFileSync("tmp/invoice-pdf/portal-checkout.pdf", bytes);
  });
  it.each([
    { payUrl: "javascript:alert(1)" }, { payUrl: "https://user:secret@example.invalid/pay" },
    { payUrl: "https://example.invalid:444/pay" }, { payUrl: "https://example.invalid/pay\n?bad=1" },
    { paymentLink: "javascript:bad", payUrl: "https://www.savotechnologies.com/portal/invoices/synthetic/pay" },
    { amount: 0, payUrl: "https://www.savotechnologies.com/portal/invoices/synthetic/pay" },
  ])("does not annotate unsafe, zero-value or invalid-manual-link fallbacks: %j", async input => {
    const pdf = await PDFDocument.load(await renderInvoicePdf({ ...invoice, ...input }, now));
    expect(pdf.getPages().every(page => !page.node.Annots() || page.node.Annots()!.size() === 0)).toBe(true);
  });
  it("keeps oversized legacy service descriptions on one page", async () => {
    const bytes = await renderInvoicePdf({ ...invoice, notes: "", project: { code: "SYNTHETIC-SERVICE-END", title: "Synthetic detailed service scope. ".repeat(180) } }, now);
    expect((await PDFDocument.load(bytes)).getPageCount()).toBe(1);
    writeFileSync("tmp/invoice-pdf/long-service.pdf", bytes);
  });
  it("keeps exceptionally long legacy billing fields on one page", async () => {
    const bytes = await renderInvoicePdf({ ...invoice, notes: "", client: { ...invoice.client, company: "Synthetic legacy billing company ".repeat(100), name: "BILLING-END-MARKER", businessId: "STPLCS02684" } }, now);
    expect((await PDFDocument.load(bytes)).getPageCount()).toBe(1);
    writeFileSync("tmp/invoice-pdf/long-billing.pdf", bytes);
  });
  it.each(["sent", "overdue", "paid", "cancelled"] as const)("fits all three task rows, full optional address and notes on one A4 page (%s)", async status => {
    const bytes = await renderInvoicePdf({
      ...invoice, status,
      description: `Website implementation\n${"Completed agreed development and testing. ".repeat(50)}`,
      notes: "Invoice/payment notes. ".repeat(20),
      items: [{ description: "Booking form development", amount: 100000 }, { description: "Payment gateway integration", amount: 100000 }, { description: "QA and release", amount: 50050 }],
      payUrl: "https://www.savotechnologies.com/portal/invoices/example/pay",
      client: { ...invoice.client, businessId: "STPLCS02684", addressLine1: "14 Example Street", addressLine2: "Suite 205", city: "Zürich", region: "Zürich", postalCode: "8001", country: "Switzerland" },
    }, now);
    expect((await PDFDocument.load(bytes)).getPageCount()).toBe(1);
    writeFileSync(`tmp/invoice-pdf/tasks-address-${status}.pdf`, bytes);
  });
  it.each([0, 1, 2, 3])("keeps sparse invoices balanced on one page with %i tasks", async count => {
    const bytes = await renderInvoicePdf({
      ...invoice, amount: 3000, notes: "", description: "Release milestone", payUrl: "https://www.savotechnologies.com/portal/invoices/synthetic/pay",
      items: Array.from({ length: count }, (_, index) => ({ description: `Synthetic task ${index + 1}`, amount: 3000 / count })),
    }, now);
    expect((await PDFDocument.load(bytes)).getPageCount()).toBe(1);
    writeFileSync(`tmp/invoice-pdf/task-count-${count}.pdf`, bytes);
  });
  it("rejects mismatched or too many task charges instead of printing a misleading total", async () => {
    await expect(renderInvoicePdf({ ...invoice, items: [{ description: "Wrong total", amount: 100 }] }, now)).rejects.toThrow("exactly");
    await expect(renderInvoicePdf({ ...invoice, items: Array.from({ length: 4 }, () => ({ description: "Extra task", amount: 100 })) }, now)).rejects.toThrow();
  });
  it("renders an ordinary invoice without optional company/project/date/notes fields", async () => {
    const bytes = await renderInvoicePdf({ ...invoice, client: { ...invoice.client, company: "" }, dueDate: null, project: null, notes: "" }, now);
    expect((await PDFDocument.load(bytes)).getPageCount()).toBe(1);
    writeFileSync("tmp/invoice-pdf/minimal.pdf", bytes);
  });
  it("keeps long references, Unicode names and long notes on a single page", async () => {
    const bytes = await renderInvoicePdf({
      ...invoice,
      number: "LONG-REFERENCE-".repeat(8),
      client: { ...invoice.client, name: "Zoë Müller — Genève", company: "Verylongunbrokencompanyreference".repeat(8) },
      project: { code: "REF-".repeat(50), title: "Long project title ".repeat(40) },
      notes: "Detailed synthetic note with a line break.\n".repeat(90),
    }, now);
    const loaded = await PDFDocument.load(bytes);
    expect(loaded.getPageCount()).toBe(1);
    mkdirSync("tmp/invoice-pdf", { recursive: true });
    writeFileSync("tmp/invoice-pdf/long-values.pdf", bytes);
  });
});
