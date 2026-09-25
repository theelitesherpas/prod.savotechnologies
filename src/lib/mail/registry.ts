/**
 * Email template registry — the bridge between code defaults and admin
 * overrides.
 *
 * Every transactional email has a key here: its variables (with sample
 * values that double as preview data), and its tested code default.
 * Admins can override subject + body in the panel; overrides support
 * {{placeholders}} and render inside the same branded shell, so even a
 * fully customized email stays on brand. No override → code default.
 */

import {
  applicationAck,
  askSavoHandoffAck,
  callbackAck,
  clientPasswordReset,
  clientWelcome,
  enquiryAck,
  invoiceIssued,
  invoiceOverdue,
  invoicePaid,
  milestoneUpdate,
  projectUpdate,
  teamApplication,
  teamAskSavo,
  teamCallback,
  teamEnquiry,
  type MailTemplate,
} from "@/lib/mail/templates";

export type TemplateRecipient = "customer" | "team" | "hr" | "client";

export type TemplateEntry = {
  key: string;
  label: string;
  fires: string;
  recipient: TemplateRecipient;
  /** Variable name → sample value (samples power the preview). */
  vars: Record<string, string>;
  default: (v: Record<string, string>) => MailTemplate;
};

export const RECIPIENT_LABEL: Record<TemplateRecipient, string> = {
  customer: "Site visitor",
  team: "Team · hello@",
  hr: "HR · hr@",
  client: "Portal client",
};

export const TEMPLATE_REGISTRY: TemplateEntry[] = [
  {
    key: "enquiryAck",
    label: "Enquiry acknowledgement",
    fires: "Enquiry drawer, contact form, start-page brief submitted",
    recipient: "customer",
    vars: { name: "Priya Sharma", projectType: "Website" },
    default: (v) => enquiryAck(v.name, v.projectType),
  },
  {
    key: "callbackAck",
    label: "Callback logged",
    fires: "Footer callback requested (when an email is present)",
    recipient: "customer",
    vars: { name: "Rohan Desai", country: "India" },
    default: (v) => callbackAck(v.name, v.country),
  },
  {
    key: "askSavoHandoffAck",
    label: "Assistant handoff",
    fires: "Ask Savo question the assistant could not answer",
    recipient: "customer",
    vars: { question: "How do you price a Flutter app with a backend panel?" },
    default: (v) => askSavoHandoffAck(v.question),
  },
  {
    key: "applicationAck",
    label: "Application received",
    fires: "Careers application submitted",
    recipient: "customer",
    vars: { name: "Aarav Mehta", role: "Flutter Developer" },
    default: (v) => applicationAck(v.name, v.role),
  },
  {
    key: "clientWelcome",
    label: "Portal welcome",
    fires: "Admin creates a client account",
    recipient: "client",
    vars: { name: "Sara Khan", email: "sara@acme.co", password: "Savo-Start-2026" },
    default: (v) => clientWelcome(v.name, v.email, v.password),
  },
  {
    key: "clientPasswordReset",
    label: "Portal password reset",
    fires: "Admin resets a client password",
    recipient: "client",
    vars: { name: "Sara Khan", password: "Savo-New-2026" },
    default: (v) => clientPasswordReset(v.name, v.password),
  },
  {
    key: "invoiceIssued",
    label: "Invoice issued",
    fires: "Admin creates an invoice",
    recipient: "client",
    vars: { name: "Acme Trading", number: "SAVO-2026-014", amount: "₹2,500", due: "14 Oct 2026" },
    default: (v) => invoiceIssued(v.name, v.number, 250000, "INR", new Date(Date.now() + 14 * 86400000)),
  },
  {
    key: "invoicePaid",
    label: "Payment receipt",
    fires: "Invoice marked paid",
    recipient: "client",
    vars: { name: "Acme Trading", number: "SAVO-2026-014", amount: "₹2,500" },
    default: (v) => invoicePaid(v.name, v.number, 250000, "INR"),
  },
  {
    key: "invoiceOverdue",
    label: "Overdue reminder",
    fires: "Invoice status set to overdue",
    recipient: "client",
    vars: { name: "Acme Trading", number: "SAVO-2026-014", amount: "₹2,500", days: "7" },
    default: (v) => invoiceOverdue(v.name, v.number, 250000, "INR", 7),
  },
  {
    key: "milestoneUpdate",
    label: "Milestone status",
    fires: "Milestone started or completed",
    recipient: "client",
    vars: { name: "Acme Trading", project: "Commerce Platform", milestone: "Design system sign-off", status: "completed" },
    default: (v) => milestoneUpdate(v.name, v.project, v.milestone, "done"),
  },
  {
    key: "projectUpdate",
    label: "Project update",
    fires: "Delivery-log entry posted",
    recipient: "client",
    vars: { name: "Acme Trading", project: "Commerce Platform", title: "Weekly demo shipped", body: "Checkout v2 is live on staging — search filters land next week." },
    default: (v) => projectUpdate(v.name, v.project, v.title, v.body),
  },
  {
    key: "teamEnquiry",
    label: "Team · new enquiry",
    fires: "Every public form submission",
    recipient: "team",
    vars: {
      name: "Priya Sharma",
      email: "priya@company.com",
      phone: "+91 98765 43210",
      projectType: "AI / AI Agent",
      budget: "$15k – $40k",
      message: "We need an AI agent that triages inbound support mail and drafts replies.",
      source: "contact-page",
    },
    default: (v) =>
      teamEnquiry({
        name: v.name,
        email: v.email,
        phone: v.phone,
        projectType: v.projectType,
        budget: v.budget,
        message: v.message,
        source: v.source,
      }),
  },
  {
    key: "teamApplication",
    label: "HR · new application",
    fires: "Careers application submitted",
    recipient: "hr",
    vars: { name: "Aarav Mehta", email: "aarav@example.com", role: "Flutter Developer", experience: "3 years", links: "github.com/aarav", message: "Shipping-first developer, 4 published apps." },
    default: (v) =>
      teamApplication({ name: v.name, email: v.email, role: v.role, experience: v.experience, links: v.links, message: v.message }),
  },
  {
    key: "teamCallback",
    label: "Team · callback request",
    fires: "Footer callback requested",
    recipient: "team",
    vars: { name: "Rohan Desai", phone: "+91 98765 43210", country: "India" },
    default: (v) => teamCallback({ name: v.name, phone: v.phone, country: v.country }),
  },
  {
    key: "teamAskSavo",
    label: "Team · assistant handoff",
    fires: "Ask Savo handoff",
    recipient: "team",
    vars: { email: "visitor@company.com", question: "Do you take over existing React Native codebases mid-project?" },
    default: (v) => teamAskSavo({ email: v.email, question: v.question }),
  },
];

export function templateEntry(key: string): TemplateEntry | undefined {
  return TEMPLATE_REGISTRY.find((t) => t.key === key);
}

/* ── override rendering ─────────────────────────────────────────────── */

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Substitute {{vars}} — HTML-escaped for safe interpolation. */
export function fill(template: string, vars: Record<string, string | number | null | undefined>): string {
  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_m, name: string) => {
    const v = vars[name];
    return v === undefined || v === null ? "" : esc(String(v));
  });
}

/** Same substitution for plain-text parts (no escaping). */
export function fillText(template: string, vars: Record<string, string | number | null | undefined>): string {
  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_m, name: string) => {
    const v = vars[name];
    return v === undefined || v === null ? "" : String(v);
  });
}

const looksLikeHtml = (s: string) => /<\/?(p|div|br|strong|em|a|ul|ol|li|h[1-6]|table|tr|td|blockquote)\b/i.test(s);

/** Admin body → safe HTML: plain text is line-broken and escaped, HTML
 *  passes through (admins are trusted; variable values stay escaped). */
export function bodyToHtml(body: string): string {
  const t = body.trim();
  if (looksLikeHtml(t)) return t;
  return t
    .split(/\n{2,}/)
    .map((para) => `<p style="margin:0 0 14px;">${esc(para).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

/** Rough plain-text twin of an override body (tags stripped). */
export function bodyToText(body: string): string {
  return body
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h[1-6])>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
