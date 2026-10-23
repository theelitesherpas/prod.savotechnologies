"use client";

import { useId, useMemo, useState, type KeyboardEvent } from "react";
import { CANDIDATE_FILTER_SELECTION_LIMIT } from "@/lib/hr-candidates";

/** Bounded visible options; selected choices remain submitted even when search hides them. */
export function FilterCheckboxes({ name, label, options, selected, hint }: {
  name: "city" | "hometown" | "skills"; label: string; options: string[]; selected: string[]; hint: string;
}) {
  const id = useId(), [query, setQuery] = useState(""), [chosen, setChosen] = useState(selected);
  const values = useMemo(() => {
    const all = new Map<string, string>();
    for (const value of [...selected, ...options]) {
      const plausibleLocation = /\p{L}/u.test(value) && !/@|https?:\/\//i.test(value);
      if (name !== "skills" && !plausibleLocation && !selected.includes(value)) continue;
      if (!all.has(value.toLowerCase())) all.set(value.toLowerCase(), value);
    }
    return [...all.values()];
  }, [options, selected, name]);
  const matching = values.filter(value => value.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
  const visible = matching.slice(0, 40), visibleKeys = new Set(visible.map(value => value.toLowerCase()));
  const chosenKeys = new Set(chosen.map(value => value.toLowerCase()));
  function toggle(value: string, checked: boolean) { setChosen(current => checked ? [...current, value].slice(0, CANDIDATE_FILTER_SELECTION_LIMIT) : current.filter(item => item.toLowerCase() !== value.toLowerCase())); }
  const preventSearchSubmit = (event: KeyboardEvent<HTMLInputElement>) => { if (event.key === "Enter") event.preventDefault(); };
  return <fieldset className="min-w-0 rounded-lg border border-border p-3" aria-describedby={`${id}-hint`}>
    <legend className="px-1 text-sm font-semibold">{label}</legend>
    <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs"><span aria-live="polite">{chosen.length} selected</span>{chosen.length ? <button type="button" className="min-h-8 font-semibold text-accent underline underline-offset-2" onClick={() => setChosen([])}>Clear {label.toLowerCase()}</button> : null}</div>
    <label className="mb-2 block"><span className="sr-only">Search {label.toLowerCase()}</span><input type="search" className="adm-input" value={query} onChange={event => setQuery(event.target.value)} onKeyDown={preventSearchSubmit} placeholder={`Search ${label.toLowerCase()}`} autoComplete="off" /></label>
    {chosen.length ? <ul aria-label={`Selected ${label.toLowerCase()}`} className="mb-2 flex max-h-24 flex-wrap gap-1.5 overflow-y-auto">{chosen.map(value => <li key={value}><button type="button" aria-label={`Remove ${value}`} onClick={() => toggle(value, false)} className="inline-flex min-h-8 max-w-full items-center gap-1.5 rounded border border-border bg-surface-2 px-2 py-1 text-left text-xs"><span className="break-words">{value}</span><svg aria-hidden="true" viewBox="0 0 12 12" className="h-3 w-3 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m3 3 6 6M9 3 3 9" /></svg></button></li>)}</ul> : null}
    {chosen.filter(value => !visibleKeys.has(value.toLowerCase())).map(value => <input key={value} type="hidden" name={name} value={value} />)}
    <div className="max-h-48 overflow-y-auto overscroll-contain" role="group" aria-label={`${label} choices`}>
      {visible.length ? visible.map(value => <label key={value} className="flex min-h-10 cursor-pointer items-start gap-2.5 rounded px-1 py-2 text-sm hover:bg-foreground/[0.03]">
        <input type="checkbox" name={name} value={value} className="mt-0.5 h-4 w-4 shrink-0 accent-accent" checked={chosenKeys.has(value.toLowerCase())} disabled={!chosenKeys.has(value.toLowerCase()) && chosen.length >= CANDIDATE_FILTER_SELECTION_LIMIT} onChange={event => toggle(value, event.target.checked)} /><span className="min-w-0 break-words">{value}</span>
      </label>) : <p className="py-3 text-xs text-muted">No matching choices in recorded applications.</p>}
    </div>
    <p id={`${id}-hint`} className="mt-2 text-xs leading-5 text-muted">{hint} Up to {CANDIDATE_FILTER_SELECTION_LIMIT} selections.{matching.length > 40 ? ` Showing 40 of ${matching.length}; search to narrow.` : ""}</p>
  </fieldset>;
}
