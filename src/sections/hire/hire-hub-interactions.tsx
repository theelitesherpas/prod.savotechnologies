"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import type { HireRole } from "@/constants/hire";
import { ServiceIcon } from "@/components/shared/service-icon";
import { HiringAction } from "./hire-interactions";
import { HiringArrow, HiringCheck } from "./hire-art";
import { HIRING_STEPS, WORKING_MODELS, inr } from "./hire-content";
import s from "./hire-hub.module.css";

export type HubRole = Pick<HireRole, "slug" | "title" | "heroLead" | "stack" | "monthly" | "iconSlug"> & { focus: string[]; assignment: string };

function useArrival<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (!("IntersectionObserver" in window)) { node.dataset.arrived = "true"; return; }
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        node.dataset.arrived = "true";
        observer.disconnect();
      }
    }, { threshold: .15 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return ref;
}

export function HiringAssembly() {
  const ref = useArrival<HTMLDivElement>();
  return <div ref={ref} className={s.assembly} data-hiring-assembly="fit">
    <svg className={s.heroMap} viewBox="0 0 620 420" aria-hidden="true" focusable="false" fill="none">
      <path className={s.mapFrame} d="M32 40h115l24 24h303l24-24h90v326H32z"/>
      <path className={s.mapGrid} d="M32 90h556M32 330h556M92 40v326M528 40v326"/>
      <rect x="16" y="120" width="174" height="72" rx="8" fill="#fff"/>
      <rect x="16" y="250" width="174" height="72" rx="8" fill="#fff"/>
      <rect x="464" y="120" width="140" height="72" rx="8" fill="#fff"/>
      <rect x="464" y="250" width="140" height="72" rx="8" fill="#fff"/>
      <g className={s.heroConnections}><path d="M190 156h30v47h24M190 286h30v-47h24M421 203h24v-47h19M421 239h24v47h19" pathLength="1"/></g>
      <path className={s.slotOutline} d="M243 102h63c-7-8-11-17-11-26a28 28 0 0 1 56 0c0 9-4 18-11 26h72a10 10 0 0 1 10 10v69c9-7 18-11 27-11a28 28 0 0 1 0 56c-9 0-18-4-27-11v92a10 10 0 0 1-10 10H243a10 10 0 0 1-10-10v-64c-9 7-18 11-27 11a28 28 0 0 1 0-56c9 0 18 4 27 11v-87a10 10 0 0 1 10-10z"/>
      <g className={s.roleTile}>
        <path fill="#df2525" d="M243 102h63c-7-8-11-17-11-26a28 28 0 0 1 56 0c0 9-4 18-11 26h72a10 10 0 0 1 10 10v69c9-7 18-11 27-11a28 28 0 0 1 0 56c-9 0-18-4-27-11v92a10 10 0 0 1-10 10H243a10 10 0 0 1-10-10v-64c-9 7-18 11-27 11a28 28 0 0 1 0-56c9 0 18 4 27 11v-87a10 10 0 0 1 10-10z"/>
        <path d="m300 145-16 15 16 15m53-30 16 15-16 15m-20-35-13 39" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
      </g>
    </svg>
    <strong className={s.mapTitle}>Your team. Connected.</strong>
    <div className={`${s.mapLabel} ${s.directionLabel}`}>Product<br/>direction</div>
    <div className={`${s.mapLabel} ${s.contextLabel}`}>Tools &amp;<br/>context</div>
    <div className={`${s.mapLabel} ${s.reviewLabel}`}><HiringCheck/>Review</div>
    <div className={`${s.mapLabel} ${s.handoverLabel}`}><HiringCheck/>Handover</div>
    <div className={s.developerLabel}><strong>Savo<br/>developer</strong><span>Build · test<br/>document</span></div>
    <p className={s.artNote}>Your team sets priorities; a developer builds within agreed responsibilities and shared review.</p>
  </div>;
}

export function DeveloperPicker({ roles }: { roles: HubRole[] }) {
  const [slug, setSlug] = useState(roles[0]?.slug);
  const id = useId();
  const role = roles.find(item => item.slug === slug) ?? roles[0];
  if (!role) return <div className={s.empty}><p>Tell us the role and technology your team needs.</p><HiringAction source="hire-hub-empty" className={s.primary}>Discuss your requirement</HiringAction></div>;
  return <div className={s.picker}>
    <fieldset className={s.roleList}><legend className={s.srOnly}>Choose a developer role</legend>{roles.map(item => <label key={item.slug} data-selected={item.slug === role.slug}>
      <input type="radio" name={id} value={item.slug} checked={item.slug === role.slug} onChange={() => setSlug(item.slug)} aria-controls={`${id}-brief`} />
      <ServiceIcon slug={(item.iconSlug === "custom-software" ? "custom-software-development" : item.iconSlug === "mobile-apps" ? "mobile-app-development" : item.iconSlug) as never} className={s.roleIcon} />
      <span>{item.title}</span><HiringArrow />
    </label>)}</fieldset>
    <div className={s.rolePanel} id={`${id}-brief`} role="region" aria-labelledby={`${id}-title`}>
      <h3 id={`${id}-title`} aria-live="polite">{role.title}</h3>
      <div key={role.slug} className={s.roleChange}>
        <p>{role.heroLead}</p>
        <ul className={s.focusList}>{role.focus.map(item => <li key={item}><HiringCheck />{item}</li>)}</ul>
        <div className={s.stack} aria-label="Relevant technologies">{role.stack.slice(0, 5).map(item => <span key={item}>{item}</span>)}</div>
        <details className={s.assignment}><summary>How we start the work<HiringArrow /></summary><p>{role.assignment}</p><small>We agree scope, access and review criteria with your team before work begins.</small></details>
      </div>
      <div className={s.roleBottom}><div><span>Listed monthly rate</span><strong>{role.monthly > 0 ? inr(role.monthly) : "Discuss scope"}</strong></div><Link href={`/hire/${role.slug}`} className={s.link}>View full role<HiringArrow /></Link></div>
      <p className={s.rateNote}>Allocation, availability and final terms are confirmed for your requirement.</p>
      <HiringAction subject={role.title} source="hire-hub-role" className={s.primary}>Discuss this role</HiringAction>
    </div>
  </div>;
}

const TEAM_ROLES = [
  ["Developer"],
  ["Technical lead", "Developer", "Complementary developer"],
  ["Technical lead", "Developers", "QA", "Delivery coordination"],
] as const;

export function TeamBuilder() {
  const [index, setIndex] = useState(0);
  const id = useId();
  const ref = useArrival<HTMLDivElement>();
  const model = WORKING_MODELS[index];
  return <div className={s.teamBuilder} ref={ref}>
    <div className={s.modelChoices} role="group" aria-label="Choose a working model">{WORKING_MODELS.map((item, i) => <button key={item.key} type="button" aria-pressed={i === index} aria-controls={`${id}-team`} onClick={() => setIndex(i)}><span>{item.title}</span><small>{item.fit}</small><HiringArrow /></button>)}</div>
    <div id={`${id}-team`} className={s.teamPanel}>
      <figure className={s.teamScene} data-model={model.key}>
        <div className={s.teamOwner}><span>Your team</span><strong>Product direction</strong></div>
        <svg key={`${model.key}-line`} className={s.teamConnector} viewBox="0 0 600 55" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path d={index === 0 ? "M300 0 V55" : index === 1 ? "M300 0 V20 M100 20 H500 M100 20 V55 M300 20 V55 M500 20 V55" : "M300 0 V20 M75 20 H525 M75 20 V55 M225 20 V55 M375 20 V55 M525 20 V55"} pathLength="1" /></svg>
        <ul key={model.key} className={s.teamNodes}>{TEAM_ROLES[index].map((name, i) => <li key={name} style={{ animationDelay: `${i * 65}ms` }}><span aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" focusable="false"><rect x="5" y="4" width="14" height="16" rx="2" /><path d="m9 10 3 2-3 2m5 0h2" /></svg></span><strong>{name}</strong></li>)}</ul>
        <figcaption>We agree team roles, responsibilities and allocation around your scope.</figcaption>
      </figure>
      <div className={s.modelCopy}><h3 aria-live="polite">{model.title}</h3><p>{model.text}</p></div>
      <dl className={s.ownership}><div><dt>You guide</dt><dd>{model.client}</dd></div><div><dt>We contribute</dt><dd>{model.savo}</dd></div><div><dt>Together, review</dt><dd>{model.output}</dd></div></dl>
      <HiringAction source="hire-hub-model" model={model.title} className={s.primary}>Discuss this team setup</HiringAction>
    </div>
  </div>;
}

function StepDrawing({ index }: { index: number }) {
  return <svg viewBox="0 0 150 100" aria-hidden="true" focusable="false" fill="none" className={s.stepDrawing}>
    {index === 0 ? <><rect x="25" y="10" width="95" height="78" rx="7" /><path d="M41 29h53M41 47h64M41 65h34" /><path className={s.redStroke} d="m88 66 9 8 16-19" /></>
      : index === 1 ? <><rect x="10" y="25" width="55" height="60" rx="6" /><rect x="83" y="12" width="55" height="73" rx="6" /><path d="M22 63h30M22 74h20M95 55h30M95 67h21" /><circle cx="37" cy="44" r="7" /><circle cx="110" cy="33" r="8" /><path className={s.redStroke} d="m108 81 6 5 12-13" /></>
      : index === 2 ? <><rect x="16" y="15" width="118" height="70" rx="7" /><path d="M16 34h118M34 50h65M34 65h43" /><path className={s.redStroke} d="m104 59 7 7 13-17" /></>
      : <><rect x="12" y="22" width="76" height="60" rx="7" /><path d="m28 41 9 8-9 8m19 0h20M89 51h19" /><circle cx="121" cy="51" r="18" /><path className={s.redStroke} d="m113 51 6 6 11-13" /></>}
  </svg>;
}

export function HiringTimeline() {
  const ref = useRef<HTMLOListElement>(null);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = node.getBoundingClientRect();
      const progress = media.matches ? 1 : Math.max(0, Math.min(1, (innerHeight * .6 - rect.top) / Math.max(1, rect.height - 70)));
      node.style.setProperty("--journey-progress", String(progress));
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    media.addEventListener("change", schedule);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("scroll", schedule); window.removeEventListener("resize", schedule); media.removeEventListener("change", schedule); };
  }, []);
  return <ol ref={ref} className={s.timeline}>{HIRING_STEPS.map((item, index) => <li key={item.name}><span className={s.stepNumber}>{index + 1}</span><div><h3>{item.name}</h3><p>{item.text}</p></div><StepDrawing index={index} /></li>)}</ol>;
}
