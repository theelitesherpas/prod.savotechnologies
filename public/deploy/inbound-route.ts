import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/api";
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
 * Security: requires a shared secret when EMAIL_INBOUND_SECRET is
 * configured (append `?secret=<value>` to the webhook URL in SendGrid,
 * or send it as the x-webhook-secret header); rate-limited per IP;
 * rejects payloads > 1MB; validates that the recipient is one of our
 * mailboxes. With the secret unset the endpoint keeps working but logs
 * a warning each delivery (configure it before relying on replies).
 */

const OUR_MAILBOXES = new Set(["hr@savotechnologies.com", "hello@savotechnologies.com"]);

function detectDept(to: string): "hr" | "hello" {
  return to.startsWith("hr@") ? "hr" : "hello";
}

/** Shared-secret check - prevents anyone who discovers the URL from
 *  injecting forged "client replies" into the admin inbox. */
function webhookAuthorized(req: Request): boolean {
  const secret = process.env.EMAIL_INBOUND_SECRET;
  if (!secret) {
    logger.warn("email-inbound: EMAIL_INBOUND_SECRET not configured - accepting unauthenticated delivery", {});
    return true;
  }
  const url = new URL(req.url);
  const provided = req.headers.get("x-webhook-secret") ?? url.searchParams.get("secret") ?? "";
  const a = Buffer.from(provided);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(req: Request) {
  try {
    if (!webhookAuthorized(req)) {
      logger.warn("email-inbound: unauthorized delivery rejected", {});
      return new Response(null, { status: 401 });
    }

    const ip = clientIp(req);
    const limit = rateLimit(`email-inbound:${ip}`, 100, 60 * 60 * 1000);
    if (!limit.ok) return new Response(null, { status: 429 });

    if (!prisma) {
      logger.error("email-inbound: no database");
      return new Response(null, { status: 503 });
    }

    // Parse as FormData (SendGrid sends multipart/form-data)
    const fields: Record<string, string> = {};
    const contentType = req.headers.get("content-type") ?? "";

    if (contentType.includes("multipart/form-data") || contentType.includes("application/x-www-form-urlencoded")) {
      const form = await req.formData();
      for (const [key, value] of form.entries()) {
        if (typeof value === "string") {
          fields[key] = value.slice(0, 50000); // cap each field at 50KB
        }
      }
    } else if (contentType.includes("application/json")) {
      // Some services send JSON
      const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
      for (const [key, value] of Object.entries(body)) {
        if (typeof value === "string") {
          fields[key] = value.slice(0, 50000);
        }
      }
    } else {
      return new Response(null, { status: 415 });
    }

    // Extract standard email fields
    // Extract just the email address from 'Name <email@domain>' format
    const rawFrom = (fields.from ?? fields.sender ?? "").trim();
    const emailMatch = rawFrom.match(/[<]([^<]+@[^>]+)[>]/);
    const fromEmail = (emailMatch ? emailMatch[1] : rawFrom).trim().toLowerCase();
    const toEmail = (fields.to ?? fields.recipient ?? "").trim().toLowerCase();
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

    // Validate: must have a sender and a recipient
    if (!fromEmail || !fromEmail.includes("@")) {
      logger.warn("email-inbound: no valid from", { from: fromEmail });
      return new Response(null, { status: 200 }); // 200 so the service doesn't retry
    }

    // Determine dept (default to hello if recipient isn't one of ours)
    const recipient = OUR_MAILBOXES.has(toEmail) ? toEmail : "hello@savotechnologies.com";
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

    logger.info("email-inbound: stored", {
      from: fromEmail,
      to: recipient,
      dept,
      enquiryId: enquiry?.id ?? "unmatched",
      subject: subject.slice(0, 60),
    });

    return new Response(JSON.stringify({ ok: true, id: reply.id }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    logger.error("email-inbound: error", { err: String(err).slice(0, 300) });
    return new Response(null, { status: 200 }); // 200 so the service doesn't retry
  }
}

/** GET for health check / SendGrid verification */
export async function GET() {
  return new Response(JSON.stringify({ ok: true, endpoint: "email-inbound" }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
