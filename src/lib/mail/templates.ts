/**
 * Transactional email templates — every automated action on the site.
 *
 * DESIGN — the modern SaaS transactional standard, in Savo's voice:
 *   centered wordmark, centered greeting, statement headings and
 *   buttons on the center axis; details as quiet stacked pairs rather
 *   than ledgers; one generous serif amount where money matters; a
 *   small centered colophon. Brand fonts (Source Serif 4 · Manrope ·
 *   Fragment Mono) self-hosted with graceful fallbacks for clients
 *   that strip webfonts (Gmail → Georgia/system/mono).
 *
 * Email-client reality: tables + inline styles, 600px, PNG wordmark,
 * plain-text twin per template, preheader, dark-mode-safe neutrals.
 * Promises mirror the website copy exactly; nothing is fabricated.
 */

import { createHmac } from "node:crypto";
import { SITE } from "@/constants/site";

const PAPER = "#f5f4f0";
const SOFT = "#faf4ee";
const INK = "#14161c";
const BODY = "#33363c";
const MUTED = "#6a6e75";
const FAINT = "#9a9ea4";
const ACCENT = "#d9480f";
const LINE = "#e3e1da";
const CARD = "#ffffff";

const SERIF = "'Source Serif 4', Georgia, 'Times New Roman', Times, serif";
const SANS = "'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
const MONO = "'Fragment Mono', 'SFMono-Regular', Menlo, Consolas, 'Courier New', monospace";

export type MailTemplate = {
  subject: string;
  html: string;
  text: string;
  /** Set for customer-facing mail: powers List-Unsubscribe headers. */
  unsubscribeEmail?: string;
};

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const site = (path = "/") => `https://savotechnologies.com${path}`;

function origin(): string {
  return (
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_SITE_URL || "https://savotechnologies.com"
  ).replace(/\/$/, "");
}
const logoUrl = () => `${origin()}/images/email/logo.png`;

/** Self-hosted brand fonts — CORS-open like fonts.gstatic so capable
 *  clients (and sandboxed previews) render the real faces; everyone
 *  else falls to the native stacks in the font constants. */
function fontsCss(): string {
  const f = (family: string, file: string, weight: string, style = "normal") =>
    `@font-face{font-family:'${family}';font-style:${style};font-weight:${weight};src:url('${origin()}/fonts/${file}') format('woff2');}`;
  return (
    f("Source Serif 4", "source-serif-4-400.woff2", "400") +
    f("Source Serif 4", "source-serif-4-400-italic.woff2", "400", "italic") +
    f("Source Serif 4", "source-serif-4-600.woff2", "600") +
    f("Source Serif 4", "source-serif-4-700.woff2", "700") +
    f("Manrope", "manrope-400.woff2", "400") +
    f("Manrope", "manrope-500.woff2", "500") +
    f("Manrope", "manrope-700.woff2", "700") +
    f("Manrope", "manrope-800.woff2", "800") +
    f("Fragment Mono", "fragment-mono-400.woff2", "400")
  );
}

const SALT = process.env.ENQUIRY_IP_SALT || "dev-salt";
export function unsubscribeSig(email: string): string {
  return createHmac("sha256", SALT).update(email.toLowerCase()).digest("hex").slice(0, 32);
}
export function unsubscribeUrl(email: string): string {
  return `${site("/unsubscribe")}?email=${encodeURIComponent(email)}&sig=${unsubscribeSig(email)}`;
}

/* ── centered building blocks ─────────────────────────────────────── */

const p = (s: string, last = false) =>
  `<p style="margin:${last ? "0" : "0 0 16px"};font-family:${SERIF};font-size:15.5px;line-height:1.7;color:${BODY};text-align:center;">${s}</p>`;
const lead = (s: string) =>
  `<p style="margin:0 0 20px;font-family:${SERIF};font-size:16px;line-height:1.7;color:${BODY};text-align:center;">${s}</p>`;

/** Centered eyebrow — the vermilion square mark, then the label. */
const eyebrow = (t: string) =>
  `<p style="margin:0 0 16px;font-family:${SANS};font-size:10.5px;font-weight:800;letter-spacing:0.16em;text-transform:uppercase;color:${MUTED};text-align:center;"><span style="display:inline-block;width:7px;height:7px;background:${ACCENT};margin-right:9px;vertical-align:1px;"></span>${esc(t)}</p>`;

const h1 = (t: string) =>
  `<h1 style="margin:0 0 16px;font-family:${SERIF};font-size:26px;line-height:1.3;letter-spacing:-0.012em;font-weight:700;color:${INK};text-align:center;">${esc(t)}</h1>`;

/** Steps as a centered rhythm — mark, title, note; air between. */
function steps(items: [string, string][]): string {
  return `<div style="margin:24px 0;">${items
    .map(
      ([title, sub], i) => `<div style="${i > 0 ? "margin-top:22px;" : ""}text-align:center;">
  <div style="font-family:${MONO};font-size:11px;font-weight:400;color:${ACCENT};letter-spacing:0.1em;">${String(i + 1).padStart(2, "0")}</div>
  <div style="margin-top:5px;font-family:${SANS};font-size:14.5px;font-weight:800;color:${INK};">${esc(title)}</div>
  <div style="margin:4px auto 0;max-width:400px;font-family:${SANS};font-size:13px;line-height:1.55;color:${MUTED};">${esc(sub)}</div>
</div>`,
    )
    .join("")}</div>`;
}

/** Details as quiet stacked pairs — label above value, both centered. */
function spec(rows: [string, string | undefined][], opts?: { big?: number }): string {
  const items = rows.filter(([, v]) => v !== undefined && v !== "");
  if (!items.length) return "";
  return `<div style="margin:22px 0;">${items
    .map(([k, v], i) => {
      const big = opts?.big === i;
      return `<div style="${i > 0 ? "margin-top:14px;" : ""}text-align:center;">
  <div style="font-family:${SANS};font-size:10.5px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:${FAINT};">${esc(k)}</div>
  <div style="margin-top:3px;font-family:${big ? SERIF : SANS};font-size:${big ? "30px" : "14.5px"};font-weight:${big ? 700 : 600};color:${big ? ACCENT : INK};line-height:1.3;">${esc(v ?? "—")}</div>
</div>`;
    })
    .join("")}</div>`;
}

/** One-line mono meta strip (invoice numbers, dates). */
const meta = (parts: string[]) =>
  `<p style="margin:18px 0 0;font-family:${MONO};font-size:11px;letter-spacing:0.06em;color:${FAINT};text-align:center;">${parts.map(esc).join("&ensp;·&ensp;")}</p>`;

/** Soft centered note panel. */
function highlight(html: string): string {
  return `<div style="margin:24px 0;padding:16px 22px;background:${SOFT};border-radius:10px;font-family:${SERIF};font-size:14.5px;line-height:1.65;color:${INK};text-align:center;">${html}</div>`;
}

/** Centered correspondence quote. */
function quote(text: string): string {
  return `<div style="margin:24px 0;padding:0 26px;font-family:${SERIF};font-style:italic;font-size:16px;line-height:1.65;color:${INK};text-align:center;">${esc(text)}</div>`;
}

/** Reading block for longer content — left-aligned inside the centered layout. */
function prose(text: string): string {
  return `<div style="margin:22px 0;padding:16px 20px;background:${PAPER};border-radius:10px;font-family:${SERIF};font-size:14.5px;line-height:1.7;color:${BODY};white-space:pre-line;text-align:left;">${esc(text)}</div>`;
}

const CTA = (href: string, label: string, sub?: string) => `
<table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:28px auto 4px;"><tr><td align="center">
<a href="${href}" style="display:inline-block;background:${INK};color:#ffffff;font-family:${SANS};font-size:14px;font-weight:700;letter-spacing:0.02em;text-decoration:none;padding:15px 32px;border-radius:8px;">${esc(label)}&nbsp;&nbsp;→</a>
${sub ? `</td></tr><tr><td align="center" style="padding:11px 0 0;font-family:${SANS};font-size:12px;color:${MUTED};">${esc(sub)}` : ""}
</td></tr></table>`;

const signOff = (closing: string) => `
<div style="margin-top:30px;text-align:center;">
  <p style="margin:0;font-family:${SERIF};font-style:italic;font-size:14.5px;color:${BODY};">${esc(closing)}</p>
  <p style="margin:5px 0 0;font-family:${SERIF};font-size:14.5px;font-weight:700;color:${INK};">The Savo team</p>
  <p style="margin:3px 0 0;font-family:${SANS};font-size:10.5px;font-weight:600;color:${FAINT};">Reply to this email to reach our team</p>
</div>`;

/** Brand shell shared by every template (also wraps admin overrides). */
export function shell(opts: {
  preheader: string;
  eyebrowText?: string;
  heading: string;
  bodyHtml: string;
  cta?: { href: string; label: string; sub?: string };
  closing?: string;
  reason?: string;
  unsubscribeEmail?: string;
}): string {
  const year = new Date().getFullYear();
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${fontsCss()}</style></head>
<body style="margin:0;padding:0;background:${PAPER};font-family:${SERIF};-webkit-font-smoothing:antialiased;">
<div style="display:none;font-size:1px;color:${PAPER};max-height:0;overflow:hidden;opacity:0;">${esc(opts.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${PAPER};"><tr><td align="center" style="padding:36px 14px;">
<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;">

  <!-- Card -->
  <tr><td style="background:${CARD};border:1px solid ${LINE};border-radius:12px;">
    <!-- Wordmark -->
    <div style="padding:38px 40px 0;text-align:center;">
      <img src="${logoUrl()}" width="112" alt="Savo Technologies" style="display:block;width:112px;height:auto;border:0;margin:0 auto;">
    </div>
    <!-- Body -->
    <div style="padding:30px 40px 40px;">
      ${opts.eyebrowText ? eyebrow(opts.eyebrowText) : ""}
      ${opts.heading ? h1(opts.heading) : ""}
      ${opts.bodyHtml}
      ${opts.cta ? CTA(opts.cta.href, opts.cta.label, opts.cta.sub) : ""}
      ${signOff(opts.closing ?? "Kind regards,")}
    </div>
  </td></tr>

  <!-- Colophon -->
  <tr><td style="padding:24px 12px 6px;text-align:center;">
    <p style="margin:0 0 12px;font-family:${SANS};font-size:10.5px;font-weight:800;letter-spacing:0.22em;text-transform:uppercase;color:${INK};">Savo Technologies</p>
    <p style="margin:0 0 10px;font-family:${SANS};font-size:11.5px;color:${MUTED};">
      <a href="${site("/")}" style="color:${MUTED};text-decoration:none;">savotechnologies.com</a><span style="color:${LINE};margin:0 8px;">·</span><a href="https://www.linkedin.com/company/savotechnologies/" style="color:${MUTED};text-decoration:none;">LinkedIn</a><span style="color:${LINE};margin:0 8px;">·</span><a href="https://www.instagram.com/savotechnologies/" style="color:${MUTED};text-decoration:none;">Instagram</a><span style="color:${LINE};margin:0 8px;">·</span><a href="https://www.facebook.com/savotechnologies" style="color:${MUTED};text-decoration:none;">Facebook</a><span style="color:${LINE};margin:0 8px;">·</span><a href="https://www.youtube.com/@savotechnologies" style="color:${MUTED};text-decoration:none;">YouTube</a>
    </p>
    <p style="margin:0 0 10px;font-family:${SANS};font-size:11.5px;color:${MUTED};">
      <a href="mailto:hello@savotechnologies.com" style="color:${MUTED};text-decoration:none;">hello@savotechnologies.com</a><span style="color:${LINE};margin:0 8px;">·</span><a href="tel:+917502901234" style="color:${MUTED};text-decoration:none;">+91 75029 01234</a><span style="color:${LINE};margin:0 8px;">·</span><a href="https://wa.me/917502901234" style="color:${MUTED};text-decoration:none;">WhatsApp</a>
    </p>
    <p style="margin:0;font-family:${SANS};font-size:10px;line-height:1.7;color:${FAINT};">
      © ${year} ${esc(SITE.legalName)} — Indore · Zürich<br>
      ${esc(opts.reason ?? "You are receiving this because you contacted Savo Technologies.")}
      ${opts.unsubscribeEmail ? ` · <a href="${unsubscribeUrl(opts.unsubscribeEmail)}" style="color:${FAINT};text-decoration:underline;">Unsubscribe</a>` : ""}
    </p>
  </td></tr>

</table>
</td></tr></table></body></html>`;
}

const fn = (name: string) => name.split(" ")[0];

/* ══════════════ PUBLIC SITE · CLIENT ACKNOWLEDGEMENTS ══════════════ */

/** Enquiry drawer / contact form / start-page brief received. */
export function enquiryAck(name: string, projectType: string, to?: string): MailTemplate {
  return {
    subject: "Enquiry received — Savo Technologies",
    html: shell({
      preheader: `Your ${projectType} enquiry is with our engineers. A senior consultant replies within one business day.`,
      eyebrowText: `Enquiry received`,
      heading: `Your enquiry has been received.`,
      bodyHtml: [
        lead(`Dear ${fn(name)},<br><br>Thank you for contacting Savo Technologies. Your <strong>${esc(projectType)}</strong> enquiry has been logged and assigned to our engineering team for review.`),
        steps([
          ["Review", "Your enquiry is reviewed by our engineering team."],
          ["Response", "A senior consultant responds within one business day."],
          ["Discussion", "A call is scheduled to align on scope, timeline and budget."],
        ]),
        p(`To help us respond accurately, you may reply to this email with your preferred timeline and indicative budget.`, true),
      ].join("",),
      cta: { href: site("/#start"), label: "Book the call now", sub: "Pick a slot while we prepare your reply." },
      closing: "Kind regards,",
      reason: "You are receiving this because you sent an enquiry through savotechnologies.com.",
      unsubscribeEmail: to,
    }),
    text: `THANKS, ${fn(name).toUpperCase()} — YOUR BRIEF IS IN\n\nYour ${projectType} enquiry is with our engineers. A senior consultant replies personally within one business day.\n\n1. An engineer reads your brief — today.\n2. A senior consultant writes back — within one business day.\n3. We talk: scope, timeline, budget.\n\nBook the call now: ${site("/#start")}\n\nTalk soon,\nThe Savo team\n${site("/")}`,
  };
}

/** Footer callback request. */
export function callbackAck(name: string, country: string, to?: string): MailTemplate {
  return {
    subject: "We will call you back — Savo Technologies",
    html: shell({
      preheader: "Your callback is logged. A Savo engineer calls during your local business hours.",
      eyebrowText: "Callback confirmed",
      heading: `Your callback request has been received.`,
      bodyHtml: [
        lead(`Dear ${fn(name)},<br><br>Your request for a callback has been logged. A member of our team will call your ${esc(country)} number during local business hours.`),
        steps([
          ["Calling number", "The call will come from +91 75029 01234."],
          ["Preparation", "Please keep any project context ready for the discussion."],
          ["Urgent matters", "Reach us immediately on WhatsApp."],
        ]),
      ].join(""),
      cta: { href: "https://wa.me/917502901234", label: "WhatsApp us meanwhile" },
      closing: "Kind regards,",
      reason: "You are receiving this because you requested a callback on savotechnologies.com.",
      unsubscribeEmail: to,
    }),
    text: `${fn(name).toUpperCase()}, YOUR CALLBACK IS LOGGED\n\nA Savo engineer will call your ${country} number during your local business hours. The call comes from +91 75029 01234.\n\nUrgent? WhatsApp: https://wa.me/917502901234\n\nUntil the call,\nThe Savo team`,
  };
}

/** Ask Savo handoff — question the assistant could not answer. */
export function askSavoHandoffAck(question: string, to?: string): MailTemplate {
  return {
    subject: "Your question is with a Savo engineer",
    html: shell({
      preheader: "The assistant does not guess — your question went to a senior consultant, who replies within one business day.",
      eyebrowText: "Assistant handoff",
      heading: "Your question has been forwarded.",
      bodyHtml: [
        lead(`Thank you for using the Savo Assistant. Your question has been forwarded to a senior consultant, who will respond within one business day.`),
        quote(question),
        p(`For a detailed discussion, you may also schedule a consultation at a time that suits you.`, true),
      ].join(""),
      cta: { href: site("/#start"), label: "Book a call instead" },
      closing: "Kind regards,",
      reason: "You are receiving this because you asked the Savo Assistant a question it could not answer.",
      unsubscribeEmail: to,
    }),
    text: `YOUR QUESTION REACHED THE TEAM\n\nThe assistant never guesses — your question went to a senior consultant, who replies within one business day.\n\n"${question}"\n\nBook a call: ${site("/#start")}\n\nWith the answer soon,\nThe Savo team`,
  };
}

/** Careers application received. */
export function applicationAck(name: string, role: string): MailTemplate {
  return {
    subject: `Application received — ${role} · Savo Technologies`,
    html: shell({
      preheader: "An engineer reads every application and replies personally within two business days.",
      eyebrowText: `Application — ${role}`,
      heading: `Your application has been received.`,
      bodyHtml: [
        lead(`Dear ${fn(name)},<br><br>Thank you for your interest in joining Savo Technologies. Your application for <strong>${esc(role)}</strong> has been logged with our hiring team. Every application is reviewed by an engineer, with a personal response within two business days.`),
        steps([
          ["Review", "Your application is reviewed within two business days."],
          ["Technical discussion", "An conversation on your experience and our work."],
          ["Paid working session", "A collaborative session, compensated."],
          ["Offer", "A written decision follows."],
        ]),
      ].join(""),
      cta: { href: site("/careers"), label: "View our hiring process", sub: "The complete process, salaries and remote policy are published." },
      closing: "Kind regards,",
      reason: "You are receiving this because you applied to Savo Technologies.",
    }),
    text: `${fn(name).toUpperCase()}, YOUR APPLICATION IS IN\n\nYou applied for ${role}. An engineer reads every application and replies personally within two business days.\n\n1. Engineer review — within two business days\n2. Technical conversation\n3. Paid pairing session\n4. Written offer\n\nHow we hire: ${site("/careers")}\n\nSpeak soon,\nThe Savo team`,
  };
}

/* ══════════════ CLIENT PORTAL ══════════════ */

/** Admin created a portal account for a client. */
export function clientWelcome(name: string, email: string, password: string): MailTemplate {
  return {
    subject: "Your Savo client portal is ready",
    html: shell({
      preheader: "Progress, milestones, delivery updates and invoices — always current, always yours.",
      eyebrowText: "Portal access",
      heading: `Your client portal is now active.`,
      bodyHtml: [
        lead(`Dear ${fn(name)},<br><br>Your project dashboard is ready. It provides a current view of your engagement with Savo Technologies at all times.`),
        spec([
          ["Portal", "savotechnologies.com/portal"],
          ["Registered email", email],
          ["Password", password],
        ]),
        steps([
          ["Progress & milestones", "Status, schedule and upcoming milestones."],
          ["Delivery updates", "Updates posted by your delivery team."],
          ["Invoices & receipts", "Issued, paid and downloadable records."],
        ]),
        p(`<span style="font-family:${SANS};font-size:12px;color:${MUTED};">Please keep your credentials confidential. Your project lead can reset access at any time.</span>`, true),
      ].join(""),
      cta: { href: site("/portal"), label: "Open your portal" },
      closing: "Kind regards,",
      reason: "You are receiving this because a Savo project lead created a portal account for you.",
    }),
    text: `${fn(name).toUpperCase()}, YOUR PORTAL IS READY\n\nPortal: ${site("/portal")}\nEmail: ${email}\nPassword: ${password}\n\nInside: progress & milestones, delivery updates, invoices & receipts.\n\nWelcome aboard,\nThe Savo team`,
  };
}

/** Admin reset a client's portal password. */
export function clientPasswordReset(name: string, password: string): MailTemplate {
  return {
    subject: "Your Savo portal password was reset",
    html: shell({
      preheader: "A new password was generated; previous sessions were signed out.",
      eyebrowText: "Password reset",
      heading: "Your portal password has been reset.",
      bodyHtml: [
        p(`Dear ${fn(name)},<br><br>Your portal password has been reset by your project lead. All previous sessions were signed out automatically.`),
        spec([["New password", password]]),
        highlight(`If you did not expect this change, <strong>reply to this email immediately</strong>.`),
      ].join(""),
      cta: { href: site("/portal"), label: "Sign in" },
      closing: "Kind regards,",
      reason: "You are receiving this because your portal account password was reset.",
    }),
    text: `YOUR PORTAL PASSWORD WAS RESET\n\nNew password: ${password}\nPrevious sessions were signed out.\n\nSign in: ${site("/portal")}\nNot expecting this? Reply immediately.\n\nBack to work,\nThe Savo team`,
  };
}

function money(minor: number, currency = "INR") {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 0 }).format(minor / 100);
}
const fmtDate = (d: Date) => d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

/** Invoice issued to a client. */
export function invoiceIssued(clientName: string, number: string, amount: number, currency: string, dueDate: Date | null): MailTemplate {
  return {
    subject: `Invoice ${number} · ${money(amount, currency)}`,
    html: shell({
      preheader: `Invoice ${number} is available in your portal${dueDate ? `, due ${fmtDate(dueDate)}` : ""}.`,
      eyebrowText: `Invoice ${number}`,
      heading: "Your invoice is ready.",
      bodyHtml: [
        spec([["Amount", money(amount, currency)]], { big: 0 }),
        meta([`ISSUED ${fmtDate(new Date()).toUpperCase()}`, dueDate ? `DUE ${fmtDate(dueDate).toUpperCase()}` : "DUE ON RECEIPT", "AWAITING PAYMENT"]),
        p(`The invoice and its current status are available in your client portal, alongside your project records.`, true),
      ].join(""),
      cta: { href: site("/portal"), label: "View invoice", sub: "A PDF-ready view is available from your dashboard." },
      closing: "Kind regards,",
      reason: "You are receiving this because a Savo invoice was issued to your account.",
    }),
    text: `INVOICE ${number}\n\nAmount: ${money(amount, currency)}\nIssued: ${fmtDate(new Date())}\nDue: ${dueDate ? fmtDate(dueDate) : "On receipt"}\n\nView: ${site("/portal")}\n\nWith thanks,\nThe Savo team`,
  };
}

/** Invoice marked paid — receipt. */
export function invoicePaid(clientName: string, number: string, amount: number, currency: string): MailTemplate {
  return {
    subject: `Receipt — invoice ${number} paid · ${money(amount, currency)}`,
    html: shell({
      preheader: "Payment received in full. Thank you.",
      eyebrowText: `Receipt — ${number}`,
      heading: "Payment received.",
      bodyHtml: [
        spec([["Amount", money(amount, currency)]], { big: 0 }),
        meta([`INVOICE ${number.toUpperCase()}`, `RECEIVED ${fmtDate(new Date()).toUpperCase()}`, "PAID IN FULL"]),
        p(`Thank you for your payment. The receipt remains available in your client portal for your records.`, true),
      ].join(""),
      cta: { href: site("/portal"), label: "Open the portal" },
      closing: "Kind regards,",
      reason: "You are receiving this because an invoice on your account was paid.",
    }),
    text: `PAID IN FULL — THANK YOU\n\n${number} · ${money(amount, currency)} · Received ${fmtDate(new Date())}\n\n${site("/portal")}\n\nOnward,\nThe Savo team`,
  };
}

/** Invoice flagged overdue. */
export function invoiceOverdue(clientName: string, number: string, amount: number, currency: string, daysLate: number): MailTemplate {
  return {
    subject: `Reminder — invoice ${number} is past due`,
    html: shell({
      preheader: `Invoice ${number} is ${daysLate} day${daysLate === 1 ? "" : "s"} past its due date.`,
      eyebrowText: `Past due — ${number}`,
      heading: "Payment overdue reminder.",
      bodyHtml: [
        spec([
          ["Amount", money(amount, currency)],
          ["Past due by", `${daysLate} day${daysLate === 1 ? "" : "s"}`],
        ], { big: 0 }),
        p(`If payment has already been made, please disregard this notice with our thanks. To discuss this invoice, simply reply to this email.`, true),
      ].join(""),
      cta: { href: site("/portal"), label: "View invoice" },
      closing: "Kind regards,",
      reason: "You are receiving this because an invoice on your account passed its due date.",
    }),
    text: `REMINDER — INVOICE ${number} PAST DUE\n\n${money(amount, currency)} · ${daysLate} day(s) over\n\nAlready paid? Our thanks. Need to talk? Reply here.\n${site("/portal")}\n\nEasily fixed,\nThe Savo team`,
  };
}

/** Milestone changed status (started / completed). */
export function milestoneUpdate(clientName: string, projectTitle: string, milestoneTitle: string, status: string): MailTemplate {
  const label = status === "done" ? "completed" : status === "in_progress" ? "started" : status;
  return {
    subject: `Milestone ${label}: ${milestoneTitle}`,
    html: shell({
      preheader: `"${milestoneTitle}" is now ${label} on ${projectTitle}.`,
      eyebrowText: `Milestone ${label}`,
      heading: status === "done" ? "One more step shipped." : "Work has started.",
      bodyHtml: [
        spec([
          ["Milestone", milestoneTitle],
          ["Project", projectTitle],
        ]),
        p(`The complete milestone timeline is available in your client portal.`, true),
      ].join(""),
      cta: { href: site("/portal"), label: "View timeline" },
      closing: "Kind regards,",
      reason: "You are receiving this because a milestone changed on your project.",
    }),
    text: `MILESTONE ${label.toUpperCase()}\n\nProject: ${projectTitle}\nMilestone: ${milestoneTitle}\n\n${site("/portal")}\n\nSteady onward,\nThe Savo team`,
  };
}

/** A delivery-log update was posted to a project. */
export function projectUpdate(clientName: string, projectTitle: string, title: string, body: string): MailTemplate {
  return {
    subject: `Project update: ${title}`,
    html: shell({
      preheader: body ? body.slice(0, 110) : `A new update on ${projectTitle}.`,
      eyebrowText: `Project update`,
      heading: title,
      bodyHtml: [
        body ? prose(body) : "",
        meta([projectTitle.toUpperCase()]),
      ].join(""),
      cta: { href: site("/portal"), label: "See the full timeline", sub: "Every update, milestone and invoice in one place." },
      closing: "Kind regards,",
      reason: "You are receiving this because your project team posted a delivery update.",
    }),
    text: `PROJECT UPDATE — ${title}\n\n${body}\n\n${site("/portal")}\n\nMore as it lands,\nThe Savo team`,
  };
}

/* ══════════════ TEAM NOTIFICATIONS ══════════════ */

/** Internal: any new enquiry (all public forms). */
export function teamEnquiry(d: {
  name: string;
  email?: string | null;
  phone?: string | null;
  projectType: string;
  budget?: string | null;
  message: string;
  source: string;
}): MailTemplate {
  return {
    subject: `New ${d.source}: ${d.name} — ${d.projectType}`,
    html: shell({
      preheader: `${d.name} · ${d.projectType}${d.budget ? ` · ${d.budget}` : ""} · reply promised within one business day.`,
      eyebrowText: `New enquiry — ${d.source}`,
      heading: `${d.name} — ${d.projectType}`,
      bodyHtml: [
        spec([
          ["Email", d.email ?? "—"],
          ["Phone", d.phone ?? "—"],
          ["Budget", d.budget ?? "—"],
        ]),
        prose(d.message),
        highlight(`<strong>Note:</strong> a response within one business day is committed on the website.`),
      ].join(""),
      cta: { href: site("/admin/enquiries"), label: "Open the inbox" },
      closing: "Regards,",
      reason: "Internal team notification.",
    }),
    text: `NEW ENQUIRY (${d.source})\n\n${d.name} · ${d.email ?? "no email"} · ${d.phone ?? "no phone"}\nType: ${d.projectType}\nBudget: ${d.budget ?? "—"}\n\n${d.message}\n\nReply promised within one business day.\n${site("/admin/enquiries")}\n\nOwn the promise,\nThe Savo team`,
  };
}

/** Internal: careers application → HR. */
export function teamApplication(d: {
  name: string;
  email: string;
  role: string;
  experience?: string;
  links?: string;
  message: string;
}): MailTemplate {
  return {
    subject: `New application: ${d.role} — ${d.name}`,
    html: shell({
      preheader: `${d.name} applied for ${d.role}. Candidates are promised a personal reply within two business days.`,
      eyebrowText: `New application — ${d.role}`,
      heading: `${d.name} applied`,
      bodyHtml: [
        spec([
          ["Email", d.email],
          ["Role", d.role],
          ["Experience", d.experience],
          ["Links", d.links],
        ]),
        prose(d.message),
        highlight(`<strong>Note:</strong> candidates are informed of a personal response within two business days.`),
      ].join(""),
      cta: { href: site("/admin/enquiries"), label: "Open the inbox" },
      closing: "Regards,",
      reason: "Internal HR notification.",
    }),
    text: `NEW APPLICATION\n\n${d.name} · ${d.email}\nRole: ${d.role}\nExperience: ${d.experience ?? "—"}\nLinks: ${d.links ?? "—"}\n\n${d.message}\n\nPersonal reply promised within two business days.\n${site("/admin/enquiries")}\n\nGood hiring,\nThe Savo team`,
  };
}

/** Internal: callback requested (phone, country). */
export function teamCallback(d: { name: string; phone: string; country: string; note?: string }): MailTemplate {
  return {
    subject: `Callback request: ${d.name} (${d.country})`,
    html: shell({
      preheader: `Call ${d.name} on the ${d.country} number — during their local business hours.`,
      eyebrowText: "Callback requested",
      heading: `Callback request — ${d.name}`,
      bodyHtml: [
        spec([
          ["Phone", d.phone],
          ["Country", d.country],
        ]),
        d.note ? prose(d.note) : "",
        p(`The website confirms the call will be made during the recipient's local business hours, from +91 75029 01234.`, true),
      ].join(""),
      cta: { href: site("/admin/enquiries?type=Callback"), label: "Open callbacks" },
      closing: "Regards,",
      reason: "Internal team notification.",
    }),
    text: `CALLBACK REQUESTED\n\n${d.name} · ${d.phone} (${d.country})\n${d.note ?? ""}\n\nCall during their local business hours.\n${site("/admin/enquiries?type=Callback")}\n\nDial when ready,\nThe Savo team`,
  };
}

/** Internal: Ask Savo handoff (unanswered question + email). */
export function teamAskSavo(d: { email: string; question: string }): MailTemplate {
  return {
    subject: "Ask Savo handoff — question needs an answer",
    html: shell({
      preheader: "The visitor was promised a reply within one business day. The clock is running.",
      eyebrowText: "Assistant handoff",
      heading: "Assistant handoff — response required",
      bodyHtml: [
        spec([["Visitor", d.email]]),
        quote(`“${d.question}”`),
        highlight(`<strong>Note:</strong> a response within one business day is committed on the website.`),
      ].join(""),
      cta: { href: site("/admin/enquiries"), label: "Answer it now" },
      closing: "Regards,",
      reason: "Internal team notification.",
    }),
    text: `ASSISTANT HANDOFF\n\nVisitor: ${d.email}\n\n"${d.question}"\n\nReply within one business day — promise made.\n${site("/admin/enquiries")}\n\nBefore the day ends,\nThe Savo team`,
  };
}
