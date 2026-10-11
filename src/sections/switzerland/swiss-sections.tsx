import type { ReactNode } from "react";
import Link from "next/link";
import { ClosingCta } from "@/components/shared/closing-cta";
import { SWISS_SERVICES, buildSwissWorking, type SwissModel, type buildSwissFaqs } from "./swiss-content";
import { SwissArrow, SwissLocation, SwissPlus } from "./swiss-art";
import s from "./swiss.module.css";

type SwissFaqs = ReturnType<typeof buildSwissFaqs>;
/**
 * THESIS: an actual Swiss contact point and clear two-office arrangements, not a Swiss-entity claim.
 * OWN-WORLD: user-pinned Outfit/Inter, white/black/red/grey fields and aligned rails.
 * STORY: find the head office, explore six services, agree communication, start a conversation.
 * FIRST VIEWPORT: grey offer, actual address/direct-line sheet, native red detailed-brief action.
 * FORM: user-delegated established location family, not a new concept tournament.
 * FINISH: unreviewed and undocumented is unfinished; this build ends with the
 * finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.
 */
export function SwissSurface({ model, faqs, children }: { model: SwissModel; faqs: SwissFaqs; children?: ReactNode }) {
  return <div className={s.page} data-switzerland-page="head-office-and-engineering" data-design-contract="switzerland-v7:THESIS=real-contact-clear-arrangements;OWN-WORLD=Outfit-Inter-white-black-red-grey;STORY=office-services-working-questions-contact;FIRST-VIEWPORT=grey-offer-address-direct-line-brief;FORM=user-delegated-established-world;FINISH=review-verdict-documentation-provenance">
    {children}<SwissHero model={model} /><SwissOffice model={model} /><SwissServices /><SwissWorking model={model} /><SwissQuestions faqs={faqs} />
    <ClosingCta id="start" headingId="start-heading" title="Start a conversation." description="From Granges-Marnand, Indore or wherever you are, the first step is the same: tell us what you are building."><Link href="/start-a-project">Start a Project<SwissArrow /></Link><Link href="/contact">Contact the team<SwissArrow /></Link></ClosingCta>
  </div>;
}
export function SwissHero({ model }: { model: SwissModel }) {
  return <section id="switzerland" className={`${s.section} ${s.hero}`} aria-labelledby="switzerland-heading"><div className={s.rail}>
    <div className={s.opening}>
      <div className={s.heroCopy}>
        <h1 id="switzerland-heading">{model.address ? <>Our Swiss<br /> <span>head office.</span></> : <>Your next build.<br /> <span>Let’s talk.</span></>}</h1>
        <p>{model.address ? `${model.brand ?? "Our team"} operates its head office from Granges-Marnand, Switzerland.${model.indoreAddress ? " With engineering headquarters in Indore, India." : " Confirm the engineering arrangements with the team."}` : "Contact the team to confirm current Swiss office and engineering arrangements."} Websites, mobile apps, custom software, AI and search for Swiss and European enquiries.</p>
        <div className={s.heroActions}><Link href="/start-a-project" className={s.primary}>Start a Project<SwissArrow /></Link><a href="#office" className={s.secondary}>Office & contact<SwissArrow /></a></div>
      </div>
      <aside className={s.addressSheet} aria-labelledby="address-heading">
        <SwissLocation /><h2 id="address-heading">{model.address ? "Granges-Marnand." : "Office details."}</h2>
        <address>{model.address ?? "Swiss head-office address awaiting public confirmation."}</address>
        {model.mapHref && <a href={model.mapHref} target="_blank" rel="noopener noreferrer" className={s.link}>Open address in Maps<SwissArrow external /></a>}
        {model.phones.map(phone => <a key={phone.href} href={phone.href} className={`${s.link} ${s.directLine}`} aria-label={`Call the Swiss office on ${phone.display}`}>{phone.display}<SwissArrow /></a>)}
        <p className={s.visitNote}>Planning a meeting or working session? Arrange it with the team before travelling.</p>
      </aside>
    </div>
    <nav className={s.journey} aria-label="Switzerland page contents"><a href="#services">What we deliver<SwissArrow /></a><a href="#working">Working together<SwissArrow /></a><a href="#faq">Common questions<SwissArrow /></a></nav>
  </div></section>;
}
export function SwissOffice({ model }: { model: SwissModel }) {
  return <section id="office" className={s.section} aria-labelledby="office-heading"><div className={`${s.rail} ${s.officeLayout}`}>
    <div className={s.officeIntro}>
      <h2 id="office-heading">A local conversation.<br />A clear arrangement.</h2>
      <p>{model.address ? "A head office in Granges-Marnand gives your enquiry a real Swiss contact point. Discuss the project remotely or ask about an in-person meeting." : "Confirm the Swiss contact point and current meeting arrangements with the team."}</p>
      <p>Agree the people, working hours and contracting entity for your engagement. A Swiss office is a physical presence - not evidence of a separately incorporated Swiss company.</p>
      <Link href="/contact" className={s.link}>Arrange a conversation<SwissArrow /></Link>
    </div>
    <div>
      <dl className={s.officeFacts}>
        <div><dt>Head office</dt><dd>{model.address ?? "To be confirmed"}</dd></div>
        <div><dt>Direct line</dt><dd>{model.phones.length ? model.phones.map(phone => <a key={phone.href} href={phone.href}>{phone.display}</a>) : "To be confirmed"}</dd></div>
        <div><dt>Email</dt><dd>{model.emailHref ? <a href={model.emailHref}>{model.email}</a> : "To be confirmed"}</dd></div>
        <div><dt>Engineering HQ</dt><dd>{model.indoreAddress ?? "To be confirmed"}</dd></div>
        <div><dt>Legal entity</dt><dd>{model.legalName ?? "To be confirmed"}</dd></div>
        <div><dt>Swiss local time</dt><dd>Europe/Zurich · CET / CEST</dd></div>
      </dl>
      <p className={s.officeNote}>Office and contact details use the approved public company and office records. Meeting availability and contractual arrangements are confirmed for your enquiry.</p>
      <div className={s.connectedOffice}><p>Also in India</p><Link href="/locations/indore">{model.indoreAddress ? "Our Indore engineering headquarters" : "Indore location information"}<SwissArrow /></Link></div>
    </div>
  </div></section>;
}
export function SwissServices() {
  return <section id="services" className={`${s.section} ${s.grey}`} aria-labelledby="services-heading"><div className={s.rail}>
    <div className={s.sectionHead}><h2 id="services-heading">What we deliver<br />for Swiss clients.</h2><p>From a website to the software your business runs on. Six capabilities to shape around your goals, users and constraints.</p></div>
    <div className={s.serviceList}>{SWISS_SERVICES.map(service => <article key={service.title} data-swiss-service><Link href={service.href}><h3>{service.title}</h3><SwissArrow /></Link><p>{service.body}</p></article>)}</div>
    <Link href="/services" className={`${s.link} ${s.allServices}`}>Explore all capabilities<SwissArrow /></Link>
  </div></section>;
}
export function SwissWorking({ model }: { model: SwissModel }) {
  return <section id="working" className={`${s.section} ${s.dark}`} aria-labelledby="working-heading"><div className={s.rail}>
    <div className={s.sectionHead}><h2 id="working-heading">{model.address && model.indoreAddress ? <>Two offices.<br />A shared plan.</> : <>Clear conversations.<br />An agreed plan.</>}</h2><p>Location is the starting point. Make the communication rhythm, engineering reviews and responsibilities explicit.</p></div>
    <div className={s.workingList}>{buildSwissWorking(model).map(item => <article key={item.title}><h3>{item.title}</h3><p>{item.body}</p></article>)}</div>
    <div className={s.workingFooter}><p>Confirm availability, the proposed team, response expectations and ownership terms before work begins. Neither timezones nor locations guarantee a delivery schedule.</p><Link href="/trust" className={s.link}>Ownership & working practices<SwissArrow /></Link></div>
  </div></section>;
}
export function SwissQuestions({ faqs }: { faqs: SwissFaqs }) {
  return <section id="faq" className={s.section} aria-labelledby="faq-heading"><div className={`${s.rail} ${s.questionLayout}`}>
    <div className={s.questionIntro}><h2 id="faq-heading">Questions<br />Swiss clients ask.</h2><p>Office, services, timezones, meetings and what to agree before beginning.</p><Link href="/contact" className={s.link}>Ask another question<SwissArrow /></Link><Link href="/company-profile" className={s.related}>Read the company profile<SwissArrow /></Link></div>
    <div className={s.faqList} aria-label="Savo Technologies Switzerland, frequently asked questions">{faqs.map((item, index) => <details key={item.q} open={index === 0}><summary>{item.q}<SwissPlus /></summary><p>{item.a}</p></details>)}</div>
  </div></section>;
}
