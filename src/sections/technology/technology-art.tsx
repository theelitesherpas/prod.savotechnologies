import Image from "next/image";
import type { TechnologyTool } from "./technology-content";
import s from "./technology.module.css";

export function TechnologyArrow() {
  return <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12h16m-6-6 6 6-6 6" /></svg>;
}
export function TechnologyPlus() {
  return <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg>;
}
export type TechnologySymbolKind = "frontend" | "mobile" | "backend" | "data" | "ai" | "cloud" | "modular" | "api" | "events" | "cache" | "tenants" | "migration" | "check";
export function TechnologySymbol({ kind, size = 28 }: { kind: TechnologySymbolKind; size?: number }) {
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    {kind === "frontend" && <><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M2 9h20M6 6.5h.01M9 6.5h.01M7 13h4M7 16h8" /></>}
    {kind === "mobile" && <><rect x="6" y="2" width="12" height="20" rx="2" /><path d="M10 5h4M11 19h2" /></>}
    {kind === "backend" && <><rect x="3" y="3" width="18" height="7" rx="2" /><rect x="3" y="14" width="18" height="7" rx="2" /><path d="M7 6.5h.01M7 17.5h.01M12 6.5h5M12 17.5h5M12 10v4" /></>}
    {kind === "data" && <><ellipse cx="12" cy="5" rx="8" ry="3" /><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" /></>}
    {kind === "ai" && <><circle cx="5" cy="5" r="2" /><circle cx="5" cy="19" r="2" /><circle cx="12" cy="12" r="3" /><circle cx="20" cy="12" r="2" /><path d="m6.5 6.5 3.4 3.4m-3.4 7.6 3.4-3.4M15 12h3" /></>}
    {kind === "cloud" && <><path d="M6 18a4 4 0 0 1-1-7.9A7 7 0 0 1 18.4 8a5 5 0 0 1 .6 10H6Z" /><path d="M9 12h6M12 9v6" /></>}
    {kind === "modular" && <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /><path d="M10 6.5h4M10 17.5h4M6.5 10v4M17.5 10v4" /></>}
    {kind === "api" && <><path d="M8 3H5v18h3M16 3h3v18h-3M8 9h8m-3-3 3 3-3 3M16 15H8m3-3-3 3 3 3" /></>}
    {kind === "events" && <><rect x="2" y="9" width="6" height="6" rx="1" /><rect x="16" y="2" width="6" height="6" rx="1" /><rect x="16" y="16" width="6" height="6" rx="1" /><path d="M8 12h4V5h4M12 12v7h4" /></>}
    {kind === "cache" && <><path d="M20 10a8 8 0 1 0-1 7M20 4v6h-6" /><path d="M12 7v5l3 2" /></>}
    {kind === "tenants" && <><rect x="2" y="7" width="5" height="14" rx="1" /><rect x="9.5" y="7" width="5" height="14" rx="1" /><rect x="17" y="7" width="5" height="14" rx="1" /><path d="M4.5 7V3h15v4M12 3v4M4.5 12v4M12 12v4M19.5 12v4" /></>}
    {kind === "migration" && <><rect x="2" y="4" width="6" height="16" rx="1" /><rect x="16" y="4" width="6" height="16" rx="1" /><path d="M8 12h8m-3-3 3 3-3 3M4.5 8h1M18.5 16h1" /></>}
    {kind === "check" && <><rect x="3" y="3" width="18" height="18" rx="2" /><path d="m7 12 3 3 7-7" /></>}
  </svg>;
}

export function TechnologyMark({ tool, kind }: { tool: TechnologyTool; kind: TechnologySymbolKind }) {
  return <>{tool.logo ? <Image src={`/images/technology/${tool.logo}.svg`} alt="" width={36} height={36} /> : <TechnologySymbol kind={kind} size={36} />}<span>{tool.name}</span></>;
}

function AssemblyMarks({ names, logos }: { names: string; logos: string[] }) {
  return <div className={s.assemblyMarks}>{logos.map(logo => <Image key={logo} src={`/images/technology/${logo}.svg`} alt="" width={18} height={18} loading="eager" />)}<span>{names}</span></div>;
}

/** A relationship illustration, not a promised stack or a client deployment. */
export function TechnologyAssembly() {
  return <figure className={s.assembly} aria-label="Illustrative product layers">
    <div className={s.assemblyExperiences}>
      <div className={s.web}><TechnologySymbol kind="frontend" size={38} /><h2>Web products</h2><AssemblyMarks names="Next.js · React" logos={["nextdotjs", "react"]} /></div>
      <div className={s.mobile}><TechnologySymbol kind="mobile" size={38} /><h2>Mobile apps</h2><AssemblyMarks names="Flutter · native" logos={["flutter"]} /></div>
    </div>
    <div className={s.assemblyLogic}>
      <div className={s.services}><TechnologySymbol kind="backend" size={32} /><div><h2>APIs &amp; services</h2><AssemblyMarks names="Node.js · Python" logos={["nodedotjs", "python"]} /></div></div>
      <div className={s.intelligence}><TechnologySymbol kind="ai" size={28} /><h2>AI, where it fits</h2><p>Grounded. Evaluated.</p></div>
    </div>
    <div className={s.assemblyData}><TechnologySymbol kind="data" size={32} /><div><h2>A considered data layer</h2><AssemblyMarks names="PostgreSQL · Redis" logos={["postgresql", "redis"]} /></div></div>
    <div className={s.assemblyOperations}><TechnologySymbol kind="cloud" size={24} /><span>Deploy. Observe. Improve.</span><span>Cloud &amp; DevOps</span></div>
    <figcaption>Illustrative system - not a client deployment or a fixed stack.</figcaption>
  </figure>;
}
