/** Invoice dueDate is a calendar date stored at UTC midnight. The job's
 * current business day/time is IST, independent of host/process timezone. */
export type ReminderResult = { ok: boolean; message: string; deliveryId?: string };
export const REMINDER_ZONE = "Asia/Kolkata";
export const REMINDER_SEND_HOUR = 9;
export const MANUAL_REMINDER_COOLDOWN_MS = 15 * 60_000;
export const REMINDER_KINDS = ["invoice_before_due", "invoice_due_today", "invoice_overdue"] as const;
export type InvoiceReminderKind = (typeof REMINDER_KINDS)[number];
export type ReminderKind = InvoiceReminderKind | "invoice_manual" | "meeting_manual";
const dayMs = 86400_000;
export function reminderClock(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: REMINDER_ZONE, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hourCycle: "h23" }).formatToParts(now);
  const get = (name: string) => parts.find(p => p.type === name)!.value;
  return { today: `${get("year")}-${get("month")}-${get("day")}`, hour: Number(get("hour")) };
}
export function shiftInvoiceDay(day: string, days: number): string {
  return new Date(Date.parse(`${day}T00:00:00Z`) + days * dayMs).toISOString().slice(0, 10);
}
export function invoiceReminderStage(dueDate: Date | null, today: string): { kind: InvoiceReminderKind; dueOn: string; scheduledOn: string } | null {
  if (!dueDate || !Number.isFinite(dueDate.getTime())) return null;
  const dueOn = dueDate.toISOString().slice(0, 10);
  const difference = (Date.parse(`${dueOn}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / dayMs;
  const kind = difference === 1 ? "invoice_before_due" : difference === 0 ? "invoice_due_today" : difference === -1 ? "invoice_overdue" : null;
  return kind ? { kind, dueOn, scheduledOn: today } : null;
}
export const REMINDER_TEMPLATE_KEYS: Record<InvoiceReminderKind | "invoice_manual", string> = {
  invoice_before_due: "invoiceDueTomorrow", invoice_due_today: "invoiceDueToday", invoice_overdue: "invoiceOverdueReminder", invoice_manual: "invoicePaymentReminder",
};
