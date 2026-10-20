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
  const stamp = { paid: "PAID", overdue: "OVERDUE", cancelled: "CANCELLED" }[document.name] ?? "UNPAID";
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
  ok(monetaryRows === 4, `${document.name}: exactly one service amount and three summary values, without duplicated continuation amounts`);
  if (["paid", "cancelled"].includes(document.name)) ok(/Balance due\s+INR\s+0\.00/.test(allText), `${document.name}: zero balance`);
  if (document.name === "long-values") {
    ok(allText.includes("Zoë Müller — Genève"), "Unicode client name survives actual PDF rendering/extraction");
    ok((allText.match(/Detailed synthetic note with a line break\./g) ?? []).length === 90, "all note lines retained across pages");
    ok(allText.includes("Notes (continued)"), "notes retain continuation context");
  }
  if (document.name === "long-service") {
    ok((allText.replace(/\s+/g, " ").match(/Synthetic detailed service scope\./g) ?? []).length === 180, "full multi-page service description retained");
    ok(allText.includes("Professional services (continued)"), "service table retains continuation context");
  }
  if (document.name === "long-billing") ok(allText.includes("BILLING-END-MARKER") && allText.includes("STPLCS02684"), "all legacy billing content retained after pagination");
}
const report = `${documents.length} synthetic PDFs: ${checks} PDFKit geometry/content checks passed. No real customer documents used.\n`;
await writeFile(join(dirname(file), "geometry-report.txt"), report);
console.log(report.trim());
