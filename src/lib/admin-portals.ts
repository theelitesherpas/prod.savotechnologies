import type { AdminIconName } from "@/components/admin/icons";
import { canAccess, type PermittedUser, type SectionKey } from "@/lib/permissions";
import { COLLECTION_KEYS, CONTENT_COLLECTIONS } from "@/lib/content-registry";

export type PortalKey = "hr" | "client" | "employee";
export const PORTALS = {
  hr: { label: "HR Portal", href: "/admin/hr-portal", section: "hr-portal", icon: "crew", description: "Recruitment, candidate records and hiring administration." },
  client: { label: "Client Portal", href: "/admin/client-portal", section: "clients", icon: "folder", description: "Sales enquiries, client relationships, delivery and billing." },
  employee: { label: "Employee Portal", href: "/admin/employees", section: "employees", icon: "user", description: "Employee records, leave and employment operations." },
} as const;

export type PortalLink = { href: string; label: string; icon: AdminIconName; section: SectionKey; group?: string; description?: string };
export function portalLinks(portal: PortalKey): PortalLink[] {
  if (portal === "hr") return [
    { href: "/admin/hr-portal", label: "Recruitment pipeline", icon: "gauge", section: "hr-portal", group: "Recruitment" },
    { href: "/admin/hr-portal/applications", label: "Applications & candidates", icon: "inbox", section: "hr-portal" },
    { href: "/admin/hr-portal?tab=scheduled", label: "Interview schedule", icon: "sun", section: "hr-portal" },
    { href: "/admin/content/careers", label: "Job openings", icon: "folder", section: "content" },
    ...recordLinks("hr"),
    { href: "/admin/emails?dept=hr", label: "HR mailbox", icon: "inbox", section: "emails", group: "Correspondence" },
    { href: "/admin/email-compose?dept=hr", label: "Send HR email", icon: "pen", section: "employees" },
  ];
  if (portal === "client") return [
    { href: "/admin/client-portal", label: "Overview", icon: "gauge", section: "clients", group: "Relationships" },
    { href: "/admin/enquiries?type=Client", label: "Client enquiries", icon: "inbox", section: "enquiries" },
    { href: "/admin/clients", label: "Client directory", icon: "user", section: "clients" },
    ...recordLinks("client").filter(l => l.href.endsWith("/contacts") || l.href.endsWith("/proposals") || l.href.endsWith("/contracts")),
    { href: "/admin/meetings", label: "Meetings", icon: "chat", section: "clients", group: "Delivery & billing" },
    { href: "/admin/projects", label: "Projects & milestones", icon: "folder", section: "clients" },
    { href: "/admin/invoices", label: "Invoices & payments", icon: "gauge", section: "clients" },
    ...recordLinks("client").filter(l => l.href.endsWith("/documents") || l.href.endsWith("/support")),
    { href: "/admin/emails?dept=hello", label: "Client mailbox", icon: "inbox", section: "emails", group: "Correspondence" },
    { href: "/admin/email-compose?dept=hello", label: "Send client email", icon: "pen", section: "clients" },
  ];
  return [
    { href: "/admin/employees", label: "Employee directory", icon: "crew", section: "employees", group: "People" },
    { href: "/admin/employees/new", label: "Add employee", icon: "plus", section: "employees" },
    ...recordLinks("employee").filter(l => ["onboarding", "documents"].some(k => l.href.endsWith(`/${k}`))),
    { href: "/admin/employees/leaves", label: "Leave management", icon: "sun", section: "employees", group: "Time & compensation" },
    ...recordLinks("employee").filter(l => !["onboarding", "documents"].some(k => l.href.endsWith(`/${k}`))),
  ];
}

export type RecordField = { key: string; label: string; type?: "text" | "textarea" | "email" | "url" | "date" | "number" | "select"; required?: boolean; options?: readonly string[]; hint?: string };
export type RecordModule = { key: string; portal: PortalKey; label: string; singular: string; description: string; subject: "candidate" | "client" | "employee"; statuses: readonly string[]; fields: RecordField[] };
const field = (key: string, label: string, type: RecordField["type"] = "text", required = false): RecordField => ({ key, label, type, required });
const currency: RecordField = { key: "currency", label: "Currency", type: "select", options: ["INR", "USD", "GBP", "EUR", "AED"] };
const documentFields: RecordField[] = [field("category", "Document category", "text", true), field("reference", "Document reference"), { ...field("url", "Secure document URL", "url"), hint: "Use an access-controlled document store. This is a reference, not a file upload." }, field("expires", "Expiry date", "date")];
export const RECORD_MODULES: RecordModule[] = [
  { portal: "hr", key: "requisitions", label: "Hiring requests", singular: "Hiring request", subject: "candidate", description: "Track approved headcount and hiring requirements. Candidate linkage is optional for this register.", statuses: ["draft", "pending_approval", "approved", "on_hold", "filled", "cancelled"], fields: [field("department", "Department", "text", true), field("position", "Position", "text", true), field("openings", "Number of openings", "number", true), field("employmentType", "Employment type"), field("location", "Work location"), field("budget", "Approved budget"), field("approver", "Approver"), field("requirements", "Requirements", "textarea")] },
  { portal: "hr", key: "offers", label: "Offers & hiring decisions", singular: "Offer", subject: "candidate", description: "Record offer terms, approvals and candidate decisions. Saving does not send an offer or create an employee.", statuses: ["draft", "pending_approval", "approved", "sent", "accepted", "declined", "withdrawn"], fields: [field("position", "Offered position", "text", true), field("ctc", "Agreed CTC / compensation", "text", true), field("joiningDate", "Proposed joining date", "date"), field("validUntil", "Offer valid until", "date"), field("approver", "Approved by"), field("terms", "Offer terms", "textarea")] },
  { portal: "hr", key: "candidate-documents", label: "Candidate documents", singular: "Candidate document", subject: "candidate", description: "Track document requests and verification before hiring; store references, not identity numbers or file contents.", statuses: ["requested", "received", "under_review", "verified", "rejected", "expired"], fields: [...documentFields, field("verifiedBy", "Verified by"), field("verifiedDate", "Verification date", "date")] },
  { portal: "client", key: "contacts", label: "Client contacts", singular: "Contact", subject: "client", description: "Keep decision makers, billing contacts and delivery stakeholders linked to the correct client.", statuses: ["active", "inactive"], fields: [field("name", "Contact name", "text", true), field("role", "Role / designation"), field("email", "Email", "email", true), field("phone", "Phone"), field("responsibility", "Responsibility / contact purpose")] },
  { portal: "client", key: "proposals", label: "Proposals & estimates", singular: "Proposal", subject: "client", description: "Track scope, commercial estimates and approvals before project creation. No invoices or payments are generated.", statuses: ["draft", "under_review", "sent", "negotiating", "accepted", "declined", "expired"], fields: [field("reference", "Proposal reference", "text", true), field("amount", "Estimated amount", "number"), currency, field("validUntil", "Valid until", "date"), field("scope", "Proposed scope", "textarea", true), field("url", "Proposal URL", "url")] },
  { portal: "client", key: "contracts", label: "Contracts & agreements", singular: "Agreement", subject: "client", description: "Maintain contract references, signatories and renewal dates. Signing is recorded manually, not performed by the panel.", statuses: ["draft", "under_review", "awaiting_signature", "signed", "expired", "terminated"], fields: [field("reference", "Agreement reference", "text", true), field("type", "Agreement type", "text", true), field("signatory", "Client signatory"), field("signedDate", "Signed date", "date"), field("renewalDate", "Renewal date", "date"), field("url", "Agreement URL", "url"), field("terms", "Key terms", "textarea")] },
  { portal: "client", key: "documents", label: "Client documents", singular: "Client document", subject: "client", description: "Organize requirements, approvals and handover references for each client.", statuses: ["requested", "received", "under_review", "approved", "archived"], fields: documentFields },
  { portal: "client", key: "support", label: "Client support requests", singular: "Support request", subject: "client", description: "Log client issues, ownership and resolutions internally. These records are not yet exposed in the client workspace.", statuses: ["open", "in_progress", "waiting_on_client", "resolved", "closed"], fields: [{ key: "priority", label: "Priority", type: "select", options: ["low", "normal", "high", "urgent"], required: true }, field("projectReference", "Project reference"), field("issue", "Issue / request", "textarea", true), field("resolution", "Resolution", "textarea")] },
  { portal: "employee", key: "onboarding", label: "Onboarding", singular: "Onboarding task", subject: "employee", description: "Assign joining formalities, induction and access-setup tasks to an owner.", statuses: ["pending", "in_progress", "blocked", "completed", "cancelled"], fields: [field("category", "Task category", "text", true), field("checklist", "Task / checklist", "textarea", true), field("completedDate", "Completed date", "date")] },
  { portal: "employee", key: "documents", label: "Employee documents", singular: "Employee document", subject: "employee", description: "Maintain employment document references and verification status. Do not enter identity numbers or banking credentials.", statuses: ["requested", "received", "verified", "expired", "archived"], fields: [...documentFields, field("verifiedBy", "Verified by")] },
  { portal: "employee", key: "attendance", label: "Attendance & timesheets", singular: "Attendance record", subject: "employee", description: "Record attendance or a timesheet period manually. No time-clock tracking or leave balance changes are performed.", statuses: ["draft", "submitted", "approved", "correction_required"], fields: [field("workDays", "Days worked", "number", true), field("hours", "Hours worked", "number"), field("workMode", "Work mode / location"), field("summary", "Work summary", "textarea"), field("approver", "Reviewed by")] },
  { portal: "employee", key: "payroll", label: "Compensation & payroll", singular: "Payroll record", subject: "employee", description: "Maintain manually reviewed compensation and payroll records. No salary calculation, disbursement or statutory filing is automated.", statuses: ["draft", "under_review", "approved", "paid", "cancelled"], fields: [field("period", "Payroll month / period", "text", true), field("gross", "Gross amount", "number", true), field("deductions", "Deductions", "number"), field("net", "Net payable", "number", true), currency, field("paidDate", "Payment date", "date"), field("reference", "Payment reference"), field("approver", "Approved by")] },
  { portal: "employee", key: "reviews", label: "Performance & development", singular: "Performance review", subject: "employee", description: "Track review cycles, goals, feedback and development plans.", statuses: ["planned", "in_progress", "completed", "on_hold"], fields: [field("cycle", "Review cycle", "text", true), field("reviewer", "Reviewer", "text", true), field("goals", "Goals", "textarea"), field("feedback", "Review feedback", "textarea"), field("development", "Development plan", "textarea"), field("nextReview", "Next review", "date")] },
  { portal: "employee", key: "assets", label: "Assets & access", singular: "Asset / access record", subject: "employee", description: "Record assigned equipment, software access and return or revocation status. Never store passwords or access tokens.", statuses: ["requested", "assigned", "return_pending", "returned", "revoked", "lost"], fields: [field("type", "Asset / access type", "text", true), field("reference", "Asset tag / access reference", "text", true), field("condition", "Condition / access scope"), field("returnedDate", "Returned / revoked date", "date")] },
  { portal: "employee", key: "expenses", label: "Expenses & reimbursements", singular: "Expense claim", subject: "employee", description: "Track expense evidence, review decisions and manually recorded reimbursement. Saving never initiates a payment.", statuses: ["draft", "submitted", "approved", "rejected", "reimbursed", "cancelled"], fields: [field("category", "Expense category", "text", true), field("amount", "Claimed amount", "number", true), currency, field("expenseDate", "Expense date", "date", true), field("url", "Receipt URL", "url"), field("approver", "Approved by"), field("reference", "Reimbursement reference")] },
  { portal: "employee", key: "offboarding", label: "Offboarding & clearance", singular: "Clearance task", subject: "employee", description: "Track notice-period handover, asset returns and final clearances. Employee status and sessions remain managed on the employee record.", statuses: ["pending", "in_progress", "blocked", "completed", "waived"], fields: [field("category", "Clearance category", "text", true), field("checklist", "Clearance / handover requirements", "textarea", true), field("approver", "Cleared by"), field("completedDate", "Clearance date", "date")] },
];
export function recordModule(portal: string, key: string) { return RECORD_MODULES.find(m => m.portal === portal && m.key === key); }
export function recordPath(portal: PortalKey, key: string) { return `${PORTALS[portal].href}/records/${key}`; }
function recordLinks(portal: PortalKey): PortalLink[] { return RECORD_MODULES.filter(m => m.portal === portal).map(m => ({ href: recordPath(portal, m.key), label: m.label, description: m.description, icon: "folder", section: PORTALS[portal].section, group: m.key === "requisitions" ? "Hiring administration" : m.key === "reviews" ? "Employment lifecycle" : undefined })); }
export function visiblePortalLinks(portal: PortalKey, user: PermittedUser) {
  const links = portalLinks(portal).filter(l => canAccess(user, l.section));
  if (portal === "hr" && canAccess(user, "enquiries") && !canAccess(user, "hr-portal")) links.unshift({ href: "/admin/enquiries?type=Careers", label: "Applications & candidates", icon: "inbox", section: "enquiries", group: "Recruitment" });
  return links;
}

export function buildAdminNav(user: PermittedUser) {
  const allow = (section: string) => canAccess(user, section);
  const nav: { key: string; label: string; icon: AdminIconName; href?: string; items?: Omit<PortalLink, "section">[] }[] = [{ key: "overview", label: "Dashboard", icon: "gauge", href: "/admin" }];
  if (allow("analytics")) nav.push({ key: "analytics", label: "Website analytics", icon: "trend", href: "/admin/analytics" });
  for (const portal of ["hr", "client", "employee"] as const) {
    const items = visiblePortalLinks(portal, user);
    if (items.length) nav.push({ key: portal, label: PORTALS[portal].label, icon: PORTALS[portal].icon, items });
  }
  if (allow("live-chat")) nav.find(n => n.key === "client")?.items?.splice(2, 0, { href: "/admin/live-chat", label: "Live chat", icon: "chat" });
  if (allow("live-chat") && !nav.some(n => n.key === "client")) nav.push({ key: "client", label: "Client Portal", icon: "chat", items: [{ href: "/admin/live-chat", label: "Live chat", icon: "chat" }] });
  if (allow("content")) nav.push({ key: "content", label: "Website content", icon: "layers", items: [
    { href: "/admin/services", label: "Services", icon: "layers" }, { href: "/admin/industries", label: "Industries", icon: "grid" }, { href: "/admin/content/contact", label: "Contact page", icon: "chat" }, { href: "/admin/case-studies", label: "Case studies", icon: "folder" },
    ...COLLECTION_KEYS.filter(k => !["case-studies", "careers"].includes(k)).map(k => ({ href: `/admin/content/${k}`, label: CONTENT_COLLECTIONS[k].label, icon: CONTENT_COLLECTIONS[k].icon })),
  ] });
  const system: Omit<PortalLink, "section">[] = [
    ...(allow("settings") ? [{ href: "/admin/settings", label: "Site settings", icon: "gear" as const }, { href: "/admin/settings/payments", label: "Payment gateway", icon: "gauge" as const }] : []),
    ...(allow("email-templates") ? [{ href: "/admin/email-templates", label: "Email templates", icon: "pen" as const }] : []),
    ...(user.role === "admin" ? [{ href: "/admin/users", label: "Panel users & permissions", icon: "userCog" as const }] : []),
    ...(allow("bug-reports") ? [{ href: "/admin/bug-reports", label: "Website errors & reports", icon: "alert" as const }] : []),
    ...(allow("audit") ? [{ href: "/admin/audit", label: "Audit log", icon: "trail" as const }, { href: "/admin/proof", label: "Proof dashboard", icon: "trail" as const }, { href: "/admin/content-inventory", label: "Content inventory", icon: "layers" as const }] : []),
  ];
  if (system.length) nav.push({ key: "system", label: "Administration", icon: "gear", items: system });
  nav.push({ key: "my-profile", label: "My profile", icon: "user", href: "/admin/my-profile" });
  return nav;
}
