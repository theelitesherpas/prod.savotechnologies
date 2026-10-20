/** Checkout fee policy — the single source of truth for the pay page
 *  breakdown AND every gateway amount (order creation, checkout
 *  verification, webhook reconciliation). Changing a rate here changes it
 *  everywhere consistently; all arithmetic is integer minor units.
 *
 *  - Processing fee: 2% of the invoice amount for INR, 3% for all other
 *    currencies (rounds half-up to the smallest unit).
 *  - GST: 18% on the processing fee, domestic (INR) payments only —
 *    international-currency checkouts carry no GST line.
 *  - The client pays subtotal + fee + GST; the invoice itself records the
 *    full amount as paid (the surcharge covers gateway costs). */

export const PROCESSING_FEE_RATE_INR = 0.02;
export const PROCESSING_FEE_RATE_INTERNATIONAL = 0.03;
export const GST_RATE_ON_FEE_INR = 0.18;

export type CheckoutTotals = {
  subtotal: number;
  feeRate: number;
  fee: number;
  gstRate: number;
  gst: number;
  total: number;
  domestic: boolean;
};

export function checkoutTotals(invoice: { amount: number; currency: string }): CheckoutTotals {
  const subtotal = Math.max(0, Math.round(invoice.amount));
  const domestic = invoice.currency.toUpperCase() === "INR";
  const feeRate = domestic ? PROCESSING_FEE_RATE_INR : PROCESSING_FEE_RATE_INTERNATIONAL;
  const gstRate = domestic ? GST_RATE_ON_FEE_INR : 0;
  const fee = Math.round(subtotal * feeRate);
  const gst = Math.round(fee * gstRate);
  return { subtotal, feeRate, fee, gstRate, gst, total: subtotal + fee + gst, domestic };
}

/** Human label for the fee line, e.g. "2%" / "3%". */
export function feePercentLabel(rate: number): string {
  return `${Math.round(rate * 100)}%`;
}
