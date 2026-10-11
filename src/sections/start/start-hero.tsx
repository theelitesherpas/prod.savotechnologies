import Link from "next/link";
import { SITE } from "@/constants/site";
import { StartBrief } from "./start-brief";
import { StartArrow, StartCheck } from "./start-art";
import { START_NEXT_STEPS, START_TIMING_NOTE } from "./start-content";
import styles from "./start.module.css";

export function StartHero() {
  return <section className={`${styles.section} ${styles.hero}`} aria-labelledby="start-heading">
    <div className={`${styles.rail} ${styles.opening}`}>
      <div className={styles.heroCopy}>
        <h1 id="start-heading">Tell us what you are <span>building.</span></h1>
        <p>A new idea, a product to improve, or a challenge to solve. Tell us where you are and where you want to go.</p>
      </div>
      <div className={styles.heroActions}><a className={styles.primary} href="#brief">Write the brief<StartArrow /></a><a className={styles.textAction} href="#next">What happens next<StartArrow /></a></div>
    </div>
  </section>;
}
export function StartBriefSection({ initialType }: { initialType?: string }) {
  return <section id="brief" className={`${styles.section} ${styles.briefSection}`} aria-labelledby="brief-heading">
    <div className={`${styles.rail} ${styles.briefLayout}`}>
      <div className={styles.briefIntro}>
        <h2 id="brief-heading">Write the <span>brief.</span></h2>
        <p>You don’t need a finished plan. Share what you know so we can make the first conversation more useful.</p>
      </div>
      <StartBrief initialType={initialType} />
      <div className={styles.briefHelp}>
        <ul className={styles.reassurance}>
          <li><StartCheck /><span>Start with what you know.</span></li>
          <li><StartCheck /><span>Review everything before sending.</span></li>
          <li><StartCheck /><span>No commitment at this stage.</span></li>
        </ul>
        <details className={styles.beforeSharing}><summary>Before you share</summary><div><p>The brief is the beginning of a proposal, not a commitment. Discuss an NDA before sending anything sensitive.</p><Link href="/trust" className={styles.textAction}>Ownership & confidentiality<StartArrow /></Link></div></details>
        <p className={styles.contactHelp}>Prefer email? <a href={`mailto:${SITE.email}`}>{SITE.email}</a></p>
      </div>
    </div>
  </section>;
}
export function WhatHappensNext() {
  return <section id="next" className={`${styles.section} ${styles.next}`} aria-labelledby="next-heading">
    <div className={styles.rail}>
      <div className={styles.nextHead}><h2 id="next-heading">What happens next.</h2><p>A path from your brief to a working engagement. The scope, timeline and price belong in the proposal, before you decide to proceed.</p></div>
      <ol className={styles.nextSteps}>{START_NEXT_STEPS.map(step => <li key={step.when}><p className={styles.when}>{step.when}</p><h3>{step.title}</h3><p>{step.text}</p></li>)}</ol>
      <p className={styles.timingNote}>{START_TIMING_NOTE}</p>
    </div>
  </section>;
}
