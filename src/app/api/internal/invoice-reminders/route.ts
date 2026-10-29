import { createHash, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { readJsonBody } from "@/lib/api";
import { runInvoiceReminders } from "@/lib/invoice-reminders";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 600;
const response = (body: object, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
const digest = (value: string) => createHash("sha256").update(value).digest();

/** Server-to-server only. No caller-supplied invoice, recipient, date or time. */
export async function POST(req: Request) {
  const secret = process.env.INVOICE_REMINDER_SECRET;
  if (!secret || !/^[A-Za-z0-9_-]{32,256}$/.test(secret)) return response({ ok: false, error: "Reminder scheduler is not configured." }, 503);
  const auth = req.headers.get("authorization") || "";
  if (auth.length > 512 || !auth.startsWith("Bearer ") || !timingSafeEqual(digest(auth.slice(7)), digest(secret))) return response({ ok: false, error: "Not authorized." }, 401);
  if ((req.headers.get("content-type") || "").split(";")[0] !== "application/json") return response({ ok: false, error: "JSON required." }, 415);
  const body = await readJsonBody(req, 256);
  const parsed = z.object({ apply: z.boolean().default(false) }).strict().safeParse(body.ok ? body.data : null);
  if (!parsed.success) return response({ ok: false, error: "Invalid job request." }, 400);
  try {
    const report = await runInvoiceReminders({ apply: parsed.data.apply });
    return response({ ok: true, ...report });
  } catch {
    logger.error("invoice_reminders.run_failed");
    return response({ ok: false, error: "Reminder job failed. Check server logs and delivery records." }, 500);
  }
}
