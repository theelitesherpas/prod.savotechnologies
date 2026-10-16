"use client";
import { useId, useState } from "react";
import { PROJECT_CURRENCIES } from "@/lib/project-finance";
export function InvoiceLinkFields({ clients, projects, milestones = [], initialClient = "", initialProject = "", initialCurrency = "INR", initialMilestone = "" }: {
  clients: { id: string; name: string; businessId?: string | null }[];
  projects: { id: string; clientId: string; code: string; title: string; currency: string; budget: number | null }[];
  /** Optional per-project milestone options; only the selected project's rows are offered. */
  milestones?: { id: string; projectId: string; label: string }[];
  initialClient?: string; initialProject?: string; initialCurrency?: string; initialMilestone?: string;
}) {
  const id = useId();
  const [clientId, setClientId] = useState(initialClient || clients[0]?.id || "");
  const [projectId, setProjectId] = useState(initialProject);
  const [currency, setCurrency] = useState(initialCurrency);
  const [milestoneId, setMilestoneId] = useState(initialMilestone);
  const selected = projects.find(p => p.id === projectId && p.clientId === clientId);
  const currencyLocked = !!selected && selected.budget != null;
  const actualCurrency = currencyLocked ? selected.currency : currency;
  const projectMilestones = milestones.filter(m => m.projectId === projectId);
  return <>
    <div><label className="adm-label mb-1.5 block" htmlFor={`${id}-client`}>Client</label><select id={`${id}-client`} name="clientId" required value={clientId} onChange={e => { setClientId(e.target.value); setProjectId(""); setMilestoneId(""); }} className="adm-select w-full"><option value="" disabled>Select a client</option>{clients.map(c => <option key={c.id} value={c.id}>{c.businessId ? `${c.businessId} · ` : ""}{c.name}</option>)}</select></div>
    <div><label className="adm-label mb-1.5 block" htmlFor={`${id}-project`}>Project</label><select id={`${id}-project`} name="projectId" value={projectId} onChange={e => { setProjectId(e.target.value); setMilestoneId(""); }} className="adm-select w-full"><option value="">No linked project</option>{projects.filter(p => p.clientId === clientId).map(p => <option key={p.id} value={p.id}>{p.code} · {p.title} · {p.currency}</option>)}</select></div>
    <div><label className="adm-label mb-1.5 block" htmlFor={`${id}-milestone`}>Milestone (optional)</label><select id={`${id}-milestone`} name="milestoneId" value={projectMilestones.some(m => m.id === milestoneId) ? milestoneId : ""} onChange={e => setMilestoneId(e.target.value)} disabled={!projectId} className="adm-select w-full" aria-describedby={`${id}-milestone-help`}><option value="">{projectId ? "No milestone link" : "Select a project first"}</option>{projectMilestones.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}</select><p id={`${id}-milestone-help`} className="mt-2 text-xs leading-relaxed text-muted">A linked milestone shows Paid/Unpaid in the project plan based on this invoice&#39;s status.</p></div>
    <div><label className="adm-label mb-1.5 block" htmlFor={`${id}-currency`}>Currency</label><select id={`${id}-currency`} name="currency" value={actualCurrency} disabled={currencyLocked} onChange={e => setCurrency(e.target.value)} className="adm-select w-full">{PROJECT_CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}</select>{currencyLocked ? <><input type="hidden" name="currency" value={actualCurrency}/><p className="mt-2 text-xs text-muted">Uses the linked project’s currency.</p></> : null}</div>
  </>;
}
