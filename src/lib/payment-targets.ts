import { invoicePaymentLink } from "@/lib/payment-links";

/**
 * Pay-now target policy — one decision shared by every surface (portal
 * tables, dashboard, pay page, invoice PDFs and transactional emails).
 *
 * Precedence:
 *   1. A manually provided (validated, allowlisted) payment link ALWAYS
 *      wins → external navigation. The Razorpay gateway is never involved.
 *   2. Otherwise, when the gateway is configured and the invoice is payable
 *      (sent/overdue, positive amount) → the portal checkout page, where
 *      Standard Checkout opens and returns with a server-verified result.
 *   3. Otherwise null — no payment action anywhere.
 */

export type PayTarget = { url: string; external: boolean };

export type PayableInvoice = {
  id: string;
  status: string;
  amount: number;
  paymentLink?: string | null;
};

export function invoicePayTarget(invoice: PayableInvoice, gatewayConfigured: boolean): PayTarget | null {
  const stored = invoicePaymentLink(invoice); // validated HTTPS allowlisted link or null (fails closed)
  if (stored) return { url: stored, external: true };
  // A stored but INVALID link fails closed: never silently substitute the
  // gateway for an invoice the operator deliberately linked elsewhere.
  if (invoice.paymentLink) return null;
  if (gatewayConfigured && ["sent", "overdue"].includes(invoice.status) && Number.isSafeInteger(invoice.amount) && invoice.amount > 0) {
    return { url: `/portal/invoices/${invoice.id}/pay`, external: false };
  }
  return null;
}

export function portalPayPath(invoiceId: string): string {
  return `/portal/invoices/${invoiceId}/pay`;
}
