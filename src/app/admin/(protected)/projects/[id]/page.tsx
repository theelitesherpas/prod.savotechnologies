import { PagedContent } from "@/components/admin/paged-content";
import { requireAdminPage } from "@/lib/permissions";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { BackLink, PageHeader, Notice } from "@/components/admin/ui";
import { SubmitButton, ConfirmButton } from "@/components/admin/form";
import { FormGuard } from "@/components/admin/form-guard";
import { ProjectInvoiceForm } from "@/components/admin/project-invoice-form";
import { MilestoneChip, MilestonePaymentChip } from "@/components/portal/ui";
import { majorUnits, projectFinancials, milestonePaymentStatus } from "@/lib/project-finance";
import { invoiceMoney } from "@/lib/invoice-document";
import s from "@/components/admin/project-plan.module.css";
import { archiveProjectAction, restoreProjectAction, cycleMilestoneAction, saveAdditionalWorkAction, changeProjectStatusAction, addUpdateAction, deleteUpdateAction } from "../actions";

export const metadata: Metadata = { title: "Manage project" };
export default async function EditProjectPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string; e?: string; invoice?: string }> }) {
  await requireAdminPage("/admin/projects/[id]"); const { id } = await params; const { saved, e, invoice } = await searchParams; if (!prisma) notFound();
  const project = await prisma.clientProject.findUnique({ where: { id }, include: { milestones: { orderBy: [{ order: "asc" }, { createdAt: "asc" }] }, updates: { orderBy: { createdAt: "desc" } }, invoices: { orderBy: { issuedAt: "desc" } }, client: { select: { name: true } } } }); if (!project) notFound();
  const iso = (d: Date | null) => d?.toISOString().slice(0, 10) ?? "";
  const finance = projectFinancials(project, project.milestones, project.invoices.filter(i => i.clientId === project.clientId));
  const money = (amount: number | null) => amount == null ? "Not set" : invoiceMoney(amount, project.currency);
  const revision = project.updatedAt.toISOString();
  const extras = project.milestones.filter(m => m.scope === "additional");
  const milestoneTitles = new Map(project.milestones.map(m => [m.id, m.title]));
  return <div className="max-w-6xl">
    <BackLink href="/admin/projects" label="All projects"/>
    <PageHeader title={project.title} description={`${project.code} · ${project.client.name} · ${project.progress}% delivery progress`} actions={<><Link href={`/admin/projects/${id}/edit`} className="inline-flex min-h-11 items-center rounded-lg border border-border px-4 text-sm font-semibold hover:bg-surface-secondary">Edit project plan</Link>{project.archivedAt ? <form action={restoreProjectAction}><input type="hidden" name="id" value={id}/><SubmitButton label="Restore project"/></form> : <form action={archiveProjectAction}><input type="hidden" name="id" value={id}/><ConfirmButton label="Delete" confirmLabel="Confirm archive"/></form>}</>}/>
    {saved ? <Notice>Changes saved. The client portal has been updated.</Notice> : null}{e ? <Notice kind="alert">{e}</Notice> : null}
    {project.archivedAt ? <Notice kind="alert">This project is archived and hidden from active project lists and the client portal. Its invoices, reference and delivery history are preserved; restore it at any time.</Notice> : null}
    {project.budget == null ? <Notice>This legacy project needs a base budget and milestone cost allocation before additional paid work or automatic payment completion can be used.</Notice> : null}
    <section className={`adm-card ${s.panel}`} aria-label="Project financial summary"><dl className={s.summary}>{[["Base budget", project.budget], ["Additional work", finance.additional], ["Agreed total", finance.total], ["Paid", finance.paid], ["Balance against total", finance.balance], ["Unpaid issued invoices", finance.invoicedDue]].map(([label, value]) => <div key={String(label)}><dt>{label}</dt><dd>{money(value as number | null)}</dd></div>)}</dl><p className={s.hint}>All amounts are {project.currency}. Payment completion includes base scope plus additional work, not just the first issued invoice.</p>
      <div className={s.controls}>{project.status !== "delivered" ? <form action={changeProjectStatusAction}><input type="hidden" name="id" value={id}/><input type="hidden" name="revision" value={revision}/><input type="hidden" name="status" value="delivered"/><ConfirmButton label="Complete project" confirmLabel="Confirm completion" tone="quiet"/></form> : null}{project.status !== "cancelled" ? <form action={changeProjectStatusAction}><input type="hidden" name="id" value={id}/><input type="hidden" name="revision" value={revision}/><input type="hidden" name="status" value="cancelled"/><ConfirmButton label="Cancel project" confirmLabel="Confirm cancellation"/></form> : <form action={changeProjectStatusAction}><input type="hidden" name="id" value={id}/><input type="hidden" name="revision" value={revision}/><input type="hidden" name="status" value="in_progress"/><SubmitButton label="Reopen project" compact/></form>}</div>
      <p className={s.hint}>Manual completion/cancellation does not change invoices or mark unfinished work done. Existing financial records are retained.</p>
    </section>
    <section className={`adm-card ${s.panel}`} aria-labelledby="project-overview"><h2 id="project-overview">Project overview</h2><p className={s.hint}>Client, agreed scope and key delivery dates.</p><dl className={s.summary}>{[["Client", project.client.name], ["Project reference", project.code], ["Start date", project.startDate ? iso(project.startDate) : "Not set"], ["Estimated delivery", project.dueDate ? iso(project.dueDate) : "Not set"]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl><p className="mt-5 whitespace-pre-wrap text-sm leading-7 text-muted">{project.summary || "No project description has been added."}</p></section>
    <section className={`adm-card ${s.panel} ${s.deliveryPanel}`} aria-labelledby="delivery-statuses">
      <header className={s.deliveryHeading}>
        <div>
          <h2 id="delivery-statuses">Delivery status by milestone</h2>
          <p className={s.deliveryHint}>Delivery progress and payment are separate. Payment status is based on invoices linked to each milestone.</p>
        </div>
        <span className={s.deliveryCount}>{project.milestones.length} {project.milestones.length === 1 ? "milestone" : "milestones"}</span>
      </header>
      {project.milestones.length ? <>
        <div className={s.deliveryLabels} aria-hidden="true"><span>Milestone</span><span>Delivery</span><span>Payment</span><span>Update delivery</span></div>
        <ol className={s.deliveryList}>{project.milestones.map(m => {
          const payment = milestonePaymentStatus(m.amount, project.invoices.filter(i => i.milestoneId === m.id));
          return <li className={s.deliveryRow} key={m.id}>
            <div className={s.milestoneInfo}>
              <h3>{m.title}</h3>
              <span className={s.scopeLabel}>{m.scope === "additional" ? "Additional work" : "Base milestone"}</span>
              {m.description ? <p className={s.milestoneDescription}>{m.description}</p> : null}
              <div className={s.milestoneMeta}><strong>{money(m.amount)}</strong>{m.dueDate ? <span>Due {iso(m.dueDate)}</span> : null}</div>
              <Link className={s.raiseInvoiceLink} href={`/admin/projects/${id}?invoice=${m.id}#raise-invoice`}>Raise invoice for milestone</Link>
            </div>
            <div className={s.deliveryState}>
              <span className={s.mobileLabel}>Delivery</span>
              <MilestoneChip status={m.status}/>
            </div>
            <div className={s.deliveryState}>
              <span className={s.mobileLabel}>Payment</span>
              <MilestonePaymentChip status={payment}/>
            </div>
            <form action={cycleMilestoneAction} className={s.deliveryForm} aria-label={`Update delivery status for ${m.title}`}>
              <input type="hidden" name="projectId" value={id}/>
              <input type="hidden" name="id" value={m.id}/>
              <label htmlFor={`delivery-${m.id}`}>Set delivery status</label>
              <div className={s.deliveryControls}>
                <select id={`delivery-${m.id}`} name="status" defaultValue={m.status} className="adm-select"><option value="pending">Upcoming</option><option value="in_progress">In progress</option><option value="done">Done</option></select>
                <SubmitButton compact label="Save"/>
              </div>
            </form>
          </li>;
        })}</ol>
      </> : <div className={s.emptyMilestones}>No milestones have been added. <Link href={`/admin/projects/${id}/edit`}>Edit the project plan</Link> to add them.</div>}
    </section>
    <section className={`adm-card ${s.panel}`} aria-labelledby="additional-scope"><h2 id="additional-scope">Additional work</h2><p className={s.hint}>Keep scope changes separate from the fixed base budget. Each item adds to the agreed total and is visible in the client portal. Update the estimated project delivery date above if the scope changes the schedule.</p>
      {extras.map(m => <details key={m.id} className={s.milestone}><summary className="cursor-pointer py-3 font-medium">{m.title} · {money(m.amount)} — edit additional work</summary><FormGuard action={saveAdditionalWorkAction} className={s.extraForm}><input type="hidden" name="projectId" value={id}/><input type="hidden" name="id" value={m.id}/><input type="hidden" name="revision" value={revision}/><AdditionalFields prefix={m.id} work={{ ...m, dueDate: iso(m.dueDate) }}/><SubmitButton label="Save additional work"/></FormGuard></details>)}
      <FormGuard action={saveAdditionalWorkAction} className={s.extraForm}><input type="hidden" name="projectId" value={id}/><input type="hidden" name="revision" value={revision}/><h3 className="font-semibold">Add scope item</h3><AdditionalFields prefix="new"/><SubmitButton label="Add additional work"/></FormGuard>
    </section>
    <section className={`adm-card ${s.panel}`} aria-labelledby="project-billing"><h2 id="project-billing">Billing</h2><p className={s.hint}>Invoices must belong to this client and use {project.currency}. Linking a milestone to an invoice tracks that milestone&#39;s payment: paid invoice, paid milestone; otherwise it stays Unpaid until payment. Marking the entire agreed total paid automatically completes a non-cancelled project.</p>
      <ProjectInvoiceForm key={invoice ?? "raise"} projectId={id} clientId={project.clientId} currency={project.currency} today={iso(new Date())} milestones={project.milestones.map(m => ({ id: m.id, title: m.title, amount: m.amount, scope: m.scope, status: m.status }))} initialMilestoneId={invoice && project.milestones.some(m => m.id === invoice) ? invoice : ""} open={!!invoice && project.milestones.some(m => m.id === invoice)} invoiceCount={project.invoices.length}/>
      <div className="mt-8"/><h3 className="font-semibold">Linked invoices</h3><PagedContent as="ul" label="project invoices" className="divide-y divide-border">{project.invoices.map(inv => <li className="flex flex-wrap justify-between gap-3 py-4" key={inv.id}><Link className="text-accent underline" href={`/admin/invoices/${inv.id}`}>{inv.number}</Link><span>{invoiceMoney(inv.amount, inv.currency)} · {inv.status}{inv.milestoneId && milestoneTitles.get(inv.milestoneId) ? ` · ${milestoneTitles.get(inv.milestoneId)}` : ""}</span></li>)}</PagedContent></section>
    <section className={`adm-card ${s.panel}`} aria-labelledby="project-log"><h2 id="project-log">Delivery log</h2><PagedContent as="ul" label="delivery updates" className="divide-y divide-border">{project.updates.map(u => <li key={u.id} className="flex items-start justify-between gap-4 py-4"><div><p className="font-semibold">{u.title}</p><p className="mt-2 whitespace-pre-wrap text-sm text-muted">{u.body}</p><p className="mt-2 text-xs text-muted">{iso(u.createdAt)}</p></div><form action={deleteUpdateAction}><input type="hidden" name="id" value={u.id}/><input type="hidden" name="projectId" value={id}/><ConfirmButton label="Remove update" confirmLabel="Confirm"/></form></li>)}</PagedContent><FormGuard action={addUpdateAction} className={s.extraForm}><input type="hidden" name="projectId" value={id}/><div><label htmlFor="log-title">Update title</label><input id="log-title" name="title" required minLength={2} maxLength={140} className="adm-input w-full"/></div><div><label htmlFor="log-body">Update details</label><textarea id="log-body" name="body" maxLength={2000} rows={3} className="adm-input w-full"/></div><SubmitButton label="Post update and notify client"/></FormGuard></section>
  </div>;
}
function AdditionalFields({ prefix, work }: { prefix: string; work?: { title: string; description: string; amount: number | null; status: string; dueDate: string } }) {
  return <><div className={s.grid}><div><label htmlFor={`extra-title-${prefix}`}>Work title</label><input id={`extra-title-${prefix}`} name="title" required minLength={2} maxLength={140} defaultValue={work?.title} className="adm-input w-full"/></div><div><label htmlFor={`extra-cost-${prefix}`}>Additional cost (project currency)</label><input id={`extra-cost-${prefix}`} name="amountMajor" type="number" min="0.01" max="21474836.47" step="0.01" required defaultValue={majorUnits(work?.amount)} className="adm-input w-full"/></div><div><label htmlFor={`extra-date-${prefix}`}>Estimated item delivery (optional)</label><input id={`extra-date-${prefix}`} name="dueDate" type="date" defaultValue={work?.dueDate} className="adm-input w-full"/></div><div><label htmlFor={`extra-status-${prefix}`}>Delivery status</label><select id={`extra-status-${prefix}`} name="status" defaultValue={work?.status || "pending"} className="adm-select w-full"><option value="pending">Upcoming</option><option value="in_progress">In progress</option><option value="done">Done</option></select></div><div className={s.full}><label htmlFor={`extra-description-${prefix}`}>Scope description</label><textarea id={`extra-description-${prefix}`} name="description" rows={3} maxLength={2000} defaultValue={work?.description} className="adm-input w-full"/></div></div></>;
}
