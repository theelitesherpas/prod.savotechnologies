import Link from "next/link";
import { CAREERS_EMAIL, HIRING_STEPS } from "@/constants/careers";
import { SITE } from "@/constants/site";
import { ClosingArrow } from "@/components/shared/closing-cta";
import { CareersWorkspace } from "./careers-workspace";
import s from "./careers.module.css";

export const CAREERS_QUESTIONS = [
  { q: "Can I apply if no role fits?", a: "Yes. Choose General application and tell us about your skills and the work you want to do." },
  { q: "What do I need to include?", a: "Your name, email, mobile number, current city, hometown, key skills, experience, start availability and consent are required. Compensation details, resume, work links and introduction are optional." },
  { q: "Do I need a resume or portfolio link?", a: "Both are optional. Resume links must allow public viewing: choose “Anyone with the link can view”, not a private or sign-in-only link. Do not share confidential work." },
];

export function CareersHero({ count }: { count: number }) {
  return <section className={s.hero} aria-labelledby="careers-heading"><div className={`${s.rail} ${s.heroGrid}`}>
    <div className={s.heroCopy}>
      <h1 id="careers-heading">Build your next<br className={s.heroBreak} /> chapter with Savo.</h1>
      <p>Bring your skills to websites, apps, software and AI. Explore our current openings or tell us where you could fit.</p>
      <div className={s.heroActions}><Link className={s.primary} href={count ? "#openings" : "/careers/apply?role=general-application"}>{count ? "Explore open roles" : "Introduce yourself"}<ClosingArrow /></Link><Link className={s.secondary} href="#hiring">How to apply <ClosingArrow /></Link></div>
    </div>
    <CareersWorkspace />
  </div></section>;
}

export function CareersHiring() {
  return <section id="hiring" className={s.section} aria-labelledby="hiring-heading"><div className={s.rail}>
    <div className={s.sectionHead}><h2 id="hiring-heading">After you apply.</h2><p>The steps may vary by role. HR can clarify the process for your application.</p></div>
    <ol className={s.steps}>{HIRING_STEPS.map(step => <li key={step.step}><span className={s.stepMark} aria-hidden="true"><HiringStepIcon step={step.step} /></span><h3>{step.title}</h3><p>{step.text}</p></li>)}</ol>
  </div></section>;
}

export function CareersQuestions() {
  return <section id="questions" className={`${s.section} ${s.questions}`} aria-labelledby="careers-questions-heading"><div className={s.rail}>
    <h2 id="careers-questions-heading" className={s.questionsTitle}>A few things worth knowing.</h2>
    <div className={s.questionsGrid}>
      <div className={s.questionList}>{CAREERS_QUESTIONS.map(item => <details key={item.q}><summary>{item.q}<CareersPlus /></summary><p>{item.a}</p></details>)}</div>
      <aside className={s.hrDesk} aria-labelledby="careers-hr-heading">
        <div className={s.hrDeskHeading}><svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16v12H10l-5 4v-4H4V4ZM8 8h8M8 12h5" /></svg><h3 id="careers-hr-heading">Talk to HR.</h3></div>
        <p>Questions about a role, location or working arrangements? Ask HR before you apply.</p>
        <div className={s.hrLinks}>
          <a className={s.hrEmail} href={`mailto:${CAREERS_EMAIL}`}><span><strong>Email HR</strong><small>{CAREERS_EMAIL}</small></span><ClosingArrow /></a>
          <a href={`tel:${SITE.hrPhoneE164}`}><span><strong>Call HR</strong><small>{SITE.hrPhone}</small></span><ClosingArrow /></a>
          <a href={`https://wa.me/${SITE.hrPhoneE164.replace("+", "")}?text=${encodeURIComponent("Hi Savo HR, I have a question about a career opportunity.")}`} target="_blank" rel="noopener noreferrer"><span>Message HR on WhatsApp</span><ClosingArrow /></a>
        </div>
      </aside>
    </div>
  </div></section>;
}

function HiringStepIcon({ step }: { step: string }) {
  return <svg aria-hidden="true" viewBox="0 0 28 28" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    {step === "01" && <><path d="M15 24H6V4h12l4 4v5M18 4v5h4M10 10h4M10 14h3" /><circle cx="18" cy="19" r="4" /><path d="m21 22 3 3" /></>}
    {step === "02" && <><path d="M4 5h20v15H11l-5 4v-4H4V5Z" /><path d="M8 10h12M8 14h8" /></>}
    {step === "03" && <><circle cx="14" cy="8" r="3" /><path d="M8 24v-4a6 6 0 0 1 12 0v4M6 7a3 3 0 0 0 0 6M22 7a3 3 0 0 1 0 6M4 24v-4a4 4 0 0 1 3-4M24 24v-4a4 4 0 0 0-3-4" /></>}
    {step === "04" && <><path d="M6 4h12l4 4v16H6V4ZM18 4v5h4M10 12h8" /><path d="m10 18 3 3 6-6" /></>}
  </svg>;
}

export function CareersPlus() { return <svg aria-hidden="true" viewBox="0 0 20 20" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 10h12" /><path data-plus-vertical d="M10 4v12" /></svg>; }
