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
const border = rgb(.83, .83, .83), soft = rgb(.975, .975, .975), red = rgb(.72, .13, .13);
const white = rgb(1, 1, 1);
const stamps = {
  sent: { text: "UNPAID", ink: muted },
  paid: { text: "PAID", ink: rgb(.12, .38, .23) },
  overdue: { text: "OVERDUE", ink: red },
  cancelled: { text: "CANCELLED", ink: muted },
};

/** Reference-pinned service invoice, adapted to Savo rather than copied data.
 * THESIS: a clean supplier/bill-to rail, numbered services and clear settlement.
 * OWN-WORLD: official black logo, embedded Inter, white paper and Savo red.
 * STORY: identify the invoice, understand the actual work, review/pay the balance.
 * FIRST VIEWPORT: supplier left; invoice/reference/balance right; red table header.
 * FORM: owner's service-invoice-template-2x.webp; no invented qty/rate/tax/shipping.
 * One A4 page, at most three task lines, exact stored amounts and safe URI actions. */
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
  function money(value: number, top: number, size = 10.5, face = bold, color = ink, maxWidth = 140) {
    const text = invoiceMoney(value, invoice.currency);
    const fitted = Math.min(size, size * maxWidth / face.widthOfTextAtSize(text, size));
    line(text, amountEdge, top, fitted, face, color, "right");
  }
  rectangle(0, 0, width, height, white);

  // Reference: brand/supplier at left, invoice identity and current balance at right.
  const logoWidth = 108, logoHeight = logoWidth * logo.height / logo.width;
  page.drawImage(logo, { x: margin, y: height - 44 - logoHeight, width: logoWidth, height: logoHeight });
  line("INVOICE", right, 49, 32, font, red, "right");
  single(invoice.number, right, 92, 218, 11, bold, ink, "right");
  const stamp = stamps[invoice.status];
  line(stamp.text, right, 117, 9, bold, stamp.ink, "right");
  line("Balance due", amountEdge, 151, 9.5, font, muted, "right");
  money(balances.due, 169, 20, bold, ink, 210);

  let supplierEnd = 44 + logoHeight + 13;
  single(SITE.legalName, margin, supplierEnd, 285, 10.5, bold, red); supplierEnd += 16;
  for (const text of [SITE.hq.street, `${SITE.hq.city}, ${SITE.hq.region} ${SITE.hq.postalCode}, ${SITE.hq.country}`]) {
    for (const row of wrap(text, 8.5, 285)) { line(row, margin, supplierEnd, 8.5, font, muted); supplierEnd += 13; }
  }
  single(`${SITE.email}  ·  ${SITE.phone}`, margin, supplierEnd + 1, 285, 8.5, font, muted); supplierEnd += 14;
  const registration = [
    [SITE.registration.gst ? `GSTIN: ${SITE.registration.gst}` : "", SITE.registration.tan ? `TAN: ${SITE.registration.tan}` : ""].filter(Boolean).join(" · "),
    SITE.registration.cin ? `CIN: ${SITE.registration.cin}` : "",
  ].filter(Boolean);
  for (const value of registration) { single(value, margin, supplierEnd, 285, 8.2, font, muted); supplierEnd += 12; }

  // No Ship to: the product stores a billing address, not a delivery destination.
  const billingWidth = bodyWidth - 192 - 36, metaX = right - 192;
  const billTop = Math.max(supplierEnd, 193) + 20;
  let cursor = billTop;
  line("Bill to", margin, cursor, 9.5); cursor += 19;
  if (invoice.client.company.trim()) { single(invoice.client.company, margin, cursor, billingWidth, 11.5, bold, red); cursor += 17; }
  single(invoice.client.name, margin, cursor, billingWidth, 10, invoice.client.company.trim() ? font : bold, invoice.client.company.trim() ? ink : red); cursor += 14;
  for (const address of clientAddressLines(invoice.client)) {
    single(address, margin, cursor, billingWidth, 8.8, font, muted); cursor += 13;
  }
  if (invoice.client.businessId) { single(`Client ID: ${invoice.client.businessId}`, margin, cursor, billingWidth, 8.2, font, muted); cursor += 12; }
  const dates = [
    ["Invoice date", invoiceDate(invoice.issuedAt)], ["Due date", invoiceDate(invoice.dueDate)], ["Currency", invoice.currency],
    ...(invoice.status === "paid" ? [["Paid on", invoiceDate(invoice.paidAt)]] : []),
  ];
  dates.forEach(([label, value], index) => {
    line(label, metaX, billTop + index * 21, 9, font, muted);
    line(value, right, billTop + index * 21, 9.5, font, ink, "right");
  });
  cursor = Math.max(cursor, billTop + dates.length * 21) + 18;

  // A coloured heading and a single soft table field, not boxed cards. Work
  // context is uncharged; row numbers belong only to actual task/service charges.
  const closingHeight = 52, summaryHeight = 146;
  const summaryTop = bottom - closingHeight - summaryHeight;
  const tableBottom = summaryTop - 22;
  const descriptionX = margin + 46;
  const descriptionWidth = right - 150 - descriptionX - 12;
  const [workTitle, ...workNotes] = clean(invoiceWorkDescription(invoice)).split("\n");
  const minimumTaskHeight = 22;
  const contextHeight = 18 + (invoice.project ? 26 : 0);
  const tableFixed = 42 + contextHeight + items.length * minimumTaskHeight + 12;
  const noteLimit = Math.max(1, Math.min(3, Math.floor((tableBottom - cursor - tableFixed) / 12.5)));
  rectangle(margin, cursor, bodyWidth, 30, red);
  line("#", margin + 12, cursor + 9, 9.5, font, white);
  line("Description", descriptionX, cursor + 9, 9.5, bold, white);
  line("Amount", amountEdge, cursor + 9, 9.5, bold, white, "right");
  rectangle(margin, cursor + 30, bodyWidth, tableBottom - cursor - 30, soft);
  cursor += 42;
  if (!items.length) line("1", margin + 12, cursor, 9, font, muted);
  single(workTitle || (items.length ? "Task breakdown" : "Professional services"), descriptionX, cursor, descriptionWidth, 10.5, bold);
  if (!items.length) line(amount, amountEdge, cursor, 10.5, bold, ink, "right");
  cursor += 18;
  if (workNotes.some(row => row.trim())) {
    for (const row of boundedRows(workNotes.join("\n"), 9, descriptionWidth, noteLimit)) { line(row, descriptionX, cursor, 9, font, muted); cursor += 12.5; }
  }
  if (invoice.project) {
    single(invoice.project.title, descriptionX, cursor, descriptionWidth, 9, font, muted); cursor += 13;
    single(invoice.project.code, descriptionX, cursor, descriptionWidth, 8.2, font, muted); cursor += 13;
  }
  const taskHeight = items.length ? Math.min(58, (tableBottom - cursor - 12) / items.length) : 0;
  if (items.length && taskHeight < minimumTaskHeight) throw new Error("Invoice tasks exceed the single-page layout.");
  for (const [index, item] of items.entries()) {
    rule(cursor + 3);
    const textTop = cursor + (taskHeight - 11) / 2;
    line(String(index + 1), margin + 12, textTop, 9, font, muted);
    single(item.description, descriptionX, textTop, descriptionWidth, 10);
    line(invoiceMoney(item.amount, invoice.currency), amountEdge, textTop, 10.5, font, ink, "right");
    cursor += taskHeight;
  }
  if (cursor + 12 > tableBottom) throw new Error("Invoice description exceeds the single-page layout.");
  rule(tableBottom);

  // Payment actions retain existing precedence, validation and paid-state gates.
  // They are URI annotations only: this renderer never calls a payment provider.
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
  const infoWidth = bodyWidth - 260 - 27;
  const noteRows = invoice.notes.trim() ? boundedRows(invoice.notes, 9, infoWidth, 2) : [];
  let infoCursor = summaryTop + 2;
  line(noteRows.length ? "Notes" : invoice.status === "paid" ? "Payment received" : invoice.status === "cancelled" ? "Invoice cancelled" : "Payment information", margin, infoCursor, 10.5, bold);
  infoCursor += 21;
  if (noteRows.length) {
    for (const row of noteRows) { line(row, margin, infoCursor, 9, font, muted); infoCursor += 12.5; }
    infoCursor += 10;
  }
  for (const row of boundedRows(information, 9, infoWidth, 2)) { line(row, margin, infoCursor, 9, font, invoice.status === "overdue" ? red : muted); infoCursor += 12.5; }
  if (payment) {
    const buttonTop = infoCursor + 8, buttonWidth = 102, buttonHeight = 26;
    page.drawRectangle({ x: margin, y: height - buttonTop - buttonHeight, width: buttonWidth, height: buttonHeight, color: white, borderColor: red, borderWidth: .8 });
    line("Pay now", margin + (buttonWidth - bold.widthOfTextAtSize("Pay now", 10)) / 2, buttonTop + 7.5, 10, bold, red);
    page.node.addAnnot(pdf.context.register(pdf.context.obj({
      Type: PDFName.of("Annot"), Subtype: PDFName.of("Link"),
      Rect: [margin, height - buttonTop - buttonHeight, margin + buttonWidth, height - buttonTop], Border: [0, 0, 0],
      A: { Type: PDFName.of("Action"), S: PDFName.of("URI"), URI: PDFString.of(payment) },
    })));
    const detail = external ? `Pay securely with ${paymentProvider(external)}.` : "Pay securely in your client portal.";
    const detailRows = boundedRows(detail, 8, infoWidth, 2);
    detailRows.forEach((value, index) => line(value, margin, buttonTop + buttonHeight + 7 + index * 10, 8, font, muted));
    if (buttonTop + buttonHeight + 7 + detailRows.length * 10 > summaryTop + summaryHeight) throw new Error("Invoice payment details exceed the single-page layout.");
  }

  // Match the reference's quiet totals and strong balance strip. No tax/discount
  // rows are invented; the header balance is a summary, not another charge.
  const summaryX = right - 260;
  const summaryRows: [string, number][] = [["Invoice total", balances.total], ["Amount paid", balances.paid]];
  summaryRows.forEach(([label, value], index) => {
    line(label, summaryX + 14, summaryTop + 18 + index * 28, 10, font, muted);
    money(value, summaryTop + 18 + index * 28, 10.5, font);
  });
  rule(summaryTop + 72, summaryX, right);
  rectangle(summaryX, summaryTop + 88, 260, 46, red);
  line("Balance due", summaryX + 14, summaryTop + 104, 10.5, bold, white);
  money(balances.due, summaryTop + 102, 16, bold, white);

  // The reference's terms region becomes factual invoice help, not invented
  // contract terms. Closing text stays close to the footer for sparse invoices.
  cursor = bottom - closingHeight;
  line("Invoice enquiries", margin, cursor, 10, bold); cursor += 20;
  line("For invoice queries or payment instructions, contact hello@savotechnologies.com.", margin, cursor, 8.5, font, muted); cursor += 14;
  line(abbreviated ? "Long text is shortened for this single-page invoice; full details remain in your portal." : "Amounts reflect the issued invoice. No additional taxes or fees are calculated in this document.", margin, cursor, 8, font, muted);
  if (cursor + 12 > bottom) throw new Error("Invoice content exceeds the single-page layout.");
  rule(height - 66);
  line(`Status as of ${invoiceDate(now)} · ${INVOICE_STATUS_LABEL[invoice.status]}`, margin, height - 51, 8, font, muted);
  line("Page 1 of 1", right, height - 51, 8, font, muted, "right");
  return pdf.save();
}
