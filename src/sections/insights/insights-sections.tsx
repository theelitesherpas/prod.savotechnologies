import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Article } from "@/constants/insights";
import { withBasePath } from "@/lib/utils";
import { INSIGHT_TOPICS, paginationItems, readingHref, selectReading, type ArticlePreview } from "./insights-content";
import styles from "./insights.module.css";

export function InsightArrow({ diagonal = false }: { diagonal?: boolean }) {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d={diagonal ? "M5 19 19 5M5 5h14v14" : "M4 12h16M13 5l7 7-7 7"} /></svg>;
}
export function InsightsHero() {
  return <section className={styles.hero} aria-labelledby="insights-heading">
    <div className={styles.rail}>
      <div className={styles.heroGrid}>
        <div className={styles.heroCopy}>
          <h1 id="insights-heading">Good questions.<br />Better products<span className={styles.red}>.</span></h1>
          <p>Ideas and practical guidance for the decisions behind digital products. Explore AI, engineering, design and delivery - without the hype.</p>
          <a href="#reading" className={styles.primary}>Explore articles<InsightArrow /></a>
        </div>
        <figure className={styles.heroFigure}>
          <div className={styles.heroImage}>
            <Image src={withBasePath("/images/insights/reading-desk.webp")} alt="A drawing tablet beside an open book of visual references" fill preload sizes="(min-width: 1344px) 600px, (min-width: 900px) 46vw, calc(100vw - 40px)" />
            <a className={styles.imageMark} href="#reading" aria-label="Look closer: browse the articles"><span>Look</span><span>closer.</span><svg aria-hidden="true" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 54 54 10M10 10h44v44" /></svg></a>
          </div>
          <figcaption>Editorial photography · a different perspective starts with curiosity.</figcaption>
        </figure>
      </div>
      <div className={styles.heroFoot}><span>Thinking before building.</span><span>AI / Engineering / Design / Delivery</span></div>
    </div>
  </section>;
}


export function ArticleMeta({ article }: { article: ArticlePreview }) {
  return <p className={styles.articleMeta}><span>{article.cat}</span></p>;
}
export function ReadingRow({ article, card = false }: { article: ArticlePreview; card?: boolean }) {
  return <Link href={`/insights/${article.slug}`} className={card ? styles.readingCard : styles.readingRow}><div className={styles.rowImage}><Image src={withBasePath(article.image)} alt="" fill sizes={card ? "(min-width: 1200px) 290px, (min-width: 700px) 46vw, calc(100vw - 40px)" : "(max-width: 600px) 88px, 160px"} /></div><div><ArticleMeta article={article} /><h3>{article.title}</h3><p>{article.excerpt}</p>{card && <span className={styles.textLink}>Read the article<InsightArrow diagonal /></span>}</div>{!card && <InsightArrow diagonal />}</Link>;
}

export function ReadingLibrary({ articles, params, emptyPreview }: { articles: Article[]; params: { topic?: string; q?: string; page?: string }; emptyPreview?: ReactNode }) {
  const selection = selectReading(articles, params);
  return <section id="reading" aria-labelledby="reading-heading" className={styles.library}><div className={styles.rail}>
    <div className={styles.sectionHead}><h2 id="reading-heading">Explore the articles.</h2><p>Browse by topic or search for a question.</p></div>
    {articles.length === 0 ? emptyPreview ?? <div className={styles.emptyLibrary}><div><h3>No published articles yet.</h3><p>Published Insights will appear here. For a question about your product, let’s talk it through.</p></div><Link href="/contact" className={styles.textLink}>Ask us a question<InsightArrow diagonal /></Link></div> : <>
      <div className={styles.libraryTools}>
        <nav className={styles.libraryTopics} aria-label="Filter published articles">{["All", ...INSIGHT_TOPICS].map(cat => <Link key={cat} href={readingHref(cat, selection.query)} aria-current={selection.topic === cat ? "page" : undefined}>{cat === "All" ? "All topics" : cat}</Link>)}</nav>
        <form action={withBasePath("/insights#reading")} method="get" role="search" className={styles.search}>
          <label htmlFor="insights-search" className={styles.srOnly}>Search article titles and summaries</label>
          {selection.topic !== "All" && <input type="hidden" name="topic" value={selection.topic} />}
          <input type="search" id="insights-search" name="q" defaultValue={selection.query} maxLength={160} placeholder="Search the library" />
          <button type="submit" aria-label="Search articles"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="10" cy="10" r="6" /><path d="m15 15 6 6" /></svg></button>
        </form>
      </div>
      <p className={styles.results}>{selection.total} {selection.total === 1 ? "article" : "articles"}{selection.query ? ` matching “${selection.query}”` : selection.topic !== "All" ? ` in ${selection.topic}` : ""}{selection.pages > 1 ? ` · Page ${selection.page} of ${selection.pages}` : ""}</p>
      {selection.articles.length > 0 ? <div className={styles.readingCards} data-count={selection.articles.length}>{selection.articles.map(article => <ReadingRow key={article.slug} article={article} card />)}</div> : <div className={styles.emptyLibrary}><div><h3>No articles match this selection.</h3><p>Try a different search or return to all topics.</p></div><Link href={readingHref()} className={styles.textLink}>Clear filters<InsightArrow /></Link></div>}
      {selection.pages > 1 && <nav className={styles.pagination} aria-label="Reading library pages">
        {selection.page > 1 ? <Link className={styles.paginationPrevious} href={readingHref(selection.topic, selection.query, selection.page - 1)}><InsightArrow />Previous</Link> : <span className={styles.paginationPrevious} aria-disabled="true"><InsightArrow />Previous</span>}
        <div className={styles.paginationNumbers} aria-label="Choose a page">{paginationItems(selection.page, selection.pages).map((item, index) => item === "ellipsis" ? <span key={`ellipsis-${index}`} aria-hidden="true">…</span> : item === selection.page ? <span key={item} aria-current="page">{item}</span> : <Link key={item} href={readingHref(selection.topic, selection.query, item)} aria-label={`Page ${item}`}>{item}</Link>)}</div>
        {selection.page < selection.pages ? <Link className={styles.paginationNext} href={readingHref(selection.topic, selection.query, selection.page + 1)}>Next<InsightArrow /></Link> : <span className={styles.paginationNext} aria-disabled="true">Next<InsightArrow /></span>}
      </nav>}
    </>}
  </div></section>;
}
