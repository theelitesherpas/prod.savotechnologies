/** Transactional defaults: copy and variables are independent of the shared
 *  v7 correspondence design, which also wraps HR, meetings and overrides. */
import { invoicePaymentLink } from "@/lib/payment-links";
import {
  shell, lead, p, spec, highlight, prose, site, DISPLAY, SANS, MONO,
  escapeMailHtml as esc, MAIL_COLORS,
} from "@/lib/mail/design";
export {
  shell, lead, p, spec, highlight, prose, site, DISPLAY, SERIF, SANS, MONO,
  UNSUBSCRIBE_PLACEHOLDER,
} from "@/lib/mail/design";

const { ink: INK, muted: MUTED, faint: FAINT, accent: ACCENT, line: LINE, card: CARD } = MAIL_COLORS;

export type MailTemplate = {
  subject: string;
  html: string;
  text: string;
  /** Set for customer-facing mail: powers List-Unsubscribe headers. */
  unsubscribeEmail?: string;
};

/** Actual invoice/project context, without the old ornamental mono strip. */
const meta = (parts: string[]) =>
  `<p style="margin:18px 0;font-family:${SANS};font-size:12px;line-height:1.8;color:${FAINT};text-align:left;overflow-wrap:anywhere;">${parts.map(esc).join("&ensp;·&ensp;")}</p>`;

function quote(text: string): string {
  return highlight(`<span style="font-style:italic;">${esc(text).replace(/\r?\n/g, "<br>")}</span>`);
}

const fn = (name: string) => name.split(" ")[0];

/* ══════════════ PUBLIC SITE · CLIENT ACKNOWLEDGEMENTS ══════════════ */

/** Enquiry drawer / contact form / start-page brief received. */
export function enquiryAck(name: string, projectType: string, to?: string): MailTemplate {
  return {
    unsubscribeEmail: to,
    subject: "Enquiry received - Savo Technologies",
    html: shell({
      preheader: `Your ${projectType} enquiry is with our engineers. A senior consultant replies within one business day.`,
      eyebrowText: `Enquiry received`,
      heading: `Your enquiry has been received.`,
      bodyHtml: [
        lead(`Dear ${fn(name)},<br><br>Thank you for contacting Savo Technologies. This email confirms that your enquiry has been received and registered with our engineering team.`),
        spec([
          ["Enquiry type", projectType],
          ["Assigned to", "Engineering review"],
          ["Response time", "One business day"],
        ]),
        p(`Your enquiry is reviewed in detail before we respond. A senior consultant will contact you within one business day with initial feedback and recommended next steps for your project.`),
      ].join(""),
      cta: { href: site("/#start"), label: "Book the call now", sub: "Pick a slot while we prepare your reply." },
      closing: "Kind regards,",
      reason: "You are receiving this because you sent an enquiry through savotechnologies.com.",
      unsubscribeEmail: to,
    }),
    text: `THANKS, ${fn(name).toUpperCase()} - YOUR BRIEF IS IN\n\nYour ${projectType} enquiry is with our engineers. A senior consultant replies personally within one business day.\n\n1. An engineer reads your brief - today.\n2. A senior consultant writes back - within one business day.\n3. We talk: scope, timeline, budget.\n\nBook the call now: ${site("/#start")}\n\nTalk soon,\nThe Savo team\n${site("/")}`,
  };
}

/** Footer callback request. */
export function callbackAck(name: string, country: string, to?: string): MailTemplate {
  return {
    unsubscribeEmail: to,
    subject: "We will call you back - Savo Technologies",
    html: shell({
      preheader: "Your callback is logged. A Savo engineer calls during your local business hours.",
      eyebrowText: "Callback confirmed",
      heading: `Your callback request has been received.`,
      bodyHtml: [
        lead(`Dear ${fn(name)},<br><br>This email confirms your callback request. A member of our team will call the ${esc(country)} number you provided.`),
        spec([
          ["Calling from", "+91 75029 01234"],
          ["Scheduled", "Local business hours"],
          ["Region", country],
        ]),
        p(`Please keep any project context at hand for the discussion. For urgent matters before the call, our team is reachable immediately on WhatsApp.`, true),
      ].join(""),
      cta: { href: "https://wa.me/917502901234", label: "WhatsApp us meanwhile" },
      closing: "Kind regards,",
      reason: "You are receiving this because you requested a callback on savotechnologies.com.",
      unsubscribeEmail: to,
    }),
    text: `${fn(name).toUpperCase()}, YOUR CALLBACK IS LOGGED\n\nA Savo engineer will call your ${country} number during your local business hours. The call comes from +91 75029 01234.\n\nUrgent? WhatsApp: https://wa.me/917502901234\n\nUntil the call,\nThe Savo team`,
  };
}

/** Ask Savo handoff - question the assistant could not answer. */
export function askSavoHandoffAck(question: string, to?: string): MailTemplate {
  return {
    unsubscribeEmail: to,
    subject: "Your question is with a Savo engineer",
    html: shell({
      preheader: "The assistant does not guess - your question went to a senior consultant, who replies within one business day.",
      eyebrowText: "Assistant handoff",
      heading: "Your question has been forwarded.",
      bodyHtml: [
        lead(`Thank you for using the Savo Assistant. Your question has been forwarded to a senior consultant.`),
        quote(question),
        p(`A considered response will follow <strong>within one business day</strong>. For a detailed discussion, you are also welcome to schedule a consultation at a time that suits you.`, true),
      ].join(""),
      cta: { href: site("/#start"), label: "Book a call instead" },
      closing: "Kind regards,",
      reason: "You are receiving this because you asked the Savo Assistant a question it could not answer.",
      unsubscribeEmail: to,
    }),
    text: `YOUR QUESTION REACHED THE TEAM\n\nThe assistant never guesses - your question went to a senior consultant, who replies within one business day.\n\n"${question}"\n\nBook a call: ${site("/#start")}\n\nWith the answer soon,\nThe Savo team`,
  };
}

/** Careers application received. */
export function applicationAck(name: string, role: string): MailTemplate {
  return {
    subject: `Application received - ${role} · Savo Technologies`,
    html: shell({
      preheader: "Our hiring team reads every application and replies personally within two business days.",
      eyebrowText: `Application - ${role}`,
      heading: `Your application has been received.`,
      bodyHtml: [
        lead(`Dear ${fn(name)},<br><br>Thank you for your interest in joining Savo Technologies. This email confirms that your application has been received and registered with our hiring team.`),
        spec([
          ["Position", role],
          ["Status", "Under review"],
          ["Response", "Two business days"],
        ]),
        p(`Every application is reviewed individually by our hiring team. You will receive a personal response within two business days confirming the outcome and, where relevant, the next steps of our hiring process.`),
        p(`We appreciate the time you have invested in your application.`, true),
      ].join(""),
      cta: { href: site("/careers"), label: "View our hiring process", sub: "Our complete hiring process is published." },
      closing: "Kind regards,",
      dept: "hr",
      reason: "You are receiving this because you applied to Savo Technologies.",
    }),
    text: `${fn(name).toUpperCase()}, YOUR APPLICATION IS IN\n\nYou applied for ${role}. Our hiring team reads every application and replies personally within two business days.\n\n1. Application review - within two business days\n2. Technical conversation\n3. Meet the team\n4. Written offer\n\nHow we hire: ${site("/careers")}\n\nSpeak soon,\nThe Savo team`,
  };
}

/* ══════════════ CLIENT PORTAL ══════════════ */

/** Admin created a portal account for a client. */
export function clientWelcome(name: string, email: string, password: string, clientReference?: string): MailTemplate {
  return {
    subject: "Your Savo client portal is ready",
    html: shell({
      preheader: "Progress, milestones, delivery updates and invoices - always current, always yours.",
      eyebrowText: "Portal access",
      heading: `Your client portal is now active.`,
      bodyHtml: [
        lead(`Dear ${fn(name)},<br><br>Your client portal is now active. It provides a continuous, current view of your engagement with Savo Technologies - project progress, milestones, delivery updates from your team, and complete invoice records - in one place.`),
        spec([
          ["Portal", "savotechnologies.com/portal"],
          ["Client ID", clientReference],
          ["Registered email", email],
          ["Password", password],
        ]),
        p(`<span style="font-family:${SANS};font-size:12px;color:${MUTED};">Please keep your credentials confidential. Your project lead can renew access at any time should it be required.</span>`, true),
      ].join(""),
      cta: { href: site("/portal"), label: "Open your portal" },
      closing: "Kind regards,",
      reason: "You are receiving this because a Savo project lead created a portal account for you.",
    }),
    text: `${fn(name).toUpperCase()}, YOUR PORTAL IS READY\n\nPortal: ${site("/portal")}\n${clientReference ? `Client ID: ${clientReference}\n` : ""}Email: ${email}\nPassword: ${password}\n\nInside: progress & milestones, delivery updates, invoices & receipts.\n\nWelcome aboard,\nThe Savo team`,
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
  return new Intl.NumberFormat("en-IN", { style: "currency", currency, minimumFractionDigits: minor % 100 ? 2 : 0, maximumFractionDigits: 2 }).format(minor / 100);
}
const fmtDate = (d: Date) => d.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", year: "numeric" });

/** Invoice issued to a client. */
export function invoiceIssued(clientName: string, number: string, amount: number, currency: string, dueDate: Date | null, paymentLink?: string | null, invoiceStatus = "sent"): MailTemplate {
  const payment = invoicePaymentLink({ paymentLink, status: invoiceStatus, amount });
  return {
    subject: `Invoice ${number} · ${money(amount, currency)}`,
    html: shell({
      preheader: `Invoice ${number} is available in your portal${dueDate ? `, due ${fmtDate(dueDate)}` : ""}.`,
      eyebrowText: `Invoice ${number}`,
      heading: "Your invoice is ready.",
      bodyHtml: [
        lead(`Please find the details of your invoice below. The invoice and its current status are available in your client portal at any time.`),
        spec([["Amount", money(amount, currency)]], { big: 0 }),
        meta([`ISSUED ${fmtDate(new Date()).toUpperCase()}`, dueDate ? `DUE ${fmtDate(dueDate).toUpperCase()}` : "DUE ON RECEIPT", "AWAITING PAYMENT"]),
        p(`The invoice and its current status are available in your client portal, alongside your project records.`, true),
        payment ? p(`<a href="${site("/portal/invoices")}" style="color:#b82222;text-decoration:underline;">View or download your invoice in the portal</a>.`) : "",
      ].join(""),
      cta: payment ? { href: payment, label: "Pay now", sub: "Opens your payment provider. Payment status updates after confirmation by the Savo team." } : { href: site("/portal"), label: "View invoice", sub: "A PDF-ready view is available from your dashboard." },
      closing: "Kind regards,",
      reason: "You are receiving this because a Savo invoice was issued to your account.",
    }),
    text: `INVOICE ${number}\n\nAmount: ${money(amount, currency)}\nIssued: ${fmtDate(new Date())}\nDue: ${dueDate ? fmtDate(dueDate) : "On receipt"}\n\n${payment ? `Pay now: ${payment}\n\n` : ""}View: ${site("/portal")}\n\nWith thanks,\nThe Savo team`,
  };
}

/** Invoice marked paid - receipt. */
export function invoicePaid(clientName: string, number: string, amount: number, currency: string): MailTemplate {
  return {
    subject: `Receipt - invoice ${number} paid · ${money(amount, currency)}`,
    html: shell({
      preheader: "Payment received in full. Thank you.",
      eyebrowText: `Receipt - ${number}`,
      heading: "Payment received.",
      bodyHtml: [
        lead(`Thank you for your payment. This email confirms that the amount below has been received in full.`),
        spec([["Amount", money(amount, currency)]], { big: 0 }),
        meta([`INVOICE ${number.toUpperCase()}`, `RECEIVED ${fmtDate(new Date()).toUpperCase()}`, "PAID IN FULL"]),
        p(`Thank you for your payment. The receipt remains available in your client portal for your records.`, true),
      ].join(""),
      cta: { href: site("/portal"), label: "Open the portal" },
      closing: "Kind regards,",
      reason: "You are receiving this because an invoice on your account was paid.",
    }),
    text: `PAID IN FULL - THANK YOU\n\n${number} · ${money(amount, currency)} · Received ${fmtDate(new Date())}\n\n${site("/portal")}\n\nOnward,\nThe Savo team`,
  };
}

/** Invoice flagged overdue. */
export function invoiceOverdue(clientName: string, number: string, amount: number, currency: string, daysLate: number, paymentLink?: string | null, invoiceStatus = "overdue"): MailTemplate {
  const payment = invoicePaymentLink({ paymentLink, status: invoiceStatus, amount });
  return {
    subject: `Reminder - invoice ${number} is past due`,
    html: shell({
      preheader: `Invoice ${number} is ${daysLate} day${daysLate === 1 ? "" : "s"} past its due date.`,
      eyebrowText: `Past due - ${number}`,
      heading: "Payment overdue reminder.",
      bodyHtml: [
        lead(`This is a reminder that the invoice below has passed its due date.`),
        spec([
          ["Amount", money(amount, currency)],
          ["Past due by", `${daysLate} day${daysLate === 1 ? "" : "s"}`],
        ], { big: 0 }),
        p(`If payment has already been made, please disregard this notice with our thanks.`, true),
        payment ? p(`<a href="${site("/portal/invoices")}" style="color:#b82222;text-decoration:underline;">View or download your invoice in the portal</a>.`) : "",
      ].join(""),
      cta: payment ? { href: payment, label: "Pay now", sub: "Opens your payment provider. Payment status updates after confirmation by the Savo team." } : { href: site("/portal"), label: "View invoice" },
      closing: "Kind regards,",
      reason: "You are receiving this because an invoice on your account passed its due date.",
    }),
    text: `REMINDER - INVOICE ${number} PAST DUE\n\n${money(amount, currency)} · ${daysLate} day(s) over\n\nAlready paid? Our thanks.\n${payment ? `Pay now: ${payment}\n` : ""}${site("/portal")}\n\nEasily fixed,\nThe Savo team`,
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
        lead(`This is to inform you that the milestone below has been ${label} on your project.`),
        spec([
          ["Milestone", milestoneTitle],
          ["Project", projectTitle],
          ["Status", label.charAt(0).toUpperCase() + label.slice(1)],
        ]),
        p(`The complete milestone timeline remains available in your client portal.`, true),
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
        lead(`An update has been posted to your project by the delivery team.`),
        body ? prose(body) : "",
        meta([projectTitle.toUpperCase()]),
      ].join(""),
      cta: { href: site("/portal"), label: "See the full timeline", sub: "Every update, milestone and invoice in one place." },
      closing: "Kind regards,",
      reason: "You are receiving this because your project team posted a delivery update.",
    }),
    text: `PROJECT UPDATE - ${title}\n\n${body}\n\n${site("/portal")}\n\nMore as it lands,\nThe Savo team`,
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
  reference?: string;
}): MailTemplate {
  return {
    subject: `New ${d.source}: ${d.name} - ${d.projectType}`,
    html: shell({
      preheader: `${d.name} · ${d.projectType}${d.budget ? ` · ${d.budget}` : ""} · reply promised within one business day.`,
      eyebrowText: `New enquiry - ${d.source}`,
      heading: `${d.name} - ${d.projectType}`,
      bodyHtml: [
        spec([
          ["Lead ID", d.reference],
          ["Email", d.email ?? "-"],
          ["Phone", d.phone ?? "-"],
          ["Budget", d.budget ?? "-"],
        ]),
        prose(d.message),
        highlight(`<strong>Note:</strong> a response within one business day is committed on the website.`),
      ].join(""),
      cta: { href: site("/admin/enquiries"), label: "Open the inbox" },
      closing: "Regards,",
      reason: "Internal team notification.",
    }),
    text: `NEW ENQUIRY (${d.source})\n\n${d.reference ? `Lead ID: ${d.reference}\n` : ""}${d.name} · ${d.email ?? "no email"} · ${d.phone ?? "no phone"}\nType: ${d.projectType}\nBudget: ${d.budget ?? "-"}\n\n${d.message}\n\nReply promised within one business day.\n${site("/admin/enquiries")}\n\nOwn the promise,\nThe Savo team`,
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
    subject: `New application: ${d.role} - ${d.name}`,
    html: shell({
      preheader: `${d.name} applied for ${d.role}. Candidates are promised a personal reply within two business days.`,
      eyebrowText: `New application - ${d.role}`,
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
      dept: "hr",
      reason: "Internal HR notification.",
    }),
    text: `NEW APPLICATION\n\n${d.name} · ${d.email}\nRole: ${d.role}\nExperience: ${d.experience ?? "-"}\nLinks: ${d.links ?? "-"}\n\n${d.message}\n\nPersonal reply promised within two business days.\n${site("/admin/enquiries")}\n\nGood hiring,\nThe Savo team`,
  };
}

/** Internal: callback requested (phone, country). */
export function teamCallback(d: { name: string; phone: string; country: string; note?: string }): MailTemplate {
  return {
    subject: `Callback request: ${d.name} (${d.country})`,
    html: shell({
      preheader: `Call ${d.name} on the ${d.country} number - during their local business hours.`,
      eyebrowText: "Callback requested",
      heading: `Callback request - ${d.name}`,
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
    subject: "Ask Savo handoff - question needs an answer",
    html: shell({
      preheader: "The visitor was promised a reply within one business day. The clock is running.",
      eyebrowText: "Assistant handoff",
      heading: "Assistant handoff - response required",
      bodyHtml: [
        spec([["Visitor", d.email]]),
        quote(`“${d.question}”`),
        highlight(`<strong>Note:</strong> a response within one business day is committed on the website.`),
      ].join(""),
      cta: { href: site("/admin/enquiries"), label: "Answer it now" },
      closing: "Regards,",
      reason: "Internal team notification.",
    }),
    text: `ASSISTANT HANDOFF\n\nVisitor: ${d.email}\n\n"${d.question}"\n\nReply within one business day - promise made.\n${site("/admin/enquiries")}\n\nBefore the day ends,\nThe Savo team`,
  };
}

/* ══════════════ CLIENT PITCH ══════════════ */

/* Website-like dark brand passage, with readable sentence-case type. */
function pitchBand(label: string, href?: string): string {
  const text = `<span style="font-family:${DISPLAY};font-size:25px;line-height:1.3;font-weight:500;color:#ffffff;">${esc(label)}</span>`;
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#000000" style="margin:28px 0;background:#000000;border-radius:10px;border-collapse:separate;table-layout:fixed;"><tr><td style="padding:24px;text-align:left;">${href ? `<a href="${esc(href)}" style="text-decoration:none;color:#ffffff;">${text}</a>` : text}</td></tr></table>`;
}

/* Open capability rows, two across; each becomes a readable phone row. */
function pitchGrid(items: { icon: string; title: string; line: string }[]): string {
  const cell = (it: { icon: string; title: string; line: string }) => `
<td class="mail-pitch-cell" width="50%" valign="top" style="width:50%;padding:18px 12px 18px 0;vertical-align:top;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="table-layout:fixed;"><tr><td width="42" valign="top" style="width:42px;padding:2px 10px 0 0;">${it.icon}</td><td valign="top"><p style="margin:0 0 6px;font-family:${DISPLAY};font-size:18px;font-weight:500;line-height:1.3;color:${INK};">${esc(it.title)}</p><p style="margin:0;font-family:${SANS};font-size:13px;line-height:1.7;color:${MUTED};">${esc(it.line)}</p></td></tr></table></td>`;
  const rows: string[] = [];
  for (let i = 0; i < items.length; i += 2) rows.push(`<tr>${items.slice(i, i + 2).map(cell).join("")}</tr>`);
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0;table-layout:fixed;">${rows.join("")}</table>`;
}

/* ── Drawn icons: flow-layout CSS only (no absolute, no images) ── */

/** Browser window: title bar with lights + content lines. */
const iconBrowser = () => {
  const dot = `<span style="display:inline-block;width:2px;height:2px;border-radius:50%;background:#ffffff;margin:0 2px 0 0;"></span>`;
  return `<div style="width:32px;margin:0 auto;border:2px solid ${ACCENT};border-radius:5px;background:${CARD};overflow:hidden;">
  <div style="background:${ACCENT};height:6px;line-height:6px;font-size:0;text-align:left;padding-left:4px;">${dot}${dot}${dot}</div>
  <div style="padding:4px 4px 5px;">
    <div style="height:2px;background:${ACCENT};opacity:.35;border-radius:1px;margin-bottom:2px;width:84%;"></div>
    <div style="height:2px;background:${ACCENT};opacity:.35;border-radius:1px;width:56%;"></div>
  </div>
</div>`;
};

/** AI chip: pins around a die with a core. */
const iconChip = () => {
  const pinRow = `<div style="font-size:0;line-height:0;">${Array.from({ length: 3 })
    .map(() => `<span style="display:inline-block;width:2px;height:5px;background:${ACCENT};margin:0 4px;"></span>`)
    .join("")}</div>`;
  return `<div style="width:34px;margin:0 auto;text-align:center;">
  ${pinRow}
  <div style="border:2px solid ${ACCENT};border-radius:6px;padding:6px;margin:0 1px;background:${CARD};">
    <div style="width:9px;height:9px;border:2px solid ${ACCENT};border-radius:50%;margin:0 auto;"></div>
  </div>
  ${pinRow}
</div>`;
};

/** Phone: notch, content lines, home button. */
const iconPhone = () =>
  `<div style="width:20px;margin:0 auto;border:2px solid ${ACCENT};border-radius:5px;background:${CARD};overflow:hidden;">
  <div style="width:7px;height:2px;border-bottom:2px solid ${ACCENT};margin:0 auto;"></div>
  <div style="padding:3px 3px 0;">
    <div style="height:2px;background:${ACCENT};opacity:.35;border-radius:1px;margin-bottom:2px;"></div>
    <div style="height:2px;background:${ACCENT};opacity:.35;border-radius:1px;width:60%;margin-bottom:3px;"></div>
  </div>
  <div style="text-align:center;padding-bottom:2px;"><span style="display:inline-block;width:3px;height:3px;border:2px solid ${ACCENT};border-radius:50%;"></span></div>
</div>`;

/** UI/UX design: wireframe layout with header bar and sidebar. */
const iconLayout = () =>
  `<div style="width:28px;margin:0 auto;border:2px solid ${ACCENT};border-radius:5px;background:${CARD};overflow:hidden;">
  <div style="height:6px;border-bottom:2px solid ${ACCENT};"></div>
  <div style="font-size:0;">
    <span style="display:inline-block;width:8px;height:12px;border-right:2px solid ${ACCENT};vertical-align:top;"></span>
    <span style="display:inline-block;padding:3px 3px 0;vertical-align:top;text-align:left;">
      <span style="display:block;height:2px;background:${ACCENT};opacity:.35;border-radius:1px;margin-bottom:2px;width:11px;"></span>
      <span style="display:block;height:2px;background:${ACCENT};opacity:.35;border-radius:1px;width:7px;"></span>
    </span>
  </div>
</div>`;

/** Custom software: code brackets in the mono voice. */
const iconCode = () =>
  `<div style="font-family:${MONO};font-size:14px;font-weight:700;color:${ACCENT};line-height:32px;letter-spacing:-0.04em;">&lt;/&gt;</div>`;

/** Digital marketing & SEO: ascending bars on a baseline. */
const iconChart = () =>
  `<div style="width:30px;margin:0 auto;text-align:center;">
  <div style="font-size:0;line-height:0;">
    <span style="display:inline-block;width:5px;height:7px;background:${ACCENT};opacity:.4;margin:0 2px;vertical-align:bottom;"></span>
    <span style="display:inline-block;width:5px;height:12px;background:${ACCENT};opacity:.65;margin:0 2px;vertical-align:bottom;"></span>
    <span style="display:inline-block;width:5px;height:17px;background:${ACCENT};margin:0 2px;vertical-align:bottom;"></span>
  </div>
  <div style="height:2px;background:${ACCENT};margin-top:2px;border-radius:1px;"></div>
</div>`;

/* Native actions, stacked on phones and still usable without head CSS. */
function pitchCtas(primary: { href: string; label: string }, secondary: { href: string; label: string }): string {
  const action = (link: { href: string; label: string }, primaryAction: boolean) => `<a href="${esc(link.href)}" class="mail-button ${primaryAction ? "mail-button-primary" : "mail-button-secondary"}" style="display:block;padding:16px;background:${primaryAction ? ACCENT : CARD};border:1px solid ${primaryAction ? ACCENT : LINE};border-radius:6px;color:${primaryAction ? CARD : INK};font-family:${SANS};font-size:14px;font-weight:600;line-height:20px;text-align:center;text-decoration:none;">${esc(link.label)}${primaryAction ? "&nbsp;&nbsp;&rarr;" : ""}</a>`;
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0 0;table-layout:fixed;"><tr><td class="mail-dual-cell" width="50%" style="padding:0 12px 0 0;" valign="top">${action(primary, true)}</td><td class="mail-dual-cell" width="50%" valign="top">${action(secondary, false)}</td></tr></table>`;
}

const pitchLabel = (t: string) =>
  `<h2 style="margin:28px 0 8px;font-family:${DISPLAY};font-size:24px;font-weight:500;line-height:1.25;color:${INK};text-align:left;">${esc(t)}</h2>`;

/** Savo Build What's Next - the client pitch, composed manually from
 *  the email centre. Team voice, short and warm: an introduction, the
 *  three offerings with drawn icons, the conversation-first offer, and
 *  a direct Talk-to-us CTA row (WhatsApp, call, reply). */
export function buildWhatsNext(v: {
  name: string;
  company: string;
  focus?: string;
  to?: string;
}): MailTemplate {
  const first = fn(v.name);
  const wa = `https://wa.me/917502901234?text=${encodeURIComponent("Hi Savo team, I have a few minutes this week to talk.")}`;
  const focus = v.focus || "presenting your brand more professionally, being easier to discover, generating more enquiries, or introducing automation where it makes sense";
  return {
    subject: `A few ideas for ${v.company}`,
    html: shell({
      preheader: "A short note from the Savo team: what we build, and an invitation to a few minutes of conversation.",
      eyebrowText: "A note from the Savo team",
      heading: `A few ideas for ${v.company}.`,
      bodyHtml: [
        lead(`Hi ${esc(first)},<br><br>we came across <strong style="color:${INK};">${esc(v.company)}</strong> and wanted to introduce ourselves. Savo Technologies designs and builds modern websites, digital products, mobile applications, custom software and AI-powered solutions for businesses that want their online presence to work harder.`),
        pitchBand("Savo Build What's Next", site("/")),
        pitchLabel("What we do"),
        pitchGrid([
          { icon: iconBrowser(), title: "Web platforms", line: "Modern sites, portals and storefronts that present your brand professionally." },
          { icon: iconChip(), title: "AI & automation", line: "Agents, copilots and automation that do real work, where it makes sense." },
          { icon: iconPhone(), title: "Mobile apps", line: "iOS and Android products from one codebase, shipped to both stores." },
          { icon: iconLayout(), title: "UI/UX design", line: "Interfaces that make complex products obvious and desirable to use." },
          { icon: iconCode(), title: "Custom software", line: "Portals, SaaS and internal systems shaped around how you operate." },
          { icon: iconChart(), title: "Digital marketing & SEO", line: "Search, content and campaigns that compound after launch." },
        ]),
        highlight(`No generic proposal. First a short conversation about your goals, then concrete ideas, whether that means ${esc(focus)}.`),
        p(`Would a few minutes this week work? Tell us what you want to achieve; we will bring the ideas.`, true),
        pitchCtas(
          { href: wa, label: "Talk to us" },
          { href: site("/case-studies"), label: "See our work" },
        ),
      ].join(""),
      closing: "Warm regards,",
      reason: "You are receiving this because the Savo team wrote to you directly.",
      unsubscribeEmail: v.to,
    }),
    text: `HI ${first.toUpperCase()},\n\nWe came across ${v.company} and wanted to introduce ourselves. Savo Technologies designs and builds modern websites, digital products, mobile applications, custom software and AI-powered solutions.\n\nWHAT WE DO\n- Web platforms: modern sites, portals, storefronts\n- AI & automation: agents, copilots, automation\n- Mobile apps: iOS and Android from one codebase\n- UI/UX design: interfaces that make products obvious\n- Custom software: portals, SaaS, internal systems\n- Digital marketing & SEO: search, content, campaigns\n\nNo generic proposal: first a short conversation about your goals, then concrete ideas, whether that means ${focus}.\n\nWould a few minutes this week work? Chat with us on WhatsApp (+91 75029 01234), write to hello@savotechnologies.com, or see our work at ${site("/case-studies")}\n\nWarm regards,\nThe Savo team\nBold Brands. Built by Savo.\n${site("/")}`,
  };
}
