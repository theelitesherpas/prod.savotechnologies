"use client";

import * as React from "react";
import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import type { IndustryDossier, IndustryLayout } from "@/content/industries/schema";
import { IndustryAction } from "./industry-dossier-interactions";
import v from "./industry-detail-polish.module.css";

/** Solid editorial symbols, not dashboard UI, client assets or live data. */
export function SectorEmblem({ kind }: { kind: IndustryLayout }) {
  const shapes: Record<IndustryLayout, React.ReactNode> = {
    care: <path d="M64 107 20 64C-8 33 35 8 64 37c29-29 72-4 44 27Z" fill="currentColor" />,
    ledger: <><ellipse cx="47" cy="64" rx="31" ry="44" fill="currentColor" /><ellipse cx="83" cy="64" rx="31" ry="44" fill="#000" /><path d="M75 43h16v9H75zm0 18h16v9H75zm0 18h16v9H75z" fill="#fff" /></>,
    commerce: <><path d="M19 40h90l-8 74H27Z" fill="currentColor" /><path d="M43 42V29a21 21 0 0 1 42 0v13" fill="none" stroke="#000" strokeWidth="10" /><circle cx="45" cy="61" r="5" fill="#fff" /><circle cx="83" cy="61" r="5" fill="#fff" /></>,
    route: <><path d="m64 12 49 24-49 24-49-24Z" fill="currentColor" /><path d="M15 44 59 66v49L15 93Z" fill="#000" /><path d="m69 66 44-22v49l-44 22Z" fill="currentColor" /></>,
    property: <><path d="m64 10 53 47H11Z" fill="currentColor" /><path d="M24 57h80v58H24Z" fill="#000" /><path d="M54 77h20v38H54Z" fill="#fff" /></>,
    learning: <><path d="M12 24c25-5 38 0 47 10v76c-12-9-25-14-47-8Z" fill="currentColor" /><path d="M69 34c9-10 22-15 47-10v78c-22-6-35-1-47 8Z" fill="#000" /></>,
    stay: <><path d="M25 15h78v103H25Z" fill="currentColor" /><path d="M38 30h16v15H38zm36 0h16v15H74zM38 58h16v15H38zm36 0h16v15H74zM54 87h20v31H54z" fill="#fff" /></>,
    production: <><path d="M13 111V62l35-23v29l34-23v27h33v39Z" fill="currentColor" /><path d="M94 15h18v54H94Z" fill="#000" /><path d="M29 89h15v10H29zm33 0h15v10H62zm33 0h10v10H95z" fill="#fff" /></>,
    civic: <><path d="m64 13 52 30H12Z" fill="currentColor" /><path d="M21 54h17v43H21zm35 0h17v43H56zm35 0h17v43H91zM13 105h103v13H13Z" fill="#000" /></>,
    grid: <path d="M75 9 24 74h34l-9 47 54-69H68Z" fill="currentColor" />,
  };
  return <svg viewBox="0 0 128 128" fill="none" aria-hidden="true" focusable="false">{shapes[kind]}</svg>;
}
export function DetailPlus() {
  return <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 10h12" /><path d="M10 4v12" /></svg>;
}

/** Once-only visual settlement. Content is visible even without an observer. */
export function DetailReveal({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    if (!ref.current || !window.IntersectionObserver) return;
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { setSeen(true); observer.disconnect(); } }, { threshold: .15 });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return <div ref={ref} className={`${v.reveal} ${className}`} data-detail-reveal={seen}>{children}</div>;
}

export function SectorRoles({ nodes, core, kind }: { nodes: IndustryDossier["ecosystemNodes"]; core: string; kind: IndustryLayout }) {
  const [active, setActive] = useState(0);
  const id = useId();
  return <figure className={v.roles} data-ecosystem={kind}>
    <DetailReveal className={v.rolesScene}>
      <div className={v.roleShape} aria-hidden="true"><SectorEmblem kind={kind} /></div>
      <strong className="sr-only">{core}</strong>
      <div className={v.roleChoices}>{nodes.map((n, i) => <button type="button" key={n.title} data-position={i} aria-pressed={active === i} aria-controls={`${id}-role`} onClick={() => setActive(i)}>{n.title}</button>)}</div>
    </DetailReveal>
    <div className={v.roleExplanation} id={`${id}-role`} aria-live="polite" aria-atomic="true"><strong>{nodes[active].role}</strong><p>{nodes[active].text}</p></div>
    <figcaption>Choose a role to see its responsibility in the system.</figcaption>
  </figure>;
}

export function ProductStudio({ dossier: d, services }: { dossier: IndustryDossier; services: { slug: string; title: string }[] }) {
  const [active, setActive] = useState(0);
  const id = useId();
  return <div className={v.productStudio}>
    <fieldset className={v.productChoices}><legend className="sr-only">Choose a solution</legend>{d.solutions.map((solution, index) => <label key={solution.title} data-selected={active === index}><input type="radio" name={`${id}-solution`} checked={active === index} onChange={() => setActive(index)} aria-controls={`${id}-panel-${index}`} /><span>{solution.title}</span></label>)}</fieldset>
    <div>{d.solutions.map((solution, index) => {
      const service = services.find(s => s.slug === solution.service);
      return <section key={solution.title} id={`${id}-panel-${index}`} hidden={active !== index} aria-labelledby={`${id}-title-${index}`} className={v.productPanel}>
        <div className={v.productCopy}><h3 id={`${id}-title-${index}`}>{solution.title}</h3><p>{solution.text}</p><div className={v.productPurpose}><strong>Designed to help</strong><p>{solution.objective}</p></div><details className={v.scope}><summary>People and practical scope<DetailPlus /></summary><dl><div><dt>Users</dt><dd>{solution.audience}</dd></div><div><dt>Tasks to support</dt><dd>{solution.workflow.split("→").map(s => s.trim()).join(" · ")}</dd></div></dl></details><div className={v.productActions}><IndustryAction subject={d.title} solution={solution.title} source={`industry-solution-${d.layout}`}>Discuss this solution</IndustryAction>{service && <Link href={`/services/${service.slug}`}>{service.title}</Link>}</div></div>
        <div className={v.productVisual} key={`${active}-${index}`} aria-hidden="true"><div className={v.productEmblem}><div className={v.visualDisc} /><SectorEmblem kind={d.layout} /></div><span>{solution.audience}</span><small>Workflow focus</small></div>
      </section>;
    })}</div>
  </div>;
}

export function ReviewStudio({ opportunities }: { opportunities: IndustryDossier["aiOpportunities"] }) {
  const [active, setActive] = useState(0);
  const id = useId();
  return <div className={v.reviewStudio}>
    <fieldset className={v.reviewChoices}><legend className="sr-only">Choose an AI opportunity</legend>{opportunities.map((a, index) => <label key={a.title} data-selected={active === index}><input type="radio" name={`${id}-ai`} checked={active === index} onChange={() => setActive(index)} aria-controls={`${id}-review-${index}`} /><span>{a.title}</span></label>)}</fieldset>
    <div>{opportunities.map((a, index) => <section id={`${id}-review-${index}`} hidden={active !== index} key={a.title} className={v.reviewPanel} aria-labelledby={`${id}-ai-title-${index}`}><h3 id={`${id}-ai-title-${index}`}>{a.title}</h3><p>{a.text}</p><div className={v.reviewBoundary}><svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="15" fill="currentColor" /><path d="m9 16 5 5 9-10" fill="none" stroke="#000" strokeWidth="2" /></svg><div><strong>Human review stays here</strong><p>{a.review}</p></div></div></section>)}</div>
  </div>;
}
