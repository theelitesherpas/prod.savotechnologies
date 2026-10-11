import type { ServiceDetail } from "@/constants/services-detail";
import { CapabilityExplorer } from "./service-explorers";
import s from "./service-page.module.css";

export function ServiceDeliverables({ detail }: { detail: ServiceDetail }) {
  return <section id="capabilities" className={`${s.section} ${s.capabilitySection}`} aria-labelledby="capabilities-heading"><div className={s.rail}>
    <div className={s.sectionIntro}><h2 id="capabilities-heading">Explore what’s possible.</h2><p>Select a capability to see how it can take shape. Your project brings the pieces together.</p></div>
    <CapabilityExplorer slug={detail.slug} title={detail.title} deliverables={detail.deliverables} />
    <p className={s.scopeNote}>Scope and acceptance criteria are agreed for your project.</p>
  </div></section>;
}
