import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdminUser } from "@/lib/auth";
import { canAccess, enforcePathAccess, currentAdminPath } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { AdminShell, type AdminNavNode } from "@/components/admin/shell";
import { LiveChatNotifier } from "@/components/admin/live-chat-notifier";
import { buildAdminNav, RECORD_MODULES } from "@/lib/admin-portals";
import { SALES_ENQUIRY_WHERE } from "@/lib/admin-enquiries";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · SAVO Admin" },
  robots: { index: false, follow: false, nocache: true },
};
const CRUMB_LABELS: Record<string, string> = {
  "live-chat": "Live chat", enquiries: "Client enquiries", employees: "Employee Portal", clients: "Client directory",
  "client-portal": "Client Portal", "my-profile": "My profile", "bug-reports": "Website errors & reports", "hr-portal": "HR Portal",
  applications: "Applications & candidates", emails: "Mailbox", leaves: "Leave management", analytics: "Website analytics",
  "email-templates": "Email templates", "email-compose": "Send email", services: "Services", industries: "Industries",
  content: "Website content", contact: "Contact page", insights: "Insights articles", careers: "Job openings",
  "case-studies": "Case studies", hire: "Hire roles", "ai-services": "AI services", agents: "AI agents", new: "New",
  settings: "Site settings", users: "Panel users & permissions", audit: "Audit log", projects: "Projects", invoices: "Invoices & payments",
  meetings: "Meetings", payments: "Payment gateway", records: "Operational records",
  ...Object.fromEntries(RECORD_MODULES.map(m => [m.key, m.label])),
};

/** Navigation placement is not authorization. Each leaf and action retains its own section guard. */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getAdminUser();
  await enforcePathAccess(await currentAdminPath());
  if (!user) redirect("/admin/login");
  const allow = (key: string) => canAccess(user, key);
  const [newEnquiries, waiting, meetings, clients, projects, invoices] = prisma ? await Promise.all([
    allow("enquiries") ? prisma.projectEnquiry.count({ where: { AND: [SALES_ENQUIRY_WHERE, { status: "new" }] } }).catch(() => 0) : 0,
    allow("live-chat") ? prisma.chatConversation.count({ where: { status: "waiting_for_agent" } }).catch(() => 0) : 0,
    allow("clients") ? prisma.meeting.count({ where: { status: "availability_received", seenAt: null } }).catch(() => 0) : 0,
    allow("clients") ? prisma.clientUser.count().catch(() => 0) : 0,
    allow("clients") ? prisma.clientProject.count().catch(() => 0) : 0,
    allow("clients") ? prisma.invoice.count().catch(() => 0) : 0,
  ]) : [0, 0, 0, 0, 0, 0];
  const nav: AdminNavNode[] = buildAdminNav(user);
  const counts: Record<string, { count?: number; badge?: number }> = {
    "/admin/enquiries?type=Client": { badge: newEnquiries }, "/admin/live-chat": { badge: waiting },
    "/admin/meetings": { badge: meetings }, "/admin/clients": { count: clients }, "/admin/projects": { count: projects }, "/admin/invoices": { count: invoices },
  };
  for (const node of nav) {
    for (const item of node.items ?? []) Object.assign(item, counts[item.href] ?? {});
    node.badge = node.items?.reduce((sum, item) => sum + (item.badge ?? 0), 0);
  }
  return <AdminShell user={user} nav={nav} crumbLabels={CRUMB_LABELS}>
    {allow("live-chat") ? <LiveChatNotifier /> : null}
    {children}
  </AdminShell>;
}
