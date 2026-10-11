import Link from "next/link";
import { COMPANY_FACTS, verifiedValue } from "@/constants/company-facts";
import { StartProjectButton } from "@/components/shared/start-project-button";
import { Faq } from "@/components/shared/faq";
import { ENTERPRISE_FAQS, VENDOR_QUESTIONS } from "./enterprise-content";
import { EnterpriseArrow, EnterprisePlus, InitiativeArt } from "./enterprise-art";
import { EngagementStudio, ReviewDesk } from "./enterprise-studios";
import s from "./enterprise.module.css";

export function EnterpriseHero() {
  return <section className={`${s.section} ${s.hero}`} aria-labelledby="enterprise-heading"><div className={s.rail}>
    <div className={s.opening}><div className={s.heroCopy}><h1 id="enterprise-heading">Complex software.<br/><span>Clear ownership.</span></h1><p>Plan, build or modernise business-critical software with Savo. Align your people, existing systems and delivery responsibilities before the work begins.</p><div className={s.heroActions}><StartProjectButton source="enterprise-hero" label="Discuss your initiative"/><a href="#models" className={s.secondary}>Find a starting point<EnterpriseArrow/></a></div></div><InitiativeArt/></div>
    <nav className={s.journey} aria-label="Enterprise evaluation"><a href="#models">Choose an approach<EnterpriseArrow/></a><a href="#delivery">Review the work<EnterpriseArrow/></a><a href="#vendor-review">Prepare vendor review<EnterpriseArrow/></a></nav>
  </div></section>;
}
export function EnterpriseModels() {
  return <section id="models" className={s.section} aria-labelledby="models-heading"><div className={s.rail}><div className={s.sectionHead}><h2 id="models-heading">Choose the right<br/>starting point.</h2><p>A new initiative, a defined project or a product already in motion. The working arrangement should fit the work.</p></div><EngagementStudio/></div></section>;
}
export function EnterpriseDelivery() {
  return <section id="delivery" className={`${s.section} ${s.dark}`} aria-labelledby="delivery-heading"><div className={s.rail}><div className={s.sectionHead}><h2 id="delivery-heading">Make delivery<br/>inspectable.</h2><p>Agree what your team needs to see, who reviews it and which decisions move the work forward.</p></div><ReviewDesk/></div></section>;
}
export function EnterpriseVendorReview() {
  const facts = [
    ["Legal entity", verifiedValue(COMPANY_FACTS.legalName)],
    ["Operating since", verifiedValue(COMPANY_FACTS.foundedYear)],
    ["Engineering headquarters", verifiedValue(COMPANY_FACTS.headquarters)],
  ].filter(([, value]) => value !== null);
  return <section id="vendor-review" className={s.section} aria-labelledby="vendor-heading"><div className={`${s.rail} ${s.vendorLayout}`}>
    <div className={s.vendorCopy}><h2 id="vendor-heading">A shorter route<br/>through vendor review.</h2><p>Start with company facts. Open the questions that matter to your procurement process.</p><dl className={s.companyFacts}>{facts.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl><Link href="/company-profile" className={s.link}>Read the company profile<EnterpriseArrow/></Link></div>
    <div className={s.vendorQuestions}>{VENDOR_QUESTIONS.map(item => <details key={item.title}><summary>{item.title}<EnterprisePlus/></summary><p>{item.text}</p><Link href={item.href} className={s.link}>{item.link}<EnterpriseArrow/></Link></details>)}<p className={s.note}>Specific controls, commercial terms and operating responsibilities are agreed for your engagement.</p></div>
  </div></section>;
}
export function EnterpriseQuestions() {
  return <section id="questions" className={`${s.section} ${s.questions}`} aria-labelledby="page-faq-heading"><div className={`${s.rail} ${s.faqLayout}`}><div><h2 id="page-faq-heading">Before you<br/>move forward.</h2><p>A few practical answers about starting, working together and supporting the result.</p><Link href="/contact" className={s.link}>Ask another question<EnterpriseArrow/></Link></div><div className={s.faq}><Faq items={[...ENTERPRISE_FAQS]} label="Enterprise frequently asked questions" initialVisible={6}/></div></div></section>;
}
