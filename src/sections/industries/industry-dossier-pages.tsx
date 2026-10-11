import Image from "next/image";
import Link from "next/link";
import type { IndustryDossier } from "@/content/industries/schema";
import { INDUSTRY_HUB_FAQS } from "@/content/industries/dossiers";
import { industryCaseSlots, sectorArticles } from "@/content/industries/relationships";
import type { Article } from "@/constants/insights";
import type { CaseStudy } from "@/lib/case-study-schema";
import { IndustryCaseStudies } from "./industry-case-studies";
import { Faq } from "@/components/shared/faq";
import { ClosingCta } from "@/components/shared/closing-cta";
import { DeliveryDrawing, SectorGlyph } from "./industry-dossier-art";
import { DossierArrow, IndustryAction, SectorExplorer } from "./industry-dossier-interactions";
import { DetailContext, DetailConnections, DetailDelivery, DetailEngineering } from "./industry-detail-sections";
import { ProductStudio, ReviewStudio, SectorRoles } from "./industry-detail-studio";
import s from "./industry-dossier.module.css";
import v from "./industry-detail-polish.module.css";

/* User-pinned service identity, code-led. THESIS: the business system leads.
   OWN-WORLD: Outfit/Inter, black/white/red, aligned ecosystems and sector imagery.
   STORY: context → systems → decisions → review → evidence → brief.
   FIRST VIEWPORT: concise offer and red action left, substantial system map right.
   FORM: sector operating dossier; manual actors and solution workflow selections.
   FINISH: unreviewed and undocumented is unfinished; this build ends with the finish
   review, the verdict, DESIGN.md, and every shipping raster carrying its provenance. */
export type IndustryServiceLink = { slug: string; title: string };
type Resources = { articles: Article[]; studies: CaseStudy[] };
function Headline({ text }: { text: string }) {
  return <h1>{text.split("\n").map((line, i) => <span key={i}>{line}</span>)}</h1>;
}
function WorkReading({ studies, articles, sectors, sector }: Resources & { sectors: IndustryDossier[]; sector?: string }) {
  return <section id="work" className={s.section} aria-labelledby="industry-work-title"><div className={s.rail}>
    <div className={s.caseSectionHead}><h2 id="industry-work-title">{sector ? `Case studies for ${sector}.` : "From industry needs to project work."}</h2><p>Relevant projects and solution directions, alongside practical reading for your next product decision.</p></div>
    <IndustryCaseStudies slots={industryCaseSlots(studies, sectors)} />
    <div className={s.caseFooter}><p className={s.note}>Projects are selected by their published industry associations.</p><Link href="/case-studies" className={s.textLink}>Explore all case studies<DossierArrow /></Link></div>
    {articles.length > 0 && <div className={s.reading}><h3>Useful reading before you build.</h3><div className={s.articleList}>{articles.map((a, i) => <article key={a.slug}><div className={s.editorialMark} aria-hidden="true"><svg viewBox="0 0 120 72" fill="none"><path d={i === 0 ? "M12 36h25v-22h25v44h26V36h20" : i === 1 ? "M12 14h96M12 36h63M12 58h84" : "M16 14h34v44H16zM70 14h34v44H70zM50 36h20"} stroke="#666" strokeWidth="1.5" /><path d={i === 0 ? "M37 36h25" : i === 1 ? "M84 36h24" : "M50 36h20"} stroke="#b82222" strokeWidth="3" /></svg></div><div><span>{a.cat}</span><h4><Link href={`/insights/${a.slug}`}>{a.title}</Link></h4><p>{a.excerpt}</p></div><Link href={`/insights/${a.slug}`} aria-label={`Read ${a.title}`}><DossierArrow /></Link></article>)}</div><p className={s.note}>Explore related ideas in our published industry reading.</p></div>}
  </div></section>;
}
function DeliveryStandard({ hub = false }: { hub?: boolean }) {
  const steps = [
    ["Understand the work", "Map users, business rules, existing systems and the decisions that need an owner."],
    ["Design a useful scope", "Agree the first workflow, data boundaries and how success will be evaluated."],
    ["Build and review", "Connect design, engineering and testing with stakeholder feedback at agreed points."],
    ["Plan the handover", "Agree release, documentation, operating responsibilities and any ongoing work."],
  ];
  return <section id={hub ? "approach" : undefined} className={`${s.section} ${s.dark}`} aria-labelledby="industry-delivery-title"><div className={s.rail}><div className={s.sectionHead}><h2 id="industry-delivery-title">Different operating realities. One thoughtful way to build.</h2><p>Start with the sector’s constraints. Choose the technology after the workflow and the responsibility are clear.</p></div><div className={s.deliveryDrawing}><DeliveryDrawing /></div><ol className={s.deliverySteps}>{steps.map(([title, text]) => <li key={title}><h3>{title}</h3><p>{text}</p></li>)}</ol><details className={s.globalWorking}><summary>Working across locations and markets<DossierArrow /></summary><p>Bring stakeholder time zones, operating locations, language needs and infrastructure constraints into the brief. Review cadence, communication, access, data residency and handover responsibilities should be agreed for the actual project - not assumed from a global-delivery claim.</p><Link href="/company-profile" className={s.textLink}>Company information<DossierArrow /></Link></details></div></section>;
}
function CrossLinks({ services, industries }: { services: IndustryServiceLink[]; industries: Pick<IndustryDossier, "slug" | "title" | "summary">[] }) {
  return <div className={s.crossLinks}>{services.length > 0 && <div><h3>The capabilities behind the work.</h3><ul>{services.map(service => <li key={service.slug}><Link href={`/services/${service.slug}`}>{service.title}<DossierArrow /></Link></li>)}</ul></div>}{industries.length > 0 && <div><h3>Connected operating worlds.</h3><ul>{industries.map(industry => <li key={industry.slug}><Link href={`/industries/${industry.slug}`}><span>{industry.title}<small>{industry.summary}</small></span><DossierArrow /></Link></li>)}</ul></div>}</div>;
}
function Closing({ title, text, subject, source }: { title: string; text: string; subject: string; source: string }) {
  return <ClosingCta id="industry-start" headingId="industry-close-title" title={title} description={text}><IndustryAction subject={subject} source={source}>Discuss your project</IndustryAction><Link href="/contact">Contact Savo<DossierArrow /></Link></ClosingCta>;
}

export function IndustriesDossierHub({ dossiers, services, articles, studies }: { dossiers: IndustryDossier[]; services: IndustryServiceLink[] } & Resources) {
  const featured = dossiers.filter(d => d.featured);
  const opening = (featured.length ? featured : dossiers).slice(0, 3);
  const reading = sectorArticles(articles, dossiers);
  return <div className={s.page} data-industry-page="hub">
    <section className={`${s.hero} ${s.dark}`} aria-labelledby="industries-title"><div className={`${s.rail} ${s.opening}`}><div className={s.heroCopy}><h1 id="industries-title">Technology shaped by<br />how your industry works.</h1><p>Different users. Different responsibilities. Different things that cannot go wrong. Explore how those realities shape the products and systems we can build with you.</p><div className={s.actions}><IndustryAction subject="my industry" source="industries-hero">Discuss your industry</IndustryAction><a href="#sectors" className={s.secondary}>Explore industries<DossierArrow /></a></div></div><figure className={s.industryField}><div className={s.fieldImages}>{opening.map((d, i) => <Link href={`/industries/${d.slug}`} key={d.slug} className={i === 0 ? s.fieldLead : undefined}>{d.image ? <Image src={d.image} alt={d.imageAlt} fill sizes={i === 0 ? "(max-width: 900px) calc(100vw - 40px), 620px" : "(max-width: 900px) 45vw, 300px"} priority={i === 0} /> : <SectorGlyph kind={d.layout} />}<span>{d.title}<DossierArrow /></span></Link>)}</div><figcaption>Photography reflects the people and environments across these industries.</figcaption></figure></div><div className={`${s.rail} ${s.heroJourney}`}><a href="#sectors">Find your industry<DossierArrow /></a><a href="#approach">Understand the approach<DossierArrow /></a><a href="#work">Explore work & reading<DossierArrow /></a></div></section>
    <section id="sectors" className={s.section} aria-labelledby="sector-index-title"><div className={s.rail}><div className={s.sectionHead}><h2 id="sector-index-title">Start with your operating world.</h2><p>Choose a sector for a closer view of its workflows, solution opportunities and engineering considerations.</p></div><SectorExplorer sectors={dossiers.map(d => ({ slug: d.slug, title: d.title, summary: d.summary, image: d.image, imageAlt: d.imageAlt, layout: d.layout, solutions: d.solutions.map(x => x.title) }))} /><div className={s.chapterDirectory}><h3>All industry dossiers</h3><ul>{dossiers.map(d => <li key={d.slug}><Link href={`/industries/${d.slug}`}>{d.title}<DossierArrow /></Link></li>)}</ul></div></div></section>
    <DeliveryStandard hub />
    <section className={s.section} aria-labelledby="industry-decisions-title"><div className={s.rail}><div className={s.sectionHead}><h2 id="industry-decisions-title">The right starting point is a business decision.</h2><p>A portal, mobile product, AI assistant or integration may be the answer. First, identify the people, the handoff and the constraint that matter.</p></div><div className={s.startingQuestions}><h3>What needs to change?</h3><ul><li>Who uses the system, and what are they trying to complete?</li><li>Where does information or responsibility get lost?</li><li>What must remain under human control?</li><li>Which existing systems and rules cannot be ignored?</li></ul></div><CrossLinks services={services.slice(0, 4)} industries={[]} /></div></section>
    <WorkReading studies={studies} articles={reading} sectors={dossiers} />
    <section id="questions" className={s.section} aria-labelledby="industries-questions-title"><div className={`${s.rail} ${s.faqLayout}`}><div><h2 id="industries-questions-title">Before you choose a direction.</h2><p>A few useful answers before the specification is finished.</p></div><div className={s.faq}><Faq items={INDUSTRY_HUB_FAQS} label="Industries questions" /></div></div></section>
    <Closing title="Tell us what needs to work better." text="Start with the business problem, the people and the systems involved. We can discuss whether to build, connect, improve - or keep the simpler option." subject="my industry" source="industries-final" />
  </div>;
}

export function IndustryDossierPage({ dossier: d, dossiers, services, articles, studies }: { dossier: IndustryDossier; dossiers: IndustryDossier[]; services: IndustryServiceLink[] } & Resources) {
  const relatedServices = d.relatedServices.map(slug => services.find(s => s.slug === slug)).filter((x): x is IndustryServiceLink => Boolean(x));
  const relatedIndustries = d.relatedIndustries.map(slug => dossiers.find(i => i.slug === slug)).filter((x): x is IndustryDossier => Boolean(x));
  return <div className={`${s.page} ${v.detailPage}`} data-industry-page={d.slug}>
    <section className={`${s.hero} ${s.dark}`} aria-label={`${d.title} software development`}><div className={`${s.rail} ${s.opening}`}><div className={s.heroCopy}><nav className={s.breadcrumb} aria-label="Breadcrumb"><Link href="/">Home</Link><span aria-hidden="true">/</span><Link href="/industries">Industries</Link><span aria-hidden="true">/</span><span aria-current="page">{d.title}</span></nav><Headline text={d.headline} /><p>{d.lead}</p><div className={s.actions}><IndustryAction subject={d.title} source={`industry-${d.slug}-hero`}>Discuss your project</IndustryAction><a href="#solutions" className={s.secondary}>Explore solutions<DossierArrow /></a></div></div><SectorRoles nodes={d.ecosystemNodes} core={d.ecosystemCore} kind={d.layout} /></div></section>
    <DetailContext dossier={d} />
    <section id="solutions" className={s.section} aria-labelledby="industry-solutions-title"><div className={s.rail}><div className={s.sectionHead}><h2 id="industry-solutions-title">Products built around the job.</h2><p>Choose a product direction to see who it supports and what it should make easier.</p></div><ProductStudio dossier={d} services={services} /></div></section>
    <section id="ai" className={`${s.section} ${s.dark}`} aria-labelledby="industry-ai-title"><div className={s.rail}><div className={s.sectionHead}><h2 id="industry-ai-title">Useful AI. Reviewed by people.</h2><p>Explore assistive tasks and the decisions that stay with your team.</p></div><div className={v.aiComposition}><div className={v.reviewArt} aria-hidden="true"><div /><div /><span>Prepared by AI. Reviewed by people.</span></div><ReviewStudio opportunities={d.aiOpportunities} /></div><div className={v.aiLinks}><Link href="/ai-agents">Explore AI agents</Link><Link href="/ai/consulting">AI consulting</Link></div></div></section>
    <DetailEngineering dossier={d} />
    <DetailDelivery />
    <WorkReading studies={studies} articles={sectorArticles(articles, [d])} sectors={[d]} sector={d.title} />
    <DetailConnections services={relatedServices} industries={relatedIndustries} />
    <section id="questions" className={s.section} aria-labelledby="industry-questions-title"><div className={`${s.rail} ${s.faqLayout}`}><div><h2 id="industry-questions-title">Questions worth asking.</h2><p>Practical answers before you define the scope.</p></div><div className={s.faq}><Faq items={d.faqs} label={`${d.title} software questions`} initialVisible={6} /></div></div></section>
    <Closing title={d.ctaHeading} text={d.ctaText} subject={d.title} source={`industry-${d.slug}-final`} />
  </div>;
}
