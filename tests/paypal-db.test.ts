/** Opt-in ONLY in the disposable database provisioned by verify-paypal.mjs. */
import { randomBytes } from "node:crypto";
import type { PrismaClient } from "@prisma/client";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({ db: null as PrismaClient | null, create: vi.fn(), get: vi.fn(), capture: vi.fn(), events: vi.fn(), completed: false, fingerprint: "synthetic-fingerprint" }));
vi.mock("@/lib/prisma", async () => { const { PrismaClient } = await import("@prisma/client"); m.db = new PrismaClient(); return { prisma: m.db }; });
vi.mock("@/lib/paypal-config", () => ({ getPayPalConfig: async () => ({ mode: "sandbox", merchantId: "MERCHANT12345", fingerprint: m.fingerprint, verified: true, webhookId: "synthetic-webhook" }) }));
vi.mock("@/lib/paypal", async importOriginal => ({ ...await importOriginal<object>(), createPayPalOrder: m.create, getPayPalOrder: m.get, capturePayPalOrder: m.capture }));
vi.mock("@/lib/project-service", async importOriginal => ({ ...await importOriginal<object>(), projectEmails: m.events, revalidateProjectViews: vi.fn() }));
vi.mock("@/lib/logger", () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
import { startPayPalCheckout, finishPayPalCheckout } from "@/lib/paypal-checkout";
import { setGatewayAvailability } from "@/lib/payment-availability";
import { decryptSecret } from "@/lib/secret-box";
import { PayPalOrderNotFound, PayPalUnavailable } from "@/lib/paypal";
const enabled = process.env.PAYPAL_DB_TESTS === "1", tag = randomBytes(5).toString("hex"), db = () => m.db!;
let clientId = "", count = 0;
const orderId = "ORDER123456789012", captureId = "CAPTURE1234567890";
async function invoice(extra = {}) { return db().invoice.create({ data: { clientId, number: `PAYPAL-${tag}-${++count}`, amount: 10000, currency: "USD", status: "sent", ...extra } }); }
async function started(extra = {}) { const i = await invoice(extra); expect((await startPayPalCheckout(i.id, clientId)).ok).toBe(true); const a = (await db().payPalCheckout.findFirst({ where: { invoiceId: i.id } }))!; return { i, a, args: { clientId, state: decryptSecret(a.stateEnc), orderId } }; }
describe.skipIf(!enabled)("durable PayPal settlement against isolated PostgreSQL", () => {
 beforeAll(async () => { const url = new URL(process.env.DATABASE_URL!); if (!["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) || !/^savo_paypal_verify_[a-f0-9]{12}$/.test(url.pathname.slice(1))) throw Error("Disposable PayPal database only; use scripts/verify-paypal.mjs"); if (process.env.MAIL_DELIVERY_MODE === "live") throw Error("Real mail forbidden"); });
 beforeEach(async () => {
  await db().paymentGatewayAvailability.deleteMany();
  vi.clearAllMocks(); m.completed = false; m.fingerprint = "synthetic-fingerprint"; delete (globalThis as Record<string, unknown>).__savoSecretBoxKey; vi.stubEnv("SECRETS_MASTER_KEY", Buffer.from("q".repeat(32)).toString("base64")); vi.stubEnv("NEXT_PUBLIC_SITE_URL", "http://127.0.0.1:4333");
  clientId = (await db().clientUser.create({ data: { name: "Synthetic PayPal Client", email: `${tag}-${++count}@example.invalid`, passwordHash: "synthetic-not-a-password" } })).id;
  m.create.mockImplementation(async (_config, input) => ({ order: { id: orderId, intent: "CAPTURE", status: "CREATED", purchase_units: [{ reference_id: input.id, custom_id: input.invoiceId, invoice_id: input.number, amount: { currency_code: input.currency, value: (input.amount / 100).toFixed(2) }, payee: { merchant_id: "MERCHANT12345" } }] }, approvalUrl: `https://www.sandbox.paypal.com/checkoutnow?token=${orderId}` }));
  m.get.mockImplementation(async () => { const a = (await db().payPalCheckout.findFirst({ where: { clientId } }))!; return { id: orderId, intent: "CAPTURE", status: m.completed ? "COMPLETED" : "APPROVED", payer: { address: { country_code: "US" } }, purchase_units: [{ reference_id: a.id, custom_id: a.invoiceId, invoice_id: a.invoiceNumber, amount: { currency_code: a.currency, value: (a.amount / 100).toFixed(2) }, payee: { merchant_id: a.merchantId }, payments: { captures: m.completed ? [{ id: captureId, status: "COMPLETED", final_capture: true, amount: { currency_code: a.currency, value: (a.amount / 100).toFixed(2) }, seller_receivable_breakdown: { paypal_fee: { currency_code: "USD", value: "4.70" }, net_amount: { currency_code: "USD", value: "95.30" } } }] : [] } }] }; });
  m.capture.mockImplementation(async () => { await new Promise(r => setTimeout(r, 15)); m.completed = true; });
 });
 afterEach(async () => { if (clientId) { await db().payPalCheckout.deleteMany({ where: { clientId } }); await db().clientUser.deleteMany({ where: { id: clientId } }); } vi.unstubAllEnvs(); delete (globalThis as Record<string, unknown>).__savoSecretBoxKey; });
 afterAll(async () => { await db().$disconnect(); });
 it("blocks new PayPal orders after an admin disables the gateway", async () => {
  const i = await invoice(); await setGatewayAvailability("paypal", false, 0, "synthetic-admin");
  expect(await startPayPalCheckout(i.id, clientId)).toMatchObject({ ok: false, message: expect.stringContaining("disabled") }); expect(m.create).not.toHaveBeenCalled(); expect(await db().payPalCheckout.count({ where: { invoiceId: i.id } })).toBe(0);
 });
 it("does not capture an approved checkout after the gateway is disabled", async () => {
  const { i, a, args } = await started(); await setGatewayAvailability("paypal", false, 0, "synthetic-admin");
  expect(await finishPayPalCheckout(a.id, args)).toMatchObject({ ok: false, message: expect.stringContaining("disabled") }); expect(m.capture).not.toHaveBeenCalled(); expect((await db().invoice.findUnique({ where: { id: i.id } }))!.status).toBe("sent");
 });
 it("still credits completed captured money after gateway disablement", async () => {
  const { i, a, args } = await started(); await setGatewayAvailability("paypal", false, 0, "synthetic-admin"); m.completed = true;
  expect(await finishPayPalCheckout(a.id, args)).toMatchObject({ ok: true, status: "completed" }); expect(m.capture).not.toHaveBeenCalled(); expect((await db().invoice.findUnique({ where: { id: i.id } }))!.status).toBe("paid");
 });
 it("rejects concurrent/stale availability writes rather than reversing a newer decision", async () => {
  await setGatewayAvailability("paypal", false, 0, "synthetic-admin"); await expect(setGatewayAvailability("paypal", true, 0, "synthetic-admin")).rejects.toThrow("changed");
  await setGatewayAvailability("paypal", true, 1, "synthetic-admin"); await expect(setGatewayAvailability("paypal", false, 1, "synthetic-admin")).rejects.toThrow("changed");
  expect(await db().paymentGatewayAvailability.findUnique({ where: { provider: "paypal" } })).toMatchObject({ enabled: true, revision: 2 });
 });
 it("enforces provider and positive revision constraints in PostgreSQL", async () => {
  await expect(db().paymentGatewayAvailability.create({ data: { provider: "unknown" } })).rejects.toThrow();
  await expect(db().paymentGatewayAvailability.create({ data: { provider: "paypal", revision: 0 } })).rejects.toThrow();
 });
 it("uses one durable checkout and the same provider request ID across concurrent starts", async () => {
  const i = await invoice(); const results = await Promise.all([startPayPalCheckout(i.id, clientId), startPayPalCheckout(i.id, clientId)]); expect(results.every(r => r.ok)).toBe(true);
  expect(await db().payPalCheckout.count({ where: { invoiceId: i.id } })).toBe(1); expect(new Set(m.create.mock.calls.map(call => call[1].id)).size).toBe(1);
 });
 it("records verified original-currency money and actual merchant fees without touching Razorpay references", async () => {
  const { i, a, args } = await started(); expect(await finishPayPalCheckout(a.id, args)).toMatchObject({ ok: true, status: "completed" });
  const saved = (await db().invoice.findUnique({ where: { id: i.id } }))!; expect(saved.status).toBe("paid"); expect(saved.razorpayPaymentId).toBeNull(); expect(saved.amount).toBe(10000);
  const tx = (await db().paymentTransaction.findFirst({ where: { invoiceId: i.id } }))!; expect(tx).toMatchObject({ source: "paypal", paymentId: captureId, amount: 10000, chargedAmount: 10000, currency: "USD" });
  expect(await db().payPalCheckout.findUnique({ where: { id: a.id } })).toMatchObject({ feeAmount: 470, netAmount: 9530, status: "completed" }); expect(m.events).toHaveBeenCalledTimes(1);
 });
 it("deduplicates competing authenticated return and verified webhook capture paths", async () => {
  const { i, a, args } = await started(); await Promise.all([finishPayPalCheckout(a.id, args), finishPayPalCheckout(a.id, { webhook: true })]);
  expect(m.capture).toHaveBeenCalledTimes(1); expect(await db().paymentTransaction.count({ where: { invoiceId: i.id } })).toBe(1); expect(m.events).toHaveBeenCalledTimes(1);
  expect(await finishPayPalCheckout(a.id, args)).toMatchObject({ status: "completed" }); expect(m.capture).toHaveBeenCalledTimes(1);
 });
 it("never treats approval/pending capture as paid", async () => {
  const { i, a, args } = await started(); m.capture.mockResolvedValue(undefined);
  expect(await finishPayPalCheckout(a.id, args)).toMatchObject({ ok: true, status: "pending" }); expect((await db().invoice.findUnique({ where: { id: i.id } }))!.status).toBe("sent"); expect(await db().paymentTransaction.count({ where: { invoiceId: i.id } })).toBe(0);
 });
 it("resolves a lost capture acknowledgement from authoritative provider evidence without another charge", async () => {
  const { a, args } = await started(); m.capture.mockImplementation(async () => { m.completed = true; throw Error("synthetic lost ACK"); });
  expect(await finishPayPalCheckout(a.id, args)).toMatchObject({ ok: true, status: "completed" }); expect(m.capture).toHaveBeenCalledTimes(1);
 });
 it("rejects wrong owner and forged return nonce before any provider lookup", async () => {
  const { a, args } = await started(); expect((await finishPayPalCheckout(a.id, { ...args, clientId: "another-client" })).ok).toBe(false); expect((await finishPayPalCheckout(a.id, { ...args, state: "f".repeat(64) })).ok).toBe(false); expect(m.get).not.toHaveBeenCalled(); expect(m.capture).not.toHaveBeenCalled();
 });
 it("rechecks changed invoice amounts before requesting capture", async () => {
  const { i, a, args } = await started(); await db().invoice.update({ where: { id: i.id }, data: { amount: 20000 } }); expect((await finishPayPalCheckout(a.id, args)).ok).toBe(false); expect(m.capture).not.toHaveBeenCalled(); expect((await db().invoice.findUnique({ where: { id: i.id } }))!.status).toBe("sent");
 });
 it.each(["paid", "cancelled", "draft"])("does not start checkout for a %s invoice", async status => { const i = await invoice({ status }); expect((await startPayPalCheckout(i.id, clientId)).ok).toBe(false); expect(m.create).not.toHaveBeenCalled(); });
 it("requires whole zero-decimal units and rejects INR instead of inventing a conversion", async () => { for (const [currency, amount] of [["INR", 10000], ["JPY", 10001]] as const) { const i = await invoice({ currency, amount }); expect((await startPayPalCheckout(i.id, clientId)).ok).toBe(false); } expect(m.create).not.toHaveBeenCalled(); });
 it("does not capture expired approvals but can still reconcile already captured money", async () => {
  const { a, args } = await started(); await db().payPalCheckout.update({ where: { id: a.id }, data: { expiresAt: new Date(Date.now() - 1000) } }); expect((await finishPayPalCheckout(a.id, args)).ok).toBe(false); expect(m.capture).not.toHaveBeenCalled(); m.completed = true; expect((await finishPayPalCheckout(a.id, args)).ok).toBe(true);
 });
 it("replaces a same-app expired order missing at PayPal without losing its immutable evidence", async () => {
  const { i, a } = await started(); await db().payPalCheckout.update({ where: { id: a.id }, data: { expiresAt: new Date(Date.now() - 1000) } });
  const create = m.create.getMockImplementation()!, next = "NEXT0123456789012";
  m.create.mockImplementation(async (...args) => { const result = await create(...args); return { ...result, order: { ...result.order, id: next }, approvalUrl: `https://www.sandbox.paypal.com/checkoutnow?token=${next}` }; });
  m.get.mockRejectedValue(new PayPalOrderNotFound());
  expect(await startPayPalCheckout(i.id, clientId)).toMatchObject({ ok: true, approvalUrl: expect.stringContaining(next) });
  expect(await db().payPalCheckout.findUnique({ where: { id: a.id } })).toMatchObject({ status: "cancelled", errorCode: "EXPIRED_ORDER_NOT_FOUND", orderId: a.orderId, approvalUrl: a.approvalUrl, captureStartedAt: null, captureId: null });
  expect(await db().payPalCheckout.count({ where: { invoiceId: i.id } })).toBe(2); expect(m.capture).not.toHaveBeenCalled(); expect(await db().paymentTransaction.count({ where: { invoiceId: i.id } })).toBe(0);
 });
 it.each([new PayPalUnavailable(), new Error("synthetic timeout"), new Error("unclassified HTTP 404")])("does not replace an expired order on an inconclusive provider failure (%s)", async error => {
  const { i, a } = await started(); await db().payPalCheckout.update({ where: { id: a.id }, data: { expiresAt: new Date(Date.now() - 1000) } }); m.get.mockRejectedValue(error);
  expect(await startPayPalCheckout(i.id, clientId)).toMatchObject({ ok: false, message: expect.stringContaining("No replacement was created") });
  expect(await db().payPalCheckout.findUnique({ where: { id: a.id } })).toMatchObject({ status: "created", orderId }); expect(m.create).toHaveBeenCalledTimes(1); expect(m.capture).not.toHaveBeenCalled();
 });
 it("never retires a created-looking order with any capture-start history", async () => {
  const { i, a } = await started(); await db().payPalCheckout.update({ where: { id: a.id }, data: { expiresAt: new Date(Date.now() - 1000), captureStartedAt: new Date() } }); m.get.mockRejectedValue(new PayPalOrderNotFound());
  expect((await startPayPalCheckout(i.id, clientId)).ok).toBe(false); expect(m.get).not.toHaveBeenCalled(); expect(m.create).toHaveBeenCalledTimes(1); expect((await db().payPalCheckout.findUnique({ where: { id: a.id } }))!.status).toBe("created");
 });
 it.each(["capturing", "pending", "uncertain", "review"])("does not replace an expired %s checkout", async status => {
  const { i, a } = await started(); await db().payPalCheckout.update({ where: { id: a.id }, data: { expiresAt: new Date(Date.now() - 1000), status } }); m.get.mockRejectedValue(new PayPalOrderNotFound());
  expect((await startPayPalCheckout(i.id, clientId)).ok).toBe(false); expect(m.get).not.toHaveBeenCalled(); expect(m.create).toHaveBeenCalledTimes(1); expect(m.capture).not.toHaveBeenCalled(); expect((await db().payPalCheckout.findUnique({ where: { id: a.id } }))!.status).toBe(status);
 });
 it("reconciles existing captured money instead of replacing an expired approval", async () => {
  const { i, a } = await started(); await db().payPalCheckout.update({ where: { id: a.id }, data: { expiresAt: new Date(Date.now() - 1000) } }); m.completed = true;
  expect((await startPayPalCheckout(i.id, clientId)).ok).toBe(false); expect((await db().invoice.findUnique({ where: { id: i.id } }))!.status).toBe("paid"); expect((await db().payPalCheckout.findUnique({ where: { id: a.id } }))!.status).toBe("completed"); expect(m.create).toHaveBeenCalledTimes(1); expect(m.capture).not.toHaveBeenCalled();
 });
 it("fails closed if the checkout changes while the missing-order lookup is in flight", async () => {
  const { i, a } = await started(); await db().payPalCheckout.update({ where: { id: a.id }, data: { expiresAt: new Date(Date.now() - 1000) } });
  m.get.mockImplementation(async () => { await db().payPalCheckout.update({ where: { id: a.id }, data: { status: "capturing", captureStartedAt: new Date() } }); throw new PayPalOrderNotFound(); });
  expect((await startPayPalCheckout(i.id, clientId)).ok).toBe(false); expect((await db().payPalCheckout.findUnique({ where: { id: a.id } }))!.status).toBe("capturing"); expect(m.create).toHaveBeenCalledTimes(1); expect(m.capture).not.toHaveBeenCalled();
 });
 it("does not look up or replace an expired approval after credentials change", async () => {
  const { i, a } = await started(); await db().payPalCheckout.update({ where: { id: a.id }, data: { expiresAt: new Date(Date.now() - 1000) } }); m.fingerprint = "another-app";
  expect((await startPayPalCheckout(i.id, clientId)).ok).toBe(false); expect(m.get).not.toHaveBeenCalled(); expect(m.create).toHaveBeenCalledTimes(1);
 });
 it("reuses an unexpired approval without asking PayPal to create a replacement", async () => {
  const { i, a } = await started(); m.get.mockRejectedValue(new PayPalOrderNotFound()); expect(await startPayPalCheckout(i.id, clientId)).toMatchObject({ ok: true, approvalUrl: a.approvalUrl }); expect(m.get).not.toHaveBeenCalled(); expect(m.create).toHaveBeenCalledTimes(1);
 });
 it("concurrent missing-order retries create at most one replacement checkout", async () => {
  const { i, a } = await started(); await db().payPalCheckout.update({ where: { id: a.id }, data: { expiresAt: new Date(Date.now() - 1000) } });
  const create = m.create.getMockImplementation()!, next = "NEXT0123456789012";
  m.create.mockImplementation(async (...args) => { const result = await create(...args); return { ...result, order: { ...result.order, id: next }, approvalUrl: `https://www.sandbox.paypal.com/checkoutnow?token=${next}` }; }); m.get.mockRejectedValue(new PayPalOrderNotFound());
  const results = await Promise.all([startPayPalCheckout(i.id, clientId), startPayPalCheckout(i.id, clientId)]); expect(results.some(r => r.ok)).toBe(true); expect(await db().payPalCheckout.count({ where: { invoiceId: i.id } })).toBe(2); expect(await db().payPalCheckout.count({ where: { invoiceId: i.id, status: "created" } })).toBe(1); expect(new Set(m.create.mock.calls.slice(1).map(call => call[1].id)).size).toBe(1); expect(m.capture).not.toHaveBeenCalled();
 });
 it("does not retire a created-looking order with a capture ID but no lease timestamp", async () => {
  const { i, a } = await started(); await db().payPalCheckout.update({ where: { id: a.id }, data: { expiresAt: new Date(Date.now() - 1000), captureId } }); expect((await startPayPalCheckout(i.id, clientId)).ok).toBe(false); expect(m.get).not.toHaveBeenCalled(); expect(m.create).toHaveBeenCalledTimes(1);
 });
 it("does not treat a missing order during capture confirmation as permission for another payment", async () => {
  const { a, args } = await started(); m.get.mockRejectedValue(new PayPalOrderNotFound()); expect((await finishPayPalCheckout(a.id, args)).ok).toBe(false); expect((await db().payPalCheckout.findUnique({ where: { id: a.id } }))!.status).toBe("uncertain"); expect(m.capture).not.toHaveBeenCalled(); expect(m.create).toHaveBeenCalledTimes(1);
 });
 it("does not let a delayed create response reopen an expired, retired checkout", async () => {
  const i = await invoice(), create = m.create.getMockImplementation()!; let oldId = "";
  m.create.mockImplementationOnce(async (...args) => { oldId = args[1].id; await db().payPalCheckout.update({ where: { id: oldId }, data: { expiresAt: new Date(Date.now() - 1000) } }); expect((await startPayPalCheckout(i.id, clientId)).ok).toBe(true); return create(...args); });
  expect((await startPayPalCheckout(i.id, clientId)).ok).toBe(false); expect((await db().payPalCheckout.findUnique({ where: { id: oldId } }))!.status).toBe("cancelled"); expect(await db().payPalCheckout.count({ where: { invoiceId: i.id, status: "created" } })).toBe(1); expect(m.capture).not.toHaveBeenCalled();
 });
 it("retains captured money for review if the invoice was cancelled before confirmation", async () => {
  const { i, a, args } = await started(); await db().invoice.update({ where: { id: i.id }, data: { status: "cancelled" } }); m.completed = true;
  expect((await finishPayPalCheckout(a.id, args)).ok).toBe(false); expect((await db().invoice.findUnique({ where: { id: i.id } }))!.status).toBe("cancelled"); expect(await db().payPalCheckout.findUnique({ where: { id: a.id } })).toMatchObject({ status: "review", captureId }); expect(await db().paymentTransaction.count({ where: { invoiceId: i.id } })).toBe(0);
 });
 it("does not lose a verified payment merely because optional settlement metadata is invalid", async () => {
  const { i, a, args } = await started(); const original = m.get.getMockImplementation()!;
  m.get.mockImplementation(async () => { const response = await original(); if (m.completed) response.purchase_units[0].payments.captures[0].seller_receivable_breakdown.net_amount = { currency_code: "INR", value: "99999999999999999999" }; return response; });
  expect(await finishPayPalCheckout(a.id, args)).toMatchObject({ ok: true, status: "completed" }); expect((await db().invoice.findUnique({ where: { id: i.id } }))!.status).toBe("paid");
  expect(await db().payPalCheckout.findUnique({ where: { id: a.id } })).toMatchObject({ feeAmount: null, netAmount: null, errorCode: "PAYPAL_FEE_DETAILS_NEED_REVIEW" });
 });
 it("reconciliation reads existing evidence without issuing a new capture", async () => { const { a } = await started(); expect(await finishPayPalCheckout(a.id, { webhook: true, reconcileOnly: true })).toMatchObject({ status: "pending" }); expect(m.capture).not.toHaveBeenCalled(); });
 it("does not capture an approved order when the owner explicitly cancels", async () => {
  const { i, a, args } = await started(); expect((await finishPayPalCheckout(a.id, { ...args, cancel: true })).ok).toBe(false); expect(m.capture).not.toHaveBeenCalled(); expect((await db().invoice.findUnique({ where: { id: i.id } }))!.status).toBe("sent"); expect((await db().payPalCheckout.findUnique({ where: { id: a.id } }))!.status).toBe("cancelled");
 });
 it("never builds a sandbox return URL on the production site", async () => {
  vi.stubEnv("PAYPAL_RETURN_ORIGIN", "https://savotechnologies.com"); const i = await invoice(); expect((await startPayPalCheckout(i.id, clientId)).ok).toBe(false); expect(m.create).not.toHaveBeenCalled();
 });
 it("never reuses an approval for changed gateway credentials", async () => {
  const { a, args } = await started();
  // Real invariant protection prevents rewriting the snapshot's fingerprint.
  await expect(db().payPalCheckout.update({ where: { id: a.id }, data: { credentialFingerprint: "another-app" } })).rejects.toThrow();
  m.fingerprint = "another-app";
  expect((await finishPayPalCheckout(a.id, args)).ok).toBe(false); expect(m.get).not.toHaveBeenCalled(); expect(m.capture).not.toHaveBeenCalled();
 });
 it("protects checkout amount and provider bindings with real database invariants", async () => { const { a } = await started(); await expect(db().payPalCheckout.update({ where: { id: a.id }, data: { amount: 9999 } })).rejects.toThrow(); await expect(db().payPalCheckout.update({ where: { id: a.id }, data: { orderId: "OTHER123456789012" } })).rejects.toThrow(); });
});
