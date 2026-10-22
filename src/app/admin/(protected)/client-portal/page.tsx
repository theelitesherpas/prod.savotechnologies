import { requireAdminPage } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { PageHeader, Notice, StatTile } from "@/components/admin/ui";
import { PortalDirectory } from "@/components/admin/portal-directory";
export const metadata = { title: "Client Portal" };
export const dynamic = "force-dynamic";
export default async function ClientPortalPage() {
  const user = await requireAdminPage("/admin/client-portal");
  const counts = prisma ? await Promise.all([
    prisma.clientUser.count({ where: { active: true } }),
    prisma.clientProject.count({ where: { status: { in: ["planning", "in_progress", "review"] }, archivedAt: null } }),
    prisma.invoice.count({ where: { status: { in: ["sent", "overdue"] } } }),
    prisma.meeting.count({ where: { status: "availability_received", deletedAt: null } }),
  ]).catch(() => null) : null;
  return <>
    <PageHeader title="Client Portal" description="Manage the client relationship from enquiry through delivery, invoicing and ongoing support. Each section keeps its existing access permissions." />
    {counts ? <div className="mb-7 grid grid-cols-2 gap-4 xl:grid-cols-4"><StatTile label="Active clients" value={counts[0]} href="/admin/clients" icon="user" /><StatTile label="Active projects" value={counts[1]} href="/admin/projects" icon="folder" /><StatTile label="Outstanding invoices" value={counts[2]} href="/admin/invoices" icon="gauge" /><StatTile label="Meeting responses" value={counts[3]} href="/admin/meetings" icon="chat" /></div> : <Notice kind="alert">Client summary unavailable. Check the database connection.</Notice>}
    <PortalDirectory portal="client" user={user} expanded />
    <p className="text-sm text-muted">Contacts, proposals, contracts, documents and support registers are admin-only. Existing client accounts, projects, milestones and invoice workflows are unchanged.</p>
  </>;
}
