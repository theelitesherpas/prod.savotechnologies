/** Shared server/browser payment-link policy. Never fetch provider URLs here.
 * Hosts are public configuration, not secrets; extra providers require a rebuild.
 * This is a hosted payment link, not a gateway/webhook or proof of payment. */
const TRUSTED_HOSTS = [
  "paypal.com", "paypal.me", "razorpay.com", "rzp.io", "rzp.me",
  "buy.stripe.com", "checkout.stripe.com", "invoice.stripe.com", "billing.stripe.com",
];
const configuredHosts = (process.env.NEXT_PUBLIC_PAYMENT_LINK_HOSTS || "").split(",")
  .map(host => host.trim().toLowerCase())
  .filter(host => /^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,63}$/.test(host) && !host.endsWith(".localhost") && !host.endsWith(".local") && !host.endsWith(".internal"));

export function normalizePaymentLink(value: string | null | undefined): string | null {
  const raw = (value ?? "").trim();
  if (!raw) return null;
  const invalid = () => new Error("Use a valid HTTPS payment link from PayPal, Razorpay, Stripe or an explicitly configured payment provider.");
  if (raw.length > 2048 || /[\s\\\u0000-\u001f\u007f]/.test(raw)) throw invalid();
  let url: URL;
  try { url = new URL(raw); } catch { throw invalid(); }
  if (url.href.length > 2048 || url.protocol !== "https:" || url.username || url.password || url.port || url.hostname.endsWith(".")) throw invalid();
  const host = url.hostname.toLowerCase();
  if (![...TRUSTED_HOSTS, ...configuredHosts].some(allowed => host === allowed || host.endsWith(`.${allowed}`))) throw invalid();
  if (url.pathname === "/" && !url.search && !url.hash) throw new Error("Use an invoice-specific payment link, not the provider's homepage.");
  return url.href;
}

/** Rendering fails closed for old/tampered data, while the save path reports
 * validation errors. Keep a link on a paid/cancelled record for admin history,
 * but never expose it as a payment action. Unknown states are non-payable. */
export function invoicePaymentLink(invoice: { paymentLink?: string | null; status: string; amount: number }): string | null {
  if (!["sent", "overdue"].includes(invoice.status) || !Number.isSafeInteger(invoice.amount) || invoice.amount <= 0) return null;
  try { return normalizePaymentLink(invoice.paymentLink); } catch { return null; }
}
export function paymentProvider(link: string): string {
  try {
    const host = new URL(link).hostname.toLowerCase();
    if (host === "paypal.me" || host.endsWith(".paypal.me") || host === "paypal.com" || host.endsWith(".paypal.com")) return "PayPal";
    if (["razorpay.com", "rzp.io", "rzp.me"].some(h => host === h || host.endsWith(`.${h}`))) return "Razorpay";
    if (host.endsWith(".stripe.com")) return "Stripe";
    return host;
  } catch { return "payment provider"; }
}
