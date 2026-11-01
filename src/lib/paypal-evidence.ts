import type { PayPalOrder } from "@/lib/paypal";
import { paypalMinor } from "@/lib/paypal-policy";
export type PayPalSnapshot = { id: string; invoiceId: string | null; invoiceNumber: string; amount: number; currency: string; merchantId: string; orderId: string | null };
/** Approval is not payment evidence. Exact order, invoice, payee, amount and
 * currency bind independently of the provider's optional fee/FX metadata. */
export function verifyPayPalOrder(order: PayPalOrder, snapshot: PayPalSnapshot) {
  const unit = order.purchase_units[0];
  if (!snapshot.invoiceId || order.id !== snapshot.orderId || order.intent !== "CAPTURE" || order.purchase_units.length !== 1 || !unit || unit.reference_id !== snapshot.id || unit.custom_id !== snapshot.invoiceId || unit.invoice_id !== snapshot.invoiceNumber || unit.payee?.merchant_id !== snapshot.merchantId || unit.amount.currency_code !== snapshot.currency || paypalMinor(unit.amount.value, snapshot.currency) !== snapshot.amount) throw new Error("PAYPAL_ORDER_BINDING_MISMATCH");
  return unit;
}
export function verifiedPayPalCapture(order: PayPalOrder, snapshot: PayPalSnapshot) {
  const unit = verifyPayPalOrder(order, snapshot), captures = unit.payments?.captures ?? [];
  if (order.status !== "COMPLETED" || captures.length !== 1) return null;
  const capture = captures[0];
  if (capture.status !== "COMPLETED" || capture.final_capture !== true) return null;
  if (capture.amount.currency_code !== snapshot.currency || paypalMinor(capture.amount.value, snapshot.currency) !== snapshot.amount) throw new Error("PAYPAL_CAPTURE_AMOUNT_MISMATCH");
  const breakdown = capture.seller_receivable_breakdown;
  const actual = (value: typeof capture.amount | undefined) => {
    if (!value) return { amount: null, currency: null };
    const amount = paypalMinor(value.value, value.currency_code);
    if (amount === null) throw new Error("PAYPAL_INVALID_BREAKDOWN");
    return { amount, currency: value.currency_code };
  };
  let feeAmount: number | null = null, feeCurrency: string | null = null, netAmount: number | null = null, netCurrency: string | null = null, errorCode: string | null = null;
  try {
    const gross = breakdown?.gross_amount;
    if (gross && gross.currency_code === snapshot.currency && paypalMinor(gross.value, gross.currency_code) !== snapshot.amount) throw new Error("PAYPAL_INVALID_BREAKDOWN");
    const fee = actual(breakdown?.paypal_fee), net = actual(breakdown?.net_amount);
    if (fee.currency === snapshot.currency && fee.amount! > snapshot.amount) throw new Error("PAYPAL_INVALID_BREAKDOWN");
    if (net.currency === snapshot.currency && net.amount! > snapshot.amount) throw new Error("PAYPAL_INVALID_BREAKDOWN");
    if (fee.currency === snapshot.currency && net.currency === snapshot.currency && fee.amount! + net.amount! > snapshot.amount) throw new Error("PAYPAL_INVALID_BREAKDOWN");
    feeAmount = fee.amount; feeCurrency = fee.currency; netAmount = net.amount; netCurrency = net.currency;
  } catch {
    // Bad/overflowing ancillary fee metadata cannot erase a verified payment
    // or cause the buyer to be charged twice. Retain the capture and flag the
    // fee detail for statement review, rather than guessing an expense/FX rate.
    errorCode = "PAYPAL_FEE_DETAILS_NEED_REVIEW";
  }
  return { captureId: capture.id, amount: snapshot.amount, feeAmount, feeCurrency, netAmount, netCurrency, errorCode };
}
