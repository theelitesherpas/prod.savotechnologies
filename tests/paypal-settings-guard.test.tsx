import { beforeEach, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
const m = vi.hoisted(() => ({ user: vi.fn(), grant: vi.fn(), paypal: vi.fn(), razorpay: vi.fn(), recent: vi.fn(), bank: vi.fn(), switches: vi.fn() }));
vi.mock("@/lib/payment-availability", () => ({ gatewaySwitches: m.switches }));
vi.mock("@/lib/permissions", () => ({ requireAdminPage: m.user }));
vi.mock("@/lib/paypal-config", () => ({ paypalStatus: m.paypal }));
vi.mock("@/lib/paypal-receipt", () => ({ recentPayPalCheckouts: m.recent }));
vi.mock("@/lib/razorpay-config", () => ({ razorpayStatus: m.razorpay }));
vi.mock("@/lib/bank-details", () => ({ getBankDetails: m.bank }));
vi.mock("@/lib/step-up", () => ({ STEP_UP_PURPOSE_PAYMENTS: "payments-settings", STEP_UP_GRANT_TTL_MS: 1800000, stepUpVerified: m.grant, maskEmail: () => "a***@example.invalid", stepUpDestinationEmail: () => null }));
vi.mock("@/app/admin/(protected)/settings/payments/actions", () => ({ saveRazorpayConfigAction: vi.fn(), verifyRazorpayConfigAction: vi.fn(), clearRazorpayConfigAction: vi.fn(), sendStepUpCodeAction: vi.fn(), verifyStepUpCodeAction: vi.fn(), lockStepUpAction: vi.fn(), saveBankDetailsAction: vi.fn() }));
vi.mock("@/app/admin/(protected)/settings/payments/paypal-actions", () => ({ savePayPalConfigAction: vi.fn(), verifyPayPalConfigAction: vi.fn(), clearPayPalConfigAction: vi.fn(), reconcilePayPalAction: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: (path: string) => { throw Error(`REDIRECT:${path}`); } }));
import Page from "@/app/admin/(protected)/settings/payments/page";
beforeEach(() => { vi.clearAllMocks(); m.user.mockResolvedValue({ id: "admin", email: "admin@example.invalid", role: "admin" }); m.grant.mockResolvedValue(false); });
it("reads no gateway, bank or payment-history metadata before email step-up", async () => {
 const html = renderToStaticMarkup(await Page({ searchParams: Promise.resolve({}) }));
 expect(html).toContain("verification required"); expect(html).not.toContain("Client Secret");
 for (const reader of [m.paypal, m.razorpay, m.recent, m.bank, m.switches]) expect(reader).not.toHaveBeenCalled();
});
it("rejects an editor before even checking the grant or reading metadata", async () => {
 m.user.mockResolvedValue({ id: "editor", role: "editor", permissions: ["settings"] });
 await expect(Page({ searchParams: Promise.resolve({}) })).rejects.toThrow("admin-only");
 for (const reader of [m.grant, m.paypal, m.razorpay, m.recent, m.bank, m.switches]) expect(reader).not.toHaveBeenCalled();
});
