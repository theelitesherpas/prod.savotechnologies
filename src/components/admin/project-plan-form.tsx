"use client";

import { useRef, useState } from "react";
import { FormGuard } from "@/components/admin/form-guard";
import { SubmitButton } from "@/components/admin/form";
import { majorUnits, minorUnits, PROJECT_CURRENCIES, PROJECT_STATUSES, PROJECT_STATUS_LABELS } from "@/lib/project-finance";
import { invoiceMoney } from "@/lib/invoice-document";
import s from "./project-plan.module.css";

type Milestone = { id?: string; title: string; amount: number | null; description: string; status: string; dueDate: string };
type Project = { id: string; clientId: string; title: string; code: string; summary: string; budget: number | null; currency: string; status: string; startDate: string; dueDate: string; revision: string };
type Row = { key: string; id?: string; title: string; amountMajor: string; description: string; status: string; dueDate: string };
export function ProjectPlanForm({ action, clients, project, milestones = [], locked = false, currencyLocked = locked, selectedClient }: {
  action: (form: FormData) => Promise<void>;
  clients: { id: string; name: string; company?: string }[];
  project?: Project; milestones?: Milestone[]; locked?: boolean; currencyLocked?: boolean; selectedClient?: string;
}) {
  const counter = useRef(0);
  const [currency, setCurrency] = useState(project?.currency || "INR");
  const [budget, setBudget] = useState(majorUnits(project?.budget));
  const [rows, setRows] = useState<Row[]>(() => milestones.length ? milestones.map((m, i) => ({ ...m, key: m.id || `row-${i}`, amountMajor: majorUnits(m.amount) })) : [{ key: "initial", title: "", amountMajor: "", description: "", status: "pending", dueDate: "" }]);
  const change = (key: string, value: Partial<Row>) => setRows(rows => rows.map(row => row.key === key ? { ...row, ...value } : row));
  const money = (value: number) => invoiceMoney(value, currency);
  const amount = (value: string) => { try { return minorUnits(value); } catch { return null; } };
  const fixed = amount(budget);
  const costs = rows.map(row => amount(row.amountMajor));
  const allocated = costs.reduce<number>((sum, cost) => sum + (cost ?? 0), 0);
  const balanced = fixed != null && fixed > 0 && rows.length > 0 && costs.every(cost => cost != null && cost > 0) && allocated === fixed;
  return <FormGuard action={action} className={`adm-card ${s.form}`}>
    {project ? <><input type="hidden" name="id" value={project.id}/><input type="hidden" name="revision" value={project.revision}/></> : null}
    <input type="hidden" name="milestones" value={JSON.stringify(rows.map(row => ({ id: row.id, title: row.title, amountMajor: row.amountMajor, description: row.description, status: row.status, dueDate: row.dueDate })))}/>
    <section className={s.section} aria-labelledby="project-details-heading">
      <h2 id="project-details-heading">{project ? "Project details" : "Create a project"}</h2>
      <p className={s.hint}>Define the scope, budget and delivery plan the client will see.</p>
      <div className={s.grid}>
        <div className={s.full}><label htmlFor="plan-client">Client</label><select id="plan-client" name="clientId" required disabled={locked} defaultValue={project?.clientId || selectedClient || ""} className="adm-select w-full"><option value="" disabled>Select a client</option>{clients.map(c => <option key={c.id} value={c.id}>{c.name}{c.company ? ` · ${c.company}` : ""}</option>)}</select>{locked ? <input type="hidden" name="clientId" value={project?.clientId}/> : null}</div>
        <div><label htmlFor="plan-title">Project title</label><input id="plan-title" name="title" required maxLength={140} defaultValue={project?.title} className="adm-input w-full" placeholder="Client website and booking platform"/></div>
        <div><label htmlFor="plan-code">Reference code {project ? "" : "(optional)"}</label><input id="plan-code" name="code" maxLength={24} required={!!project} defaultValue={project?.code} className="adm-input w-full" placeholder="Generated automatically if blank"/></div>
        <div className={s.full}><label htmlFor="plan-description">Project description</label><textarea id="plan-description" name="summary" rows={4} required minLength={10} maxLength={2000} defaultValue={project?.summary} className="adm-input w-full" placeholder="Describe the agreed scope, deliverables and what is included."/></div>
        <div><label htmlFor="plan-budget">Fixed base budget</label><input id="plan-budget" name="budgetMajor" type="number" min="0.01" step="0.01" max="21474836.47" required value={budget} onChange={e => setBudget(e.target.value)} className="adm-input w-full" placeholder="0.00"/></div>
        <div><label htmlFor="plan-currency">Currency</label><select id="plan-currency" name="currency" value={currency} disabled={currencyLocked} onChange={e => setCurrency(e.target.value)} className="adm-select w-full">{PROJECT_CURRENCIES.map(c => <option value={c} key={c}>{c}</option>)}</select>{currencyLocked ? <input type="hidden" name="currency" value={currency}/> : null}</div>
        <div><label htmlFor="plan-start">Start date (optional)</label><input id="plan-start" name="startDate" type="date" defaultValue={project?.startDate} className="adm-input w-full"/></div>
        <div><label htmlFor="plan-due">Estimated delivery date</label><input id="plan-due" name="dueDate" type="date" required defaultValue={project?.dueDate} className="adm-input w-full"/></div>
        <div><label htmlFor="plan-status">Project status</label><select id="plan-status" name="status" defaultValue={project?.status || "planning"} className="adm-select w-full">{PROJECT_STATUSES.map(status => <option value={status} key={status}>{PROJECT_STATUS_LABELS[status]}</option>)}</select></div>
      </div>
      {locked ? <p className={s.hint}>Client ownership is locked because invoices are linked. Budgeted projects also retain their original currency. Legacy plans must match their existing invoice currencies.</p> : null}
    </section>
    <section className={s.section} aria-labelledby="base-milestones-heading">
      <div className={s.sectionHeading}><div><h2 id="base-milestones-heading">Base milestones</h2><p className={s.hint}>Allocate the entire fixed budget. No more, no less. Delivery progress follows completed milestone costs.</p></div><button type="button" className={s.add} disabled={rows.length >= 100} onClick={() => setRows(rows => [...rows, { key: `new-${++counter.current}`, title: "", amountMajor: "", description: "", status: "pending", dueDate: "" }])}>Add milestone</button></div>
      <div className={s.rows}>{rows.map((row, index) => <fieldset className={s.milestone} key={row.key}><legend>Milestone {index + 1}</legend>
        <div className={s.milestoneGrid}>
          <div><label htmlFor={`ms-title-${row.key}`}>Title</label><input id={`ms-title-${row.key}`} required minLength={2} maxLength={140} value={row.title} onChange={e => change(row.key, { title: e.target.value })} className="adm-input w-full" placeholder="Discovery and design"/></div>
          <div><label htmlFor={`ms-cost-${row.key}`}>Cost · {currency}</label><input id={`ms-cost-${row.key}`} type="number" required min="0.01" step="0.01" max="21474836.47" value={row.amountMajor} onChange={e => change(row.key, { amountMajor: e.target.value })} className="adm-input w-full"/></div>
          <div><label htmlFor={`ms-date-${row.key}`}>Due date (optional)</label><input id={`ms-date-${row.key}`} type="date" value={row.dueDate} onChange={e => change(row.key, { dueDate: e.target.value })} className="adm-input w-full"/></div>
          <div><label htmlFor={`ms-status-${row.key}`}>Delivery status</label><select id={`ms-status-${row.key}`} value={row.status} onChange={e => change(row.key, { status: e.target.value })} className="adm-select w-full"><option value="pending">Upcoming</option><option value="in_progress">In progress</option><option value="done">Done</option></select></div>
        </div>
        <div className={s.rowFoot}><details><summary>Milestone description (optional)</summary><textarea aria-label={`Description for milestone ${index + 1}`} rows={2} maxLength={2000} value={row.description} onChange={e => change(row.key, { description: e.target.value })} className="adm-input w-full"/></details><button className={s.remove} type="button" disabled={rows.length === 1} onClick={() => setRows(rows => rows.filter(m => m.key !== row.key))}>Remove milestone {index + 1}</button></div>
      </fieldset>)}</div>
      <div className={s.allocation} data-balanced={balanced}><dl><div><dt>Fixed base budget</dt><dd>{fixed == null ? "Not set" : money(fixed)}</dd></div><div><dt>Allocated</dt><dd>{money(allocated)}</dd></div></dl><output aria-live="polite">{balanced ? "Fully allocated — ready to save." : fixed == null || !fixed ? "Enter the fixed budget and milestone costs." : allocated < fixed ? `${money(fixed - allocated)} still to allocate.` : `${money(allocated - fixed)} over budget. Reduce milestone costs.`}</output></div>
    </section>
    <p className={s.hint}>Saving updates the client portal and notifies the client. Full payment can mark the project completed; it does not mark unfinished modules done.</p>
    <fieldset disabled={!balanced}><SubmitButton label={project ? "Save project and plan" : "Create project"}/></fieldset>
  </FormGuard>;
}
