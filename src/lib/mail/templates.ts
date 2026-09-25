/**
 * Transactional email templates — every automated action on the site.
 *
 * Design: the site's document world, translated for email clients at the
 * standard of professional SaaS senders —
 *   accent top bar · logo header · mono eyebrow · statement heading ·
 *   lead paragraph · numbered timelines · spec-sheet detail tables ·
 *   highlight/quote blocks · bold CTA button + text-link fallback ·
 *   signature · rich footer (contact, socials, legal, reason,
 *   unsubscribe on marketing-adjacent mail).
 *
 * Email-client reality respected: tables + inline styles only, 600px
 * card, system fonts, PNG logo (SVG is unsupported in Gmail/Outlook),
 * plain-text twin per template, preheader, dark-mode-safe neutrals.
 *
 * Promises in copy mirror the website exactly (1-business-day enquiry
 * replies, engineer-read applications, 2-day hiring replies). Nothing
 * is ever fabricated.
 */

import { createHmac } from "node:crypto";
import { SITE } from "@/constants/site";

const PAPER = "#f5f4f0";
const INK = "#14161c";
const MUTED = "#5c6168";
const FAINT = "#8a8e95";
const ACCENT = "#d9480f";
const ACCENT_SOFT = "#fdf0ea";
const LINE = "#e6e4de";
const CARD = "#ffffff";

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
const LOGO = site("/images/email/logo.png");

const SALT = process.env.ENQUIRY_IP_SALT || "dev-salt";
export function unsubscribeSig(email: string): string {
  return createHmac("sha256", SALT).update(email.toLowerCase()).digest("hex").slice(0, 32);
}
export function unsubscribeUrl(email: string): string {
  return `${site("/unsubscribe")}?email=${encodeURIComponent(email)}&sig=${unsubscribeSig(email)}`;
}

/* ── building blocks ──────────────────────────────────────────────── */

const p = (s: string, last = false) =>
  `<p style="margin:${last ? "0" : "0 0 16px"};font-size:15.5px;line-height:1.65;color:${INK};">${s}</p>`;
const lead = (s: string) =>
  `<p style="margin:0 0 18px;font-size:16px;line-height:1.65;color:${INK};">${s}</p>`;
const a = (href: string, label: string) =>
  `<a href="${href}" style="color:${ACCENT};text-decoration:underline;text-underline-offset:2px;">${esc(label)}</a>`;
const rule = () => `<div style="border-top:1px solid ${LINE};margin:26px 0;"></div>`;

const eyebrow = (t: string) =>
  `<p style="margin:0 0 14px;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:${ACCENT};">${esc(t)}</p>`;

const h1 = (t: string) =>
  `<h1 style="margin:0 0 16px;font-size:25px;line-height:1.28;letter-spacing:-0.02em;font-weight:800;color:${INK};">${esc(t)}</h1>`;

/** Numbered timeline — "what happens next" steps. */
function steps(items: [string, string][], opts?: { accentFirst?: boolean }): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:22px 0;width:100%;">${items
    .map(
      ([title, sub], i) => `<tr>
  <td style="width:34px;vertical-align:top;padding:0 0 18px;">
    <div style="width:26px;height:26px;border-radius:7px;background:${i === 0 && opts?.accentFirst ? ACCENT : PAPER};border:1px solid ${i === 0 && opts?.accentFirst ? ACCENT : LINE};color:${i === 0 && opts?.accentFirst ? "#ffffff" : ACCENT};font-size:12.5px;font-weight:800;text-align:center;line-height:24px;">${i + 1}</div>
  </td>
  <td style="vertical-align:top;padding:2px 0 18px;">
    <div style="font-size:14.5px;font-weight:700;color:${INK};">${esc(title)}</div>
    <div style="margin-top:3px;font-size:13.5px;line-height:1.55;color:${MUTED};">${esc(sub)}</div>
  </td>
</tr>`,
    )
    .join("")}</table>`;
}

/** Spec-sheet detail table — label/value rows with hairlines. */
function spec(rows: [string, string | undefined][], opts?: { big?: number }): string {
  const items = rows.filter(([, v]) => v !== undefined && v !== "");
  if (!items.length) return "";
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin:20px 0;border:1px solid ${LINE};border-radius:10px;overflow:hidden;">${items
    .map(
      ([k, v], i) => `<tr${i > 0 ? ` style="border-top:1px solid ${LINE};"` : ""}>
  <td style="padding:12px 16px;font-size:12.5px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:${FAINT};width:38%;vertical-align:top;background:${PAPER};border-top:${i > 0 ? `1px solid ${LINE}` : "none"};">${esc(k)}</td>
  <td style="padding:12px 16px;font-size:${opts?.big === i ? "19px" : "14.5px"};font-weight:${opts?.big === i ? 800 : 600};color:${opts?.big === i ? ACCENT : INK};vertical-align:top;border-top:${i > 0 ? `1px solid ${LINE}` : "none"};">${esc(v ?? "—")}</td>
</tr>`,
    )
    .join("")}</table>`;
}

/** Soft highlight box (accent-tinted) for key info. */
function highlight(html: string): string {
  return `<div style="margin:20px 0;padding:16px 18px;background:${ACCENT_SOFT};border-left:3px solid ${ACCENT};border-radius:0 10px 10px 0;font-size:14.5px;line-height:1.6;color:${INK};">${html}</div>`;
}

/** Quote block (visitor question, client words). */
function quote(text: string): string {
  return `<div style="margin:20px 0;padding:14px 18px;background:${PAPER};border-left:3px solid ${INK};border-radius:0 10px 10px 0;font-size:15px;line-height:1.6;color:${INK};font-style:italic;">${esc(text)}</div>`;
}

const CTA = (href: string, label: string, sub?: string) => `
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:26px 0 6px;"><tr><td>
<a href="${href}" style="display:inline-block;background:${INK};color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:15px 34px;border-radius:9px;letter-spacing:0.01em;">${esc(label)} →</a>
</td></tr>${sub ? `<tr><td style="padding-top:10px;font-size:12.5px;color:${MUTED};">${esc(sub)}</td></tr>` : ""}</table>`;

const SIGN = `<div style="margin-top:26px;">
  <div style="width:28px;height:3px;background:${ACCENT};margin-bottom:14px;"></div>
  <p style="margin:0;font-size:14.5px;font-weight:700;color:${INK};">The Savo team</p>
  <p style="margin:3px 0 0;font-size:12.5px;color:${MUTED};">Reply to this email — a human reads it, usually the same day.</p>
</div>`;

/** Brand shell shared by every template (also wraps admin overrides). */
export function shell(opts: {
  preheader: string;
  eyebrowText?: string;
  heading: string;
  bodyHtml: string;
  cta?: { href: string; label: string; sub?: string };
  reason?: string;
  unsubscribeEmail?: string;
}): string {
  const year = new Date().getFullYear();
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:${PAPER};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
<div style="display:none;font-size:1px;color:${PAPER};max-height:0;overflow:hidden;opacity:0;">${esc(opts.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${PAPER};"><tr><td align="center" style="padding:36px 14px;">
<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;">

  <!-- Card -->
  <tr><td style="background:${CARD};border:1px solid ${LINE};border-radius:14px;overflow:hidden;">
    <!-- Accent bar -->
    <div style="height:5px;background:${ACCENT};font-size:0;line-height:0;">&nbsp;</div>
    <!-- Logo header -->
    <div style="padding:30px 40px 24px;border-bottom:1px solid ${LINE};">
      <img src="${LOGO}" width="132" alt="Savo Technologies" style="display:block;width:132px;height:auto;border:0;">
    </div>
    <!-- Body -->
    <div style="padding:34px 40px 38px;">
      ${opts.eyebrowText ? eyebrow(opts.eyebrowText) : ""}
      ${opts.heading ? h1(opts.heading) : ""}
      ${opts.bodyHtml}
      ${opts.cta ? CTA(opts.cta.href, opts.cta.label, opts.cta.sub) : ""}
      ${SIGN}
    </div>
  </td></tr>

  <!-- Footer -->
  <tr><td style="padding:26px 12px 8px;text-align:center;">
    <p style="margin:0 0 10px;font-size:12.5px;font-weight:600;color:${INK};">
      ${a(site("/"), "savotechnologies.com")}<span style="color:${LINE};margin:0 9px;">·</span>${a("https://www.linkedin.com/company/savotechnologies/", "LinkedIn")}<span style="color:${LINE};margin:0 9px;">·</span>${a("https://www.instagram.com/savotechnologies/", "Instagram")}<span style="color:${LINE};margin:0 9px;">·</span>${a("https://www.facebook.com/savotechnologies", "Facebook")}<span style="color:${LINE};margin:0 9px;">·</span>${a("https://www.youtube.com/@savotechnologies", "YouTube")}
    </p>
    <p style="margin:0 0 10px;font-size:12px;color:${MUTED};">
      <a href="mailto:hello@savotechnologies.com" style="color:${MUTED};text-decoration:none;">hello@savotechnologies.com</a><span style="color:${LINE};margin:0 8px;">·</span><a href="tel:+917502901234" style="color:${MUTED};text-decoration:none;">+91 75029 01234</a><span style="color:${LINE};margin:0 8px;">·</span><a href="https://wa.me/917502901234" style="color:${MUTED};text-decoration:none;">WhatsApp</a>
    </p>
    <p style="margin:0 0 8px;font-size:11.5px;line-height:1.6;color:${FAINT};">
      © ${year} ${esc(SITE.legalName)} · Indore, India · Zürich, Switzerland
      ${opts.reason ? `<br>${esc(opts.reason)}` : ""}
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
    subject: "We got your brief — Savo Technologies",
    html: shell({
      preheader: `Your ${projectType} enquiry is with our engineers. A senior consultant replies within one business day.`,
      eyebrowText: `Enquiry received · ${projectType}`,
      heading: `Thanks, ${fn(name)} — your brief is in.`,
      bodyHtml: [
        lead(`It is with our engineers, not a sales queue. A senior consultant reads it and replies personally <strong>within one business day</strong>.`),
        steps([
          ["An engineer reads your brief", "Today — we check scope, stack and fit before anything else."],
          ["A senior consultant replies", "Within one business day, with initial thoughts and the right questions."],
          ["First call: scope, timeline, budget", "30 focused minutes. You leave with a clear picture and a written follow-up."],
        ], { accentFirst: true }),
        highlight(`Speed things up: share your <strong>ideal launch date</strong> and a <strong>budget range</strong> — the first call becomes concrete instead of exploratory.`),
      ].join(""),
      cta: { href: site("/#start"), label: "Book the call now", sub: "Skip the wait — pick a slot while we prepare your reply." },
      reason: "You are receiving this because you sent an enquiry through savotechnologies.com.",
      unsubscribeEmail: to,
    }),
    text: `THANKS, ${fn(name).toUpperCase()} — YOUR BRIEF IS IN\n\nYour ${projectType} enquiry is with our engineers. A senior consultant replies personally within one business day.\n\n1. An engineer reads your brief — today.\n2. A senior consultant replies — within one business day.\n3. First call: scope, timeline, budget.\n\nBook the call now: ${site("/#start")}\n\n— The Savo team\n${site("/")}`,
  };
}

/** Footer callback request. */
export function callbackAck(name: string, country: string, to?: string): MailTemplate {
  return {
    subject: "We will call you back — Savo Technologies",
    html: shell({
      preheader: "Your callback is logged. A Savo engineer calls during your local business hours.",
      eyebrowText: "Callback confirmed",
      heading: `${fn(name)}, your callback is logged.`,
      bodyHtml: [
        lead(`A Savo engineer will call your <strong>${esc(country)} number</strong> during your local business hours.`),
        steps([
          ["Watch your phone", "The call comes from +91 75029 01234 — save it so nothing gets filtered."],
          ["Bring context", "Two minutes on where the project stands saves a day later."],
          ["Urgent? WhatsApp us", "A human answers, usually within the hour."],
        ], { accentFirst: true }),
      ].join(""),
      cta: { href: "https://wa.me/917502901234", label: "WhatsApp us meanwhile", sub: "Skip the queue for anything urgent." },
      reason: "You are receiving this because you requested a callback on savotechnologies.com.",
      unsubscribeEmail: to,
    }),
    text: `${fn(name).toUpperCase()}, YOUR CALLBACK IS LOGGED\n\nA Savo engineer will call your ${country} number during your local business hours. The call comes from +91 75029 01234.\n\nUrgent? WhatsApp us: https://wa.me/917502901234\n\n— The Savo team\n${site("/")}`,
  };
}

/** Ask Savo handoff — question the assistant could not answer. */
export function askSavoHandoffAck(question: string, to?: string): MailTemplate {
  return {
    subject: "Your question is with a Savo engineer",
    html: shell({
      preheader: "The assistant does not guess — your question went to a senior consultant, who replies within one business day.",
      eyebrowText: "Assistant handoff",
      heading: "Your question reached the team.",
      bodyHtml: [
        lead(`The Savo Assistant never guesses. Yours went straight to a senior consultant, who replies <strong>within one business day</strong>.`),
        quote(question),
        p(`Need it faster, or prefer a conversation? Book a call — the first one is free and engineers take it, not sales.`, true),
      ].join(""),
      cta: { href: site("/#start"), label: "Book a call instead" },
      reason: "You are receiving this because you asked the Savo Assistant a question it could not answer.",
      unsubscribeEmail: to,
    }),
    text: `YOUR QUESTION REACHED THE TEAM\n\nThe assistant never guesses — your question went to a senior consultant, who replies within one business day.\n\n"${question}"\n\nBook a call: ${site("/#start")}\n\n— The Savo team\n${site("/")}`,
  };
}

/** Careers application received. */
export function applicationAck(name: string, role: string): MailTemplate {
  return {
    subject: `Application received — ${role} · Savo Technologies`,
    html: shell({
      preheader: "An engineer reads every application and replies personally within two business days.",
      eyebrowText: `Application · ${role}`,
      heading: `${fn(name)}, your application is in.`,
      bodyHtml: [
        lead(`No ATS black hole: <strong>an engineer reads every application</strong> and replies personally within two business days.`),
        steps([
          ["Engineer review", "Within two business days — a real read, not a keyword scan."],
          ["Technical conversation", "Your work, our stack, mutual expectations."],
          ["Paid pairing session", "A real problem, real compensation, both sides evaluating."],
          ["Written offer", "Four steps total. No puzzles, no ghosting."],
        ], { accentFirst: true }),
      ].join(""),
      cta: { href: site("/careers"), label: "See how we hire", sub: "The full process, salaries and remote policy — all public." },
      reason: "You are receiving this because you applied to Savo Technologies.",
    }),
    text: `${fn(name).toUpperCase()}, YOUR APPLICATION IS IN\n\nYou applied for ${role}. An engineer reads every application and replies personally within two business days.\n\n1. Engineer review — within two business days\n2. Technical conversation\n3. Paid pairing session\n4. Written offer\n\nHow we hire: ${site("/careers")}\n\n— The Savo team\n${site("/")}`,
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
      heading: `${fn(name)}, your project portal is ready.`,
      bodyHtml: [
        lead(`Your project dashboard is live. Everything about your engagement with Savo, in one place:`),
        spec([
          ["Portal", "savotechnologies.com/portal"],
          ["Your email", email],
          ["Password", password],
        ]),
        steps([
          ["Progress & milestones", "What is done, what is next, what is due — with dates."],
          ["Delivery updates", "Every log entry from the team, the moment it is posted."],
          ["Invoices & receipts", "Issued, paid, and downloadable — accounts-ready."],
        ], { accentFirst: true }),
        p(`<span style="font-size:12.5px;color:${MUTED};">Your password is stored hashed and was generated for you — share it privately. Your project lead can reset it anytime.</span>`, true),
      ].join(""),
      cta: { href: site("/portal"), label: "Open your portal" },
      reason: "You are receiving this because a Savo project lead created a portal account for you.",
    }),
    text: `${fn(name).toUpperCase()}, YOUR PORTAL IS READY\n\nPortal: ${site("/portal")}\nEmail: ${email}\nPassword: ${password}\n\nInside: progress & milestones, delivery updates, invoices & receipts.\n\n— The Savo team`,
  };
}

/** Admin reset a client's portal password. */
export function clientPasswordReset(name: string, password: string): MailTemplate {
  return {
    subject: "Your Savo portal password was reset",
    html: shell({
      preheader: "A new password was generated; previous sessions were signed out.",
      eyebrowText: "Password reset",
      heading: "Your portal password was reset.",
      bodyHtml: [
        p(`${esc(fn(name))}, a Savo project lead reset your password. All previous sessions were signed out automatically.`),
        spec([["New password", password]]),
        highlight(`Expecting this? Nothing to do. <strong>Not expecting it?</strong> Reply to this email immediately — a human reads it.`),
      ].join(""),
      cta: { href: site("/portal"), label: "Sign in" },
      reason: "You are receiving this because your portal account password was reset.",
    }),
    text: `YOUR PORTAL PASSWORD WAS RESET\n\nNew password: ${password}\nPrevious sessions were signed out.\n\nSign in: ${site("/portal")}\nNot expecting this? Reply immediately.`,
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
      eyebrowText: `Invoice · ${number}`,
      heading: "A new invoice is ready.",
      bodyHtml: [
        spec([
          ["Amount", money(amount, currency)],
          ["Issued", fmtDate(new Date())],
          ["Due", dueDate ? fmtDate(dueDate) : "On receipt"],
          ["Status", "Awaiting payment"],
        ], { big: 0 }),
        p(`The invoice, its status and your payment history live in the portal — the same place as your project progress.`, true),
      ].join(""),
      cta: { href: site("/portal"), label: "View invoice", sub: "Download the PDF-ready view from your dashboard." },
      reason: "You are receiving this because a Savo invoice was issued to your account.",
    }),
    text: `INVOICE ${number}\n\nAmount: ${money(amount, currency)}\nIssued: ${fmtDate(new Date())}\nDue: ${dueDate ? fmtDate(dueDate) : "On receipt"}\n\nView: ${site("/portal")}`,
  };
}

/** Invoice marked paid — receipt. */
export function invoicePaid(clientName: string, number: string, amount: number, currency: string): MailTemplate {
  return {
    subject: `Receipt — invoice ${number} paid · ${money(amount, currency)}`,
    html: shell({
      preheader: "Payment received in full. Thank you.",
      eyebrowText: `Payment received · ${number}`,
      heading: "Paid in full — thank you.",
      bodyHtml: [
        spec([
          ["Amount", money(amount, currency)],
          ["Invoice", number],
          ["Received", fmtDate(new Date())],
          ["Status", "Paid in full"],
        ], { big: 0 }),
        p(`Receipts stay in your portal whenever accounts need them. The next milestone keeps moving.`, true),
      ].join(""),
      cta: { href: site("/portal"), label: "Open the portal" },
      reason: "You are receiving this because an invoice on your account was paid.",
    }),
    text: `PAID IN FULL — THANK YOU\n\n${number} · ${money(amount, currency)} · Received ${fmtDate(new Date())}\n\n${site("/portal")}`,
  };
}

/** Invoice flagged overdue. */
export function invoiceOverdue(clientName: string, number: string, amount: number, currency: string, daysLate: number): MailTemplate {
  return {
    subject: `Reminder — invoice ${number} is past due`,
    html: shell({
      preheader: `Invoice ${number} is ${daysLate} day${daysLate === 1 ? "" : "s"} past its due date.`,
      eyebrowText: `Past due · ${number}`,
      heading: "A gentle nudge on an open invoice.",
      bodyHtml: [
        spec([
          ["Amount", money(amount, currency)],
          ["Past due by", `${daysLate} day${daysLate === 1 ? "" : "s"}`],
          ["Status", "Overdue"],
        ], { big: 0 }),
        p(`If the payment is already on its way, ignore this note with our thanks. If something needs discussing — scope, timing, anything — reply here. A human reads it, and we would rather talk than chase.`, true),
      ].join(""),
      cta: { href: site("/portal"), label: "View invoice" },
      reason: "You are receiving this because an invoice on your account passed its due date.",
    }),
    text: `REMINDER — INVOICE ${number} PAST DUE\n\n${money(amount, currency)} · ${daysLate} day(s) over\n\nAlready paid? Our thanks. Need to talk? Reply here.\n${site("/portal")}`,
  };
}

/** Milestone changed status (started / completed). */
export function milestoneUpdate(clientName: string, projectTitle: string, milestoneTitle: string, status: string): MailTemplate {
  const label = status === "done" ? "completed" : status === "in_progress" ? "started" : status;
  return {
    subject: `Milestone ${label}: ${milestoneTitle}`,
    html: shell({
      preheader: `"${milestoneTitle}" is now ${label} on ${projectTitle}.`,
      eyebrowText: `Milestone ${label} · ${projectTitle}`,
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
      reason: "You are receiving this because a milestone changed on your project.",
    }),
    text: `MILESTONE ${label.toUpperCase()}\n\nProject: ${projectTitle}\nMilestone: ${milestoneTitle}\n\n${site("/portal")}`,
  };
}

/** A delivery-log update was posted to a project. */
export function projectUpdate(clientName: string, projectTitle: string, title: string, body: string): MailTemplate {
  return {
    subject: `Project update: ${title}`,
    html: shell({
      preheader: body ? body.slice(0, 110) : `A new update on ${projectTitle}.`,
      eyebrowText: `Project update · ${projectTitle}`,
      heading: esc(title),
      bodyHtml: [
        body ? `<div style="font-size:15px;line-height:1.7;color:${INK};white-space:pre-line;">${esc(body)}</div>` : "",
      ].join(""),
      cta: { href: site("/portal"), label: "See the full timeline", sub: "Every update, milestone and invoice in one place." },
      reason: "You are receiving this because your project team posted a delivery update.",
    }),
    text: `PROJECT UPDATE · ${title}\n\n${body}\n\n${site("/portal")}`,
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
      eyebrowText: `New enquiry · ${d.source}`,
      heading: `${esc(d.name)} — ${esc(d.projectType)}`,
      bodyHtml: [
        spec([
          ["Name", d.name],
          ["Email", d.email ?? "—"],
          ["Phone", d.phone ?? "—"],
          ["Type", d.projectType],
          ["Budget", d.budget ?? "—"],
          ["Source", d.source],
        ]),
        rule(),
        `<div style="font-size:15px;line-height:1.65;color:${INK};white-space:pre-line;">${esc(d.message)}</div>`,
        rule(),
        highlight(`<strong>The site promised a reply within one business day.</strong> The enquiry sits in the inbox until someone moves it.`),
      ].join(""),
      cta: { href: site("/admin/enquiries"), label: "Open the inbox" },
      reason: "Internal team notification.",
    }),
    text: `NEW ENQUIRY (${d.source})\n\n${d.name} · ${d.email ?? "no email"} · ${d.phone ?? "no phone"}\nType: ${d.projectType}\nBudget: ${d.budget ?? "—"}\n\n${d.message}\n\nReply promised within one business day.\n${site("/admin/enquiries")}`,
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
      eyebrowText: `New application · ${d.role}`,
      heading: `${esc(d.name)} applied`,
      bodyHtml: [
        spec([
          ["Name", d.name],
          ["Email", d.email],
          ["Role", d.role],
          ["Experience", d.experience],
          ["Links", d.links],
        ]),
        rule(),
        `<div style="font-size:15px;line-height:1.65;color:${INK};white-space:pre-line;">${esc(d.message)}</div>`,
        rule(),
        highlight(`<strong>Candidates are told an engineer replies within two business days.</strong> Own it in the inbox.`),
      ].join(""),
      cta: { href: site("/admin/enquiries"), label: "Open the inbox" },
      reason: "Internal HR notification.",
    }),
    text: `NEW APPLICATION\n\n${d.name} · ${d.email}\nRole: ${d.role}\nExperience: ${d.experience ?? "—"}\nLinks: ${d.links ?? "—"}\n\n${d.message}\n\nPersonal reply promised within two business days.\n${site("/admin/enquiries")}`,
  };
}

/** Internal: callback requested (phone, country). */
export function teamCallback(d: { name: string; phone: string; country: string; note?: string }): MailTemplate {
  return {
    subject: `Callback request: ${d.name} (${d.country})`,
    html: shell({
      preheader: `Call ${d.name} on the ${d.country} number — during their local business hours.`,
      eyebrowText: "Callback requested",
      heading: `${esc(d.name)} asked for a call`,
      bodyHtml: [
        spec([
          ["Phone", d.phone],
          ["Country", d.country],
          ["Note", d.note ?? "—"],
        ]),
        p(`The site told them the call comes <strong>during their local business hours</strong>, from +91 75029 01234.`, true),
      ].join(""),
      cta: { href: site("/admin/enquiries?type=Callback"), label: "Open callbacks" },
      reason: "Internal team notification.",
    }),
    text: `CALLBACK REQUESTED\n\n${d.name} · ${d.phone} (${d.country})\n${d.note ?? ""}\n\nCall during their local business hours.\n${site("/admin/enquiries?type=Callback")}`,
  };
}

/** Internal: Ask Savo handoff (unanswered question + email). */
export function teamAskSavo(d: { email: string; question: string }): MailTemplate {
  return {
    subject: "Ask Savo handoff — question needs an answer",
    html: shell({
      preheader: "The visitor was promised a reply within one business day. The clock is running.",
      eyebrowText: "Assistant handoff",
      heading: "A question the assistant could not answer",
      bodyHtml: [
        spec([["Visitor", d.email]]),
        quote(d.question),
        highlight(`<strong>Promise made on the site: a reply within one business day.</strong> The visitor has been told exactly that.`),
      ].join(""),
      cta: { href: site("/admin/enquiries"), label: "Answer it now" },
      reason: "Internal team notification.",
    }),
    text: `ASSISTANT HANDOFF\n\nVisitor: ${d.email}\n\n"${d.question}"\n\nReply within one business day — promise made.\n${site("/admin/enquiries")}`,
  };
}
