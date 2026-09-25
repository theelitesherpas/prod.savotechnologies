import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BackLink, PageHeader, Notice } from "@/components/admin/ui";
import { SubmitButton } from "@/components/admin/form";
import { FormGuard } from "@/components/admin/form-guard";
import { updateInvoiceAction } from "../actions";

export const metadata: Metadata = { title: "Edit invoice" };

export default async function EditInvoicePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ e?: string }>;
}) {
  const { id } = await params;
  const { e } = await searchParams;
  if (!prisma) notFound();

  const [invoice, clients, projects] = await Promise.all([
    prisma.invoice.findUnique({ where: { id } }),
    prisma.clientUser.findMany({ orderBy: { name: "asc" } }),
    prisma.clientProject.findMany({ orderBy: { title: "asc" }, select: { id: true, title: true, code: true } }),
  ]);
  if (!invoice) notFound();

  const input = "adm-input w-full";
  const iso = (d: Date | null) => (d ? new Date(d).toISOString().slice(0, 10) : "");

  return (
    <div className="max-w-2xl">
      <BackLink href="/admin/invoices" label="All invoices" />
      <PageHeader title={invoice.number} description={`Stored amount: ${(invoice.amount / 100).toFixed(2)} ${invoice.currency}`} />
      {e === "invalid" ? <Notice kind="alert">Check the fields.</Notice> : null}
      {e === "dup" ? <Notice kind="alert">That invoice number is already in use.</Notice> : null}

      <FormGuard action={updateInvoiceAction} className="adm-card space-y-5 p-5">
        <input type="hidden" name="id" value={invoice.id} />
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="adm-label mb-1.5 block">Client *</label>
            <select name="clientId" required defaultValue={invoice.clientId} className="adm-select w-full">
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="adm-label mb-1.5 block">Project</label>
            <select name="projectId" defaultValue={invoice.projectId ?? ""} className="adm-select w-full">
              <option value="">— none —</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.code} · {p.title}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="adm-label mb-1.5 block">Number</label>
            <input name="number" required maxLength={32} defaultValue={invoice.number} className={input} />
          </div>
          <div>
            <label className="adm-label mb-1.5 block">Amount *</label>
            <input name="amountMajor" type="number" step="0.01" min={0} required defaultValue={(invoice.amount / 100).toFixed(2)} className={input} />
          </div>
          <div>
            <label className="adm-label mb-1.5 block">Currency</label>
            <select name="currency" defaultValue={invoice.currency} className="adm-select w-full">
              {["INR", "USD", "CHF", "EUR", "GBP", "AED"].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="adm-label mb-1.5 block">Status</label>
            <select name="status" defaultValue={invoice.status} className="adm-select w-full">
              {["draft", "sent", "paid", "overdue", "cancelled"].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="adm-label mb-1.5 block">Issued</label>
            <input name="issuedAt" type="date" defaultValue={iso(invoice.issuedAt)} className={input} />
          </div>
          <div>
            <label className="adm-label mb-1.5 block">Due</label>
            <input name="dueDate" type="date" defaultValue={iso(invoice.dueDate)} className={input} />
          </div>
          <div>
            <label className="adm-label mb-1.5 block">Paid on</label>
            <input name="paidAt" type="date" defaultValue={iso(invoice.paidAt)} className={input} />
          </div>
          <div className="sm:col-span-2">
            <label className="adm-label mb-1.5 block">Notes</label>
            <input name="notes" maxLength={500} defaultValue={invoice.notes} className={input} />
          </div>
        </div>
        <SubmitButton label="Save invoice" />
      </FormGuard>
    </div>
  );
}
