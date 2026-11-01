import { afterEach, describe, expect, it, vi } from "vitest";
import { PAYPAL_CURRENCIES, paypalAmount, paypalMinor, paypalCurrencyReason, paypalApprovalUrl, paypalLiveAllowed, paypalSandboxAllowed } from "@/lib/paypal-policy";
import { verifyPayPalOrder, verifiedPayPalCapture } from "@/lib/paypal-evidence";
import type { PayPalOrder } from "@/lib/paypal";
const snap = { id: "snapshot", invoiceId: "invoice", invoiceNumber: "TEST-1", amount: 10000, currency: "USD", merchantId: "MERCHANT12345", orderId: "ORDER123456789012" };
function order(): PayPalOrder { return { id: snap.orderId, intent: "CAPTURE", status: "COMPLETED", purchase_units: [{ reference_id: snap.id, custom_id: snap.invoiceId, invoice_id: snap.invoiceNumber, amount: { currency_code: "USD", value: "100.00" }, payee: { merchant_id: snap.merchantId }, payments: { captures: [{ id: "CAPTURE1234567890", status: "COMPLETED", final_capture: true, amount: { currency_code: "USD", value: "100.00" }, seller_receivable_breakdown: { gross_amount: { currency_code: "USD", value: "100.00" }, paypal_fee: { currency_code: "USD", value: "4.70" }, net_amount: { currency_code: "USD", value: "95.30" } } }] } }] }; }
afterEach(() => vi.unstubAllEnvs());
describe("PayPal India currency and amount policy", () => {
  it.each(PAYPAL_CURRENCIES)("accepts an exact %s invoice amount without an app-side currency conversion", currency => { expect(paypalCurrencyReason(currency, 10000)).toBeNull(); expect(paypalMinor(paypalAmount(10000, currency), currency)).toBe(10000); });
  it.each(["INR", "AED", "ZAR", "RUB", "USD "])("fails closed for unsupported/restricted %s", currency => expect(paypalCurrencyReason(currency, 10000)).toBeTruthy());
  it.each(["JPY", "HUF", "TWD"])("requires whole %s units", currency => { expect(paypalCurrencyReason(currency, 10001)).toBeTruthy(); expect(paypalAmount(12300, currency)).toBe("123"); expect(paypalMinor("123.01", currency)).toBeNull(); });
  it.each(["1e3", "-1.00", "0.001", "NaN", " 1.00", "21474836.48", "100000000000000000000000"])("never accepts ambiguous/overflow decimal %s", value => expect(paypalMinor(value, "USD")).toBeNull());
  it("does exact integer accounting, never gross-up or charge a guessed merchant fee", () => { expect(paypalAmount(10001, "USD")).toBe("100.01"); expect(paypalMinor("0.30", "USD")).toBe(30); expect(paypalMinor("0", "USD")).toBe(0); });
});
describe("checkout environment and navigation boundaries", () => {
  it("never enables live money by default or on loopback even with production flags", () => {
    vi.stubEnv("NODE_ENV", "production"); vi.stubEnv("NEXT_PUBLIC_CONTENT_MODE", "production"); vi.stubEnv("NEXT_PUBLIC_SITE_URL", "http://localhost:4326"); vi.stubEnv("PAYPAL_LIVE_PAYMENTS_ENABLED", "true"); expect(paypalLiveAllowed()).toBe(false); expect(paypalSandboxAllowed()).toBe(true);
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://savotechnologies.com"); expect(paypalLiveAllowed()).toBe(true); expect(paypalSandboxAllowed()).toBe(false);
    vi.stubEnv("PAYPAL_LIVE_PAYMENTS_ENABLED", "false"); expect(paypalLiveAllowed()).toBe(false);
  });
  it("only accepts the matching provider approval host and order token", () => {
    const url = `https://www.sandbox.paypal.com/checkoutnow?token=${snap.orderId}`;
    expect(paypalApprovalUrl(url, "sandbox", snap.orderId)).toBe(url);
    for (const bad of [url.replace("sandbox.paypal.com", "evil.invalid"), url.replace("https:", "http:"), url.replace("checkoutnow", "elsewhere"), `${url}#hidden`, url.replace(snap.orderId, "OTHER")]) expect(paypalApprovalUrl(bad, "sandbox", snap.orderId)).toBeNull();
    expect(paypalApprovalUrl(url, "live", snap.orderId)).toBeNull();
  });
});
describe("verified provider capture evidence", () => {
  it("records actual merchant fees and net proceeds without adding them to the invoice", () => { expect(verifiedPayPalCapture(order(), snap)).toEqual({ captureId: "CAPTURE1234567890", amount: 10000, feeAmount: 470, feeCurrency: "USD", netAmount: 9530, netCurrency: "USD", errorCode: null }); });
  it.each(["order", "payee", "currency", "amount", "invoice", "reference"])("rejects a different %s", field => {
    const value = order(), unit = value.purchase_units[0];
    if (field === "order") value.id = "OTHER123456789012"; if (field === "payee") unit.payee!.merchant_id = "OTHER12345678"; if (field === "currency") unit.amount.currency_code = "EUR"; if (field === "amount") unit.amount.value = "99.99"; if (field === "invoice") unit.custom_id = "another-invoice"; if (field === "reference") unit.reference_id = "another-checkout";
    expect(() => verifyPayPalOrder(value, snap)).toThrow();
  });
  it.each(["APPROVED", "CREATED", "PAYER_ACTION_REQUIRED"])("does not mark %s paid", status => { const value = order(); value.status = status; expect(verifiedPayPalCapture(value, snap)).toBeNull(); });
  it("rejects partial/mismatched captures and quarantines bad ancillary fees without erasing valid payment evidence", () => {
    const value = order(), capture = value.purchase_units[0].payments!.captures![0];
    capture.final_capture = false; expect(verifiedPayPalCapture(value, snap)).toBeNull(); capture.final_capture = true;
    capture.amount.value = "99.99"; expect(() => verifiedPayPalCapture(value, snap)).toThrow(); capture.amount.value = "100.00";
    capture.seller_receivable_breakdown!.net_amount!.value = "96.00"; expect(verifiedPayPalCapture(value, snap)).toMatchObject({ amount: 10000, feeAmount: null, netAmount: null, errorCode: "PAYPAL_FEE_DETAILS_NEED_REVIEW" });
  });
  it("keeps a returned settlement currency separate without manufacturing an FX rate", () => {
    const value = order(); value.purchase_units[0].payments!.captures![0].seller_receivable_breakdown!.net_amount = { currency_code: "INR", value: "7800.00" };
    expect(verifiedPayPalCapture(value, snap)).toMatchObject({ amount: 10000, feeAmount: 470, feeCurrency: "USD", netAmount: 780000, netCurrency: "INR" });
  });
  it("does not mislabel additional provider deductions as an invented processing fee or GST", () => {
    const value = order(); value.purchase_units[0].payments!.captures![0].seller_receivable_breakdown!.net_amount!.value = "94.00";
    expect(verifiedPayPalCapture(value, snap)).toMatchObject({ amount: 10000, feeAmount: 470, netAmount: 9400 });
  });
  it("never invents a missing fee, settlement currency or FX rate", () => { const value = order(); delete value.purchase_units[0].payments!.captures![0].seller_receivable_breakdown; expect(verifiedPayPalCapture(value, snap)).toMatchObject({ feeAmount: null, feeCurrency: null, netAmount: null, netCurrency: null }); });
});
