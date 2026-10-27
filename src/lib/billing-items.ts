import { z } from "zod";
import { minorUnits } from "@/lib/project-finance";

export const MAX_BILLING_ITEMS = 3;
export const MAX_TASK_NAME_LENGTH = 80;
export type MilestoneTask = { title: string; amount: number };
export type InvoiceItem = { description: string; amount: number };
export type TaskDraft = { title: string; amountMajor: string };
export type ItemDraft = { description: string; amountMajor: string };

export const positiveBillingAmount = z.string().transform((value, ctx) => {
  try {
    const result = minorUnits(value);
    if (result <= 0) throw new Error("Task prices must be greater than zero.");
    return result;
  } catch (error) {
    ctx.addIssue({ code: "custom", message: error instanceof Error ? error.message : "Invalid task price." });
    return z.NEVER;
  }
});
export const taskInput = z.object({
  title: z.string().trim().min(2, "Enter a task name (at least 2 characters).").max(MAX_TASK_NAME_LENGTH),
  amountMajor: positiveBillingAmount,
}).transform(row => ({ title: row.title, amount: row.amountMajor }));
const storedAmount = z.number().int().positive().max(2147483647);
const storedTasks = z.array(z.object({ title: z.string().trim().min(2).max(MAX_TASK_NAME_LENGTH), amount: storedAmount })).max(MAX_BILLING_ITEMS);
const storedItems = z.array(z.object({ description: z.string().trim().min(2).max(MAX_TASK_NAME_LENGTH), amount: storedAmount })).max(MAX_BILLING_ITEMS);

/** Null/absent means a legacy aggregate record. Malformed JSON fails closed. */
export function milestoneTasks(value: unknown): MilestoneTask[] {
  return storedTasks.parse(value ?? []);
}
export function invoiceItems(value: unknown): InvoiceItem[] {
  return storedItems.parse(value ?? []);
}
export function billingTotal(rows: { amount: number }[]): number {
  const total = rows.reduce((sum, row) => sum + row.amount, 0);
  if (!Number.isSafeInteger(total) || total > 2147483647) throw new Error("Task total exceeds the supported amount limit.");
  return total;
}
/** UI-only arithmetic follows the same exact decimal parser as the server. */
export function draftBillingTotal(rows: { amountMajor: string }[]): number | null {
  try {
    const prices = rows.map(row => ({ amount: minorUnits(row.amountMajor) }));
    if (prices.some(row => row.amount <= 0)) return null;
    return billingTotal(prices);
  } catch { return null; }
}
export function assertBillingTotal(rows: { amount: number }[], amount: number, label: string) {
  if (rows.length && billingTotal(rows) !== amount) throw new Error(`${label} prices must add up exactly to the total.`);
}
export function parseBillingJson(value: FormDataEntryValue | null, label: string): unknown {
  if (value == null) return [];
  if (typeof value !== "string" || value.length > 150_000) throw new Error(`${label} list is too large.`);
  try { return JSON.parse(value); } catch { throw new Error(`${label} list is invalid.`); }
}
export function parseInvoiceItems(value: FormDataEntryValue | null): InvoiceItem[] {
  const result = z.array(z.object({
    description: z.string().trim().min(2, "Enter a task description (at least 2 characters).").max(MAX_TASK_NAME_LENGTH, "Keep task names to 80 characters for the single-page invoice."),
    amountMajor: positiveBillingAmount,
  })).max(MAX_BILLING_ITEMS, "An invoice can contain at most 3 tasks.").safeParse(parseBillingJson(value, "Invoice task"));
  if (!result.success) throw new Error(result.error.issues[0]?.message || "Check the invoice tasks.");
  return result.data.map(row => ({ description: row.description, amount: row.amountMajor }));
}
export function milestoneBillingDescription(milestone: { title: string; description: string }) {
  return [milestone.title, milestone.description].filter(part => part.trim()).join("\n");
}
export function milestoneInvoiceItems(milestone: { tasks?: unknown }): InvoiceItem[] {
  return milestoneTasks(milestone.tasks).map(task => ({ description: task.title, amount: task.amount }));
}
