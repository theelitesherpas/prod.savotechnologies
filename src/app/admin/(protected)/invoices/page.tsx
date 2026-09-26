import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader, Notice, EmptyState } from "@/components/admin/ui";
import { SubmitButton, ConfirmButton } from "@/components/admin/form";
import { FormGuard } from "@/components/admin/form-guard";
import { InvoiceStatusChip, money } from "@/components/portal/ui";
import { createInvoiceAction, markInvoicePaidAction, deleteInvoiceAction } from "./actions";

export const metadata: Metadata = { title: "Payments" };

export default async function AdminInvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; deleted?: string; e?: string }>;
}) {
  const sp = await searchParams;
  const [invoices, clients, projects] = prisma
    ? await Promise.all([
        prisma.invoice.findMany({ orderBy: { issuedAt: "desc" }, include: { client: { select: { name: true } }, project: { select: { code: true } } } }).catch(() => []),
        prisma.clientUser.findMany({ orderBy: { name: "asc" } }).catch(() => []),
        prisma.clientProject.findMany({ orderBy: { title: "asc" }, select: { id: true, title: true, code: true, clientId: true } }).catch(() => []),
      ])
    : [[], [], []];

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
                  {inv.project ? ` · ${inv.project.code}` : ""} · issued {new Date(inv.issuedAt).toLocaleDateString("en-GB")}
                </p>
              </div>
              <p className="t-sm font-semibold tnum">{money(inv.amount, inv.currency)}</p>
              <div className="flex items-center gap-2">
                {inv.status !== "paid" && inv.status !== "cancelled" ? (
                  <form action={markInvoicePaidAction}>
                    <input type="hidden" name="id" value={inv.id} />
                    <button type="submit" className="t-caption rounded-lg border border-border px-3 py-1.5 text-muted transition-colors hover:border-[rgb(30_122_63/0.5)] hover:text-[rgb(30_122_63)]">
                      Mark paid
                    </button>
                  </form>
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
          <div>
            <label className="adm-label mb-1.5 block">Client *</label>
            <select name="clientId" required className="adm-select w-full">
              {clients.length === 0 ? <option value="">- create a client first -</option> : null}
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="adm-label mb-1.5 block">Project</label>
            <select name="projectId" className="adm-select w-full">
              <option value="">- none -</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.code} · {p.title}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="adm-label mb-1.5 block">Number</label>
            <input name="number" maxLength={32} className={input} placeholder="auto (INV-2026-001)" />
          </div>
          <div>
            <label className="adm-label mb-1.5 block">Amount *</label>
            <input name="amountMajor" type="number" step="0.01" min={0} required className={input} placeholder="2500.00" />
          </div>
          <div>
            <label className="adm-label mb-1.5 block">Currency</label>
            <select name="currency" defaultValue="INR" className="adm-select w-full">
              {["INR", "USD", "CHF", "EUR", "GBP", "AED"].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
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
