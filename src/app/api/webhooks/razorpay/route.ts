import { createHmac, timingSafeEqual } from "node:crypto";
import { after } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { audit } from "@/lib/audit";
import { getRazorpayConfig } from "@/lib/razorpay-config";
import { recordInvoicePaid } from "@/lib/invoice-payments";
import { projectEmails, projectTransaction, revalidateProjectViews, type ProjectEmail } from "@/lib/project-service";

/**
 * Razorpay webhook receiver — the ONLY automated path that records payment.
 *
 * Security contract (docs/PAYMENTS.md):
 * - X-Razorpay-Signature: HMAC-SHA256 of the RAW request body with the
 *   webhook secret stored (encrypted) in the admin panel; compared in
 *   constant time. Invalid signatures are rejected without detail.
 * - Replay-safe: the provider event id (X-Razorpay-Event-Id) is the primary
 *   key of webhook_events; duplicate deliveries are acknowledged (200)
 *   without re-running effects. Effects and the dedupe row commit together.
 * - Amount + currency must match the invoice exactly, or the event is
 *   recorded as rejected and a human reviews it. Nothing auto-marks on a
 *   mismatch. Unknown references are ignored (200) — scanning probes get
 *   no information.
 * - Marking paid reuses recordInvoicePaid: receipt email, project and
 *   milestone reconciliation run in the same transaction as the status
 *   change, identical to manual marking.
 */

const NO_STORE = { "content-type": "application/json", "cache-control": "no-store" } as const;

function reply(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), { status, headers: NO_STORE });
}

function validSignature(raw: string, signature: string, secret: string): boolean {
  const expected = createHmac("sha256", secret).update(raw, "utf8").digest("hex");
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(signature, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

type LinkEntity = { id?: string; reference_id?: string | null; amount?: number; currency?: string; status?: string };
type PaymentEntity = { id?: string; order_id?: string | null; amount?: number; currency?: string; status?: string; method?: string | null; notes?: Record<string, string> | null };
type Payload = {
  event?: string;
  payload?: { payment_link?: { entity?: LinkEntity }; payment?: { entity?: PaymentEntity } };
};

export async function POST(request: Request): Promise<Response> {
  if (!rateLimit("razorpay:webhook", 240, 60_000).ok) return reply(429, { error: "slow down" });
  const raw = await request.text();
  if (raw.length > 1_000_000) return reply(413, { error: "too large" });

  const config = await getRazorpayConfig();
  if (!config?.webhookSecret) {
    // Not configured: permanent-looking failure so the provider surfaces it.
    return reply(503, { error: "webhook secret not configured" });
  }
  const signature = request.headers.get("x-razorpay-signature") ?? "";
  if (!signature || !validSignature(raw, signature, config.webhookSecret)) {
    logger.warn("razorpay.webhook.bad_signature", {});
    return reply(400, { error: "invalid signature" });
  }

  let body: Payload;
  try {
    body = JSON.parse(raw) as Payload;
  } catch {
    return reply(400, { error: "invalid payload" });
  }
  const event = typeof body.event === "string" ? body.event : "";
  const linkEntity = body.payload?.payment_link?.entity ?? {};
  const paymentEntity = body.payload?.payment?.entity ?? {};
  const eventId = request.headers.get("x-razorpay-event-id") ?? `${event}:${linkEntity.id ?? paymentEntity.id ?? "unknown"}`;
  if (!event) return reply(400, { error: "missing event" });

  if (!prisma) return reply(503, { error: "database unavailable" });

  let emailEvents: ProjectEmail[] = [];
  let revalidateProject: string | null | undefined;
  try {
    const outcome = await projectTransaction(async tx => {
      // Dedupe row first: a duplicate key means this delivery was already
      // processed — acknowledge idempotently without re-running effects.
      await tx.webhookEvent.create({ data: { id: eventId, event, status: "pending", detail: null } });

      if (event !== "payment_link.paid" && event !== "payment.captured") {
        // Other events (payment_link.cancelled, refunds, …): recorded, no
        // effect — cancelling a link never mutates the invoice by itself.
        await tx.webhookEvent.update({ where: { id: eventId }, data: { status: "ignored", detail: `${event} received; no automatic effect` } });
        return { kind: "ignored" as const };
      }

      if (event === "payment.captured") {
        // Standard Checkout confirmation: bind by OUR order id (authoritative),
        // with the order notes' invoice id as the secondary match.
        if (!paymentEntity.id) {
          await tx.webhookEvent.update({ where: { id: eventId }, data: { status: "rejected", detail: "missing payment id" } });
          return { kind: "rejected" as const };
        }
        const matchers: Record<string, string>[] = [];
        if (paymentEntity.order_id) matchers.push({ razorpayOrderId: paymentEntity.order_id });
        if (paymentEntity.notes?.invoiceId) matchers.push({ id: paymentEntity.notes.invoiceId });
        const invoice = matchers.length ? await tx.invoice.findFirst({ where: { OR: matchers } }) : null;
        if (!invoice) {
          await tx.webhookEvent.update({ where: { id: eventId }, data: { status: "ignored", detail: `no invoice for payment ${paymentEntity.id}` } });
          return { kind: "ignored" as const };
        }
        if (Number.isSafeInteger(paymentEntity.amount) && (paymentEntity.amount !== invoice.amount || (paymentEntity.currency ?? invoice.currency) !== invoice.currency)) {
          await tx.webhookEvent.update({ where: { id: eventId }, data: { status: "rejected", detail: `amount/currency mismatch on ${invoice.number}` } });
          return { kind: "mismatch" as const, invoiceId: invoice.id, number: invoice.number };
        }
        const paid = await recordInvoicePaid(tx, invoice.id, { source: "razorpay.webhook", paymentId: paymentEntity.id });
        if (!paid.ok) {
          await tx.webhookEvent.update({ where: { id: eventId }, data: { status: "rejected", detail: `invoice ${invoice.number} not payable (${paid.reason})` } });
          return { kind: "rejected" as const };
        }
        await tx.webhookEvent.update({ where: { id: eventId }, data: { status: "processed", detail: `${invoice.number} paid${paid.alreadyPaid ? " (already)" : ""}` } });
        return { kind: "paid" as const, events: paid.events, projectId: paid.projectId, number: invoice.number, alreadyPaid: paid.alreadyPaid, invoiceId: invoice.id };
      }

      if (!linkEntity.id) {
        await tx.webhookEvent.update({ where: { id: eventId }, data: { status: "rejected", detail: "missing link id" } });
        return { kind: "rejected" as const };
      }
      const invoice = await tx.invoice.findFirst({
        where: { OR: [{ razorpayLinkId: linkEntity.id }, ...(linkEntity.reference_id ? [{ number: linkEntity.reference_id }] : [])] },
      });
      if (!invoice) {
        await tx.webhookEvent.update({ where: { id: eventId }, data: { status: "ignored", detail: `no invoice for link ${linkEntity.id}` } });
        return { kind: "ignored" as const };
      }
      if (Number.isSafeInteger(linkEntity.amount) && (linkEntity.amount !== invoice.amount || (linkEntity.currency ?? invoice.currency) !== invoice.currency)) {
        await tx.webhookEvent.update({ where: { id: eventId }, data: { status: "rejected", detail: `amount/currency mismatch on ${invoice.number}` } });
        return { kind: "mismatch" as const, invoiceId: invoice.id, number: invoice.number };
      }
      const paid = await recordInvoicePaid(tx, invoice.id, { source: "razorpay.webhook", paymentId: body.payload?.payment?.entity?.id });
      if (!paid.ok) {
        await tx.webhookEvent.update({ where: { id: eventId }, data: { status: "rejected", detail: `invoice ${invoice.number} not payable (${paid.reason})` } });
        return { kind: "rejected" as const };
      }
      await tx.webhookEvent.update({ where: { id: eventId }, data: { status: "processed", detail: `${invoice.number} paid${paid.alreadyPaid ? " (already)" : ""}` } });
      return { kind: "paid" as const, events: paid.events, projectId: paid.projectId, number: invoice.number, alreadyPaid: paid.alreadyPaid, invoiceId: invoice.id };
    });

    if (outcome.kind === "paid") {
      emailEvents = outcome.events;
      revalidateProject = outcome.projectId ?? undefined;
      await audit(null, "razorpay.webhook.paid", "Invoice", outcome.invoiceId, { number: outcome.number, eventId, alreadyPaid: outcome.alreadyPaid });
    } else if (outcome.kind === "mismatch") {
      await audit(null, "razorpay.webhook.mismatch", "Invoice", outcome.invoiceId, { number: outcome.number, eventId });
      logger.error("razorpay.webhook.amount_mismatch", { number: outcome.number, eventId });
    }
  } catch (error) {
    // A duplicate event id (P2002) is a replay: acknowledge, do nothing.
    const code = (error as { code?: string })?.code;
    if (code === "P2002") return reply(200, { received: true, duplicate: true });
    logger.error("razorpay.webhook.processing_failed", { eventId, message: error instanceof Error ? error.message : "unknown" });
    return reply(500, { error: "processing failed" }); // provider retries
  }

  if (emailEvents.length) after(async () => { projectEmails(emailEvents); });
  if (revalidateProject !== undefined) after(async () => { revalidateProjectViews(revalidateProject ?? undefined); });
  return reply(200, { received: true });
}

export async function GET(): Promise<Response> {
  return reply(405, { error: "POST only" });
}
