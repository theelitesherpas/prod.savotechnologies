"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import type { IndustryDossier, IndustryLayout } from "@/content/industries/schema";
import { useEnquiry } from "@/components/shared/enquiry-dialog";
import { EcosystemPaths, SectorGlyph } from "./industry-dossier-art";
import s from "./industry-dossier.module.css";

export function DossierArrow() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 12h16m-6-6 6 6-6 6" /></svg>;
}
export function IndustryAction({ subject, source, children, solution }: { subject: string; source: string; children: ReactNode; solution?: string }) {
  const { open } = useEnquiry();
  return <button type="button" className={s.primary} onClick={() => open(source, `I'd like to discuss software for ${subject}.${solution ? ` Solution: ${solution}.` : ""}`)}>{children}<DossierArrow /></button>;
}

export function Ecosystem({ nodes, core, kind }: { nodes: IndustryDossier["ecosystemNodes"]; core: string; kind: IndustryLayout }) {
  const [active, setActive] = useState(0);
  const [arrived, setArrived] = useState(false);
  const ref = useRef<HTMLElement>(null);
  const id = useId();
  useEffect(() => {
    if (!ref.current || !window.IntersectionObserver) return;
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { setArrived(true); observer.disconnect(); } }, { threshold: .15 });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return <figure className={s.ecosystem} ref={ref} data-ecosystem={kind} data-arrived={arrived}>
    <div className={s.systemScene}>
      <div className={s.systemPaths}><EcosystemPaths kind={kind} /></div>
      <div className={s.systemCore}><SectorGlyph kind={kind} /><strong>{core}</strong></div>
      <div className={s.systemActors}>{nodes.map((n, i) => <button key={n.title} type="button" className={s.actor} data-position={i} aria-pressed={active === i} aria-controls={`${id}-responsibility`} onClick={() => setActive(i)}><span>{n.title}</span><DossierArrow /></button>)}</div>
    </div>
    <div className={s.actorExplanation} id={`${id}-responsibility`} aria-live="polite" aria-atomic="true"><strong>{nodes[active].role}</strong><p>{nodes[active].text}</p></div>
    <figcaption>Select an actor to see its responsibilities and connection to the wider operating system.</figcaption>
  </figure>;
}

export type SectorPreview = Pick<IndustryDossier, "slug" | "title" | "summary" | "image" | "imageAlt" | "layout"> & { solutions: string[] };
export function SectorExplorer({ sectors }: { sectors: SectorPreview[] }) {
  const [active, setActive] = useState(0);
  const id = useId();
  if (!sectors.length) return <p>No industry dossiers are available here. <Link href="/contact" className={s.textLink}>Tell us about your sector.</Link></p>;
  const sector = sectors[active];
  return <div className={s.sectorExplorer}>
    <fieldset className={s.sectorChoices}><legend className="sr-only">Choose an industry to preview</legend>{sectors.map((d, i) => <label key={d.slug} data-selected={i === active}>
      <input type="radio" name={`${id}-industry`} value={d.slug} checked={i === active} onChange={() => setActive(i)} aria-controls={`${id}-preview`} />
      <span className={s.sectorIcon}><SectorGlyph kind={d.layout} /></span><span>{d.title}</span><DossierArrow />
    </label>)}</fieldset>
    <section id={`${id}-preview`} aria-labelledby={`${id}-title`} className={s.sectorPreview}>
      <div className={s.previewPhoto}>{sector.image ? <Image key={sector.image} src={sector.image} alt={sector.imageAlt} fill sizes="(max-width: 900px) calc(100vw - 40px), 620px" /> : <SectorGlyph kind={sector.layout} />}</div>
      <div key={sector.slug} className={s.selectionChange}>
        <h3 id={`${id}-title`}>{sector.title}</h3><p>{sector.summary}</p>
        <ul className={s.previewTopics}>{sector.solutions.slice(0, 3).map(t => <li key={t}>{t}</li>)}</ul>
        <Link href={`/industries/${sector.slug}`} className={s.textLink}>Explore {sector.title}<DossierArrow /></Link>
      </div>
      <p className={s.note}>Explore this sector’s users, systems and product directions.</p>
    </section>
  </div>;
}

export function SolutionExplorer({ solutions, title, kind, serviceLinks }: { solutions: IndustryDossier["solutions"]; title: string; kind: IndustryLayout; serviceLinks: { slug: string; title: string }[] }) {
  const [active, setActive] = useState(0);
  const id = useId();
  return <div className={s.solutionExplorer}>
    <fieldset className={s.solutionChoices}><legend className="sr-only">Choose a solution</legend>{solutions.map((d, i) => <label key={d.title} data-selected={i === active}>
      <input type="radio" name={`${id}-solution`} checked={i === active} onChange={() => setActive(i)} aria-controls={`${id}-solution-panel-${i}`} /><span>{d.title}</span><DossierArrow />
    </label>)}</fieldset>
    <div>{solutions.map((chosen, index) => {
      const service = serviceLinks.find(x => x.slug === chosen.service);
      const steps = chosen.workflow.split("→").map(t => t.trim()).filter(Boolean);
      return <section key={chosen.title} hidden={index !== active} id={`${id}-solution-panel-${index}`} aria-labelledby={`${id}-solution-title-${index}`} className={s.solutionPanel}>
        <div className={index === active ? s.selectionChange : undefined}>
          <div className={s.solutionHeading}><SectorGlyph kind={kind} /><h3 id={`${id}-solution-title-${index}`}>{chosen.title}</h3></div>
          <p>{chosen.text}</p>
          <div className={s.workflowPlate}><strong>{chosen.audience}</strong><ol>{steps.map((step, i) => <li key={`${step}-${i}`}><span>{step}</span>{i < steps.length - 1 && <DossierArrow />}</li>)}</ol><p className={s.note}>The workflow keeps ownership and review clear at each step.</p></div>
          <div className={s.solutionObjective}><strong>What this should make possible</strong><p>{chosen.objective}</p></div>
          <div className={s.actions}><IndustryAction subject={title} solution={chosen.title} source={`industry-solution-${kind}`}>Discuss this solution</IndustryAction>{service && <Link href={`/services/${service.slug}`} className={s.textLink}>{service.title}<DossierArrow /></Link>}</div>
        </div>
      </section>;
    })}</div>
  </div>;
}
