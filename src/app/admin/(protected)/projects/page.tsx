import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader, Notice, EmptyState } from "@/components/admin/ui";
import { SubmitButton } from "@/components/admin/form";
import { FormGuard } from "@/components/admin/form-guard";
import { createProjectAction } from "./actions";
import { StatusChip } from "@/components/portal/ui";

export const metadata: Metadata = { title: "Projects" };

export default async function AdminProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; deleted?: string; e?: string; client?: string }>;
}) {
  const sp = await searchParams;
  const projects = prisma
    ? await prisma.clientProject
        .findMany({
          orderBy: { updatedAt: "desc" },
          include: { client: { select: { id: true, name: true, company: true } } },
        })
        .catch(() => [])
    : [];
  const clients = prisma ? await prisma.clientUser.findMany({ orderBy: { name: "asc" } }).catch(() => []) : [];

  const input = "adm-input w-full";

  return (
    <div className="max-w-4xl">
      <PageHeader
        title="Projects"
        description="Client projects published to the portal - status, progress, milestones and the delivery log."
      />

      {sp.saved ? <Notice>Project saved.</Notice> : null}
      {sp.deleted ? <Notice>Project deleted.</Notice> : null}
      {sp.e ? <Notice kind="alert">{sp.e}</Notice> : null}

      {projects.length > 0 ? (
        <ul className="adm-card mb-10 divide-y divide-border">
          {projects.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center gap-x-5 gap-y-3 px-4 py-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/admin/projects/${p.id}`} className="truncate text-[0.9375rem] font-semibold text-foreground hover:text-accent">
                    {p.title}
                  </Link>
                  <StatusChip status={p.status} />
                </div>
                <p className="t-caption mt-1 text-muted">
                  <span className="tnum">{p.code}</span> · {p.client.name}
                  {p.client.company ? ` (${p.client.company})` : ""} · {p.progress}%
                </p>
              </div>
              <Link
                href={`/admin/projects/${p.id}`}
                className="t-caption rounded-lg border border-border px-3 py-1.5 text-muted transition-colors hover:border-foreground/40 hover:text-foreground"
              >
                Edit
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState title="No projects yet" message="Create the first project below (a client account is needed first)." />
      )}

      <FormGuard action={createProjectAction} className="adm-card space-y-5 p-5">
        <p className="adm-label">New project</p>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="adm-label mb-1.5 block" htmlFor="pj-client">Client *</label>
            <select id="pj-client" name="clientId" required className="adm-select w-full">
              {clients.length === 0 ? <option value="">- create a client first -</option> : null}
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}{c.company ? ` · ${c.company}` : ""}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="adm-label mb-1.5 block" htmlFor="pj-title">Title *</label>
            <input id="pj-title" name="title" required maxLength={140} className={input} placeholder="Ecommerce platform rebuild" />
          </div>
          <div>
            <label className="adm-label mb-1.5 block" htmlFor="pj-code">Code</label>
            <input id="pj-code" name="code" maxLength={24} className={input} placeholder="auto (SAVO-2026-001)" />
          </div>
          <div>
            <label className="adm-label mb-1.5 block" htmlFor="pj-status">Status</label>
            <select id="pj-status" name="status" defaultValue="in_progress" className="adm-select w-full">
              {["planning", "in_progress", "review", "delivered", "paused", "cancelled"].map((s) => (
                <option key={s} value={s}>{s.replace("_", " ")}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="adm-label mb-1.5 block" htmlFor="pj-progress">Progress %</label>
            <input id="pj-progress" name="progress" type="number" min={0} max={100} defaultValue={0} className={input} />
          </div>
          <div>
            <label className="adm-label mb-1.5 block" htmlFor="pj-start">Start date</label>
            <input id="pj-start" name="startDate" type="date" className={input} />
          </div>
          <div>
            <label className="adm-label mb-1.5 block" htmlFor="pj-due">Due date</label>
            <input id="pj-due" name="dueDate" type="date" min={new Date().toISOString().slice(0, 10)} className={input} />
          </div>
          <div className="sm:col-span-2">
            <label className="adm-label mb-1.5 block" htmlFor="pj-summary">Summary</label>
            <textarea id="pj-summary" name="summary" rows={2} maxLength={600} className={input} placeholder="One or two lines the client sees on their dashboard." />
          </div>
        </div>
        <SubmitButton label="Create project" />
      </FormGuard>
    </div>
  );
}
