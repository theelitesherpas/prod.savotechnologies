"use client";

import { useId, useState, useSyncExternalStore } from "react";
import type { ServiceDetail } from "@/constants/services-detail";
import { ArchitectureArt, DeliveryArt, ServiceArtwork, artForService } from "./service-art";
import { Arrow, useManualTabs } from "./service-interactions";
import s from "./service-page.module.css";

const subscribeLayout = (notify: () => void) => {
  const query = window.matchMedia("(min-width:900px)");
  query.addEventListener("change", notify);
  return () => query.removeEventListener("change", notify);
};
const desktopLayout = () => window.matchMedia("(min-width:900px)").matches;
export function CapabilityExplorer({ slug, title, deliverables }: Pick<ServiceDetail, "slug" | "title" | "deliverables">) {
  const { active, setActive, id, refs, key } = useManualTabs(deliverables.length, true);
  const vertical = useSyncExternalStore(subscribeLayout, desktopLayout, () => true);
  return <div className={s.capabilityExplorer}>
    <div role="tablist" aria-orientation={vertical ? "vertical" : "horizontal"} aria-label={`${title} capabilities`} className={s.capabilityTabs}>{deliverables.map((d, i) => <button type="button" key={d.title} ref={el => { refs.current[i] = el; }} role="tab" id={`${id}-tab-${i}`} aria-controls={`${id}-panel-${i}`} aria-selected={active === i} tabIndex={active === i ? 0 : -1} onClick={() => setActive(i)} onKeyDown={e => key(e, i)}><span>{d.title}</span><Arrow /></button>)}</div>
    <div className={s.capabilityPanels}>{deliverables.map((d, i) => <div key={d.title} role="tabpanel" id={`${id}-panel-${i}`} aria-labelledby={`${id}-tab-${i}`} hidden={active !== i} className={s.capabilityPanel}>
      <figure className={s.capabilityArt}>{active === i && <ServiceArtwork kind={artForService(slug, i)} slug={slug} />}<figcaption>{d.title}: the interface capabilities behind this part of the service.</figcaption></figure>
      <div className={s.capabilityCopy}><h3>{d.title}</h3><p>{d.text}</p></div>
    </div>)}</div>
  </div>;
}

export function EngineeringExplorer({ slug, architecture, security, quality, afterLaunch }: Pick<ServiceDetail, "slug" | "architecture" | "security" | "quality" | "afterLaunch">) {
  const [active, setActive] = useState<number | null>(0);
  const id = useId();
  const notes = [{ title: slug === "ui-ux-design" ? "Accessibility & care" : slug === "digital-marketing" ? "Responsible practice" : "Access & data", text: security }, { title: "Quality & review", text: quality }, { title: "After delivery", text: afterLaunch }];
  return <div className={s.engineeringExplorer}>
    <div><figure className={s.architectureArt}><ArchitectureArt slug={slug} active={active ?? -1} /><figcaption>We shape the architecture around your product, integrations and operating requirements.</figcaption></figure><details className={s.technicalDetail}><summary>Read the technical approach <Arrow /></summary><p>{architecture}</p></details></div>
    <div className={s.engineeringDisclosures}>{notes.map((n, i) => <details key={n.title} name={`${id}-engineering`} open={i === 0} onToggle={e => { if (e.currentTarget.open) setActive(i); else setActive(current => current === i ? null : current); }}><summary><span>{n.title}</span><svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M5 12h14m-7-7v14" /></svg></summary><p>{n.text}</p></details>)}</div>
  </div>;
}

export function DeliveryExplorer({ steps }: { steps: ServiceDetail["process"] }) {
  const { active, setActive, id, refs, key } = useManualTabs(steps.length);
  return <div className={s.deliveryExplorer}>
    <div role="tablist" aria-label="Delivery stages" className={s.deliveryTabs}>{steps.map((step, i) => <button key={step.name} type="button" ref={el => { refs.current[i] = el; }} role="tab" id={`${id}-tab-${i}`} aria-controls={`${id}-panel-${i}`} aria-selected={active === i} tabIndex={active === i ? 0 : -1} onClick={() => setActive(i)} onKeyDown={e => key(e, i)}><span aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>{step.name}</button>)}</div>
    {steps.map((step, i) => <div key={step.name} role="tabpanel" id={`${id}-panel-${i}`} aria-labelledby={`${id}-tab-${i}`} hidden={active !== i} className={s.deliveryPanel}>
      <figure>{active === i && <DeliveryArt phase={i} steps={steps} />}<figcaption>Plan, build, review and release with your team.</figcaption></figure>
      <div><h3>{step.name}</h3><p>{step.text}</p><div className={s.stagePosition} aria-live="polite">Stage {i + 1} of {steps.length}</div></div>
    </div>)}
  </div>;
}
