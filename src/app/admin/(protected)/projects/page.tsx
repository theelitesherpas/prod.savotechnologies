import { requireAdminPage } from "@/lib/permissions";
import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader, Notice, EmptyState } from "@/components/admin/ui";
import { ProjectPlanForm } from "@/components/admin/project-plan-form";
import { createProjectAction } from "./actions";
import { StatusChip } from "@/components/portal/ui";
import { invoiceMoney } from "@/lib/invoice-document";

export const metadata: Metadata = { title: "Projects" };
export default async function AdminProjectsPage({ searchParams }: { searchParams: Promise<{ saved?: string; e?: string; client?: string }> }) {
  await requireAdminPage("/admin/projects"); const sp = await searchParams;
  const projects = prisma ? await prisma.clientProject.findMany({ orderBy: { updatedAt: "desc" }, include: { client: { select: { name: true, company: true } } } }) : [];
  const clients = prisma ? await prisma.clientUser.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, company: true, businessId: true } }) : [];
  return <div className="max-w-6xl">
    <PageHeader title="Projects" description="Plan the agreed budget and milestones, manage delivery, and keep each client informed."/>
    {sp.saved ? <Notice>Project saved.</Notice> : null}{sp.e ? <Notice kind="alert">{sp.e}</Notice> : null}
    {projects.length ? <ul className="adm-card mb-8 divide-y divide-border">{projects.map(p => <li key={p.id} className="flex flex-wrap items-center justify-between gap-4 p-5"><div className="min-w-0"><Link href={`/admin/projects/${p.id}`} className="font-semibold hover:text-accent">{p.title}</Link><p className="t-caption mt-2 text-muted">{p.code} · {p.client.name} · {p.progress}% delivery progress · {p.budget == null ? "Base budget not set" : `Base budget ${invoiceMoney(p.budget, p.currency)}`}</p></div><div className="flex items-center gap-4"><StatusChip status={p.status}/><Link href={`/admin/projects/${p.id}`} className="inline-flex min-h-11 items-center rounded-lg border border-border px-4 text-sm">Manage project</Link></div></li>)}</ul> : <EmptyState title="No projects yet" message="Choose a client and define the first project's budget and delivery plan below."/>}
    <ProjectPlanForm action={createProjectAction} clients={clients} selectedClient={sp.client}/>
  </div>;
}
