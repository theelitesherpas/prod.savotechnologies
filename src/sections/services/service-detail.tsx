import Link from "next/link";
import Image from "next/image";
import type { ServiceDetail } from "@/constants/services-detail";
import type { CrossLink } from "@/sections/industries/industry-detail";
import { Faq } from "@/components/shared/faq";
import { ClosingCta } from "@/components/shared/closing-cta";
import { ServiceDeliverables } from "./service-workbench";
import { ServiceProcess } from "./service-process";
import { ServiceJudgment, ServiceEngineeringNotes } from "./service-standard";
import { Arrow, ServiceAction, ServiceVisual } from "./service-interactions";
import { ResourceCover } from "./service-art";
import s from "./service-page.module.css";

/**
 * THESIS: A useful partner's plan, not a dossier of repeated promises.
 * OWN-WORLD: Savo black/white/red, Outfit/Inter, homepage-like product exhibition and visual engineering.
 * STORY: Offer → fit → interactive scope → visual engineering → selectable delivery → tools → work → FAQ.
 * FIRST VIEWPORT: Dark opening, bright product/phone concepts, manual selectors and a clear project action.
 * FORM: User-selected reference-inspired buyer journey; no new visual identity or commercial claims.
 * FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.
 */
export function ServiceDetailPage({ detail, industries, services, work }: { detail: ServiceDetail; industries: CrossLink[]; services: CrossLink[]; work?: ServiceDetail["relatedWork"] }) {
  return <div className={s.page} data-service-page={detail.slug}>
    <ServiceDetailHero detail={detail} />
    <ServiceOverview detail={detail} />
    <ServiceDeliverables detail={detail} />
    <ServiceEngineeringNotes detail={detail} />
    <ServiceProcess detail={detail} />
    <ServiceTechnology detail={detail} />
    <ServiceResources detail={detail} work={work} />
    <ServiceCrossLinks industries={industries} services={services} />
    <ServiceFaqs detail={detail} />
    <ClosingCta id="service-start" headingId="service-cta-heading" title="Let’s build the right solution." description="Tell us what you want to achieve, what you have today and where you need help. We’ll start with a conversation about the approach that fits.">
      <ServiceAction title={detail.title} source={`service-${detail.slug}-cta`}>Start a Project</ServiceAction><Link href="/contact">Prefer to get in touch directly? <Arrow /></Link>
    </ClosingCta>
  </div>;
}

export function ServiceDetailHero({ detail }: { detail: ServiceDetail }) {
  return <section className={s.hero} aria-labelledby="service-heading"><div className={s.rail}>
    <nav className={s.breadcrumb} aria-label="Breadcrumb"><ol><li><Link href="/">Home</Link></li><li><Link href="/services">Services</Link></li><li aria-current="page">{detail.title}</li></ol></nav>
    <div className={s.heroGrid}><div className={s.heroCopy}>
      <h1 id="service-heading">{detail.tagline}</h1><p>{detail.heroLead}</p>
      <div className={s.heroActions}><ServiceAction title={detail.title} source={`service-${detail.slug}-hero`}>Discuss your project</ServiceAction><a href="#capabilities" className={s.secondary}>Explore the service <Arrow /></a></div>
      <p className={s.heroNote}>A new idea, an existing product or a platform ready for its next chapter.</p>
    </div><ServiceVisual slug={detail.slug} title={detail.title} short={detail.short} /></div>
  </div></section>;
}

export function ServiceOverview({ detail }: { detail: ServiceDetail }) {
  return <section id="overview" className={s.section} aria-labelledby="overview-heading"><div className={`${s.rail} ${s.overviewGrid}`}>
    <div className={s.overviewCopy}><h2 id="overview-heading">Start with what your business needs.</h2><p className={s.largeCopy}>{detail.overview[0]}</p><details className={s.overviewDetail}><summary>More about our approach <Arrow /></summary><p>{detail.overview[1]}</p></details><Link href="#delivery" className={s.textLink}>See how we work <Arrow /></Link></div>
    <ServiceJudgment detail={detail} />
  </div></section>;
}

const TECH_ICONS: Record<string, string> = { "Next.js": "nextdotjs", React: "react", TypeScript: "typescript", "Node.js": "nodedotjs", PostgreSQL: "postgresql", Flutter: "flutter", "React Native": "reactnative", Swift: "swift", Kotlin: "kotlin", Firebase: "firebase", Figma: "figma", Docker: "docker", Kubernetes: "kubernetes", Terraform: "terraform", "GitHub Actions": "github", GCP: "googlecloud", Python: "python", OpenAI: "openai", Anthropic: "anthropic", Playwright: "playwright", Cypress: "cypress" };
function ServiceTechnology({ detail }: { detail: ServiceDetail }) {
  return <section id="technology" className={`${s.section} ${s.techSection}`} aria-labelledby="technology-heading"><div className={`${s.rail} ${s.techGrid}`}>
    <div><h2 id="technology-heading">The right tools for the job.</h2><p>We select the stack around your requirements, existing systems and the team that will maintain the result.</p><Link href="/technology" className={s.textLink}>Explore our technology approach <Arrow /></Link></div>
    <ul className={s.stack} aria-label={`${detail.title} technologies and tools`}>{detail.stack.map(t => <li key={t}>{TECH_ICONS[t] ? <Image src={`/images/technology/${TECH_ICONS[t]}.svg`} width={24} height={24} alt="" /> : <span className={s.toolDot} aria-hidden="true" />}{t}</li>)}</ul>
  </div></section>;
}

function ServiceResources({ detail, work }: { detail: ServiceDetail; work?: ServiceDetail["relatedWork"] }) {
  const verified = work ?? detail.relatedWork ?? [];
  // Publication authority: reading links render only for articles that are
  // actually Published. With none verified, the honest destination is the
  // insights hub - never a link to an article that does not exist.
  const items = verified.length ? verified : [{ label: "Explore insights", href: "/insights" }];
  const normalise = (label: string) => label.replace(/^Reading:\s*/, "").replace("Case study dossier", "Explore case studies").replace("This site, as the specimen", "Technology approach").replace("Designed beautifully, engineered seriously", "Our engineering approach");
  // The old homepage #standard anchor was removed in the approved homepage consolidation.
  const destination = (href: string) => href === "/#standard" ? "/technology" : href;
  return <section id="work" className={`${s.section} ${s.resourceSection}`} aria-labelledby="work-heading"><div className={`${s.rail} ${s.resourceGrid}`}>
    <div><h2 id="work-heading">Explore the work and thinking behind it.</h2><p>Case studies and practical perspectives on the decisions that shape a project.</p><Link href="/case-studies" className={s.textLink}>View case studies <Arrow /></Link></div>
    <div><ul className={s.resourceLinks}>{items.map(w => <li key={w.href}><Link href={destination(w.href)}><span className={s.resourceArt}><ResourceCover href={w.href} slug={detail.slug} /></span><span>{normalise(w.label)}</span><Arrow /></Link></li>)}</ul><p className={s.resourceDisclosure}>Resources to support the decisions behind your project.</p></div>
  </div></section>;
}

export function ServiceCrossLinks({ industries, services }: { industries: CrossLink[]; services: CrossLink[] }) {
  return <section id="context" className={s.section} aria-labelledby="context-heading"><div className={s.rail}>
    <div className={s.sectionIntro}><h2 id="context-heading">Your sector. Your systems. Your priorities.</h2><p>The application should reflect the people, processes and requirements of the business it serves.</p></div>
    <nav aria-label="Related industries" className={s.sectors}>{industries.map(i => <Link key={i.href} href={i.href}><div className={s.sectorImage}><Image src={`/images/sectors/${i.href.split("/").filter(Boolean).at(-1)}-hero.webp`} width={600} height={340} alt="" sizes="(max-width: 639px) 100vw, 33vw" /></div><div className={s.sectorCopy}><h3>{i.label}</h3><p>{i.hint}</p><Arrow /></div></Link>)}</nav>
    <div className={s.related}><div><h3>A wider project in mind?</h3><p>Explore the capabilities that can support the next part of your product.</p></div><nav aria-label="Related services"><ul>{services.map(i => <li key={i.href}><Link href={i.href}>{i.label}<Arrow /></Link></li>)}</ul></nav></div>
  </div></section>;
}

export function ServiceFaqs({ detail }: { detail: ServiceDetail }) {
  return <section id="questions" className={`${s.section} ${s.faqSection}`} aria-labelledby="faq-heading"><div className={`${s.rail} ${s.faqGrid}`}>
    <div><h2 id="faq-heading">A few things you might be wondering.</h2><p>Clear answers before you decide how to move forward.</p><Link href="/contact" className={s.textLink}>Have another question? <Arrow /></Link></div>
    <div className={s.faq}><Faq items={detail.faqs} label={`${detail.title} frequently asked questions`} initialVisible={6} /></div>
  </div></section>;
}
