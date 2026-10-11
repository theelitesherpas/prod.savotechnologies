import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { withBasePath } from "@/lib/utils";
import { DetailCta } from "@/components/shared/detail-cta";
import { InsightArrow } from "@/sections/insights/insights-sections";
import { SampleArticleCard } from "@/sections/insights/article-layout-preview";
import { PrintPreviewButton } from "@/sections/insights/print-preview-button";
import { PREVIEW_ARTICLES, findPreviewArticle, previewArticleHref, previewReadingStats } from "@/sections/insights/preview-articles";
import styles from "@/sections/insights/insights.module.css";

/** Local review pages only: no Article schema, publication feed or production routes. */
export const revalidate = 0;
export function generateStaticParams() { return []; }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params, article = findPreviewArticle(slug);
  return article ? { title: `Article preview: ${article.title}`, description: `Unpublished editorial preview. ${article.excerpt}`, robots: { index: false, follow: false }, alternates: { canonical: previewArticleHref(article.id) } } : { title: "Preview not found", robots: { index: false, follow: false } };
}

export default async function PreviewArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params, article = findPreviewArticle(slug);
  if (!article) notFound();
  const stats = previewReadingStats(article);
  const contents = [{ id: "introduction", title: "Introduction" }, ...article.sections.map(s => ({ id: s.id, title: s.title })), { id: "key-takeaways", title: "Key takeaways" }, { id: "further-reading", title: "Further reading" }];
  const related = article.related.flatMap(id => { const found = PREVIEW_ARTICLES.find(a => a.id === id); return found ? [found] : []; });
  return <div className={styles.page} data-insights-page="article-preview">
    <article>
      <header className={`${styles.rail} ${styles.articleHeader}`} data-preview-article-header>
        <Link href="/insights#reading" className={styles.backLink}><InsightArrow />Back to Insights</Link>
        <div className={styles.previewStatus} role="note">Unpublished article preview · Prepared for content and layout review, not a published Savo article.</div>
        <h1>{article.title}</h1><p className={styles.articleLead}>{article.excerpt}</p>
        <div className={styles.previewByline}><p>{article.category}<span>{stats.words} words</span></p><PrintPreviewButton /></div>
        <dl className={styles.previewFacts}><div><dt>Status</dt><dd>Editorial preview</dd></div><div><dt>Author</dt><dd>Awaiting editorial assignment</dd></div><div><dt>Publication date</dt><dd>Not published</dd></div></dl>
      </header>
      <div className={styles.rail}><figure className={styles.articleFigure}><div className={styles.articlePhoto}><Image src={withBasePath(article.image)} alt={article.alt} fill preload sizes="(min-width: 1344px) 1280px, calc(100vw - 40px)" /></div><figcaption>Editorial image · not a Savo client project or a photograph of Savo staff.</figcaption></figure></div>
      <div className={`${styles.rail} ${styles.readingBody}`}>
        <nav className={styles.contents} aria-label="Article contents"><p>In this article</p><ol>{contents.map(item => <li key={item.id}><Link href={`#${item.id}`}>{item.title}</Link></li>)}</ol></nav>
        <div className={styles.prose}>
          <h2 id="introduction">Introduction</h2>{article.introduction.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
          {article.sections.map(section => <section key={section.id} aria-labelledby={section.id}>
            <h2 id={section.id}>{section.title}</h2>{section.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
            {section.points && <ul>{section.points.map(point => <li key={point}>{point}</li>)}</ul>}
            {section.comparison && <div className={styles.previewTable} role="region" aria-label={`${section.title}: comparison`} tabIndex={0}><table><caption>Comparing the approaches</caption><thead><tr>{section.comparison.headings.map(heading => <th scope="col" key={heading}>{heading}</th>)}</tr></thead><tbody>{section.comparison.rows.map(row => <tr key={row[0]}>{row.map((cell, i) => i === 0 ? <th scope="row" key={i}>{cell}</th> : <td key={i}>{cell}</td>)}</tr>)}</tbody></table></div>}
            {section.example && <aside className={styles.previewExample}><h3>{section.example.title}</h3><p>{section.example.text}</p><ul>{section.example.points.map(point => <li key={point}>{point}</li>)}</ul></aside>}
          </section>)}
          <section aria-labelledby="key-takeaways"><h2 id="key-takeaways">Key takeaways</h2><ul>{article.takeaways.map(point => <li key={point}>{point}</li>)}</ul></section>
          <section aria-labelledby="further-reading"><h2 id="further-reading">Further reading</h2><p>Useful documentation and related guidance. External links are for further study, not endorsements or evidence of a Savo engagement.</p><ul className={styles.previewReferences}>{article.references.map(reference => <li key={reference.href}><a href={reference.href} {...(reference.href.startsWith("https:") ? { target: "_blank", rel: "noopener noreferrer" } : {})}>{reference.label}<InsightArrow diagonal /></a></li>)}</ul></section>
          <p className={styles.previewEndnote}>This preview provides general educational guidance. Project-specific architecture, accessibility, security and commercial decisions need their own context and review.</p>
        </div>
      </div>
    </article>
    <section className={styles.related} aria-labelledby="preview-related-heading"><div className={styles.rail}><div className={styles.sectionHead}><h2 id="preview-related-heading">Keep the thinking going.</h2><Link href="/insights#reading" className={styles.textLink}>All article previews<InsightArrow /></Link></div><div className={styles.sampleGrid}>{related.map(other => <SampleArticleCard key={other.id} article={other} />)}</div></div></section>
    <DetailCta headingId="article-preview-cta-heading" heading="Take the idea further." lead="Have a question about applying this to your product? Let’s talk through the context." location={`article-preview-${article.id}-cta`} />
  </div>;
}
