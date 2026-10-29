import "server-only";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { clientFullName } from "@/lib/client-name";
import { renderTemplate } from "@/lib/mail";
import { liveMailAllowed } from "@/lib/mail/delivery-policy";
import { invoiceDate, invoiceMoney } from "@/lib/invoice-document";
import { invoicePaymentLink } from "@/lib/payment-links";
import { claimReminder, deliverReminder, skipReminder, type ReminderClaim, type ReminderResult } from "@/lib/reminder-delivery";
import { invoiceReminderStage, reminderClock, shiftInvoiceDay, REMINDER_SEND_HOUR, REMINDER_TEMPLATE_KEYS } from "@/lib/reminder-policy";
import type { Prisma } from "@prisma/client";

const payable: Prisma.InvoiceWhereInput = {
  status: { in: ["sent", "overdue"] }, amount: { gt: 0 }, paidAt: null,
  client: { active: true }, paymentTransactions: { none: { amount: { gt: 0 } } },
};
const include = { client: { select: { id: true, email: true, name: true, title: true, updatedAt: true } } } as const;
const unavailable = { ok: false, message: "Email reminders are unavailable. Check the server's email configuration." };

async function sendClaim(claim: ReminderClaim, now: Date, actor?: string, expectedRevision?: string): Promise<ReminderResult> {
  const invoice = await prisma!.invoice.findFirst({ where: { ...payable, id: claim.invoiceId! }, include });
  const today = reminderClock(now).today;
  const automatic = claim.kind !== "invoice_manual";
  const stage = invoice ? invoiceReminderStage(invoice.dueDate, today) : null;
  if (!invoice || (expectedRevision && invoice.updatedAt.toISOString() !== expectedRevision) || invoice.issuedAt.toISOString().slice(0, 10) > today ||
      (automatic && (stage?.kind !== claim.kind || stage?.dueOn !== claim.dueOn || stage?.scheduledOn !== claim.scheduledOn))) {
    await skipReminder(claim, "INVOICE_NO_LONGER_ELIGIBLE");
    return { ok: false, message: "This invoice is paid, inactive or has changed. Refresh its details before sending a reminder." };
  }
  if (!z.string().email().max(120).safeParse(invoice.client.email).success) {
    await skipReminder(claim, "INVALID_RECIPIENT");
    return { ok: false, message: "The client does not have a valid registered email address." };
  }
  const templateKey = REMINDER_TEMPLATE_KEYS[claim.kind as keyof typeof REMINDER_TEMPLATE_KEYS];
  const name = clientFullName(invoice.client.name, invoice.client.title);
  let template;
  try {
    template = await renderTemplate(templateKey, { name, number: invoice.number, amountMinor: String(invoice.amount), amount: invoiceMoney(invoice.amount, invoice.currency), currency: invoice.currency,
      dueDateIso: invoice.dueDate?.toISOString() ?? "", due: invoice.dueDate ? invoiceDate(invoice.dueDate) : "", paymentLink: invoicePaymentLink(invoice) || "", invoiceStatus: invoice.status });
  } catch { /* Invalid saved billing/template data fails closed. */ }
  if (!template) {
    await skipReminder(claim, "TEMPLATE_UNAVAILABLE");
    return { ok: false, message: "The reminder template could not be prepared. No email was sent." };
  }
  // Recheck immediately before SMTP, including payment history and recipient
  // changes. A payment arriving after SMTP submission cannot recall an email.
  const current = await prisma!.invoice.findFirst({ where: { ...payable, id: invoice.id, updatedAt: invoice.updatedAt,
    client: { active: true, updatedAt: invoice.client.updatedAt } }, select: { id: true } });
  if (!current) {
    await skipReminder(claim, "INVOICE_CHANGED_BEFORE_SEND");
    return { ok: false, message: "Invoice or client details changed. Refresh before sending a reminder." };
  }
  return deliverReminder(claim, invoice.client.email, template, { templateKey, toName: name, sentBy: actor }, now, automatic);
}

export async function sendManualInvoiceReminder(id: string, revision: string, actor: string, now = new Date()): Promise<ReminderResult> {
  if (!prisma || !liveMailAllowed()) return unavailable;
  try {
    const invoice = await prisma.invoice.findFirst({ where: { ...payable, id }, select: { updatedAt: true } });
    if (!invoice) return { ok: false, message: "Only unpaid, issued invoices for active clients can receive reminders." };
    if (invoice.updatedAt.toISOString() !== revision) return { ok: false, message: "This invoice changed. Refresh its details before sending." };
    const result = await claimReminder({ invoiceId: id }, "invoice_manual", now);
    if (!result.ok) return { ok: false, message: result.message };
    return await sendClaim(result.claim, now, actor, revision);
  } catch { return { ok: false, message: "The reminder could not be completed. Please review delivery history before retrying." }; }
}

/** Called only from the authenticated job endpoint. `now` is injectable for
 * local tests, never accepted from the HTTP caller. No historical catch-up. */
export async function runInvoiceReminders({ apply = false, now = new Date() }: { apply?: boolean; now?: Date } = {}) {
  const clock = reminderClock(now);
  const report = { date: clock.today, zone: "Asia/Kolkata", status: "ready", scanned: 0, eligible: 0, sent: 0, skipped: 0, failed: 0, capped: false };
  if (!prisma) throw new Error("REMINDER_DATABASE_UNAVAILABLE");
  if (apply && (process.env.INVOICE_REMINDERS_ENABLED !== "true" || !liveMailAllowed())) return { ...report, status: "disabled" };
  if (apply && clock.hour < REMINDER_SEND_HOUR) return { ...report, status: "before_send_hour" };
  if (apply) {
    await prisma.reminderDelivery.updateMany({ where: { kind: { in: ["invoice_before_due", "invoice_due_today", "invoice_overdue"] }, status: { in: ["pending", "retry"] }, scheduledOn: { lt: clock.today } }, data: { status: "skipped", errorCode: "CALENDAR_WINDOW_CLOSED" } });
    await prisma.reminderDelivery.updateMany({ where: { status: "sending", claimedAt: { lt: new Date(now.getTime() - 15 * 60_000) } }, data: { status: "uncertain", errorCode: "DELIVERY_CONFIRMATION_MISSING" } });
  }
  let cursor = "", attempted = 0;
  const startedAt = Date.now();
  while (report.scanned < 5000 && attempted < 25 && Date.now() - startedAt < 8 * 60_000) {
    const rows = await prisma.invoice.findMany({ where: { ...payable, ...(cursor ? { id: { gt: cursor } } : {}),
      dueDate: { gte: new Date(`${shiftInvoiceDay(clock.today, -1)}T00:00:00Z`), lt: new Date(`${shiftInvoiceDay(clock.today, 2)}T00:00:00Z`) },
      issuedAt: { lt: new Date(`${shiftInvoiceDay(clock.today, 1)}T00:00:00Z`) },
    }, orderBy: { id: "asc" }, take: 100, select: { id: true, dueDate: true } });
    if (!rows.length) break;
    for (const invoice of rows) {
      cursor = invoice.id; report.scanned++;
      const stage = invoiceReminderStage(invoice.dueDate, clock.today);
      if (!stage) { report.skipped++; continue; }
      report.eligible++;
      if (!apply) continue;
      const claimed = await claimReminder({ invoiceId: invoice.id }, stage.kind, now, stage);
      if (!claimed.ok) { report.skipped++; continue; }
      attempted++;
      const result = await sendClaim(claimed.claim, now);
      if (result.ok) report.sent++; else report.failed++;
      if (attempted >= 25) { report.capped = true; break; }
    }
    if (rows.length < 100) break;
  }
  if (report.scanned >= 5000 || Date.now() - startedAt >= 8 * 60_000) report.capped = true;
  return { ...report, status: apply ? "completed" : "dry_run" };
}
