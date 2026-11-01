import "server-only";
import { prisma } from "@/lib/prisma";
export type PaymentProvider = "razorpay" | "paypal";
export type GatewaySwitches = { readable: boolean; razorpay: { enabled: boolean; revision: number }; paypal: { enabled: boolean; revision: number } };
/** No cache: a stale page cannot authorize a newly disabled payment. Missing
 * rows preserve existing configured providers; database failures fail closed. */
export async function gatewaySwitches(): Promise<GatewaySwitches> {
  try {
    if (!prisma) throw new Error("Unavailable");
    const rows = await prisma.paymentGatewayAvailability.findMany();
    const state: GatewaySwitches = { readable: true, razorpay: { enabled: true, revision: 0 }, paypal: { enabled: true, revision: 0 } };
    for (const row of rows) if (row.provider === "razorpay" || row.provider === "paypal") state[row.provider] = { enabled: row.enabled, revision: row.revision };
    return state;
  } catch { return { readable: false, razorpay: { enabled: false, revision: 0 }, paypal: { enabled: false, revision: 0 } }; }
}
export async function gatewayEnabled(provider: PaymentProvider): Promise<boolean> { return (await gatewaySwitches())[provider].enabled; }
export async function setGatewayAvailability(provider: PaymentProvider, enabled: boolean, revision: number, adminId: string): Promise<void> {
  if (!prisma) throw new Error("Payment settings are unavailable.");
  if (revision === 0) {
    try { await prisma.paymentGatewayAvailability.create({ data: { provider, enabled, updatedBy: adminId } }); }
    catch { throw new Error("Payment availability changed or could not be saved. Refresh before retrying."); }
  } else {
    const result = await prisma.paymentGatewayAvailability.updateMany({ where: { provider, revision }, data: { enabled, updatedBy: adminId, revision: { increment: 1 } } });
    if (result.count !== 1) throw new Error("Payment availability changed. Refresh before retrying.");
  }
}
