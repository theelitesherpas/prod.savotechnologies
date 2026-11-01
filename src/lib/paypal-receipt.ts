import "server-only";
import { prisma } from "@/lib/prisma";
/** Receipt facts come from stored verified evidence, never from a query flag
 * or the gateway's current fees. Second captures cannot replace the credited
 * invoice's actual payment method. */
export async function recentPayPalCheckouts() {
  if (!prisma) return [];
  return prisma.payPalCheckout.findMany({ orderBy: { createdAt: "desc" }, take: 10, select: { id: true, invoiceNumber: true, mode: true, status: true, amount: true, currency: true, orderId: true, captureId: true, feeAmount: true, feeCurrency: true, netAmount: true, netCurrency: true, errorCode: true } });
}
export async function paypalReceipt(invoice: { id: string; clientId: string; amount: number; currency: string }) {
  if (!prisma) return null;
  try {
    const credit = await prisma.paymentTransaction.findFirst({ where: { invoiceId: invoice.id, clientId: invoice.clientId, currency: invoice.currency, source: "paypal", amount: invoice.amount } });
    if (!credit?.paymentId || credit.chargedAmount == null) return null;
    const checkout = await prisma.payPalCheckout.findFirst({ where: { invoiceId: invoice.id, clientId: invoice.clientId, captureId: credit.paymentId, status: "completed", amount: credit.amount, currency: credit.currency } });
    if (!checkout || credit.chargedAmount !== checkout.amount) return null;
    return { total: credit.chargedAmount, captureId: checkout.captureId!, orderId: checkout.orderId!, feeAmount: checkout.feeAmount, feeCurrency: checkout.feeCurrency, netAmount: checkout.netAmount, netCurrency: checkout.netCurrency };
  } catch { return null; }
}
