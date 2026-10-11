import Link from "next/link";
import { SavoLogo } from "@/components/shared/savo-logo";
import { SITE } from "@/constants/site";
import { SERVICES } from "@/constants/services";
import { INDUSTRIES_ATLAS } from "@/constants/industries";
import { absoluteUrl } from "@/lib/env";
import { PROFILE_ENGAGEMENTS, PROFILE_FAQS, PROFILE_PROCESS, PROFILE_PROCESS_NOTE, PROFILE_TECHNOLOGY, PROFILE_TRUST, PROFILE_WORK, type ProfileFactRow, type ProfileModel } from "./profile-content";
import { ProfileArrow, ProfilePlus } from "./profile-art";
import { PrintProfileButton } from "./print-profile-button";
import s from "./profile.module.css";

function FactRows({ rows }: { rows: readonly ProfileFactRow[] }) {
  return <dl className={s.factRows}>{rows.map(row => <div key={row.label}><dt>{row.label}</dt><dd>{row.href ? <a href={row.href}>{row.value}</a> : row.value}{row.pending && <span className={s.pending}>Verification pending</span>}</dd></div>)}</dl>;
}
export function ProfileHero({ model }: { model: ProfileModel }) {
  return <section className={`${s.section} ${s.hero}`} aria-labelledby="profile-heading"><div className={s.rail}><div className={s.opening}>
    <div className={s.heroCopy}><SavoLogo className={s.printLogo} /><h1 id="profile-heading">Company{" "}<br /><span>profile.</span></h1><p>{SITE.description}</p><div className={s.heroActions}><PrintProfileButton /><a href="#identity" className={s.secondary}>Explore the company<ProfileArrow /></a></div><p className={s.printHelp}>Use your browser’s Print command (Ctrl/Cmd + P) to save a PDF copy.</p><noscript><p className={s.noJs}>The print button needs JavaScript; your browser’s Print command works without it.</p></noscript></div>
    <aside className={s.summary} aria-labelledby="profile-summary-heading"><SavoLogo className={s.summaryLogo} /><h2 id="profile-summary-heading">{model.brand}</h2><p>{model.legalName}</p><dl>{model.summary.map(row => <div key={row.label}><dt>{row.label}</dt><dd>{row.value}{row.pending && <span className={s.pending}>Verification pending</span>}</dd></div>)}</dl><p className={s.summaryNote}>Identity and office details from the canonical company record.</p></aside>
  </div><nav className={s.contents} aria-label="Company profile contents"><a href="#identity">Company facts<ProfileArrow /></a><a href="#capabilities">Capabilities<ProfileArrow /></a><a href="#process">How we work<ProfileArrow /></a><a href="#contact">Contact<ProfileArrow /></a></nav></div></section>;
}
export function ProfileIdentity({ model }: { model: ProfileModel }) {
  return <section id="overview" className={s.section} data-profile-chapter="overview" aria-labelledby="overview-heading"><div className={`${s.rail} ${s.identityLayout}`}>
    <div className={s.identityIntro}><h2 id="overview-heading">One company.<br />Connected capabilities.</h2><p>{model.overview}</p><Link href="/about" className={s.link}>More about Savo<ProfileArrow /></Link></div>
    <div id="identity" data-profile-chapter="identity"><h3 className={s.factsHeading}>Legal identity &amp; facts.</h3><FactRows rows={model.identity} /><p className={s.recordNote}>Registration identifiers publish only after verification. <Link href="/contact#send">Ask about the current status</Link>.</p></div>
  </div></section>;
}
export function ProfileCapabilities() {
  return <section id="capabilities" className={`${s.section} ${s.capabilities}`} data-profile-chapter="capabilities" aria-labelledby="capabilities-heading"><div className={s.rail}><div className={s.sectionHead}><h2 id="capabilities-heading">Connected<br />capabilities.</h2><div><p>Strategy, product design, engineering, intelligence and growth within the same service family.</p><Link href="/services" className={s.link}>Explore our services<ProfileArrow /></Link></div></div><ul className={s.capabilityList}>{SERVICES.map(group => <li key={group.id}><h3>{group.title}</h3><p>{group.positioning}</p></li>)}</ul></div></section>;
}
export function ProfileIndustries() {
  return <section id="industries" className={`${s.section} ${s.grey}`} data-profile-chapter="industries" aria-labelledby="industries-heading"><div className={s.rail}><div className={s.sectionHead}><h2 id="industries-heading">Different industries.<br />Shared expertise.</h2><p>Sector names describe capability areas - not client relationships or verified delivery counts.</p></div><ul className={s.industryList}>{INDUSTRIES_ATLAS.map(industry => <li key={industry.id}><Link href={industry.href}>{industry.title}<ProfileArrow /></Link></li>)}</ul></div></section>;
}
export function ProfileTechnologyAndWork() {
  return <section className={s.section} aria-label="Technology and selected work"><div className={`${s.rail} ${s.briefs}`}><article id="technology" data-profile-chapter="technology"><h2>Technology.</h2><p>{PROFILE_TECHNOLOGY}</p><Link href="/technology" className={s.link}>Technology &amp; architecture<ProfileArrow /></Link></article><article id="work" data-profile-chapter="work"><h2>Selected work.</h2><p>{PROFILE_WORK}</p><p className={s.evidenceNote}>Only approved project material should be used as buyer evidence.</p><Link href="/case-studies#work" className={s.link}>Explore selected work<ProfileArrow /></Link></article></div></section>;
}
export function ProfileProcess() {
  return <section id="process" className={`${s.section} ${s.dark}`} data-profile-chapter="process" aria-labelledby="process-heading"><div className={s.rail}><div className={s.sectionHead}><h2 id="process-heading">From first question<br />to the next release.</h2><p>Discover, define, design, build and grow. A connected delivery process, with the scope agreed for your engagement.</p></div><ol className={s.processStages}>{PROFILE_PROCESS.map((stage,i) => <li key={stage.title}><h3>{stage.title}</h3><p>{stage.detail}</p>{i < PROFILE_PROCESS.length - 1 && <span className={s.stageArrow}><ProfileArrow /></span>}</li>)}</ol><p className={s.processNote}>{PROFILE_PROCESS_NOTE}</p></div></section>;
}
export function ProfileWorkingTerms() {
  return <section className={`${s.section} ${s.grey}`} aria-label="Engagement models and trust"><div className={`${s.rail} ${s.briefs}`}><article id="engagements" data-profile-chapter="engagements"><h2>Engagement models.</h2><ul className={s.engagementList}>{PROFILE_ENGAGEMENTS.map(model => <li key={model}>{model}</li>)}</ul><Link href="/enterprise" className={s.link}>Compare how we work together<ProfileArrow /></Link></article><article id="trust" data-profile-chapter="trust"><h2>Ownership &amp; trust.</h2><p>{PROFILE_TRUST}</p><p className={s.evidenceNote}>Engagement-specific terms govern ownership, confidentiality and access.</p><Link href="/trust" className={s.link}>Trust &amp; security practices<ProfileArrow /></Link></article></div></section>;
}
export function ProfileQuestions() {
  return <section id="questions" className={s.section} aria-labelledby="page-faq-heading"><div className={`${s.rail} ${s.questionLayout}`}><div><h2 id="page-faq-heading">About this profile.</h2><p className={s.questionLead}>How to use the company record - and take a copy into your review.</p><Link href="/contact#send" className={s.link}>Ask a company question<ProfileArrow /></Link></div><div className={s.faqList} aria-label="Company profile FAQs">{PROFILE_FAQS.map((item,i) => <details key={item.q} open={i===0}><summary>{item.q}<ProfilePlus /></summary><p>{item.a}</p></details>)}</div><dl className={s.printFaqs}>{PROFILE_FAQS.map(item => <div key={item.q}><dt>{item.q}</dt><dd>{item.a}</dd></div>)}</dl></div></section>;
}
export function ProfileContact({ model }: { model: ProfileModel }) {
  return <section id="contact" className={`${s.section} ${s.grey}`} data-profile-chapter="contact" aria-labelledby="profile-contact-heading"><div className={`${s.rail} ${s.contactLayout}`}><div className={s.contactIntro}><h2 id="profile-contact-heading">Contact.</h2><p>For a project or procurement question, use the verified company channels.</p><Link href="/contact#send" className={s.link}>Open the contact page<ProfileArrow /></Link><div className={s.contactPrint}><PrintProfileButton secondary /></div></div><div><FactRows rows={[{label:"Web",value:"savotechnologies.com",href:absoluteUrl("/"),pending:false},...model.contacts]} /><div className={s.socials}><h3>Social</h3>{model.socials.length ? <ul>{model.socials.map(social => <li key={social.href}><a href={social.href} target="_blank" rel="noopener noreferrer">{social.label}<ProfileArrow /></a></li>)}</ul> : <p>Verification pending</p>}</div></div></div><div className={`${s.rail} ${s.recordFooter}`}><p>© {new Date().getFullYear()} {model.legalName}. Registration identifiers marked available on request await verified input before publication.</p><a href={absoluteUrl("/company-profile")}>{absoluteUrl("/company-profile")}</a></div></section>;
}
