"use client";

import { useId, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { ClosingArrow } from "@/components/shared/closing-cta";
import { SAVO_LETTER_PATHS } from "@/components/shared/savo-logo";
import s from "./careers.module.css";

const subscribe = () => () => {};
const PREPARATION = [
  "Decide which role fits your skills.",
  "Choose work you can share publicly.",
  "Think about what you want to build next.",
];

/** Real company navigation and a local checklist, not sample code or an assessment. */
export function CareersWorkspace() {
  const id = useId();
  const enhanced = useSyncExternalStore(subscribe, () => true, () => false);
  const [view, setView] = useState("company");
  const [checked, setChecked] = useState<string[]>([]);
  return (
    <div className={s.workspace} data-careers-workspace>
      <div className={s.workspaceBar}><span className={s.workspaceMark} aria-hidden="true"><svg width="28" height="28" viewBox="0 0 512 512" fill="none"><path d={SAVO_LETTER_PATHS[0]} transform="translate(-97.4 -405.9) scale(1.5464)" fill="currentColor" fillRule="evenodd" clipRule="evenodd" /></svg></span><span>Savo / Careers</span><span className={s.path}>/careers</span></div>
      <fieldset className={s.workspaceTabs} hidden={!enhanced}>
        <legend className="sr-only">Explore the careers workspace</legend>
        {[{ id: "company", label: "About Savo" }, { id: "prepare", label: "Before you apply" }].map(item => (
          <label key={item.id}><input type="radio" name={`${id}-view`} value={item.id} checked={view === item.id} onChange={() => setView(item.id)} aria-controls={`${id}-${item.id}`} /><span>{item.label}</span></label>
        ))}
      </fieldset>
      <div id={`${id}-company`} hidden={view !== "company"} className={s.workspaceContent}>
        <div className={s.craftArt} aria-hidden="true"><span>{"{"}</span><div><b>Design.</b><b>Build.</b><b>Improve.</b></div><span>{"}"}</span></div>
        <h2>Different skills. Connected work.</h2>
        <p>Savo brings product design, software engineering and AI together to build digital products.</p>
        <Link href="/about" className={s.darkLink}>Get to know Savo <ClosingArrow /></Link>
      </div>
      <div id={`${id}-prepare`} hidden={view !== "prepare"} className={s.workspaceContent}>
        <h2>A little preparation goes a long way.</h2>
        <p>Use this checklist before opening your application.</p>
        <div className={s.checklist}>{PREPARATION.map(text => <label key={text}><input type="checkbox" checked={checked.includes(text)} onChange={e => setChecked(list => e.target.checked ? [...list, text] : list.filter(x => x !== text))} /><span>{text}</span></label>)}</div>
        <p className={s.checklistStatus} role="status">{checked.length === 3 ? "Ready when you are. Your application is the next step." : "This checklist is just for you. It is not sent with your application."}</p>
        <Link href="/careers/apply?role=general-application" className={s.darkLink}>Open your application <ClosingArrow /></Link>
      </div>
      <div className={s.workspaceFoot}><span>Web · Mobile · Software · AI</span><Link href="/services">Explore our work areas <ClosingArrow /></Link></div>
      <noscript><div className={s.workspaceContent} data-careers-preparation-fallback><h2>Before you apply.</h2><ul className={s.preparationFallback}>{PREPARATION.map(text => <li key={text}>{text}</li>)}</ul><Link href="/careers/apply?role=general-application" className={s.darkLink}>Open your application <ClosingArrow /></Link></div></noscript>
    </div>
  );
}
