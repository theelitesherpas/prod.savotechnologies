/**
 * Email template registry - the bridge between code defaults and admin
 * overrides.
 *
 * Every transactional email has a key here: its variables (with sample
 * values that double as preview data), and its tested code default.
 * Admins can override subject + body in the panel; overrides support
 * {{placeholders}} and render inside the same branded shell, so even a
 * fully customized email stays on brand. No override → code default.
 */

import {
  appointmentLetter,
  candidateRejection,
  shortlistAck,
  documentVerification,
  employmentVerification,
  employeeWelcome,
  exitInterview,
  holidayAnnouncement,
  interviewInvite,
  interviewReminder,
  interviewReschedule,
  jobOpeningsBroadcast,
  leaveApproval,
  leaveRejection,
  offerLetter,
  onboardingWelcome,
  pipNotice,
  probationConfirmation,
  relievingLetter,
  resignationAcknowledgement,
  salaryIncrement,
  terminationNotice,
} from "@/lib/mail/hr-templates";
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
  buildWhatsNext,
  type MailTemplate,
} from "@/lib/mail/templates";
import {
  meetingInvitation,
  meetingAvailabilityReceived,
  meetingConfirmed,
  meetingAdminNotification,
} from "@/lib/mail/meeting-templates";

export type TemplateRecipient = "customer" | "team" | "hr" | "client" | "candidate" | "employee" | "external" | "prospect";

export type TemplateCategory =
  | "enquiries"
  | "meetings"
  | "pitches"
  | "careers"
  | "portal"
  | "team"
  | "recruitment"
  | "onboarding"
  | "lifecycle";

export const CATEGORY_LABEL: Record<TemplateCategory, string> = {
  enquiries: "Enquiries & Assistant",
  meetings: "Client Meetings",
  pitches: "Client Pitch & Projects",
  careers: "Careers & Applications",
  portal: "Client Portal & Billing",
  team: "Team Notifications",
  recruitment: "Recruitment",
  onboarding: "Offers & Onboarding",
  lifecycle: "Employment Lifecycle",
};

export const CATEGORY_ORDER: TemplateCategory[] = [
  "enquiries",
  "meetings",
  "pitches",
  "careers",
  "recruitment",
  "onboarding",
  "lifecycle",
  "portal",
  "team",
];

export type TemplateEntry = {
  key: string;
  label: string;
  fires: string;
  recipient: TemplateRecipient;
  /** Sending department: careers mail goes out as hr@, everything else as hello@. */
  dept: "hello" | "hr";
  /** Navigation group in the admin email centre. */
  category: TemplateCategory;
  /** Variable name → sample value (samples power the preview). */
  vars: Record<string, string>;
  default: (v: Record<string, string>) => MailTemplate;
};

export const RECIPIENT_LABEL: Record<TemplateRecipient, string> = {
  customer: "Site visitor",
  team: "Team · hello@",
  hr: "HR · hr@",
  client: "Portal client",
  candidate: "Candidate · hr@",
  employee: "Employee · hr@",
  external: "External · hr@",
  prospect: "Prospective client · hello@",
};

export const TEMPLATE_REGISTRY: TemplateEntry[] = [
  {
    key: "enquiryAck",
    category: "enquiries",
    label: "Enquiry acknowledgement",
    fires: "Enquiry drawer, contact form, start-page brief submitted",
    recipient: "customer",
    dept: "hello",
    vars: { name: "Priya Sharma", projectType: "Website" },
    default: (v) => enquiryAck(v.name, v.projectType, v.__to),
  },
  {
    key: "meetingInvitation",
    category: "meetings",
    label: "Meeting invitation",
    fires: "Meeting created with client email, or admin clicks Send Invitation",
    recipient: "customer",
    dept: "hello",
    vars: { clientName: "Uday Sharma", meetingTitle: "Project Kickoff Discussion", meetingType: "in_person", durationMin: "60", agenda: "Scope, timeline and approach", reference: "STPL-2026-8X4K2", schedulingLink: "https://savotechnologies.com/meeting/STPL-2026-8X4K2" },
    default: (v) => meetingInvitation({ clientName: v.clientName, meetingTitle: v.meetingTitle, meetingType: v.meetingType, durationMin: Number(v.durationMin) || 60, agenda: v.agenda, reference: v.reference, schedulingLink: v.schedulingLink, to: v.__to }),
  },
  {
    key: "meetingAvailabilityReceived",
    category: "meetings",
    label: "Availability received",
    fires: "Client submits their preferred date and time",
    recipient: "customer",
    dept: "hello",
    vars: { clientName: "Uday Sharma", meetingTitle: "Project Kickoff Discussion", date: "Thursday, 15 October 2026", time: "3:30 PM", durationMin: "60", reference: "STPL-2026-8X4K2" },
    default: (v) => meetingAvailabilityReceived({ clientName: v.clientName, meetingTitle: v.meetingTitle, date: v.date, time: v.time, durationMin: Number(v.durationMin) || 60, reference: v.reference, to: v.__to }),
  },
  {
    key: "meetingConfirmed",
    category: "meetings",
    label: "Meeting confirmed",
    fires: "Admin confirms the meeting after reviewing client availability",
    recipient: "customer",
    dept: "hello",
    vars: { clientName: "Uday Sharma", meetingTitle: "Project Kickoff Discussion", date: "Thursday, 15 October 2026", time: "3:30 PM", durationMin: "60", meetingType: "in_person", location: "Savo Technologies office, Indore", reference: "STPL-2026-8X4K2" },
    default: (v) => meetingConfirmed({ clientName: v.clientName, meetingTitle: v.meetingTitle, date: v.date, time: v.time, durationMin: Number(v.durationMin) || 60, meetingType: v.meetingType, location: v.location, reference: v.reference, to: v.__to }),
  },
  {
    key: "meetingAdminNotification",
    category: "meetings",
    label: "Team notification: response received",
    fires: "Client submits availability, alerts the team inbox",
    recipient: "team",
    dept: "hello",
    vars: { clientName: "Uday Sharma", clientCompany: "Pratham Real Estate", meetingTitle: "Project Kickoff Discussion", date: "Thursday, 15 October 2026", time: "3:30 PM", reference: "STPL-2026-8X4K2" },
    default: (v) => meetingAdminNotification({ clientName: v.clientName, clientCompany: v.clientCompany, meetingTitle: v.meetingTitle, date: v.date, time: v.time, reference: v.reference }),
  },
  {
    key: "callbackAck",
    category: "enquiries",
    label: "Callback logged",
    fires: "Footer callback requested (when an email is present)",
    recipient: "customer",
    dept: "hello",
    vars: { name: "Rohan Desai", country: "India" },
    default: (v) => callbackAck(v.name, v.country, v.__to),
  },
  {
    key: "askSavoHandoffAck",
    category: "enquiries",
    label: "Assistant handoff",
    fires: "Ask Savo question the assistant could not answer",
    recipient: "customer",
    dept: "hello",
    vars: { question: "How do you price a Flutter app with a backend panel?" },
    default: (v) => askSavoHandoffAck(v.question, v.__to),
  },
  {
    key: "buildWhatsNext",
    category: "pitches",
    label: "Savo Build What's Next",
    fires: "Composed manually in the email centre (client pitch)",
    recipient: "prospect",
    dept: "hello",
    vars: {
      name: "Sara",
      company: "Acme Retail",
      focus: "presenting your brand more professionally, being easier to discover, generating more enquiries, or introducing automation where it makes sense",
    },
    default: (v) => buildWhatsNext({ name: v.name, company: v.company, focus: v.focus, to: v.__to }),
  },
  {
    key: "applicationAck",
    category: "careers",
    dept: "hr",
    label: "Application received",
    fires: "Careers application submitted",
    recipient: "customer",
    vars: { name: "Aarav Mehta", role: "Flutter Developer" },
    default: (v) => applicationAck(v.name, v.role),
  },
  {
    key: "clientWelcome",
    category: "portal",
    label: "Portal welcome",
    fires: "Admin creates a client account",
    recipient: "client",
    dept: "hello",
    vars: { name: "Sara Khan", email: "sara@acme.co", password: "Savo-Start-2026" },
    default: (v) => clientWelcome(v.name, v.email, v.password),
  },
  {
    key: "clientPasswordReset",
    category: "portal",
    label: "Portal password reset",
    fires: "Admin resets a client password",
    recipient: "client",
    dept: "hello",
    vars: { name: "Sara Khan", password: "Savo-New-2026" },
    default: (v) => clientPasswordReset(v.name, v.password),
  },
  {
    key: "invoiceIssued",
    category: "portal",
    label: "Invoice issued",
    fires: "Admin creates an invoice",
    recipient: "client",
    dept: "hello",
    vars: { name: "Acme Trading", number: "SAVO-2026-014", amount: "₹2,500", due: "14 Oct 2026" },
    default: (v) => invoiceIssued(v.name, v.number, 250000, "INR", new Date(Date.now() + 14 * 86400000)),
  },
  {
    key: "invoicePaid",
    category: "portal",
    label: "Payment receipt",
    fires: "Invoice marked paid",
    recipient: "client",
    dept: "hello",
    vars: { name: "Acme Trading", number: "SAVO-2026-014", amount: "₹2,500" },
    default: (v) => invoicePaid(v.name, v.number, 250000, "INR"),
  },
  {
    key: "invoiceOverdue",
    category: "portal",
    label: "Overdue reminder",
    fires: "Invoice status set to overdue",
    recipient: "client",
    dept: "hello",
    vars: { name: "Acme Trading", number: "SAVO-2026-014", amount: "₹2,500", days: "7" },
    default: (v) => invoiceOverdue(v.name, v.number, 250000, "INR", 7),
  },
  {
    key: "milestoneUpdate",
    category: "portal",
    label: "Milestone status",
    fires: "Milestone started or completed",
    recipient: "client",
    dept: "hello",
    vars: { name: "Acme Trading", project: "Commerce Platform", milestone: "Design system sign-off", status: "completed" },
    default: (v) => milestoneUpdate(v.name, v.project, v.milestone, "done"),
  },
  {
    key: "projectUpdate",
    category: "portal",
    label: "Project update",
    fires: "Delivery-log entry posted",
    recipient: "client",
    dept: "hello",
    vars: { name: "Acme Trading", project: "Commerce Platform", title: "Weekly demo shipped", body: "Checkout v2 is live on staging - search filters land next week." },
    default: (v) => projectUpdate(v.name, v.project, v.title, v.body),
  },
  {
    key: "teamEnquiry",
    category: "team",
    label: "Team · new enquiry",
    fires: "Every public form submission",
    recipient: "team",
    dept: "hello",
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
    category: "careers",
    dept: "hr",
    label: "HR · new application",
    fires: "Careers application submitted",
    recipient: "hr",
    vars: { name: "Aarav Mehta", email: "aarav@example.com", role: "Flutter Developer", experience: "3 years", links: "github.com/aarav", message: "Shipping-first developer, 4 published apps." },
    default: (v) =>
      teamApplication({ name: v.name, email: v.email, role: v.role, experience: v.experience, links: v.links, message: v.message }),
  },
  {
    key: "teamCallback",
    category: "team",
    label: "Team · callback request",
    fires: "Footer callback requested",
    recipient: "team",
    dept: "hello",
    vars: { name: "Rohan Desai", phone: "+91 98765 43210", country: "India" },
    default: (v) => teamCallback({ name: v.name, phone: v.phone, country: v.country }),
  },
  {
    key: "teamAskSavo",
    category: "team",
    label: "Team · assistant handoff",
    fires: "Ask Savo handoff",
    recipient: "team",
    dept: "hello",
    vars: { email: "visitor@company.com", question: "Do you take over existing React Native codebases mid-project?" },
    default: (v) => teamAskSavo({ email: v.email, question: v.question }),
  },

  /* ── HR OPERATIONS · RECRUITMENT ─────────────────────────── */
  {
    key: "interviewInvite",
    dept: "hr",
    category: "recruitment",
    label: "Interview invitation",
    fires: "HR sends to a shortlisted candidate (meeting link + slot)",
    recipient: "candidate",
    vars: { candidateName: "Aarav Mehta", position: "Flutter Developer", interviewDate: "Mon, 28 Sep", interviewTime: "11:00", timezone: "IST", duration: "45 minutes", mode: "Google Meet", interviewer: "Rohan Desai (Engineering)", meetingLink: "https://meet.google.com/abc-defg-hij" },
    default: (v) => interviewInvite(v),
  },
  {
    key: "interviewReminder",
    dept: "hr",
    category: "recruitment",
    label: "Interview reminder",
    fires: "Sent ahead of the scheduled interview",
    recipient: "candidate",
    vars: { candidateName: "Aarav Mehta", position: "Flutter Developer", interviewDate: "Mon, 28 Sep", interviewTime: "11:00", timezone: "IST", meetingLink: "https://meet.google.com/abc-defg-hij" },
    default: (v) => interviewReminder(v),
  },
  {
    key: "interviewReschedule",
    dept: "hr",
    category: "recruitment",
    label: "Interview rescheduled",
    fires: "Interview moved to a new slot",
    recipient: "candidate",
    vars: { candidateName: "Aarav Mehta", position: "Flutter Developer", newDate: "Wed, 30 Sep", newTime: "16:00", timezone: "IST", meetingLink: "https://meet.google.com/abc-defg-hij" },
    default: (v) => interviewReschedule(v),
  },
  {
    key: "shortlistAck",
    dept: "hr",
    category: "recruitment",
    label: "Shortlist acknowledgment",
    fires: "HR shortlists a candidate from the enquiry",
    recipient: "candidate",
    vars: { candidateName: "Aarav Mehta", position: "Flutter Developer" },
    default: (v) => shortlistAck(v),
  },
  {
    key: "candidateRejection",
    dept: "hr",
    category: "recruitment",
    label: "Candidate rejection",
    fires: "Application not proceeding",
    recipient: "candidate",
    vars: { candidateName: "Aarav Mehta", position: "Flutter Developer" },
    default: (v) => candidateRejection(v),
  },
  {
    key: "jobOpeningsBroadcast",
    dept: "hr",
    category: "recruitment",
    label: "Job openings broadcast",
    fires: "Bulk announcement of open positions",
    recipient: "candidate",
    vars: { recipientName: "Team", openingsList: "· Flutter Developer - Indore / Hybrid\n· AI Engineer - Indore / Hybrid\n· UI/UX Designer - Indore / Hybrid" },
    default: (v) => jobOpeningsBroadcast(v),
  },
  /* ── HR OPERATIONS · OFFERS & ONBOARDING ─────────────────── */
  {
    key: "employeeWelcome",
    dept: "hr",
    category: "onboarding",
    label: "Employee record created (ID email)",
    fires: "Automatically on employee creation in the portal",
    recipient: "employee",
    vars: { employeeName: "Aarav Mehta", employeeCode: "STPL00001", position: "Flutter Developer", department: "Engineering", joiningDate: "12 Oct 2026", reportTo: "Rohan Desai, Engineering Lead", leavePolicy: "One leave is credited for every completed month of service; unused leaves carry forward." },
    default: (v) => employeeWelcome(v),
  },
  {
    key: "offerLetter",
    dept: "hr",
    category: "onboarding",
    label: "Offer of employment",
    fires: "HR sends after final selection",
    recipient: "candidate",
    vars: { candidateName: "Aarav Mehta", position: "Flutter Developer", ctc: "₹9,00,000 per annum", joiningDate: "12 Oct 2026", reportTo: "Rohan Desai, Engineering Lead", validUntil: "05 Oct 2026" },
    default: (v) => offerLetter(v),
  },
  {
    key: "documentVerification",
    dept: "hr",
    category: "onboarding",
    label: "Document verification request",
    fires: "Pre-joining documentation",
    recipient: "candidate",
    vars: { candidateName: "Aarav Mehta", position: "Flutter Developer", documents: "· Government photo ID\n· Highest qualification certificate\n· Relieving letter from previous employer\n· Last three salary slips", deadline: "08 Oct 2026" },
    default: (v) => documentVerification(v),
  },
  {
    key: "employmentVerification",
    dept: "hr",
    category: "onboarding",
    label: "Employment verification (previous employer)",
    fires: "Reference check with a prior employer",
    recipient: "external",
    vars: { recipientName: "HR Manager", candidateName: "Aarav Mehta", workedFrom: "Jun 2022", workedTo: "Aug 2025", designation: "Software Engineer" },
    default: (v) => employmentVerification(v),
  },
  {
    key: "appointmentLetter",
    dept: "hr",
    category: "onboarding",
    label: "Appointment letter",
    fires: "Formal appointment after acceptance + verification",
    recipient: "employee",
    vars: { employeeName: "Aarav Mehta", position: "Flutter Developer", department: "Engineering", joiningDate: "12 Oct 2026", reportTo: "Rohan Desai, Engineering Lead" },
    default: (v) => appointmentLetter(v),
  },
  {
    key: "onboardingWelcome",
    dept: "hr",
    category: "onboarding",
    label: "First-day welcome",
    fires: "Sent before the joining date",
    recipient: "employee",
    vars: { employeeName: "Aarav Mehta", position: "Flutter Developer", joiningDate: "Monday, 12 Oct", reportTime: "9:30 am", officeLocation: "Savo Technologies, Indore", buddy: "Priya Sharma" },
    default: (v) => onboardingWelcome(v),
  },
  /* ── HR OPERATIONS · LIFECYCLE ───────────────────────────── */
  {
    key: "probationConfirmation",
    dept: "hr",
    category: "lifecycle",
    label: "Probation confirmation",
    fires: "Probation completed successfully",
    recipient: "employee",
    vars: { employeeName: "Aarav Mehta", position: "Flutter Developer", confirmationDate: "12 Apr 2027", managerName: "Rohan Desai" },
    default: (v) => probationConfirmation(v),
  },
  {
    key: "salaryIncrement",
    dept: "hr",
    category: "lifecycle",
    label: "Salary revision",
    fires: "Annual / appraisal revision",
    recipient: "employee",
    vars: { employeeName: "Aarav Mehta", newCtc: "₹11,00,000 per annum", incrementPercent: "22%", effectiveDate: "01 Apr 2027", managerName: "Rohan Desai" },
    default: (v) => salaryIncrement(v),
  },
  {
    key: "leaveApproval",
    dept: "hr",
    category: "lifecycle",
    label: "Leave approved",
    fires: "Leave request approved",
    recipient: "employee",
    vars: { employeeName: "Aarav Mehta", leaveType: "Privilege leave", fromDate: "20 Oct 2026", toDate: "22 Oct 2026", days: "3", approvedBy: "Rohan Desai" },
    default: (v) => leaveApproval(v),
  },
  {
    key: "leaveRejection",
    dept: "hr",
    category: "lifecycle",
    label: "Leave declined",
    fires: "Leave request not approved",
    recipient: "employee",
    vars: { employeeName: "Aarav Mehta", leaveType: "Privilege leave", fromDate: "20 Oct 2026", toDate: "22 Oct 2026", reason: "Release week on an active client project" },
    default: (v) => leaveRejection(v),
  },
  {
    key: "pipNotice",
    dept: "hr",
    category: "lifecycle",
    label: "Performance improvement plan",
    fires: "Structured PIP with support",
    recipient: "employee",
    vars: { employeeName: "Aarav Mehta", position: "Flutter Developer", focusAreas: "Delivery timelines · code review participation", duration: "60 days", reviewDate: "15 Dec 2026", managerName: "Rohan Desai" },
    default: (v) => pipNotice(v),
  },
  {
    key: "terminationNotice",
    dept: "hr",
    category: "lifecycle",
    label: "Termination of service",
    fires: "Formal separation notice",
    recipient: "employee",
    vars: { employeeName: "Aarav Mehta", position: "Flutter Developer", lastWorkingDay: "30 Nov 2026", noticePeriod: "30 days", reason: "As discussed in the review meetings", handoverTo: "Priya Sharma" },
    default: (v) => terminationNotice(v),
  },
  {
    key: "resignationAcknowledgement",
    dept: "hr",
    category: "lifecycle",
    label: "Resignation acknowledged",
    fires: "Resignation received",
    recipient: "employee",
    vars: { employeeName: "Aarav Mehta", position: "Flutter Developer", lastWorkingDay: "30 Nov 2026", handoverTo: "Priya Sharma" },
    default: (v) => resignationAcknowledgement(v),
  },
  {
    key: "relievingLetter",
    dept: "hr",
    category: "lifecycle",
    label: "Relieving & experience letter",
    fires: "Issued after exit formalities",
    recipient: "employee",
    vars: { employeeName: "Aarav Mehta", position: "Flutter Developer", fromDate: "12 Oct 2026", toDate: "30 Nov 2026", conduct: "Good" },
    default: (v) => relievingLetter(v),
  },
  {
    key: "exitInterview",
    dept: "hr",
    category: "lifecycle",
    label: "Exit interview invitation",
    fires: "Invitation before last working day",
    recipient: "employee",
    vars: { employeeName: "Aarav Mehta", exitDate: "27 Nov 2026", duration: "30 minutes", meetingLink: "https://meet.google.com/abc-defg-hij" },
    default: (v) => exitInterview(v),
  },
  {
    key: "holidayAnnouncement",
    dept: "hr",
    category: "lifecycle",
    label: "Holiday announcement",
    fires: "Office closure notice",
    recipient: "employee",
    vars: { employeeName: "Team", holidayName: "Diwali", holidayDate: "08 Nov 2026", holidayDay: "Sunday", note: "Wishing you and your family a joyful festival." },
    default: (v) => holidayAnnouncement(v),
  },
];

export function templateEntry(key: string): TemplateEntry | undefined {
  return TEMPLATE_REGISTRY.find((t) => t.key === key);
}

/* ── override rendering ─────────────────────────────────────────────── */

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Substitute {{vars}} - HTML-escaped for safe interpolation. */
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
