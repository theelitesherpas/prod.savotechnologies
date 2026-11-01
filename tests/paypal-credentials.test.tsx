import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
const m = vi.hoisted(() => ({ find: vi.fn(), upsert: vi.fn(), remove: vi.fn(), update: vi.fn(), user: vi.fn(), grant: vi.fn(), audit: vi.fn(), token: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: { payPalGatewayConfig: { findUnique: m.find, create: m.upsert, deleteMany: m.remove, updateMany: m.update } } }));
vi.mock("@/lib/auth", () => ({ requireAdmin: m.user }));
vi.mock("@/lib/step-up", () => ({ STEP_UP_PURPOSE_PAYMENTS: "payments-settings", stepUpVerified: m.grant }));
vi.mock("@/lib/audit", () => ({ audit: m.audit }));
vi.mock("@/lib/paypal", () => ({ paypalToken: m.token }));
vi.mock("@/lib/paypal-checkout", () => ({ finishPayPalCheckout: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: (path: string) => { throw Error(`REDIRECT:${path}`); } }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
import { getPayPalConfig, savePayPalConfig, paypalStatus } from "@/lib/paypal-config";
import { savePayPalConfigAction, verifyPayPalConfigAction, clearPayPalConfigAction, reconcilePayPalAction } from "@/app/admin/(protected)/settings/payments/paypal-actions";
import { PayPalSettings } from "@/components/admin/paypal-settings";
const data = { mode: "sandbox" as const, clientId: "SYNTHETIC_CLIENT_ID_123456789012345678", clientSecret: "SYNTHETIC_SECRET_12345678901234567890", merchantId: "MERCHANT12345", webhookId: "SYNTHETIC-WEBHOOK-12345", clearWebhook: false, adminId: "admin" };
function form() { const f = new FormData(); for (const [key, value] of Object.entries({ paypalMode: data.mode, paypalClientId: data.clientId, paypalClientSecret: data.clientSecret, paypalMerchantId: data.merchantId, paypalWebhookId: data.webhookId })) f.set(key, value); return f; }
beforeEach(() => { vi.clearAllMocks(); delete (globalThis as Record<string, unknown>).__savoSecretBoxKey; vi.stubEnv("SECRETS_MASTER_KEY", Buffer.from("p".repeat(32)).toString("base64")); m.find.mockResolvedValue(null); m.upsert.mockResolvedValue({}); m.update.mockResolvedValue({ count: 1 }); m.user.mockResolvedValue({ id: "admin", name: "Admin", role: "admin" }); m.grant.mockResolvedValue(true); m.token.mockResolvedValue("synthetic-token-never-rendered"); });
afterEach(() => { vi.unstubAllEnvs(); delete (globalThis as Record<string, unknown>).__savoSecretBoxKey; });
describe("PayPal encrypted credential storage", () => {
  it("encrypts every credential/identifier and only returns masked status", async () => {
    await savePayPalConfig(data); const row = { ...m.upsert.mock.calls[0][0].data, updatedAt: new Date() };
    for (const value of [data.clientId, data.clientSecret, data.merchantId, data.webhookId]) expect(JSON.stringify(row)).not.toContain(value);
    for (const key of ["clientIdEnc", "clientSecretEnc", "merchantIdEnc", "webhookIdEnc"]) expect(row[key]).toMatch(/^v1\./);
    m.find.mockResolvedValue(row);
    expect(await getPayPalConfig()).toMatchObject({ clientId: data.clientId, clientSecret: data.clientSecret, merchantId: data.merchantId, mode: "sandbox" });
    const status = await paypalStatus(); const html = renderToStaticMarkup(<PayPalSettings status={status} webhookUrl="https://example.invalid/api/webhooks/paypal"/>);
    for (const value of [data.clientId, data.clientSecret, data.merchantId, data.webhookId]) expect(html).not.toContain(value);
    expect(status.maskedClientId).toBe(`••••${data.clientId.slice(-4)}`);
    expect(html).toContain('type="password"');
  });
  it("keeps saved values for blank fields but requires matching replacements on environment change", async () => {
    await savePayPalConfig(data); m.find.mockResolvedValue({ ...m.upsert.mock.calls[0][0].data, updatedAt: new Date() });
    await savePayPalConfig({ ...data, clientId: "", clientSecret: "", merchantId: "", webhookId: "" });
    await expect(savePayPalConfig({ ...data, mode: "live", clientId: "", clientSecret: "", merchantId: "" })).rejects.toThrow("matching");
  });
  it("does not overwrite credentials changed by another save", async () => {
    await savePayPalConfig(data); const revision = new Date(); m.find.mockResolvedValue({ ...m.upsert.mock.calls[0][0].data, updatedAt: revision }); m.update.mockResolvedValue({ count: 0 });
    await expect(savePayPalConfig({ ...data, clientId: "", clientSecret: "", merchantId: "", webhookId: "" })).rejects.toThrow("changed while saving");
    expect(m.update.mock.calls[0][0].where.updatedAt).toEqual(revision);
  });
  it("fails closed on corrupt ciphertext rather than using another app or env credentials", async () => {
    await savePayPalConfig(data); m.find.mockResolvedValue({ ...m.upsert.mock.calls[0][0].data, clientSecretEnc: "broken" });
    await expect(getPayPalConfig()).rejects.toThrow();
  });
  it("fails closed without server-side master-key protection", async () => { vi.stubEnv("SECRETS_MASTER_KEY", ""); await expect(savePayPalConfig(data)).rejects.toThrow("unavailable"); expect(m.upsert).not.toHaveBeenCalled(); });
});
describe("PayPal admin and step-up mutation boundaries", () => {
  it.each([savePayPalConfigAction, verifyPayPalConfigAction, clearPayPalConfigAction, reconcilePayPalAction])("blocks editors even with a forged step-up grant", async action => {
    m.user.mockResolvedValue({ id: "editor", role: "editor", permissions: ["settings"] });
    await expect(action(form())).rejects.toThrow("admin-only"); expect(m.find).not.toHaveBeenCalled(); expect(m.upsert).not.toHaveBeenCalled(); expect(m.token).not.toHaveBeenCalled(); expect(m.remove).not.toHaveBeenCalled();
  });
  it.each([savePayPalConfigAction, verifyPayPalConfigAction, clearPayPalConfigAction, reconcilePayPalAction])("requires a fresh payment-settings grant", async action => {
    m.grant.mockResolvedValue(false); await expect(action(form())).rejects.toThrow("verification"); expect(m.find).not.toHaveBeenCalled(); expect(m.upsert).not.toHaveBeenCalled(); expect(m.token).not.toHaveBeenCalled(); expect(m.remove).not.toHaveBeenCalled();
  });
  it("never echoes credentials into audit or result URLs", async () => {
    await expect(savePayPalConfigAction(form())).rejects.toThrow("paypalSaved=1");
    const logged = JSON.stringify(m.audit.mock.calls); expect(logged).not.toContain(data.clientId); expect(logged).not.toContain(data.clientSecret); expect(logged).not.toContain(data.webhookId);
  });
  it("does not mark newly changed credentials verified using an old OAuth result", async () => {
    await savePayPalConfig(data); m.find.mockResolvedValue({ ...m.upsert.mock.calls[0][0].data, updatedAt: new Date() }); m.update.mockResolvedValue({ count: 0 });
    await expect(verifyPayPalConfigAction()).rejects.toThrow("changed%20during%20verification");
    expect(m.token).toHaveBeenCalledOnce();
  });
  it("does not call the provider when configuration is missing", async () => { await expect(verifyPayPalConfigAction()).rejects.toThrow("PayPal"); expect(m.token).not.toHaveBeenCalled(); });
});
