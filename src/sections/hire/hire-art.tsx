import type { CSSProperties } from "react";
const text:CSSProperties={fontFamily:"var(--font-sans)",fontSize:15,fill:"#555"};
const heading:CSSProperties={fontFamily:"var(--font-serif)",fontSize:23,fontWeight:500,fill:"#111"};
export function HiringArrow(){return <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12h15m-6-6 6 6-6 6"/></svg>;}
export function HiringCheck(){return <svg aria-hidden="true" viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 4 4L19 6"/></svg>;}
export function TeamArt({names=["Your product team","Savo developer","Shared delivery"],compact=false}:{names?:readonly string[];compact?:boolean}) {
 return <svg viewBox={compact?"0 0 760 270":"0 0 1120 300"} aria-hidden="true" focusable="false" style={{display:"block",width:"100%",height:"auto"}}>
  {compact? <>
   <path d="M191 131h98m182 0h98" fill="none" stroke="#949494" strokeWidth="2" strokeDasharray="5 6"/>
   {names.slice(0,3).map((name,i)=><g key={name}><rect x={28+i*250} y="53" width="204" height="160" rx="12" fill={i===1?"#111":"#fff"}/><path d={`M${91+i*250} 113h78m-78 12h54m-54 12h66`} fill="none" stroke={i===1?"#ff6b6b":"#949494"} strokeWidth="3"/><text x={130+i*250} y="178" textAnchor="middle" style={{...text,fill:i===1?"#fff":"#555",fontSize:14}}>{name}</text></g>)}
  </>:<>
   <path d="M309 141h91m320 0h91" fill="none" stroke="#949494" strokeWidth="2" strokeDasharray="5 6"/>
   <rect x="25" y="43" width="300" height="211" rx="12" fill="#fff"/>
   <text x="57" y="90" style={heading}>{names[0]}</text>
   {["Product direction","Your tools & context","Review & acceptance"].map((label,i)=><g key={label}><circle cx="63" cy={130+i*38} r="4" fill="#b82222"/><text x="79" y={135+i*38} style={text}>{label}</text></g>)}
   <rect x="410" y="18" width="300" height="264" rx="12" fill="#111"/>
   <path d="M442 56h28m-28 9h19m-19 9h28" fill="none" stroke="#ff6b6b" strokeWidth="2"/>
   <text x="442" y="116" style={{...heading,fill:"#fff"}}>{names[1]}</text>
   <text x="442" y="157" style={{...text,fill:"#b0b0b0"}}>A defined responsibility.</text>
   <text x="442" y="183" style={{...text,fill:"#b0b0b0"}}>Part of your workflow.</text>
   <rect x="442" y="219" width="236" height="33" rx="5" fill="#202020"/><text x="460" y="241" style={{...text,fill:"#fff",fontSize:13}}>Build · test · document</text>
   <rect x="795" y="43" width="300" height="211" rx="12" fill="#fff"/>
   <text x="827" y="90" style={heading}>{names[2]}</text>
   {["Agreed assignments","Reviewable changes","Recorded handovers"].map((label,i)=><g key={label}><path d={`m827 ${130+i*38} 5 5 9-11`} fill="none" stroke="#b82222" strokeWidth="2"/><text x="853" y={135+i*38} style={text}>{label}</text></g>)}
  </>}
 </svg>;
}
export function AssignmentArt({phase=0}:{phase?:number}){return <svg viewBox="0 0 480 280" aria-hidden="true" focusable="false" style={{width:"100%",height:"auto",display:"block"}}>
 <rect x="38" y="28" width="404" height="220" rx="12" fill="#fff"/>
 <rect x="61" y="49" width="128" height="25" rx="4" fill="#f7f7f7"/><text x="72" y="67" style={{...text,fontSize:12}}>First assignment</text>
 <text x="62" y="116" style={{...heading,fontSize:20}}>From task to reviewed work.</text>
 {["Scope & acceptance","Implementation & checks","Review & handover"].map((label,i)=><g key={label}><rect x="62" y={147+i*27} width="14" height="14" rx="3" fill={i<=phase?"#df2525":"#e8e8e8"}/>{i<=phase?<path d={`m65 ${154+i*27} 3 3 5-6`} fill="none" stroke="#fff" strokeWidth="1.5"/>:null}<text x="89" y={159+i*27} style={{...text,fontSize:13}}>{label}</text></g>)}
 </svg>;}
