import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, PDFName, PDFString, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { SITE } from "@/constants/site";
import { invoicePaymentLink, paymentProvider } from "@/lib/payment-links";
import {
  INVOICE_STATUS_LABEL, invoiceBalances, invoiceDate, invoiceMoney,
  type InvoiceDocument,
} from "@/lib/invoice-document";

// Cache only public brand assets, never client documents or authorization.
let assets: Promise<[Buffer, Buffer, Buffer]> | undefined;
function brandAssets() {
  return assets ??= Promise.all([
    readFile(join(process.cwd(), "public/fonts/inter/Inter-PDF-Regular.ttf")),
    readFile(join(process.cwd(), "public/fonts/inter/Inter-PDF-SemiBold.ttf")),
    readFile(join(process.cwd(), "public/images/email/logo.png")),
  ]).catch(error => { assets = undefined; throw error; });
}

const ink = rgb(.08, .08, .08);
const muted = rgb(.36, .36, .36);
const red = rgb(.72, .13, .13);
const grey = rgb(.92, .92, .92);
const soft = rgb(.97, .97, .97);
const statusColour = {
  paid: rgb(.1, .4, .23), sent: muted, overdue: red, cancelled: muted,
};

/** Standalone A4 document with embedded Unicode font and logo. No browser,
 * remote asset fetch, HTML execution, SMTP or database mutation is involved. */
export async function renderInvoicePdf(invoice: InvoiceDocument, now = new Date()): Promise<Uint8Array> {
  const balances = invoiceBalances(invoice);
  // Validate before writing any document, including zero/cancelled balances.
  invoiceMoney(invoice.amount, invoice.currency);
  const [fontBytes, boldBytes, logoBytes] = await brandAssets();
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  // Keep the complete static font programs. fontkit subsetting can produce
  // glyph mappings that extract as text but render with missing letters in
  // Apple PDFKit/Preview. Full embedding is small and preserves print fidelity.
  const font = await pdf.embedFont(fontBytes);
  const bold = await pdf.embedFont(boldBytes);
  const logo = await pdf.embedPng(logoBytes);
  pdf.setTitle(`Invoice ${invoice.number}`);
  pdf.setAuthor(SITE.legalName);
  pdf.setSubject(`${INVOICE_STATUS_LABEL[invoice.status]} invoice · ${invoice.currency}`);
  pdf.setCreator("Savo Technologies client portal");
  pdf.setProducer("Savo Technologies invoice service");
  pdf.setLanguage("en-IN");
  pdf.setCreationDate(now);
  pdf.setModificationDate(now);

  const width = 595.28, height = 841.89, margin = 44, bodyWidth = width - margin * 2;
  let page: PDFPage;
  let y = height - margin;
  const clean = (s: string) => s.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "").replace(/\r\n?/g, "\n");
  function lines(text: string, size: number, maxWidth: number, face: PDFFont = font): string[] {
    const output: string[] = [];
    for (const paragraph of clean(text).split("\n")) {
      let line = "";
      for (const word of paragraph.split(/\s+/).filter(Boolean)) {
        const candidate = line ? `${line} ${word}` : word;
        if (face.widthOfTextAtSize(candidate, size) <= maxWidth) { line = candidate; continue; }
        if (line) { output.push(line); line = ""; }
        // Break very long references/URLs without dropping or clipping text.
        for (const char of word) {
          if (line && face.widthOfTextAtSize(line + char, size) > maxWidth) { output.push(line); line = ""; }
          line += char;
        }
      }
      output.push(line);
    }
    return output;
  }
  function newPage(continuation = false) {
    page = pdf.addPage([width, height]);
    y = height - margin;
    if (continuation) {
      page.drawText("Savo Technologies · Invoice continued", { x: margin, y: y - 10, font, size: 10, color: muted });
      y -= 34;
    }
  }
  function room(required: number) {
    if (y - required < 76) newPage(true);
  }
  function text(value: string, size = 10, colour = ink, maxWidth = bodyWidth, x = margin, face = font) {
    for (const line of lines(value, size, maxWidth, face)) {
      room(size * 1.6);
      page.drawText(line, { x, y: y - size, font: face, size, color: colour });
      y -= size * 1.6;
    }
  }
  function gap(amount = 18) { y -= amount; }
  function rule() {
    room(12);
    page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: .7, color: grey });
    gap(16);
  }
  function totalRow(label: string, minor: number, prominent = false) {
    room(34);
    const size = prominent ? 16 : 10;
    const amount = invoiceMoney(minor, invoice.currency);
    const face = prominent ? bold : font;
    page.drawText(label, { x: margin, y: y - size, font: face, size, color: prominent ? ink : muted });
    page.drawText(amount, { x: width - margin - face.widthOfTextAtSize(amount, size), y: y - size, font: face, size, color: ink });
    y -= prominent ? 30 : 22;
  }

  newPage();
  // An opaque white page keeps this original black wordmark print-friendly.
  page!.drawImage(logo, { x: margin, y: y - 52, width: 105, height: 53.65 });
  const right = width - margin;
  page!.drawText("INVOICE", { x: right - bold.widthOfTextAtSize("INVOICE", 25), y: y - 25, font: bold, size: 25, color: ink });
  const headingY = y;
  y -= 37;
  text(invoice.number, 11, muted, 255, right - 255);
  text(INVOICE_STATUS_LABEL[invoice.status], 11, statusColour[invoice.status], 255, right - 255);
  y = Math.min(y, headingY - 75);
  text(SITE.legalName, 10, ink, bodyWidth, margin, bold);
  text(`${SITE.hq.street}\n${SITE.hq.city}, ${SITE.hq.region} ${SITE.hq.postalCode}, ${SITE.hq.country}`, 9, muted);
  text(`${SITE.email}  ·  ${SITE.phone}`, 9, muted);
  gap(10);
  rule();

  text("Bill to", 10, muted);
  if (invoice.client.company) text(invoice.client.company, 13, ink, bodyWidth, margin, bold);
  text(invoice.client.name, 11);
  text(invoice.client.email, 10, muted);
  gap(12);

  room(64);
  const columnWidth = bodyWidth / 3;
  const dates = [["Issued on", invoiceDate(invoice.issuedAt)], ["Due date", invoiceDate(invoice.dueDate)], ["Paid on", invoice.status === "paid" ? invoiceDate(invoice.paidAt) : "—"]];
  page!.drawRectangle({ x: margin, y: y - 55, width: bodyWidth, height: 55, color: soft });
  dates.forEach(([label, value], i) => {
    const x = margin + i * columnWidth + 12;
    page!.drawText(label, { x, y: y - 18, font, size: 9, color: muted });
    page!.drawText(value, { x, y: y - 37, font, size: 10, color: ink });
  });
  y -= 65;

  if (invoice.project) {
    text("Project", 10, muted);
    text(invoice.project.title, 12);
    text(invoice.project.code, 9, muted);
    gap(10);
  }

  room(95);
  page!.drawRectangle({ x: margin, y: y - 29, width: bodyWidth, height: 29, color: ink });
  page!.drawText("Description", { x: margin + 12, y: y - 19, font, size: 10, color: rgb(1, 1, 1) });
  page!.drawText("Amount", { x: right - 52, y: y - 19, font, size: 10, color: rgb(1, 1, 1) });
  y -= 40;
  page!.drawText("Professional services", { x: margin + 12, y: y - 10, font, size: 11, color: ink });
  const amount = invoiceMoney(invoice.amount, invoice.currency);
  page!.drawText(amount, { x: right - 12 - font.widthOfTextAtSize(amount, 11), y: y - 10, font, size: 11, color: ink });
  y -= 30;
  rule();
  room(120);
  totalRow("Invoice total", balances.total);
  totalRow("Amount paid", balances.paid);
  totalRow("Balance due", balances.due, true);
  text(invoice.status === "cancelled" ? "This invoice is cancelled. No payment is due."
    : invoice.status === "paid" ? "Payment recorded in full. Thank you."
    : invoice.status === "overdue" ? "This invoice is marked overdue. Please contact our team if payment has already been made."
    : "Payment has not yet been recorded for this invoice.", 10, statusColour[invoice.status]);

  const payment = invoicePaymentLink(invoice);
  if (payment) {
    gap(10);
    room(65);
    page!.drawRectangle({ x: margin, y: y - 34, width: 116, height: 34, color: red });
    page!.drawText("Pay now", { x: margin + 14, y: y - 22, font: bold, size: 11, color: rgb(1, 1, 1) });
    const link = pdf.context.register(pdf.context.obj({
      Type: PDFName.of("Annot"), Subtype: PDFName.of("Link"), Rect: [margin, y - 34, margin + 116, y], Border: [0, 0, 0],
      A: { Type: PDFName.of("Action"), S: PDFName.of("URI"), URI: PDFString.of(payment) },
    }));
    page!.node.addAnnot(link);
    y -= 44;
    text(`Continue securely with ${paymentProvider(payment)}. Payment is recorded after confirmation.`, 8, muted);
  }

  if (invoice.notes.trim()) {
    gap(16);
    room(50);
    text("Notes", 11, ink, bodyWidth, margin, bold);
    text(invoice.notes, 10, muted);
  }
  gap(16);
  room(45);
  text("For payment instructions or invoice queries, contact hello@savotechnologies.com.", 9, muted);
  text("Amounts reflect the issued portal record. No additional taxes or charges have been calculated in this document.", 8, muted);

  const pages = pdf.getPages();
  pages.forEach((p, index) => {
    p.drawLine({ start: { x: margin, y: 55 }, end: { x: right, y: 55 }, thickness: .6, color: grey });
    p.drawText(`Payment status as of ${invoiceDate(now)} · ${INVOICE_STATUS_LABEL[invoice.status]}`, { x: margin, y: 39, font, size: 8, color: muted });
    const count = `Page ${index + 1} of ${pages.length}`;
    p.drawText(count, { x: right - font.widthOfTextAtSize(count, 8), y: 39, font, size: 8, color: muted });
  });
  return pdf.save();
}
