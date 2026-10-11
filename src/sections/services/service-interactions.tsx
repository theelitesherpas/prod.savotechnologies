"use client";

import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { useEnquiry } from "@/components/shared/enquiry-dialog";
import { ServiceArtwork, artForService } from "./service-art";
import type { ServiceDetail } from "@/constants/services-detail";
import s from "./service-page.module.css";

export function Arrow({ className }: { className?: string }) {
  return <svg aria-hidden="true" className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12h16m-6-6 6 6-6 6" /></svg>;
}
export function ServiceAction({ title, source, children, secondary = false }: { title: string; source: string; children: ReactNode; secondary?: boolean }) {
  const { open } = useEnquiry();
  return <button type="button" className={secondary ? s.secondary : s.primary} onClick={() => open(source, `I'd like to discuss ${title.toLowerCase()}.`)}>{children}<Arrow /></button>;
}

export function useManualTabs(length: number, vertical = false) {
  const [active, setActive] = useState(0);
  const id = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  function key(e: KeyboardEvent<HTMLButtonElement>, index: number) {
    const next = e.key === "Home" ? 0 : e.key === "End" ? length - 1 : e.key === "ArrowRight" || (vertical && e.key === "ArrowDown") ? (index + 1) % length : e.key === "ArrowLeft" || (vertical && e.key === "ArrowUp") ? (index + length - 1) % length : null;
    if (next === null) return;
    e.preventDefault(); setActive(next); refs.current[next]?.focus({ preventScroll: true }); refs.current[next]?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }
  return { active, setActive, id, refs, key };
}
function CompanionPhone() {
  return <svg viewBox="0 0 190 340" aria-hidden="true" focusable="false"><rect width="190" height="340" rx="26" fill="#111" /><rect x="6" y="6" width="178" height="328" rx="21" fill="#fff" /><rect x="62" y="13" width="66" height="10" rx="5" fill="#111" /><text x="20" y="58" fill="#111" fontFamily="var(--font-serif)" fontSize="19">Find your place.</text><image href="/images/architecture.webp" x="20" y="78" width="150" height="145" preserveAspectRatio="xMidYMid slice" /><text x="20" y="247" fill="#111" fontFamily="var(--font-serif)" fontSize="14">Room for what’s next.</text><rect x="20" y="267" width="150" height="32" rx="4" fill="#df2525" /><text x="95" y="287" textAnchor="middle" fill="#fff" fontFamily="var(--font-sans)" fontSize="10">Explore places</text><rect x="65" y="320" width="60" height="3" rx="1.5" fill="#111" /></svg>;
}
export function ServiceVisual({ slug }: Pick<ServiceDetail, "slug" | "title" | "short">) {
  const { active, setActive, id, refs, key } = useManualTabs(3);
  const views = slug === "web-development" ? ["Website", "Portal", "Integrations"] : ["Experience", "Workflow", "Interface"];
  const kinds = slug === "web-development" ? [artForService(slug, 0), artForService(slug, 2), artForService(slug, 5)] : [artForService(slug, 0), artForService(slug, 1), artForService(slug, 2)];
  return <figure className={s.visual}>
    <div className={s.heroPreviewTabs} role="tablist" aria-label="Service approaches">{views.map((v, i) => <button key={v} ref={el => { refs.current[i] = el; }} role="tab" type="button" id={`${id}-tab-${i}`} aria-controls={`${id}-panel-${i}`} aria-selected={active === i} tabIndex={active === i ? 0 : -1} onClick={() => setActive(i)} onKeyDown={e => key(e, i)}>{v}</button>)}</div>
    <div className={s.heroStage}>{views.map((v, i) => <div key={v} role="tabpanel" id={`${id}-panel-${i}`} aria-labelledby={`${id}-tab-${i}`} hidden={active !== i} className={s.heroPreviewPanel}>{active === i && <><div className={s.heroBrowser}><ServiceArtwork kind={kinds[i]} slug={slug} /></div>{kinds[i] === "website" && <div className={s.companionPhone}><CompanionPhone /></div>}</>}</div>)}</div>
    <figcaption>Explore how the service brings the website, workflow and interface together.</figcaption>
  </figure>;
}
