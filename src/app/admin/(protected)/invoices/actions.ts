"use server";

import { generateBusinessId, claimBusinessId, rejectManualBusinessId, assertUnchangedReference } from "@/lib/business-ids";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { requireSection } from "@/lib/permissions";
import { audit } from "@/lib/audit";
import { calendarDate, minorUnits, PROJECT_CURRENCIES } from "@/lib/project-finance";
import { invoiceMoney, invoiceDate } from "@/lib/invoice-document";
import { invoicePaymentLink, normalizePaymentLink } from "@/lib/payment-links";
import { projectTransaction, reconcileProject, projectEmails, revalidateProjectViews, projectError, type ProjectEmail } from "@/lib/project-service";

const schema = z.object({ clientId: z.string().min(10).max(32), projectId: z.string().max(64), number: z.string().trim().max(32), currency: z.enum(PROJECT_CURRENCIES), status: z.enum(["draft", "sent", "paid", "overdue", "cancelled"]), notes: z.string().trim().max(500) });
function input(form: FormData) {
  const parsed = schema.safeParse(Object.fromEntries(["clientId", "projectId", "number", "currency", "status", "notes"].map(k => [k, String(form.get(k) ?? "")])));
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message || "Check the invoice fields.");
  const amount = minorUnits(String(form.get("amountMajor") ?? ""));
  const issuedAt = calendarDate(String(form.get("issuedAt") ?? "")) ?? new Date();
  const dueDate = calendarDate(String(form.get("dueDate") ?? ""));
  const paidAt = parsed.data.status === "paid" ? calendarDate(String(form.get("paidAt") ?? "")) ?? new Date() : null;
  if (dueDate && dueDate < new Date(issuedAt.toISOString().slice(0, 10))) throw new Error("Due date cannot be before the invoice issue date.");
  const paymentLink = normalizePaymentLink(String(form.get("paymentLink") ?? ""));
  return { ...parsed.data, projectId: parsed.data.projectId || null, amount, issuedAt, dueDate, paidAt, paymentLink };
}
async function operator() { const user = await requireAdmin(); await requireSection("clients"); if (!prisma) redirect("/admin/invoices?e=Database%20unavailable."); return user; }
const idValue = (form: FormData) => z.string().regex(/^[A-Za-z0-9_-]{10,64}$/).parse(form.get("id"));
function failed(base: string, error: unknown): never { redirect(`${base}?e=${encodeURIComponent(projectError(error))}`); }
async function owner(tx: Prisma.TransactionClient, d: { clientId: string; projectId: string | null; currency: string }) {
  const client = await tx.clientUser.findUnique({ where: { id: d.clientId }, select: { email: true, name: true } });
  if (!client) throw new Error("Choose an existing client.");
  if (d.projectId) {
    const project = await tx.clientProject.findFirst({ where: { id: d.projectId, clientId: d.clientId }, select: { currency: true, budget: true } });
    if (!project) throw new Error("The project does not belong to this client.");
    if (project.budget != null && project.currency !== d.currency) throw new Error("Invoice currency must match the selected project's currency. No automatic currency conversion is applied.");
  }
  return client;
}
function notification(client: { name: string; email: string }, invoice: { number: string; amount: number; currency: string; status: string; dueDate: Date | null; paymentLink?: string | null }): ProjectEmail[] {
  if (!["sent", "paid", "overdue"].includes(invoice.status)) return [];
  const days = invoice.dueDate ? Math.max(1, Math.ceil((Date.now() - invoice.dueDate.getTime()) / 86400000)) : 1;
  return [{ key: invoice.status === "paid" ? "invoicePaid" : invoice.status === "overdue" ? "invoiceOverdue" : "invoiceIssued", to: client.email,
    vars: { name: client.name, number: invoice.number, amount: invoiceMoney(invoice.amount, invoice.currency), amountMinor: String(invoice.amount), currency: invoice.currency,
      due: invoice.dueDate ? invoiceDate(invoice.dueDate) : "", dueDateIso: invoice.dueDate?.toISOString() ?? "", days: String(days), invoiceStatus: invoice.status, paymentLink: invoicePaymentLink(invoice) ?? "" } }];
}
async function sync(tx: Prisma.TransactionClient, ids: (string | null)[]) {
  const events: ProjectEmail[] = [];
  for (const id of new Set(ids.filter((id): id is string => !!id))) events.push(...await reconcileProject(tx, id));
  return events;
}

export async function createInvoiceAction(form: FormData): Promise<void> {
  const user = await operator();
  let number = "";
  let events: ProjectEmail[] = [], projectId: string | null = null, paymentHost: string | null = null;
  try {
    rejectManualBusinessId(form.get("businessId"));
    rejectManualBusinessId(form.get("number"));
    const d = input(form); projectId = d.projectId; paymentHost = d.paymentLink ? new URL(d.paymentLink).hostname : null;
    events = await projectTransaction(async tx => {
      const client = await owner(tx, d);
      number = await claimBusinessId(form, "IN", user.id, tx) ?? await generateBusinessId("IN", tx);
      const invoice = { ...d, number, businessId: number };
      await tx.invoice.create({ data: invoice });
      return [...notification(client, invoice), ...await sync(tx, [d.projectId])];
    });
  } catch (error) { failed("/admin/invoices", error); }
  await audit(user.id, "invoice.create", "Invoice", number, { hasPaymentLink: !!paymentHost, paymentHost });
  revalidateProjectViews(projectId ?? undefined); projectEmails(events); redirect("/admin/invoices?saved=created");
}
export async function updateInvoiceAction(form: FormData): Promise<void> {
  const user = await operator(); const id = idValue(form); let events: ProjectEmail[] = []; let affected: (string | null)[] = [];
  let paymentLinkChanged = false, paymentHost: string | null = null;
  try {
    const d = input(form);
    const result = await projectTransaction(async tx => {
      const before = await tx.invoice.findUnique({ where: { id } });
      if (!before) throw new Error("Invoice not found.");
      if (form.get("revision") !== before.updatedAt.toISOString()) throw new Error("This invoice changed while you were editing. Refresh before saving.");
      rejectManualBusinessId(form.get("businessId"));
      assertUnchangedReference(d.number, before.number);
      d.number = before.number;
      if (d.paymentLink && d.paymentLink === before.paymentLink && (d.clientId !== before.clientId || d.amount !== before.amount || d.currency !== before.currency) && form.get("paymentLinkConfirmed") !== "yes") {
        throw new Error("Client, amount or currency changed. Replace or clear the payment link, or verify it matches the updated invoice and tick the confirmation checkbox.");
      }
      const client = await owner(tx, d);
      await tx.invoice.update({ where: { id }, data: d });
      const changed = before.status !== d.status || before.amount !== d.amount || before.number !== d.number || before.currency !== d.currency || before.clientId !== d.clientId || before.dueDate?.getTime() !== d.dueDate?.getTime() || (before.paymentLink ?? null) !== d.paymentLink;
      return { paymentLinkChanged: (before.paymentLink ?? null) !== d.paymentLink, ids: [before.projectId, d.projectId], events: [...(changed ? notification(client, d) : []), ...await sync(tx, [before.projectId, d.projectId])] };
    });
    events = result.events; affected = result.ids; paymentLinkChanged = result.paymentLinkChanged; paymentHost = d.paymentLink ? new URL(d.paymentLink).hostname : null;
  } catch (error) { failed(`/admin/invoices/${id}`, error); }
  await audit(user.id, "invoice.update", "Invoice", id, { paymentLinkChanged, paymentHost, paymentLinkReconfirmed: form.get("paymentLinkConfirmed") === "yes" });
  for (const projectId of affected) revalidateProjectViews(projectId ?? undefined);
  revalidatePath(`/admin/invoices/${id}`); projectEmails(events); redirect("/admin/invoices?saved=1");
}
export async function markInvoicePaidAction(form: FormData): Promise<void> {
  const user = await operator(); const id = idValue(form); let events: ProjectEmail[] = []; let projectId: string | null = null;
  try {
    const result = await projectTransaction(async tx => {
      const before = await tx.invoice.findUnique({ where: { id } });
      if (!before) throw new Error("Invoice not found.");
      if (before.status === "paid") return { projectId: before.projectId, events: [] };
      if (["draft", "cancelled"].includes(before.status)) throw new Error("Only issued, non-cancelled invoices can be marked paid.");
      const client = await owner(tx, before);
      const invoice = await tx.invoice.update({ where: { id }, data: { status: "paid", paidAt: new Date() } });
      return { projectId: before.projectId, events: [...notification(client, invoice), ...await sync(tx, [before.projectId])] };
    });
    events = result.events; projectId = result.projectId;
  } catch (error) { failed("/admin/invoices", error); }
  await audit(user.id, "invoice.markPaid", "Invoice", id);
  revalidateProjectViews(projectId ?? undefined); revalidatePath(`/admin/invoices/${id}`); projectEmails(events); redirect("/admin/invoices?saved=paid");
}
export async function deleteInvoiceAction(form: FormData): Promise<void> {
  const user = await operator(); const id = idValue(form); let projectId: string | null = null; let events: ProjectEmail[] = [];
  try {
    const result = await projectTransaction(async tx => {
      const invoice = await tx.invoice.findUnique({ where: { id } });
      if (!invoice) throw new Error("Invoice not found.");
      if (invoice.status === "paid") throw new Error("Paid invoices must be retained. Correct their status and billing record instead of deleting payment history.");
      await tx.invoice.delete({ where: { id } });
      return { projectId: invoice.projectId, events: await sync(tx, [invoice.projectId]) };
    });
    projectId = result.projectId; events = result.events;
  } catch (error) { failed("/admin/invoices", error); }
  await audit(user.id, "invoice.delete", "Invoice", id);
  revalidateProjectViews(projectId ?? undefined); projectEmails(events); redirect("/admin/invoices?deleted=1");
}
