"use server";
import { z } from "zod";
import { getClientUser } from "@/lib/client-auth";
import { rateLimit } from "@/lib/rate-limit";
import { startPayPalCheckout, finishPayPalCheckout } from "@/lib/paypal-checkout";
import type { PayPalStart, PayPalResult } from "@/lib/paypal-policy";
const id = z.string().regex(/^[A-Za-z0-9_-]{10,64}$/);
export async function createPayPalCheckoutAction(invoiceId: string): Promise<PayPalStart> {
  const client = await getClientUser();
  if (!client || !id.safeParse(invoiceId).success) return { ok: false, message: "Sign in to your client portal before paying this invoice." };
  if (!rateLimit(`paypal:start:${client.id}`, 12, 10 * 60_000).ok) return { ok: false, message: "Too many attempts. Wait before trying another checkout." };
  return startPayPalCheckout(invoiceId, client.id);
}
export async function completePayPalCheckoutAction(input: { checkoutId: string; state: string; orderId?: string; cancel?: boolean }): Promise<PayPalResult> {
  const client = await getClientUser();
  const parsed = z.object({ checkoutId: z.string().uuid(), state: z.string().regex(/^[a-f0-9]{64}$/), orderId: z.string().regex(/^[A-Z0-9]{17}$/).optional(), cancel: z.boolean().optional() }).strict().safeParse(input);
  if (!client || !parsed.success) return { ok: false, message: "This PayPal return could not be verified. Sign in and check the invoice status." };
  if (!rateLimit(`paypal:return:${client.id}`, 30, 10 * 60_000).ok) return { ok: false, message: "Please wait before checking PayPal again." };
  return finishPayPalCheckout(parsed.data.checkoutId, { clientId: client.id, state: parsed.data.state, orderId: parsed.data.orderId, cancel: parsed.data.cancel });
}
