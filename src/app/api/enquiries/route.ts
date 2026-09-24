import { createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { env } from "@/lib/env";
import { apiOk, apiError, isJsonRequest, clientIp, readJsonBody } from "@/lib/api";
import { logger } from "@/lib/logger";
import { enquirySchema } from "@/schemas/enquiry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** POST /api/enquiries — homepage enquiry drawer submissions. */

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
  const source =
    typeof (body.data as Record<string, unknown>).source === "string"
      ? ((body.data as Record<string, unknown>).source as string).slice(0, 60)
      : "homepage";

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
        projectType: data.projectType,
        budget: data.budget ?? null,
        message: data.message,
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
    return apiOk();
  } catch (err) {
    logger.error("enquiry.store_failed", {
      message: err instanceof Error ? err.message : "unknown",
    });
    return apiError("Could not store your enquiry. Please try again shortly.", 500);
  }
}
