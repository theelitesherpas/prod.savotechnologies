import { beforeEach, describe, expect, it, vi } from "vitest";
import { createHmac } from "node:crypto";

/**
 * Razorpay Standard Checkout pipeline: pay-target precedence (manual link
 * wins, portal checkout otherwise), checkout verification (signature, order
 * binding, provider record), portal order/verify actions (owner scope,
 * rate limits), and the signature-verified replay-safe webhook for
 * payment.captured + legacy payment_link.paid.
 */

const db = vi.hoisted(() => ({
  invoice: { findUnique: vi.fn(), findFirst: vi.fn(), update: vi.fn(), delete: vi.fn() },
  webhookEvent: { create: vi.fn(), update: vi.fn() },
  clientProject: { findUnique: vi.fn(), findFirst: vi.fn(), update: vi.fn() },
  projectUpdate: { create: vi.fn() },
  clientUser: { findUnique: vi.fn() },
  paymentGatewayConfig: { findUnique: vi.fn(), upsert: vi.fn(), updateMany: vi.fn(), deleteMany: vi.fn() },
}));
const auth = vi.hoisted(() => ({ requireAdmin: vi.fn(), getAdminUser: vi.fn(), getClientUser: vi.fn() }));
const auditLog = vi.hoisted(() => ({ audit: vi.fn() }));
const gateway = vi.hoisted(() => ({ createRazorpayOrder: vi.fn(), fetchRazorpayPayment: vi.fn(), fetchRazorpayOrderPayments: vi.fn(), createRazorpayPaymentLink: vi.fn(), fetchRazorpayPaymentLink: vi.fn(), cancelRazorpayPaymentLink: vi.fn() }));
const config = vi.hoisted(() => ({ getRazorpayConfig: vi.fn() }));

vi.mock("@/lib/prisma", () => ({ prisma: db }));
vi.mock("@/lib/auth", () => ({ requireAdmin: auth.requireAdmin, getAdminUser: auth.getAdminUser }));
vi.mock("@/lib/client-auth", () => ({ getClientUser: auth.getClientUser }));
vi.mock("@/lib/audit", () => ({ audit: auditLog.audit }));
vi.mock("@/lib/razorpay", () => gateway);
vi.mock("@/lib/razorpay-config", () => ({ getRazorpayConfig: config.getRazorpayConfig, razorpayStatus: vi.fn(async () => ({ configured: true })) }));
vi.mock("@/lib/logger", () => ({ logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn() } }));
vi.mock("next/navigation", () => ({ redirect: (path: string) => { throw new Error(`REDIRECT:${path}`); }, notFound: () => { throw new Error("NOT_FOUND"); } }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/server", () => ({ after: (fn: () => unknown) => { fn(); return Promise.resolve(); } }));
vi.mock("@/lib/mail", () => ({ sendMail: vi.fn(), renderTemplate: vi.fn(async () => null) }));

const ADMIN = { id: "admin-1", email: "admin@savo.test", name: "Admin", role: "admin" as const };
const CLIENT = { id: "client-1234567890", name: "Test Client", email: "client@example.test" };
const KEY_SECRET = "stub-key-secret-abcdef";
const WEBHOOK_SECRET = "webhook-secret-1234567890ABCDEF";
const CONFIG = { mode: "live", keyId: "rzp_live_KEY123456789", keySecret: KEY_SECRET, webhookSecret: WEBHOOK_SECRET, source: "database" as const };
const invoice = {
  id: "inv-1234567890", number: "STPLIN00042", clientId: CLIENT.id, projectId: null, milestoneId: null,
  amount: 250000, currency: "INR", status: "sent", notes: "", paymentLink: null, razorpayLinkId: null, razorpayOrderId: null, razorpayPaymentId: null,
  issuedAt: new Date("2026-10-01T00:00:00Z"), dueDate: null, paidAt: null, createdAt: new Date(), updatedAt: new Date("2026-10-18T00:00:00Z"),
};

beforeEach(() => {
  vi.clearAllMocks();
  for (const key of ["__savoRateLimiterV2"]) delete (globalThis as Record<string, unknown>)[key];
  auth.requireAdmin.mockResolvedValue(ADMIN);
  auth.getAdminUser.mockResolvedValue(ADMIN);
  auth.getClientUser.mockResolvedValue(CLIENT);
  config.getRazorpayConfig.mockResolvedValue(CONFIG);
  db.invoice.findFirst.mockResolvedValue(null);
  db.invoice.findUnique.mockImplementation(async ({ where }: { where: { id?: string } }) => (where?.id === invoice.id ? { ...invoice } : null));
  db.invoice.update.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({ ...invoice, ...data }));
  db.clientUser.findUnique.mockResolvedValue({ name: CLIENT.name, email: CLIENT.email });
  db.webhookEvent.create.mockResolvedValue({});
  db.webhookEvent.update.mockResolvedValue({});
  gateway.createRazorpayOrder.mockResolvedValue({ id: "order_NEWORDER12345", amount: 250000, currency: "INR", status: "created" });
  gateway.fetchRazorpayPayment.mockResolvedValue(null);
  gateway.fetchRazorpayOrderPayments.mockResolvedValue([]);
});

async function freshModule(path: string) {
  vi.resetModules();
  const businessIds = await import("@/lib/business-ids");
  const tx = { invoice: db.invoice, webhookEvent: db.webhookEvent, clientProject: db.clientProject, projectUpdate: db.projectUpdate, clientUser: db.clientUser };
  vi.doMock("@/lib/business-ids", () => ({ ...businessIds, businessTransaction: (work: (t: unknown) => Promise<unknown>) => work(tx) }));
  return await import(path);
}

// ── pay-target precedence ───────────────────────────────────────────────
describe("invoicePayTarget precedence", () => {
  it("a manual provider link always wins and stays external", async () => {
    const { invoicePayTarget } = await import("@/lib/payment-targets");
    const target = invoicePayTarget({ ...invoice, paymentLink: "https://paypal.me/example/2500" }, true);
    expect(target).toEqual({ url: "https://paypal.me/example/2500", external: true });
  });

  it("falls back to the portal checkout page only when the gateway is configured and the invoice is payable", async () => {
    const { invoicePayTarget } = await import("@/lib/payment-targets");
    expect(invoicePayTarget(invoice, true)).toEqual({ url: `/portal/invoices/${invoice.id}/pay`, external: false });
    expect(invoicePayTarget(invoice, false)).toBeNull(); // gateway off
    expect(invoicePayTarget({ ...invoice, status: "draft" }, true)).toBeNull();
    expect(invoicePayTarget({ ...invoice, status: "paid" }, true)).toBeNull();
    expect(invoicePayTarget({ ...invoice, amount: 0 }, true)).toBeNull();
  });

  it("fails closed for unsafe stored links instead of falling back to checkout", async () => {
    const { invoicePayTarget } = await import("@/lib/payment-targets");
    expect(invoicePayTarget({ ...invoice, paymentLink: "javascript:alert(1)" }, true)).toBeNull();
  });
});

// ── checkout verification ───────────────────────────────────────────────
describe("verifyRazorpayCheckout", () => {
  const orderId = "order_NEWORDER12345";
  const paymentId = "pay_PAYMENT12345";
  const signature = (oid: string, pid: string) => createHmac("sha256", KEY_SECRET).update(`${oid}|${pid}`).digest("hex");
  const input = (over: Partial<Parameters<typeof import("@/lib/razorpay-checkout").verifyRazorpayCheckout>[0]> = {}) => ({
    invoice: { id: invoice.id, number: invoice.number, amount: invoice.amount, currency: invoice.currency, razorpayOrderId: orderId },
    orderId, paymentId, signature: signature(orderId, paymentId), ...over,
  });
  const verify = () => import("@/lib/razorpay-checkout").then(m => m.verifyRazorpayCheckout);

  it("accepts a genuine captured payment for the bound order with matching amount", async () => {
    gateway.fetchRazorpayPayment.mockResolvedValueOnce({ id: paymentId, order_id: orderId, amount: 250000, currency: "INR", status: "captured", method: "upi" });
    const result = await (await verify())(input());
    expect(result).toMatchObject({ ok: true, paymentId, amount: 250000, currency: "INR", method: "upi" });
  });

  it("rejects forged signatures, wrong orders, unbound orders, uncaptured and mismatched payments", async () => {
    const check = await verify();
    const reason = async (args: Parameters<typeof import("@/lib/razorpay-checkout").verifyRazorpayCheckout>[0]) => {
      const result = await check(args);
      expect(result.ok).toBe(false);
      return (result as { reason: string }).reason;
    };
    expect(await reason(input({ signature: "0".repeat(64) }))).toBe("bad_signature");
    expect(await reason(input({ invoice: { ...invoice, razorpayOrderId: "order_OTHER1234567" } }))).toBe("order_mismatch");
    expect(await reason(input({ invoice: { ...invoice, razorpayOrderId: null } }))).toBe("order_mismatch");
    gateway.fetchRazorpayPayment.mockResolvedValueOnce(null);
    expect(await reason(input())).toBe("payment_not_found");
    gateway.fetchRazorpayPayment.mockResolvedValueOnce({ id: paymentId, order_id: orderId, amount: 250000, currency: "INR", status: "authorized" });
    expect(await reason(input())).toBe("not_captured");
    gateway.fetchRazorpayPayment.mockResolvedValueOnce({ id: paymentId, order_id: "order_SOMEOTHER12", amount: 250000, currency: "INR", status: "captured" });
    expect(await reason(input())).toBe("order_not_paid");
    gateway.fetchRazorpayPayment.mockResolvedValueOnce({ id: paymentId, order_id: orderId, amount: 999999, currency: "INR", status: "captured" });
    expect(await reason(input())).toBe("amount_mismatch");
    config.getRazorpayConfig.mockResolvedValueOnce(null);
    expect(await reason(input())).toBe("not_configured");
  });
});

// ── portal actions ──────────────────────────────────────────────────────
describe("portal checkout actions", () => {
  const actions = () => freshModule("@/app/portal/(app)/invoices/[id]/pay/actions") as Promise<typeof import("@/app/portal/(app)/invoices/[id]/pay/actions")>;

  it("creates an order server-side from the stored amount, bound to the invoice", async () => {
    const a = await actions();
    db.invoice.findFirst.mockResolvedValue({ ...invoice });
    const start = await a.createRazorpayOrderAction(invoice.id);
    expect(start.ok).toBe(true);
    if (!start.ok) return;
    expect(gateway.createRazorpayOrder).toHaveBeenCalledWith(expect.objectContaining({ amount: 250000, currency: "INR", receipt: "STPLIN00042", notes: { invoiceId: invoice.id, invoiceNumber: "STPLIN00042" } }));
    expect(start.keyId).toBe(CONFIG.keyId); // public key id reaches the browser, never the secret
    expect(db.invoice.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ razorpayOrderId: "order_NEWORDER12345" }) }));
  });

  it("is owner-scoped, payable-only, manual-link-free and throttled", async () => {
    const a = await actions();
    auth.getClientUser.mockResolvedValueOnce(null);
    expect((await a.createRazorpayOrderAction(invoice.id)).ok).toBe(false);
    db.invoice.findFirst.mockResolvedValue(null); // foreign/unmatched invoice
    auth.getClientUser.mockResolvedValue({ ...CLIENT, id: "client-OTHER12345" });
    expect((await a.createRazorpayOrderAction(invoice.id)).ok).toBe(false); // foreign invoice
    auth.getClientUser.mockResolvedValue(CLIENT);
    db.invoice.findFirst.mockResolvedValueOnce({ ...invoice, status: "draft" });
    expect((await a.createRazorpayOrderAction(invoice.id)).ok).toBe(false);
    db.invoice.findFirst.mockResolvedValueOnce({ ...invoice, paymentLink: "https://rzp.io/i/MANUAL123" });
    expect((await a.createRazorpayOrderAction(invoice.id)).ok).toBe(false); // manual link wins
    db.invoice.findFirst.mockResolvedValue({ ...invoice });
    // Fresh session bucket so earlier assertions in this test don't consume the limit.
    auth.getClientUser.mockResolvedValue({ ...CLIENT, id: "client-RATELIMIT01" });
    for (let i = 0; i < 12; i++) await a.createRazorpayOrderAction(invoice.id);
    expect((await a.createRazorpayOrderAction(invoice.id)).ok).toBe(false); // rate limit
    expect(gateway.createRazorpayOrder).toHaveBeenCalledTimes(12);
  });

  it("verifies a completed checkout and records payment exactly once", async () => {
    const a = await actions();
    const orderId = "order_NEWORDER12345", paymentId = "pay_PAID12345678";
    db.invoice.findFirst.mockResolvedValue({ ...invoice, razorpayOrderId: orderId });
    gateway.fetchRazorpayPayment.mockResolvedValueOnce({ id: paymentId, order_id: orderId, amount: 250000, currency: "INR", status: "captured", method: "upi" });
    const verdict = await a.verifyCheckoutAction({ invoiceId: invoice.id, orderId, paymentId, signature: createHmac("sha256", KEY_SECRET).update(`${orderId}|${paymentId}`).digest("hex") });
    expect(verdict.ok).toBe(true);
    expect(db.invoice.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: "paid", paidAt: expect.any(Date), razorpayPaymentId: paymentId }) }));
  });

  it("rejects a tampered confirmation without touching the invoice", async () => {
    const a = await actions();
    db.invoice.findFirst.mockResolvedValue({ ...invoice, razorpayOrderId: "order_NEWORDER12345" });
    const verdict = await a.verifyCheckoutAction({ invoiceId: invoice.id, orderId: "order_NEWORDER12345", paymentId: "pay_EVIL12345678", signature: "a".repeat(64) });
    expect(verdict.ok).toBe(false);
    expect(db.invoice.update).not.toHaveBeenCalled();
    expect(auditLog.audit.mock.calls.at(-1)![1]).toBe("razorpay.checkout.rejected");
  });
});

// ── webhook: payment.captured + legacy payment_link.paid ────────────────
describe("POST /api/webhooks/razorpay", () => {
  const route = () => freshModule("@/app/api/webhooks/razorpay/route") as Promise<typeof import("@/app/api/webhooks/razorpay/route")>;
  const sign = (body: string, secret = WEBHOOK_SECRET) => ({
    "content-type": "application/json",
    "x-razorpay-signature": createHmac("sha256", secret).update(body, "utf8").digest("hex"),
    "x-razorpay-event-id": `evt_${Math.random().toString(36).slice(2, 10)}`,
  });
  const capturedBody = (over: Record<string, unknown> = {}) => JSON.stringify({
    event: "payment.captured",
    payload: { payment: { entity: { id: "pay_CAP123456789", order_id: "order_WEBHOOK1234", amount: 250000, currency: "INR", status: "captured", method: "upi", notes: { invoiceId: invoice.id } , ...over } } },
  });

  it("marks the invoice paid from the provider order binding", async () => {
    const { POST } = await route();
    db.invoice.findFirst.mockResolvedValueOnce({ ...invoice, razorpayOrderId: "order_WEBHOOK1234", client: CLIENT });
    const body = capturedBody();
    const response = await POST(new Request("https://savo.test/api/webhooks/razorpay", { method: "POST", body, headers: sign(body) }));
    expect(response.status).toBe(200);
    expect(db.invoice.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: "paid", razorpayPaymentId: "pay_CAP123456789" }) }));
    expect(db.webhookEvent.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: "processed" }) }));
  });

  it("rejects captured payments whose amount does not match the invoice", async () => {
    const { POST } = await route();
    db.invoice.findFirst.mockResolvedValueOnce({ ...invoice, razorpayOrderId: "order_WEBHOOK1234", client: CLIENT });
    const body = capturedBody({ amount: 100 });
    const response = await POST(new Request("https://savo.test/api/webhooks/razorpay", { method: "POST", body, headers: sign(body) }));
    expect(response.status).toBe(200);
    expect(db.invoice.update).not.toHaveBeenCalled();
    expect(db.webhookEvent.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: "rejected" }) }));
  });

  it("ignores unknown orders, rejects bad signatures, and stays idempotent on replays", async () => {
    const { POST } = await route();
    db.invoice.findFirst.mockResolvedValueOnce(null);
    const body = capturedBody();
    expect((await POST(new Request("https://savo.test/api/webhooks/razorpay", { method: "POST", body, headers: sign(body) }))).status).toBe(200);
    const badHeaders = sign(body); badHeaders["x-razorpay-signature"] = "0".repeat(64);
    expect((await POST(new Request("https://savo.test/api/webhooks/razorpay", { method: "POST", body, headers: badHeaders }))).status).toBe(400);
    db.webhookEvent.create.mockImplementationOnce(async () => { const e = new Error("dup") as Error & { code?: string }; e.code = "P2002"; throw e; });
    db.invoice.findFirst.mockResolvedValueOnce({ ...invoice, razorpayOrderId: "order_WEBHOOK1234" });
    expect((await POST(new Request("https://savo.test/api/webhooks/razorpay", { method: "POST", body, headers: sign(body) }))).status).toBe(200);
    expect(db.invoice.update).not.toHaveBeenCalled();
  });

  it("still reconciles legacy hosted links (payment_link.paid)", async () => {
    const { POST } = await route();
    db.invoice.findFirst.mockResolvedValueOnce({ ...invoice, razorpayLinkId: "plink_LEGACY123", client: CLIENT });
    const body = JSON.stringify({ event: "payment_link.paid", payload: { payment_link: { entity: { id: "plink_LEGACY123", reference_id: invoice.number, amount: 250000, currency: "INR", status: "paid" } }, payment: { entity: { id: "pay_LEGACY12345" } } } });
    const response = await POST(new Request("https://savo.test/api/webhooks/razorpay", { method: "POST", body, headers: sign(body) }));
    expect(response.status).toBe(200);
    expect(db.invoice.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: "paid", razorpayPaymentId: "pay_LEGACY12345" }) }));
  });
});

// ── api client (request shape via mocked fetch) ─────────────────────────
describe("razorpay api client", () => {
  it("creates minor-unit orders with basic auth and maps provider errors", async () => {
    vi.resetModules();
    const fetchMock = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({ id: "order_Z", amount: 250000, currency: "INR", status: "created" }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const client = await vi.importActual<typeof import("@/lib/razorpay")>("@/lib/razorpay");
    const order = await client.createRazorpayOrder({ amount: 250000, currency: "INR", receipt: "STPLIN00042", notes: { invoiceId: "inv" } });
    expect(order.id).toBe("order_Z");
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.razorpay.com/v1/orders");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toMatchObject({ amount: 250000, currency: "INR", receipt: "STPLIN00042", notes: { invoiceId: "inv" } });
    expect(init.headers.Authorization).toBe(`Basic ${Buffer.from(`${CONFIG.keyId}:${KEY_SECRET}`).toString("base64")}`);
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ error: { description: "Currency not supported" } }), { status: 400 }));
    await expect(client.createRazorpayOrder({ amount: 1, currency: "XXX", receipt: "R" })).rejects.toThrow("Currency not supported");
    vi.unstubAllGlobals();
  });
});
