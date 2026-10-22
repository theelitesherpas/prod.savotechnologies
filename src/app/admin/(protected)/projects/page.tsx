import type { Metadata } from "next";
import { Pagination } from "@/components/admin/pagination";
import { parseAdminPage, adminPageUrl, type PageSearch } from "@/lib/admin-pagination";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdminPage } from "@/lib/permissions";
import { invoiceMoney } from "@/lib/invoice-document";
import { StatusChip } from "@/components/portal/ui";
import { ConfirmButton } from "@/components/admin/form";
import { EmptyState, Notice, PageHeader } from "@/components/admin/ui";
import { archiveProjectAction, restoreProjectAction } from "./actions";
import styles from "./projects.module.css";

export const metadata: Metadata = { title: "Projects" };
type Query = { saved?: string; e?: string; archived?: string; showArchived?: string; client?: string } & PageSearch;

export default async function AdminProjectsPage({ searchParams }: { searchParams: Promise<Query> }) {
  await requireAdminPage("/admin/projects");
  const query = await searchParams;
  const showArchived = query.showArchived === "1";
  const where = { archivedAt: showArchived ? { not: null } : null, ...(query.client ? { clientId: query.client } : {}) };
  const matchingTotal = prisma ? await prisma.clientProject.count({ where }) : 0;
  const paging = parseAdminPage(query, matchingTotal);
  const projects = prisma ? await prisma.clientProject.findMany({
    where, take: paging.take, skip: paging.skip,
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    include: { client: { select: { name: true, company: true } }, _count: { select: { milestones: true, invoices: true } } },
  }) : [];
  const total = matchingTotal;

  return <div className="max-w-6xl">
    <PageHeader title="Projects" description="A clear view of every client engagement, its delivery progress and agreed budget." actions={<Link className={styles.primaryAction} href="/admin/projects/new"><span aria-hidden="true">＋</span> Add new project</Link>} />
    {query.saved ? <Notice>Project {query.saved === "archived" ? "archived" : "restored"}. Financial records and project history are preserved.</Notice> : null}
    {query.e ? <Notice kind="alert">{query.e}</Notice> : null}

    <div className={styles.toolbar}>
      <div><strong>{showArchived ? "Archived projects" : "Active projects"}</strong><span>{showArchived ? `${matchingTotal} archived` : `${total} ${total === 1 ? "project" : "projects"}`}</span></div>
      <Link className={styles.toggle} href={showArchived ? "/admin/projects" : "/admin/projects?showArchived=1"}>
        {showArchived ? "View active projects" : "View archived projects"}
      </Link>
    </div>
    <p className={styles.retentionNote}>Deleting a project archives it instead of erasing it, so invoices, project references and delivery history remain intact. Archived projects can be restored.</p>

    {projects.length ? <div className={styles.tableWrap}><table className={styles.table}>
      <thead><tr><th scope="col">Project</th><th scope="col">Client</th><th scope="col">Delivery</th><th scope="col">Budget</th><th scope="col">Updated</th><th scope="col"><span className="sr-only">Actions</span></th></tr></thead>
      <tbody>{projects.map(project => <tr key={project.id}>
        <td data-label="Project"><Link className={styles.projectName} href={`/admin/projects/${project.id}`}>{project.title}</Link><span className={styles.reference}>{project.code}{project.archivedAt ? " · Archived" : ""}</span></td>
        <td data-label="Client"><span className={styles.clientName}>{project.client.name}</span>{project.client.company ? <span className={styles.reference}>{project.client.company}</span> : null}</td>
        <td data-label="Delivery"><div className={styles.delivery}><StatusChip status={project.status}/><span>{project.progress}% complete</span></div><span className={styles.reference}>{project._count.milestones} {project._count.milestones === 1 ? "milestone" : "milestones"} · {project._count.invoices} {project._count.invoices === 1 ? "invoice" : "invoices"}</span></td>
        <td data-label="Budget" className={styles.budget}>{project.budget == null ? <span className={styles.reference}>Not set</span> : invoiceMoney(project.budget, project.currency)}</td>
        <td data-label="Updated" className={styles.updated}>{project.updatedAt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</td>
        <td data-label="Actions"><div className={styles.actions}>
          <Link className={styles.secondaryAction} href={`/admin/projects/${project.id}`}>View</Link>
          {!showArchived ? <Link className={styles.secondaryAction} href={`/admin/projects/${project.id}/edit`}>Edit</Link> : null}
          {showArchived ? <form action={restoreProjectAction}><input type="hidden" name="id" value={project.id}/><button className={styles.restoreAction} type="submit">Restore</button></form> : <form action={archiveProjectAction}><input type="hidden" name="id" value={project.id}/><ConfirmButton label="Delete" confirmLabel="Confirm archive"/></form>}
        </div></td>
      </tr>)}</tbody>
    </table></div> : <EmptyState title={showArchived ? "No archived projects" : "No projects yet"} message={showArchived ? "Projects you archive will be kept here, along with their invoices and delivery history." : "Create the first project to set its scope, budget and milestones."} actions={!showArchived ? <Link className={styles.primaryAction} href="/admin/projects/new">Add new project</Link> : undefined}/>}

    <Pagination {...paging} total={matchingTotal} href={(page, size) => adminPageUrl("/admin/projects", query, page, size)} label="projects" />
    {!showArchived && projects.length === 0 && total > 0 ? <p className={styles.emptyNote}>There are active projects, but none are available in this view.</p> : null}
  </div>;
}
