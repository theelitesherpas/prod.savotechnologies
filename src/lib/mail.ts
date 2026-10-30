import "server-only";
import { clientFullName, clientGreetingName } from "@/lib/client-name";
import { liveMailAllowed } from "@/lib/mail/delivery-policy";
import { classifyMailFailure, type MailDeliveryResult } from "@/lib/mail/delivery-result";
export type { MailDeliveryResult } from "@/lib/mail/delivery-result";
import { randomUUID } from "node:crypto";
import { attachmentRows } from "@/lib/mail/attachments";
import type { MailAttachment } from "@/lib/mail/attachment-rules.mjs";
import nodemailer, { type Transporter } from "nodemailer";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import type { MailTemplate } from "@/lib/mail/templates";
import { fillText, renderBodyHtml, bodyToText, templateEntry, invoiceTemplatePayment } from "@/lib/mail/registry";
import { unsubscribeUrl, withSignedUnsubscribe } from "@/lib/mail/unsubscribe";

/**
 * Transactional mail sender - one SMTP transport, every template.
 *
 * Configuration (server env):
 *   MAIL_HOST   e.g. smtp.hostinger.com
 *   MAIL_PORT   465 (secure) or 587
 *   MAIL_SECURE "true" for port 465
 *   MAIL_USER   the sending mailbox, e.g. hello@savotechnologies.com
 *   MAIL_PASS   mailbox password (or app password)
 *   MAIL_FROM   optional "Name <mailbox>" override
 *   TEAM_EMAIL  internal inbox for team notifications (default hello@)
 *
 * Sending through the existing Hostinger mailbox needs no DNS changes -
 * SPF already includes Hostinger. Switching providers later (Brevo,
 * SES, Zoho…) is an env change, not a code change.
 *
 * Contract: mail NEVER breaks the action that triggered it - sendMail
 * catches its own failures. Delivery requires MAIL_DELIVERY_MODE=live,
 * NODE_ENV=production and production content. Off/demo/test never creates
 * an SMTP transport; private template content is never echoed into logs.
 */

const TEAM_EMAIL_DEFAULT = "hello@savotechnologies.com";

export function teamEmail(): string {
  return process.env.TEAM_EMAIL || TEAM_EMAIL_DEFAULT;
}

let cached: Transporter | null | undefined;
let cachedHr: Transporter | null | undefined;

function transport(): Transporter | null {
  if (cached !== undefined) return cached;
  const host = process.env.MAIL_HOST;
  if (!host) {
    cached = null;
    return cached;
  }
  const port = Number(process.env.MAIL_PORT || 465);
  cached = nodemailer.createTransport({
    host,
    port,
    secure: process.env.MAIL_SECURE ? process.env.MAIL_SECURE === "true" : port === 465,
    auth: process.env.MAIL_USER ? { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS } : undefined,
    requireTLS: !["localhost", "127.0.0.1", "::1"].includes(host),
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });
  return cached;
}

/** Careers/HR department mailbox (hr@). Falls back to the default
 *  transport until MAIL_HR_PASS is configured - sends then go out as
 *  hello@ and are logged, so nothing is ever lost. */
function hrTransport(): Transporter | null {
  if (cachedHr !== undefined) return cachedHr;
  const host = process.env.MAIL_HOST;
  const pass = process.env.MAIL_HR_PASS;
  if (!host || !pass) {
    cachedHr = null;
    return cachedHr;
  }
  const port = Number(process.env.MAIL_PORT || 465);
  cachedHr = nodemailer.createTransport({
    host,
    port,
    secure: process.env.MAIL_SECURE ? process.env.MAIL_SECURE === "true" : port === 465,
    auth: { user: process.env.MAIL_HR_USER || "hr@savotechnologies.com", pass },
    requireTLS: !["localhost", "127.0.0.1", "::1"].includes(host),
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });
  return cachedHr;
}

export function mailFrom(): string {
  const user = process.env.MAIL_USER || "hello@savotechnologies.com";
  return process.env.MAIL_FROM || `Savo Technologies <${user}>`;
}

type MailMeta = { templateKey?: string; sentBy?: string; toName?: string; sensitive?: boolean; messageId?: string; requireAcceptance?: boolean; requireDepartment?: boolean; attachments?: MailAttachment[] };

/** Compatibility API for existing transactional callers. */
export async function sendMail(to: string, tpl: MailTemplate, dept: "hello" | "hr" = "hello", meta?: MailMeta): Promise<boolean> {
  return (await deliverMail(to, tpl, dept, meta)).status === "accepted";
}

/** Awaitable SMTP outcome for durable reminder delivery. Accepted is not a
 * promise of inbox placement. Ambiguous failures must not be auto-retried. */
export async function deliverMail(
  to: string,
  tpl: MailTemplate,
  dept: "hello" | "hr" = "hello",
  meta?: MailMeta,
): Promise<MailDeliveryResult> {
  if (!liveMailAllowed()) {
    logger.info("mail.delivery_disabled", { dept });
    return { status: "not_sent", reason: "DELIVERY_DISABLED", retryable: true };
  }
  if (tpl.unsubscribeEmail) {
    const email = tpl.unsubscribeEmail.toLowerCase().trim();
    if (!prisma) {
      logger.warn("mail.suppression_unavailable", { templateKey: meta?.templateKey ?? null });
      return { status: "not_sent", reason: "SUPPRESSION_UNAVAILABLE", retryable: true };
    }
    try {
      const suppressed = await prisma.mailSuppress.findUnique({ where: { email } });
      if (suppressed) {
        logger.info("mail: suppressed send skipped", { templateKey: meta?.templateKey ?? null });
        return { status: "not_sent", reason: "RECIPIENT_SUPPRESSED", retryable: false };
      }
    } catch {
      logger.warn("mail.suppression_check_failed", { templateKey: meta?.templateKey ?? null });
      return { status: "not_sent", reason: "SUPPRESSION_UNAVAILABLE", retryable: true };
    }
  }
  tpl = withSignedUnsubscribe(tpl);
  const wantHr = dept === "hr";
  let t = wantHr ? hrTransport() : transport();
  let from = mailFrom();
  if (wantHr && !t) {
    // Interactive compose must never silently send an HR letter from hello@.
    if (meta?.requireDepartment) {
      logger.warn("mail.department_not_configured", { dept });
      return { status: "not_sent", reason: "HR_SMTP_NOT_CONFIGURED", retryable: false };
    }
    // Preserve the existing fallback for legacy automated notifications.
    // HR mailbox not configured - fall back to the default mailbox.
    logger.info("mail: hr mailbox not configured, sending via default");
    t = transport();
  } else if (wantHr) {
    const user = process.env.MAIL_HR_USER || "hr@savotechnologies.com";
    from = `Savo Technologies <${user}>`;
  }
  if (!t) {
    logger.info("mail: not configured", { dept });
    return { status: "not_sent", reason: "SMTP_NOT_CONFIGURED", retryable: true };
  }
  let attached: ReturnType<typeof attachmentRows> = [];
  let attachmentArchiveId: string | undefined;
  let messageId = meta?.messageId;
  if (meta?.attachments?.length) {
    if (meta.sensitive) return { status: "not_sent", reason: "SENSITIVE_ATTACHMENTS_NOT_ALLOWED", retryable: false };
    try { attached = attachmentRows(meta.attachments); }
    catch { return { status: "not_sent", reason: "INVALID_ATTACHMENTS", retryable: false }; }
    if (!prisma) return { status: "not_sent", reason: "ATTACHMENT_ARCHIVE_UNAVAILABLE", retryable: true };
    messageId ||= `<${randomUUID()}@savotechnologies.com>`;
    try {
      const archived = await prisma.sentEmail.create({ data: { toEmail: to, toName: meta?.toName ?? null, subject: tpl.subject, html: tpl.html, text: tpl.text ?? null, templateKey: meta?.templateKey ?? null, dept, sentBy: meta?.sentBy ?? null, deliveryStatus: "pending", messageId, attachments: { create: attached } } });
      attachmentArchiveId = archived.id;
    } catch {
      logger.error("mail.attachment_archive_unavailable", { dept });
      return { status: "not_sent", reason: "ATTACHMENT_ARCHIVE_UNAVAILABLE", retryable: true };
    }
  }
  const recordAttachmentOutcome = async (status: "sent" | "not_sent" | "uncertain") => {
    if (attachmentArchiveId && prisma) try { await prisma.sentEmail.update({ where: { id: attachmentArchiveId }, data: { deliveryStatus: status } }); }
    catch { logger.error("mail.attachment_archive_status_unavailable", { dept }); }
  };
  try {
    const delivery = await t.sendMail({
      from,
      ...(messageId ? { messageId } : {}),
      ...(attached.length ? { attachments: attached.map(a => ({ filename: a.filename, contentType: a.contentType, content: a.data })) } : {}),
      // Reply-To routes replies through SendGrid Inbound Parse
      // (reply.savotechnologies.com) into the admin panel. Only replies
      // to our templates go to this subdomain: direct emails to the
      // real mailboxes never enter the admin panel.
      replyTo: dept === "hr" ? "hr@reply.savotechnologies.com" : "hello@reply.savotechnologies.com",
      to,
      subject: tpl.subject,
      html: tpl.html,
      text: tpl.text,
      ...(tpl.unsubscribeEmail
        ? {
            headers: {
              "List-Unsubscribe": `<${unsubscribeUrl(tpl.unsubscribeEmail)}>`,
              "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
            } as Record<string, string>,
          }
        : {}),
    });
    if ((meta?.sensitive || meta?.requireAcceptance) && !delivery.accepted?.length) {
      logger.warn("mail.recipient_not_accepted", { dept });
      await recordAttachmentOutcome(delivery.rejected?.length ? "not_sent" : "uncertain");
      return delivery.rejected?.length
        ? { status: "not_sent", reason: "SMTP_RECIPIENT_REJECTED", retryable: false }
        : { status: "uncertain", reason: "SMTP_CONFIRMATION_UNKNOWN" };
    }
    logger.info("mail: sent", { dept });
    // Authentication secrets must never reach the sent-folder database/archive.
    if (meta?.sensitive) return { status: "accepted" };
    if (attachmentArchiveId) { await recordAttachmentOutcome("sent"); return { status: "accepted" }; }
    // Sent-folder log - never blocks or fails the send itself.
    try {
      const { prisma } = await import("./prisma");
      if (prisma) {
        await prisma.sentEmail.create({
          data: {
            toEmail: to,
            toName: meta?.toName ?? null,
            subject: tpl.subject,
            html: tpl.html,
            text: tpl.text ?? null,
            templateKey: meta?.templateKey ?? null,
            dept,
            sentBy: meta?.sentBy ?? null,
          },
        });
      }
    } catch {
      /* logging is best-effort */
    }
    return { status: "accepted" };
  } catch (error) {
    logger.error("mail: send failed", { dept });
    const outcome = classifyMailFailure(error);
    await recordAttachmentOutcome(outcome.status === "not_sent" ? "not_sent" : "uncertain");
    return outcome;
  }
}

/** Fire-and-forget variant for request paths - response never waits on SMTP. */
export function sendMailNow(to: string, tpl: MailTemplate): void {
  void sendMail(to, tpl);
}

/** Render a template by key - admin override if one exists (with
 *  {{placeholders}} filled from vars), the tested code default otherwise.
 *  Customer-facing templates get a real unsubscribe link for `to`. */
export async function renderTemplate(
  key: string,
  vars: Record<string, string | number | null | undefined>,
  to?: string,
): Promise<MailTemplate | null> {
  const entry = templateEntry(key);
  if (!entry) return null;
  if (entry.recipient === "client") {
    const fullName = clientFullName(String(vars.name ?? vars.fullName ?? ""));
    // Existing {{name}} greetings remain natural; use {{fullName}} wherever
    // a complete client name is intended. HTML rendering escapes both.
    const greeting = clientGreetingName(fullName);
    vars = { ...vars, name: greeting, firstName: greeting, fullName };
  }
  try {
    const override = prisma ? await prisma.emailTemplate.findUnique({ where: { key } }) : null;
    if (override) {
      const { shell } = await import("@/lib/mail/templates");
      const html = renderBodyHtml(override.body, vars);
      const subject = fillText(override.subject, vars);
      const payment = invoiceTemplatePayment(key, vars);
      return {
        subject,
        html: shell({
          preheader: subject.slice(0, 120),
          heading: subject,
          bodyHtml: html,
          ...(payment ? { cta: payment } : {}),
          ...(entry.dept === "hr" ? { dept: "hr" as const } : {}),
          ...(entry.recipient === "customer" && to
            ? { reason: "You are receiving this because you contacted Savo Technologies.", unsubscribeEmail: to }
            : {}),
        }),
        text: fillText(bodyToText(override.body), vars) + (payment ? `\n\nPay now: ${payment.href}` : ""),
        unsubscribeEmail: entry.recipient === "customer" && to ? to : undefined,
      };
    }
  } catch {
    logger.error("mail: override lookup failed, using default", { key });
  }
  const clean: Record<string, string> = {};
  for (const [k, v] of Object.entries(vars)) if (v !== null && v !== undefined) clean[k] = String(v);
  if (entry.recipient === "customer" && to) clean.__to = to;
  const tpl = entry.default(clean);
  return entry.recipient === "customer" && to ? { ...tpl, unsubscribeEmail: to } : tpl;
}

/** Template send by key - override-aware, suppression-checked,
 *  fire-and-forget. */
export function sendTemplateNow(
  key: string,
  to: string,
  vars: Record<string, string | number | null | undefined>,
): void {
  void (async () => {
    const entry = templateEntry(key);
    const tpl = await renderTemplate(key, vars, to);
    if (tpl) await sendMail(to, tpl, entry?.dept ?? "hello");
    else logger.error("mail: unknown template key", { key });
  })();
}
