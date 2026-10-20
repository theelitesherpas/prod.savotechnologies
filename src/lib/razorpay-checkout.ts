import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { getRazorpayConfig } from "@/lib/razorpay-config";
import { fetchRazorpayPayment } from "@/lib/razorpay";
import { checkoutTotals } from "@/lib/payment-fees";

/**
 * Razorpay Standard Checkout verification — the server-side half of the
 * portal payment experience. The browser callback proves nothing by itself;
 * every checkout completion is verified against three independent facts
 * before any payment is recorded:
 *
 *   1. Signature: HMAC-SHA256(`${order_id}|${payment_id}`, KEY_SECRET) —
 *      constant-time compared against the checkout handler's signature.
 *      This proves Razorpay produced the payment for OUR order.
 *   2. Order binding: the signed order id must equal the order this server
 *      created and stored on the invoice — a payment for any other order,
 *      however genuine, cannot mark this invoice paid.
 *   3. Provider record: the payment is fetched from the Razorpay API and
 *      must be captured, for this order, in the invoice's exact amount and
 *      currency.
 *
 * Only then does the caller run recordInvoicePaid (idempotent — the webhook
 * racing this path is safe).
 */

export type CheckoutVerification =
  | { ok: true; paymentId: string; amount: number; currency: string; method: string | null }
  | { ok: false; reason: "not_configured" | "order_mismatch" | "bad_signature" | "payment_not_found" | "not_captured" | "amount_mismatch" | "order_not_paid"; message: string };

export function expectedCheckoutSignature(orderId: string, paymentId: string, keySecret: string): string {
  return createHmac("sha256", keySecret).update(`${orderId}|${paymentId}`).digest("hex");
}

function constantTimeHexEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a, "utf8"), bb = Buffer.from(b, "utf8");
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

export async function verifyRazorpayCheckout(input: {
  invoice: { id: string; number: string; amount: number; currency: string; razorpayOrderId: string | null };
  orderId: string;
  paymentId: string;
  signature: string;
}): Promise<CheckoutVerification> {
  const config = await getRazorpayConfig();
  if (!config) return { ok: false, reason: "not_configured", message: "Payment processing is not available right now. Please try again shortly." };
  if (!input.invoice.razorpayOrderId || input.invoice.razorpayOrderId !== input.orderId) {
    return { ok: false, reason: "order_mismatch", message: "This payment does not match the checkout session for this invoice. No payment was recorded." };
  }
  if (!/^[A-Za-z0-9|_-]{10,200}$/.test(input.orderId) || !/^pay_[A-Za-z0-9]{6,64}$/.test(input.paymentId)) {
    return { ok: false, reason: "bad_signature", message: "The payment confirmation was malformed. No payment was recorded." };
  }
  if (!constantTimeHexEqual(expectedCheckoutSignature(input.orderId, input.paymentId, config.keySecret), input.signature)) {
    return { ok: false, reason: "bad_signature", message: "The payment confirmation could not be verified. No payment was recorded." };
  }
  const payment = await fetchRazorpayPayment(input.paymentId);
  if (!payment) return { ok: false, reason: "payment_not_found", message: "Razorpay has no record of this payment. If money left your account it will be refunded automatically." };
  if (payment.status !== "captured") return { ok: false, reason: "not_captured", message: `Razorpay reports this payment as "${payment.status ?? "unknown"}". Nothing was recorded; contact us if you were charged.` };
  if (payment.order_id !== input.orderId) return { ok: false, reason: "order_not_paid", message: "This payment belongs to a different checkout session. No payment was recorded." };
  // Orders are created for subtotal + processing fee (+ GST on fee, INR only)
  // — the paid amount must equal exactly that total for THIS invoice.
  const expected = checkoutTotals(input.invoice).total;
  if (!Number.isSafeInteger(payment.amount) || payment.amount !== expected || (payment.currency ?? input.invoice.currency) !== input.invoice.currency) {
    return { ok: false, reason: "amount_mismatch", message: "The paid amount does not match this checkout total. No payment was recorded — our team will review." };
  }
  return { ok: true, paymentId: payment.id, amount: payment.amount, currency: payment.currency ?? input.invoice.currency, method: payment.method ?? null };
}
