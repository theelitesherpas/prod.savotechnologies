import { describe, expect, it } from "vitest";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { PDFDocument, PDFRawStream, decodePDFRawStream } from "pdf-lib";
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
  it("wraps long references and Unicode client/project names and paginates long notes", async () => {
    const bytes = await renderInvoicePdf({
      ...invoice,
      number: "LONG-REFERENCE-".repeat(8),
      client: { ...invoice.client, name: "Zoë Müller — Genève", company: "Verylongunbrokencompanyreference".repeat(8) },
      project: { code: "REF-".repeat(50), title: "Long project title ".repeat(40) },
      notes: "Detailed synthetic note with a line break.\n".repeat(90),
    }, now);
    const loaded = await PDFDocument.load(bytes);
    expect(loaded.getPageCount()).toBeGreaterThan(1);
    mkdirSync("tmp/invoice-pdf", { recursive: true });
    writeFileSync("tmp/invoice-pdf/long-values.pdf", bytes);
  });
});
