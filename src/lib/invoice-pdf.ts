import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, PDFName, PDFString, rgb } from "pdf-lib";
import { SITE } from "@/constants/site";
import { invoicePaymentLink, paymentProvider } from "@/lib/payment-links";
import { clientAddressLines } from "@/lib/client-address";
import { INVOICE_STATUS_LABEL, invoiceBalances, invoiceDate, invoiceMoney, invoiceDocumentItems, invoiceWorkDescription, type InvoiceDocument } from "@/lib/invoice-document";

// Cache public brand assets only, never client documents or authorization.
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

/** Existing Savo A4 design, now deliberately ONE page. At most three real task
 * rows, each one line. Long legacy prose is visibly abbreviated, never moved
 * onto a second page. Every task price and all financial totals remain exact. */
export async function renderInvoicePdf(invoice: InvoiceDocument, now = new Date()): Promise<Uint8Array> {
  const balances = invoiceBalances(invoice);
  const items = invoiceDocumentItems(invoice);
  const amount = invoiceMoney(invoice.amount, invoice.currency);
  const [fontBytes, boldBytes, logoBytes] = await brandAssets();
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
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
  const page = pdf.addPage([width, height]);
  let abbreviated = false;
  const clean = (value: string) => value.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "").replace(/\r\n?/g, "\n");
  function wrap(value: string, size: number, maxWidth: number, face = font) {
    const output: string[] = [];
    for (const paragraph of clean(value).split("\n")) {
      let row = "";
      for (const word of paragraph.split(/\s+/).filter(Boolean)) {
        const candidate = row ? `${row} ${word}` : word;
        if (face.widthOfTextAtSize(candidate, size) <= maxWidth) { row = candidate; continue; }
        if (row) { output.push(row); row = ""; }
        for (const character of word) {
          if (row && face.widthOfTextAtSize(row + character, size) > maxWidth) { output.push(row); row = ""; }
          row += character;
        }
      }
      output.push(row);
    }
    return output;
  }
  function ellipsis(value: string, size: number, maxWidth: number, face = font) {
    const characters = Array.from(value.trimEnd());
    let low = 0, high = characters.length;
    while (low < high) {
      const middle = Math.ceil((low + high) / 2);
      if (face.widthOfTextAtSize(`${characters.slice(0, middle).join("")}…`, size) <= maxWidth) low = middle;
      else high = middle - 1;
    }
    return `${characters.slice(0, low).join("")}…`;
  }
  function boundedRows(value: string, size: number, maxWidth: number, maximum: number, face = font) {
    const rows = wrap(value, size, maxWidth, face);
    if (rows.length <= maximum) return rows;
    abbreviated = true;
    if (!maximum) return [];
    return [...rows.slice(0, maximum - 1), ellipsis(rows[maximum - 1], size, maxWidth, face)];
  }
  function line(value: string, x: number, top: number, size = 9.5, face = font, color = ink, align: "left" | "right" = "left") {
    if (!value) return;
    page.drawText(value, { x: align === "right" ? x - face.widthOfTextAtSize(value, size) : x, y: height - top - size, font: face, size, color });
  }
  function single(value: string, x: number, top: number, maxWidth: number, size = 9.5, face = font, color = ink, align: "left" | "right" = "left") {
    const text = clean(value).replace(/\s+/g, " ").trim();
    const measured = face.widthOfTextAtSize(text, size);
    const fitted = measured > maxWidth ? Math.max(8, size * maxWidth / measured) : size;
    const shown = face.widthOfTextAtSize(text, fitted) <= maxWidth ? text : ellipsis(text, fitted, maxWidth, face);
    if (shown !== text) abbreviated = true;
    line(shown, x, top, fitted, face, color, align);
  }
  function rule(top: number, x = margin, end = right) {
    page.drawLine({ start: { x, y: height - top }, end: { x: end, y: height - top }, thickness: .65, color: border });
  }
  function rectangle(x: number, top: number, w: number, h: number, color: ReturnType<typeof rgb>) {
    page.drawRectangle({ x, y: height - top - h, width: w, height: h, color });
  }
  rectangle(0, 0, width, height, white);

  // Supplier, invoice identity and stamp retain the incumbent composition.
  const logoWidth = 108, logoHeight = logoWidth * logo.height / logo.width;
  page.drawImage(logo, { x: margin, y: height - margin - logoHeight, width: logoWidth, height: logoHeight });
  line("INVOICE", right, 44, 28, bold, ink, "right");
  single(invoice.number, right, 88, 230, 10.5, font, muted, "right");
  const stamp = stamps[invoice.status], stampTop = 114, stampWidth = 96, stampHeight = 30;
  page.drawRectangle({ x: right - stampWidth, y: height - stampTop - stampHeight, width: stampWidth, height: stampHeight, color: stamp.fill, borderColor: stamp.ink, borderWidth: .9 });
  line(stamp.text, right - stampWidth / 2 - bold.widthOfTextAtSize(stamp.text, 11.5) / 2, stampTop + 8, 11.5, bold, stamp.ink);
  let supplierEnd = margin + logoHeight + 14;
  line(SITE.legalName, margin, supplierEnd, 9.5, bold); supplierEnd += 14;
  for (const text of [`${SITE.hq.street}`, `${SITE.hq.city}, ${SITE.hq.region} ${SITE.hq.postalCode}, ${SITE.hq.country}`]) {
    for (const row of wrap(text, 8.5, 285)) { line(row, margin, supplierEnd, 8.5, font, muted); supplierEnd += 12.5; }
  }
  single(`${SITE.email}  ·  ${SITE.phone}`, margin, supplierEnd + 2, 285, 8.5, font, muted);
  let cursor = Math.max(supplierEnd + 14.5, stampTop + stampHeight) + 12;
  rule(cursor); cursor += 18;

  // Optional address uses the same quiet type and line spacing as our address.
  const billingWidth = bodyWidth - 192 - 36, metaX = right - 192;
  const billTop = cursor;
  line("Bill to", margin, cursor, 9, font, muted); cursor += 18;
  if (invoice.client.company.trim()) { single(invoice.client.company, margin, cursor, billingWidth, 12, bold); cursor += 17; }
  single(invoice.client.name, margin, cursor, billingWidth, 10.5); cursor += 15;
  for (const address of clientAddressLines(invoice.client)) {
    single(address, margin, cursor, billingWidth, 8.5, font, muted); cursor += 12;
  }
  single(invoice.client.email, margin, cursor, billingWidth, 9, font, muted); cursor += 13;
  if (invoice.client.businessId) { single(`Client ID: ${invoice.client.businessId}`, margin, cursor, billingWidth, 8.5, font, muted); cursor += 13; }
  const dates = [
    ["Invoice date", invoiceDate(invoice.issuedAt)], ["Due date", invoiceDate(invoice.dueDate)], ["Currency", invoice.currency],
    ...(invoice.status === "paid" ? [["Paid on", invoiceDate(invoice.paidAt)]] : []),
  ];
  dates.forEach(([label, value], index) => {
    line(label, metaX, billTop + index * 20, 9, font, muted);
    line(value, right, billTop + index * 20, 9, bold, ink, "right");
  });
  cursor = Math.max(cursor, billTop + dates.length * 20) + 16;

  // Budget the prose around the three task lines and financial summary. Long
  // text gets an explicit ellipsis, not an invisible clip or a second page.
  const summaryHeight = 114, closingHeight = 36;
  const noteRows = invoice.notes.trim() ? boundedRows(invoice.notes, 9, bodyWidth, 2) : [];
  const notesHeight = noteRows.length ? 28 + noteRows.length * 12.5 : 0;
  const descriptionWidth = bodyWidth - 188;
  const [workTitle, ...workNotes] = clean(invoiceWorkDescription(invoice)).split("\n");
  const tableFixed = 36 + 18 + (invoice.project ? 26 : 0) + items.length * 24 + 28;
  const noteLimit = Math.max(1, Math.min(4, Math.floor((bottom - cursor - tableFixed - summaryHeight - notesHeight - closingHeight) / 12.5)));
  rectangle(margin, cursor, bodyWidth, 30, soft); rule(cursor); rule(cursor + 30);
  line("Description", margin + 14, cursor + 9, 9, bold, muted);
  line("Amount", amountEdge, cursor + 9, 9, bold, muted, "right"); cursor += 36;
  single(workTitle || (items.length ? "Task breakdown" : "Professional services"), margin + 14, cursor, descriptionWidth, 10.5, bold);
  if (!items.length) line(amount, amountEdge, cursor, 10.5, bold, ink, "right");
  cursor += 18;
  if (workNotes.some(row => row.trim())) {
    for (const row of boundedRows(workNotes.join("\n"), 9, descriptionWidth, noteLimit)) { line(row, margin + 14, cursor, 9, font, muted); cursor += 12.5; }
  }
  if (invoice.project) {
    single(invoice.project.title, margin + 14, cursor, descriptionWidth, 9, font, muted); cursor += 13;
    single(invoice.project.code, margin + 14, cursor, descriptionWidth, 8.5, font, muted); cursor += 13;
  }
  for (const item of items) {
    rule(cursor + 3, margin + 14, amountEdge); cursor += 9;
    single(item.description, margin + 14, cursor, descriptionWidth, 10);
    line(invoiceMoney(item.amount, invoice.currency), amountEdge, cursor, 10.5, bold, ink, "right");
    cursor += 15;
  }
  cursor += 12; rule(cursor); cursor += 16;

  // Actions are annotations only; no payment/provider calls happen here.
  const external = invoicePaymentLink(invoice);
  let portal: string | null = null;
  if (!invoice.paymentLink?.trim() && invoice.payUrl && !/[\s\u0000-\u001f\u007f\\]/.test(invoice.payUrl)) {
    try {
      const url = new URL(invoice.payUrl);
      if (url.protocol === "https:" && !url.username && !url.password && (!url.port || url.port === "443")) portal = url.href;
    } catch { /* Fail closed. */ }
  }
  const payment = invoice.amount > 0 && ["sent", "overdue"].includes(invoice.status) ? external ?? portal : null;
  const information = invoice.status === "cancelled" ? "This invoice is cancelled. No payment is due."
    : invoice.status === "paid" ? "Payment recorded in full. Thank you."
    : invoice.status === "overdue" ? "Payment is overdue. Already paid? Please contact our team."
    : "Payment has not yet been recorded.";
  const infoWidth = bodyWidth - 260 - 27, summaryTop = cursor;
  line(invoice.status === "paid" ? "Payment received" : invoice.status === "cancelled" ? "Invoice cancelled" : "Payment information", margin, cursor + 2.5, 10.5, bold);
  const infoLines = boundedRows(information, 9.3, infoWidth, 2);
  infoLines.forEach((value, index) => line(value, margin, cursor + 24 + index * 13, 9.3, font, invoice.status === "overdue" ? red : muted));
  if (payment) {
    const buttonTop = cursor + 24 + infoLines.length * 13 + 6, buttonWidth = 102, buttonHeight = 29;
    rectangle(margin, buttonTop, buttonWidth, buttonHeight, red);
    line("Pay now", margin + (buttonWidth - bold.widthOfTextAtSize("Pay now", 10)) / 2, buttonTop + 8, 10, bold, white);
    page.node.addAnnot(pdf.context.register(pdf.context.obj({
      Type: PDFName.of("Annot"), Subtype: PDFName.of("Link"),
      Rect: [margin, height - buttonTop - buttonHeight, margin + buttonWidth, height - buttonTop], Border: [0, 0, 0],
      A: { Type: PDFName.of("Action"), S: PDFName.of("URI"), URI: PDFString.of(payment) },
    })));
    const detail = external ? `Pay securely with ${paymentProvider(external)}.` : "Pay securely in your client portal.";
    boundedRows(detail, 8.1, infoWidth, 2).forEach((value, index) => line(value, margin, buttonTop + buttonHeight + 7 + index * 10, 8.1, font, muted));
  }
  const summaryX = right - 260;
  const summaryRows: [string, number][] = [["Invoice total", balances.total], ["Amount paid", balances.paid]];
  summaryRows.forEach(([label, value], index) => {
    line(label, summaryX + 14, summaryTop + 3 + index * 23, 9.5, font, muted);
    line(invoiceMoney(value, invoice.currency), amountEdge, summaryTop + 3 + index * 23, 9.5, bold, ink, "right");
  });
  rule(summaryTop + 52, summaryX, right);
  rectangle(summaryX, summaryTop + 61, 260, 47, soft);
  const balance = invoiceMoney(balances.due, invoice.currency);
  const balanceSize = Math.min(18, 18 * 140 / bold.widthOfTextAtSize(balance, 18));
  line("Balance due", summaryX + 14, summaryTop + 80, 10, bold);
  line(balance, amountEdge, summaryTop + 94 - balanceSize, balanceSize, bold, ink, "right");
  cursor = summaryTop + summaryHeight;
  if (noteRows.length) {
    cursor += 10; line("Notes", margin, cursor, 10.5, bold); cursor += 18;
    noteRows.forEach(value => { line(value, margin, cursor, 9, font, muted); cursor += 12.5; });
  }
  cursor += 12;
  line("For invoice queries or payment instructions, contact hello@savotechnologies.com.", margin, cursor, 8.5, font, muted); cursor += 13;
  line(abbreviated ? "Long text is shortened for this single-page invoice; full details remain in your portal." : "Amounts reflect the issued invoice. No additional taxes or fees are calculated in this document.", margin, cursor, 8, font, muted);
  if (cursor + 12 > bottom) throw new Error("Invoice content exceeds the single-page layout.");
  rule(height - 66);
  line(`Status as of ${invoiceDate(now)} · ${INVOICE_STATUS_LABEL[invoice.status]}`, margin, height - 51, 8, font, muted);
  line("Page 1 of 1", right, height - 51, 8, font, muted, "right");
  return pdf.save();
}
