import nodemailer, { type Transporter } from "nodemailer";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import type { MailTemplate } from "@/lib/mail/templates";
import { fillText, bodyToHtml, bodyToText, templateEntry } from "@/lib/mail/registry";
import { unsubscribeUrl } from "@/lib/mail/templates";

/**
 * Transactional mail sender — one SMTP transport, every template.
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
 * Sending through the existing Hostinger mailbox needs no DNS changes —
 * SPF already includes Hostinger. Switching providers later (Brevo,
 * SES, Zoho…) is an env change, not a code change.
 *
 * Contract: mail NEVER breaks the action that triggered it — sendMail
 * catches its own failures and logs them. When MAIL_HOST is unset
 * (local/dev), templates render to the log so behavior is inspectable.
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
  });
  return cached;
}

/** Careers/HR department mailbox (hr@). Falls back to the default
 *  transport until MAIL_HR_PASS is configured — sends then go out as
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
  });
  return cachedHr;
}

export function mailFrom(): string {
  const user = process.env.MAIL_USER || "hello@savotechnologies.com";
  return process.env.MAIL_FROM || `Savo Technologies <${user}>`;
}

/** Send one template. Never throws — failures are logged for the audit trail.
 *  dept "hr" sends from the hr@ mailbox (careers); default is hello@. */
export async function sendMail(to: string, tpl: MailTemplate, dept: "hello" | "hr" = "hello"): Promise<boolean> {
  const wantHr = dept === "hr";
  let t = wantHr ? hrTransport() : transport();
  let from = mailFrom();
  if (wantHr && !t) {
    // HR mailbox not configured — fall back to the default mailbox.
    logger.info("mail: hr mailbox not configured, sending via default", { to });
    t = transport();
  } else if (wantHr) {
    const user = process.env.MAIL_HR_USER || "hr@savotechnologies.com";
    from = `Savo Technologies <${user}>`;
  }
  if (!t) {
    logger.info("mail: not configured, would send", { to, subject: tpl.subject, dept });
    return false;
  }
  try {
    await t.sendMail({
      from,
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
    logger.info("mail: sent", { to, subject: tpl.subject.slice(0, 80), dept });
    return true;
  } catch (err) {
    logger.error("mail: send failed", { to, subject: tpl.subject, err: String(err).slice(0, 300) });
    return false;
  }
}

/** Fire-and-forget variant for request paths — response never waits on SMTP. */
export function sendMailNow(to: string, tpl: MailTemplate): void {
  void sendMail(to, tpl);
}

/** Render a template by key — admin override if one exists (with
 *  {{placeholders}} filled from vars), the tested code default otherwise.
 *  Customer-facing templates get a real unsubscribe link for `to`. */
export async function renderTemplate(
  key: string,
  vars: Record<string, string | number | null | undefined>,
  to?: string,
): Promise<MailTemplate | null> {
  const entry = templateEntry(key);
  if (!entry) return null;
  try {
    const override = prisma ? await prisma.emailTemplate.findUnique({ where: { key } }) : null;
    if (override) {
      const { shell } = await import("@/lib/mail/templates");
      const html = bodyToHtml(fillText(override.body, vars));
      const subject = fillText(override.subject, vars);
      return {
        subject,
        html: shell({
          preheader: subject.slice(0, 120),
          heading: "",
          bodyHtml: html,
          ...(entry.recipient === "customer" && to
            ? { reason: "You are receiving this because you contacted Savo Technologies.", unsubscribeEmail: to }
            : {}),
        }),
        text: fillText(bodyToText(override.body), vars),
        unsubscribeEmail: entry.recipient === "customer" && to ? to : undefined,
      };
    }
  } catch (err) {
    logger.error("mail: override lookup failed, using default", { key, err: String(err).slice(0, 200) });
  }
  const clean: Record<string, string> = {};
  for (const [k, v] of Object.entries(vars)) if (v !== null && v !== undefined) clean[k] = String(v);
  if (entry.recipient === "customer" && to) clean.__to = to;
  const tpl = entry.default(clean);
  return entry.recipient === "customer" && to ? { ...tpl, unsubscribeEmail: to } : tpl;
}

/** Template send by key — override-aware, suppression-checked,
 *  fire-and-forget. */
export function sendTemplateNow(
  key: string,
  to: string,
  vars: Record<string, string | number | null | undefined>,
): void {
  void (async () => {
    const entry = templateEntry(key);
    // Honour one-click unsubscribes for customer-facing mail; team and
    // portal-service mail (invoices, milestones) always delivers.
    if (entry?.recipient === "customer" && prisma) {
      try {
        const suppressed = await prisma.mailSuppress.findUnique({ where: { email: to.toLowerCase() } });
        if (suppressed) {
          logger.info("mail: suppressed send skipped", { key, to });
          return;
        }
      } catch {
        /* suppression check is best-effort */
      }
    }
    const tpl = await renderTemplate(key, vars, to);
    if (tpl) await sendMail(to, tpl, entry?.dept ?? "hello");
    else logger.error("mail: unknown template key", { key });
  })();
}
