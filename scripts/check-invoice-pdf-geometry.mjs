/** Checks Apple PDFKit's actual text geometry, not a browser HTML facsimile.
 * Run review-invoice-pdfs.swift first on the synthetic unit-test samples.
 * node scripts/check-invoice-pdf-geometry.mjs .impeccable/review/invoice/geometry.json
 */
import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
const file = process.argv[2];
assert(file, "Pass a synthetic PDFKit geometry.json path");
const documents = JSON.parse(await readFile(file, "utf8"));
let checks = 0;
const ok = (condition, message) => { assert(condition, message); checks++; };
for (const document of documents) {
  const allText = document.pages.flatMap(page => page.lines.map(line => line.text)).join("\n");
  const status = document.name.startsWith("tasks-address-") ? document.name.slice("tasks-address-".length) : document.name;
  const stamp = { paid: "PAID", overdue: "OVERDUE", cancelled: "CANCELLED" }[status] ?? "UNPAID";
  const taskInvoice = document.name.startsWith("tasks-address-") || ["issued", "without-address"].includes(document.name);
  ok(document.pages.length === 1, `${document.name}: exactly one page, never continuation pages`);
  ok(document.pages[0].lines.some(line => line.text === stamp), `${document.name}: correct stored-status stamp`);
  for (const label of ["INVOICE", "Bill to", "Invoice date", "Due date", "Currency", "Invoice total", "Amount paid", "Balance due"])
    ok(allText.includes(label), `${document.name}: retains ${label}`);
  let monetaryRows = 0;
  for (const page of document.pages) {
    ok(Math.abs(page.width - 595.28) < .1 && Math.abs(page.height - 841.89) < .1, `${document.name}: A4 page`);
    ok(page.lines.some(line => line.text.includes(`Page ${page.page} of ${document.pages.length}`)), `${document.name}: page count`);
    for (const line of page.lines) {
      ok(line.x >= 47.8 && line.x + line.width <= 547.48 && line.y >= 37 && line.y + line.height <= 811, `${document.name} page ${page.page}: text remains within print bounds: ${line.text}`);
      if (/\b(?:INR|USD|CHF|EUR|GBP|AED)\s[\d,]+\.\d{2}$/.test(line.text)) {
        ok(Math.abs(line.x + line.width - 533.28) < .2, `${document.name}: every monetary value shares the table amount rail`);
        monetaryRows++;
      }
    }
  }
  ok(monetaryRows === (taskInvoice ? 6 : 4), `${document.name}: exactly ${taskInvoice ? "three task prices" : "one service amount"} and three summary values`);
  if (taskInvoice) {
    for (const task of ["Booking form development", "Payment gateway integration", "QA and release"])
      ok(document.pages[0].lines.filter(line => line.text.includes(task)).length === 1, `${document.name}: ${task} occupies one line exactly once`);
    ok(!allText.includes("Professional services"), `${document.name}: actual billed work replaces generic service label`);
  }
  if (document.name === "issued") ok(allText.includes("14 Example Road") && allText.includes("Suite 3") && allText.includes("452001"), "optional customer address appears under Bill to");
  if (document.name === "without-address") ok(!allText.includes("14 Example Road") && !allText.includes("Suite 3") && !allText.includes("452001"), "blank customer address is completely omitted");
  if (["paid", "cancelled"].includes(status)) ok(/Balance due\s+INR\s+0\.00/.test(allText), `${document.name}: zero balance`);
  if (document.name === "long-values") {
    ok(allText.includes("Zoë Müller — Genève"), "Unicode client name survives actual PDF rendering/extraction");
    ok(allText.includes("Detailed synthetic note"), "long notes remain represented");
    ok(allText.includes("Long text is shortened"), "abbreviation is disclosed on the single-page document");
  }
  if (document.name === "long-service") {
    ok(allText.includes("Synthetic detailed service scope"), "legacy service description remains represented");
    ok(allText.includes("Long text is shortened"), "long service abbreviation is disclosed");
  }
  if (document.name === "long-billing") ok(allText.includes("BILLING-END-MARKER") && allText.includes("STPLCS02684"), "client identity retained on the single-page legacy document");
}
const report = `${documents.length} synthetic PDFs: ${checks} PDFKit geometry/content checks passed. No real customer documents used.\n`;
await writeFile(join(dirname(file), "geometry-report.txt"), report);
console.log(report.trim());
