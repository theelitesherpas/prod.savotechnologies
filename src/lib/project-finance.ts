/** One project currency; integer paise/cents throughout. No currency mixing. */
export const PROJECT_CURRENCIES = ["INR", "USD", "CHF", "EUR", "GBP", "AED"] as const;
export const PROJECT_STATUSES = ["planning", "in_progress", "review", "delivered", "paused", "cancelled"] as const;
export const PROJECT_STATUS_LABELS: Record<string, string> = {
  planning: "Planning", in_progress: "In progress", review: "In review", delivered: "Completed", paused: "Paused", cancelled: "Cancelled",
};
export function minorUnits(value: string): number {
  if (!/^\d{1,9}(?:\.\d{1,2})?$/.test(value.trim())) throw new Error("Enter an amount with no more than two decimal places.");
  const [whole, fraction = ""] = value.trim().split(".");
  const amount = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  if (!Number.isSafeInteger(amount) || amount > 2147483647) throw new Error("Amount exceeds the supported limit.");
  return amount;
}
export function majorUnits(value: number | null | undefined): string {
  return value == null ? "" : `${Math.floor(value / 100)}.${String(value % 100).padStart(2, "0")}`;
}
export function calendarDate(value: string): Date | null {
  if (!value) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error("Enter a valid calendar date.");
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) throw new Error("Enter a valid calendar date.");
  return date;
}
export type FinanceMilestone = { amount: number | null; status: string; scope: string };
/** Per-milestone payment view derived from the milestone's linked invoices.
 * Cancelled invoices never count. With a known milestone cost the milestone
 * is Paid only once paid linked invoices cover that exact cost; without one
 * (legacy rows) any paid linked invoice settles it. */
export type MilestonePaymentStatus = "paid" | "partially_paid" | "unpaid" | "uninvoiced";
export const MILESTONE_PAYMENT_LABELS: Record<MilestonePaymentStatus, string> = {
  paid: "Paid", partially_paid: "Partially paid", unpaid: "Unpaid", uninvoiced: "Not invoiced",
};
export function milestonePaymentStatus(milestoneAmount: number | null, linkedInvoices: { amount: number; status: string }[]): MilestonePaymentStatus {
  const active = linkedInvoices.filter(i => i.status !== "cancelled");
  if (!active.length) return "uninvoiced";
  const paid = active.filter(i => i.status === "paid").reduce((n, i) => n + i.amount, 0);
  if (milestoneAmount == null || milestoneAmount <= 0) return paid > 0 ? "paid" : "unpaid";
  if (paid >= milestoneAmount) return "paid";
  return paid > 0 ? "partially_paid" : "unpaid";
}
export function deliveryProgress(milestones: FinanceMilestone[]): number {
  if (!milestones.length) return 0;
  const total = milestones.reduce((n, m) => n + (m.amount ?? 0), 0);
  // Explicit legacy fallback; never guess money for an unbudgeted milestone.
  if (!total || milestones.some(m => m.amount == null)) return Math.round(100 * milestones.filter(m => m.status === "done").length / milestones.length);
  const done = milestones.reduce((n, m) => n + (m.status === "done" ? m.amount! : 0), 0);
  // Only show 100% when every module is actually done (rounding protection).
  return milestones.every(m => m.status === "done") ? 100 : Math.min(99, Math.round(done * 100 / total));
}
export function projectFinancials(project: { budget: number | null; currency: string }, milestones: FinanceMilestone[], invoices: { amount: number; currency: string; status: string }[]) {
  const additional = milestones.filter(m => m.scope === "additional").reduce((n, m) => n + (m.amount ?? 0), 0);
  const total = project.budget == null ? null : project.budget + additional;
  const relevant = invoices.filter(i => i.currency === project.currency);
  const paid = relevant.filter(i => i.status === "paid").reduce((n, i) => n + i.amount, 0);
  const invoicedDue = relevant.filter(i => i.status === "sent" || i.status === "overdue").reduce((n, i) => n + i.amount, 0);
  return { additional, total, paid, balance: total == null ? null : Math.max(0, total - paid), invoicedDue,
    fullyPaid: total != null && total > 0 && paid >= total && invoicedDue === 0 };
}
