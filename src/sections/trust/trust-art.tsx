import s from "./trust.module.css";

export function TrustArrow() {
  return <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12h16m-6-6 6 6-6 6" /></svg>;
}
export function TrustPlus() {
  return <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg>;
}
export type TrustSymbolKind = "code" | "design" | "document" | "access" | "agreement" | "team" | "private" | "evidence" | "environments" | "validation" | "dependencies" | "monitoring" | "backup" | "handover" | "support";
export function TrustSymbol({ kind, size = 28 }: { kind: TrustSymbolKind; size?: number }) {
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    {kind === "code" && <><rect x="2" y="3" width="20" height="18" rx="2" /><path d="M2 8h20m-13 4-3 3 3 3m6-6 3 3-3 3M12.5 12l-1 6" /></>}
    {kind === "design" && <><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 9v12m4-6 2 2 4-4" /></>}
    {kind === "document" && <><path d="M14 2H5v20h14V7l-5-5ZM14 2v5h5M8 11h8M8 15h8M8 18h5" /></>}
    {kind === "access" && <><circle cx="8" cy="8" r="4" /><path d="m11 11 10 10m-5-5 3-3m-6 3 3-3M7 7h.01" /></>}
    {kind === "agreement" && <><path d="M14 2H5v20h14V7l-5-5ZM14 2v5h5M8 11h8M8 15h4m-4 3 2-2 2 2 3-3" /></>}
    {kind === "team" && <><circle cx="9" cy="6" r="3" /><path d="M3 20v-3a6 6 0 0 1 12 0v3M17 3a3 3 0 0 1 0 6m1 4a5 5 0 0 1 3 4v3" /></>}
    {kind === "private" && <><path d="M3 3l18 18M9.8 9.8a3 3 0 0 0 4.4 4.4M3 8c-1 1-2 3-2 4 3 5 7 7 11 7 2 0 4-.5 6-2M6 5c2-1 4-1 6-1 4 0 8 3 11 8-.8 1.5-1.8 3-3 4" /></>}
    {kind === "evidence" && <><path d="M4 3h11v18H4V3ZM7 7h5M7 11h3" /><circle cx="16" cy="13" r="4" /><path d="m19 16 3 3" /></>}
    {kind === "environments" && <><rect x="2" y="5" width="5" height="14" rx="1" /><rect x="9.5" y="5" width="5" height="14" rx="1" /><rect x="17" y="5" width="5" height="14" rx="1" /><path d="M4.5 9v6M12 9v6M19.5 9v6" /></>}
    {kind === "validation" && <><rect x="3" y="3" width="18" height="18" rx="2" /><path d="m7 9 2 2 4-4M7 16h10M16 9h1" /></>}
    {kind === "dependencies" && <><rect x="9" y="2" width="6" height="6" rx="1" /><rect x="2" y="16" width="6" height="6" rx="1" /><rect x="16" y="16" width="6" height="6" rx="1" /><path d="M12 8v4H5v4m7-4h7v4" /></>}
    {kind === "monitoring" && <><rect x="2" y="3" width="20" height="15" rx="2" /><path d="M8 22h8M12 18v4M5 11h3l2-4 3 7 2-3h4" /></>}
    {kind === "backup" && <><path d="M20 9a8 8 0 1 0-1 9M20 3v6h-6" /><path d="M8 10h7v7H8v-7ZM10 10v3h3v-3" /></>}
    {kind === "handover" && <><path d="M2 6h7l2 2h11v12H2V6ZM7 13h10m-3-3 3 3-3 3" /></>}
    {kind === "support" && <><path d="M4 13v-2a8 8 0 0 1 16 0v2M4 12H2v7h4v-7H4ZM20 12h2v7h-4v-7h2ZM18 19v2h-5" /></>}
  </svg>;
}

const PACKET_ASSETS: { title: string; detail: string; symbol: TrustSymbolKind }[] = [
  { title: "Source & history", detail: "Code · repositories", symbol: "code" },
  { title: "Design files", detail: "Sources · prototypes", symbol: "design" },
  { title: "Documentation", detail: "Architecture · operating notes", symbol: "document" },
  { title: "Accounts & access", detail: "Infrastructure · credentials", symbol: "access" },
];

/** Illustrative asset packet, not a real project, downloadable contract or certificate. */
export function OwnershipPacket() {
  return <figure className={s.packet} aria-label="Illustrative ownership and handover packet">
    <div className={s.packetTab}>Your product assets</div>
    <div className={s.packetBody}><ul className={s.packetAssets}>{PACKET_ASSETS.map(asset => <li key={asset.title}><TrustSymbol kind={asset.symbol} size={30} /><div><strong>{asset.title}</strong><span>{asset.detail}</span></div></li>)}</ul><div className={s.packetAgreement}><TrustSymbol kind="agreement" size={24} /><span>Defined in your agreement.</span></div></div>
    <figcaption>Illustrative asset packet - not a client handover or legal document.</figcaption>
  </figure>;
}
