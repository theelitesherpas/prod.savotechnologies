import type { Metadata } from "next";
import Link from "next/link";
import { absoluteUrl } from "@/lib/env";
import { Section } from "@/components/ui/section";
import { Reveal } from "@/components/ui/reveal";
import { DetailCta } from "@/components/shared/detail-cta";
import { ARTICLES } from "@/constants/resources";
import { openGraphFor } from "@/lib/seo";

/**
 * Resources & Insights — the editorial index. Article cards in the
 * hairline grid grammar; each opens the full reading page.
 */

const DESCRIPTION = `Insights from Savo Technologies — engineering, AI, design and delivery. Field notes on shipping production AI agents, performance budgets, accessibility loops and honest estimation.`;

export const metadata: Metadata = {
  title: "Resources & Insights",
  description: DESCRIPTION,
  alternates: { canonical: "/resources" },
  openGraph: openGraphFor({ title: "Resources & Insights | SAVO Technologies", description: DESCRIPTION, url: "/resources" }),
};

const CATS = ["AI", "Engineering", "Design", "Delivery"] as const;

export default function ResourcesPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": absoluteUrl("/resources/#webpage"),
        url: absoluteUrl("/resources"),
        name: "Resources & Insights | SAVO Technologies",
        description: DESCRIPTION,
        isPartOf: { "@id": absoluteUrl("/#website") },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
          { "@type": "ListItem", position: 2, name: "Resources", item: absoluteUrl("/resources") },
        ],
      },
      {
        "@type": "ItemList",
        name: "Insights",
        itemListElement: ARTICLES.map((a, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: a.title,
          url: absoluteUrl(`/resources/${a.slug}`),
        })),
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Hero */}
      <section aria-labelledby="resources-heading" className="relative overflow-hidden">
        <div className="shell pb-16 pt-[calc(var(--nav-h)+4.5rem)] sm:pb-20">
          <div aria-hidden="true" className="mb-12 flex items-center gap-4 sm:mb-14">
            <span className="h-2 w-2 shrink-0 bg-accent" />
            <span className="t-label text-muted">Resources &amp; Insights</span>
            <span className="h-px flex-1 bg-border" />
          </div>
          <div className="grid items-end gap-12 lg:grid-cols-12 lg:gap-10">
            <div className="lg:col-span-7">
              <Reveal>
                <h1 id="resources-heading" className="t-statement max-w-[15ch]">
                  Field notes from the build
                  <span aria-hidden="true" className="text-accent">.</span>
                </h1>
              </Reveal>
              <Reveal delay={120}>
                <p className="t-body-lg mt-8 max-w-xl text-muted">
                  What we learn shipping products — written down while it is
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
                  Written by the people who build — {ARTICLES.length} notes and counting.
                </p>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* Article directory */}
      <Section index="The Library" labelledBy="library-heading">
        <Reveal>
          <ul className="border-t border-border">
            {ARTICLES.map((article) => (
              <li key={article.slug}>
                <Link
                  href={`/resources/${article.slug}`}
                  className="group grid gap-4 border-b border-border px-2 py-8 transition-colors duration-300 ease-[var(--ease-out-expo)] hover:bg-foreground focus-visible:bg-foreground sm:grid-cols-12 sm:gap-8 sm:px-4"
                >
                  <div className="sm:col-span-8">
                    <p className="t-label text-accent transition-colors duration-300 group-hover:text-background/80">
                      {article.cat}
                      <span className="mx-2.5 text-muted/70 group-hover:text-background/60">·</span>
                      <span className="text-muted group-hover:text-background/70">{article.date}</span>
                    </p>
                    <h2 className="t-h3 mt-3 transition-colors duration-300 group-hover:text-background">
                      {article.title}
                    </h2>
                    <p className="t-body mt-3 max-w-xl text-muted transition-colors duration-300 group-hover:text-background/75">
                      {article.excerpt}
                    </p>
                  </div>
                  <div className="flex items-end justify-between gap-4 sm:col-span-4 sm:flex-col sm:items-end sm:justify-center">
                    <span className="t-label text-muted transition-colors duration-300 group-hover:text-background/70">
                      {article.time}
                    </span>
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 14 14"
                      className="h-4 w-4 text-muted transition-all duration-300 ease-[var(--ease-out-expo)] group-hover:translate-x-[4px] group-hover:text-background"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                    >
                      <path d="M1 7h11M7.5 2.5 12 7l-4.5 4.5" />
                    </svg>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </Reveal>
      </Section>

      <DetailCta
        headingId="resources-cta-heading"
        heading="Want this thinking applied to your product?"
        lead="The notes come from real engagements. Bring your brief — the next field note might be about your build."
        location="resources-cta"
        secondaryLabel="Explore Services"
        secondaryHref="/services"
      />
    </>
  );
}
