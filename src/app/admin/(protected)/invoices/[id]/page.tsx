import { requireAdminPage } from "@/lib/permissions";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { razorpayStatus } from "@/lib/razorpay-config";
import { BackLink, PageHeader, Notice, Chip } from "@/components/admin/ui";
import { SubmitButton } from "@/components/admin/form";
import { FormGuard } from "@/components/admin/form-guard";
import { InvoiceLinkFields } from "@/components/admin/invoice-link-fields";
import { InvoicePaymentField } from "@/components/admin/invoice-payment-field";
import { money } from "@/components/portal/ui";
import { invoiceDocumentItems, invoiceWorkDescription } from "@/lib/invoice-document";
import { updateInvoiceAction, syncInvoiceRazorpayAction } from "../actions";

export const metadata: Metadata = { title: "Edit invoice" };

export default async function EditInvoicePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ e?: string; saved?: string; via?: string; razorpay?: string }>;
}) {
  await requireAdminPage("/admin/invoices/[id]");
  const { id } = await params;
  const sp = await searchParams;
  const e = sp.e;
  if (!prisma) notFound();

  const [invoice, clients, projects, milestones] = await Promise.all([
    prisma.invoice.findUnique({ where: { id }, include: { milestone: { select: { title: true, description: true } } } }),
    prisma.clientUser.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, businessId: true } }),
    prisma.clientProject.findMany({ orderBy: { title: "asc" }, select: { id: true, title: true, code: true, clientId: true, currency: true, budget: true } }),
    prisma.projectMilestone.findMany({ orderBy: [{ projectId: "asc" }, { order: "asc" }, { createdAt: "asc" }], select: { id: true, projectId: true, title: true, description: true, tasks: true, scope: true, amount: true, project: { select: { currency: true } } } }),
  ]);
  if (!invoice) notFound();
  const gateway = await razorpayStatus().catch(() => null);
  const payable = ["sent", "overdue"].includes(invoice.status) && invoice.amount > 0;
  const showRazorpayCard = !!gateway?.configured && (payable || !!invoice.razorpayLinkId);

  const input = "adm-input w-full";
  const iso = (d: Date | null) => (d ? new Date(d).toISOString().slice(0, 10) : "");

  return (
    <div className="max-w-2xl">
      <BackLink href="/admin/invoices" label="All invoices" />
      <PageHeader title={invoice.number} description={`Stored amount: ${(invoice.amount / 100).toFixed(2)} ${invoice.currency}${invoice.milestone ? ` · milestone: ${invoice.milestone.title}` : ""}`} />
      {e === "invalid" ? <Notice kind="alert">Check the fields.</Notice> : null}
      {e === "dup" ? <Notice kind="alert">That invoice number is already in use.</Notice> : null}
      {e && e !== "dup" && e !== "invalid" ? <Notice kind="alert">{decodeURIComponent(e)}</Notice> : null}
      {sp.saved === "paid" ? <Notice>{sp.via === "razorpay" ? "Payment confirmed from Razorpay — invoice marked paid and receipt sent." : "Invoice marked paid."}</Notice> : null}
      {sp.razorpay ? <Notice>Razorpay link status: {decodeURIComponent(sp.razorpay)} (not paid yet).</Notice> : null}

      {showRazorpayCard ? (
        <div className="adm-card mb-8 p-5">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <p className="adm-label mr-auto">Razorpay payment link</p>
            {invoice.razorpayLinkId ? <Chip tone={invoice.status === "paid" ? "success" : "accent"} mono>{invoice.status === "paid" ? "Link paid" : "Link active"}</Chip> : <Chip tone="muted" mono>No link</Chip>}
            {invoice.razorpayPaymentId ? <Chip tone="muted" mono>pay …{invoice.razorpayPaymentId.slice(-6)}</Chip> : null}
          </div>
          {payable ? (
            <>
              <p className="t-caption mb-4 text-muted">
                {invoice.razorpayOrderId
                  ? "A checkout session exists for this invoice. The client pays from the portal Pay now action; payment is verified server-side and recorded automatically. Sync reads the provider's own record at any time."
                  : "When this invoice is issued, the client's Pay now action opens Razorpay Standard Checkout from the portal — payment is verified server-side and recorded automatically. A checkout session is created the moment the client starts payment."}
              </p>
              <form action={syncInvoiceRazorpayAction}>
                <input type="hidden" name="id" value={invoice.id} />
                <SubmitButton label="Sync status with Razorpay" pendingLabel="Checking…" compact />
              </form>
            </>
          ) : (
            <p className="t-caption text-muted">
              {invoice.razorpayOrderId
                ? "Any checkout session for this invoice can no longer complete a payment that would be recorded — verify the status above."
                : "Checkout sessions are created by clients when they start payment on unpaid invoices."}
            </p>
          )}
        </div>
      ) : null}

      <FormGuard action={updateInvoiceAction} className="adm-card space-y-5 p-5">
        <input type="hidden" name="id" value={invoice.id} />
        <input type="hidden" name="revision" value={invoice.updatedAt.toISOString()} />
        <div className="grid gap-5 sm:grid-cols-2">
          <InvoiceLinkFields clients={clients} projects={projects} initialClient={invoice.clientId} initialProject={invoice.projectId ?? ""} initialCurrency={invoice.currency} initialMilestone={invoice.milestoneId ?? ""} initialContent={{ amount: invoice.amount, description: invoiceWorkDescription(invoice), items: invoiceDocumentItems(invoice) }} milestones={milestones.map(m => ({ id: m.id, projectId: m.projectId, title: m.title, description: m.description, tasks: m.tasks, amount: m.amount, label: `${m.title}${m.amount != null ? ` · ${money(m.amount, m.project.currency)}` : ""}${m.scope === "additional" ? " · additional" : ""}` }))}/>
          <div>
            <label className="adm-label mb-1.5 block" htmlFor="invoice-reference">Invoice ID / issued reference</label>
            <input id="invoice-reference" name="number" readOnly value={invoice.number} className={input} aria-describedby="invoice-reference-help" />
            <p id="invoice-reference-help" className="mt-2 text-xs leading-relaxed text-muted">Immutable. Previously issued invoice numbers are preserved.</p>
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
          <InvoicePaymentField value={invoice.paymentLink}/>
          <div className="sm:col-span-2">
            <label className="adm-label mb-1.5 block">Notes</label>
            <textarea name="notes" rows={2} maxLength={500} defaultValue={invoice.notes} className={input} />
          </div>
        </div>
        <SubmitButton label="Save invoice" />
      </FormGuard>
    </div>
  );
}
