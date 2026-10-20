import "server-only";
import type { Invoice, Prisma } from "@prisma/client";

export type PaymentEvidence = {
  paymentId?: string;
  /** The caller must verify amount/currency and order/link binding first. */
  chargedAmount?: number;
  method?: string | null;
};

/** Runs inside the same serializable transaction as invoice confirmation.
 * Different real payment IDs remain separate, retries stay idempotent. A
 * manual/historical confirmation can acquire its missing gateway evidence;
 * never duplicate that same confirmation when its webhook arrives later.
 * Core money/owner/date snapshots are immutable after insertion. */
export async function recordPaymentTransaction(
  tx: Prisma.TransactionClient,
  invoice: Invoice,
  evidence: PaymentEvidence = {},
  source: "manual" | "razorpay" = "manual",
) {
  const recordKey = evidence.paymentId ? `payment:${evidence.paymentId}` : `invoice:${invoice.id}`;
  const existing = await tx.paymentTransaction.findUnique({ where: { recordKey } });
  if (existing && (existing.clientId !== invoice.clientId || existing.invoiceId !== invoice.id)) {
    throw new Error("Payment reference is already bound to another billing record.");
  }
  // Never manufacture the historical total using today's fee rules.
  const chargedAmount = Number.isSafeInteger(evidence.chargedAmount) && evidence.chargedAmount! >= invoice.amount ? evidence.chargedAmount : undefined;
  const enrichment = {
    ...(chargedAmount !== undefined ? { chargedAmount } : {}),
    ...(evidence.method ? { method: evidence.method.slice(0, 40) } : {}),
  };
  if (existing) {
    // Fill missing facts only, never rewrite previously captured evidence.
    await tx.paymentTransaction.update({ where: { id: existing.id }, data: {
      ...(existing.chargedAmount == null && chargedAmount !== undefined ? { chargedAmount } : {}),
      ...(!existing.method && evidence.method ? { method: evidence.method.slice(0, 40) } : {}),
    } });
    return;
  }
  if (evidence.paymentId) {
    const unbound = await tx.paymentTransaction.findUnique({ where: { recordKey: `invoice:${invoice.id}` } });
    if (unbound) {
      if (unbound.clientId !== invoice.clientId || unbound.invoiceId !== invoice.id) throw new Error("Payment history owner changed; review this invoice manually.");
      await tx.paymentTransaction.update({ where: { id: unbound.id }, data: { recordKey, paymentId: evidence.paymentId, source: "razorpay", ...(unbound.chargedAmount == null && chargedAmount !== undefined ? { chargedAmount } : {}), ...(!unbound.method && evidence.method ? { method: evidence.method.slice(0, 40) } : {}) } });
      return;
    }
  } else if (await tx.paymentTransaction.findFirst({ where: { invoiceId: invoice.id } })) {
    // An administrator re-confirming a verified invoice is not another payment.
    return;
  }
  // A second distinct captured payment is real money received, but cannot
  // credit an invoice twice. Retain its charge/reference with zero extra credit.
  const priorCapture = evidence.paymentId ? await tx.paymentTransaction.findFirst({ where: { invoiceId: invoice.id } }) : null;
  const project = invoice.projectId ? await tx.clientProject.findFirst({ where: { id: invoice.projectId, clientId: invoice.clientId }, select: { title: true } }) : null;
  await tx.paymentTransaction.create({ data: {
    recordKey, clientId: invoice.clientId, invoiceId: invoice.id,
    invoiceNumber: invoice.number, projectTitle: project?.title ?? "",
    amount: priorCapture ? 0 : invoice.amount, currency: invoice.currency, occurredAt: priorCapture ? new Date() : invoice.paidAt,
    paymentId: evidence.paymentId ?? null, source, ...enrichment,
  } });
}
