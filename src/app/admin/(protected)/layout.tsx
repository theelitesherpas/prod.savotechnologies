import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminShell, type AdminNavNode } from "@/components/admin/shell";
import { COLLECTION_KEYS, CONTENT_COLLECTIONS } from "@/lib/content-registry";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · SAVO Admin" },
  robots: { index: false, follow: false, nocache: true },
};

const CRUMB_LABELS: Record<string, string> = {
  enquiries: "Enquiries",
  analytics: "Analytics",
  "email-templates": "Email templates",
  "email-compose": "Send email",
  services: "Services",
  industries: "Industries",
  content: "Content",
  insights: "Insights articles",
  careers: "Careers roles",
  "case-studies": "Case studies",
  hire: "Hire roles",
  "ai-services": "AI services",
  agents: "AI agents",
  new: "New",
  settings: "Site settings",
  users: "Panel users",
  audit: "Audit log",
};

/**
 * Protected admin shell. Middleware blocks cookie-less requests at the
 * edge; this layout performs the real session check on every render,
 * assembles the grouped side navigation with live counts and hands the
 * canvas to the page.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getAdminUser();
  if (!user) redirect("/admin/login");

  // Live counts for the spine (null-safe: a missing DB keeps the panel usable).
  const [newEnquiries, contentCounts, servicesCount, industriesCount, clientCount, projectCount, invoiceCount] = prisma
    ? await Promise.all([
        prisma.projectEnquiry.count({ where: { status: "new" } }).catch(() => 0),
        prisma.contentItem
          .groupBy({ by: ["collection"], _count: { _all: true } })
          .then((rows) => Object.fromEntries(rows.map((r) => [r.collection, r._count._all])))
          .catch((): Record<string, number> => ({})),
        prisma.service.count({ where: { active: true } }).catch(() => 0),
        prisma.industry.count({ where: { active: true } }).catch(() => 0),
        prisma.clientUser.count().catch(() => 0),
        prisma.clientProject.count().catch(() => 0),
        prisma.invoice.count().catch(() => 0),
      ])
    : [0, {} as Record<string, number>, 0, 0, 0, 0, 0];

  const contentItems = COLLECTION_KEYS.filter((key) => key !== "case-studies").map((key) => ({
    href: `/admin/content/${key}`,
    label: CONTENT_COLLECTIONS[key].label,
    icon: CONTENT_COLLECTIONS[key].icon,
    count: contentCounts[key] ?? 0,
  }));

  const nav: AdminNavNode[] = [
    { key: "overview", label: "Dashboard", icon: "gauge", href: "/admin" },
    { key: "analytics", label: "Analytics", icon: "trend", href: "/admin/analytics" },
    { key: "email-templates", label: "Email templates", icon: "pen", href: "/admin/email-templates" },
    { key: "email-compose", label: "Send email", icon: "external", href: "/admin/email-compose" },
    {
      key: "leads",
      label: "Enquiries",
      icon: "inbox",
      href: "/admin/enquiries",
      badge: newEnquiries,
    },
    {
      key: "content",
      label: "Content",
      icon: "layers",
      items: [
        { href: "/admin/services", label: "Services", icon: "layers", count: servicesCount },
        { href: "/admin/industries", label: "Industries", icon: "grid", count: industriesCount },
        {
          href: "/admin/case-studies",
          label: "Case studies",
          icon: "folder",
          count: contentCounts["case-studies"] ?? 0,
        },
        ...contentItems,
      ],
    },
    {
      key: "clients",
      label: "Client Portal",
      icon: "user",
      items: [
        { href: "/admin/clients", label: "Clients", icon: "user", count: clientCount },
        { href: "/admin/projects", label: "Projects", icon: "folder", count: projectCount },
        { href: "/admin/invoices", label: "Payments", icon: "gauge", count: invoiceCount },
      ],
    },
    {
      key: "config",
      label: "Configuration",
      icon: "gear",
      items: [
        { href: "/admin/settings", label: "Site settings", icon: "gear" },
        ...(user.role === "admin"
          ? [{ href: "/admin/users", label: "Panel users", icon: "userCog" as const }]
          : []),
      ],
    },
    { key: "system", label: "Audit log", icon: "trail", href: "/admin/audit" },
  ];

  return (
    <AdminShell user={user} nav={nav} crumbLabels={CRUMB_LABELS}>
      {children}
    </AdminShell>
  );
}
