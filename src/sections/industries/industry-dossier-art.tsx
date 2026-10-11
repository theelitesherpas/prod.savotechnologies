import type { IndustryLayout } from "@/content/industries/schema";

/** Authored sector symbols and connection topologies; no live operational data. */
export function SectorGlyph({ kind }: { kind: IndustryLayout }) {
  const paths: Record<IndustryLayout, string> = {
    care: "M5 24h8l5-12 8 25 6-13h11M9 7h30v34H9",
    ledger: "M8 8h32v32H8zM8 17h32M19 17v23M25 24h9m-9 8h9",
    commerce: "M8 18h32v23H8zM6 18l4-10h28l4 10M17 25v16m8-16h9v8h-9",
    route: "M7 35V12h12v10h22v13M7 35h34M10 35a4 4 0 1 0 8 0m15 0a4 4 0 1 0 8 0M25 10h14m-5-5 5 5-5 5",
    property: "M6 23 24 7l18 16M11 20v21h26V20M20 41V27h8v14",
    learning: "M5 11h14l5 4 5-4h14v26H29l-5 4-5-4H5zM24 15v26M11 20h7m-7 7h7m12-7h7m-7 7h7",
    stay: "M8 41V9h32v32M5 41h38M15 16h5m8 0h5m-18 8h5m8 0h5M20 41V32h8v9",
    production: "M6 41V24l11-8v10l11-8v10h14v13H6M33 28V7h7v21M13 34h4m7 0h4m7 0h3",
    civic: "M5 18 24 7l19 11H5M10 23v13m9-13v13m10-13v13m9-13v13M7 41h34M7 36h34",
    grid: "M24 5 9 43m15-38 15 38M15 19h18M12 29h24M9 43h30M17 19l14 10m-14 0 14-10M4 12h10m20 0h10",
  };
  return <svg viewBox="0 0 48 48" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d={paths[kind]} /></svg>;
}

/** Six perimeter actors and one shared record. Shapes differ by operating model. */
export function EcosystemPaths({ kind }: { kind: IndustryLayout }) {
  const paths: Record<IndustryLayout, string[]> = {
    care: ["M150 74H220V174H300", "M450 74H380V174H300", "M150 174H450", "M150 274H220V174", "M450 274H380V174", "M150 74V274M450 74V274"],
    ledger: ["M150 74H450V274H150V74", "M150 174H450", "M300 74V274", "M150 274H220V174H380V74"],
    commerce: ["M150 74H300L450 174 300 274H150L150 74", "M450 74V274", "M300 74V174H150", "M450 174H300V274"],
    route: ["M150 74H300V174H450V274H150V174H300", "M450 74H380V174", "M150 274H220V174", "M150 74H220V174"],
    property: ["M150 74H220V274H150", "M450 74H380V274H450", "M220 174H380", "M150 174H450"],
    learning: ["M150 74H450V274H150V74", "M150 174H450", "M300 74V274", "M150 274H220V174H300"],
    stay: ["M150 74H450V174H150V274H450", "M300 74V274", "M150 174H220V74", "M450 274H380V174"],
    production: ["M150 74H450V174H150V274H450", "M300 74V274", "M450 274V74", "M150 174H300"],
    civic: ["M150 74H220V174H380V74H450", "M150 174H450", "M220 174V274H150", "M380 174V274H450"],
    grid: ["M300 74V274", "M150 74H450", "M150 174H450", "M150 274H450", "M150 74V274M450 74V274"],
  };
  return <svg viewBox="0 0 600 348" preserveAspectRatio="none" fill="none" aria-hidden="true" focusable="false">{paths[kind].map((d, i) => <path key={i} d={d} stroke={i === 0 ? "#ff6b6b" : "#666"} strokeWidth="1.25" vectorEffect="non-scaling-stroke" pathLength="1" />)}<circle cx="300" cy="174" r="5" fill="#ff3333" /></svg>;
}

export function DeliveryDrawing() {
  return <svg viewBox="0 0 660 160" fill="none" aria-hidden="true" focusable="false"><path d="M55 80h550" stroke="#666" strokeWidth="1.4" /><path d="M55 80h190M415 80h190" stroke="#ff6b6b" strokeWidth="2" /><circle cx="55" cy="80" r="19" fill="#171717" stroke="#ff6b6b" /><path d="m47 80 6 6 11-13" stroke="#ff6b6b" strokeWidth="1.7" /><rect x="190" y="35" width="90" height="90" rx="7" fill="#171717" stroke="#666" /><path d="M211 60h48m-48 12h26m-26 24h48" stroke="#b0b0b0" strokeWidth="1.5" /><path d="M221 85h13" stroke="#ff6b6b" strokeWidth="3" /><rect x="380" y="35" width="90" height="90" rx="7" fill="#171717" stroke="#666" /><path d="m396 80 12-12m-12 12 12 12m35-24 12 12-12 12m-15-30-10 36" stroke="#ff6b6b" strokeWidth="1.7" /><circle cx="605" cy="80" r="19" fill="#df2525" /><path d="m597 80 6 6 11-13" stroke="#fff" strokeWidth="1.7" /></svg>;
}
