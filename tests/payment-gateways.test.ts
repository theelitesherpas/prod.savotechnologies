import { beforeEach, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({ razorpay: vi.fn(), paypal: vi.fn(), bank: vi.fn(), enabled: vi.fn(), preview: vi.fn(), switches: vi.fn() }));
vi.mock("@/lib/payment-availability", () => ({ gatewaySwitches: m.switches }));
vi.mock("@/lib/razorpay-config", () => ({ getRazorpayConfig: m.razorpay }));
vi.mock("@/lib/paypal-config", () => ({ getPayPalConfig: m.paypal }));
vi.mock("@/lib/bank-details", () => ({ getBankDetails: m.bank }));
vi.mock("@/lib/paypal-runtime", () => ({ paypalCheckoutEnabled: m.enabled, paypalLocalPreview: m.preview }));
import { portalGatewayAvailable } from "@/lib/payment-gateways";
beforeEach(() => { vi.clearAllMocks(); m.switches.mockResolvedValue({ razorpay: { enabled: true }, paypal: { enabled: true } }); m.razorpay.mockResolvedValue(null); m.bank.mockResolvedValue(null); m.paypal.mockResolvedValue({ mode: "live" }); m.enabled.mockResolvedValue(false); m.preview.mockResolvedValue(true); });
it("makes configured but disabled PayPal inspectable only with explicit local UI opt-in", async () => {
 expect(await portalGatewayAvailable()).toBe(false);
 expect(m.preview).not.toHaveBeenCalled();
 expect(await portalGatewayAvailable({ localPreview: true })).toBe(true);
});
it("does not advertise disabled PayPal on the production host even for opted-in UI", async () => {
 m.preview.mockResolvedValue(false); expect(await portalGatewayAvailable({ localPreview: true })).toBe(false);
});
it("still requires configuration for local preview", async () => {
 m.paypal.mockResolvedValue(null); expect(await portalGatewayAvailable({ localPreview: true })).toBe(false);
});
it("does not expose an admin-disabled provider even through local preview", async () => {
 m.switches.mockResolvedValue({ razorpay: { enabled: false }, paypal: { enabled: false } }); m.razorpay.mockResolvedValue({ keyId: "synthetic" }); m.enabled.mockResolvedValue(true);
 expect(await portalGatewayAvailable({ localPreview: true })).toBe(false);
});
it("preserves real gateway and bank availability independent of preview", async () => {
 m.enabled.mockResolvedValue(true); expect(await portalGatewayAvailable()).toBe(true);
 m.enabled.mockResolvedValue(false); m.razorpay.mockResolvedValue({ keyId: "synthetic" }); expect(await portalGatewayAvailable()).toBe(true);
 m.razorpay.mockResolvedValue(null); m.bank.mockResolvedValue({ accountName: "Synthetic", accountNumber: "TEST", bankName: "Synthetic bank", swift: "TESTIN00" }); expect(await portalGatewayAvailable()).toBe(true);
});
