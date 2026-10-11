import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import type { IndustryDossier } from "@/content/industries/schema";
import { DetailPlus, DetailReveal, SectorEmblem } from "./industry-detail-studio";
import v from "./industry-detail-polish.module.css";
import s from "./industry-dossier.module.css";

type Service = { slug: string; title: string };
export function DetailContext({ dossier: d }: { dossier: IndustryDossier }) {
  return <section id="context" className={`${s.section} ${s.gray}`} aria-labelledby="industry-context-title"><div className={s.rail}>
    <div className={s.sectionHead}><h2 id="industry-context-title">{d.ecosystemTitle}</h2><p>{d.summary}</p></div>
    <div className={v.contextGrid}>
      <DetailReveal className={v.contextImage}><figure>{d.image ? <div className={v.photo}><Image src={d.image} alt={d.imageAlt} fill sizes="(max-width: 900px) calc(100vw - 40px), 620px" /></div> : <div className={v.photoFallback}><SectorEmblem kind={d.layout} /></div>}<figcaption>The people, places and operating context shape every product decision.</figcaption></figure></DetailReveal>
      <div className={v.contextQuestions}><h3>What needs attention.</h3>{d.challenges.map(c => <details key={c.title}><summary>{c.title}<DetailPlus /></summary><p>{c.text}</p></details>)}<details><summary>A closer look at the business context<DetailPlus /></summary><p>{d.overview}</p></details></div>
    </div>
  </div></section>;
}

export function DetailEngineering({ dossier: d }: { dossier: IndustryDossier }) {
  return <section id="engineering" className={s.section} aria-labelledby="industry-engineering-title"><div className={s.rail}>
    <div className={s.sectionHead}><h2 id="industry-engineering-title">Built around your systems.</h2><p>Plan the connections, protect the information and agree how the product will be evaluated.</p></div>
    <div className={v.engineeringGrid}>
      <div className={v.integrationField}><DetailReveal className={v.integrationArt}><SectorEmblem key="emblem" kind={d.layout} /><div key="context"><h3>Connect what matters.</h3><p>{d.ecosystemCore}</p></div></DetailReveal><ul>{d.integrations.map(i => <li key={i}>{i}</li>)}</ul><p className={s.note}>Interfaces to assess - not a claim of vendor access or certification.</p></div>
      <div className={v.safeguards}><h3>Security and reliability.</h3>{d.safeguards.map(c => <details key={c.title}><summary>{c.title}<DetailPlus /></summary><p>{c.text}</p></details>)}<details><summary>Technology considerations<DetailPlus /></summary><ul>{d.technologies.map(t => <li key={t}>{t}</li>)}</ul></details><Link href="/technology" className={v.underlined}>Our technology approach</Link></div>
    </div>
    <div className={v.outcomeStrip}><div><h3>What should improve?</h3><p>Targets to evaluate - not achieved results.</p></div><div className={v.outcomeChoices}>{d.outcomes.map(o => <details key={o.title}><summary>{o.title}<DetailPlus /></summary><p>{o.text}</p><strong>How to measure it</strong><p>{o.measure}</p></details>)}</div></div>
  </div></section>;
}

export function DetailDelivery() {
  const steps = [["Understand", "Users, priorities and existing systems."], ["Design", "Scope, permissions and acceptance criteria."], ["Build & review", "Engineering, testing and stakeholder feedback."], ["Prepare handover", "Release, documentation and ownership."]];
  return <section className={`${s.section} ${s.gray}`} aria-labelledby="industry-delivery-title"><div className={s.rail}><div className={s.sectionHead}><h2 id="industry-delivery-title">A clear start. A considered release.</h2><p>Agree the scope and responsibilities before the build.</p></div><ol className={v.deliverySteps}>{steps.map(([title, text], index) => <li key={title}><div className={v.stageShape} data-stage={index} aria-hidden="true"><span /><span /><span /></div><h3>{title}</h3><p>{text}</p></li>)}</ol><details className={v.deliveryNotes}><summary>Planning collaboration and handover<DetailPlus /></summary><p>Agree stakeholder availability, review cadence, access, data-residency needs and operating ownership for the actual project.</p><Link href="/company-profile" className={v.underlined}>Company information</Link></details></div></section>;
}

export function DetailConnections({ services, industries }: { services: Service[]; industries: IndustryDossier[] }) {
  if (!services.length && !industries.length) return null;
  return <section className={`${s.section} ${s.gray}`} aria-label="Related capabilities and industries"><div className={`${s.rail} ${v.connections}`}>
    {services.length > 0 && <div className={v.capabilities}><h3>The capabilities behind the work.</h3><ul>{services.map(service => <li key={service.slug}><Link href={`/services/${service.slug}`}><span>{service.title}</span><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 18 18 6M7 6h11v11" /></svg></Link></li>)}</ul></div>}
    {industries.length > 0 && <div className={v.related}><h3>Connected industries.</h3><div className={v.relatedList}>{industries.map(industry => <Link key={industry.slug} href={`/industries/${industry.slug}`}><div className={v.relatedPhoto}>{industry.image ? <Image src={industry.image} alt={industry.imageAlt} fill sizes="140px" /> : <SectorEmblem kind={industry.layout} />}</div><div><h4>{industry.title}</h4><p>{industry.summary}</p></div></Link>)}</div></div>}
  </div></section>;
}
