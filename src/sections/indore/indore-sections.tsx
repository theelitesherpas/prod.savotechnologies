import type { ReactNode } from "react";
import Link from "next/link";
import { ClosingCta } from "@/components/shared/closing-cta";
import { INDORE_SERVICES, INDORE_WORKING, type IndoreModel, type buildIndoreFaqs } from "./indore-content";
import { IndoreArrow, IndoreLocation, IndorePlus } from "./indore-art";
import s from "./indore.module.css";

type IndoreFaqs = ReturnType<typeof buildIndoreFaqs>;
/**
 * THESIS: a real engineering base, not a keyword directory or invented office tour.
 * OWN-WORLD: user-pinned Outfit/Inter, white/black/red/grey fields and shared rails.
 * STORY: find the headquarters, understand four capabilities, choose a conversation.
 * FIRST VIEWPORT: grey offer, genuine address sheet, red native detailed-brief link.
 * FORM: user-delegated established world; native facts, links and questions.
 * FINISH: unreviewed and undocumented is unfinished; this build ends with the
 * finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.
 */
export function IndoreSurface({ model, faqs, children }: { model: IndoreModel; faqs: IndoreFaqs; children?: ReactNode }) {
  return <div className={s.page} data-indore-page="engineering-headquarters" data-design-contract="indore-v7:THESIS=real-base-not-keyword-blocks;OWN-WORLD=Outfit-Inter-white-black-red-grey;STORY=location-capabilities-working-questions-contact;FIRST-VIEWPORT=grey-offer-genuine-address-brief-link;FORM=user-delegated-established-world;FINISH=review-verdict-documentation-provenance">
    {children}<IndoreHero model={model} /><IndoreOffice model={model} /><IndoreServices /><IndoreWorking model={model} /><IndoreQuestions faqs={faqs} />
    <ClosingCta id="start" headingId="start-heading" title="Start a conversation." description="Indore client or fully remote, the first step is the same: tell us what you are building."><Link href="/start-a-project">Start a Project<IndoreArrow /></Link><Link href="/contact">Contact the team<IndoreArrow /></Link></ClosingCta>
  </div>;
}
export function IndoreHero({ model }: { model: IndoreModel }) {
  return <section id="indore" className={`${s.section} ${s.hero}`} aria-labelledby="indore-heading"><div className={s.rail}>
    <div className={s.opening}><div className={s.heroCopy}><h1 id="indore-heading">Engineering,<br />{model.address ? <>from <span>Indore.</span></> : <>for your <span>next chapter.</span></>}</h1><p>{model.brand ?? "Our team"} builds websites, mobile apps, custom software and AI systems.{model.address ? " Our engineering headquarters is in Indore, Madhya Pradesh." : " Contact the team to confirm current location details."} {model.markets ? "For clients in India and beyond." : "Discuss the location and delivery arrangements for your project."}</p><div className={s.heroActions}><Link href="/start-a-project" className={s.primary}>Start a Project<IndoreArrow /></Link><a href="#office" className={s.secondary}>Office & contact<IndoreArrow /></a></div></div>
      <aside className={s.addressSheet} aria-labelledby="address-heading"><IndoreLocation /><h2 id="address-heading">{model.address ? <>Our engineering<br />headquarters.</> : "Office details."}</h2><address>{model.address ?? "Headquarters address awaiting public confirmation."}</address>{model.mapHref && <a href={model.mapHref} target="_blank" rel="noopener noreferrer" className={s.link}>Open address in Maps<IndoreArrow external /></a>}<p className={s.visitNote}>Planning a visit? Arrange a time with the team before travelling.</p></aside>
    </div>
    <nav className={s.journey} aria-label="Indore page contents"><a href="#services">What we build<IndoreArrow /></a><a href="#working">Working together<IndoreArrow /></a><a href="#faq">Common questions<IndoreArrow /></a></nav>
  </div></section>;
}
export function IndoreOffice({ model }: { model: IndoreModel }) {
  return <section id="office" className={s.section} aria-labelledby="office-heading"><div className={`${s.rail} ${s.officeLayout}`}>
    <div className={s.officeIntro}><h2 id="office-heading">{model.address ? <>A real base.<br />An open conversation.</> : "Confirm the details."}</h2><p>{model.address ? `An engineering company based in Indore.${model.markets ? " Working with local businesses and remotely with clients elsewhere." : " Discuss delivery and meeting arrangements with the team."}` : "Confirm the team's current location and meeting arrangements before planning a visit."}</p><p>Tell us whether you prefer an in-person conversation or a remote call. Share your language preference - English or Hindi - when you get in touch.</p><Link href="/contact" className={s.link}>Arrange a conversation<IndoreArrow /></Link></div>
    <div><dl className={s.officeFacts}>
      <div><dt>Headquarters</dt><dd>{model.address ?? "To be confirmed"}</dd></div>
      <div><dt>Legal entity</dt><dd>{model.legalName ?? "To be confirmed"}</dd></div>
      {model.foundedYear && <div><dt>Operating since</dt><dd>{model.foundedYear}</dd></div>}
      <div><dt>Email</dt><dd>{model.emailHref ? <a href={model.emailHref}>{model.email}</a> : "To be confirmed"}</dd></div>
      <div><dt>Phone</dt><dd>{model.phoneHref ? <a href={model.phoneHref}>{model.phone}</a> : "To be confirmed"}</dd></div>
    </dl><p className={s.officeNote}>Office and contact details come from the public company record. Meeting availability is confirmed when you contact the team.</p>{model.offices && <div className={s.connectedOffice}><p>Also in Europe</p><Link href="/locations/switzerland">Our Switzerland head office<IndoreArrow /></Link></div>}</div>
  </div></section>;
}
export function IndoreServices() {
  return <section id="services" className={`${s.section} ${s.grey}`} aria-labelledby="services-heading"><div className={s.rail}>
    <div className={s.sectionHead}><h2 id="services-heading">What we build<br />from here.</h2><p>From a first website to the software your business runs on. Explore the scope of the work, not just the technology behind it.</p></div>
    <div className={s.serviceList}>{INDORE_SERVICES.map(service => <article key={service.href} data-indore-service={service.kind}><Link href={service.href}><h3>{service.title}</h3><IndoreArrow /></Link><p>{service.body}</p></article>)}</div>
    <Link href="/services" className={`${s.link} ${s.allServices}`}>Explore all capabilities<IndoreArrow /></Link>
  </div></section>;
}
export function IndoreWorking({ model }: { model: IndoreModel }) {
  return <section id="working" className={`${s.section} ${s.dark}`} aria-labelledby="working-heading"><div className={s.rail}>
    <div className={s.sectionHead}><h2 id="working-heading">Working with<br />{model.address ? "an Indore-based team." : "the right team."}</h2><p>Location is the starting point. The people, scope and communication you agree on are what make the engagement work.</p></div>
    <div className={s.workingList}>{INDORE_WORKING.map(item => <article key={item.title}><h3>{item.title}</h3><p>{item.body}</p></article>)}</div>
    <div className={s.workingFooter}><p>Review the proposed team, ownership terms and delivery plan before work begins. Confirm the price and any response commitments for your engagement.</p><Link href="/trust" className={s.link}>Ownership & working practices<IndoreArrow /></Link></div>
  </div></section>;
}
export function IndoreQuestions({ faqs }: { faqs: IndoreFaqs }) {
  return <section id="faq" className={s.section} aria-labelledby="faq-heading"><div className={`${s.rail} ${s.questionLayout}`}>
    <div className={s.questionIntro}><h2 id="faq-heading">Questions<br />clients ask.</h2><p>Location, services, cost and what to check before choosing a development partner.</p><Link href="/contact" className={s.link}>Ask another question<IndoreArrow /></Link><Link href="/company-profile" className={s.related}>Read the company profile<IndoreArrow /></Link></div>
    <div className={s.faqList} aria-label="Indore frequently asked questions">{faqs.map((item, index) => <details key={item.q} open={index === 0}><summary>{item.q}<IndorePlus /></summary><p>{item.a}</p></details>)}</div>
  </div></section>;
}
