/**
 * Transactional email templates — every automated action on the site.
 *
 * DESIGN — studio letterhead, Savo's own document world:
 *   the site's editorial voice carried into the inbox. Serif display
 *   headlines (Georgia — universal, warm, nothing like generic SaaS
 *   sans), mono reference labels (the Fragment-mono voice), hairline
 *   rules and a double-rule letterhead under the wordmark, the
 *   vermilion square motif, sharp 2px corners like the site's buttons,
 *   warm-paper highlight panels, and human letter closings per
 *   template — correspondence, not dashboards.
 *
 * Email-client reality: tables + inline styles, 600px, PNG wordmark
 * (SVG unsupported in Gmail/Outlook), plain-text twin per template,
 * preheader, dark-mode-safe neutrals. Promises mirror the website
 * copy exactly; nothing is fabricated.
 */

import { createHmac } from "node:crypto";
import { SITE } from "@/constants/site";

const PAPER = "#f5f4f0";
const SOFT = "#faf4ee"; // warm paper tint for highlight panels
const INK = "#14161c";
const BODY = "#33363c"; // reading ink, softer than headings
const MUTED = "#6a6e75";
const FAINT = "#9a9ea4";
const ACCENT = "#d9480f";
const LINE = "#e3e1da";
const CARD = "#ffffff";

const SERIF = "Georgia, 'Times New Roman', Times, serif";
const MONO = "'Menlo', 'Consolas', 'Courier New', monospace";
const SANS = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

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

/** Wordmark URL — resolves for wherever this renders: the editor preview
 *  (browser, any origin) or the send path (production origin). */
function logoUrl(): string {
  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_SITE_URL || "https://savotechnologies.com";
  return `${origin.replace(/\/$/, "")}/images/email/logo.png`;
}

const SALT = process.env.ENQUIRY_IP_SALT || "dev-salt";
export function unsubscribeSig(email: string): string {
  return createHmac("sha256", SALT).update(email.toLowerCase()).digest("hex").slice(0, 32);
}
export function unsubscribeUrl(email: string): string {
  return `${site("/unsubscribe")}?email=${encodeURIComponent(email)}&sig=${unsubscribeSig(email)}`;
}

/* ── the letterhead vocabulary ─────────────────────────────────────── */

const p = (s: string, last = false) =>
  `<p style="margin:${last ? "0" : "0 0 15px"};font-family:${SERIF};font-size:15.5px;line-height:1.7;color:${BODY};">${s}</p>`;
const lead = (s: string) =>
  `<p style="margin:0 0 18px;font-family:${SERIF};font-size:16.5px;line-height:1.7;color:${INK};">${s}</p>`;
const a = (href: string, label: string) =>
  `<a href="${href}" style="color:${ACCENT};text-decoration:underline;text-underline-offset:3px;">${esc(label)}</a>`;
const rule = (m = 26) => `<div style="border-top:1px solid ${LINE};margin:${m}px 0;"></div>`;

/** Vermilion square + mono label — the site's eyebrow motif. */
const eyebrow = (t: string) =>
  `<p style="margin:0 0 14px;font-family:${MONO};font-size:10.5px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:${MUTED};"><span style="display:inline-block;width:7px;height:7px;background:${ACCENT};margin-right:9px;vertical-align:1px;"></span>${esc(t)}</p>`;

const h1 = (t: string) =>
  `<h1 style="margin:0 0 16px;font-family:${SERIF};font-size:26px;line-height:1.25;letter-spacing:-0.012em;font-weight:700;color:${INK};">${esc(t)}</h1>`;

/** Index-style steps — mono numbers, hairlines, no bubbles. */
function steps(items: [string, string][]): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:20px 0;width:100%;">${items
    .map(
      ([title, sub], i) => `<tr>
  <td style="width:46px;vertical-align:top;padding:13px 0;border-top:${i === 0 ? "none" : `1px solid ${LINE}`};">
    <span style="font-family:${MONO};font-size:12px;font-weight:700;color:${ACCENT};">${String(i + 1).padStart(2, "0")}</span>
  </td>
  <td style="vertical-align:top;padding:13px 0;border-top:${i === 0 ? "none" : `1px solid ${LINE}`};">
    <div style="font-family:${SERIF};font-size:15px;font-weight:700;color:${INK};">${esc(title)}</div>
    <div style="margin-top:3px;font-family:${SANS};font-size:13px;line-height:1.55;color:${MUTED};">${esc(sub)}</div>
  </td>
</tr>`,
    )
    .join("")}</table>`;
}

/** Ledger rows — mono labels, hairlines, no fills; big option for amounts. */
function spec(rows: [string, string | undefined][], opts?: { big?: number }): string {
  const items = rows.filter(([, v]) => v !== undefined && v !== "");
  if (!items.length) return "";
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin:20px 0;">${items
    .map(
      ([k, v], i) => `<tr>
  <td style="width:34%;vertical-align:${opts?.big === i ? "bottom" : "top"};padding:11px 14px 11px 0;border-top:${i === 0 ? "none" : `1px solid ${LINE}`};font-family:${MONO};font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:${FAINT};">${esc(k)}</td>
  <td style="vertical-align:${opts?.big === i ? "bottom" : "top"};padding:11px 0;border-top:${i === 0 ? "none" : `1px solid ${LINE}`};font-family:${opts?.big === i ? SERIF : SANS};font-size:${opts?.big === i ? "23px" : "14px"};font-weight:${opts?.big === i ? 700 : 600};color:${opts?.big === i ? ACCENT : INK};">${esc(v ?? "—")}</td>
</tr>`,
    )
    .join("")}</table>`;
}

/** Warm-paper panel with the vermilion spine. */
function highlight(html: string): string {
  return `<div style="margin:20px 0;padding:15px 18px;background:${SOFT};border-left:3px solid ${ACCENT};font-family:${SERIF};font-size:14.5px;line-height:1.65;color:${INK};">${html}</div>`;
}

/** Correspondence quote — serif, italic, hairline spine. */
function quote(text: string): string {
  return `<div style="margin:20px 0;padding:4px 0 4px 18px;border-left:2px solid ${INK};font-family:${SERIF};font-style:italic;font-size:16px;line-height:1.65;color:${INK};">${esc(text)}</div>`;
}

/** Site-native button: sharp 2px corners like savotechnologies.com. */
const CTA = (href: string, label: string, sub?: string) => `
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:26px 0 4px;"><tr><td>
<a href="${href}" style="display:inline-block;background:${INK};color:#ffffff;font-family:${SANS};font-size:14px;font-weight:700;letter-spacing:0.02em;text-decoration:none;padding:15px 30px;border-radius:2px;">${esc(label)}&nbsp;&nbsp;→</a>
</td></tr>${sub ? `<tr><td style="padding:10px 0 0;font-family:${SANS};font-size:12px;color:${MUTED};">${esc(sub)}</td></tr>` : ""}</table>`;

/** Human closing — each letter signs off in its own voice. */
function signOff(closing: string): string {
  return `<div style="margin-top:26px;">
  <div style="border-top:1px solid ${LINE};width:44px;margin-bottom:14px;"></div>
  <p style="margin:0;font-family:${SERIF};font-style:italic;font-size:14.5px;color:${BODY};">${esc(closing)}</p>
  <p style="margin:5px 0 0;font-family:${SERIF};font-size:14.5px;font-weight:700;color:${INK};">The Savo team</p>
  <p style="margin:3px 0 0;font-family:${MONO};font-size:10px;letter-spacing:0.08em;text-transform:uppercase;color:${FAINT};">Reply to this email — a human reads it</p>
</div>`;
}

const MONO_DATE = () =>
  new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase();

/** Brand shell shared by every template (also wraps admin overrides). */
export function shell(opts: {
  preheader: string;
  eyebrowText?: string;
  ref?: string;
  heading: string;
  bodyHtml: string;
  cta?: { href: string; label: string; sub?: string };
  closing?: string;
  reason?: string;
  unsubscribeEmail?: string;
}): string {
  const year = new Date().getFullYear();
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:${PAPER};font-family:${SERIF};-webkit-font-smoothing:antialiased;">
<div style="display:none;font-size:1px;color:${PAPER};max-height:0;overflow:hidden;opacity:0;">${esc(opts.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${PAPER};"><tr><td align="center" style="padding:36px 14px;">
<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;">

  <!-- Letter -->
  <tr><td style="background:${CARD};border:1px solid ${LINE};border-left:3px solid ${ACCENT};border-radius:3px;">
    <!-- Letterhead: wordmark + correspondence reference -->
    <div style="padding:30px 40px 22px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
        <td style="vertical-align:middle;">
          <img src="${logoUrl()}" width="128" alt="Savo Technologies" style="display:block;width:128px;height:auto;border:0;">
        </td>
        <td align="right" style="vertical-align:middle;">
          <p style="margin:0;font-family:${MONO};font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:${FAINT};text-align:right;">${esc(opts.ref ?? "Correspondence")}</p>
          <p style="margin:3px 0 0;font-family:${MONO};font-size:10px;letter-spacing:0.14em;color:${FAINT};text-align:right;">${MONO_DATE()}</p>
        </td>
      </tr></table>
      <!-- Double rule — the letterhead signature -->
      <div style="margin-top:18px;border-top:2px solid ${INK};"></div>
      <div style="margin-top:2px;border-top:1px solid ${LINE};"></div>
    </div>
    <!-- Body -->
    <div style="padding:30px 40px 36px;">
      ${opts.eyebrowText ? eyebrow(opts.eyebrowText) : ""}
      ${opts.heading ? h1(opts.heading) : ""}
      ${opts.bodyHtml}
      ${opts.cta ? CTA(opts.cta.href, opts.cta.label, opts.cta.sub) : ""}
      ${signOff(opts.closing ?? "Warm regards,")}
    </div>
  </td></tr>

  <!-- Colophon -->
  <tr><td style="padding:24px 12px 6px;text-align:center;">
    <div style="margin:0 auto 14px;width:44px;border-top:2px solid ${INK};"></div>
    <p style="margin:0 0 12px;font-family:${MONO};font-size:10px;font-weight:700;letter-spacing:0.22em;text-transform:uppercase;color:${INK};">Savo Technologies</p>
    <p style="margin:0 0 10px;font-family:${SANS};font-size:11.5px;color:${MUTED};">
      ${a(site("/"), "savotechnologies.com")}<span style="color:${LINE};margin:0 8px;">·</span>${a("https://www.linkedin.com/company/savotechnologies/", "LinkedIn")}<span style="color:${LINE};margin:0 8px;">·</span>${a("https://www.instagram.com/savotechnologies/", "Instagram")}<span style="color:${LINE};margin:0 8px;">·</span>${a("https://www.facebook.com/savotechnologies", "Facebook")}<span style="color:${LINE};margin:0 8px;">·</span>${a("https://www.youtube.com/@savotechnologies", "YouTube")}
    </p>
    <p style="margin:0 0 10px;font-family:${SANS};font-size:11.5px;color:${MUTED};">
      <a href="mailto:hello@savotechnologies.com" style="color:${MUTED};text-decoration:none;">hello@savotechnologies.com</a><span style="color:${LINE};margin:0 8px;">·</span><a href="tel:+917502901234" style="color:${MUTED};text-decoration:none;">+91 75029 01234</a><span style="color:${LINE};margin:0 8px;">·</span><a href="https://wa.me/917502901234" style="color:${MUTED};text-decoration:none;">WhatsApp</a>
    </p>
    <p style="margin:0;font-family:${MONO};font-size:9.5px;letter-spacing:0.06em;line-height:1.7;color:${FAINT};">
      © ${year} ${esc(SITE.legalName)} — INDORE · ZÜRICH<br>
      ${esc(opts.reason ?? "You are receiving this because you contacted Savo Technologies.")}
      ${opts.unsubscribeEmail ? ` — <a href="${unsubscribeUrl(opts.unsubscribeEmail)}" style="color:${FAINT};text-decoration:underline;">Unsubscribe</a>` : ""}
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
    subject: "We got your brief — Savo Technologies",
    html: shell({
      preheader: `Your ${projectType} enquiry is with our engineers. A senior consultant replies within one business day.`,
      eyebrowText: `Enquiry received — ${projectType}`,
      ref: "ENQ · RECEIPT",
      heading: `Thanks, ${fn(name)} — your brief is in.`,
      bodyHtml: [
        lead(`It landed with our engineers, not a sales queue. A senior consultant reads it and replies personally <em>within one business day</em>.`),
        steps([
          ["An engineer reads your brief", "Today — scope, stack and fit, before anything else."],
          ["A senior consultant writes back", "Within one business day, with first thoughts and the right questions."],
          ["We talk: scope, timeline, budget", "Thirty focused minutes. You leave with a clear picture in writing."],
        ]),
        highlight(`Two things make the first call concrete instead of exploratory: your <strong>ideal launch date</strong>, and an honest <strong>budget range</strong>.`),
      ].join(""),
      cta: { href: site("/#start"), label: "Book the call now", sub: "Pick a slot while we prepare your reply." },
      closing: "Talk soon,",
      reason: "You are receiving this because you sent an enquiry through savotechnologies.com.",
      unsubscribeEmail: to,
    }),
    text: `THANKS, ${fn(name).toUpperCase()} — YOUR BRIEF IS IN\n\nYour ${projectType} enquiry is with our engineers. A senior consultant replies personally within one business day.\n\n01 An engineer reads your brief — today.\n02 A senior consultant writes back — within one business day.\n03 We talk: scope, timeline, budget.\n\nBook the call now: ${site("/#start")}\n\nTalk soon,\nThe Savo team\n${site("/")}`,
  };
}

/** Footer callback request. */
export function callbackAck(name: string, country: string, to?: string): MailTemplate {
  return {
    subject: "We will call you back — Savo Technologies",
    html: shell({
      preheader: "Your callback is logged. A Savo engineer calls during your local business hours.",
      eyebrowText: "Callback confirmed",
      ref: "CALLBACK · CONFIRMED",
      heading: `${fn(name)}, your callback is logged.`,
      bodyHtml: [
        lead(`A Savo engineer will call your ${country} number during your local business hours.`),
        steps([
          ["Watch for +91 75029 01234", "Save the number so nothing lands in filters."],
          ["Two minutes of context", "Where the project stands today saves a day later."],
          ["Urgent before then?", "WhatsApp us — a human answers, usually within the hour."],
        ]),
      ].join(""),
      cta: { href: "https://wa.me/917502901234", label: "WhatsApp us meanwhile" },
      closing: "Until the call,",
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
      ref: "ASK SAVO · HANDOFF",
      heading: "Your question reached the team.",
      bodyHtml: [
        lead(`The Savo Assistant never guesses — so yours went straight to a senior consultant, who replies <em>within one business day</em>.`),
        quote(question),
        p(`Prefer a conversation to an email thread? Book a call — the first one is free, and an engineer takes it, not sales.`, true),
      ].join(""),
      cta: { href: site("/#start"), label: "Book a call instead" },
      closing: "With the answer soon,",
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
      ref: "CAREERS · RECEIPT",
      heading: `${fn(name)}, your application is in.`,
      bodyHtml: [
        lead(`No ATS black hole: <em>an engineer reads every application</em> and replies personally within two business days.`),
        steps([
          ["Engineer review", "Within two business days — a real read, not a keyword scan."],
          ["Technical conversation", "Your work, our stack, mutual expectations."],
          ["Paid pairing session", "A real problem, real compensation, both sides evaluating."],
          ["Written offer", "Four steps, no puzzles, no ghosting."],
        ]),
      ].join(""),
      cta: { href: site("/careers"), label: "See how we hire", sub: "The full process, salaries and remote policy — all public." },
      closing: "Speak soon,",
      reason: "You are receiving this because you applied to Savo Technologies.",
    }),
    text: `${fn(name).toUpperCase()}, YOUR APPLICATION IS IN\n\nYou applied for ${role}. An engineer reads every application and replies personally within two business days.\n\n01 Engineer review — within two business days\n02 Technical conversation\n03 Paid pairing session\n04 Written offer\n\nHow we hire: ${site("/careers")}\n\nSpeak soon,\nThe Savo team`,
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
      ref: "PORTAL · ACCESS",
      heading: `${fn(name)}, your project portal is ready.`,
      bodyHtml: [
        lead(`Your project dashboard is live — your engagement with Savo, in one honest place.`),
        spec([
          ["Portal", "savotechnologies.com/portal"],
          ["Your email", email],
          ["Password", password],
        ]),
        steps([
          ["Progress & milestones", "What is done, what is next, what is due — with dates."],
          ["Delivery updates", "Every log entry from the team, the moment it posts."],
          ["Invoices & receipts", "Issued, paid, downloadable — accounts-ready."],
        ]),
        p(`<span style="font-family:${SANS};font-size:12px;color:${MUTED};">The password was generated for you and is stored hashed — share it privately. Your project lead can reset it anytime.</span>`, true),
      ].join(""),
      cta: { href: site("/portal"), label: "Open your portal" },
      closing: "Welcome aboard,",
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
      ref: "PORTAL · RESET",
      heading: "Your portal password was reset.",
      bodyHtml: [
        p(`${fn(name)}, a Savo project lead reset your password. Previous sessions were signed out automatically.`),
        spec([["New password", password]]),
        highlight(`Expected this? Nothing to do. <strong>Did not expect it?</strong> Reply to this email immediately — a human reads it.`),
      ].join(""),
      cta: { href: site("/portal"), label: "Sign in" },
      closing: "Back to work,",
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
      eyebrowText: `Invoice — ${number}`,
      ref: `INVOICE · ${number}`,
      heading: "A new invoice is ready.",
      bodyHtml: [
        spec([
          ["Amount", money(amount, currency)],
          ["Issued", fmtDate(new Date())],
          ["Due", dueDate ? fmtDate(dueDate) : "On receipt"],
          ["Status", "Awaiting payment"],
        ], { big: 0 }),
        p(`The invoice, its status and your payment history live in the portal — beside your project progress, where they belong.`, true),
      ].join(""),
      cta: { href: site("/portal"), label: "View invoice", sub: "PDF-ready view from your dashboard." },
      closing: "With thanks,",
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
      eyebrowText: `Payment received — ${number}`,
      ref: `RECEIPT · ${number}`,
      heading: "Paid in full — thank you.",
      bodyHtml: [
        spec([
          ["Amount", money(amount, currency)],
          ["Invoice", number],
          ["Received", fmtDate(new Date())],
          ["Status", "Paid in full"],
        ], { big: 0 }),
        p(`Receipts stay in your portal for accounts. The next milestone keeps moving.`, true),
      ].join(""),
      cta: { href: site("/portal"), label: "Open the portal" },
      closing: "Onward,",
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
      ref: `INVOICE · REMINDER`,
      heading: "A quiet nudge on an open invoice.",
      bodyHtml: [
        spec([
          ["Amount", money(amount, currency)],
          ["Past due by", `${daysLate} day${daysLate === 1 ? "" : "s"}`],
          ["Status", "Overdue"],
        ], { big: 0 }),
        p(`If the payment is already on its way, ignore this note with our thanks. If something needs discussing — scope, timing, anything — reply here. We would rather talk than chase.`, true),
      ].join(""),
      cta: { href: site("/portal"), label: "View invoice" },
      closing: "Easily fixed,",
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
      eyebrowText: `Milestone ${label} — ${projectTitle}`,
      ref: "PROJECT · MILESTONE",
      heading: status === "done" ? "One more step shipped." : "Work has started.",
      bodyHtml: [
        spec([
          ["Project", projectTitle],
          ["Milestone", milestoneTitle],
          ["Status", label.charAt(0).toUpperCase() + label.slice(1)],
        ]),
        p(`Your dashboard timeline shows every step with dates — the honest version, not a status report.`, true),
      ].join(""),
      cta: { href: site("/portal"), label: "Open the timeline" },
      closing: "Steady onward,",
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
      eyebrowText: `Project update — ${projectTitle}`,
      ref: "PROJECT · UPDATE",
      heading: title,
      bodyHtml: [
        body ? `<div style="font-family:${SERIF};font-size:15.5px;line-height:1.7;color:${BODY};white-space:pre-line;">${esc(body)}</div>` : "",
      ].join(""),
      cta: { href: site("/portal"), label: "See the full timeline", sub: "Every update, milestone and invoice in one place." },
      closing: "More as it lands,",
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
      ref: "INTERNAL · ENQUIRY",
      heading: `${d.name} — ${d.projectType}`,
      bodyHtml: [
        spec([
          ["Name", d.name],
          ["Email", d.email ?? "—"],
          ["Phone", d.phone ?? "—"],
          ["Type", d.projectType],
          ["Budget", d.budget ?? "—"],
          ["Source", d.source],
        ]),
        rule(18),
        `<div style="font-family:${SERIF};font-size:15px;line-height:1.7;color:${BODY};white-space:pre-line;">${esc(d.message)}</div>`,
        rule(18),
        highlight(`<strong>The site promised a reply within one business day.</strong> The enquiry sits in the inbox until someone moves it.`),
      ].join(""),
      cta: { href: site("/admin/enquiries"), label: "Open the inbox" },
      closing: "Own the promise,",
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
      ref: "INTERNAL · HR",
      heading: `${d.name} applied`,
      bodyHtml: [
        spec([
          ["Name", d.name],
          ["Email", d.email],
          ["Role", d.role],
          ["Experience", d.experience],
          ["Links", d.links],
        ]),
        rule(18),
        `<div style="font-family:${SERIF};font-size:15px;line-height:1.7;color:${BODY};white-space:pre-line;">${esc(d.message)}</div>`,
        rule(18),
        highlight(`<strong>Candidates are told an engineer replies within two business days.</strong> Own it in the inbox.`),
      ].join(""),
      cta: { href: site("/admin/enquiries"), label: "Open the inbox" },
      closing: "Good hiring,",
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
      ref: "INTERNAL · CALLBACK",
      heading: `${d.name} asked for a call`,
      bodyHtml: [
        spec([
          ["Phone", d.phone],
          ["Country", d.country],
          ["Note", d.note ?? "—"],
        ]),
        p(`The site told them the call comes <em>during their local business hours</em>, from +91 75029 01234.`, true),
      ].join(""),
      cta: { href: site("/admin/enquiries?type=Callback"), label: "Open callbacks" },
      closing: "Dial when ready,",
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
      ref: "INTERNAL · HANDOFF",
      heading: "A question the assistant could not answer",
      bodyHtml: [
        spec([["Visitor", d.email]]),
        quote(d.question),
        highlight(`<strong>Promise made on the site: a reply within one business day.</strong> The visitor has been told exactly that.`),
      ].join(""),
      cta: { href: site("/admin/enquiries"), label: "Answer it now" },
      closing: "Before the day ends,",
      reason: "Internal team notification.",
    }),
    text: `ASSISTANT HANDOFF\n\nVisitor: ${d.email}\n\n"${d.question}"\n\nReply within one business day — promise made.\n${site("/admin/enquiries")}\n\nBefore the day ends,\nThe Savo team`,
  };
}
