import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { createPayPalOrder, getPayPalOrder, capturePayPalOrder, verifyPayPalWebhook, PayPalOrderNotFound } from "@/lib/paypal";
import type { PayPalConfig } from "@/lib/paypal-config";
const fetcher = vi.fn();
const config: PayPalConfig = { mode: "sandbox", clientId: "synthetic-client-id", clientSecret: "synthetic-client-secret", merchantId: "MERCHANT12345", webhookId: "synthetic-webhook-id", fingerprint: "synthetic", verified: true };
const id = "ORDER123456789012";
const order = { id, status: "CREATED", intent: "CAPTURE", purchase_units: [{ amount: { currency_code: "USD", value: "100.00" } }], links: [{ rel: "payer-action", href: `https://www.sandbox.paypal.com/checkoutnow?token=${id}` }] };
beforeEach(() => { vi.clearAllMocks(); vi.stubGlobal("fetch", fetcher); fetcher.mockImplementation(async (url: string) => url.endsWith("/token") ? Response.json({ access_token: "synthetic-access-token", token_type: "Bearer" }) : Response.json(order)); });
afterEach(() => vi.unstubAllGlobals());
it("creates a server-owned CAPTURE order with exact original currency, payee and stable request ID", async () => {
  const input = { id: "f08c7f9f-fcc0-40ef-a659-f37c2fc78e62", invoiceId: "synthetic-invoice", number: "TEST-100", amount: 10000, currency: "USD", returnUrl: "http://localhost/return", cancelUrl: "http://localhost/cancel" };
  expect((await createPayPalOrder(config, input)).approvalUrl).toContain("www.sandbox.paypal.com");
  const [url, init] = fetcher.mock.calls[1]; expect(url).toBe("https://api-m.sandbox.paypal.com/v2/checkout/orders");
  expect(init.headers["PayPal-Request-Id"]).toBe(input.id); expect(init.redirect).toBe("error"); expect(init.cache).toBe("no-store");
  const body = JSON.parse(init.body); expect(body.intent).toBe("CAPTURE"); expect(body.purchase_units[0]).toMatchObject({ custom_id: input.invoiceId, invoice_id: input.number, reference_id: input.id, payee: { merchant_id: config.merchantId }, amount: { currency_code: "USD", value: "100.00" } });
});
it("captures with a durable idempotency key, never a newly generated key on retry", async () => {
  const requestId = "f08c7f9f-fcc0-40ef-a659-f37c2fc78e62"; await capturePayPalOrder(config, id, requestId); await capturePayPalOrder(config, id, requestId);
  const requests = fetcher.mock.calls.filter(([url]) => url.endsWith("/capture")); expect(requests).toHaveLength(2); expect(requests.map(([, init]) => init.headers["PayPal-Request-Id"])).toEqual([requestId, requestId]);
});
it("never follows provider redirects or accepts untrusted order identifiers as request paths", async () => {
  await expect(getPayPalOrder(config, "../../evil")).rejects.toThrow(); expect(fetcher).not.toHaveBeenCalled();
  fetcher.mockResolvedValueOnce(Response.json({ access_token: "synthetic-access-token", token_type: "Bearer" })).mockResolvedValueOnce(Response.json({ private: "must-not-leak" }, { status: 401 }));
  await expect(getPayPalOrder(config, id)).rejects.toThrow("could not confirm");
});
it.each([[404, "RESOURCE_NOT_FOUND", true], [404, "NOT_AUTHORIZED", false], [403, "RESOURCE_NOT_FOUND", false], [401, "RESOURCE_NOT_FOUND", false], [500, "RESOURCE_NOT_FOUND", false]])("classifies only authenticated order GET 404 RESOURCE_NOT_FOUND (%s/%s)", async (status, name, missing) => {
  fetcher.mockImplementation(async (url: string) => url.endsWith("/token") ? Response.json({ access_token: "synthetic-access-token", token_type: "Bearer" }) : Response.json({ name, private: "must-not-leak" }, { status: status as number }));
  const error = await getPayPalOrder(config, id).catch(error => error);
  expect(error).toBeInstanceOf(Error); expect(error instanceof PayPalOrderNotFound).toBe(missing); expect(error.message).not.toContain("must-not-leak");
});
it("does not classify capture or create failures as safely replaceable missing orders", async () => {
  fetcher.mockImplementation(async (url: string) => url.endsWith("/token") ? Response.json({ access_token: "synthetic-access-token", token_type: "Bearer" }) : Response.json({ name: "RESOURCE_NOT_FOUND" }, { status: 404 }));
  for (const call of [() => capturePayPalOrder(config, id, "f08c7f9f-fcc0-40ef-a659-f37c2fc78e62"), () => createPayPalOrder(config, { id: "snapshot", invoiceId: "invoice", number: "TEST", amount: 10000, currency: "USD", returnUrl: "http://localhost/return", cancelUrl: "http://localhost/cancel" })]) {
    const error = await call().catch(error => error); expect(error).toBeInstanceOf(Error); expect(error).not.toBeInstanceOf(PayPalOrderNotFound);
  }
});
it("does not classify non-JSON 404 or OAuth failure as an expired order", async () => {
  fetcher.mockImplementation(async (url: string) => url.endsWith("/token") ? Response.json({ access_token: "synthetic-access-token", token_type: "Bearer" }) : new Response("untrusted proxy response", { status: 404 }));
  expect(await getPayPalOrder(config, id).catch(error => error)).not.toBeInstanceOf(PayPalOrderNotFound);
  fetcher.mockResolvedValue(Response.json({ name: "RESOURCE_NOT_FOUND" }, { status: 404 }));
  expect(await getPayPalOrder(config, id).catch(error => error)).not.toBeInstanceOf(PayPalOrderNotFound);
});
it("rejects an external approval link before it reaches the browser", async () => {
  fetcher.mockImplementation(async (url: string) => url.endsWith("/token") ? Response.json({ access_token: "synthetic-access-token", token_type: "Bearer" }) : Response.json({ ...order, links: [{ rel: "payer-action", href: `https://evil.invalid/checkoutnow?token=${id}` }] }));
  await expect(createPayPalOrder(config, { id: "snapshot", invoiceId: "invoice", number: "TEST", amount: 10000, currency: "USD", returnUrl: "http://localhost/return", cancelUrl: "http://localhost/cancel" })).rejects.toThrow();
});
it("uses PayPal's authenticated signature verification, not a fetch of attacker certificate URLs", async () => {
  const headers = new Headers({ "paypal-auth-algo": "SHA256withRSA", "paypal-cert-url": "https://evil.invalid/private", "paypal-transmission-id": "synthetic", "paypal-transmission-sig": "synthetic", "paypal-transmission-time": new Date().toISOString() });
  expect(await verifyPayPalWebhook(config, headers, { id: "event" })).toBe(false); expect(fetcher).not.toHaveBeenCalled();
  headers.set("paypal-cert-url", "https://api.sandbox.paypal.com/v1/notifications/certs/SYNTHETIC");
  fetcher.mockImplementation(async (url: string) => url.endsWith("/token") ? Response.json({ access_token: "synthetic-access-token", token_type: "Bearer" }) : Response.json({ verification_status: "SUCCESS" }));
  expect(await verifyPayPalWebhook(config, headers, { id: "event" })).toBe(true);
  expect(fetcher.mock.calls[1][0]).toBe("https://api-m.sandbox.paypal.com/v1/notifications/verify-webhook-signature");
  expect(JSON.parse(fetcher.mock.calls[1][1].body).webhook_id).toBe(config.webhookId);
});
