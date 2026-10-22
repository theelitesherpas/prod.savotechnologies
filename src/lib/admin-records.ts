import { z } from "zod";
import type { RecordModule } from "@/lib/admin-portals";

export const recordId = z.string().min(10).max(40).regex(/^[a-zA-Z0-9_-]+$/);
const date = z.string().refine(value => {
  if (!value) return true;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(d.getTime()) && d.toISOString().slice(0, 10) === value && value >= "1900-01-01" && value <= "2200-12-31";
}, "Enter a valid date between 1900 and 2200.");
export const recordDate = (value: string) => value ? new Date(`${value}T00:00:00.000Z`) : null;
export const statusLabel = (value: string) => value.replaceAll("_", " ").replace(/^./, s => s.toUpperCase());

/** Only configured fields enter JSON; unknown/tampered form keys are ignored. */
export function parseRecordForm(module: RecordModule, form: FormData) {
  const fields: Record<string, z.ZodType> = {};
  for (const field of module.fields) {
    let schema: z.ZodType = z.string().trim().max(field.type === "textarea" ? 6000 : 500);
    if (field.type === "email") schema = z.union([z.literal(""), z.email().max(254)]);
    if (field.type === "url") schema = z.string().max(1000).refine(v => !v || safeRecordUrl(v) !== null, "Use an HTTPS document URL without embedded credentials.");
    if (field.type === "date") schema = date;
    if (field.type === "number") schema = z.string().refine(v => !v || (/^\d{1,10}(\.\d{1,2})?$/.test(v) && Number.isFinite(Number(v))), "Enter a non-negative number with at most two decimal places.");
    if (field.type === "select") schema = z.string().refine(v => !v || field.options?.includes(v), "Choose a listed option.");
    if (field.required) schema = schema.refine(v => typeof v === "string" && v.length > 0, `${field.label} is required.`);
    fields[field.key] = schema;
  }
  const schema = z.object({
    title: z.string().trim().min(2, "Enter a record title.").max(180),
    status: z.string().refine(v => module.statuses.includes(v), "Choose a valid status."),
    owner: z.string().trim().max(120),
    subjectId: module.key === "requisitions" ? z.union([z.literal(""), recordId]) : recordId,
    startDate: date, dueDate: date, notes: z.string().trim().max(10000),
    data: z.object(fields),
  }).refine(v => !v.startDate || !v.dueDate || v.dueDate >= v.startDate, { message: "Due date must be on or after the start date.", path: ["dueDate"] });
  return schema.safeParse({
    title: form.get("title"), status: form.get("status"), owner: form.get("owner") ?? "", subjectId: form.get("subjectId") ?? "",
    startDate: form.get("startDate") ?? "", dueDate: form.get("dueDate") ?? "", notes: form.get("notes") ?? "",
    data: Object.fromEntries(module.fields.map(f => [f.key, form.get(`data.${f.key}`) ?? ""])),
  });
}
export function safeRecordUrl(value: string) {
  try { const url = new URL(value); return url.protocol === "https:" && !url.username && !url.password ? url.href : null; } catch { return null; }
}
