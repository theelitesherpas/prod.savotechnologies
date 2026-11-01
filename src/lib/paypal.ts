import "server-only";
import { z } from "zod";
import type { PayPalConfig } from "@/lib/paypal-config";
import { paypalAmount, paypalApprovalUrl } from "@/lib/paypal-policy";
const money = z.object({ currency_code: z.string().regex(/^[A-Z]{3}$/), value: z.string().max(32) });
export const paypalOrderSchema = z.object({
  id: z.string().regex(/^[A-Z0-9]{17}$/), status: z.string(), intent: z.string().optional(),
  payer: z.object({ address: z.object({ country_code: z.string() }).passthrough().optional() }).passthrough().optional(),
  purchase_units: z.array(z.object({ reference_id: z.string().optional(), custom_id: z.string().optional(), invoice_id: z.string().optional(), amount: money,
    payee: z.object({ merchant_id: z.string().optional() }).passthrough().optional(),
    payments: z.object({ captures: z.array(z.object({ id: z.string().regex(/^[A-Z0-9]{17}$/), status: z.string(), final_capture: z.boolean().optional(), amount: money,
      seller_receivable_breakdown: z.object({ gross_amount: money.optional(), paypal_fee: money.optional(), net_amount: money.optional() }).passthrough().optional(),
    }).passthrough()).optional() }).passthrough().optional(),
  }).passthrough()).max(10),
  links: z.array(z.object({ rel: z.string(), href: z.string() }).passthrough()).optional(),
}).passthrough();
export type PayPalOrder = z.infer<typeof paypalOrderSchema>;
/** URLs are code-owned, never taken from an order/webhook/browser. No tokens
 * cached outside this invocation, no raw provider responses/errors in logs. */
function base(config: PayPalConfig) { return config.mode === "sandbox" ? "https://api-m.sandbox.paypal.com" : "https://api-m.paypal.com"; }
export class PayPalUnavailable extends Error { constructor() { super("PayPal could not confirm this request. Check the invoice status before trying to pay again."); } }
export async function paypalToken(config: PayPalConfig): Promise<string> {
  const response = await fetch(`${base(config)}/v1/oauth2/token`, { method: "POST", redirect: "error", cache: "no-store", signal: AbortSignal.timeout(10_000), headers: { Authorization: `Basic ${Buffer.from(`${config.clientId}:${config.clientSecret}`).toString("base64")}`, "Content-Type": "application/x-www-form-urlencoded" }, body: "grant_type=client_credentials" });
  if (!response.ok) throw new PayPalUnavailable();
  const data = z.object({ access_token: z.string().min(10).max(4096), token_type: z.literal("Bearer") }).parse(await response.json());
  return data.access_token;
}
async function request(config: PayPalConfig, path: string, method = "GET", body?: object, requestId?: string): Promise<unknown> {
  const token = await paypalToken(config);
  const response = await fetch(`${base(config)}${path}`, { method, redirect: "error", cache: "no-store", signal: AbortSignal.timeout(20_000), headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", Prefer: "return=representation", ...(requestId ? { "PayPal-Request-Id": requestId } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
  if (!response.ok) throw new PayPalUnavailable();
  return response.json();
}
export async function createPayPalOrder(config: PayPalConfig, input: { id: string; invoiceId: string; number: string; amount: number; currency: string; returnUrl: string; cancelUrl: string }) {
  const value = await request(config, "/v2/checkout/orders", "POST", { intent: "CAPTURE", purchase_units: [{ reference_id: input.id, custom_id: input.invoiceId, invoice_id: input.number, payee: { merchant_id: config.merchantId }, amount: { currency_code: input.currency, value: paypalAmount(input.amount, input.currency) } }], payment_source: { paypal: { experience_context: { brand_name: "Savo Technologies", user_action: "PAY_NOW", shipping_preference: "NO_SHIPPING", return_url: input.returnUrl, cancel_url: input.cancelUrl } } } }, input.id);
  const order = paypalOrderSchema.parse(value);
  const link = order.links?.find(l => l.rel === "payer-action" || l.rel === "approve");
  const approvalUrl = paypalApprovalUrl(link?.href, config.mode, order.id);
  if (!approvalUrl) throw new PayPalUnavailable();
  return { order, approvalUrl };
}
export async function getPayPalOrder(config: PayPalConfig, orderId: string): Promise<PayPalOrder> {
  if (!/^[A-Z0-9]{17}$/.test(orderId)) throw new PayPalUnavailable();
  return paypalOrderSchema.parse(await request(config, `/v2/checkout/orders/${orderId}`));
}
export async function capturePayPalOrder(config: PayPalConfig, orderId: string, requestId: string): Promise<void> {
  if (!/^[A-Z0-9]{17}$/.test(orderId) || !/^[a-f0-9-]{36}$/.test(requestId)) throw new PayPalUnavailable();
  await request(config, `/v2/checkout/orders/${orderId}/capture`, "POST", {}, requestId);
}
export async function verifyPayPalWebhook(config: PayPalConfig, headers: Headers, event: object): Promise<boolean> {
  if (!config.webhookId) return false;
  const data = { auth_algo: headers.get("paypal-auth-algo"), cert_url: headers.get("paypal-cert-url"), transmission_id: headers.get("paypal-transmission-id"), transmission_sig: headers.get("paypal-transmission-sig"), transmission_time: headers.get("paypal-transmission-time"), webhook_id: config.webhookId, webhook_event: event };
  if ([data.auth_algo, data.cert_url, data.transmission_id, data.transmission_sig, data.transmission_time].some(v => !v || v.length > 2048)) return false;
  try {
    const cert = new URL(data.cert_url!);
    const hosts = config.mode === "sandbox" ? ["api.sandbox.paypal.com", "api-m.sandbox.paypal.com"] : ["api.paypal.com", "api-m.paypal.com"];
    if (cert.protocol !== "https:" || !hosts.includes(cert.hostname) || cert.port || cert.username || cert.password || cert.search || cert.hash || !cert.pathname.startsWith("/v1/notifications/certs/")) return false;
    // Certificate URLs are NEVER fetched by this server (no SSRF). PayPal's
    // authenticated verification service verifies its own signature material.
    const result = await request(config, "/v1/notifications/verify-webhook-signature", "POST", data);
    return z.object({ verification_status: z.string() }).parse(result).verification_status === "SUCCESS";
  } catch { return false; }
}
