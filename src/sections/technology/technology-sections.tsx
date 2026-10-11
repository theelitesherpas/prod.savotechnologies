import Link from "next/link";
import { StartProjectButton } from "@/components/shared/start-project-button";
import { ARCHITECTURE_JUDGMENT, TECHNOLOGY_FAQS, TECHNOLOGY_STACK } from "./technology-content";
import { TechnologyArrow, TechnologyAssembly, TechnologyMark, TechnologyPlus, TechnologySymbol, type TechnologySymbolKind } from "./technology-art";
import s from "./technology.module.css";

export function TechnologyHero() {
  return <section className={`${s.section} ${s.hero}`} aria-labelledby="tech-heading"><div className={s.rail}>
    <div className={s.opening}>
      <div className={s.heroCopy}>
        <h1 id="tech-heading">Chosen for the{" "}<br /><span>problem,</span>{" "}<br />not the résumé.</h1>
        <p>What we use, why we use it, and where each choice fits. From the interface to the infrastructure, the stack should suit your product - not the other way around.</p>
        <div className={s.heroActions}><StartProjectButton source="technology-hero" label="Discuss your stack" /><a className={s.secondary} href="#stack">Explore the stack<TechnologyArrow /></a></div>
        <noscript><p className={s.note}>To discuss your stack without JavaScript, <Link href="/contact#send">contact our team</Link>.</p></noscript>
      </div>
      <TechnologyAssembly />
    </div>
    <nav className={s.journey} aria-label="Technology page contents"><a href="#stack">Explore the technologies<TechnologyArrow /></a><a href="#architecture">Understand the decisions<TechnologyArrow /></a><a href="#questions">Find an answer<TechnologyArrow /></a></nav>
  </div></section>;
}

/** Native radios + CSS :has: keyboard, server-rendering and no-JS behavior agree. */
export function TechnologyStack() {
  return <section id="stack" className={s.section} aria-labelledby="stack-heading"><div className={s.rail}>
    <div className={s.centerHead}><h2 id="stack-heading">The stack, and the reasons.</h2><p>Six technology families. Explore our picks, the reasoning behind them, and where they are appropriate.</p></div>
    <div className={s.stackStudio} data-technology-studio>
      <fieldset className={s.familyChoices}><legend className="sr-only">Choose a technology family</legend>{TECHNOLOGY_STACK.map((family, i) => <label key={family.id}><input type="radio" name="technology-family" value={family.id} defaultChecked={i === 0} aria-controls={`stack-${family.id}`} /><span><TechnologySymbol kind={family.id as TechnologySymbolKind} size={22} />{family.family}</span></label>)}</fieldset>
      <div className={s.stackPanels}>{TECHNOLOGY_STACK.map(family => <article key={family.id} id={`stack-${family.id}`} data-family={family.id} className={s.stackPanel} aria-labelledby={`stack-${family.id}-heading`}>
        <div className={s.familyCopy}><h3 id={`stack-${family.id}-heading`}>{family.family}</h3><dl><div><dt>Why these choices</dt><dd>{family.why}</dd></div><div><dt>Where they fit</dt><dd>{family.where}</dd></div></dl></div>
        <div className={s.toolShelf}><h4>Our picks</h4><ul>{family.tools.map((tool, i) => <li key={tool.name}><TechnologyMark tool={tool} kind={family.id === "ai" ? ["ai", "data", "check"][i] as TechnologySymbolKind : family.id === "cloud" ? ["cloud", "modular", "events", "cache"][i] as TechnologySymbolKind : family.id as TechnologySymbolKind} /></li>)}</ul></div>
      </article>)}</div>
    </div>
    <p className={s.stackNote}>The starting point is your product, your existing systems and the team that will maintain them - not a mandatory stack.</p>
  </div></section>;
}

const PRINCIPLE_SYMBOLS: TechnologySymbolKind[] = ["modular", "api", "events", "cache", "tenants", "migration"];
export function TechnologyArchitecture() {
  return <section id="architecture" className={`${s.section} ${s.dark}`} aria-labelledby="arch-heading"><div className={s.rail}>
    <div className={s.sectionHead}><h2 id="arch-heading">Architecture that earns<br />its complexity.</h2><p>How we think about architecture. Concepts used where they belong, with the reasoning kept visible.</p></div>
    <dl className={s.principles}>{ARCHITECTURE_JUDGMENT.map((principle, i) => <div key={principle.k}><TechnologySymbol kind={PRINCIPLE_SYMBOLS[i]} size={30} /><div><dt>{principle.k}</dt><dd>{principle.v}</dd></div></div>)}</dl>
    <div className={s.architectureNext}><p>Want this reasoning applied to your system? Explore the work or see how agents and platforms are engineered.</p><div><Link href="/case-studies" className={s.link}>Explore case studies<TechnologyArrow /></Link><Link href="/ai-agents" className={s.link}>AI &amp; intelligent systems<TechnologyArrow /></Link></div></div>
  </div></section>;
}

export function TechnologyQuestions() {
  return <section id="questions" className={s.section} aria-labelledby="page-faq-heading"><div className={`${s.rail} ${s.questionLayout}`}>
    <div className={s.questionIntro}><h2 id="page-faq-heading">Technology, asked<br />and answered.</h2><p>Practical answers about stack choices, existing systems, AI and the trade-offs worth considering.</p><Link href="/contact#send" className={s.link}>Ask another question<TechnologyArrow /></Link><aside className={s.related}><h3>The wider picture</h3><p>Technology is one part of the decision. Explore the delivery approach and security considerations too.</p><Link href="/enterprise" className={s.link}>Working with Savo<TechnologyArrow /></Link><Link href="/trust" className={s.link}>Trust &amp; security<TechnologyArrow /></Link></aside></div>
    <div className={s.faqList} aria-label="Technology frequently asked questions">{TECHNOLOGY_FAQS.map((item, i) => <details key={item.q} open={i === 0}><summary>{item.q}<TechnologyPlus /></summary><p>{item.a}</p></details>)}</div>
  </div></section>;
}
