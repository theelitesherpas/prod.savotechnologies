import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/env";
import { openGraphFor } from "@/lib/seo";
import { getManagedArticles } from "@/lib/content-items";
import { DetailCta } from "@/components/shared/detail-cta";
import { InsightsHero, ReadingLibrary } from "@/sections/insights/insights-sections";
import styles from "@/sections/insights/insights.module.css";
import { ArticleLayoutPreview, articleLayoutPreviewEnabled } from "@/sections/insights/article-layout-preview";

/**
 * THESIS: A focused editorial landing page where published articles are the main event.
 * OWN-WORLD: Savo black/white/red, Outfit/Inter; editorial imagery and open spacing.
 * STORY: Short introduction → searchable, topic-filtered eight-article pages → contact.
 * The thinking-guide section was removed at the user's request. Article order and
 * publication authority continue to come from active Published CMS records only.
 */
const DESCRIPTION = "Practical guidance on AI, software engineering, product design and delivery. Explore useful questions and published Insights from Savo Technologies.";
export const revalidate = 0;
export const metadata: Metadata = {
  title: "Insights", description: DESCRIPTION, alternates: { canonical: "/insights" },
  openGraph: openGraphFor({ title: "Insights | Savo Technologies", description: DESCRIPTION, url: "/insights" }),
};

export default async function InsightsPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const articles = await getManagedArticles();
  const search = await searchParams ?? {};
  const single = (key: string) => typeof search[key] === "string" ? search[key] as string : undefined;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "WebPage", "@id": absoluteUrl("/insights/#webpage"), url: absoluteUrl("/insights"), name: "Insights | Savo Technologies", description: DESCRIPTION, isPartOf: { "@id": absoluteUrl("/#website") } },
      { "@type": "BreadcrumbList", itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
        { "@type": "ListItem", position: 2, name: "Insights", item: absoluteUrl("/insights") },
      ] },
      ...(articles.length ? [{ "@type": "ItemList", name: "Published Insights", itemListElement: articles.map((a, i) => ({ "@type": "ListItem", position: i + 1, name: a.title, url: absoluteUrl(`/insights/${a.slug}`) })) }] : []),
    ],
  };
  return <div className={styles.page} data-insights-page="thinking-room">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    <InsightsHero />
    <ReadingLibrary articles={articles} params={{ topic: single("topic"), q: single("q"), page: single("page") }} emptyPreview={articleLayoutPreviewEnabled(process.env.NODE_ENV, articles.length) ? <ArticleLayoutPreview /> : undefined} />
    <DetailCta headingId="resources-cta-heading" heading="Put good thinking to work." lead="Bring us the question behind your product. Let’s work out a useful next step." location="resources-cta" secondaryLabel="Explore Services" secondaryHref="/services" />
  </div>;
}
