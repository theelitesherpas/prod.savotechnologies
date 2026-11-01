import { beforeEach, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({ find: vi.fn(), create: vi.fn(), update: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: { paymentGatewayAvailability: { findMany: m.find, create: m.create, updateMany: m.update } } }));
import { gatewaySwitches, gatewayEnabled, setGatewayAvailability } from "@/lib/payment-availability";
beforeEach(() => { vi.clearAllMocks(); m.find.mockResolvedValue([]); m.create.mockResolvedValue({}); m.update.mockResolvedValue({ count: 1 }); });
it("preserves configured legacy provider availability without creating rows", async () => {
 expect(await gatewaySwitches()).toEqual({ readable: true, razorpay: { enabled: true, revision: 0 }, paypal: { enabled: true, revision: 0 } }); expect(m.create).not.toHaveBeenCalled();
});
it("uses current database state on every request without a process cache", async () => {
 m.find.mockResolvedValueOnce([{ provider: "paypal", enabled: false, revision: 3 }]); expect(await gatewayEnabled("paypal")).toBe(false); expect(await gatewayEnabled("paypal")).toBe(true); expect(m.find).toHaveBeenCalledTimes(2);
});
it("fails closed if availability cannot be read", async () => {
 m.find.mockRejectedValue(new Error("offline")); expect(await gatewaySwitches()).toMatchObject({ readable: false, razorpay: { enabled: false }, paypal: { enabled: false } });
});
it("uses create conflict protection for a first save and revision CAS afterward", async () => {
 await setGatewayAvailability("razorpay", false, 0, "admin"); expect(m.create).toHaveBeenCalledWith({ data: { provider: "razorpay", enabled: false, updatedBy: "admin" } });
 await setGatewayAvailability("razorpay", true, 2, "admin"); expect(m.update).toHaveBeenCalledWith({ where: { provider: "razorpay", revision: 2 }, data: { enabled: true, updatedBy: "admin", revision: { increment: 1 } } });
});
it("rejects stale and conflicting updates", async () => {
 m.create.mockRejectedValue(new Error("unique")); await expect(setGatewayAvailability("paypal", false, 0, "admin")).rejects.toThrow("changed");
 m.update.mockResolvedValue({ count: 0 }); await expect(setGatewayAvailability("paypal", false, 2, "admin")).rejects.toThrow("changed");
});
