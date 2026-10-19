"use server";

import "server-only";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getClientUser } from "@/lib/client-auth";
import { audit } from "@/lib/audit";
import { rateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { revalidatePath } from "next/cache";
import { getRazorpayConfig } from "@/lib/razorpay-config";
import { createRazorpayOrder } from "@/lib/razorpay";
import { verifyRazorpayCheckout } from "@/lib/razorpay-checkout";
import { recordInvoicePaid } from "@/lib/invoice-payments";
import { projectTransaction, projectEmails, revalidateProjectViews } from "@/lib/project-service";

/**
 * Portal checkout actions — client-initiated Razorpay Standard Checkout.
 *
 * createRazorpayOrderAction: owner-scoped, payable-only, rate-limited. The
 * order amount is ALWAYS taken from the stored invoice row (the browser
 * never supplies amounts), and the order id is stored on the invoice so the
 * later verification can bind the payment to exactly this checkout session.
 *
 * verifyCheckoutAction: independent server verification (signature + order
 * binding + provider record) before recordInvoicePaid runs. Idempotent with
 * the webhook: whichever confirms first, the second becomes a no-op.
 */

const idSchema = z.string().regex(/^[A-Za-z0-9_-]{10,64}$/);
const orderIdSchema = z.string().regex(/^order_[A-Za-z0-9]{6,64}$/);
const paymentIdSchema = z.string().regex(/^pay_[A-Za-z0-9]{6,64}$/);
const signatureSchema = z.string().regex(/^[a-f0-9]{64}$/);

import type { CheckoutStart, CheckoutVerify } from "./types";

export async function createRazorpayOrderAction(invoiceId: string): Promise<CheckoutStart> {
  const parsed = idSchema.safeParse(invoiceId);
  if (!parsed.success) return { ok: false, message: "Invalid invoice." };
  const client = await getClientUser();
  if (!client || !prisma) return { ok: false, message: "Your session expired. Sign in again to pay." };
  if (!rateLimit(`razorpay:order:${client.id}`, 12, 10 * 60_000).ok) {
    return { ok: false, message: "Too many payment attempts. Wait a few minutes and try again." };
  }
  const invoice = await prisma.invoice.findFirst({ where: { id: parsed.data, clientId: client.id } });
  if (!invoice) return { ok: false, message: "Invoice not found." };
  if (!["sent", "overdue"].includes(invoice.status)) return { ok: false, message: "This invoice is not open for payment." };
  if (invoice.paymentLink) return { ok: false, message: "This invoice is paid through a provider link. Use the Pay now action on the invoice." };
  if (!Number.isSafeInteger(invoice.amount) || invoice.amount <= 0) return { ok: false, message: "This invoice has no payable amount." };
  const config = await getRazorpayConfig();
  if (!config) return { ok: false, message: "Online payment is not available right now. Please contact us." };
  let order;
  try {
    order = await createRazorpayOrder({
      amount: invoice.amount,
      currency: invoice.currency,
      receipt: invoice.number,
      notes: { invoiceId: invoice.id, invoiceNumber: invoice.number },
    });
  } catch (error) {
    logger.warn("razorpay.order_create_failed", { message: error instanceof Error ? error.message : "unknown" });
    return { ok: false, message: error instanceof Error ? error.message : "Razorpay could not start this payment. Try again." };
  }
  await prisma.invoice.update({ where: { id: invoice.id }, data: { razorpayOrderId: order.id } });
  await audit(null, "razorpay.order.create", "Invoice", invoice.id, { number: invoice.number, orderId: order.id, clientId: client.id });
  return {
    ok: true, orderId: order.id, keyId: config.keyId, amount: invoice.amount, currency: invoice.currency,
    invoiceNumber: invoice.number, name: client.name, email: client.email,
  };
}



export async function verifyCheckoutAction(input: { invoiceId: string; orderId: string; paymentId: string; signature: string }): Promise<CheckoutVerify> {
  const parsed = z.object({ invoiceId: idSchema, orderId: orderIdSchema, paymentId: paymentIdSchema, signature: signatureSchema }).safeParse(input);
  if (!parsed.success) return { ok: false, message: "The payment confirmation was malformed. No payment was recorded." };
  const client = await getClientUser();
  if (!client || !prisma) return { ok: false, message: "Your session expired. Sign in again — if the payment succeeded it is already recorded." };
  const invoice = await prisma.invoice.findFirst({ where: { id: parsed.data.invoiceId, clientId: client.id } });
  if (!invoice) return { ok: false, message: "Invoice not found." };
  const verification = await verifyRazorpayCheckout({
    invoice: { id: invoice.id, number: invoice.number, amount: invoice.amount, currency: invoice.currency, razorpayOrderId: invoice.razorpayOrderId },
    orderId: parsed.data.orderId, paymentId: parsed.data.paymentId, signature: parsed.data.signature,
  });
  if (!verification.ok) {
    await audit(null, "razorpay.checkout.rejected", "Invoice", invoice.id, { number: invoice.number, reason: verification.reason });
    return { ok: false, message: verification.message };
  }
  let events: Awaited<ReturnType<typeof recordInvoicePaid>> | null = null;
  try {
    events = await projectTransaction(async tx => {
      // Re-read inside the transaction: the webhook may have recorded this
      // payment already; recordInvoicePaid treats that as an idempotent no-op.
      const fresh = await tx.invoice.findFirst({ where: { id: invoice.id, clientId: client.id } });
      if (!fresh) throw new Error("Invoice not found.");
      if (fresh.razorpayOrderId && fresh.razorpayOrderId !== parsed.data.orderId) throw new Error("The checkout session for this invoice changed. No payment was recorded.");
      return await recordInvoicePaid(tx, fresh.id, { source: "razorpay.checkout", paymentId: verification.paymentId });
    });
  } catch (error) {
    logger.error("razorpay.checkout_record_failed", { message: error instanceof Error ? error.message : "unknown" });
    return { ok: false, message: "The payment was verified but could not be recorded yet. Refresh in a moment — nothing needs to be paid twice." };
  }
  if (!events.ok) return { ok: false, message: "This invoice can no longer be marked paid automatically. Our team will review your payment." };
  await audit(null, "razorpay.checkout.paid", "Invoice", invoice.id, { number: invoice.number, paymentId: verification.paymentId, method: verification.method });
  revalidatePath("/portal/invoices"); revalidatePath("/portal/dashboard"); revalidatePath(`/portal/invoices/${invoice.id}/pay`);
  revalidateProjectViews(invoice.projectId ?? undefined);
  projectEmails(events.alreadyPaid ? [] : events.events);
  return { ok: true, paymentId: verification.paymentId };
}
