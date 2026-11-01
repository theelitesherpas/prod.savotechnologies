import "server-only";
import { gatewaySwitches } from "@/lib/payment-availability";
import { getRazorpayConfig } from "@/lib/razorpay-config";
import { getPayPalConfig } from "@/lib/paypal-config";
import { getBankDetails } from "@/lib/bank-details";
import { paypalCheckoutEnabled, paypalLocalPreview } from "@/lib/paypal-runtime";
/** UI target availability only; every create/capture action independently
 * checks provider configuration, owner, currency and current invoice state. */
export async function portalGatewayAvailable(options: { localPreview?: boolean } = {}): Promise<boolean> {
  const [razorpay, paypal, bank, switches] = await Promise.all([getRazorpayConfig().catch(() => null), getPayPalConfig().catch(() => null), getBankDetails().catch(() => null), gatewaySwitches()]);
  return !!(bank?.accountName && bank.accountNumber && bank.bankName && (bank.ifsc || bank.swift)) || !!(switches.razorpay.enabled && razorpay) || !!(switches.paypal.enabled && paypal && (await paypalCheckoutEnabled(paypal) || (options.localPreview === true && await paypalLocalPreview())));
}
