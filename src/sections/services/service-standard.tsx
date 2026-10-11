import type { ServiceDetail } from "@/constants/services-detail";
import { EngineeringExplorer } from "./service-explorers";
import s from "./service-page.module.css";

export function ServiceJudgment({ detail }: { detail: ServiceDetail }) {
  if (!detail.whenNeeded?.length && !detail.whenNot?.length) return null;
  return <aside className={s.fit} aria-labelledby="fit-heading"><h3 id="fit-heading">A good fit when…</h3>
    <ul>{detail.whenNeeded?.map(w => <li key={w}><svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 4 4L19 6" /></svg><span>{w}</span></li>)}</ul>
    {!!detail.whenNot?.length && <details className={s.alternative}><summary>When a simpler approach may be better<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="m6 9 6 6 6-6" /></svg></summary><ul>{detail.whenNot.map(w => <li key={w}>{w}</li>)}</ul></details>}
  </aside>;
}

export function ServiceEngineeringNotes({ detail }: { detail: ServiceDetail }) {
  return <section id="engineering" className={`${s.section} ${s.engineering}`} aria-labelledby="engineering-heading"><div className={s.rail}>
    <div className={s.sectionIntro}><h2 id="engineering-heading">Good experiences need strong foundations.</h2><p>Look beyond the interface. Explore how access, quality and ongoing care fit into the plan.</p></div>
    <EngineeringExplorer slug={detail.slug} architecture={detail.architecture} security={detail.security} quality={detail.quality} afterLaunch={detail.afterLaunch} />
    {!!detail.integrations?.length && <div className={s.integrationRow}><h3>Connections that matter</h3><ul aria-label="Possible project integrations">{detail.integrations.map(i => <li key={i}>{i}</li>)}</ul></div>}
    <p className={s.engineeringNote}>Technical requirements, checks and responsibilities are agreed as part of the project scope.</p>
  </div></section>;
}
