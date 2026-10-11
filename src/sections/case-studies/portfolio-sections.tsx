import Link from "next/link";
import { StartProjectButton } from "@/components/shared/start-project-button";
import type { PortfolioCard, PortfolioVisual } from "./portfolio-content";
import { PORTFOLIO_CATEGORIES, portfolioHref } from "./portfolio-content";
import styles from "./portfolio.module.css";

export function PortfolioArrow() { return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M4 12h15m-6-6 6 6-6 6" /></svg>; }
export function PortfolioImage({ visual, eager = false }: { visual: PortfolioVisual; eager?: boolean }) {
  // Covers use the same 16:9 frame on cards and the detail-page overview.
  // Full screenshots remain available separately in the project gallery.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={visual.src} alt={visual.alt} width={visual.width} height={visual.height} loading={eager ? "eager" : "lazy"} decoding="async" className={styles.image} />;
}
export function PortfolioCardView({ entry, eager = false }: { entry: PortfolioCard; eager?: boolean }) {
  const discipline = PORTFOLIO_CATEGORIES.find(c => c.id === entry.discipline)?.label;
  return <article className={styles.card} data-portfolio-card={entry.slug}>
    <Link href={entry.href} className={styles.cardLink}>
      <div className={styles.stage}>
        {entry.visual ? <PortfolioImage visual={entry.visual} eager={eager} /> : <div className={styles.missingVisual}>Project imagery has not been supplied.</div>}
      </div>
      <div className={styles.cardCaption}>
        <div><p className={styles.cardCategory}>{discipline ? <span className={styles.cardDiscipline}>{discipline}</span> : null}{discipline && entry.industry ? <span aria-hidden="true">/</span> : null}{entry.industry ? <span className={styles.cardIndustry} title={entry.industry}>{entry.industry}</span> : null}</p><h3>{entry.name}</h3></div>
        <div className={styles.cardDescription}><span className={styles.readAction}>{entry.preview ? "Explore design study" : "Explore project"}<PortfolioArrow /></span></div>
      </div>
      {entry.preview ? <p className={styles.cardStatus}>Design preview · Not client work</p> : null}
    </Link>
  </article>;
}
export function PortfolioIntroduction() {
  return <header className={styles.intro}>
    <div className={styles.rail}><div className={styles.introGrid}>
      <h1>Good ideas.<br />Made tangible.</h1>
      <div><p>A closer look at the products, interfaces and engineering behind the work.</p><div className={styles.introAction}><StartProjectButton label="Discuss your idea" source="case-studies-intro" /></div></div>
    </div></div>
  </header>;
}
export function PortfolioLibrary({ entries, category, query, preview }: { entries: PortfolioCard[]; category: string; query: string; preview: boolean }) {
  return <section id="work" aria-labelledby="portfolio-heading" className={styles.library}>
    <div className={styles.rail}>
      <div className={styles.libraryHeader}><h2 id="portfolio-heading">{preview ? "Explore the possibilities." : "Explore the work."}</h2><p>{entries.length} {entries.length === 1 ? "project" : "projects"}{preview ? " · Design previews" : ""}</p></div>
      {preview ? <details className={`${styles.previewNotice} ${styles.previewDisclosure}`}><summary>Design previews · Not client work.</summary><p>These four fictional design studies show the portfolio format with original interface illustrations. They are not Savo clients or delivered products. Published projects will replace this review collection.</p></details> : null}
      <div className={styles.tools}>
        <nav aria-label="Project categories" className={styles.categories}>{PORTFOLIO_CATEGORIES.map(c => <Link key={c.id} href={portfolioHref(c.id, query)} aria-current={category === c.id ? "page" : undefined}>{c.label}</Link>)}</nav>
        <form action="/case-studies" method="get" className={styles.search}>
          {category !== "all" ? <input type="hidden" name="category" value={category} /> : null}
          <label htmlFor="portfolio-search" className="sr-only">Search projects</label><input id="portfolio-search" name="q" defaultValue={query} maxLength={160} placeholder="Find a project" type="search" /><button type="submit" aria-label="Search projects"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 4.5 4.5" /></svg></button>
        </form>
      </div>
      {category !== "all" || query ? <p className={styles.filterSummary}>Showing {category === "all" ? "all categories" : PORTFOLIO_CATEGORIES.find(c => c.id === category)?.label}{query ? ` matching “${query}”` : ""}. <Link href="/case-studies#work">Clear filters</Link></p> : null}
      {entries.length ? <div className={styles.gallery} data-columns={entries.length > 2 ? "3" : "2"}>{entries.map((entry, i) => <PortfolioCardView key={entry.slug} entry={entry} eager={i < 3} />)}</div> : <div className={styles.empty}><h3>{category !== "all" || query ? "No matching projects." : "The work is taking shape."}</h3><p>{category !== "all" || query ? "Try a different category or clear the search to see the full collection." : "Client-approved project stories will appear here as they are published. In the meantime, explore our capabilities or tell us what you are planning."}</p><Link href={category !== "all" || query ? "/case-studies#work" : "/services"} className={styles.textLink}>{category !== "all" || query ? "View all projects" : "Explore our services"}<PortfolioArrow /></Link></div>}
    </div>
  </section>;
}
export function PortfolioPublicationNote() {
  return <section className={styles.publication} aria-labelledby="portfolio-publication"><div className={styles.rail}><div className={styles.publicationGrid}><h2 id="portfolio-publication">The story behind<br />the screen matters.</h2><div><p>A useful case study connects the product to the problem: what needed to change, the decisions behind it, and what can actually be demonstrated.</p><p>Client identities, project details and measured outcomes are shared only when approved for publication. Confidential work depends on the relevant agreement; it is not automatically available on request.</p><Link href="/contact" className={styles.textLink}>Ask about relevant work<PortfolioArrow /></Link></div></div></div></section>;
}
