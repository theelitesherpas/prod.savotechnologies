import { beforeEach, describe, expect, it, vi } from "vitest";
import { createHmac } from "node:crypto";

/**
 * Razorpay payment pipeline: API client request shape and error mapping,
 * create-link + sync admin actions (gated, transactional, resending the
 * branded email), and the signature-verified, replay-safe webhook that is
 * the only automated path recording payment.
 */

const db = vi.hoisted(() => ({
  invoice: { findUnique: vi.fn(), findFirst: vi.fn(), update: vi.fn(), delete: vi.fn() },
  webhookEvent: { create: vi.fn(), update: vi.fn() },
  clientProject: { findUnique: vi.fn(), findFirst: vi.fn(), update: vi.fn() },
  projectUpdate: { create: vi.fn() },
  clientUser: { findUnique: vi.fn() },
  paymentGatewayConfig: { findUnique: vi.fn(), upsert: vi.fn(), updateMany: vi.fn(), deleteMany: vi.fn() },
}));
const auth = vi.hoisted(() => ({ requireAdmin: vi.fn(), getAdminUser: vi.fn() }));
const auditLog = vi.hoisted(() => ({ audit: vi.fn() }));
const gateway = vi.hoisted(() => ({ createRazorpayPaymentLink: vi.fn(), fetchRazorpayPaymentLink: vi.fn(), cancelRazorpayPaymentLink: vi.fn() }));
const config = vi.hoisted(() => ({ getRazorpayConfig: vi.fn() }));

vi.mock("@/lib/prisma", () => ({ prisma: db }));
vi.mock("@/lib/auth", () => ({ requireAdmin: auth.requireAdmin, getAdminUser: auth.getAdminUser }));
vi.mock("@/lib/audit", () => ({ audit: auditLog.audit }));
vi.mock("@/lib/razorpay", () => ({ ...gateway, RazorpayError: class RazorpayError extends Error {} }));
vi.mock("@/lib/razorpay-config", () => ({ getRazorpayConfig: config.getRazorpayConfig, razorpayStatus: vi.fn(async () => ({ configured: true })) }));
vi.mock("@/lib/logger", () => ({ logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn() } }));
vi.mock("next/navigation", () => ({ redirect: (path: string) => { const e = new Error(`REDIRECT:${path}`); throw e; }, notFound: () => { throw new Error("NOT_FOUND"); } }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/server", () => ({ after: (fn: () => unknown) => { fn(); return Promise.resolve(); } }));
vi.mock("@/lib/mail", () => ({ sendMail: vi.fn(), renderTemplate: vi.fn(async () => null) }));

const ADMIN = { id: "admin-1", email: "admin@savo.test", name: "Admin", role: "admin" as const };
const SECRET = "webhook-secret-1234567890ABCDEF";
const invoice = {
  id: "inv-1234567890", number: "STPLIN00042", clientId: "client-1", projectId: null, milestoneId: null,
  amount: 250000, currency: "INR", status: "sent", notes: "", paymentLink: null, razorpayLinkId: null, razorpayPaymentId: null,
  issuedAt: new Date("2026-10-01T00:00:00Z"), dueDate: null, paidAt: null, createdAt: new Date(), updatedAt: new Date("2026-10-18T00:00:00Z"),
};
const client = { name: "Test Client", email: "client@example.test" };

function withFindUnique(rows: Record<string, unknown>) {
  db.invoice.findUnique.mockImplementation(async ({ where }: { where: { id?: string } }) => (where?.id === invoice.id ? { ...invoice, ...(rows.invoice ?? {}), client: rows.client ?? client } : null));
}
function withFindFirst(row: unknown) {
  db.invoice.findFirst.mockResolvedValue(row);
}

beforeEach(() => {
  vi.clearAllMocks();
  auth.requireAdmin.mockResolvedValue(ADMIN);
  auth.getAdminUser.mockResolvedValue(ADMIN);
  config.getRazorpayConfig.mockResolvedValue({ mode: "live", keyId: "rzp_live_KEY123456789", keySecret: "secret", webhookSecret: SECRET, source: "database" });
  withFindUnique({});
  withFindFirst(null);
  db.invoice.update.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({ ...invoice, ...data }));
  db.clientUser.findUnique.mockResolvedValue(client);
  db.webhookEvent.create.mockResolvedValue({});
  db.webhookEvent.update.mockResolvedValue({});
  gateway.cancelRazorpayPaymentLink.mockResolvedValue(true);
  gateway.fetchRazorpayPaymentLink.mockResolvedValue(null);
});

async function freshActions() {
  vi.resetModules();
  const businessIds = await import("@/lib/business-ids");
  vi.doMock("@/lib/business-ids", () => ({ ...businessIds, businessTransaction: (work: (tx: unknown) => Promise<unknown>) => work({
    invoice: db.invoice, webhookEvent: db.webhookEvent, clientProject: db.clientProject, projectUpdate: db.projectUpdate, clientUser: db.clientUser,
  }) }));
  return await import("@/app/admin/(protected)/invoices/actions");
}
async function freshRoute() {
  vi.resetModules();
  const businessIds = await import("@/lib/business-ids");
  vi.doMock("@/lib/business-ids", () => ({ ...businessIds, businessTransaction: (work: (tx: unknown) => Promise<unknown>) => work({
    invoice: db.invoice, webhookEvent: db.webhookEvent, clientProject: db.clientProject, projectUpdate: db.projectUpdate, clientUser: db.clientUser,
  }) }));
  return await import("@/app/api/webhooks/razorpay/route");
}

// ── admin actions ───────────────────────────────────────────────────────
describe("createInvoiceRazorpayLinkAction", () => {
  const form = () => { const f = new FormData(); f.set("id", invoice.id); return f; };

  it("creates a link for an unpaid invoice, stores url + id and queues the resend", async () => {
    const actions = await freshActions();
    gateway.createRazorpayPaymentLink.mockResolvedValueOnce({ id: "plink_NEW123", shortUrl: "https://rzp.io/i/AbCdEf123" });
    await expect(actions.createInvoiceRazorpayLinkAction(form())).rejects.toThrow("linked=1");
    expect(gateway.createRazorpayPaymentLink).toHaveBeenCalledWith(expect.objectContaining({ amount: 250000, currency: "INR", referenceId: "STPLIN00042", customer: { name: "Test Client", email: "client@example.test" } }));
    expect(db.invoice.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: invoice.id }, data: expect.objectContaining({ paymentLink: "https://rzp.io/i/AbCdEf123", razorpayLinkId: "plink_NEW123" }) }));
    expect(gateway.cancelRazorpayPaymentLink).not.toHaveBeenCalled();
    expect(auditLog.audit.mock.calls[0][1]).toBe("razorpay.link.create");
  });

  it("refuses drafts, paid and cancelled invoices, and requires the gateway", async () => {
    const actions = await freshActions();
    for (const status of ["draft", "paid", "cancelled"]) {
      withFindUnique({ invoice: { status } });
      await expect(actions.createInvoiceRazorpayLinkAction(form())).rejects.toThrow(/only%20for%20unpaid/);
    }
    withFindUnique({});
    config.getRazorpayConfig.mockResolvedValueOnce(null);
    await expect(actions.createInvoiceRazorpayLinkAction(form())).rejects.toThrow(/not%20configured/);
  });

  it("requires explicit confirmation to replace an existing gateway link, then cancels the old one", async () => {
    const actions = await freshActions();
    withFindUnique({ invoice: { razorpayLinkId: "plink_OLD1", paymentLink: "https://rzp.io/i/OldLink1" } });
    await expect(actions.createInvoiceRazorpayLinkAction(form())).rejects.toThrow(/already%20has%20a%20Razorpay%20link/);
    gateway.createRazorpayPaymentLink.mockResolvedValueOnce({ id: "plink_NEW2", shortUrl: "https://rzp.io/i/NewLink2" });
    const replace = form(); replace.set("replace", "yes");
    await expect(actions.createInvoiceRazorpayLinkAction(replace)).rejects.toThrow("linked=1");
    expect(gateway.cancelRazorpayPaymentLink).toHaveBeenCalledWith("plink_OLD1");
  });
});

describe("syncInvoiceRazorpayAction", () => {
  const form = () => { const f = new FormData(); f.set("id", invoice.id); return f; };

  it("records payment when the provider link is paid and amounts match exactly", async () => {
    const actions = await freshActions();
    withFindUnique({ invoice: { razorpayLinkId: "plink_X1" } });
    gateway.fetchRazorpayPaymentLink.mockResolvedValueOnce({ id: "plink_X1", status: "paid", amount: 250000, currency: "INR" });
    await expect(actions.syncInvoiceRazorpayAction(form())).rejects.toThrow("saved=paid&via=razorpay");
    expect(db.invoice.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: "paid", paidAt: expect.any(Date) }) }));
  });

  it("reports an unpaid link status without touching the invoice", async () => {
    const actions = await freshActions();
    withFindUnique({ invoice: { razorpayLinkId: "plink_X1" } });
    gateway.fetchRazorpayPaymentLink.mockResolvedValueOnce({ id: "plink_X1", status: "issued", amount: 250000, currency: "INR" });
    await expect(actions.syncInvoiceRazorpayAction(form())).rejects.toThrow(/razorpay=issued/);
    expect(db.invoice.update).not.toHaveBeenCalled();
  });

  it("refuses to record payment on any amount or currency mismatch", async () => {
    const actions = await freshActions();
    withFindUnique({ invoice: { razorpayLinkId: "plink_X1" } });
    gateway.fetchRazorpayPaymentLink.mockResolvedValueOnce({ id: "plink_X1", status: "paid", amount: 999999, currency: "INR" });
    await expect(actions.syncInvoiceRazorpayAction(form())).rejects.toThrow(/does%20not%20match/);
    gateway.fetchRazorpayPaymentLink.mockResolvedValueOnce({ id: "plink_X1", status: "paid", amount: 250000, currency: "USD" });
    await expect(actions.syncInvoiceRazorpayAction(form())).rejects.toThrow(/does%20not%20match/);
    expect(db.invoice.update).not.toHaveBeenCalled();
  });
});

// ── automatic linking policy (manual link wins) ─────────────────────
// Covered end-to-end (browser + stub gateway) in scripts/verify-razorpay-payments.mjs:
// manual link → zero gateway creations; no link → automatic creation.

// ── webhook ─────────────────────────────────────────────────────────────
describe("POST /api/webhooks/razorpay", () => {
  const linkEntity = { id: "plink_X1", reference_id: "STPLIN00042", amount: 250000, currency: "INR", status: "paid" };
  const paidBody = (entity: object = linkEntity) => JSON.stringify({ event: "payment_link.paid", payload: { payment_link: { entity }, payment: { entity: { id: "pay_PAYID123" } } } });
  const signed = (body: string) => ({
    "content-type": "application/json",
    "x-razorpay-signature": createHmac("sha256", SECRET).update(body, "utf8").digest("hex"),
    "x-razorpay-event-id": "evt_EDIA001",
  });

  it("marks the invoice paid, stores the payment id, records the event and queues the receipt", async () => {
    const { POST } = await freshRoute();
    withFindFirst({ ...invoice, razorpayLinkId: "plink_X1", client });
    const response = await POST(new Request("https://savo.test/api/webhooks/razorpay", { method: "POST", body: paidBody(), headers: signed(paidBody()) }));
    expect(response.status).toBe(200);
    expect(db.invoice.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: "paid", paidAt: expect.any(Date), razorpayPaymentId: "pay_PAYID123" }) }));
    expect(db.webhookEvent.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ id: "evt_EDIA001", event: "payment_link.paid" }) }));
    expect(db.webhookEvent.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: "processed" }) }));
    expect(auditLog.audit.mock.calls.at(-1)![1]).toBe("razorpay.webhook.paid");
  });

  it("is idempotent for replayed deliveries (duplicate event id acknowledged, no re-run)", async () => {
    const { POST } = await freshRoute();
    db.webhookEvent.create.mockImplementationOnce(async () => { const e = new Error("dup") as Error & { code?: string }; e.code = "P2002"; throw e; });
    const response = await POST(new Request("https://savo.test/api/webhooks/razorpay", { method: "POST", body: paidBody(), headers: signed(paidBody()) }));
    expect(response.status).toBe(200);
    expect(db.invoice.update).not.toHaveBeenCalled();
  });

  it("rejects invalid signatures with 400 and no detail", async () => {
    const { POST } = await freshRoute();
    const body = paidBody();
    const headers = signed(body); headers["x-razorpay-signature"] = "0".repeat(64);
    const response = await POST(new Request("https://savo.test/api/webhooks/razorpay", { method: "POST", body, headers }));
    expect(response.status).toBe(400);
    expect(db.invoice.update).not.toHaveBeenCalled();
  });

  it("requires a configured webhook secret (503) without which nothing processes", async () => {
    const { POST } = await freshRoute();
    config.getRazorpayConfig.mockResolvedValueOnce({ mode: "live", keyId: "k", keySecret: "s", webhookSecret: null, source: "database" });
    const body = paidBody();
    const response = await POST(new Request("https://savo.test/api/webhooks/razorpay", { method: "POST", body, headers: signed(body) }));
    expect(response.status).toBe(503);
  });

  it("never marks paid on amount or currency mismatch — records a rejection for review", async () => {
    const { POST } = await freshRoute();
    withFindFirst({ ...invoice, razorpayLinkId: "plink_X1", client });
    const body = paidBody({ ...linkEntity, amount: 100 });
    const response = await POST(new Request("https://savo.test/api/webhooks/razorpay", { method: "POST", body, headers: signed(body) }));
    expect(response.status).toBe(200);
    expect(db.invoice.update).not.toHaveBeenCalled();
    expect(db.webhookEvent.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: "rejected" }) }));
    expect(auditLog.audit.mock.calls.at(-1)![1]).toBe("razorpay.webhook.mismatch");
  });

  it("ignores unknown references and non-link events without information", async () => {
    const { POST } = await freshRoute();
    withFindFirst(null); // unknown link/reference
    let response = await POST(new Request("https://savo.test/api/webhooks/razorpay", { method: "POST", body: paidBody(), headers: signed(paidBody()) }));
    expect(response.status).toBe(200);
    expect(db.webhookEvent.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: "ignored" }) }));
    const cancelled = JSON.stringify({ event: "payment_link.cancelled", payload: { payment_link: { entity: { id: "plink_X1" } } } });
    response = await POST(new Request("https://savo.test/api/webhooks/razorpay", { method: "POST", body: cancelled, headers: signed(cancelled) }));
    expect(response.status).toBe(200);
    expect(db.invoice.update).not.toHaveBeenCalled();
  });

  it("acknowledges an already-paid invoice without resending effects", async () => {
    const { POST } = await freshRoute();
    withFindFirst({ ...invoice, status: "paid", paidAt: new Date(), razorpayLinkId: "plink_X1", client });
    withFindUnique({ invoice: { status: "paid", paidAt: new Date(), razorpayLinkId: "plink_X1" } }); // recordInvoicePaid re-reads via findUnique
    const response = await POST(new Request("https://savo.test/api/webhooks/razorpay", { method: "POST", body: paidBody(), headers: signed(paidBody()) }));
    expect(response.status).toBe(200);
    expect(db.invoice.update).not.toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: "paid" }) }));
    expect(db.webhookEvent.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: "processed", detail: expect.stringContaining("already") }) }));
  });
});

// ── api client (request shape via mocked fetch) ─────────────────────────
describe("razorpay api client", () => {
  it("sends minor-unit amounts with basic auth, no provider notifications, and maps provider errors", async () => {
    vi.resetModules();
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: "plink_Z", short_url: "https://rzp.io/i/Zz" }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const client = await vi.importActual<typeof import("@/lib/razorpay")>("@/lib/razorpay");
    const link = await client.createRazorpayPaymentLink({ amount: 250000, currency: "INR", referenceId: "STPLIN00042", description: "Invoice", customer: { name: "C", email: "c@e.test" } });
    expect(link).toEqual({ id: "plink_Z", shortUrl: "https://rzp.io/i/Zz" });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.razorpay.com/v1/payment_links");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toMatchObject({ amount: 250000, currency: "INR", reference_id: "STPLIN00042", notify: { sms: false, email: false }, reminder_enable: false });
    expect(init.headers.Authorization).toBe(`Basic ${Buffer.from("rzp_live_KEY123456789:secret").toString("base64")}`);
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ error: { description: "Currency not supported" } }), { status: 400 }));
    await expect(client.createRazorpayPaymentLink({ amount: 1, currency: "XXX", referenceId: "R", description: "D", customer: { name: "C", email: "c@e.test" } }))
      .rejects.toThrow("Currency not supported");
    vi.unstubAllGlobals();
  });
});
