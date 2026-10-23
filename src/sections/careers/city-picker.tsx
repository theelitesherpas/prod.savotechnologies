"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { INDIA_CITY_DIRECTORY_URL, searchIndiaCities, type IndiaCityDirectory } from "@/lib/india-cities";
import { withBasePath } from "@/lib/utils";
import s from "./city-picker.module.css";
let directory: Promise<IndiaCityDirectory> | null = null;
function loadDirectory() {
  if (!directory) directory = fetch(withBasePath(INDIA_CITY_DIRECTORY_URL)).then(async response => {
    if (!response.ok) throw Error("City directory unavailable");
    const json = await response.json() as IndiaCityDirectory;
    if (!Array.isArray(json.cities) || json.cities.length < 4000) throw Error("Incomplete city directory");
    return json;
  }).catch(error => { directory = null; throw error; });
  return directory;
}

export function CityPicker({ name, label, required = false, error, onStarted, onValueChange }: { name: "city" | "hometown"; label: string; required?: boolean; error?: string; onStarted: () => void; onValueChange?: () => void }) {
  const id = `cr-${name}`, listId = useId(), input = useRef<HTMLInputElement>(null), mounted = useRef(true), suppressOpen = useRef(false);
  const [value, setValue] = useState(""), [query, setQuery] = useState(""), [open, setOpen] = useState(false), [active, setActive] = useState(-1);
  const [above, setAbove] = useState(false);
  const position = useCallback(() => {
    const rect = input.current?.getBoundingClientRect();
    if (rect) { const viewport = window.visualViewport; const room = (viewport ? viewport.height + viewport.offsetTop : innerHeight) - rect.bottom; setAbove(room < 320 && rect.top > room); }
  }, []);
  useEffect(() => {
    if (!open) return;
    window.addEventListener("resize", position); window.addEventListener("scroll", position, true); window.visualViewport?.addEventListener("resize", position);
    return () => { window.removeEventListener("resize", position); window.removeEventListener("scroll", position, true); window.visualViewport?.removeEventListener("resize", position); };
  }, [open, position]);
  const [data, setData] = useState<IndiaCityDirectory | null>(null), [state, setState] = useState<"idle" | "loading" | "ready" | "failed">("idle");
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const matches = useMemo(() => searchIndiaCities(data?.cities ?? [], query), [data, query]);
  useEffect(() => { if (open && active >= 0) document.getElementById(`${listId}-${active}`)?.scrollIntoView({ block: "nearest" }); }, [open, active, listId]);
  function load() {
    if (state === "ready" || state === "loading") return;
    setState("loading");
    void loadDirectory().then(result => { if (mounted.current) { setData(result); setState("ready"); } }).catch(() => { if (mounted.current) setState("failed"); });
  }
  function focusInput() {
    if (document.activeElement !== input.current) { suppressOpen.current = true; input.current?.focus(); }
  }
  function select(index: number) {
    const city = matches.options[index]; if (!city) return;
    setValue(`${city[0]}, ${city[1]}`); onValueChange?.(); setQuery(city[0]); setOpen(false); setActive(-1); focusInput();
  }
  return <div className={s.field}>
    <label htmlFor={id} className="t-label mb-1 block text-muted">{label}{required ? <span aria-hidden="true" className="text-accent"> *</span> : " (optional)"}</label>
    <div className={s.anchor} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}>
      <input ref={input} id={id} name={name} className="field" role="combobox" aria-autocomplete="list" aria-expanded={open} aria-controls={open ? listId : undefined} aria-activedescendant={open && active >= 0 && matches.options[active] ? `${listId}-${active}` : undefined} aria-required={required} aria-invalid={Boolean(error)} aria-describedby={`${id}-help${error ? ` ${id}-error` : ""}`} autoComplete="off" maxLength={150} value={value}
        placeholder="Search city or state in India"
        onFocus={() => { onStarted(); if (suppressOpen.current) { suppressOpen.current = false; return; } position(); setOpen(true); load(); }}
        onChange={event => { setValue(event.target.value); if (event.target.value.trim()) onValueChange?.(); setQuery(event.target.value); position(); setOpen(true); setActive(-1); load(); }}
        onKeyDown={event => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") { event.preventDefault(); position(); setOpen(true); load(); setActive(index => index < 0 && event.key === "ArrowUp" ? Math.max(0, matches.options.length - 1) : Math.max(0, Math.min(matches.options.length - 1, index + (event.key === "ArrowDown" ? 1 : -1)))); }
          if (event.key === "Escape") { event.preventDefault(); setOpen(false); setActive(-1); }
          if (event.key === "Enter" && open) { event.preventDefault(); if (active >= 0) select(active); else setOpen(false); }
        }} />
      {open ? <div className={`${s.popup} ${above ? s.above : ""}`}>
        <div role="status" className={s.status}>{state === "loading" ? "Loading India’s city/town directory…" : state === "failed" ? "Directory unavailable. You can still enter your city and state." : query.trim() ? `${matches.total.toLocaleString("en-IN")} matching places${matches.total > 40 ? " · keep typing to narrow" : ""}` : "Popular cities · Indore first"}</div>
        <div id={listId} role="listbox" aria-label={`${label} suggestions`} className={s.options}>
          {matches.options.map(([city, region, cityId], index) => <button type="button" key={cityId} id={`${listId}-${index}`} role="option" aria-selected={index === active} tabIndex={-1} className={`${s.option} ${index === active ? s.active : ""}`} onPointerDown={event => event.preventDefault()} onClick={() => select(index)}><span>{city}</span><span>{region}</span></button>)}
        </div>
        <button type="button" className={s.manual} onPointerDown={event => event.preventDefault()} onClick={() => { setOpen(false); focusInput(); }}>Other city/town · use my entered location</button>
        {state === "failed" ? <button type="button" className={s.manual} onClick={load}>Retry directory</button> : null}
        <a className={s.credit} href={withBasePath("/data-sources#india-cities")} target="_blank" rel="noopener noreferrer">City data credits<span className="sr-only"> (opens in a new tab)</span></a>
      </div> : null}
    </div>
    <p id={`${id}-help`} className={s.help}>Search by city or state, or enter it manually.</p>
    {error ? <p id={`${id}-error`} role="alert" className="t-caption mt-1.5 text-error">{error}</p> : null}
  </div>;
}
