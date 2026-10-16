import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdminPage } from "@/lib/permissions";
import { BackLink, Notice, PageHeader } from "@/components/admin/ui";
import { ProjectPlanForm } from "@/components/admin/project-plan-form";
import { createProjectAction } from "../actions";

export const metadata: Metadata = { title: "Add a project" };
export default async function NewProjectPage({ searchParams }: { searchParams: Promise<{ client?: string; e?: string }> }) {
  await requireAdminPage("/admin/projects/new");
  const query = await searchParams;
  if (!prisma) notFound();
  const clients = await prisma.clientUser.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, company: true, businessId: true } });
  return <div className="max-w-6xl">
    <BackLink href="/admin/projects" label="All projects" />
    <PageHeader title="Add new project" description="Set up the client, agreed scope, budget and delivery milestones." />
    {query.e ? <Notice kind="alert">{query.e}</Notice> : null}
    <ProjectPlanForm action={createProjectAction} clients={clients} selectedClient={query.client} />
  </div>;
}
