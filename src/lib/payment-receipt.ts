import type { RazorpayPaymentEntity } from "@/lib/razorpay";

/** Receipt display only. Never reconstruct historical charges from today's
 * fee policy. Show the captured provider total only when it is bound to the
 * stored reference/order and currency; DB status is the authority for paid. */
export function verifiedReceiptPayment(invoice: { amount: number; currency: string; razorpayPaymentId: string | null; razorpayOrderId: string | null }, payment: RazorpayPaymentEntity | null): { total: number; extra: number; method: string | null } | null {
  if (!payment || payment.id !== invoice.razorpayPaymentId || payment.status !== "captured" || payment.currency !== invoice.currency || !Number.isSafeInteger(payment.amount) || payment.amount! < invoice.amount) return null;
  if (invoice.razorpayOrderId && payment.order_id !== invoice.razorpayOrderId) return null;
  const methods: Record<string, string> = { upi: "UPI", card: "Card", netbanking: "Netbanking", wallet: "Wallet", bank_transfer: "Bank transfer", emi: "EMI", paylater: "Pay later" };
  return { total: payment.amount!, extra: payment.amount! - invoice.amount, method: payment.method ? methods[payment.method] ?? "Online payment" : null };
}
