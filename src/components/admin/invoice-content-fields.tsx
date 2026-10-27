"use client";

import { useId, useState } from "react";
import { majorUnits } from "@/lib/project-finance";
import { draftBillingTotal, type InvoiceItem, type TaskDraft } from "@/lib/billing-items";
import { PricedTasksEditor } from "./priced-tasks-editor";

/** Shared by standalone, project and edit forms. A selected milestone seeds a
 * new invoice, but an existing invoice always opens its own saved snapshot. */
export function InvoiceContentFields({ currency, initialAmount = null, initialDescription = "", initialItems = [] }: {
  currency: string; initialAmount?: number | null; initialDescription?: string; initialItems?: InvoiceItem[];
}) {
  const id = useId();
  const [amount, setAmount] = useState(majorUnits(initialAmount));
  const [description, setDescription] = useState(initialDescription);
  const [tasks, setTasks] = useState<TaskDraft[]>(() => initialItems.map(item => ({ title: item.description, amountMajor: majorUnits(item.amount) })));
  const total = draftBillingTotal(tasks);
  const shownAmount = tasks.length ? total == null ? "" : majorUnits(total) : amount;
  return <div className="min-w-0 space-y-4 sm:col-span-2">
    <div><label className="adm-label mb-1.5 block" htmlFor={`${id}-description`}>Work description / milestone notes</label><textarea id={`${id}-description`} name="description" rows={3} maxLength={4000} value={description} onChange={e => setDescription(e.target.value)} className="adm-input w-full" placeholder="Describe the work this invoice covers."/><p className="mt-2 text-xs leading-relaxed text-muted">Shown in the invoice Description section. Saved with this invoice, independently of later project-plan changes.</p></div>
    <PricedTasksEditor rows={tasks} onChange={next => {
      // Removing the last task keeps its previous total as an aggregate amount.
      if (!next.length && total != null) setAmount(majorUnits(total));
      setTasks(next);
    }} currency={currency} invoice/>
    <input type="hidden" name="items" value={JSON.stringify(tasks.map(task => ({ description: task.title, amountMajor: task.amountMajor })))}/>
    <div><label className="adm-label mb-1.5 block" htmlFor={`${id}-amount`}>Invoice amount · {currency} *</label><input id={`${id}-amount`} name="amountMajor" type="number" step="0.01" min={0} max="21474836.47" required readOnly={tasks.length > 0} value={shownAmount} onChange={e => setAmount(e.target.value)} className="adm-input w-full" placeholder="2500.00" inputMode="decimal" aria-describedby={`${id}-amount-help`}/><p id={`${id}-amount-help`} className="mt-2 text-xs leading-relaxed text-muted">{tasks.length ? "Calculated from the task prices above. Edit a task price to change the amount." : "Single amount for the work described above. Add tasks for an itemised invoice."}</p></div>
    {tasks.length && total == null ? <p role="alert" className="text-xs text-error">Enter valid task prices within the supported total before saving.</p> : null}
  </div>;
}
