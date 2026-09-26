import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { absoluteUrl } from "@/lib/env";
import { Section } from "@/components/ui/section";
import { Reveal } from "@/components/ui/reveal";
import { DetailCta } from "@/components/shared/detail-cta";
import { getManagedArticles } from "@/lib/content-items";
import { withBasePath } from "@/lib/utils";
import { openGraphFor } from "@/lib/seo";

/**
 * Insights - the editorial index. Article cards as a hairline image
 * grid; each opens the full reading page.
 */

const DESCRIPTION = `Insights from Savo Technologies on engineering, AI, design and delivery. Field notes on shipping production AI agents, performance budgets, accessibility loops and honest estimation.`;

export const metadata: Metadata = {
  title: "Insights",
  description: DESCRIPTION,
  alternates: { canonical: "/insights" },
  openGraph: openGraphFor({ title: "Insights | Savo Technologies", description: DESCRIPTION, url: "/insights" }),
};

const CATS = ["AI", "Engineering", "Design", "Delivery"] as const;

export default async function InsightsPage() {
  const ARTICLES = await getManagedArticles();
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": absoluteUrl("/insights/#webpage"),
        url: absoluteUrl("/insights"),
        name: "Insights | Savo Technologies",
        description: DESCRIPTION,
        isPartOf: { "@id": absoluteUrl("/#website") },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
          { "@type": "ListItem", position: 2, name: "Insights", item: absoluteUrl("/insights") },
        ],
      },
      {
        "@type": "ItemList",
        name: "Insights",
        itemListElement: ARTICLES.map((a, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: a.title,
          url: absoluteUrl(`/insights/${a.slug}`),
        })),
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Hero */}
      <section aria-labelledby="insights-heading" className="relative overflow-hidden">
        <div className="shell pb-16 pt-[calc(var(--nav-h)+4.5rem)] sm:pb-20">
          <div aria-hidden="true" className="mb-12 flex items-center gap-4 sm:mb-14">
            <span className="h-2 w-2 shrink-0 bg-accent" />
            <span className="t-label text-muted">Insights</span>
            <span className="h-px flex-1 bg-border" />
          </div>
          <div className="grid items-end gap-12 lg:grid-cols-12 lg:gap-10">
            <div className="lg:col-span-7">
              <Reveal>
                <h1 id="insights-heading" className="t-statement max-w-[15ch]">
                  Field notes from the build
                  <span aria-hidden="true" className="text-accent">.</span>
                </h1>
              </Reveal>
              <Reveal delay={120}>
                <p className="t-body-lg mt-8 max-w-xl text-muted">
                  What we learn shipping products, written down while it is
                  fresh. No listicles, no hype: the practices that survived
                  production and the ones we retired.
                </p>
              </Reveal>
            </div>
            <div className="lg:col-span-5">
              <Reveal delay={200}>
                <div className="flex flex-wrap gap-2">
                  {CATS.map((cat) => (
                    <span key={cat} className="t-label rounded-[2px] border border-border bg-surface px-3.5 py-2.5 text-muted">
                      {cat}
                    </span>
                  ))}
                </div>
                <p className="t-caption mt-4 text-muted">
                  Written by the people who build: {ARTICLES.length} notes and counting.
                </p>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* Article grid */}
      <Section index="The Library" labelledBy="library-heading">
        <div className="grid gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {ARTICLES.map((article, i) => (
            <Reveal key={article.slug} delay={i * 60} className="h-full">
              <Link
                href={`/insights/${article.slug}`}
                className="group flex h-full flex-col bg-background transition-colors duration-300 ease-[var(--ease-out-expo)] hover:bg-foreground focus-visible:bg-foreground"
              >
                <div className="relative aspect-[16/10] overflow-hidden">
                  <Image
                    src={withBasePath(article.image)}
                    alt={`${article.title}: editorial illustration`}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="photo object-cover transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:scale-[1.03]"
                  />
                  <span className="t-label absolute left-4 top-4 bg-background px-2.5 py-1.5 text-foreground">
                    {article.cat}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-6 sm:p-7">
                  <p className="t-label text-muted transition-colors duration-300 group-hover:text-background/70">
                    {article.date}
                    <span className="mx-2 text-muted/60 group-hover:text-background/50">·</span>
                    {article.time}
                  </p>
                  <h2 className="t-h4 mt-3 leading-snug transition-colors duration-300 group-hover:text-background">
                    {article.title}
                  </h2>
                  <p className="t-sm mt-3 flex-1 text-muted transition-colors duration-300 group-hover:text-background/75">
                    {article.excerpt}
                  </p>
                  <span className="t-label mt-5 inline-flex items-center gap-2 text-accent">
                    Read the note
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 14 14"
                      className="h-3.5 w-3.5 transition-transform duration-300 ease-[var(--ease-out-expo)] group-hover:translate-x-[4px]"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                    >
                      <path d="M1 7h11M7.5 2.5 12 7l-4.5 4.5" />
                    </svg>
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </Section>

      <DetailCta
        headingId="resources-cta-heading"
        heading="Want this thinking applied to your product?"
        lead="The notes come from real engagements. Bring your brief, the next field note might be about your build."
        location="resources-cta"
        secondaryLabel="Explore Services"
        secondaryHref="/services"
      />
    </>
  );
}
