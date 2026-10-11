import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/api";
import { readBodyBytes } from "@/lib/http-body";
import { z } from "zod";
import { publish } from "@/lib/livechat/pubsub";
import { logger } from "@/lib/logger";
import { timingSafeEqual } from "node:crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/email/inbound - webhook for email parsing services.
 *
 * Accepts parsed inbound emails from SendGrid Inbound Parse, Mailgun
 * Routes, or any service that POSTs multipart/form-data with standard
 * email fields. Replies are matched to enquiries by the sender's
 * email address and stored for the admin panel.
 *
 * Required SendGrid Inbound Parse setup:
 *   1. SendGrid → Settings → Inbound Parse → Add Host & URL
 *   2. Hostname: reply.savotechnologies.com (or your domain)
 *   3. URL: https://savotechnologies.com/api/email/inbound
 *   4. Check "POST the raw, full MIME message" (unchecked = parsed fields)
 *   5. Add the MX record SendGrid shows you to your DNS
 *
 * Security: EMAIL_INBOUND_SECRET is required; missing configuration fails
 * closed. Prefer x-webhook-secret; the existing query-secret contract is
 * retained for providers that require it (redact query strings at ingress).
 * The shared secret authenticates the provider, not the original sender.
 * Bodies are stream-limited to 1MB and recipients must match our mailboxes.
 */

const OUR_MAILBOXES = new Map([
  ["hr@savotechnologies.com", "hr@savotechnologies.com"],
  ["hello@savotechnologies.com", "hello@savotechnologies.com"],
  ["hr@reply.savotechnologies.com", "hr@savotechnologies.com"],
  ["hello@reply.savotechnologies.com", "hello@savotechnologies.com"],
]);
const mailboxSchema = z.string().email().max(320);
function mailbox(raw: string): string | null {
  if (/[\r\n]/.test(raw)) return null;
  const match = raw.trim().match(/^(?:[^<>]*<)?([^<>\s]+@[^<>\s]+)>?$/);
  const parsed = mailboxSchema.safeParse(match?.[1]?.toLowerCase());
  return parsed.success ? parsed.data : null;
}

function detectDept(to: string): "hr" | "hello" {
  return to.startsWith("hr@") ? "hr" : "hello";
}

/** Shared-secret check - prevents anyone who discovers the URL from
 *  injecting forged "client replies" into the admin inbox. */
function webhookAuthorized(req: Request): boolean {
  const secret = process.env.EMAIL_INBOUND_SECRET;
  if (!secret) return false;
  const url = new URL(req.url);
  const provided = req.headers.get("x-webhook-secret") ?? url.searchParams.get("secret") ?? "";
  const a = Buffer.from(provided);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(req: Request) {
  try {
    if (!process.env.EMAIL_INBOUND_SECRET) {
      logger.error("email_inbound.not_configured");
      return new Response(null, { status: 503 });
    }
    if (!webhookAuthorized(req)) {
      logger.warn("email-inbound: unauthorized delivery rejected", {});
      return new Response(null, { status: 401 });
    }

    const ip = clientIp(req);
    const limit = rateLimit(`email-inbound:${ip}`, 100, 60 * 60 * 1000);
    if (!limit.ok) return new Response(null, { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } });

    if (!prisma) {
      logger.error("email-inbound: no database");
      return new Response(null, { status: 503 });
    }

    // Parse as FormData (SendGrid sends multipart/form-data)
    const fields: Record<string, string> = Object.create(null);
    const contentType = req.headers.get("content-type") ?? "";
    const mediaType = contentType.split(";", 1)[0].trim().toLowerCase();
    if (!["multipart/form-data", "application/x-www-form-urlencoded", "application/json"].includes(mediaType)) {
      return new Response(null, { status: 415 });
    }
    const bounded = await readBodyBytes(req, 1_000_000);
    if (!bounded.ok) return new Response(null, { status: bounded.reason === "too_large" ? 413 : bounded.reason === "timeout" ? 408 : 400 });

    if (mediaType === "multipart/form-data" || mediaType === "application/x-www-form-urlencoded") {
      let form: FormData;
      try {
        form = await new Response(bounded.bytes, { headers: { "Content-Type": contentType } }).formData();
      } catch {
        return new Response(null, { status: 400 });
      }
      for (const [key, value] of form.entries()) {
        if (typeof value === "string") {
          fields[key] = value.slice(0, 50000); // cap each field at 50KB
        }
      }
    } else {
      let body: unknown;
      try {
        body = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bounded.bytes));
      } catch {
        return new Response(null, { status: 400 });
      }
      if (!body || typeof body !== "object" || Array.isArray(body)) return new Response(null, { status: 400 });
      for (const [key, value] of Object.entries(body)) {
        if (typeof value === "string") {
          fields[key] = value.slice(0, 50000);
        }
      }
    }

    // Extract standard email fields
    // Extract just the email address from 'Name <email@domain>' format
    const rawFrom = (fields.from ?? fields.sender ?? "").trim();
    const fromEmail = mailbox(rawFrom);
    const recipient = (fields.to ?? fields.recipient ?? "").split(",")
      .map(value => mailbox(value)).map(value => value ? OUR_MAILBOXES.get(value) : undefined)
      .find((value): value is string => !!value);
    const subject = (fields.subject ?? "(no subject)").slice(0, 500);
    let bodyText = (fields.text ?? fields["body-plain"] ?? "").slice(0, 50000);
    let bodyHtml = (fields.html ?? fields["body-html"] ?? "").slice(0, 50000) || null;

    // When "POST the raw, full MIME message" is enabled in SendGrid,
    // the text/html fields may be empty and content only exists in the
    // raw MIME (fields.email). Extract the body from it.
    if (!bodyText && !bodyHtml && fields.email) {
      const raw = fields.email;
      const ptMatch = raw.match(
        /Content-Type:\s*text\/plain[\s\S]*?\r?\n\r?\n([\s\S]*?)(?:\r?\n--|\r?\n\.|$)/i,
      );
      if (ptMatch) bodyText = ptMatch[1].trim();
      if (!bodyText) {
        const htmlMatch = raw.match(
          /Content-Type:\s*text\/html[\s\S]*?\r?\n\r?\n([\s\S]*?)(?:\r?\n--|\r?\n\.|$)/i,
        );
        if (htmlMatch) {
          bodyHtml = htmlMatch[1].trim();
          bodyText = bodyHtml
            .replace(/<style[\s\S]*?<\/style>/gi, "")
            .replace(/<script[\s\S]*?<\/script>/gi, "")
            .replace(/<br\s*\/?>/gi, "\n")
            .replace(/<\/p>/gi, "\n\n")
            .replace(/<[^>]+>/g, "")
            .replace(/&nbsp;/g, " ")
            .replace(/&amp;/g, "&")
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .trim();
        }
      }
      if (!bodyText && !bodyHtml && raw.length < 50000) {
        bodyText = raw
          .replace(/^[\s\S]*?\r?\n\r?\n/, "")
          .replace(/--[\w]+\r?\n/g, "")
          .replace(/Content-[Tt]ype:[^\r\n]+\r?\n/g, "")
          .replace(/Content-[Tt]ransfer-[Ee]ncoding:[^\r\n]+\r?\n/g, "")
          .trim();
      }
    }
    const messageId = (fields["Message-Id"] ?? fields.messageId ?? "").slice(0, 500) || null;
    const inReplyTo = (fields["In-Reply-To"] ?? fields.inReplyTo ?? "").slice(0, 500) || null;
    const spamScore = fields.spam_score ? parseFloat(fields.spam_score) : null;

    // Parse from name from "Name <email>" format
    let fromName: string | null = null;
    const nameMatch = (fields.from ?? "").match(/^(.+?)\s*<.+>$/);
    if (nameMatch) fromName = nameMatch[1].replace(/"/g, "").slice(0, 120);

    if (!fromEmail || !recipient) {
      logger.warn("email_inbound.invalid_mailbox");
      return new Response(null, { status: 422 });
    }
    const dept = detectDept(recipient);

    // Auto-match to an enquiry by sender email
    const enquiry = await prisma.projectEnquiry.findFirst({
      where: { email: fromEmail },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    });

    // Store the reply
    const reply = await prisma.emailReply.create({
      data: {
        fromEmail,
        fromName,
        toEmail: recipient,
        dept,
        subject,
        bodyText: bodyText || null,
        bodyHtml,
        messageId,
        inReplyTo,
        spamScore: isNaN(spamScore ?? NaN) ? null : spamScore,
        enquiryId: enquiry?.id ?? null,
      },
    });

    // Real-time admin alert: new inbound reply in the Emails inbox
    publish("admin", {
      type: "email.new",
      email: { fromName, fromEmail, subject: subject || "(no subject)", dept },
    });

    logger.info("email_inbound.stored", { replyId: reply.id, dept, matched: !!enquiry });

    return new Response(JSON.stringify({ ok: true, id: reply.id }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    logger.error("email_inbound.store_failed");
    // Do not acknowledge failed storage: provider retry is preferable to loss.
    return new Response(null, { status: 503 });
  }
}

/** GET for health check / SendGrid verification */
export async function GET() {
  return new Response(JSON.stringify({ ok: true, endpoint: "email-inbound" }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
