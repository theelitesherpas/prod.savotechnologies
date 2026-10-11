import Link from "next/link";
import Image from "next/image";
import { OFFICES, PRESENCE_LABEL, SITE } from "@/constants/site";
import { IS_DEMO } from "@/lib/content-mode";
import { withBasePath } from "@/lib/utils";
import { ABOUT_CRAFTS, ABOUT_DISCIPLINES, ABOUT_FAQS, ABOUT_PURPOSE, ABOUT_VALUES, aboutFacts } from "./about-content";
import { ABOUT_PREVIEW_LEADERSHIP, ABOUT_PREVIEW_MILESTONES } from "./about-preview-content";
import { ABOUT_HERO_ALT, ABOUT_HERO_IMAGE } from "@/constants/about";
import { AboutArrow, AboutGlyph, AboutLinkedIn, AboutMail, AboutPlus } from "./about-art";
import s from "./about.module.css";

/**
 * THESIS: Restore the complete company story; let the people lead, not logo tiles.
 * OWN-WORLD: Enterprise's Outfit/Inter, white/grey/black/red, 1280px aligned rail.
 * STORY: Meet the company, its history and leadership; understand its purpose,
 * values, crafts and specialists; explore culture, locations, proof and contact.
 * FIRST VIEWPORT: Large original headline/actions beside substantial workplace
 * photography, with a small founding-year/brand signature below the image.
 * FORM: User correction pins content preservation and a people-focused redesign.
 * FINISH: unreviewed and undocumented is unfinished; this build ends with the
 * finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.
 */

export function AboutHero({ heroImage = ABOUT_HERO_IMAGE, heroAlt = ABOUT_HERO_ALT }: { heroImage?: string; heroAlt?: string } = {}) {
  return <section className={`${s.section} ${s.hero}`} aria-labelledby="about-heading"><div className={s.rail}>
    <div className={s.opening}><div className={s.heroCopy}>
      <h1 id="about-heading">One team,{" "}<br /><span>accountable{" "}<br />since {SITE.registration.foundedYear}.</span></h1>
      <p>{SITE.name} is a team of engineers, designers and consultants who believe software outsourcing should feel like part of your own team.</p>
      <div className={s.heroActions}><Link href="/contact#send" className={s.primaryAction}>Start the conversation<AboutArrow /></Link><Link href="/case-studies#work" className={s.secondary}>Explore our work<AboutArrow /></Link></div>
    </div><figure className={s.heroFigure}><div className={s.heroPhoto} data-image-guard><Image src={withBasePath(heroImage)} alt={heroAlt} fill priority sizes="(max-width: 899px) 100vw, 50vw" /></div><div className={s.photoSignature}><span>Since {SITE.registration.foundedYear}</span><p>{SITE.tagline}</p></div></figure></div>
    <nav className={s.journey} aria-label="Explore Savo"><a href="#story">Our story<AboutArrow /></a><a href="#team">Meet the team<AboutArrow /></a><a href="#values">What we believe<AboutArrow /></a><a href="#offices">Where we work<AboutArrow /></a></nav>
  </div></section>;
}

export function AboutOverview({ metrics, demo = IS_DEMO }: { metrics: { value: string; label: string }[]; demo?: boolean }) {
  return <section id="company-identity" className={s.section} aria-labelledby="identity-heading"><div className={s.rail}>
    <div className={s.identityLayout}><div><h2 id="identity-heading">A technology company.<br />A human way of working.</h2><p>Savo Technologies, also known as Savo, is a software development and technology company based in Indore, Madhya Pradesh, India. The incorporated company operates as {SITE.legalName}.</p><p>From product strategy and design to engineering and AI, the work brings different disciplines together around one product.</p><Link href="/company-profile" className={s.link}>Read the company profile<AboutArrow /></Link></div><dl className={s.companyFacts}>{aboutFacts().map(fact => <div key={fact.label}><dt>{fact.label}</dt><dd>{fact.value}</dd></div>)}</dl></div>
    <div className={s.metricsBlock} data-demo-content={demo || undefined}><p className={s.contentNote}>{demo ? "Statistics preview - sample figures restored from the original design, not verified Savo results." : "Company figures are published when confirmed. Unavailable figures remain marked below."}</p><dl className={s.metrics}>{metrics.map(metric => <div key={metric.label}><dd className={metric.value === "To be confirmed" ? s.pendingMetric : undefined}>{metric.value}</dd><dt>{metric.label}</dt></div>)}</dl></div>
  </div></section>;
}

export function AboutStory({ demo = IS_DEMO }: { demo?: boolean }) {
  const milestones = demo ? ABOUT_PREVIEW_MILESTONES : [
    { year: SITE.registration.foundedYear, t: "The beginning", d: "Savo Technologies was founded in 2015." },
    { year: "Today", t: "Built by specialists", d: "Strategy, design, engineering, AI and delivery, with an engineering headquarters in Indore and a head office in Switzerland." },
  ];
  return <section id="story" className={`${s.section} ${s.story}`} aria-labelledby="story-heading"><div className={s.rail}>
    <div className={s.sectionHead}><h2 id="story-heading">Our story,<br />still being written.</h2><p>The milestones that shaped how we build, including the hard ones. A look at the beginning, the decisions and the work along the way.</p></div>
    {demo ? <p className={s.contentNotice}>Timeline preview - these original sample milestones are not verified company history. Dates and achievements need confirmation before publication.</p> : <p className={s.contentNote}>The founding year is confirmed. Further milestones will be added as their details are approved.</p>}
    <ol className={s.timeline} data-demo-content={demo || undefined}>{milestones.map(milestone => <li key={milestone.year}><span className={s.timelineYear}>{milestone.year}</span><h3>{milestone.t}</h3><p>{milestone.d}</p></li>)}</ol>
  </div></section>;
}

export function AboutPurpose() {
  return <section id="purpose" className={s.section} aria-labelledby="purpose-heading"><div className={s.rail}>
    <div className={s.sectionHead}><h2 id="purpose-heading">What we are here to do.</h2><p>A clear purpose for the work - and a long-term view of the technology we want to build.</p></div>
    <div className={s.purposeGrid}>{ABOUT_PURPOSE.map((purpose, i) => <article key={purpose.title} className={i === 1 ? s.vision : s.mission}><h3>{purpose.title}</h3><p className={s.purposeStatement}>{purpose.statement}</p><p>{purpose.text}</p><AboutGlyph kind={i === 0 ? "Strategy" : "Design"} className={s.purposeGlyph} /></article>)}</div>
  </div></section>;
}

export type AboutTeamMember = { name: string; role: string; photo: string; photoAlt: string; linkedinUrl?: string; email?: string };

export function AboutTeam({ demo = IS_DEMO, people = [], heading }: { demo?: boolean; people?: AboutTeamMember[]; heading?: string }) {
  const managedProfiles = people.length > 0;
  return <section id="team" className={`${s.section} ${s.team}`} aria-labelledby="team-heading"><div className={s.rail}>
    <div className={s.teamHead}><h2 id="team-heading">{heading ?? <>The people<br />behind the work.</>}</h2><p>Engineering, design and AI, shaped by people.{" "}<br />Meet the perspectives behind our approach to the work.</p></div>
    {managedProfiles ? <ul className={s.teamGrid}>{people.map(person => <li key={person.name}><article className={s.personCard}><div className={s.portrait} data-image-guard><Image src={person.photo} alt={person.photoAlt} fill sizes="(max-width: 639px) 100vw, (max-width: 899px) 50vw, 25vw" unoptimized /></div><div className={s.personHeading}><h3>{person.linkedinUrl ? <a className={s.profileLink} href={person.linkedinUrl} target="_blank" rel="noopener noreferrer" aria-label={`${person.name} on LinkedIn`}>{person.name}</a> : person.name}</h3><div className={s.personLinks}>{person.linkedinUrl ? <a href={person.linkedinUrl} target="_blank" rel="noopener noreferrer" aria-label={`${person.name} on LinkedIn`} title={`${person.name} on LinkedIn`}><AboutLinkedIn /></a> : null}{person.email ? <a href={`mailto:${person.email}`} aria-label={`Email ${person.name}`} title={`Email ${person.name}`}><AboutMail /></a> : null}</div></div><p className={s.personRole}>{person.role}</p></article></li>)}</ul> : demo ? <><p className={s.contentNotice}>Leadership preview - original demo names, portraits and contact destinations, not verified Savo team profiles.</p><ul className={s.teamGrid} data-demo-content="true">{ABOUT_PREVIEW_LEADERSHIP.map(person => <li key={person.name}><article className={s.personCard}><div className={s.portrait} data-image-guard><Image src={withBasePath(person.img)} alt={`Demo leadership portrait for ${person.name}; not a verified Savo team member`} fill sizes="(max-width: 639px) 100vw, (max-width: 899px) 50vw, 25vw" /></div><div className={s.personHeading}><h3><a className={s.profileLink} href={`https://www.linkedin.com/in/${encodeURIComponent(person.linkedin)}`} target="_blank" rel="noopener noreferrer" aria-label={`${person.name} on LinkedIn`}>{person.name}</a></h3><div className={s.personLinks}><a href={`https://www.linkedin.com/in/${encodeURIComponent(person.linkedin)}`} target="_blank" rel="noopener noreferrer" aria-label={`${person.name} on LinkedIn`} title={`${person.name} on LinkedIn`}><AboutLinkedIn /></a><a href={`mailto:${person.mail}`} aria-label={`Email ${person.name}`} title={`Email ${person.name}`}><AboutMail /></a></div></div><p className={s.personRole}>{person.role}</p></article></li>)}</ul></> : <div className={s.teamPending}><h3>Meet your project team.</h3><p>Senior team members are introduced by name as their profiles are approved for publication. Until then, the work and the process are the evidence.</p><p>Leadership profiles and photography are being prepared for publication.</p><Link href="/contact" className={s.link}>Ask about the people on your project<AboutArrow /></Link></div>}
    <div className={s.teamInvite}><p>Interested in doing thoughtful work with us?</p><Link href="/careers" className={s.link}>Explore careers at Savo<AboutArrow /></Link></div>
  </div></section>;
}

export function AboutValues() {
  return <section id="values" className={`${s.section} ${s.light}`} aria-labelledby="values-heading"><div className={s.rail}>
    <div className={s.sectionHead}><h2 id="values-heading">Six rules.<br />One way of working.</h2><p>Values that show up in code reviews and status calls, not on posters. The principles behind our everyday decisions.</p></div>
    <ul className={s.valueList}>{ABOUT_VALUES.map(value => <li key={value.t}><h3>{value.t}</h3><p>{value.d}</p></li>)}</ul>
  </div></section>;
}

export function AboutCrafts() {
  return <section id="craft" className={`${s.section} ${s.dark}`} aria-labelledby="craft-heading"><div className={s.rail}>
    <div className={s.sectionHead}><h2 id="craft-heading">Three crafts.<br />One standard.</h2><p>How engineering, design and AI decisions are actually made here. Different tools, the same care for the result.</p></div>
    <div className={s.craftGrid}>{ABOUT_CRAFTS.map(craft => <article key={craft.k}><AboutGlyph kind={craft.k} className={s.craftGlyph} /><h3>{craft.k}</h3><p>{craft.v}</p><Link href={craft.k === "Engineering" ? "/services/custom-software-development" : craft.k === "Design" ? "/services/ui-ux-design" : "/ai-agents"} className={s.link}>Explore {craft.k === "AI" ? "AI" : craft.k.toLowerCase()}<AboutArrow /></Link></article>)}</div>
  </div></section>;
}

export function AboutDisciplines() {
  return <section id="disciplines" className={s.section} aria-labelledby="disciplines-heading"><div className={s.rail}>
    <div className={s.sectionHead}><h2 id="disciplines-heading">Built by specialists.</h2><p>Ten disciplines, each linked to where that work is described. The right skills, brought together around the requirement.</p></div>
    <ul className={s.disciplineList}>{ABOUT_DISCIPLINES.map(discipline => <li key={discipline.label}><Link href={discipline.href}><span>{discipline.label}</span><AboutArrow /></Link></li>)}</ul>
    <p className={s.specialistNote}>Senior team members are introduced by name as their profiles are approved for publication. Until then, the work and the process are the evidence.</p>
  </div></section>;
}

export function AboutCulture() {
  return <section id="culture" className={`${s.section} ${s.light}`} aria-labelledby="culture-heading"><div className={s.rail}>
    <div className={s.cultureLayout}><figure className={s.cultureFigure}><div className={s.culturePhoto} data-image-guard><Image src={withBasePath("/images/meeting.webp")} alt="Editorial photograph of a collaborative discussion" fill sizes="(max-width: 899px) 100vw, 60vw" /></div><figcaption>Editorial collaboration image - not the Savo team or office.</figcaption></figure>
      <div className={s.cultureCopy}><h2 id="culture-heading">Good work starts<br />with good company.</h2><p>Our values are a guide to the everyday work: sharing context, reviewing decisions and respecting the people who use what we build.</p><ul><li>Make room for thoughtful questions.</li><li>Share knowledge, not just finished work.</li><li>Keep learning through the work itself.</li></ul><Link href="/careers" className={s.primaryAction}>Find your place at Savo<AboutArrow /></Link></div>
    </div>
  </div></section>;
}

export function AboutPresence() {
  const offices = OFFICES.filter(office => office.status === "verified" && office.kind !== "market");
  const markets = OFFICES.filter(office => office.status === "verified" && office.kind === "market");
  return <section id="offices" className={s.section} aria-labelledby="presence-heading"><div className={s.rail}>
    <div className={s.sectionHead}><h2 id="presence-heading">Rooted in Indore.<br />Connected across regions.</h2><p>Engineering, design and delivery from the Indore headquarters, with a head office in Switzerland and market presence across regions.</p></div>
    <ul className={s.officeGrid}>{offices.map(office => <li key={office.id}><div className={s.officeTitle}><h3>{office.region}</h3><span>{PRESENCE_LABEL[office.kind]}</span></div><p>{office.cityLine}</p><address>{office.addressLine}</address><div className={s.officePhones}>{office.phones?.map(phone => <a key={phone.e164} href={`tel:${phone.e164}`}>{phone.display}{phone.label ? <span> · {phone.label}</span> : null}<AboutArrow /></a>)}</div></li>)}</ul>
    {markets.length > 0 ? <div className={s.marketBlock}><h3>Our market presence</h3><ul>{markets.map(market => <li key={market.id}><div><h4>{market.region}</h4><span>{market.cityLine}</span></div><p>{market.description}</p>{market.phones?.map(phone => <a key={phone.e164} href={`tel:${phone.e164}`}>{phone.display}<AboutArrow /></a>)}</li>)}</ul></div> : null}
    <p className={s.contentNote}>{SITE.name} serves clients in India and internationally, remotely. Market presence is not an office claim.</p>
  </div></section>;
}

export function AboutQuestions() {
  return <section id="questions" className={s.section} aria-labelledby="questions-heading"><div className={s.rail}>
    <div className={s.questionGrid}><div><h2 id="questions-heading">Before you choose<br />a technology partner.</h2><p>The questions serious buyers ask before signing with anyone, including us.</p><Link href="/contact" className={s.link}>Ask another question<AboutArrow /></Link></div><div className={s.faqList}>{ABOUT_FAQS.map(faq => <details key={faq.q}><summary>{faq.q}<AboutPlus /></summary><p>{faq.a}</p></details>)}</div></div>
    <aside className={s.proofAside} aria-labelledby="proof-heading"><div><h3 id="proof-heading">Get to know us through the work.</h3><p>Explore the work, the thinking and the way we build.</p></div><nav aria-label="More about Savo"><Link href="/trust">Trust &amp; security<AboutArrow /></Link><Link href="/case-studies">Case studies<AboutArrow /></Link><Link href="/insights">Insights<AboutArrow /></Link><Link href="/careers">Join the team<AboutArrow /></Link></nav></aside>
  </div></section>;
}
