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
import { normalizePaymentLink } from "@/lib/payment-links";
import { recordInvoicePaid, invoiceNotification } from "@/lib/invoice-payments";
import { createRazorpayPaymentLink, cancelRazorpayPaymentLink, fetchRazorpayPaymentLink } from "@/lib/razorpay";
import { getRazorpayConfig } from "@/lib/razorpay-config";
import { projectTransaction, reconcileProject, projectEmails, revalidateProjectViews, projectError, type ProjectEmail } from "@/lib/project-service";

const schema = z.object({ clientId: z.string().min(10).max(32), projectId: z.string().max(64), milestoneId: z.string().max(64), number: z.string().trim().max(32), currency: z.enum(PROJECT_CURRENCIES), status: z.enum(["draft", "sent", "paid", "overdue", "cancelled"]), notes: z.string().trim().max(500) });
function input(form: FormData) {
  const parsed = schema.safeParse(Object.fromEntries(["clientId", "projectId", "milestoneId", "number", "currency", "status", "notes"].map(k => [k, String(form.get(k) ?? "")])));
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message || "Check the invoice fields.");
  const amount = minorUnits(String(form.get("amountMajor") ?? ""));
  const issuedAt = calendarDate(String(form.get("issuedAt") ?? "")) ?? new Date();
  const dueDate = calendarDate(String(form.get("dueDate") ?? ""));
  const paidAt = parsed.data.status === "paid" ? calendarDate(String(form.get("paidAt") ?? "")) ?? new Date() : null;
  if (dueDate && dueDate < new Date(issuedAt.toISOString().slice(0, 10))) throw new Error("Due date cannot be before the invoice issue date.");
  const paymentLink = normalizePaymentLink(String(form.get("paymentLink") ?? ""));
  return { ...parsed.data, projectId: parsed.data.projectId || null, milestoneId: parsed.data.milestoneId || null, amount, issuedAt, dueDate, paidAt, paymentLink };
}
async function operator() { const user = await requireAdmin(); await requireSection("clients"); if (!prisma) redirect("/admin/invoices?e=Database%20unavailable."); return user; }
const idValue = (form: FormData) => z.string().regex(/^[A-Za-z0-9_-]{10,64}$/).parse(form.get("id"));
function failed(base: string, error: unknown): never { redirect(`${base}?e=${encodeURIComponent(projectError(error))}`); }
async function owner(tx: Prisma.TransactionClient, d: { clientId: string; projectId: string | null; milestoneId?: string | null; currency: string }) {
  const client = await tx.clientUser.findUnique({ where: { id: d.clientId }, select: { email: true, name: true } });
  if (!client) throw new Error("Choose an existing client.");
  if (d.projectId) {
    const project = await tx.clientProject.findFirst({ where: { id: d.projectId, clientId: d.clientId }, select: { currency: true, budget: true } });
    if (!project) throw new Error("The project does not belong to this client.");
    if (project.budget != null && project.currency !== d.currency) throw new Error("Invoice currency must match the selected project's currency. No automatic currency conversion is applied.");
  }
  if (d.milestoneId) {
    if (d.milestoneId === d.projectId) throw new Error("Check the milestone link.");
    // Same lookup shape as delivery edits: milestone + parent project in one read.
    const milestone = await tx.projectMilestone.findFirst({ where: { id: d.milestoneId }, select: { projectId: true, project: { select: { clientId: true, currency: true } } } });
    if (!milestone) throw new Error("Milestone not found.");
    if (milestone.projectId !== d.projectId) throw new Error("Link the milestone's own project to this invoice before selecting the milestone.");
    if (milestone.project.clientId !== d.clientId) throw new Error("The milestone belongs to a different client's project.");
    if (milestone.project.currency !== d.currency) throw new Error("Invoice currency must match the milestone's project currency.");
  }
  return client;
}
function notification(client: { name: string; email: string }, invoice: { number: string; amount: number; currency: string; status: string; dueDate: Date | null; paymentLink?: string | null }): ProjectEmail[] {
  return invoiceNotification(client, invoice);
}
async function sync(tx: Prisma.TransactionClient, ids: (string | null)[]) {
  const events: ProjectEmail[] = [];
  for (const id of new Set(ids.filter((id): id is string => !!id))) events.push(...await reconcileProject(tx, id));
  return events;
}

const NOTIFICATION_KEYS = new Set(["invoiceIssued", "invoicePaid", "invoiceOverdue"]);

/** Automatic Razorpay linking — ONLY when no manual link exists (policy:
 *  a manually provided link always wins and the gateway never fires), the
 *  invoice is payable with a positive amount, and the gateway is configured.
 *  Runs AFTER the invoice mutation commits; the provider call can fail
 *  without failing the save — the notification email is then rebuilt without
 *  the Pay now action and the operator is told why. */
async function automateInvoiceLink(
  invoiceId: string,
  client: { name: string; email: string },
): Promise<{ linked: boolean; linkId?: string; error?: string; events: ProjectEmail[] }> {
  try {
    const invoice = await prisma!.invoice.findUnique({ where: { id: invoiceId } });
    if (!invoice || invoice.paymentLink || invoice.razorpayLinkId) return { linked: false, events: [] };
    if (!["sent", "overdue"].includes(invoice.status) || !Number.isSafeInteger(invoice.amount) || invoice.amount <= 0) return { linked: false, events: [] };
    if (!(await getRazorpayConfig())) return { linked: false, events: [] };
    const link = await createRazorpayPaymentLink({
      amount: invoice.amount,
      currency: invoice.currency,
      referenceId: invoice.number,
      description: `Invoice ${invoice.number} — Savo Technologies`,
      customer: { name: client.name, email: client.email },
    });
    const url = normalizePaymentLink(link.shortUrl);
    const updated = await prisma!.invoice.update({ where: { id: invoiceId }, data: { paymentLink: url, razorpayLinkId: link.id } });
    return { linked: true, linkId: link.id, events: notification(client, updated) };
  } catch (error) {
    return { linked: false, error: projectError(error), events: [] };
  }
}

export async function createInvoiceAction(form: FormData): Promise<void> {
  const user = await operator();
  let number = "";
  let events: ProjectEmail[] = [], projectId: string | null = null, paymentHost: string | null = null, milestoneId: string | null = null;
  let createdId = "", clientRef: { name: string; email: string } | null = null;
  let autoLinked = false, autoLinkId: string | undefined, autoLinkError: string | null = null;
  let autoApplies = false;
  try {
    rejectManualBusinessId(form.get("businessId"));
    rejectManualBusinessId(form.get("number"));
    const d = input(form); projectId = d.projectId; milestoneId = d.milestoneId; paymentHost = d.paymentLink ? new URL(d.paymentLink).hostname : null;
    // A manual link always wins — the gateway is only consulted when none was provided.
    autoApplies = !d.paymentLink && ["sent", "overdue"].includes(d.status) && d.amount > 0;
    events = await projectTransaction(async tx => {
      const client = await owner(tx, d);
      clientRef = client;
      number = await claimBusinessId(form, "IN", user.id, tx) ?? await generateBusinessId("IN", tx);
      const invoice = { ...d, number, businessId: number };
      const created = await tx.invoice.create({ data: invoice });
      createdId = created.id;
      return [...notification(client, invoice), ...await sync(tx, [d.projectId])];
    });
    if (autoApplies && createdId && clientRef) {
      const auto = await automateInvoiceLink(createdId, clientRef);
      if (auto.linked) {
        autoLinked = true; autoLinkId = auto.linkId;
        events = [...auto.events, ...events.filter(e => !NOTIFICATION_KEYS.has(e.key))]; // email carries Pay now
      } else if (auto.error) autoLinkError = auto.error;
    }
  } catch (error) { failed("/admin/invoices", error); }
  await audit(user.id, "invoice.create", "Invoice", number, { hasPaymentLink: !!paymentHost, paymentHost, milestoneId: milestoneId ?? undefined, razorpayAutoLinked: autoLinked, razorpayLinkId: autoLinkId, razorpayAutoError: autoLinkError ? "link creation failed" : undefined });
  revalidateProjectViews(projectId ?? undefined); projectEmails(events);
  redirect(`/admin/invoices?saved=created${autoLinked ? "&linked=auto" : ""}${autoLinkError ? `&linkError=${encodeURIComponent(autoLinkError)}` : ""}`);
}
export async function updateInvoiceAction(form: FormData): Promise<void> {
  const user = await operator(); const id = idValue(form); let events: ProjectEmail[] = []; let affected: (string | null)[] = [];
  let paymentLinkChanged = false, paymentHost: string | null = null, milestoneChanged = false, milestoneId: string | null = null;
  let staleLinkId: string | null = null;
  let autoLinked = false, autoLinkId: string | undefined, autoLinkError: string | null = null;
  let autoApplies = false; let clientRef: { name: string; email: string } | null = null;
  try {
    const d = input(form); milestoneId = d.milestoneId;
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
      // A gateway-managed link must never outlive a state where it no longer
      // matches: status leaving sent/overdue, or any link replacement/clear.
      const leavesPayable = ["sent", "overdue"].includes(before.status) && !["sent", "overdue"].includes(d.status);
      const managedDetached = !!before.razorpayLinkId && (leavesPayable || (before.paymentLink ?? null) !== d.paymentLink);
      if (managedDetached) staleLinkId = before.razorpayLinkId;
      // Automatic linking fires only when the invoice FIRST becomes payable and
      // has never carried any link: a manual link (kept or entered) always wins,
      // and a deliberately cleared link is never silently re-created.
      autoApplies = !before.paymentLink && !before.razorpayLinkId && !d.paymentLink
        && !["sent", "overdue"].includes(before.status) && ["sent", "overdue"].includes(d.status) && d.amount > 0;
      const client = await owner(tx, d);
      clientRef = client;
      await tx.invoice.update({ where: { id }, data: { ...d, ...(managedDetached ? { razorpayLinkId: null } : {}) } });
      const changed = before.status !== d.status || before.amount !== d.amount || before.number !== d.number || before.currency !== d.currency || before.clientId !== d.clientId || before.dueDate?.getTime() !== d.dueDate?.getTime() || (before.paymentLink ?? null) !== d.paymentLink;
      return { paymentLinkChanged: (before.paymentLink ?? null) !== d.paymentLink, milestoneChanged: (before.milestoneId ?? null) !== (d.milestoneId ?? null), ids: [before.projectId, d.projectId], events: [...(changed ? notification(client, d) : []), ...await sync(tx, [before.projectId, d.projectId])] };
    });
    events = result.events; affected = result.ids; paymentLinkChanged = result.paymentLinkChanged; milestoneChanged = result.milestoneChanged; paymentHost = d.paymentLink ? new URL(d.paymentLink).hostname : null;
    if (autoApplies && clientRef) {
      const auto = await automateInvoiceLink(id, clientRef);
      if (auto.linked) {
        autoLinked = true; autoLinkId = auto.linkId;
        events = [...auto.events, ...events.filter(e => !NOTIFICATION_KEYS.has(e.key))];
      } else if (auto.error) autoLinkError = auto.error;
    }
  } catch (error) { failed(`/admin/invoices/${id}`, error); }
  if (staleLinkId) await cancelRazorpayPaymentLink(staleLinkId); // best-effort: provider-side cancel
  await audit(user.id, "invoice.update", "Invoice", id, { paymentLinkChanged, paymentHost, paymentLinkReconfirmed: form.get("paymentLinkConfirmed") === "yes", milestoneChanged, milestoneId: milestoneId ?? undefined, razorpayLinkCancelled: !!staleLinkId, razorpayAutoLinked: autoLinked, razorpayLinkId: autoLinkId, razorpayAutoError: autoLinkError ? "link creation failed" : undefined });
  for (const projectId of affected) revalidateProjectViews(projectId ?? undefined);
  revalidatePath(`/admin/invoices/${id}`); projectEmails(events);
  redirect(`/admin/invoices/${id}?saved=1${autoLinked ? "&linked=auto" : ""}${autoLinkError ? `&linkError=${encodeURIComponent(autoLinkError)}` : ""}`);
}
export async function markInvoicePaidAction(form: FormData): Promise<void> {
  const user = await operator(); const id = idValue(form); let events: ProjectEmail[] = []; let projectId: string | null = null;
  try {
    const result = await projectTransaction(async tx => {
      const outcome = await recordInvoicePaid(tx, id, { source: "admin" });
      if (!outcome.ok) throw new Error(outcome.reason === "not_payable" ? "Only issued, non-cancelled invoices can be marked paid." : "Invoice not found.");
      return outcome;
    });
    events = result.alreadyPaid ? [] : result.events; projectId = result.projectId;
  } catch (error) { failed("/admin/invoices", error); }
  await audit(user.id, "invoice.markPaid", "Invoice", id);
  revalidateProjectViews(projectId ?? undefined); revalidatePath(`/admin/invoices/${id}`); projectEmails(events); redirect("/admin/invoices?saved=paid");
}
export async function deleteInvoiceAction(form: FormData): Promise<void> {
  const user = await operator(); const id = idValue(form); let projectId: string | null = null; let events: ProjectEmail[] = []; let staleLinkId: string | null = null;
  try {
    const result = await projectTransaction(async tx => {
      const invoice = await tx.invoice.findUnique({ where: { id } });
      if (!invoice) throw new Error("Invoice not found.");
      if (invoice.status === "paid") throw new Error("Paid invoices must be retained. Correct their status and billing record instead of deleting payment history.");
      staleLinkId = invoice.razorpayLinkId;
      await tx.invoice.delete({ where: { id } });
      return { projectId: invoice.projectId, events: await sync(tx, [invoice.projectId]) };
    });
    projectId = result.projectId; events = result.events;
  } catch (error) { failed("/admin/invoices", error); }
  if (staleLinkId) await cancelRazorpayPaymentLink(staleLinkId); // best-effort: no stale payable link
  await audit(user.id, "invoice.delete", "Invoice", id, { razorpayLinkCancelled: !!staleLinkId });
  revalidateProjectViews(projectId ?? undefined); projectEmails(events); redirect("/admin/invoices?deleted=1");
}

// ── Razorpay payment links ─────────────────────────────────────────────

/** Create (or explicitly replace) the Razorpay payment link for one unpaid
 *  invoice, then resend the branded invoice email — its Pay now action, the
 *  portal buttons and the PDF link all activate automatically. */
export async function createInvoiceRazorpayLinkAction(form: FormData): Promise<void> {
  const user = await operator(); const id = idValue(form);
  let events: ProjectEmail[] = [], projectId: string | null = null, number = "", linkId = "";
  let replacedLinkId: string | null = null;
  try {
    const invoice = await prisma!.invoice.findUnique({ where: { id }, include: { client: { select: { name: true, email: true } } } });
    if (!invoice) throw new Error("Invoice not found.");
    number = invoice.number;
    if (!["sent", "overdue"].includes(invoice.status)) throw new Error("Create payment links only for unpaid (issued or overdue) invoices.");
    if (!Number.isSafeInteger(invoice.amount) || invoice.amount <= 0) throw new Error("The invoice needs a positive amount before a payment link can be created.");
    if (invoice.razorpayLinkId && form.get("replace") !== "yes") throw new Error("This invoice already has a Razorpay link. Tick the replace option to cancel it and create a fresh one.");
    replacedLinkId = invoice.razorpayLinkId;
    const gateway = await getRazorpayConfig();
    if (!gateway) throw new Error("Razorpay is not configured. Save the API keys under Settings → Payment gateway first.");
    const link = await createRazorpayPaymentLink({
      amount: invoice.amount,
      currency: invoice.currency,
      referenceId: invoice.number,
      description: `Invoice ${invoice.number} — Savo Technologies`,
      customer: { name: invoice.client.name, email: invoice.client.email },
    });
    linkId = link.id;
    const url = normalizePaymentLink(link.shortUrl);
    const result = await projectTransaction(async tx => {
      const fresh = await tx.invoice.findUnique({ where: { id } });
      if (!fresh) throw new Error("Invoice not found.");
      if (fresh.status !== invoice.status) throw new Error("The invoice changed while the link was being created. Refresh and retry.");
      const updated = await tx.invoice.update({ where: { id }, data: { paymentLink: url, razorpayLinkId: link.id } });
      return { events: [...notification(invoice.client, updated), ...await sync(tx, [updated.projectId])], projectId: updated.projectId };
    });
    events = result.events; projectId = result.projectId;
  } catch (error) { failed(`/admin/invoices/${id}`, error); }
  if (replacedLinkId && replacedLinkId !== linkId) await cancelRazorpayPaymentLink(replacedLinkId); // best-effort
  await audit(user.id, "razorpay.link.create", "Invoice", id, { number, linkId, replaced: !!replacedLinkId });
  revalidateProjectViews(projectId ?? undefined); revalidatePath(`/admin/invoices/${id}`);
  projectEmails(events); redirect(`/admin/invoices/${id}?linked=1`);
}

/** Reconcile one invoice against the provider's own record of its link —
 *  the manual safety net when a webhook is missed. Payment is only recorded
 *  when amount and currency match the invoice exactly. */
export async function syncInvoiceRazorpayAction(form: FormData): Promise<void> {
  const user = await operator(); const id = idValue(form);
  let events: ProjectEmail[] = [], projectId: string | null = null;
  let providerStatus: string | null = null;
  try {
    const invoice = await prisma!.invoice.findUnique({ where: { id } });
    if (!invoice) throw new Error("Invoice not found.");
    if (!invoice.razorpayLinkId) throw new Error("This invoice has no Razorpay link to sync.");
    const entity = await fetchRazorpayPaymentLink(invoice.razorpayLinkId);
    if (!entity) throw new Error("Razorpay no longer knows this payment link. Create a new one.");
    if (entity.status !== "paid") {
      // redirect() throws — it must not fire inside this try/catch.
      providerStatus = String(entity.status ?? "unknown");
    } else {
      if (!Number.isSafeInteger(entity.amount) || entity.amount !== invoice.amount || (entity.currency ?? invoice.currency) !== invoice.currency) {
        throw new Error(`Razorpay reports a paid amount that does not match invoice ${invoice.number}. Review it manually before recording payment.`);
      }
      const result = await projectTransaction(async tx => {
        const outcome = await recordInvoicePaid(tx, id, { source: "razorpay.sync" });
        if (!outcome.ok) throw new Error(outcome.reason === "not_payable" ? "Only issued, non-cancelled invoices can be marked paid." : "Invoice not found.");
        return outcome;
      });
      events = result.alreadyPaid ? [] : result.events; projectId = result.projectId;
      await audit(user.id, "razorpay.sync.paid", "Invoice", id, { number: invoice.number, linkId: invoice.razorpayLinkId, alreadyPaid: result.alreadyPaid });
    }
  } catch (error) { failed(`/admin/invoices/${id}`, error); }
  revalidateProjectViews(projectId ?? undefined); revalidatePath(`/admin/invoices/${id}`);
  projectEmails(events);
  redirect(providerStatus ? `/admin/invoices/${id}?razorpay=${encodeURIComponent(providerStatus)}` : `/admin/invoices/${id}?saved=paid&via=razorpay`);
}
