import { requireAdminPage } from "@/lib/permissions";
import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader, Notice, EmptyState } from "@/components/admin/ui";
import { SubmitButton, ConfirmButton } from "@/components/admin/form";
import { ConfirmAction } from "@/components/admin/confirm-dialog";
import { FormGuard } from "@/components/admin/form-guard";
import { InvoiceLinkFields } from "@/components/admin/invoice-link-fields";
import { BusinessIdField } from "@/components/admin/business-id-field";
import { InvoicePaymentField } from "@/components/admin/invoice-payment-field";
import { InvoiceStatusChip, money } from "@/components/portal/ui";
import { createInvoiceAction, markInvoicePaidAction, deleteInvoiceAction } from "./actions";

export const metadata: Metadata = { title: "Payments" };

export default async function AdminInvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; deleted?: string; e?: string; client?: string }>;
}) {
  await requireAdminPage("/admin/invoices");
  const sp = await searchParams;
  const [invoices, clients, projects, milestones] = prisma
    ? await Promise.all([
        prisma.invoice.findMany({ orderBy: { issuedAt: "desc" }, include: { client: { select: { name: true } }, project: { select: { code: true } }, milestone: { select: { title: true } } } }).catch(() => []),
        prisma.clientUser.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, businessId: true } }).catch(() => []),
        prisma.clientProject.findMany({ orderBy: { title: "asc" }, select: { id: true, title: true, code: true, clientId: true, currency: true, budget: true } }).catch(() => []),
        prisma.projectMilestone.findMany({ orderBy: [{ projectId: "asc" }, { order: "asc" }, { createdAt: "asc" }], select: { id: true, projectId: true, title: true, scope: true, amount: true, project: { select: { currency: true } } } }).catch(() => []),
      ])
    : [[], [], [], []];

  const input = "adm-input w-full";
  const iso = (d: Date | null) => (d ? new Date(d).toISOString().slice(0, 10) : "");

  return (
    <div className="max-w-4xl">
      <PageHeader
        title="Payments"
        description="Invoices shown in each client's portal. Amounts in the form are major units (e.g. 2500.50) and stored exactly."
      />

      {sp.saved ? <Notice>{sp.saved === "paid" ? "Invoice marked paid." : sp.saved === "created" ? "Invoice created." : "Invoice saved."}</Notice> : null}
      {sp.deleted ? <Notice>Invoice deleted.</Notice> : null}
      {sp.e ? <Notice kind="alert">{sp.e}</Notice> : null}

      {invoices.length > 0 ? (
        <ul className="adm-card mb-10 divide-y divide-border">
          {invoices.map((inv) => (
            <li key={inv.id} className="flex flex-wrap items-center gap-x-5 gap-y-3 px-4 py-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/admin/invoices/${inv.id}`} className="tnum text-[0.9375rem] font-semibold text-foreground hover:text-accent">
                    {inv.number}
                  </Link>
                  <InvoiceStatusChip status={inv.status} />
                </div>
                <p className="t-caption mt-1 text-muted">
                  {inv.client.name}
                  {inv.project ? ` · ${inv.project.code}` : ""}{inv.milestone ? ` · ${inv.milestone.title}` : ""} · issued {new Date(inv.issuedAt).toLocaleDateString("en-GB")}
                </p>
              </div>
              <p className="t-sm font-semibold tnum">{money(inv.amount, inv.currency)}</p>
              <div className="flex items-center gap-2">
                {["sent", "overdue"].includes(inv.status) ? (
                  <ConfirmAction
                    action={markInvoicePaidAction}
                    id={inv.id}
                    label="Mark paid"
                    title="Mark this invoice as paid?"
                    description={`Invoice ${inv.number} for ${inv.client.name} will be recorded as paid and the client will receive the paid-confirmation email.`}
                    confirmLabel="Yes, mark paid"
                    tone="success"
                    compact
                  />
                ) : null}
                <Link href={`/admin/invoices/${inv.id}`} className="t-caption rounded-lg border border-border px-3 py-1.5 text-muted transition-colors hover:border-foreground/40 hover:text-foreground">
                  Edit
                </Link>
                <form action={deleteInvoiceAction}>
                  <input type="hidden" name="id" value={inv.id} />
                  <ConfirmButton label="Del" confirmLabel="Sure?" />
                </form>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState title="No invoices yet" message="Create the first invoice below." />
      )}

      <FormGuard action={createInvoiceAction} className="adm-card space-y-5 p-5">
        <p className="adm-label">New invoice</p>
        <div className="grid gap-5 sm:grid-cols-2">
          <InvoiceLinkFields clients={clients} projects={projects} initialClient={sp.client} milestones={milestones.map(m => ({ id: m.id, projectId: m.projectId, label: `${m.title}${m.amount != null ? ` · ${money(m.amount, m.project.currency)}` : ""}${m.scope === "additional" ? " · additional" : ""}` }))}/>
          <BusinessIdField type="IN" label="Invoice ID" id="invoice-reference" resetKey={invoices.length}/>

          <div>
            <label className="adm-label mb-1.5 block">Amount *</label>
            <input name="amountMajor" type="number" step="0.01" min={0} required className={input} placeholder="2500.00" />
          </div>

          <div>
            <label className="adm-label mb-1.5 block">Status</label>
            <select name="status" defaultValue="sent" className="adm-select w-full">
              {["draft", "sent", "paid", "overdue", "cancelled"].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="adm-label mb-1.5 block">Issued</label>
            <input name="issuedAt" type="date" defaultValue={iso(new Date())} className={input} />
          </div>
          <div>
            <label className="adm-label mb-1.5 block">Due</label>
            <input name="dueDate" type="date" className={input} />
          </div>
          <InvoicePaymentField/>
          <div className="sm:col-span-2">
            <label className="adm-label mb-1.5 block">Notes</label>
            <input name="notes" maxLength={500} className={input} placeholder="Phase 2 milestone payment (optional)" />
          </div>
        </div>
        <SubmitButton label="Create invoice" />
      </FormGuard>
    </div>
  );
}
