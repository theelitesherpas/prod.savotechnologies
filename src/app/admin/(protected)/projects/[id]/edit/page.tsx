import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdminPage } from "@/lib/permissions";
import { BackLink, Notice, PageHeader } from "@/components/admin/ui";
import { ProjectPlanForm } from "@/components/admin/project-plan-form";
import { updateProjectAction } from "../../actions";

export const metadata: Metadata = { title: "Edit project" };
const iso = (date: Date | null) => date?.toISOString().slice(0, 10) ?? "";
export default async function EditProjectPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ e?: string }> }) {
  await requireAdminPage("/admin/projects/[id]/edit");
  const { id } = await params;
  const query = await searchParams;
  if (!prisma) notFound();
  const [project, clients] = await Promise.all([
    prisma.clientProject.findUnique({ where: { id }, include: { milestones: { where: { scope: "base" }, orderBy: [{ order: "asc" }, { createdAt: "asc" }] }, invoices: { select: { id: true, status: true } } } }),
    prisma.clientUser.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, company: true, businessId: true } }),
  ]);
  if (!project) notFound();
  const revision = project.updatedAt.toISOString();
  return <div className="max-w-6xl">
    <BackLink href={`/admin/projects/${id}`} label="Project overview" />
    <PageHeader title="Edit project" description={`${project.code} · Update the client-facing plan, budget and base milestones.`} />
    {query.e ? <Notice kind="alert">{query.e}</Notice> : null}
    {project.archivedAt ? <Notice kind="alert">This project is archived. Changes are still possible, but it is hidden from the active project lists and client portal.</Notice> : null}
    <ProjectPlanForm key={revision} action={updateProjectAction} clients={clients} project={{ id: project.id, clientId: project.clientId, title: project.title, code: project.code, summary: project.summary, budget: project.budget, currency: project.currency, status: project.status, startDate: iso(project.startDate), dueDate: iso(project.dueDate), revision }} locked={project.invoices.length > 0} currencyLocked={project.budget != null && project.invoices.length > 0} milestones={project.milestones.map(m => ({ ...m, dueDate: iso(m.dueDate) }))} />
  </div>;
}
