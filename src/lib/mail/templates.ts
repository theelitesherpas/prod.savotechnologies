/**
 * Transactional email templates — every automated action on the site.
 *
 * Design: the site's document world translated for email clients — warm
 * paper background, white card, ink text, vermilion accent, hairline
 * rules. Inline styles only (email clients strip <style>); table layout,
 * 560px; system font stack (web fonts are unreliable in email).
 *
 * Every template returns { subject, html, text }. `text` is the
 * accessibility/fallback plain version — always kept in sync by hand.
 * No fabricated claims: promises in these emails mirror the exact copy
 * on the website (reply windows, what happens next).
 */

import { SITE } from "@/constants/site";

const PAPER = "#f5f4f0";
const INK = "#14161c";
const MUTED = "#5c6168";
const ACCENT = "#d9480f";
const LINE = "#e4e2dc";

export type MailTemplate = { subject: string; html: string; text: string };

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Brand shell shared by every template. */
function shell(opts: {
  preheader: string;
  heading: string;
  bodyHtml: string;
  cta?: { href: string; label: string };
  footnote?: string;
}): string {
  return `<!doctype html><html><body style="margin:0;padding:0;background:${PAPER};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${PAPER};padding:32px 16px;"><tr><td align="center">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
  <tr><td style="padding:0 4px 16px;">
    <span style="font-size:15px;font-weight:800;letter-spacing:-0.02em;color:${INK};">${esc(SITE.name)}</span>
    <span style="color:${LINE};margin:0 8px;">·</span>
    <span style="font-size:12px;color:${MUTED};">${esc(SITE.tagline)}</span>
  </td></tr>
  <tr><td style="background:#ffffff;border:1px solid ${LINE};border-radius:8px;padding:36px 36px 32px;">
    <div style="display:none;font-size:1px;color:#ffffff;max-height:0;overflow:hidden;">${esc(opts.preheader)}</div>
    <div style="width:28px;height:3px;background:${ACCENT};margin-bottom:20px;"></div>
    <h1 style="margin:0 0 18px;font-size:22px;line-height:1.3;letter-spacing:-0.02em;color:${INK};font-weight:800;">${esc(opts.heading)}</h1>
    <div style="font-size:15px;line-height:1.65;color:${INK};">${opts.bodyHtml}</div>
    ${opts.cta ? `<div style="margin-top:28px;"><a href="${opts.cta.href}" style="display:inline-block;background:${INK};color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:12px 24px;border-radius:6px;">${esc(opts.cta.label)}</a></div>` : ""}
    ${opts.footnote ? `<p style="margin:24px 0 0;font-size:12.5px;line-height:1.6;color:${MUTED};border-top:1px solid ${LINE};padding-top:16px;">${opts.footnote}</p>` : ""}
  </td></tr>
  <tr><td style="padding:20px 4px 0;font-size:11.5px;line-height:1.6;color:${MUTED};">
    ${esc(SITE.legalName)} · Indore, India · Zürich, Switzerland<br>
    <a href="https://savotechnologies.com" style="color:${MUTED};">savotechnologies.com</a>
  </td></tr>
</table>
</td></tr></table></body></html>`;
}

const p = (s: string) => `<p style="margin:0 0 14px;">${s}</p>`;
const strong = (s: string) => `<strong style="color:${INK};">${esc(s)}</strong>`;
const rule = () => `<div style="border-top:1px solid ${LINE};margin:20px 0;"></div>`;

function detailRows(rows: [string, string | undefined][]): string {
  const items = rows.filter(([, v]) => v !== undefined && v !== "") as [string, string][];
  if (!items.length) return "";
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:4px 0 18px;font-size:14px;">${items
    .map(
      ([k, v]) =>
        `<tr><td style="padding:5px 16px 5px 0;color:${MUTED};white-space:nowrap;vertical-align:top;">${esc(k)}</td><td style="padding:5px 0;color:${INK};font-weight:600;">${esc(v)}</td></tr>`,
    )
    .join("")}</table>`;
}

const site = (path = "/") => `https://savotechnologies.com${path}`;
const SIGN_SOFT = "— the Savo team";

/* ══════════════ PUBLIC SITE · CLIENT ACKNOWLEDGEMENTS ══════════════ */

/** Enquiry drawer / contact form / start-page brief received. */
export function enquiryAck(name: string, projectType: string): MailTemplate {
  return {
    subject: "We got your brief — Savo Technologies",
    html: shell({
      preheader: `Your ${projectType} enquiry is with the team. A senior consultant replies within one business day.`,
      heading: `Thanks, ${name.split(" ")[0]} — we got your brief.`,
      bodyHtml: [
        p(
          `Your <strong style="color:${INK};">${esc(projectType)}</strong> enquiry is with our engineers — not a sales queue. A senior consultant reads it and replies personally <strong style="color:${INK};">within one business day</strong>.`,
        ),
        p("Meanwhile, two things that speed things up:"),
        p(`· Think about your ideal launch date — we plan backwards from it.<br>· If you have a budget range in mind, sharing it keeps the first call concrete.`),
      ].join(""),
      cta: { href: site("/#start"), label: "Book a call now" },
      footnote: "You are receiving this because you sent an enquiry through savotechnologies.com.",
    }),
    text: `Thanks, ${name.split(" ")[0]} — we got your brief.\n\nYour ${projectType} enquiry is with our engineers. A senior consultant replies personally within one business day.\n\nBook a call: ${site("/#start")}\n${SIGN_SOFT}`,
  };
}

/** Footer callback request. */
export function callbackAck(name: string, country: string): MailTemplate {
  return {
    subject: "We will call you back — Savo Technologies",
    html: shell({
      preheader: "Your callback request is logged. Expect a call from a Savo engineer.",
      heading: `${name.split(" ")[0]}, your callback is logged.`,
      bodyHtml: p(
        `A Savo engineer will call the ${strong(country)} number you left, during your local business hours. If anything urgent comes up before that, WhatsApp us — a human answers.`,
      ),
      footnote: "You are receiving this because you requested a callback on savotechnologies.com.",
    }),
    text: `${name.split(" ")[0]}, your callback is logged.\n\nA Savo engineer will call the ${country} number you left, during your local business hours.\n${SIGN_SOFT}`,
  };
}

/** Ask Savo handoff — question the assistant could not answer. */
export function askSavoHandoffAck(question: string): MailTemplate {
  return {
    subject: "Your question is with a Savo engineer",
    html: shell({
      preheader: "The assistant logged your question; a senior consultant replies within one business day.",
      heading: "Your question reached the team.",
      bodyHtml: [
        p("The Savo Assistant does not guess — so your question went straight to a senior consultant, who replies <strong>within one business day</strong>."),
        `<div style="border-left:3px solid ${ACCENT};padding:10px 14px;margin:0 0 14px;background:${PAPER};font-size:14px;color:${INK};">${esc(question)}</div>`,
      ].join(""),
      footnote: "You are receiving this because you asked the Savo Assistant a question it could not answer.",
    }),
    text: `Your question reached the team.\n\nThe assistant does not guess — your question went to a senior consultant, who replies within one business day.\n\n"${question}"\n${SIGN_SOFT}`,
  };
}

/** Careers application received. */
export function applicationAck(name: string, role: string): MailTemplate {
  return {
    subject: `Application received — ${role} · Savo Technologies`,
    html: shell({
      preheader: "An engineer reads every application and replies personally within two business days.",
      heading: `${name.split(" ")[0]}, your application is in.`,
      bodyHtml: [
        p(`You applied for <strong style="color:${INK};">${esc(role)}</strong>. No ATS black hole here: <strong style="color:${INK};">an engineer reads every application</strong> and replies personally within two business days.`),
        p("What our process looks like from here: a technical conversation, then a paid pairing session, then a written offer. Four steps, no puzzles."),
      ].join(""),
      footnote: "You are receiving this because you applied to Savo Technologies.",
    }),
    text: `${name.split(" ")[0]}, your application is in.\n\nYou applied for ${role}. An engineer reads every application and replies personally within two business days.\n${SIGN_SOFT}`,
  };
}

/* ══════════════ CLIENT PORTAL ══════════════ */

/** Admin created a portal account for a client. */
export function clientWelcome(name: string, email: string, password: string): MailTemplate {
  return {
    subject: "Your Savo client portal is ready",
    html: shell({
      preheader: "Track your project, milestones and invoices in one place.",
      heading: `${name.split(" ")[0]}, your client portal is ready.`,
      bodyHtml: [
        p("Your project dashboard is live — progress, milestones, delivery updates and invoices, always current."),
        detailRows([
          ["Portal", "savotechnologies.com/portal"],
          ["Email", email],
          ["Password", password],
        ]),
        p(`<span style="font-size:13px;color:${MUTED};">Share this password privately; it is stored hashed and admins can reset it anytime.</span>`),
      ].join(""),
      cta: { href: site("/portal"), label: "Open the portal" },
      footnote: "You are receiving this because a Savo project lead created a portal account for you.",
    }),
    text: `${name.split(" ")[0]}, your client portal is ready.\n\nPortal: ${site("/portal")}\nEmail: ${email}\nPassword: ${password}\n\nProgress, milestones, delivery updates and invoices — always current.\n${SIGN_SOFT}`,
  };
}

/** Admin reset a client's portal password. */
export function clientPasswordReset(name: string, password: string): MailTemplate {
  return {
    subject: "Your Savo portal password was reset",
    html: shell({
      preheader: "A new password was generated for your client portal.",
      heading: "Your portal password was reset.",
      bodyHtml: [
        p(`${esc(name.split(" ")[0])}, a Savo project lead reset your portal password. Your previous sessions were signed out.`),
        detailRows([["New password", password]]),
      ].join(""),
      cta: { href: site("/portal"), label: "Sign in" },
      footnote: "If you did not expect this, reply to this email immediately.",
    }),
    text: `Your portal password was reset.\n\nNew password: ${password}\nSign in: ${site("/portal")}\nPrevious sessions were signed out.`,
  };
}

function money(minor: number, currency = "INR") {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 0 }).format(minor / 100);
}

/** Invoice issued to a client. */
export function invoiceIssued(clientName: string, number: string, amount: number, currency: string, dueDate: Date | null): MailTemplate {
  return {
    subject: `Invoice ${number} · ${money(amount, currency)}`,
    html: shell({
      preheader: `Invoice ${number} is now available in your portal.`,
      heading: `Invoice ${number}`,
      bodyHtml: [
        detailRows([
          ["Amount", money(amount, currency)],
          ["Due", dueDate ? dueDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "on receipt"],
        ]),
        p("The invoice and its status live in your portal — the same place as your project progress."),
      ].join(""),
      cta: { href: site("/portal"), label: "View invoice" },
      footnote: "You are receiving this because a Savo invoice was issued to your account.",
    }),
    text: `Invoice ${number}\n\nAmount: ${money(amount, currency)}\nDue: ${dueDate ? dueDate.toLocaleDateString("en-IN") : "on receipt"}\nView: ${site("/portal")}`,
  };
}

/** Invoice marked paid — receipt. */
export function invoicePaid(clientName: string, number: string, amount: number, currency: string): MailTemplate {
  return {
    subject: `Receipt — invoice ${number} paid · ${money(amount, currency)}`,
    html: shell({
      preheader: "Payment received. Thank you.",
      heading: "Payment received — thank you.",
      bodyHtml: [
        detailRows([
          ["Invoice", number],
          ["Amount", money(amount, currency)],
          ["Status", "Paid in full"],
        ]),
        p("The next milestone keeps moving. Receipts stay in your portal whenever you need them for accounts."),
      ].join(""),
      cta: { href: site("/portal"), label: "Open the portal" },
    }),
    text: `Payment received — thank you.\n\nInvoice ${number} · ${money(amount, currency)} · Paid in full.\n${site("/portal")}`,
  };
}

/** Invoice flagged overdue. */
export function invoiceOverdue(clientName: string, number: string, amount: number, currency: string, daysLate: number): MailTemplate {
  return {
    subject: `Reminder — invoice ${number} is past due`,
    html: shell({
      preheader: `Invoice ${number} is ${daysLate} day${daysLate === 1 ? "" : "s"} past its due date.`,
      heading: "A gentle nudge on an open invoice.",
      bodyHtml: [
        detailRows([
          ["Invoice", number],
          ["Amount", money(amount, currency)],
          ["Past due by", `${daysLate} day${daysLate === 1 ? "" : "s"}`],
        ]),
        p("If the payment is already on its way, ignore this note with our thanks. If something needs discussing, reply here — a human reads it."),
      ].join(""),
      cta: { href: site("/portal"), label: "View invoice" },
    }),
    text: `A gentle nudge on an open invoice.\n\nInvoice ${number} · ${money(amount, currency)} · ${daysLate} day(s) past due.\n${site("/portal")}`,
  };
}

/** Milestone changed status (started / completed). */
export function milestoneUpdate(clientName: string, projectTitle: string, milestoneTitle: string, status: string): MailTemplate {
  const label = status === "done" ? "completed" : status === "in_progress" ? "started" : status;
  return {
    subject: `Milestone ${label}: ${milestoneTitle}`,
    html: shell({
      preheader: `"${milestoneTitle}" is now ${label} on ${projectTitle}.`,
      heading: `Milestone ${label === "started" ? "started" : "completed"}.`,
      bodyHtml: [
        detailRows([
          ["Project", projectTitle],
          ["Milestone", milestoneTitle],
          ["Status", label],
        ]),
        p("Your dashboard timeline shows every step with dates."),
      ].join(""),
      cta: { href: site("/portal"), label: "Open the timeline" },
    }),
    text: `Milestone ${label}.\n\nProject: ${projectTitle}\nMilestone: ${milestoneTitle}\n${site("/portal")}`,
  };
}

/** A delivery-log update was posted to a project. */
export function projectUpdate(clientName: string, projectTitle: string, title: string, body: string): MailTemplate {
  return {
    subject: `Project update: ${title}`,
    html: shell({
      preheader: body ? body.slice(0, 90) : `A new update on ${projectTitle}.`,
      heading: esc(title),
      bodyHtml: [
        detailRows([["Project", projectTitle]]),
        body ? `<div style="font-size:14.5px;line-height:1.65;color:${INK};white-space:pre-line;">${esc(body)}</div>` : "",
      ].join(""),
      cta: { href: site("/portal"), label: "See the full timeline" },
    }),
    text: `Project update: ${title}\n\nProject: ${projectTitle}\n\n${body}\n${site("/portal")}`,
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
      preheader: `${d.name} · ${d.projectType}${d.budget ? ` · ${d.budget}` : ""}`,
      heading: "New enquiry",
      bodyHtml: [
        detailRows([
          ["Name", d.name],
          ["Email", d.email ?? "—"],
          ["Phone", d.phone ?? "—"],
          ["Type", d.projectType],
          ["Budget", d.budget ?? "—"],
          ["Source", d.source],
        ]),
        rule(),
        `<div style="font-size:14.5px;line-height:1.65;color:${INK};white-space:pre-line;">${esc(d.message)}</div>`,
      ].join(""),
      cta: { href: site("/admin/enquiries"), label: "Open the inbox" },
      footnote: "Internal notification — goes to the team inbox.",
    }),
    text: `New enquiry (${d.source})\n\n${d.name} · ${d.email ?? "no email"} · ${d.phone ?? "no phone"}\nType: ${d.projectType}\nBudget: ${d.budget ?? "—"}\n\n${d.message}\n\n${site("/admin/enquiries")}`,
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
      preheader: `${d.name} applied for ${d.role}.`,
      heading: "New job application",
      bodyHtml: [
        detailRows([
          ["Name", d.name],
          ["Email", d.email],
          ["Role", d.role],
          ["Experience", d.experience],
          ["Links", d.links],
        ]),
        rule(),
        `<div style="font-size:14.5px;line-height:1.65;color:${INK};white-space:pre-line;">${esc(d.message)}</div>`,
      ].join(""),
      cta: { href: site("/admin/enquiries"), label: "Open the inbox" },
      footnote: "Internal notification — careers applications go to HR.",
    }),
    text: `New application\n\n${d.name} · ${d.email}\nRole: ${d.role}\nExperience: ${d.experience ?? "—"}\nLinks: ${d.links ?? "—"}\n\n${d.message}\n\n${site("/admin/enquiries")}`,
  };
}

/** Internal: callback requested (phone, country). */
export function teamCallback(d: { name: string; phone: string; country: string; note?: string }): MailTemplate {
  return {
    subject: `Callback request: ${d.name} (${d.country})`,
    html: shell({
      preheader: `Call ${d.name} back on the ${d.country} number.`,
      heading: "Callback requested",
      bodyHtml: [
        detailRows([
          ["Name", d.name],
          ["Phone", d.phone],
          ["Country", d.country],
          ["Note", d.note],
        ]),
      ].join(""),
      cta: { href: site("/admin/enquiries?type=Callback"), label: "Open callbacks" },
      footnote: "Internal notification.",
    }),
    text: `Callback requested\n\n${d.name} · ${d.phone} (${d.country})\n${d.note ?? ""}\n\n${site("/admin/enquiries?type=Callback")}`,
  };
}

/** Internal: Ask Savo handoff (unanswered question + email). */
export function teamAskSavo(d: { email: string; question: string }): MailTemplate {
  return {
    subject: "Ask Savo handoff — question needs an answer",
    html: shell({
      preheader: "The assistant could not answer this; a consultant must reply within one business day.",
      heading: "Assistant handoff",
      bodyHtml: [
        detailRows([["Visitor email", d.email]]),
        `<div style="border-left:3px solid ${ACCENT};padding:10px 14px;margin:0 0 14px;background:${PAPER};font-size:14px;color:${INK};">${esc(d.question)}</div>`,
        p(`<span style="font-size:13px;color:${MUTED};">Promise on the site: a reply within one business day. The visitor was told so.</span>`),
      ].join(""),
      cta: { href: site("/admin/enquiries"), label: "Open the inbox" },
      footnote: "Internal notification.",
    }),
    text: `Assistant handoff\n\nVisitor: ${d.email}\n\n"${d.question}"\n\nReply within one business day. ${site("/admin/enquiries")}`,
  };
}
