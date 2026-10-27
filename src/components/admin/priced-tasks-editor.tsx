"use client";

import { useId } from "react";
import { MAX_BILLING_ITEMS, MAX_TASK_NAME_LENGTH, draftBillingTotal, type TaskDraft } from "@/lib/billing-items";
import { invoiceMoney } from "@/lib/invoice-document";
import s from "./billing-tasks.module.css";

/** Local extension of the existing console fields; no new visual system. */
export function PricedTasksEditor({ rows, onChange, currency, invoice = false }: {
  rows: TaskDraft[]; onChange: (rows: TaskDraft[]) => void; currency: string; invoice?: boolean;
}) {
  const id = useId();
  const total = draftBillingTotal(rows);
  function focusRow(index: number) {
    requestAnimationFrame(() => document.getElementById(`${id}-name-${index}`)?.focus());
  }
  return <section className={s.editor} aria-labelledby={`${id}-heading`}>
    <div className={s.heading}>
      <div><h3 id={`${id}-heading`}>Tasks and pricing</h3><p>{invoice ? "Up to 3 tasks, one line per task on your single-page invoice. For part billing, include only the work and prices being billed now." : "Add up to 3 tasks with short names. Prices calculate the milestone total and appear as three lines at most on invoices."}</p></div>
      <button type="button" className={s.add} disabled={rows.length >= MAX_BILLING_ITEMS} onClick={() => { onChange([...rows, { title: "", amountMajor: "" }]); focusRow(rows.length); }}>Add task</button>
    </div>
    {rows.length ? <div className={s.rows}>{rows.map((row, index) => <div className={s.row} key={index}>
      <div><label htmlFor={`${id}-name-${index}`}>Task {index + 1}</label><input id={`${id}-name-${index}`} className="adm-input w-full" required minLength={2} maxLength={MAX_TASK_NAME_LENGTH} value={row.title} onChange={e => onChange(rows.map((item, i) => i === index ? { ...item, title: e.target.value } : item))} placeholder="e.g. Booking form development"/></div>
      <div><label htmlFor={`${id}-price-${index}`}>Price · {currency}</label><input id={`${id}-price-${index}`} className="adm-input w-full" required type="number" min="0.01" max="21474836.47" step="0.01" inputMode="decimal" value={row.amountMajor} onChange={e => onChange(rows.map((item, i) => i === index ? { ...item, amountMajor: e.target.value } : item))} placeholder="0.00"/></div>
      <button type="button" className={s.remove} aria-label={`Remove task ${index + 1}`} onClick={() => { onChange(rows.filter((_, i) => i !== index)); if (rows.length > 1) focusRow(Math.min(index, rows.length - 2)); }}>Remove</button>
    </div>)}</div> : <p className={s.empty}>No task breakdown. You can still use a single total and work description.</p>}
    {rows.length ? <div className={s.total} aria-live="polite"><span>Task total</span><strong>{total == null ? "Complete each price (maximum total 21,474,836.47)." : invoiceMoney(total, currency)}</strong></div> : null}
  </section>;
}
