import { z } from "zod";
import { billingTotal, MAX_BILLING_ITEMS, parseBillingJson, taskInput } from "@/lib/billing-items";
import { calendarDate, minorUnits, PROJECT_CURRENCIES, PROJECT_STATUSES } from "@/lib/project-finance";
const amount = z.string().transform((value, ctx) => {
  try { const result = minorUnits(value); if (result <= 0) throw new Error("Costs must be greater than zero."); return result; }
  catch (error) { ctx.addIssue({ code: "custom", message: error instanceof Error ? error.message : "Invalid cost." }); return z.NEVER; }
});
const date = z.string().transform((value, ctx) => {
  try { return calendarDate(value); }
  catch { ctx.addIssue({ code: "custom", message: "Enter a valid calendar date." }); return z.NEVER; }
});
export const milestoneInput = z.object({
  id: z.string().regex(/^[A-Za-z0-9_-]{10,64}$/).optional(),
  title: z.string().trim().min(2).max(140),
  description: z.string().trim().max(2000).default(""),
  amountMajor: amount,
  tasks: z.array(taskInput).max(MAX_BILLING_ITEMS, "A milestone can contain at most 3 tasks.").default([]),
  status: z.enum(["pending", "in_progress", "done"]).default("pending"),
  dueDate: date,
}).superRefine((data, ctx) => {
  if (!data.tasks.length) return;
  try {
    if (billingTotal(data.tasks) !== data.amountMajor) ctx.addIssue({ code: "custom", path: ["tasks"], message: "Task prices must add up exactly to the milestone cost." });
  } catch (error) { ctx.addIssue({ code: "custom", path: ["tasks"], message: error instanceof Error ? error.message : "Invalid task total." }); }
});
export const projectInput = z.object({
  clientId: z.string().min(10).max(32), title: z.string().trim().min(2).max(140),
  code: z.string().trim().max(24).default(""), // assigned server-side on create; immutable on update
  summary: z.string().trim().min(10, "Please describe the project (at least 10 characters).").max(2000),
  budgetMajor: amount, currency: z.enum(PROJECT_CURRENCIES),
  status: z.enum(PROJECT_STATUSES), startDate: date, dueDate: date,
  milestones: z.array(milestoneInput).min(1, "Add at least one milestone.").max(100),
}).superRefine((data, ctx) => {
  if (!data.dueDate) ctx.addIssue({ code: "custom", path: ["dueDate"], message: "Estimated delivery date is required." });
  if (data.startDate && data.dueDate && data.dueDate < data.startDate) ctx.addIssue({ code: "custom", message: "Delivery date cannot be before the start date." });
  if (data.milestones.reduce((sum, row) => sum + row.amountMajor, 0) !== data.budgetMajor) ctx.addIssue({ code: "custom", message: "Milestone costs must add up exactly to the fixed project budget." });
  const ids = data.milestones.flatMap(m => m.id ? [m.id] : []);
  if (new Set(ids).size !== ids.length) ctx.addIssue({ code: "custom", message: "Duplicate milestone references are not allowed." });
});
export function parseProjectForm(form: FormData) {
  const raw = String(form.get("milestones") ?? "[]");
  if (raw.length > 500_000) throw new Error("Project plan is too large.");
  let milestones: unknown;
  try { milestones = JSON.parse(raw); } catch { throw new Error("The milestone plan is invalid."); }
  const parsed = projectInput.safeParse(Object.fromEntries([
    ...["clientId", "title", "code", "summary", "budgetMajor", "currency", "status", "startDate", "dueDate"].map(k => [k, String(form.get(k) ?? "")]),
    ["milestones", milestones],
  ]));
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message || "Check the project fields.");
  return parsed.data;
}
export function parseAdditionalForm(form: FormData) {
  const result = milestoneInput.safeParse({
    ...Object.fromEntries(["title", "description", "amountMajor", "status", "dueDate"].map(k => [k, String(form.get(k) ?? (k === "status" ? "pending" : ""))])),
    tasks: parseBillingJson(form.get("tasks"), "Milestone task"),
  });
  if (!result.success) throw new Error(result.error.issues[0]?.message || "Check the additional work fields.");
  return result.data;
}
