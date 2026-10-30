import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/api";
import { readBodyBytes } from "@/lib/http-body";
import { z } from "zod";
import { publish } from "@/lib/livechat/pubsub";
import { logger } from "@/lib/logger";
import { createHash, timingSafeEqual } from "node:crypto";
import { attachmentRows } from "@/lib/mail/attachments";
import { MAX_MAIL_WIRE_BYTES, safeContentId, type MailAttachment } from "@/lib/mail/attachment-rules.mjs";
import { parseInboundMime, selectInboundAttachments, OVERSIZE_NOTICE, UNSUPPORTED_NOTICE } from "@/lib/mail/inbound-mime.mjs";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
/** Authenticated provider/poller ingestion, not proof of the original sender.
 * Multipart files and bounded raw MIME are supported. JSON remains metadata
 * only. Raw MIME overhead is separate from the 10 MB decoded attachment limit.
 * Legacy query auth remains for providers; redact ingress query logs. */
const OUR_MAILBOXES = new Map([
 ["hr@savotechnologies.com", "hr@savotechnologies.com"], ["hello@savotechnologies.com", "hello@savotechnologies.com"],
 ["hr@reply.savotechnologies.com", "hr@savotechnologies.com"], ["hello@reply.savotechnologies.com", "hello@savotechnologies.com"],
]);
const mailboxSchema = z.string().email().max(320);
function mailbox(raw: string): string | null {
 if (/[\r\n]/.test(raw)) return null;
 const match = raw.trim().match(/^(?:[^<>]*<)?([^<>\s]+@[^<>\s]+)>?$/), parsed = mailboxSchema.safeParse(match?.[1]?.toLowerCase());
 return parsed.success ? parsed.data : null;
}
function authorized(req: Request): boolean {
 const secret = process.env.EMAIL_INBOUND_SECRET; if (!secret) return false;
 const provided = req.headers.get("x-webhook-secret") ?? new URL(req.url).searchParams.get("secret") ?? "";
 const a = Buffer.from(provided), b = Buffer.from(secret); return a.length === b.length && timingSafeEqual(a, b);
}
const clean = (text: string, size = 50_000) => text.replace(/\u0000/g, "").slice(0, size);
const result = (body: object, status: number) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
let activeImports = 0;
export async function POST(req: Request) {
 let claimed = false;
 try {
  if (!process.env.EMAIL_INBOUND_SECRET) { logger.error("email_inbound.not_configured"); return new Response(null, { status: 503 }); }
  if (!authorized(req)) return new Response(null, { status: 401 });
  const limit = rateLimit(`email-inbound:${clientIp(req)}`, 100, 60 * 60 * 1000);
  if (!limit.ok) return new Response(null, { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } });
  if (!prisma) return new Response(null, { status: 503 });
  const contentType = req.headers.get("content-type") ?? "", mediaType = contentType.split(";", 1)[0].trim().toLowerCase();
  if (!["multipart/form-data", "application/x-www-form-urlencoded", "application/json"].includes(mediaType)) return new Response(null, { status: 415 });
  if (activeImports >= 2) return new Response(null, { status: 503, headers: { "Retry-After": "10" } });
  activeImports++; claimed = true;
  const bounded = await readBodyBytes(req, mediaType === "application/json" ? 1_000_000 : MAX_MAIL_WIRE_BYTES);
  if (!bounded.ok) return result({ error: "Email body exceeds the import limit or could not be read. Attachments must total 10 MB or less." }, bounded.reason === "too_large" ? 413 : bounded.reason === "timeout" ? 408 : 400);
  const fields: Record<string, string> = Object.create(null);
  let attachments: MailAttachment[] = [], notice: string | null = null, raw: Uint8Array | undefined, uploadedParts = 0;
  if (mediaType === "application/json") {
   let body: unknown; try { body = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bounded.bytes)); } catch { return new Response(null, { status: 400 }); }
   if (!body || typeof body !== "object" || Array.isArray(body)) return new Response(null, { status: 400 });
   if ("attachments" in body) return result({ error: "Send attachment files using multipart/form-data." }, 422);
   for (const [key, value] of Object.entries(body)) if (typeof value === "string") fields[key] = clean(value);
  } else {
   let form: FormData; try { form = await new Response(bounded.bytes, { headers: { "Content-Type": contentType } }).formData(); } catch { return new Response(null, { status: 400 }); }
   const files: { file: File; field: string }[] = [];
   for (const [key, value] of form.entries()) {
    if (key === "email") raw = typeof value === "string" ? new TextEncoder().encode(value) : new Uint8Array(await value.arrayBuffer());
    else if (typeof value === "string") fields[key] = clean(value);
    else if (value.name || value.size) files.push({ file: value, field: key });
   }
   uploadedParts = files.length;
   let attachmentInfo: Record<string, { "content-id"?: unknown }> = {};
   try { const parsedInfo = JSON.parse(fields["attachment-info"] || "{}"); if (parsedInfo && typeof parsedInfo === "object" && !Array.isArray(parsedInfo)) attachmentInfo = parsedInfo; } catch { /* Optional provider metadata is not a file source. */ }
   const selected = selectInboundAttachments(await Promise.all(files.map(async ({ file, field }) => ({ filename: file.name, content: new Uint8Array(await file.arrayBuffer()), contentId: safeContentId(attachmentInfo[field]?.["content-id"]) }))));
   attachments = selected.attachments; notice = selected.notice;
  }
  if (fields.email && !raw) raw = new TextEncoder().encode(fields.email);
  if (raw) {
   // Raw MIME and separate upload parts cannot each consume a 10 MB budget.
   if (uploadedParts) return result({ error: "Use raw MIME or parsed file parts, not both." }, 422);
   try {
    const parsed = await parseInboundMime(raw);
    for (const [key, value] of Object.entries({ from: parsed.from, to: parsed.to, subject: parsed.subject, text: parsed.text, html: parsed.html || "", messageId: parsed.messageId, inReplyTo: parsed.inReplyTo })) if (!fields[key]) fields[key] = clean(value);
    attachments = parsed.attachments; notice = parsed.notice;
   } catch {
    notice = "Attachments were not imported because the MIME message could not be safely processed. Ask the sender to resend supported files totaling 10 MB or less.";
   }
  }
  if (fields.attachmentIssue === "oversize") notice = OVERSIZE_NOTICE;
  else if (fields.attachmentIssue === "unsupported") notice = UNSUPPORTED_NOTICE;
  const rawFrom = (fields.from ?? fields.sender ?? "").trim(), fromEmail = mailbox(rawFrom);
  const recipient = (fields.to ?? fields.recipient ?? "").split(",").map(value => mailbox(value)).map(value => value ? OUR_MAILBOXES.get(value) : undefined).find((value): value is string => !!value);
  if (!fromEmail || !recipient) return new Response(null, { status: 422 });
  const dept = recipient.startsWith("hr@") ? "hr" : "hello", subject = (fields.subject || "(no subject)").slice(0, 500);
  const messageId = (fields["Message-Id"] ?? fields.messageId ?? "").slice(0, 500) || null, inReplyTo = (fields["In-Reply-To"] ?? fields.inReplyTo ?? "").slice(0, 500) || null;
  const identity = fields.deliveryKey || messageId;
  const deliveryKey = identity ? createHash("sha256").update(`${recipient}\u0000${identity}`).digest("hex") : null;
  const fromName = rawFrom.match(/^(.+?)\s*<.+>$/)?.[1].replace(/"/g, "").slice(0, 120) ?? null;
  const spam = fields.spam_score ? Number.parseFloat(fields.spam_score) : NaN;
  const enquiry = await prisma.projectEnquiry.findFirst({ where: { email: fromEmail }, orderBy: { createdAt: "desc" }, select: { id: true } });
  let reply;
  try {
   reply = await prisma.emailReply.create({ data: { fromEmail, fromName, toEmail: recipient, dept, subject, bodyText: fields.text || fields["body-plain"] || null, bodyHtml: fields.html || fields["body-html"] || null, messageId, inReplyTo, spamScore: Number.isFinite(spam) ? spam : null, enquiryId: enquiry?.id ?? null, bodyFormatVersion: 1,
    ...(deliveryKey ? { deliveryKey } : {}), ...(notice ? { attachmentNotice: notice } : {}), ...(attachments.length ? { attachments: { create: attachmentRows(attachments) } } : {}),
   } });
  } catch (error) {
   if (deliveryKey && error && typeof error === "object" && "code" in error && error.code === "P2002") {
    const old = await prisma.emailReply.findUnique({ where: { deliveryKey }, select: { id: true } });
    if (old) return result({ ok: true, id: old.id, duplicate: true }, 200);
   }
   throw error;
  }
  publish("admin", { type: "email.new", email: { fromName, fromEmail, subject, dept } });
  logger.info("email_inbound.stored", { replyId: reply.id, dept, matched: !!enquiry, attachmentCount: attachments.length, attachmentOmitted: !!notice });
  return result({ ok: true, id: reply.id }, 201);
 } catch { logger.error("email_inbound.store_failed"); return new Response(null, { status: 503 }); }
 finally { if (claimed) activeImports--; }
}
export async function GET() { return Response.json({ ok: true, endpoint: "email-inbound" }); }
