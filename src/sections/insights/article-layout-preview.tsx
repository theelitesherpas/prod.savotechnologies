import "server-only";
import Link from "next/link";
import Image from "next/image";
import { withBasePath } from "@/lib/utils";
import { PREVIEW_ARTICLES, previewArticleHref, type PreviewArticle } from "./preview-articles";
import styles from "./insights.module.css";

export function articleLayoutPreviewEnabled(environment: string | undefined, publishedCount: number) {
  return environment === "development" && publishedCount === 0;
}

/** Real preview destinations, but never Article records or publication fallback data. */
export function SampleArticleCard({ article, featured = false }: { article: PreviewArticle; featured?: boolean }) {
  return <Link href={previewArticleHref(article.id)} className={featured ? styles.sampleFeature : styles.sampleCard} data-article-sample={article.id} aria-labelledby={`sample-${article.id}`}>
    <figure className={styles.sampleImage}><Image src={withBasePath(article.image)} alt={article.alt} fill sizes="(min-width: 1344px) 610px, (min-width: 700px) 46vw, calc(100vw - 40px)" /><figcaption>Editorial image</figcaption></figure>
    <div className={styles.sampleCopy}>
      <p className={styles.sampleMeta}><span>{article.category}</span><span>Preview · Not published</span></p>
      <h3 id={`sample-${article.id}`}>{article.title}</h3>
      <p className={styles.sampleExcerpt}>{article.excerpt}</p>
      <span className={styles.textLink}>Read article preview<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M5 19 19 5M5 5h14v14" /></svg></span>
    </div>
  </Link>;
}

/** Visible in the local empty-library preview, never on production or in other feeds. */
export function ArticleLayoutPreview() {
  if (!articleLayoutPreviewEnabled(process.env.NODE_ENV, 0)) return null;
  return <div data-article-layout-preview>
    <div className={styles.sampleNotice} role="note"><p><strong>Article layout preview.</strong> Five complete example articles, ready to explore. They are unpublished previews, not entries in the published library.</p><p>The topics mirror reading references in the industry dossiers. Images are editorial, not client work.</p></div>
    <SampleArticleCard article={PREVIEW_ARTICLES[0]} featured />
    <div className={styles.sampleGrid}>{PREVIEW_ARTICLES.slice(1).map(article => <SampleArticleCard key={article.id} article={article} />)}</div>
  </div>;
}
