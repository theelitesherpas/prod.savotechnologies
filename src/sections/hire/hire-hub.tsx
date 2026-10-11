import Link from "next/link";
import type { HireRole } from "@/constants/hire";
import type { Article } from "@/constants/insights";
import { Faq } from "@/components/shared/faq";
import { ClosingCta } from "@/components/shared/closing-cta";
import { HiringAction } from "./hire-interactions";
import { HiringArrow, HiringCheck } from "./hire-art";
import { HIRING_FAQS, roleGuide } from "./hire-content";
import { DeveloperPicker, HiringAssembly, HiringTimeline, TeamBuilder } from "./hire-hub-interactions";
import s from "./hire-hub.module.css";

/** THESIS: One decision per section; replace the rejected scattered hub, not its subpages.
 * OWN-WORLD: Pinned Savo Outfit/Inter, white/gray reading grounds, one black team scene, red actions.
 * STORY: Skill → team shape and ownership → hiring sequence → answers → requirement.
 * FIRST VIEWPORT: Direct offer/actions beside a role assembling into the buyer's workflow.
 * FORM: User-directed hub-only reassembly, native role picker and animated team assembly; no new world.
 * FINISH: Bounded evidence, inline review, scoped DESIGN/brief and provenance; no shipping raster. */
export function HireHub({ roles, articles }: { roles: HireRole[]; articles: Article[] }) {
  const choices = roles.map(role => {
    const guide = roleGuide(role);
    return { slug: role.slug, title: role.title, heroLead: role.heroLead, stack: role.stack, monthly: role.monthly, iconSlug: role.iconSlug, focus: guide.focus, assignment: guide.assignment };
  });
  const guides = articles.filter(article => ["offshore-without-the-risk", "fixed-scope-vs-dedicated-team", "how-to-review-a-technical-proposal"].includes(article.slug)).slice(0, 3);
  return <div className={s.page} data-hire-page="hub" data-hire-hub="journey">
    <section className={s.hero} aria-labelledby="hire-heading"><div className={s.rail}>
      <div className={s.opening}><div className={s.heroCopy}><h1 id="hire-heading">Your next developer.<br/><span>Part of your team.</span></h1><p>Bring Savo developers into the work you’re already building. Find the skill you need, choose how to work together, and agree a clear starting point.</p><div className={s.actions}><HiringAction source="hire-hero" className={s.primary}>Tell us what you need</HiringAction><a href="#roles" className={s.secondary}>Find your developer<HiringArrow/></a></div></div><HiringAssembly/></div>
      <nav className={s.journeyLinks} aria-label="Your hiring journey"><a href="#roles"><span>Find the right skill</span><HiringArrow/></a><a href="#working-model"><span>Shape your team</span><HiringArrow/></a><a href="#getting-started"><span>See how to start</span><HiringArrow/></a></nav>
    </div></section>

    <section id="roles" className={s.section} aria-labelledby="roles-heading"><div className={s.rail}>
      <div className={s.sectionHead}><h2 id="roles-heading">What does your<br/>team need next?</h2><p>Start with the part of your product that needs attention. Choose a skill to see where a developer can contribute.</p></div>
      <DeveloperPicker roles={choices}/>
    </div></section>

    <section id="working-model" className={`${s.section} ${s.dark}`} aria-labelledby="models-heading"><div className={s.rail}>
      <div className={s.sectionHead}><h2 id="models-heading">One developer.<br/>Or the right mix.</h2><p>The role is only half the decision. Choose a working shape and see how direction, development and review fit together.</p></div>
      <TeamBuilder/>
    </div></section>

    <section id="getting-started" className={s.section} aria-labelledby="path-heading"><div className={`${s.rail} ${s.pathLayout}`}>
      <div className={s.pathIntro}><h2 id="path-heading">From your brief<br/>to the first piece<br/>of reviewed work.</h2><p>No need to arrive with every detail settled. Start with the work; these are the decisions we’ll discuss together.</p><HiringAction source="hire-matching" className={s.primary}>Share your hiring requirement</HiringAction>
        <details className={s.checklist}><summary>What should I put in my brief?<HiringArrow/></summary><ul>{["The product area or skill you need", "Your stack and current stage", "Who will guide and review the work", "Preferred start and working-hour overlap", "Allocation and budget context"].map(item => <li key={item}><HiringCheck/>{item}</li>)}</ul></details>
      </div><HiringTimeline/>
    </div></section>

    <section id="questions" className={s.section} aria-labelledby="questions-heading"><div className={`${s.rail} ${s.questionsLayout}`}>
      <div><h2 id="questions-heading">A few things<br/>worth clearing up.</h2><p>Rates, availability and the working arrangement - before you make a commitment.</p>
        {guides.length > 0 && <details className={s.reading}><summary>Read more before you decide<HiringArrow/></summary><ul>{guides.map(article => <li key={article.slug}><Link href={`/insights/${article.slug}`}><span>{article.title}</span><HiringArrow/></Link></li>)}</ul></details>}
        <div className={s.serviceAlternative}><p>Need a project delivered, rather than a developer in your team?</p><Link href="/services" className={s.link}>Explore our services<HiringArrow/></Link></div>
      </div><Faq items={[...HIRING_FAQS]} label="Hiring developers, frequently asked questions" initialVisible={6}/>
    </div></section>

    <ClosingCta id="hire-start" headingId="hire-start-heading" title={<>Let’s find the missing<br/>piece in your team.</>} description="Tell us what you’re building and where you need help. We’ll discuss the role, the working setup and the next step."><HiringAction source="hire-final" className={s.primary}>Discuss hiring developers</HiringAction><Link href="/contact">Or talk to the team<HiringArrow/></Link></ClosingCta>
  </div>;
}
