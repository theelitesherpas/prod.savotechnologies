export function AboutArrow() {
  return <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12h15m-6-6 6 6-6 6" /></svg>;
}
export function AboutLinkedIn() {
  return <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05a3.74 3.74 0 0 1 3.37-1.85c3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12ZM7.12 20.45H3.56V9h3.56v11.45Z" /></svg>;
}
export function AboutMail() {
  return <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>;
}
export function AboutPlus() {
  return <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg>;
}
export function AboutGlyph({ kind, className }: { kind: string; className?: string }) {
  const paths = kind === "Engineering" ? <><rect x="3" y="4" width="26" height="24" rx="3" /><path d="M3 10h26m-17 5-4 4 4 4m8-8 4 4-4 4m-3-10-2 12" /></> :
    kind === "Design" ? <><rect x="4" y="4" width="24" height="24" rx="3" /><path d="M4 11h24M12 11v17m5-11h6m-6 5h6" /></> :
    kind === "AI" ? <><rect x="10" y="10" width="12" height="12" rx="2" /><path d="M13 4v6m6-6v6m-6 12v6m6-6v6M4 13h6m-6 6h6m12-6h6m-6 6h6" /><circle cx="16" cy="16" r="2" /></> :
    kind === "Strategy" ? <><path d="M5 27V5m0 22h22M9 22l7-8 5 3 6-10" /><path d="M21 7h6v6" /></> :
    <><circle cx="16" cy="16" r="11" /><path d="m10 16 4 4 8-9" /></>;
  return <svg aria-hidden="true" className={className} width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">{paths}</svg>;
}
