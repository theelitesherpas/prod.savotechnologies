import "server-only";
import { clientFullName } from "@/lib/client-name";
import type { Prisma } from "@prisma/client";
import { invoiceMoney, invoiceDate } from "@/lib/invoice-document";
import { invoicePaymentLink } from "@/lib/payment-links";
import { reconcileProject, type ProjectEmail } from "@/lib/project-service";
import { recordPaymentTransaction, type PaymentEvidence } from "@/lib/payment-transactions";

/**
 * Single authoritative routine for recording an invoice as paid, shared by
 * the manual admin action, the Razorpay sync action and the signature-
 * verified webhook. Guarantees identical semantics everywhere: draft and
 * cancelled invoices are never payable, already-paid is an idempotent no-op,
 * the receipt email is queued exactly once, and the linked project (and its
 * milestones) reconcile inside the same transaction.
 */

export type InvoiceNotificationClient = { name: string; title?: string | null; email: string };

/** Email events for an invoice state change (issued/paid/overdue). Drafts,
 *  cancelled records and unknown states never notify. `payUrl` is the
 *  server-decided checkout target (absolute portal pay URL) used by the
 *  email CTA when no manual provider link exists. */
export function invoiceNotification(client: InvoiceNotificationClient, invoice: { number: string; amount: number; currency: string; status: string; dueDate: Date | null; paymentLink?: string | null; payUrl?: string | null }): ProjectEmail[] {
  if (!["sent", "paid", "overdue"].includes(invoice.status)) return [];
  const days = invoice.dueDate ? Math.max(1, Math.ceil((Date.now() - invoice.dueDate.getTime()) / 86400000)) : 1;
  return [{ key: invoice.status === "paid" ? "invoicePaid" : invoice.status === "overdue" ? "invoiceOverdue" : "invoiceIssued", to: client.email,
    vars: { name: clientFullName(client.name, client.title), number: invoice.number, amount: invoiceMoney(invoice.amount, invoice.currency), amountMinor: String(invoice.amount), currency: invoice.currency,
      due: invoice.dueDate ? invoiceDate(invoice.dueDate) : "", dueDateIso: invoice.dueDate?.toISOString() ?? "", days: String(days), invoiceStatus: invoice.status, paymentLink: invoicePaymentLink(invoice) ?? "", payUrl: invoice.payUrl ?? "" } }];
}

export type RecordPaidOutcome =
  | { ok: true; alreadyPaid: boolean; events: ProjectEmail[]; projectId: string | null; invoiceNumber: string }
  | { ok: false; reason: "not_found" | "not_payable" };

/** Mark an invoice paid inside the caller's transaction. Never partially
 *  applies: effects and the status change commit together. */
export async function recordInvoicePaid(
  tx: Prisma.TransactionClient,
  invoiceId: string,
  opts: PaymentEvidence & { source: "admin" | "razorpay.webhook" | "razorpay.sync" | "razorpay.checkout" },
): Promise<RecordPaidOutcome> {
  const invoice = await tx.invoice.findUnique({ where: { id: invoiceId } });
  if (!invoice) return { ok: false, reason: "not_found" };
  if (invoice.status === "paid") {
    await recordPaymentTransaction(tx, invoice, opts, opts.source === "admin" ? "manual" : "razorpay");
    // Idempotent confirmation (e.g. webhook after manual marking). Keep any
    // missing provider payment reference for the audit trail.
    if (opts.paymentId && !invoice.razorpayPaymentId) {
      await tx.invoice.update({ where: { id: invoiceId }, data: { razorpayPaymentId: opts.paymentId } });
    }
    return { ok: true, alreadyPaid: true, events: [], projectId: invoice.projectId, invoiceNumber: invoice.number };
  }
  if (["draft", "cancelled"].includes(invoice.status)) return { ok: false, reason: "not_payable" };
  const client = await tx.clientUser.findUnique({ where: { id: invoice.clientId }, select: { name: true, title: true, email: true } });
  if (!client) return { ok: false, reason: "not_found" };
  const updated = await tx.invoice.update({
    where: { id: invoiceId },
    data: { status: "paid", paidAt: new Date(), ...(opts.paymentId ? { razorpayPaymentId: opts.paymentId } : {}) },
  });
  await recordPaymentTransaction(tx, updated, opts, opts.source === "admin" ? "manual" : "razorpay");
  const events = [...invoiceNotification(client, updated), ...(invoice.projectId ? await reconcileProject(tx, invoice.projectId) : [])];
  return { ok: true, alreadyPaid: false, events, projectId: invoice.projectId, invoiceNumber: updated.number };
}
