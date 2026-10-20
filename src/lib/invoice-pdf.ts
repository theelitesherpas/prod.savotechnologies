import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, PDFName, PDFString, rgb, type PDFFont, type PDFPage, type RGB } from "pdf-lib";
import { SITE } from "@/constants/site";
import { invoicePaymentLink, paymentProvider } from "@/lib/payment-links";
import { INVOICE_STATUS_LABEL, invoiceBalances, invoiceDate, invoiceMoney, type InvoiceDocument } from "@/lib/invoice-document";

// Cache only public brand assets. Never cache client documents or authorization.
let assets: Promise<[Buffer, Buffer, Buffer]> | undefined;
function brandAssets() {
  return assets ??= Promise.all([
    readFile(join(process.cwd(), "public/fonts/inter/Inter-PDF-Regular.ttf")),
    readFile(join(process.cwd(), "public/fonts/inter/Inter-PDF-SemiBold.ttf")),
    readFile(join(process.cwd(), "public/images/email/logo.png")),
  ]).catch(error => { assets = undefined; throw error; });
}
const ink = rgb(.075, .075, .075), muted = rgb(.36, .36, .36);
const border = rgb(.87, .87, .87), soft = rgb(.96, .96, .96), red = rgb(.72, .13, .13);
const white = rgb(1, 1, 1);
const stamps = {
  sent: { text: "UNPAID", ink: rgb(.31, .31, .31), fill: rgb(.97, .97, .97) },
  paid: { text: "PAID", ink: rgb(.12, .38, .23), fill: rgb(.95, .98, .96) },
  overdue: { text: "OVERDUE", ink: red, fill: rgb(.995, .96, .96) },
  cancelled: { text: "CANCELLED", ink: muted, fill: soft },
};

/** Savo's print document: one 48pt grid, measured columns, a real status stamp,
 * and a shared right edge for every amount. No inferred tax/bank/line-item data.
 * Standalone A4; no remote fetch, HTML execution, SMTP or database mutation. */
export async function renderInvoicePdf(invoice: InvoiceDocument, now = new Date()): Promise<Uint8Array> {
  const balances = invoiceBalances(invoice);
  const amount = invoiceMoney(invoice.amount, invoice.currency); // validate before rendering
  const [fontBytes, boldBytes, logoBytes] = await brandAssets();
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  // Full static fonts avoid missing glyph outlines in Apple PDFKit/Preview.
  const font = await pdf.embedFont(fontBytes), bold = await pdf.embedFont(boldBytes);
  const logo = await pdf.embedPng(logoBytes);
  pdf.setTitle(`Invoice ${invoice.number}`);
  pdf.setAuthor(SITE.legalName);
  pdf.setSubject(`${INVOICE_STATUS_LABEL[invoice.status]} invoice · ${invoice.currency}`);
  pdf.setCreator("Savo Technologies client portal");
  pdf.setProducer("Savo Technologies invoice service");
  pdf.setLanguage("en-IN");
  pdf.setCreationDate(now); pdf.setModificationDate(now);

  const width = 595.28, height = 841.89, margin = 48;
  const right = width - margin, bodyWidth = right - margin;
  const bottom = height - 86, amountEdge = right - 14;
  let page: PDFPage, cursor = margin;
  const clean = (value: string) => value.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "").replace(/\r\n?/g, "\n");
  function wrap(value: string, size: number, maxWidth: number, face = font) {
    const output: string[] = [];
    for (const paragraph of clean(value).split("\n")) {
      let line = "";
      for (const word of paragraph.split(/\s+/).filter(Boolean)) {
        const candidate = line ? `${line} ${word}` : word;
        if (face.widthOfTextAtSize(candidate, size) <= maxWidth) { line = candidate; continue; }
        if (line) { output.push(line); line = ""; }
        for (const character of word) {
          if (line && face.widthOfTextAtSize(line + character, size) > maxWidth) { output.push(line); line = ""; }
          line += character;
        }
      }
      output.push(line);
    }
    return output;
  }
  // All layout uses distances from the top; the PDF baseline conversion lives here.
  function line(value: string, x: number, top: number, size = 9.5, face = font, color = ink, align: "left" | "right" = "left") {
    if (!value) return;
    page.drawText(value, { x: align === "right" ? x - face.widthOfTextAtSize(value, size) : x, y: height - top - size, font: face, size, color });
  }
  function fixedText(value: string, x: number, top: number, maxWidth: number, size = 9.5, face = font, color = ink, leading = size * 1.45, align: "left" | "right" = "left") {
    const rows = wrap(value, size, maxWidth, face);
    rows.forEach((value, index) => line(value, x, top + index * leading, size, face, color, align));
    return top + rows.length * leading;
  }
  function rule(top: number, x = margin, end = right) {
    page.drawLine({ start: { x, y: height - top }, end: { x: end, y: height - top }, thickness: .65, color: border });
  }
  function rectangle(x: number, top: number, w: number, h: number, color: RGB) {
    page.drawRectangle({ x, y: height - top - h, width: w, height: h, color });
  }
  function newPage(continued = false) {
    page = pdf.addPage([width, height]);
    rectangle(0, 0, width, height, white);
    cursor = margin;
    if (continued) {
      const logoHeight = 72 * logo.height / logo.width;
      page.drawImage(logo, { x: margin, y: height - 36 - logoHeight, width: 72, height: logoHeight });
      line("Invoice continued", right, 37, 11, bold, ink, "right");
      const referenceEnd = fixedText(invoice.number, right, 57, 300, 8.5, font, muted, 12, "right");
      const headerEnd = Math.max(36 + logoHeight, referenceEnd) + 16;
      rule(headerEnd); cursor = headerEnd + 22;
    }
  }
  function room(required: number) {
    if (cursor + required <= bottom) return false;
    newPage(true); return true;
  }
  function flowingText(value: string, size = 9.5, color = muted, continuation?: string) {
    const rows = wrap(value, size, bodyWidth);
    for (const value of rows) {
      if (room(size * 1.5) && continuation) {
        line(continuation, margin, cursor, 10.5, bold); cursor += 24;
      }
      line(value, margin, cursor, size, font, color);
      cursor += size * 1.5;
    }
  }

  newPage();
  // Supplier and document identity share a top baseline and a fixed outer grid.
  const logoWidth = 108, logoHeight = logoWidth * logo.height / logo.width;
  page!.drawImage(logo, { x: margin, y: height - margin - logoHeight, width: logoWidth, height: logoHeight });
  line("INVOICE", right, 44, 28, bold, ink, "right");
  const referenceEnd = fixedText(invoice.number, right, 88, 230, 10.5, font, muted, 15, "right");
  const stamp = stamps[invoice.status], stampTop = referenceEnd + 11, stampWidth = 96, stampHeight = 30;
  page!.drawRectangle({ x: right - stampWidth, y: height - stampTop - stampHeight, width: stampWidth, height: stampHeight, color: stamp.fill, borderColor: stamp.ink, borderWidth: .9 });
  const stampSize = 11.5;
  line(stamp.text, right - stampWidth / 2 - bold.widthOfTextAtSize(stamp.text, stampSize) / 2, stampTop + 8, stampSize, bold, stamp.ink);

  const supplierWidth = 285;
  let supplierEnd = margin + logoHeight + 14;
  supplierEnd = fixedText(SITE.legalName, margin, supplierEnd, supplierWidth, 9.5, bold, ink, 14);
  supplierEnd = fixedText(`${SITE.hq.street}\n${SITE.hq.city}, ${SITE.hq.region} ${SITE.hq.postalCode}, ${SITE.hq.country}`, margin, supplierEnd, supplierWidth, 8.5, font, muted, 12.5);
  supplierEnd = fixedText(`${SITE.email}  ·  ${SITE.phone}`, margin, supplierEnd + 2, supplierWidth, 8.5, font, muted, 12.5);
  cursor = Math.max(supplierEnd, stampTop + stampHeight) + 22;
  rule(cursor); cursor += 24;

  // Independent measured columns: long names cannot move dates or collide with them.
  type BillingLine = { text: string; size: number; step: number; face?: PDFFont; color?: RGB };
  const billingWidth = bodyWidth - 192 - 36, metaX = right - 192;
  const bill: BillingLine[] = [];
  const addBill = (text: string, size: number, step: number, face = font, color = ink) => wrap(text, size, billingWidth, face).forEach(text => bill.push({ text, size, step, face, color }));
  addBill("Bill to", 9, 22, font, muted);
  if (invoice.client.company.trim()) addBill(invoice.client.company, 12, 18, bold);
  addBill(invoice.client.name, 10.5, 17);
  addBill(invoice.client.email, 9, 15, font, muted);
  if (invoice.client.businessId) addBill(`Client ID: ${invoice.client.businessId}`, 8.5, 14, font, muted);
  const dates = [
    ["Invoice date", invoiceDate(invoice.issuedAt)], ["Due date", invoiceDate(invoice.dueDate)], ["Currency", invoice.currency],
    ...(invoice.status === "paid" ? [["Paid on", invoiceDate(invoice.paidAt)]] : []),
  ];
  let billIndex = 0, dateIndex = 0;
  room(Math.min(Math.max(bill.reduce((sum, item) => sum + item.step, 0), dates.length * 22), 170));
  while (billIndex < bill.length || dateIndex < dates.length) {
    const start = cursor;
    let leftEnd = start, rightEnd = start;
    while (billIndex < bill.length && leftEnd + bill[billIndex].step <= bottom) {
      const item = bill[billIndex++];
      line(item.text, margin, leftEnd, item.size, item.face, item.color);
      leftEnd += item.step;
    }
    while (dateIndex < dates.length && rightEnd + 22 <= bottom) {
      const [label, value] = dates[dateIndex++];
      line(label, metaX, rightEnd, 9, font, muted);
      line(value, right, rightEnd, 9, bold, ink, "right");
      rightEnd += 22;
    }
    cursor = Math.max(leftEnd, rightEnd);
    if (billIndex < bill.length || dateIndex < dates.length) {
      newPage(true); line("Billing details (continued)", margin, cursor, 9, bold, muted); cursor += 24;
    }
  }
  cursor += 28;

  // One real aggregate service row. No fictitious quantities, rates or tax lines.
  const descriptionWidth = bodyWidth - 188;
  const service: BillingLine[] = [{ text: "Professional services", size: 10.5, step: 20, face: bold }];
  if (invoice.project) {
    wrap(invoice.project.title, 9.5, descriptionWidth).forEach(text => service.push({ text, size: 9.5, step: 14.5 }));
    service.push({ text: "", size: 8.5, step: 4 });
    wrap(invoice.project.code, 8.5, descriptionWidth).forEach(text => service.push({ text, size: 8.5, step: 13, color: muted }));
  }
  function tableHeading(continued = false) {
    rectangle(margin, cursor, bodyWidth, 30, soft);
    rule(cursor); rule(cursor + 30);
    line("Description", margin + 14, cursor + 9, 9, bold, muted);
    line("Amount", amountEdge, cursor + 9, 9, bold, muted, "right");
    cursor += 44;
    if (continued) { line("Professional services (continued)", margin + 14, cursor, 10.5, bold); cursor += 22; }
  }
  room(80); tableHeading();
  for (let index = 0; index < service.length; index++) {
    const item = service[index];
    if (room(item.step + 14)) tableHeading(true);
    line(item.text, margin + 14, cursor, item.size, item.face, item.color);
    if (index === 0) line(amount, amountEdge, cursor, 10.5, bold, ink, "right");
    cursor += item.step;
  }
  cursor += 12; rule(cursor); cursor += 24;

  // Payment actions are document annotations only. A paid/cancelled or zero
  // invoice never receives a pay action, even if a caller supplies a stale URL.
  const external = invoicePaymentLink(invoice);
  let portal: string | null = null;
  if (!invoice.paymentLink?.trim() && invoice.payUrl && !/[\s\u0000-\u001f\u007f\\]/.test(invoice.payUrl)) {
    try {
      const url = new URL(invoice.payUrl);
      if (url.protocol === "https:" && !url.username && !url.password && (!url.port || url.port === "443")) portal = url.href;
    } catch { /* Invalid stored/server target fails closed. */ }
  }
  const payment = invoice.amount > 0 && ["sent", "overdue"].includes(invoice.status) ? external ?? portal : null;
  const information = invoice.status === "cancelled" ? "This invoice is cancelled. No payment is due."
    : invoice.status === "paid" ? "Payment recorded in full. Thank you."
    : invoice.status === "overdue" ? "Payment is overdue. If you have already paid, please contact our team."
    : "Payment has not yet been recorded for this invoice.";
  const infoWidth = bodyWidth - 260 - 27;
  const infoLines = wrap(information, 9.3, infoWidth);
  const actionDetail = payment ? wrap(external ? `Pay securely with ${paymentProvider(external)}. Recorded after confirmation.` : "Pay securely in your client portal. Recorded after confirmation.", 8.1, infoWidth) : [];
  const infoHeight = 26 + infoLines.length * 14 + (payment ? 50 + actionDetail.length * 11.5 : 0);
  room(Math.max(126, infoHeight));
  const summaryTop = cursor;
  line(invoice.status === "paid" ? "Payment received" : invoice.status === "cancelled" ? "Invoice cancelled" : "Payment information", margin, cursor + 2.5, 10.5, bold);
  infoLines.forEach((value, index) => line(value, margin, cursor + 26 + index * 14, 9.3, font, invoice.status === "overdue" ? red : muted));
  if (payment) {
    const buttonTop = cursor + 26 + infoLines.length * 14 + 10, buttonWidth = 102, buttonHeight = 31;
    rectangle(margin, buttonTop, buttonWidth, buttonHeight, red);
    line("Pay now", margin + (buttonWidth - bold.widthOfTextAtSize("Pay now", 10)) / 2, buttonTop + 9, 10, bold, white);
    const link = pdf.context.register(pdf.context.obj({
      Type: PDFName.of("Annot"), Subtype: PDFName.of("Link"),
      Rect: [margin, height - buttonTop - buttonHeight, margin + buttonWidth, height - buttonTop], Border: [0, 0, 0],
      A: { Type: PDFName.of("Action"), S: PDFName.of("URI"), URI: PDFString.of(payment) },
    }));
    page!.node.addAnnot(link);
    actionDetail.forEach((value, index) => line(value, margin, buttonTop + buttonHeight + 8 + index * 11.5, 8.1, font, muted));
  }
  const summaryX = right - 260;
  const summaryRows: [string, number][] = [["Invoice total", balances.total], ["Amount paid", balances.paid]];
  for (const [index, [label, value]] of summaryRows.entries()) {
    const top = summaryTop + 3 + index * 23;
    line(label, summaryX + 14, top, 9.5, font, muted);
    line(invoiceMoney(value, invoice.currency), amountEdge, top, 9.5, bold, ink, "right");
  }
  rule(summaryTop + 52, summaryX, right);
  rectangle(summaryX, summaryTop + 65, 260, 57, soft);
  const balance = invoiceMoney(balances.due, invoice.currency);
  const amountWidth = 140;
  const balanceSize = Math.min(18, 18 * amountWidth / bold.widthOfTextAtSize(balance, 18));
  const baseline = summaryTop + 100;
  line("Balance due", summaryX + 14, baseline - 10, 10, bold);
  line(balance, amountEdge, baseline - balanceSize, balanceSize, bold, ink, "right");
  cursor = summaryTop + Math.max(126, infoHeight);

  if (invoice.notes.trim()) {
    cursor += 26; room(58);
    line("Notes", margin, cursor, 10.5, bold); cursor += 24;
    flowingText(invoice.notes, 9.5, muted, "Notes (continued)");
  }
  cursor += 24; room(50);
  flowingText("For invoice queries or payment instructions, contact hello@savotechnologies.com.", 8.5);
  cursor += 5;
  flowingText("Amounts reflect the issued invoice. No additional taxes or fees are calculated in this document.", 8);

  pdf.getPages().forEach((p, index, pages) => {
    p.drawLine({ start: { x: margin, y: 66 }, end: { x: right, y: 66 }, thickness: .65, color: border });
    p.drawText(`Status as of ${invoiceDate(now)} · ${INVOICE_STATUS_LABEL[invoice.status]}`, { x: margin, y: 43, font, size: 8, color: muted });
    const count = `Page ${index + 1} of ${pages.length}`;
    p.drawText(count, { x: right - font.widthOfTextAtSize(count, 8), y: 43, font, size: 8, color: muted });
  });
  return pdf.save();
}
