"use client";
import { useId, useState } from "react";
import { PROJECT_CURRENCIES } from "@/lib/project-finance";
export function InvoiceLinkFields({ clients, projects, initialClient = "", initialProject = "", initialCurrency = "INR" }: {
  clients: { id: string; name: string }[];
  projects: { id: string; clientId: string; code: string; title: string; currency: string; budget: number | null }[];
  initialClient?: string; initialProject?: string; initialCurrency?: string;
}) {
  const id = useId();
  const [clientId, setClientId] = useState(initialClient || clients[0]?.id || "");
  const [projectId, setProjectId] = useState(initialProject);
  const [currency, setCurrency] = useState(initialCurrency);
  const selected = projects.find(p => p.id === projectId && p.clientId === clientId);
  const currencyLocked = !!selected && selected.budget != null;
  const actualCurrency = currencyLocked ? selected.currency : currency;
  return <>
    <div><label className="adm-label mb-1.5 block" htmlFor={`${id}-client`}>Client</label><select id={`${id}-client`} name="clientId" required value={clientId} onChange={e => { setClientId(e.target.value); setProjectId(""); }} className="adm-select w-full"><option value="" disabled>Select a client</option>{clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
    <div><label className="adm-label mb-1.5 block" htmlFor={`${id}-project`}>Project</label><select id={`${id}-project`} name="projectId" value={projectId} onChange={e => setProjectId(e.target.value)} className="adm-select w-full"><option value="">No linked project</option>{projects.filter(p => p.clientId === clientId).map(p => <option key={p.id} value={p.id}>{p.code} · {p.title} · {p.currency}</option>)}</select></div>
    <div><label className="adm-label mb-1.5 block" htmlFor={`${id}-currency`}>Currency</label><select id={`${id}-currency`} name="currency" value={actualCurrency} disabled={currencyLocked} onChange={e => setCurrency(e.target.value)} className="adm-select w-full">{PROJECT_CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}</select>{currencyLocked ? <><input type="hidden" name="currency" value={actualCurrency}/><p className="mt-2 text-xs text-muted">Uses the linked project’s currency.</p></> : null}</div>
  </>;
}
