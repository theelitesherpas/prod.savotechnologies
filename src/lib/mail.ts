import nodemailer, { type Transporter } from "nodemailer";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import type { MailTemplate } from "@/lib/mail/templates";
import { fillText, bodyToHtml, bodyToText, templateEntry } from "@/lib/mail/registry";

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

export function mailFrom(): string {
  const user = process.env.MAIL_USER || "hello@savotechnologies.com";
  return process.env.MAIL_FROM || `Savo Technologies <${user}>`;
}

/** Send one template. Never throws — failures are logged for the audit trail. */
export async function sendMail(to: string, tpl: MailTemplate): Promise<boolean> {
  const t = transport();
  if (!t) {
    logger.info("mail: not configured, would send", { to, subject: tpl.subject });
    return false;
  }
  try {
    await t.sendMail({
      from: mailFrom(),
      to,
      subject: tpl.subject,
      html: tpl.html,
      text: tpl.text,
    });
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
 *  {{placeholders}} filled from vars), the tested code default otherwise. */
export async function renderTemplate(
  key: string,
  vars: Record<string, string | number | null | undefined>,
): Promise<MailTemplate | null> {
  const entry = templateEntry(key);
  if (!entry) return null;
  try {
    const override = prisma ? await prisma.emailTemplate.findUnique({ where: { key } }) : null;
    if (override) {
      const { shell } = await import("@/lib/mail/templates");
      const html = bodyToHtml(fillText(override.body, vars));
      return {
        subject: fillText(override.subject, vars),
        html: shell({
          preheader: fillText(override.subject, vars).slice(0, 120),
          heading: "",
          bodyHtml: html,
        }),
        text: fillText(bodyToText(override.body), vars),
      };
    }
  } catch (err) {
    logger.error("mail: override lookup failed, using default", { key, err: String(err).slice(0, 200) });
  }
  const clean: Record<string, string> = {};
  for (const [k, v] of Object.entries(vars)) if (v !== null && v !== undefined) clean[k] = String(v);
  return entry.default(clean);
}

/** Template send by key — override-aware, fire-and-forget. */
export function sendTemplateNow(
  key: string,
  to: string,
  vars: Record<string, string | number | null | undefined>,
): void {
  void (async () => {
    const tpl = await renderTemplate(key, vars);
    if (tpl) await sendMail(to, tpl);
    else logger.error("mail: unknown template key", { key });
  })();
}
