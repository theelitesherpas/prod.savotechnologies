import "server-only";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { encryptSecret, decryptSecret } from "@/lib/secret-box";
import { gatewayEnabled } from "@/lib/payment-availability";
import { getPayPalConfig, type PayPalConfig } from "@/lib/paypal-config";
import { createPayPalOrder, getPayPalOrder, capturePayPalOrder } from "@/lib/paypal";
import { paypalCurrencyReason, paypalApprovalUrl, type PayPalStart, type PayPalResult } from "@/lib/paypal-policy";
import { verifyPayPalOrder, verifiedPayPalCapture } from "@/lib/paypal-evidence";
import { recordInvoicePaid } from "@/lib/invoice-payments";
import { paypalCheckoutEnabled } from "@/lib/paypal-runtime";
import { projectTransaction, projectEmails, revalidateProjectViews, type ProjectEmail } from "@/lib/project-service";

import type { Invoice, PayPalCheckout } from "@prisma/client";
const hash = (value: string) => createHash("sha256").update(value).digest("hex");
export function validPayPalState(state: string, expected: string): boolean { const a = Buffer.from(hash(state)), b = Buffer.from(expected); return a.length === b.length && timingSafeEqual(a, b); }
function matches(invoice: Invoice, attempt: PayPalCheckout) { return invoice.id === attempt.invoiceId && invoice.clientId === attempt.clientId && invoice.amount === attempt.amount && invoice.currency === attempt.currency && invoice.number === attempt.invoiceNumber && !invoice.paymentLink; }
const failure = (message: string): PayPalStart => ({ ok: false, message });
const activeStates = ["creating", "created", "capturing", "pending", "uncertain", "review"];
function returnUrl(path: string, mode: PayPalConfig["mode"]) {
  const origin = new URL(process.env.PAYPAL_RETURN_ORIGIN || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000");
  if (!["http:", "https:"].includes(origin.protocol) || origin.username || origin.password || origin.pathname !== "/" || origin.search || origin.hash) throw new Error("INVALID_PAYPAL_RETURN_ORIGIN");
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(origin.hostname);
  const production = origin.protocol === "https:" && !origin.port && ["savotechnologies.com", "www.savotechnologies.com"].includes(origin.hostname);
  if (mode === "live" ? !production : ["savotechnologies.com", "www.savotechnologies.com"].includes(origin.hostname) || (!local && (origin.protocol !== "https:" || process.env.PAYPAL_SANDBOX_PAYMENTS_ENABLED !== "true"))) throw new Error("UNSAFE_PAYPAL_RETURN_ORIGIN");
  return new URL(path, origin).href;
}

/** Reserve under an invoice row lock before any provider call. Retry the same
 * create/capture request IDs, not new financial operations after a timeout. */
export async function startPayPalCheckout(invoiceId: string, clientId: string): Promise<PayPalStart> {
  if (!prisma) return failure("Payments are temporarily unavailable.");
  try {
    if (!(await gatewayEnabled("paypal"))) return failure("PayPal is currently disabled. Refresh to choose an available payment method.");
    const config = await getPayPalConfig();
    if (!config || !(await paypalCheckoutEnabled(config))) return failure("PayPal is not enabled for this environment. Sandbox testing is available after configuring sandbox credentials.");
    // An expired, never-captured approval can be retired after checking the
    // provider. Unknown/pending captures are NOT retired or replaced.
    const expired = await prisma.payPalCheckout.findFirst({ where: { invoiceId, clientId, status: { in: ["creating", "created"] }, expiresAt: { lt: new Date() } }, orderBy: { createdAt: "desc" } });
    if (expired && expired.credentialFingerprint === config.fingerprint) {
      if (expired.orderId) {
        const oldOrder = await getPayPalOrder(config, expired.orderId);
        const unit = verifyPayPalOrder(oldOrder, expired);
        if (unit.payments?.captures?.length || oldOrder.status === "COMPLETED") {
          await finishPayPalCheckout(expired.id, { webhook: true, reconcileOnly: true });
          return failure("An earlier PayPal payment needs confirmation. Refresh the invoice before paying again.");
        }
      }
      await prisma.payPalCheckout.updateMany({ where: { id: expired.id, status: { in: ["creating", "created"] }, expiresAt: { lt: new Date() } }, data: { status: "cancelled", errorCode: "UNFUNDED_APPROVAL_EXPIRED" } });
    }
    const reserved = await prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM invoices WHERE id = ${invoiceId} FOR UPDATE`;
      const invoice = await tx.invoice.findFirst({ where: { id: invoiceId, clientId, client: { active: true }, paymentTransactions: { none: { amount: { gt: 0 } } } } });
      if (!invoice || !["sent", "overdue"].includes(invoice.status) || invoice.paidAt || invoice.paymentLink) throw new Error("INVOICE_NOT_PAYABLE");
      const reason = paypalCurrencyReason(invoice.currency, invoice.amount); if (reason) return { reason };
      const old = await tx.payPalCheckout.findFirst({ where: { invoiceId, status: { in: activeStates } }, orderBy: { createdAt: "desc" } });
      if (old) {
        if (!matches(invoice, old) || old.credentialFingerprint !== config.fingerprint) return { reason: "An earlier PayPal checkout needs review before another payment can start." };
        if (old.expiresAt < new Date()) return { reason: "Your earlier PayPal checkout expired or needs confirmation. Ask Savo to reconcile it before starting another." };
        if (["capturing", "pending", "uncertain", "review"].includes(old.status)) return { reason: "PayPal confirmation is pending. Check the invoice status before attempting another payment." };
        return { attempt: old };
      }
      const state = randomBytes(32).toString("hex");
      const attempt = await tx.payPalCheckout.create({ data: { invoiceId, clientId, invoiceNumber: invoice.number, amount: invoice.amount, currency: invoice.currency, mode: config.mode, credentialFingerprint: config.fingerprint, merchantId: config.merchantId, stateHash: hash(state), stateEnc: encryptSecret(state), expiresAt: new Date(Date.now() + 30 * 60_000) } });
      return { attempt };
    });
    if ("reason" in reserved) return failure(reserved.reason!);
    const attempt = reserved.attempt!;
    if (attempt.approvalUrl) {
      const safe = paypalApprovalUrl(attempt.approvalUrl, config.mode, attempt.orderId || "");
      if (!safe) return failure("The stored PayPal approval link needs review. No new payment was requested.");
      return { ok: true, approvalUrl: safe };
    }
    if (!(await gatewayEnabled("paypal"))) return failure("PayPal was disabled. No new order was requested; refresh to choose another method.");
    const state = decryptSecret(attempt.stateEnc);
    const query = new URLSearchParams({ paypalCheckout: attempt.id, paypalState: state });
    const order = await createPayPalOrder(config, { id: attempt.id, invoiceId, number: attempt.invoiceNumber, amount: attempt.amount, currency: attempt.currency,
      returnUrl: returnUrl(`/portal/invoices/${invoiceId}/pay?${query}`, config.mode), cancelUrl: returnUrl(`/portal/invoices/${invoiceId}/pay?${query}&paypalCancelled=1`, config.mode) });
    verifyPayPalOrder(order.order, { ...attempt, orderId: order.order.id });
    const fresh = await prisma.invoice.findFirst({ where: { id: invoiceId, clientId, amount: attempt.amount, currency: attempt.currency, status: { in: ["sent", "overdue"] }, paidAt: null, paymentLink: null, paymentTransactions: { none: { amount: { gt: 0 } } } } });
    if (!fresh) return failure("The invoice changed. No PayPal payment was captured; refresh its details.");
    await prisma.payPalCheckout.update({ where: { id: attempt.id }, data: { orderId: order.order.id, approvalUrl: order.approvalUrl, status: "created", errorCode: null } });
    return { ok: true, approvalUrl: order.approvalUrl };
  } catch { return failure("PayPal could not start checkout. Check the app credentials and whether your account accepts this invoice currency. No currency was converted and no payment has been confirmed."); }
}

/** Called from an authenticated return POST OR an independently verified
 * webhook. Approval is re-fetched and capture is always server-to-server. */
export async function finishPayPalCheckout(attemptId: string, options: { clientId?: string; state?: string; orderId?: string; webhook?: boolean; cancel?: boolean; reconcileOnly?: boolean } = {}): Promise<PayPalResult> {
  if (!prisma) return { ok: false, message: "Payments are temporarily unavailable." };
  const attempt = await prisma.payPalCheckout.findUnique({ where: { id: attemptId } });
  if (!attempt || !attempt.invoiceId || (!options.webhook && (attempt.clientId !== options.clientId || !options.state || !validPayPalState(options.state, attempt.stateHash) || (options.orderId && attempt.orderId !== options.orderId)))) return { ok: false, message: "This PayPal return could not be matched to your invoice." };
  if (attempt.status === "completed" && !options.reconcileOnly) return { ok: true, status: "completed" };
  if (attempt.status === "review" && !options.reconcileOnly) return { ok: false, message: "This captured payment needs manual billing review. Do not pay again." };
  const config = await getPayPalConfig();
  if (!config || (config.mode === "sandbox" && !(await paypalCheckoutEnabled(config))) || config.mode !== attempt.mode || config.fingerprint !== attempt.credentialFingerprint || !attempt.orderId) return { ok: false, retryable: true, message: "The PayPal configuration changed. Contact Savo before paying again." };
  try {
    let order = await getPayPalOrder(config, attempt.orderId);
    verifyPayPalOrder(order, attempt);
    if (options.cancel && !verifiedPayPalCapture(order, attempt) && !(order.purchase_units[0].payments?.captures?.length)) {
      await prisma.payPalCheckout.updateMany({ where: { id: attempt.id, status: { in: ["creating", "created"] } }, data: { status: "cancelled", errorCode: null } });
      return { ok: false, message: "PayPal checkout was cancelled. No payment was recorded." };
    }
    let evidence = verifiedPayPalCapture(order, attempt);
    if (!evidence) {
      const captures = order.purchase_units[0].payments?.captures ?? [];
      if (captures.length) {
        const pending = captures.some(c => c.status === "PENDING");
        const rejected = !attempt.captureId && captures.every(c => ["DECLINED", "DENIED", "FAILED"].includes(c.status));
        await prisma.payPalCheckout.updateMany({ where: { id: attempt.id, status: { in: [...activeStates, "cancelled"] } }, data: { status: pending ? "pending" : rejected ? "cancelled" : "review", errorCode: pending ? "PAYPAL_CAPTURE_PENDING" : rejected ? "PAYPAL_CAPTURE_REJECTED" : "PAYPAL_CAPTURE_REVIEW_REQUIRED" } });
        return pending ? { ok: true, status: "pending" } : { ok: false, message: rejected ? "PayPal declined this payment. No payment was confirmed; choose another method." : "PayPal payment evidence needs manual review. Do not pay again." };
      }
      if (attempt.status === "cancelled") return { ok: false, message: "This PayPal checkout was cancelled. No new capture was requested." };
      if (order.status !== "APPROVED" || options.reconcileOnly) return { ok: true, status: "pending" };
      if (!(await gatewayEnabled("paypal"))) return { ok: false, message: "PayPal is disabled. No new capture was requested. Already completed payments can still be confirmed." };
      if (!(await paypalCheckoutEnabled(config))) return { ok: false, message: "New PayPal capture is disabled in this environment. Existing completed payments can still be reconciled without requesting a charge." };
      if (order.payer?.address?.country_code === "IN") return { ok: false, message: "PayPal India is for international payments. Indian buyers should use Razorpay or bank deposit." };
      const invoice = await prisma.invoice.findFirst({ where: { id: attempt.invoiceId, client: { active: true }, paymentTransactions: { none: { amount: { gt: 0 } } } } });
      if (!invoice || !matches(invoice, attempt) || !["sent", "overdue"].includes(invoice.status) || invoice.paidAt) return { ok: false, message: "The invoice is already paid or changed. No new PayPal capture was requested." };
      if (attempt.expiresAt < new Date()) return { ok: false, message: "The PayPal approval expired. Contact Savo to reconcile the order before paying again." };
      const lease = await prisma.payPalCheckout.updateMany({ where: { id: attempt.id, expiresAt: { gte: new Date() }, OR: [{ status: { in: ["created", "pending", "uncertain"] } }, { status: "capturing", captureStartedAt: { lt: new Date(Date.now() - 120_000) } }] }, data: { status: "capturing", captureStartedAt: new Date() } });
      if (lease.count !== 1) return { ok: true, status: "pending" };
      // Never blindly create another capture operation after a lost response.
      // PayPal's stable request ID AND single-capture order guard this retry.
      try { await capturePayPalOrder(config, attempt.orderId, attempt.captureRequestId); } catch { /* Re-fetch authoritative evidence even when the acknowledgement is lost. */ }
      order = await getPayPalOrder(config, attempt.orderId);
      evidence = verifiedPayPalCapture(order, attempt);
      if (!evidence) { await prisma.payPalCheckout.updateMany({ where: { id: attempt.id, status: "capturing" }, data: { status: "pending", errorCode: "PAYPAL_CONFIRMATION_PENDING" } }); return { ok: true, status: "pending" }; }
    }
    const result = await projectTransaction(async tx => {
      const current = await tx.payPalCheckout.findUnique({ where: { id: attempt!.id } });
      if (!current) return { completed: false, events: [] as ProjectEmail[] };
      if (current.status === "completed") {
        if (current.captureId !== evidence!.captureId) throw new Error("CAPTURE_BINDING_CHANGED");
        await tx.payPalCheckout.update({ where: { id: current.id }, data: {
          ...(current.feeAmount == null && evidence!.feeAmount != null ? { feeAmount: evidence!.feeAmount, feeCurrency: evidence!.feeCurrency } : {}),
          ...(current.netAmount == null && evidence!.netAmount != null ? { netAmount: evidence!.netAmount, netCurrency: evidence!.netCurrency } : {}),
          errorCode: evidence!.errorCode,
        } });
        return { completed: true, events: [] as ProjectEmail[] };
      }
      if (current.captureId && current.captureId !== evidence!.captureId) throw new Error("CAPTURE_BINDING_CHANGED");
      const invoice = current.invoiceId ? await tx.invoice.findUnique({ where: { id: current.invoiceId } }) : null;
      if (!invoice || !matches(invoice, current)) {
        await tx.payPalCheckout.update({ where: { id: current.id }, data: { ...evidence!, status: "review", errorCode: "INVOICE_CHANGED_AFTER_CAPTURE" } });
        return { completed: false, events: [] as ProjectEmail[] };
      }
      const paid = await recordInvoicePaid(tx, invoice.id, { source: options.webhook ? "paypal.webhook" : "paypal.checkout", paymentId: evidence!.captureId, chargedAmount: evidence!.amount, method: "paypal" });
      await tx.payPalCheckout.update({ where: { id: current.id }, data: { ...evidence!, status: paid.ok ? "completed" : "review", errorCode: paid.ok ? evidence!.errorCode : "INVOICE_NOT_PAYABLE_AFTER_CAPTURE" } });
      return { completed: paid.ok, events: paid.ok ? paid.events : [] as ProjectEmail[] };
    });
    if (result.events.length) projectEmails(result.events);
    revalidateProjectViews();
    return result.completed ? { ok: true, status: "completed" } : { ok: false, message: "PayPal received a payment, but the invoice needs manual review. Do not pay again." };
  } catch {
    await prisma.payPalCheckout.updateMany({ where: { id: attempt.id, status: { in: ["creating", "created", "capturing", "pending", "uncertain"] } }, data: { status: "uncertain", errorCode: "PAYPAL_CONFIRMATION_UNKNOWN" } }).catch(() => undefined);
    return { ok: false, retryable: true, message: "PayPal confirmation is unavailable. Check your invoice status or contact Savo before paying again." };
  }
}
