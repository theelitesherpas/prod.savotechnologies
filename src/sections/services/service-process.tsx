import type { ServiceDetail } from "@/constants/services-detail";
import { DeliveryExplorer } from "./service-explorers";
import s from "./service-page.module.css";

export function ServiceProcess({ detail }: { detail: ServiceDetail }) {
  return <section id="delivery" className={s.section} aria-labelledby="delivery-heading"><div className={s.rail}>
    <div className={s.sectionIntro}><h2 id="delivery-heading">From first conversation to what’s next.</h2><p>Explore the stages. Each one creates the clarity needed to move forward.</p></div>
    <DeliveryExplorer steps={detail.process} />
  </div></section>;
}
