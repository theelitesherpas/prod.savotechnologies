"use client";

import { useState } from "react";
import { createInvoiceAction } from "@/app/admin/(protected)/invoices/actions";
import { BusinessIdField } from "@/components/admin/business-id-field";
import { InvoicePaymentField } from "@/components/admin/invoice-payment-field";
import { FormGuard } from "@/components/admin/form-guard";
import { SubmitButton } from "@/components/admin/form";

/** Raise an invoice straight from a project. The project, client and currency
 * are fixed; a milestone (optional) links the invoice to that deliverable so
 * its Paid/Unpaid status follows this invoice. Selecting a milestone offers
 * its allocated cost as the amount, which can still be corrected. */
export function ProjectInvoiceForm({ action = createInvoiceAction, projectId, clientId, currency, today, milestones, initialMilestoneId = "", open = false, invoiceCount = 0, compact = false }: {
  action?: (formData: FormData) => Promise<void>;
  projectId: string; clientId: string; currency: string; today: string;
  milestones: { id: string; title: string; amount: number | null; scope: string; status: string }[];
  initialMilestoneId?: string; open?: boolean; invoiceCount?: number; compact?: boolean;
}) {
  const [milestoneId, setMilestoneId] = useState(initialMilestoneId);
  const selected = milestones.find(m => m.id === milestoneId) ?? null;
  const [amount, setAmount] = useState(selected ? major(selected.amount) : "");
  const input = "adm-input w-full";
  return (
    <details className="adm-card p-5" open={open} id="raise-invoice">
      <summary className="cursor-pointer select-none font-medium">Raise an invoice for this project</summary>
      <p className="mt-2 text-sm leading-relaxed text-muted">Invoices use {currency} (this project&#39;s currency) and are billed to this client. Optionally link a milestone: its payment status then follows this invoice — paid invoice, paid milestone.</p>
      <FormGuard action={action} className="mt-5 space-y-5">
        <input type="hidden" name="clientId" value={clientId}/>
        <input type="hidden" name="projectId" value={projectId}/>
        <input type="hidden" name="currency" value={currency}/>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="adm-label mb-1.5 block" htmlFor="project-invoice-milestone">Milestone (optional)</label>
            <select id="project-invoice-milestone" name="milestoneId" value={milestoneId} onChange={e => {
              const next = milestones.find(m => m.id === e.target.value) ?? null;
              setMilestoneId(e.target.value);
              setAmount(next ? major(next.amount) : "");
            }} className="adm-select w-full">
              <option value="">No milestone link</option>
              {milestones.map(m => <option key={m.id} value={m.id}>{m.title}{m.amount != null ? ` · ${major(m.amount)} ${currency}` : ""}{m.scope === "additional" ? " · additional" : ""}</option>)}
            </select>
            <p className="mt-2 text-xs leading-relaxed text-muted">Choosing a milestone fills its allocated cost as the amount; adjust only if you are billing part of it.</p>
          </div>
          <div>
            <label className="adm-label mb-1.5 block" htmlFor="project-invoice-amount">Amount ({currency}) *</label>
            <input id="project-invoice-amount" name="amountMajor" type="number" step="0.01" min="0.01" max="21474836.47" required value={amount} onChange={e => setAmount(e.target.value)} className={input} placeholder="2500.00" inputMode="decimal"/>
          </div>
          <div>
            <label className="adm-label mb-1.5 block" htmlFor="project-invoice-status">Status</label>
            <select id="project-invoice-status" name="status" defaultValue="sent" className="adm-select w-full">{["draft", "sent", "paid", "overdue", "cancelled"].map(s => <option key={s} value={s}>{s}</option>)}</select>
          </div>
          <div>
            <label className="adm-label mb-1.5 block" htmlFor="project-invoice-issued">Issued</label>
            <input id="project-invoice-issued" name="issuedAt" type="date" defaultValue={today} className={input}/>
          </div>
          <div>
            <label className="adm-label mb-1.5 block" htmlFor="project-invoice-due">Due</label>
            <input id="project-invoice-due" name="dueDate" type="date" className={input}/>
          </div>
          {!compact ? <div className="sm:col-span-2">
            <label className="adm-label mb-1.5 block" htmlFor="project-invoice-notes">Notes</label>
            <input id="project-invoice-notes" name="notes" maxLength={500} className={input} placeholder={selected ? `Milestone: ${selected.title}` : "Optional note shown to the client"}/>
          </div> : null}
          <InvoicePaymentField/>
        </div>
        <BusinessIdField type="IN" label="Invoice ID" id="project-invoice-reference" resetKey={invoiceCount}/>
        <SubmitButton label="Create invoice"/>
      </FormGuard>
    </details>
  );
}
function major(minor: number | null): string {
  return minor == null ? "" : `${Math.floor(minor / 100)}.${String(minor % 100).padStart(2, "0")}`;
}
