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
  const knownTaskInvoice = document.name.startsWith("tasks-address-") || ["issued", "without-address"].includes(document.name);
  const sparseCount = document.name.match(/^task-count-([0-3])$/);
  const taskCount = knownTaskInvoice ? 3 : sparseCount ? Number(sparseCount[1]) : 0;
  ok(document.pages.length === 1, `${document.name}: exactly one page, never continuation pages`);
  ok(document.pages[0].lines.some(line => line.text === stamp), `${document.name}: correct stored-status stamp`);
  for (const label of ["INVOICE", "Bill to", "Invoice date", "Due date", "Currency", "Invoice total", "Amount paid", "Balance due"])
    ok(allText.includes(label), `${document.name}: retains ${label}`);
  for (const registration of ["GSTIN: 23ABDCS2341B1Z1", "TAN: BPLS22850C", "CIN: U72900MP2020PTC050634"])
    ok(allText.includes(registration), `${document.name}: supplied ${registration.split(":")[0]} appears on invoice`);
  const contact = document.pages[0].lines.find(line => line.text.startsWith("For invoice queries"));
  const closing = document.pages[0].lines.find(line => /^(Amounts reflect|Long text is shortened)/.test(line.text));
  const settlement = document.pages[0].lines.find(line => line.text.includes("Invoice total"));
  const upperBalance = document.pages[0].lines.find(line => line.text === "Balance due" && line.y > 600);
  ok(!upperBalance, `${document.name}: no duplicate balance beneath the header status`);
  ok((allText.match(/Balance due/g) ?? []).length === 1, `${document.name}: balance appears once in the lower summary`);
  ok(!/(Ship [Tt]o|Tax [Rr]ate|Qty|Zylker|Terms & Conditions)/.test(allText), `${document.name}: no fabricated reference-template shipping, quantities, taxes or contract terms`);
  ok((allText.match(/hello@savotechnologies\.com/g) ?? []).length === 1, `${document.name}: supplier email appears only once`);
  ok(!allText.includes("+91 75029 01234"), `${document.name}: mobile number is omitted`);
  ok(contact?.text.includes("hello@savotechnologies.com."), `${document.name}: supplier email is in the bottom enquiry line`);
  ok(contact?.y >= 95 && contact.y <= 112, `${document.name}: contact details remain near the footer, not above an empty bottom third`);
  ok(closing?.y >= 85 && closing.y <= 100, `${document.name}: closing line uses the lower page consistently`);
  ok(settlement?.y >= 210 && settlement.y <= 300, `${document.name}: totals anchor in the lower section even with sparse content`);
  ok(!allText.includes("sample@example.invalid"), `${document.name}: client email is not printed`);
  let monetaryRows = 0;
  for (const page of document.pages) {
    ok(Math.abs(page.width - 595.28) < .1 && Math.abs(page.height - 841.89) < .1, `${document.name}: A4 page`);
    ok(!page.lines.some(line => /Page \d+ of \d+/.test(line.text)), `${document.name}: page count is not printed`);
    const website = page.lines.find(line => line.text.includes("www.savotechnologies.com"));
    ok(!!website && Math.abs(website.x + website.width - 547.28) < .2 && website.y < 60, `${document.name}: website replaces page count on the right footer rail`);
    for (const line of page.lines) {
      ok(line.x >= 47.8 && line.x + line.width <= 547.48 && line.y >= 37 && line.y + line.height <= 811, `${document.name} page ${page.page}: text remains within print bounds: ${line.text}`);
      if (/\b(?:INR|USD|CHF|EUR|GBP|AED)\s[\d,]+\.\d{2}$/.test(line.text)) {
        ok(Math.abs(line.x + line.width - 533.28) < .2, `${document.name}: every monetary value shares the table amount rail`);
        monetaryRows++;
      }
    }
  }
  ok(monetaryRows === (taskCount || 1) + 3, `${document.name}: exactly ${taskCount || 1} task/service prices and three settlement values`);
  if (sparseCount && taskCount) {
    for (let index = 1; index <= taskCount; index++) {
      const row = document.pages[0].lines.filter(line => line.text.includes(`Synthetic task ${index}`));
      ok(row.length === 1, `${document.name}: task ${index} remains a single line`);
      ok(row[0].text.startsWith(`${index} `), `${document.name}: task ${index} has a real sequential row number`);
    }
  }
  if (knownTaskInvoice) {
    const context = document.pages[0].lines.filter(line => ["Website implementation", "Example product development", "TEST-PRJ-001"].includes(line.text));
    for (const line of context) ok(Math.abs(line.x - 48) < .2, `${document.name}: project/milestone context shares the left document rail`);
    const taskRows = document.pages[0].lines.filter(line => /Booking form development|Payment gateway integration|QA and release/.test(line.text));
    for (let index = 1; index < taskRows.length; index++) ok(Math.abs(taskRows[index].y - taskRows[index - 1].y) <= 34.2, `${document.name}: task rows stay compact enough for three tasks`);
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
