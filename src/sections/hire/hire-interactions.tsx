"use client";
import Link from "next/link";
import { useId, useState, type ReactNode } from "react";
import type { HireRole } from "@/constants/hire";
import { useEnquiry } from "@/components/shared/enquiry-dialog";
import { ServiceIcon } from "@/components/shared/service-icon";
import { COLLABORATION, WORKING_MODELS, inr, roleGuide } from "./hire-content";
import { AssignmentArt, HiringArrow, HiringCheck, TeamArt } from "./hire-art";
import s from "./hire-page.module.css";
export function HiringAction({subject="developers",source,model,children,className}:{subject?:string;source:string;model?:string;children:ReactNode;className?:string}){const{open}=useEnquiry();return <button type="button" className={className??s.primary} onClick={()=>open(source,`I'd like to hire ${subject}.${model?` Working model: ${model}.`:""}`)}>{children}<HiringArrow/></button>;}
export function RoleStudio({roles}:{roles:HireRole[]}){
 const [selected,setSelected]=useState(roles[0]?.slug);const id=useId();const role=roles.find(r=>r.slug===selected)??roles[0];
 if(!role)return <div className={s.empty}><p>Tell us about the role and stack you need. We can discuss a suitable hiring route.</p><HiringAction source="hire-empty">Discuss your requirement</HiringAction></div>;
 const guide=roleGuide(role);
 return <div className={s.roleStudio}>
  <fieldset className={s.roleChoices}><legend className={s.srOnly}>Choose a developer role</legend>{roles.map(r=><label key={r.slug} className={s.roleChoice} data-selected={r.slug===role.slug}><input type="radio" name={id} value={r.slug} checked={r.slug===role.slug} onChange={()=>setSelected(r.slug)} aria-controls={`${id}-brief`}/><ServiceIcon slug={(r.iconSlug==="custom-software"?"custom-software-development":r.iconSlug==="mobile-apps"?"mobile-app-development":r.iconSlug) as never} className={s.roleIcon}/><span>{r.title}<small>{roleGuide(r).focus[0]}</small></span><HiringArrow/></label>)}</fieldset>
  <div id={`${id}-brief`} className={s.roleBrief}>
   <div className={s.briefSummary}><h3 aria-live="polite">{role.title}, in your team.</h3><p>{role.heroLead}</p><div className={s.stack}>{role.stack.slice(0,5).map(t=><span key={t}>{t}</span>)}</div><Link href={`/hire/${role.slug}`} className={s.textLink}>Explore this role<HiringArrow/></Link></div>
   <div className={s.briefWork}><h4>Start with a focused assignment.</h4><p>{guide.assignment}</p><ul>{guide.checks.map(c=><li key={c}><HiringCheck/>{c}</li>)}</ul><span className={s.caption}>We agree the assignment, access and review criteria with your team before work begins.</span></div>
   <div className={s.briefRate}><span>Listed monthly rate</span>{role.monthly>0?<strong>{inr(role.monthly)}</strong>:<strong>Discuss scope</strong>}<p>Confirm allocation, availability and terms for your requirement.</p><HiringAction subject={role.title} source="hire-role-studio">Discuss this role</HiringAction></div>
  </div>
 </div>;
}
export function ModelStudio({subject="developers"}:{subject?:string}){
 const[index,setIndex]=useState(0);const id=useId();const model=WORKING_MODELS[index];
 return <div className={s.modelStudio}><div className={s.modelChoices} role="group" aria-label="Choose a working model">{WORKING_MODELS.map((m,i)=><button type="button" key={m.key} aria-pressed={i===index} aria-controls={`${id}-model`} onClick={()=>setIndex(i)}><span>{m.title}</span><small>{m.fit}</small><HiringArrow/></button>)}</div>
 <div id={`${id}-model`} className={s.modelPanel}><figure><div className={s.modelDiagram}><TeamArt compact names={model.roles.length===2?[...model.roles,"Shared review"]:model.roles}/></div><ol className={s.modelPeople} aria-hidden="true">{(model.roles.length===2?[...model.roles,"Shared review"]:model.roles).map(name=><li key={name}>{name}</li>)}</ol><figcaption>We agree team roles, responsibilities and allocation around your scope.</figcaption></figure><div className={s.modelDescription}><h3 aria-live="polite">{model.title}</h3><p>{model.text}</p><dl><div><dt>You bring</dt><dd>{model.client}</dd></div><div><dt>We discuss</dt><dd>{model.savo}</dd></div><div><dt>Work to review</dt><dd>{model.output}</dd></div></dl><HiringAction subject={subject} model={model.title} source="hire-model">Discuss this setup</HiringAction></div></div></div>;
}
export function WorkingRhythm({subject="developers"}:{subject?:string}){
 const[index,setIndex]=useState(0);const id=useId();const phase=COLLABORATION[index];
 return <div className={s.rhythm}><ol className={s.rhythmSteps}>{COLLABORATION.map((p,i)=><li key={p.name}><button type="button" aria-pressed={i===index} aria-controls={`${id}-phase`} onClick={()=>setIndex(i)}><span>{i+1}</span>{p.name}<HiringArrow/></button></li>)}</ol>
 <div className={s.rhythmPanel} id={`${id}-phase`}><div className={s.rhythmCopy}><h3 aria-live="polite">{phase.output}</h3><p>{phase.work}</p><dl><dt>Starts with</dt><dd>{phase.input}</dd></dl><HiringAction source="hire-working-rhythm" subject={subject} className={s.darkLink}>Talk through collaboration</HiringAction></div><div className={s.assignment}><AssignmentArt phase={Math.min(index,2)}/><ul>{phase.checks.map(c=><li key={c}><HiringCheck/>{c}</li>)}</ul><p>We plan releases with your team, follow its approval process and document each handoff.</p></div></div></div>;
}
