import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { absoluteUrl } from "@/lib/env";
import { openGraphFor } from "@/lib/seo";
import { getManagedArticle, getManagedArticles } from "@/lib/content-items";
import { withBasePath } from "@/lib/utils";
import { DetailCta } from "@/components/shared/detail-cta";
import { ArticleMeta, ReadingRow, InsightArrow } from "@/sections/insights/insights-sections";
import { articlePreview } from "@/sections/insights/insights-content";
import { addInsightHeadingIds, sanitizeInsightRichHtml } from "@/lib/insight-rich-text";
import styles from "@/sections/insights/insights.module.css";

/** Aligned editorial reading page for actual Published articles only; no seed routes or inferred authors. */
export const revalidate = 0;
export async function generateStaticParams() {
  return (await getManagedArticles()).map(a => ({ slug: a.slug }));
}
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = await getManagedArticle(slug);
  if (!article) return { title: "Article not found", robots: { index: false, follow: false } };
  return {
    title: article.title, description: article.excerpt, alternates: { canonical: `/insights/${article.slug}` },
    openGraph: { ...openGraphFor({ title: `${article.title} | Savo Technologies`, description: article.excerpt, url: `/insights/${article.slug}` }), images: [{ url: withBasePath(article.image), alt: `${article.title} | Savo Technologies` }], type: "article", ...(article.date ? { publishedTime: article.date } : {}) },
  };
}
export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const all = await getManagedArticles(), article = all.find(a => a.slug === slug);
  if (!article) notFound();
  const bodyRender = article.body.reduce<{
    headings: { title: string; id: string }[];
    elements: ReactNode[];
  }>((state, block, i) => {
    if (block.html) {
      const safeHtml = sanitizeInsightRichHtml(block.html);
      const anchored = addInsightHeadingIds(safeHtml, 0, `article-section-rich-${i}-`);
      return {
        headings: [...state.headings, ...anchored.headings],
        elements: [...state.elements, <div className={styles.richBlock} key={i} dangerouslySetInnerHTML={{ __html: anchored.html }} />],
      };
    }
    if (block.h) {
      const id = `article-section-${i}`;
      return {
        headings: [...state.headings, { title: block.h, id }],
        elements: [...state.elements, <h2 id={id} key={i}>{block.h}</h2>],
      };
    }
    const element = block.li
      ? <ul key={i}>{block.li.map((item, j) => <li key={j}>{item}</li>)}</ul>
      : <p key={i}>{block.p}</p>;
    return { ...state, elements: [...state.elements, element] };
  }, { headings: [], elements: [] });
  const headings = bodyRender.headings;
  const renderedBody = bodyRender.elements;
  const others = all.filter(a => a.slug !== slug).slice(0, 2);
  const jsonLd = {
    "@context": "https://schema.org", "@graph": [
      { "@type": "Article", headline: article.title, description: article.excerpt, ...(article.date ? { datePublished: article.date } : {}), url: absoluteUrl(`/insights/${article.slug}`), ...(article.authorName ? { author: { "@type": "Person", name: article.authorName } } : {}), publisher: { "@id": absoluteUrl("/#organization") } },
      { "@type": "BreadcrumbList", itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
        { "@type": "ListItem", position: 2, name: "Insights", item: absoluteUrl("/insights") },
        { "@type": "ListItem", position: 3, name: article.title, item: absoluteUrl(`/insights/${article.slug}`) },
      ] },
    ],
  };
  return <div className={styles.page} data-insights-page="article">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    <article>
      <header className={`${styles.rail} ${styles.articleHeader}`}>
        <Link href="/insights#reading" className={styles.backLink}><InsightArrow />Back to Insights</Link>
        <h1>{article.title}</h1><p className={styles.articleLead}>{article.excerpt}</p>
        <ArticleMeta article={articlePreview(article)} />{article.authorName && <p className={styles.articleMeta}>By {article.authorName}</p>}
      </header>
      <div className={`${styles.rail} ${styles.articleCoverRail}`}><figure className={styles.articleFigure}><div className={styles.articlePhoto}><Image src={withBasePath(article.image)} alt={article.imageAlt || `${article.title}: editorial image`} fill preload sizes="(min-width: 1152px) 1088px, calc(100vw - 40px)" /></div><figcaption>Editorial image</figcaption></figure></div>
      <div className={`${styles.rail} ${styles.readingBody}`}>
        <nav className={styles.contents} aria-label="Article contents">{headings.length ? <><p>In this article</p><ol>{headings.map(h => <li key={h.id}><a href={`#${h.id}`}>{h.title}</a></li>)}</ol></> : <Link href="/insights#reading" className={styles.textLink}>Browse all articles<InsightArrow /></Link>}</nav>
        <div className={styles.prose}>{renderedBody}</div>
      </div>
    </article>
    {others.length > 0 && <section className={styles.related} aria-labelledby="related-reading-heading"><div className={styles.rail}><div className={styles.sectionHead}><h2 id="related-reading-heading">More Insights.</h2><Link href="/insights#reading" className={styles.textLink}>All Insights<InsightArrow /></Link></div>{others.map(a => <ReadingRow key={a.slug} article={articlePreview(a)} />)}</div></section>}
    <DetailCta headingId="article-cta-heading" heading="Take the idea further." lead="Have a question about applying this to your product? Let’s talk through the context." location={`article-${article.slug}-cta`} />
  </div>;
}
