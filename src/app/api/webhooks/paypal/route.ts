import { z } from "zod";
import { readJsonBody } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { getPayPalConfig } from "@/lib/paypal-config";
import { verifyPayPalWebhook } from "@/lib/paypal";
import { finishPayPalCheckout } from "@/lib/paypal-checkout";
import { rateLimit } from "@/lib/rate-limit";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const response = (body: object, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
const schema = z.object({ id: z.string().regex(/^[A-Za-z0-9-]{10,128}$/), event_type: z.string().max(100), resource: z.object({ id: z.string().max(128).optional(), supplementary_data: z.object({ related_ids: z.object({ order_id: z.string().regex(/^[A-Z0-9]{17}$/).optional() }).passthrough().optional() }).passthrough().optional() }).passthrough() }).passthrough();
export async function POST(req: Request) {
  if (!rateLimit("paypal:webhook", 180, 60_000).ok) return response({ error: "Please retry later." }, 429);
  if (!prisma) return response({ error: "Unavailable." }, 503);
  const body = await readJsonBody(req, 256_000);
  const parsed = schema.safeParse(body.ok ? body.data : null);
  if (!parsed.success) return response({ error: "Invalid event." }, 400);
  try {
    const config = await getPayPalConfig();
    if (!config?.webhookId) return response({ error: "Webhook is not configured." }, 503);
    if (!(await verifyPayPalWebhook(config, req.headers, body.ok ? body.data as object : {}))) return response({ error: "Signature could not be verified." }, 400);
    const event = parsed.data, eventId = `paypal:${event.id}`;
    const old = await prisma.webhookEvent.findUnique({ where: { id: eventId } });
    if (old?.status === "processed" || old?.status === "ignored") return response({ received: true, duplicate: true });
    let status = "ignored", retry = false;
    if (["CHECKOUT.ORDER.APPROVED", "PAYMENT.CAPTURE.COMPLETED", "PAYMENT.CAPTURE.PENDING"].includes(event.event_type)) {
      const orderId = event.event_type === "CHECKOUT.ORDER.APPROVED" ? event.resource.id : event.resource.supplementary_data?.related_ids?.order_id;
      const attempt = orderId ? await prisma.payPalCheckout.findUnique({ where: { orderId } }) : null;
      if (attempt && attempt.mode === config.mode) {
        const result = await finishPayPalCheckout(attempt.id, { webhook: true });
        retry = result.ok ? result.status === "pending" : result.retryable === true;
        status = result.ok ? result.status === "completed" ? "processed" : "pending" : retry ? "pending" : "rejected";
      }
    }
    await prisma.webhookEvent.upsert({ where: { id: eventId }, create: { id: eventId, event: event.event_type, status, detail: "PayPal event checked; provider evidence required" }, update: { status } });
    return response({ received: true, pending: retry }, retry ? 503 : 200);
  } catch { return response({ error: "Confirmation unavailable. Please retry." }, 503); }
}
