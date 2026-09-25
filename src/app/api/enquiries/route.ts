import { createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { rateLimit } from "@/lib/rate-limit";
import { env } from "@/lib/env";
import { apiOk, apiError, isJsonRequest, clientIp, readJsonBody } from "@/lib/api";
import { logger } from "@/lib/logger";
import { enquirySchema } from "@/schemas/enquiry";
import { sendTemplateNow, teamEmail } from "@/lib/mail";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** POST /api/enquiries — homepage enquiry drawer submissions. */

/** Sanitized structured payload a form may attach (careers application
 *  details, callback country). Keys/values are length-capped and the
 *  whole object is stored as JSON on the enquiry row. */
function sanitizeDetails(input: unknown): Record<string, unknown> | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  const out: Record<string, unknown> = {};
  let keys = 0;
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    if (keys >= 20) break;
    if (typeof key !== "string" || !/^[a-zA-Z0-9_]{1,40}$/.test(key)) continue;
    if (typeof value === "string") {
      out[key] = value.slice(0, 500);
      keys += 1;
    } else if (Array.isArray(value) && value.every((v) => typeof v === "string")) {
      out[key] = value.slice(0, 30).map((v) => v.slice(0, 120));
      keys += 1;
    }
  }
  return keys ? out : null;
}

export async function POST(req: Request) {
  if (!isJsonRequest(req)) {
    return apiError("Unsupported request format.", 415);
  }

  const ip = clientIp(req);
  const limit = rateLimit(`enquiry:${ip}`, 5, 60 * 60 * 1000);
  if (!limit.ok) {
    return apiError("Too many requests. Please try again later.", 429, {
      "Retry-After": String(limit.retryAfterSeconds),
    });
  }

  const body = await readJsonBody(req);
  if (!body.ok) {
    return apiError("Invalid request.", 400);
  }

  const parsed = enquirySchema.safeParse(body.data);
  if (!parsed.success) {
    return apiError(
      parsed.error.issues[0]?.message ?? "Please check the highlighted fields.",
      400,
    );
  }
  const data = parsed.data;
  const raw = body.data as Record<string, unknown>;
  const source =
    typeof raw.source === "string" ? (raw.source as string).slice(0, 60) : "homepage";
  const details = sanitizeDetails(raw.details);

  // Honeypot — bots get a silent success so they learn nothing.
  if (data.website) {
    logger.info("enquiry.honeypot", {});
    return apiOk();
  }

  if (!prisma) {
    logger.error("enquiry.no_db", {});
    return apiError("Request storage is not configured on this server.", 503);
  }

  try {
    await prisma.projectEnquiry.create({
      data: {
        name: data.name,
        email: data.email,
        company: data.company ?? null,
        phone: data.phone || null,
        projectType: data.projectType,
        budget: data.budget ?? null,
        message: data.message,
        data: (details as Prisma.InputJsonValue) ?? undefined,
        source,
        userAgent: req.headers.get("user-agent")?.slice(0, 255) ?? null,
        // Salted hash prefix — raw IPs are never persisted (privacy).
        ipHash:
          ip === "unknown"
            ? null
            : createHash("sha256")
                .update(`${env.ENQUIRY_IP_SALT}:${ip}`)
                .digest("hex")
                .slice(0, 32),
      },
    });
    logger.info("enquiry.stored", { source, type: data.projectType });

    /* Transactional mail — never blocks the response, never fails the
       request. Careers applications acknowledge the candidate and ping
       HR; assistant handoffs promise a one-business-day reply; every
       form notifies the team inbox. */
    const form = (details as { form?: string } | null)?.form ?? "";
    const det = (details ?? {}) as Record<string, string>;
    if (form === "careers") {
      if (data.email) sendTemplateNow("applicationAck", data.email, { name: data.name, role: det.role ?? "the role" });
      sendTemplateNow("teamApplication", process.env.HR_EMAIL || "hr@savotechnologies.com", {
        name: data.name,
        email: data.email ?? "—",
        role: det.role ?? "General application",
        experience: det.experience,
        links: det.links,
        message: data.message,
      });
    } else if (form === "callback") {
      if (data.email) sendTemplateNow("callbackAck", data.email, { name: data.name, country: det.country ?? "your" });
      sendTemplateNow("teamCallback", teamEmail(), {
        name: data.name,
        phone: data.phone ?? "—",
        country: det.country ?? "—",
        note: data.message.slice(0, 300),
      });
    } else if (form === "ask-savo") {
      if (data.email) sendTemplateNow("askSavoHandoffAck", data.email, { question: data.message });
      sendTemplateNow("teamAskSavo", teamEmail(), { email: data.email ?? "—", question: data.message });
    } else {
      if (data.email) sendTemplateNow("enquiryAck", data.email, { name: data.name, projectType: data.projectType });
      sendTemplateNow("teamEnquiry", teamEmail(), {
        name: data.name,
        email: data.email,
        phone: data.phone,
        projectType: data.projectType,
        budget: data.budget,
        message: data.message,
        source,
      });
    }

    return apiOk();
  } catch (err) {
    logger.error("enquiry.store_failed", {
      message: err instanceof Error ? err.message : "unknown",
    });
    return apiError("Could not store your enquiry. Please try again shortly.", 500);
  }
}
