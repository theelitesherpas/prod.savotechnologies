import s from "./enterprise.module.css";

export function EnterpriseArrow() {
  return <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12h16m-6-6 6 6-6 6" /></svg>;
}
export function EnterprisePlus() {
  return <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M4 12h16" /><path d="M12 4v16" /></svg>;
}
export function InitiativeArt() {
  return <figure className={s.initiative} aria-label="Illustrative relationship between priorities, decisions and delivery">
    <div className={s.priorityShape}><span>Your priorities</span><strong>The work<br />that matters.</strong><svg aria-hidden="true" viewBox="0 0 84 84"><path d="M0 0h84v84H0z" fill="#000"/><path d="M19 42h46M42 19v46" stroke="#fff" strokeWidth="9"/></svg></div>
    <div className={s.decisionShape}><span>Shared decisions</span><strong>A clear<br />direction.</strong><div aria-hidden="true"><i/><i/><i/></div></div>
    <div className={s.deliveryShape}><span>Delivery scope</span><strong>Work you<br />can review.</strong><svg aria-hidden="true" viewBox="0 0 84 84"><rect x="8" y="8" width="68" height="68" rx="34" fill="#fff"/><path d="m25 42 12 12 23-25" fill="none" stroke="#000" strokeWidth="7"/></svg></div>
    <figcaption>Illustrative coordination - not a live project or team chart.</figcaption>
  </figure>;
}
export function EngagementArt({ kind }: { kind: string }) {
  return <svg className={s.engagementArt} viewBox="0 0 400 300" fill="none" aria-hidden="true">
    {kind === "discovery" ? <><rect x="65" y="39" width="213" height="220" rx="12" fill="#e8e8e8"/><rect x="100" y="20" width="213" height="220" rx="12" fill="#fff"/><path d="M132 62h122M132 85h83M132 186h103" stroke="#757575" strokeWidth="5"/><circle cx="258" cy="169" r="56" fill="#df2525"/><path d="m298 208 40 40" stroke="#df2525" strokeWidth="16" strokeLinecap="round"/><path d="M237 169h42M258 148v42" stroke="#fff" strokeWidth="7"/></> :
    kind === "fixed-scope" ? <><rect x="64" y="50" width="272" height="200" rx="16" fill="#fff"/><rect x="90" y="76" width="66" height="148" rx="6" fill="#e8e8e8"/><rect x="170" y="76" width="66" height="148" rx="6" fill="#e8e8e8"/><rect x="250" y="76" width="60" height="148" rx="6" fill="#df2525"/><path d="m264 150 12 12 23-26" stroke="#fff" strokeWidth="6" strokeLinecap="round"/></> :
    kind === "product-team" ? <><rect x="52" y="61" width="126" height="178" rx="12" fill="#000"/><rect x="193" y="61" width="155" height="178" rx="12" fill="#fff"/><circle cx="115" cy="126" r="29" fill="#fff"/><path d="M77 199h76" stroke="#fff" strokeWidth="12" strokeLinecap="round"/><rect x="219" y="88" width="101" height="70" rx="8" fill="#df2525"/><rect x="219" y="171" width="43" height="40" rx="6" fill="#e8e8e8"/><rect x="277" y="171" width="43" height="40" rx="6" fill="#e8e8e8"/></> :
    <><rect x="62" y="40" width="276" height="220" rx="12" fill="#fff"/><rect x="88" y="66" width="224" height="43" rx="6" fill="#e8e8e8"/><rect x="88" y="128" width="95" height="43" rx="6" fill="#e8e8e8"/><rect x="201" y="128" width="111" height="43" rx="6" fill="#df2525"/><path d="M240 150h33M256 134v32" stroke="#fff" strokeWidth="5"/><rect x="88" y="190" width="224" height="43" rx="6" fill="#e8e8e8"/></>}
  </svg>;
}
