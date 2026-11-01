/** PayPal India: international commercial payments, no INR checkout and no
 * assumed FX conversion. The app's existing money representation is 100
 * accounting units per major unit, even for zero-decimal PayPal currencies.
 * Merchant fees are deducted by PayPal, NOT surcharged to the buyer. */
export const PAYPAL_CURRENCIES = ["AUD", "BRL", "CAD", "CNY", "CHF", "CZK", "DKK", "EUR", "GBP", "HKD", "HUF", "ILS", "JPY", "MYR", "MXN", "NOK", "NZD", "PHP", "PLN", "SEK", "SGD", "THB", "TWD", "USD"] as const;
const whole = new Set(["HUF", "JPY", "TWD"]);
export function paypalCurrencyReason(currency: string, amount: number): string | null {
  if (!(PAYPAL_CURRENCIES as readonly string[]).includes(currency)) return "This invoice currency is not supported by PayPal checkout. Use Razorpay or bank deposit; the invoice is not converted automatically.";
  if (!Number.isSafeInteger(amount) || amount <= 0 || amount > 2_147_483_647) return "This invoice has no supported payable amount.";
  if (whole.has(currency) && amount % 100 !== 0) return `PayPal requires whole ${currency} amounts. Use another payment method for this invoice.`;
  return null;
}
export function paypalAmount(amount: number, currency: string): string {
  if (paypalCurrencyReason(currency, amount)) throw new Error("Unsupported PayPal amount or currency.");
  return whole.has(currency) ? String(amount / 100) : `${Math.floor(amount / 100)}.${String(amount % 100).padStart(2, "0")}`;
}
/** Strict decimal parsing, never floating point or exponential notation. */
export function paypalMinor(value: unknown, currency: string): number | null {
  if (typeof value !== "string" || !/^\d{1,10}(?:\.\d{1,2})?$/.test(value)) return null;
  const [major, fraction = ""] = value.split(".");
  if (whole.has(currency) && fraction && !/^0+$/.test(fraction)) return null;
  const result = Number(major) * 100 + Number(fraction.padEnd(2, "0"));
  return Number.isSafeInteger(result) && result >= 0 && result <= 2_147_483_647 ? result : null;
}
export function paypalSandboxAllowed(): boolean {
  if (process.env.NODE_ENV === "test") return true;
  try {
    const u = new URL(process.env.NEXT_PUBLIC_SITE_URL || "");
    if (["localhost", "127.0.0.1", "[::1]"].includes(u.hostname)) return true;
    return process.env.PAYPAL_SANDBOX_PAYMENTS_ENABLED === "true" && !["savotechnologies.com", "www.savotechnologies.com"].includes(u.hostname) && process.env.NEXT_PUBLIC_CONTENT_MODE !== "production";
  } catch { return false; }
}
export function paypalLiveAllowed(): boolean {
  if (process.env.PAYPAL_LIVE_PAYMENTS_ENABLED !== "true" || process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_CONTENT_MODE !== "production") return false;
  try { const u = new URL(process.env.NEXT_PUBLIC_SITE_URL || ""); return u.protocol === "https:" && !u.port && !u.username && !u.password && ["savotechnologies.com", "www.savotechnologies.com"].includes(u.hostname); } catch { return false; }
}
export function paypalApprovalUrl(value: unknown, mode: "sandbox" | "live", orderId: string): string | null {
  if (typeof value !== "string") return null;
  try { const u = new URL(value); if (u.protocol !== "https:" || u.hostname !== (mode === "sandbox" ? "www.sandbox.paypal.com" : "www.paypal.com") || u.port || u.username || u.password || u.hash || !["/checkoutnow", "/checkoutnow/"].includes(u.pathname) || u.searchParams.getAll("token").length !== 1 || u.searchParams.get("token") !== orderId) return null; return u.href; } catch { return null; }
}
export type PayPalStart = { ok: true; approvalUrl: string } | { ok: false; message: string };
export type PayPalResult = { ok: true; status: "completed" | "pending" } | { ok: false; message: string; retryable?: boolean };
