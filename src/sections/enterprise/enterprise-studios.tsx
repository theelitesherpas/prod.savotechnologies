"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { useEnquiry } from "@/components/shared/enquiry-dialog";
import { ENGAGEMENTS, REVIEW_PACKETS } from "./enterprise-content";
import { EngagementArt, EnterpriseArrow, EnterprisePlus } from "./enterprise-art";
import s from "./enterprise.module.css";

export function EngagementStudio() {
  const [active, setActive] = useState(0);
  const [touched, setTouched] = useState(false);
  const id = useId();
  const { open } = useEnquiry();
  return <div data-enterprise-studio="engagement" className={s.studio}>
    <fieldset className={s.choices}><legend className="sr-only">Choose the starting point for your initiative</legend>{ENGAGEMENTS.map((item, i) => <label key={item.id}><input type="radio" name={`${id}-engagement`} checked={active === i} aria-controls={`${id}-${item.id}`} onChange={() => { setActive(i); setTouched(true); }} /><span>{item.choice}</span></label>)}</fieldset>
    {ENGAGEMENTS.map((item, i) => <section key={item.id} id={`${id}-${item.id}`} hidden={active !== i} className={s.engagementPanel} data-selected={active === i} data-touched={touched} aria-label={item.shape}>
      <figure className={s.engagementFigure}><EngagementArt kind={item.id}/><figcaption>{item.shape}<small>Illustrative working arrangement - not a fixed package.</small></figcaption></figure>
      <div className={s.engagementCopy}><h3>{item.title}</h3><p>{item.summary}</p><dl><div><dt>Useful when</dt><dd>{item.fit}</dd></div><div><dt>Agree before starting</dt><dd><ul>{item.agree.map(point => <li key={point}>{point}</li>)}</ul></dd></div></dl><details className={s.scopeDetail}><summary>What to expect - and what not to assume<EnterprisePlus/></summary><p>{item.output}.</p><p>{item.tradeoff}</p></details><button type="button" className={s.link} onClick={() => open(`enterprise-model-${item.id}`, `I'd like to discuss an enterprise initiative. Working approach: ${item.shape}.`)}>{item.action}<EnterpriseArrow/></button></div>
    </section>)}
    <p className={s.note}>You don’t need to choose now. Scope, availability and commercial terms are discussed for your requirement.</p>
    <noscript><style>{'[data-enterprise-studio="engagement"] > fieldset { display:none; }'}</style><div className={s.fallback}>{ENGAGEMENTS.map(item => <details key={item.id}><summary>{item.choice}</summary><p>{item.summary}</p><p>{item.tradeoff}</p></details>)}</div></noscript>
  </div>;
}

export function ReviewDesk() {
  const [active, setActive] = useState(0);
  const id = useId();
  return <div data-enterprise-studio="review" className={s.reviewDesk}>
    <fieldset className={s.reviewChoices}><legend className="sr-only">Choose a delivery review stage</legend>{REVIEW_PACKETS.map((item, i) => <label key={item.id}><input type="radio" name={`${id}-review`} checked={active === i} aria-controls={`${id}-${item.id}`} onChange={() => setActive(i)}/><span>{item.choice}</span></label>)}</fieldset>
    {REVIEW_PACKETS.map((item, i) => <section key={item.id} id={`${id}-${item.id}`} hidden={active !== i} className={s.reviewPanel} aria-label={item.document}>
      <div className={s.reviewCopy}><h3>{item.title}</h3><p>{item.summary}</p><details className={s.reviewDetail}><summary>What this review needs to settle<EnterprisePlus/></summary><p>{item.detail}</p></details><Link className={s.link} href={item.link}>{item.linkLabel}<EnterpriseArrow/></Link></div>
      <figure className={s.reviewFigure}><div className={s.document}><h3>{item.document}</h3><dl>{item.rows.map(([question, material]) => <div key={question}><dt>{question}</dt><dd>{material}</dd></div>)}</dl><div className={s.documentFooter}><span>Discuss</span><span>Review</span><span>Agree</span></div></div><figcaption>Illustrative review pack - not a live project or portal.</figcaption></figure>
    </section>)}
    <noscript><style>{'[data-enterprise-studio="review"] > fieldset { display:none; }'}</style><div className={s.fallback}>{REVIEW_PACKETS.map(item => <details key={item.id}><summary>{item.choice}</summary><p>{item.detail}</p><Link href={item.link}>{item.linkLabel}</Link></details>)}</div></noscript>
  </div>;
}
