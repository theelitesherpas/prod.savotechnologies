import { beforeEach, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({ user: vi.fn(), grant: vi.fn(), save: vi.fn(), audit: vi.fn(), revalidate: vi.fn() }));
vi.mock("@/lib/auth", () => ({ requireAdmin: m.user }));
vi.mock("@/lib/step-up", () => ({ STEP_UP_PURPOSE_PAYMENTS: "payments-settings", stepUpVerified: m.grant }));
vi.mock("@/lib/payment-availability", () => ({ setGatewayAvailability: m.save }));
vi.mock("@/lib/audit", () => ({ audit: m.audit }));
vi.mock("next/cache", () => ({ revalidatePath: m.revalidate }));
vi.mock("next/navigation", () => ({ redirect: (path: string) => { throw Error(`REDIRECT:${path}`); } }));
import { setGatewayAvailabilityAction } from "@/app/admin/(protected)/settings/payments/availability-actions";
function form() { const f = new FormData(); f.set("provider", "paypal"); f.set("enabled", "false"); f.set("revision", "2"); return f; }
beforeEach(() => { vi.resetAllMocks(); m.user.mockResolvedValue({ id: "admin", role: "admin" }); m.grant.mockResolvedValue(true); });
it("rejects editors even with settings permission", async () => {
 m.user.mockResolvedValue({ id: "editor", role: "editor", permissions: ["settings"] }); await expect(setGatewayAvailabilityAction(form())).rejects.toThrow("admin-only"); expect(m.grant).not.toHaveBeenCalled(); expect(m.save).not.toHaveBeenCalled();
});
it("requires fresh purpose-specific email step-up on the mutation itself", async () => {
 m.grant.mockResolvedValue(false); await expect(setGatewayAvailabilityAction(form())).rejects.toThrow("verification"); expect(m.grant).toHaveBeenCalledWith("admin", "payments-settings"); expect(m.save).not.toHaveBeenCalled();
});
it.each([["provider", "bank"], ["enabled", "yes"], ["revision", "-1"], ["revision", "NaN"], ["revision", "2147483647"]])("rejects forged %s=%s", async (key, value) => {
 const f = form(); f.set(key, value); await expect(setGatewayAvailabilityAction(f)).rejects.toThrow("Invalid"); expect(m.save).not.toHaveBeenCalled();
});
it("saves only the allowed provider/state/revision, audits and refreshes existing invoice routes", async () => {
 await expect(setGatewayAvailabilityAction(form())).rejects.toThrow("availabilitySaved=1"); expect(m.save).toHaveBeenCalledWith("paypal", false, 2, "admin"); expect(m.audit).toHaveBeenCalledWith("admin", "payment.availability.change", "PaymentGatewayAvailability", "paypal", { enabled: false }); expect(m.revalidate).toHaveBeenCalledWith("/portal/invoices/[id]/pay", "page");
});
it("reports a conflicting change without a success audit", async () => {
 m.save.mockRejectedValue(new Error("conflict")); await expect(setGatewayAvailabilityAction(form())).rejects.toThrow("Refresh"); expect(m.audit).not.toHaveBeenCalled();
});
