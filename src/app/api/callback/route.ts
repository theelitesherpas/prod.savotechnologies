import { createHash } from "node:crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { env } from "@/lib/env";
import { apiOk, apiError, isJsonRequest, clientIp, readJsonBody } from "@/lib/api";
import { validatePhone, COUNTRY_PHONE_RULES } from "@/lib/phone";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** POST /api/callback — footer "prefer a call back" requests. */

const callbackSchema = z.object({
  name: z.string().trim().max(80).optional().or(z.literal("")),
  country: z.string().refine((c) => c in COUNTRY_PHONE_RULES, "Please choose a country."),
  phone: z.string().trim().min(5).max(24),
  website: z.string().max(500).optional().or(z.literal("")),
});

export async function POST(req: Request) {
  if (!isJsonRequest(req)) {
    return apiError("Unsupported request format.", 415);
  }

  const ip = clientIp(req);
  const limit = rateLimit(`callback:${ip}`, 5, 60 * 60 * 1000);
  if (!limit.ok) {
    return apiError("Too many requests. Please try again later.", 429, {
      "Retry-After": String(limit.retryAfterSeconds),
    });
  }

  const body = await readJsonBody(req);
  if (!body.ok) {
    return apiError("Invalid request.", 400);
  }

  const parsed = callbackSchema.safeParse(body.data);
  if (!parsed.success) {
    return apiError(
      parsed.error.issues[0]?.message ?? "Invalid request.",
      400,
    );
  }
  const data = parsed.data;

  // Honeypot — silent success for bots.
  if (data.website) {
    return apiOk();
  }

  // Country-aware phone validation (shared with the client form).
  const phone = validatePhone(data.country, data.phone);
  if (!phone.ok) {
    return apiError(phone.error, 400);
  }

  if (!prisma) {
    logger.error("callback.no_db", {});
    return apiError("Request storage is not configured on this server.", 503);
  }

  try {
    await prisma.projectEnquiry.create({
      data: {
        name: data.name || "Callback request",
        email: null,
        company: null,
        phone: phone.normalized,
        projectType: "Callback",
        budget: null,
        message: `Callback request · ${data.country} · ${phone.normalized}`,
        source: "footer-callback",
        userAgent: req.headers.get("user-agent")?.slice(0, 255) ?? null,
        ipHash:
          ip === "unknown"
            ? null
            : createHash("sha256")
                .update(`${env.ENQUIRY_IP_SALT}:${ip}`)
                .digest("hex")
                .slice(0, 32),
      },
    });
    logger.info("callback.stored", { country: data.country });
    return apiOk();
  } catch (err) {
    logger.error("callback.store_failed", {
      message: err instanceof Error ? err.message : "unknown",
    });
    return apiError("Could not store your request. Please try again shortly.", 500);
  }
}
