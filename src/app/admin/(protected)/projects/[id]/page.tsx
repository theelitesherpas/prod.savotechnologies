import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BackLink, PageHeader, Notice } from "@/components/admin/ui";
import { SubmitButton, ConfirmButton } from "@/components/admin/form";
import { FormGuard } from "@/components/admin/form-guard";
import { MilestoneChip } from "@/components/portal/ui";
import {
  updateProjectAction,
  addMilestoneAction,
  cycleMilestoneAction,
  deleteMilestoneAction,
  addUpdateAction,
  deleteUpdateAction,
  deleteProjectAction,
} from "../actions";

export const metadata: Metadata = { title: "Edit project" };

export default async function EditProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; e?: string }>;
}) {
  const { id } = await params;
  const { saved, e } = await searchParams;
  if (!prisma) notFound();

  const [project, clients] = await Promise.all([
    prisma.clientProject.findUnique({
      where: { id },
      include: {
        milestones: { orderBy: [{ order: "asc" }, { createdAt: "asc" }] },
        updates: { orderBy: { createdAt: "desc" } },
        invoices: { orderBy: { issuedAt: "desc" } },
        client: { select: { id: true, name: true } },
      },
    }),
    prisma.clientUser.findMany({ orderBy: { name: "asc" } }),
  ]);
  if (!project) notFound();

  const input = "adm-input w-full";
  const iso = (d: Date | null) => (d ? new Date(d).toISOString().slice(0, 10) : "");

  return (
    <div className="max-w-4xl">
      <BackLink href="/admin/projects" label="All projects" />
      <PageHeader title={project.title} description={`${project.code} · ${project.client.name} · ${project.progress}%`} />
      {saved === "1" ? <Notice>Project saved.</Notice> : null}
      {saved === "milestone" ? <Notice>Milestones updated.</Notice> : null}
      {saved === "update" ? <Notice>Delivery log updated.</Notice> : null}
      {e ? <Notice kind="alert">{e}</Notice> : null}

      {/* Core fields */}
      <FormGuard action={updateProjectAction} className="adm-card mb-6 space-y-5 p-5">
        <input type="hidden" name="id" value={project.id} />
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="adm-label mb-1.5 block">Client</label>
            <select name="clientId" required className="adm-select w-full" defaultValue={project.clientId}>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="adm-label mb-1.5 block">Title *</label>
            <input name="title" required maxLength={140} defaultValue={project.title} className={input} />
          </div>
          <div>
            <label className="adm-label mb-1.5 block">Code</label>
            <input name="code" required maxLength={24} defaultValue={project.code} className={input} />
          </div>
          <div>
            <label className="adm-label mb-1.5 block">Status</label>
            <select name="status" defaultValue={project.status} className="adm-select w-full">
              {["planning", "in_progress", "review", "delivered", "paused", "cancelled"].map((s) => (
                <option key={s} value={s}>{s.replace("_", " ")}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="adm-label mb-1.5 block">Progress %</label>
            <input name="progress" type="number" min={0} max={100} defaultValue={project.progress} className={input} />
          </div>
          <div>
            <label className="adm-label mb-1.5 block">Start date</label>
            <input name="startDate" type="date" defaultValue={iso(project.startDate)} className={input} />
          </div>
          <div>
            <label className="adm-label mb-1.5 block">Due date</label>
            <input name="dueDate" type="date" defaultValue={iso(project.dueDate)} className={input} />
          </div>
          <div className="sm:col-span-2">
            <label className="adm-label mb-1.5 block">Summary</label>
            <textarea name="summary" rows={2} maxLength={600} defaultValue={project.summary} className={input} />
          </div>
        </div>
        <SubmitButton label="Save project" />
      </FormGuard>

      {/* Milestones */}
      <div className="adm-card mb-6 p-5">
        <p className="adm-label mb-4">Milestones</p>
        {project.milestones.length === 0 ? (
          <p className="t-caption mb-4 text-muted">None yet.</p>
        ) : (
          <ul className="mb-5 divide-y divide-border">
            {project.milestones.map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="t-sm font-medium">{m.title}</p>
                  <p className="t-caption mt-0.5 text-muted">{m.dueDate ? `due ${new Date(m.dueDate).toLocaleDateString("en-GB")}` : "no date"}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <MilestoneChip status={m.status} />
                  <form action={cycleMilestoneAction}>
                    <input type="hidden" name="id" value={m.id} />
                    <input type="hidden" name="projectId" value={project.id} />
                    <button type="submit" className="t-caption rounded-lg border border-border px-2.5 py-1.5 text-muted transition-colors hover:border-foreground/40 hover:text-foreground" title="Cycle: upcoming → current → done">
                      ⇄
                    </button>
                  </form>
                  <form action={deleteMilestoneAction}>
                    <input type="hidden" name="id" value={m.id} />
                    <input type="hidden" name="projectId" value={project.id} />
                    <button type="submit" className="px-2 text-muted hover:text-error" aria-label={`Delete ${m.title}`}>×</button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
        <FormGuard action={addMilestoneAction} className="grid gap-3 sm:grid-cols-[1fr_10rem_6rem_auto] sm:items-end">
          <input type="hidden" name="projectId" value={project.id} />
          <div>
            <label className="adm-label mb-1 block">New milestone</label>
            <input name="title" required maxLength={140} className={input} placeholder="Design system sign-off" />
          </div>
          <div>
            <label className="adm-label mb-1 block">Due</label>
            <input name="dueDate" type="date" className={input} />
          </div>
          <div>
            <label className="adm-label mb-1 block">Order</label>
            <input name="order" type="number" min={0} max={999} defaultValue={project.milestones.length + 1} className={input} />
          </div>
          <SubmitButton label="Add" />
        </FormGuard>
      </div>

      {/* Delivery log */}
      <div className="adm-card mb-6 p-5">
        <p className="adm-label mb-4">Delivery log</p>
        {project.updates.length === 0 ? (
          <p className="t-caption mb-4 text-muted">No entries yet.</p>
        ) : (
          <ul className="mb-5 divide-y divide-border">
            {project.updates.map((u) => (
              <li key={u.id} className="flex items-start justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="t-sm font-semibold">{u.title}</p>
                  {u.body ? <p className="t-caption mt-1 leading-relaxed text-muted">{u.body}</p> : null}
                  <p className="t-caption mt-1 text-muted/60">{new Date(u.createdAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}</p>
                </div>
                <form action={deleteUpdateAction}>
                  <input type="hidden" name="id" value={u.id} />
                  <input type="hidden" name="projectId" value={project.id} />
                  <button type="submit" className="px-2 text-muted hover:text-error" aria-label={`Delete ${u.title}`}>×</button>
                </form>
              </li>
            ))}
          </ul>
        )}
        <FormGuard action={addUpdateAction} className="space-y-3">
          <input type="hidden" name="projectId" value={project.id} />
          <div>
            <label className="adm-label mb-1 block">Post an update</label>
            <input name="title" required maxLength={140} className={input} placeholder="Weekly demo shipped — checkout v2 live on staging" />
          </div>
          <textarea name="body" rows={2} maxLength={2000} className={input} placeholder="Details the client sees on their dashboard (optional)" />
          <SubmitButton label="Post update" />
        </FormGuard>
      </div>

      {/* Danger zone */}
      <form action={deleteProjectAction} className="adm-card flex flex-wrap items-center justify-between gap-4 border-[rgb(179_38_30/0.25)] p-5">
        <div>
          <p className="adm-label text-[rgb(179_38_30)]">Delete project</p>
          <p className="t-caption mt-1 text-muted">Removes milestones, log entries and unlinks invoices. Cannot be undone.</p>
        </div>
        <input type="hidden" name="id" value={project.id} />
        <ConfirmButton label="Delete project" confirmLabel="Really delete?" />
      </form>
    </div>
  );
}
