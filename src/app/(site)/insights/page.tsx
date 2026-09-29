import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { absoluteUrl } from "@/lib/env";
import { Section } from "@/components/ui/section";
import { Reveal } from "@/components/ui/reveal";
import { DetailCta } from "@/components/shared/detail-cta";
import { getManagedArticles } from "@/lib/content-items";
import type { Article } from "@/constants/insights";

type Insight = Article;
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

/* ────────────────────────────────────────────────────────────────── */
/* Editorial card family: featured, side and standard cells of the   */
/* hairline library grid. Composition and type carry the design;     */
/* motion stays restrained (image 1.025, arrow 5px, title to accent). */
/* ────────────────────────────────────────────────────────────────── */

const Arrow = ({ className = "h-3 w-3" }: { className?: string }) => (
  <svg aria-hidden="true" viewBox="0 0 14 14" className={className} fill="none" stroke="currentColor" strokeWidth="1.6">
    <path d="M1 7h11M7.5 2.5 12 7l-4.5 4.5" />
  </svg>
);

function FeaturedCard({ article }: { article: Insight }) {
  return (
    <Link
      href={`/insights/${article.slug}`}
      className="group flex h-full flex-col bg-background transition-colors duration-300 focus-visible:bg-surface-2/40"
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        <Image
          src={withBasePath(article.image)}
          alt={`${article.title}: editorial illustration`}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 58vw"
          className="photo object-cover transition-transform duration-[600ms] ease-[var(--ease-out-expo)] group-hover:scale-[1.025]"
        />
      </div>
      <div className="flex flex-1 flex-col p-7 sm:p-9">
        <p className="t-label flex items-center gap-2.5 text-muted">
          <span aria-hidden="true" className="h-1.5 w-1.5 bg-accent" />
          Featured
          <span aria-hidden="true" className="text-muted/50">·</span>
          <span className="text-accent-strong">{article.cat}</span>
        </p>
        <h2 className="t-h2 mt-4 max-w-[24ch] leading-tight transition-colors duration-300 group-hover:text-accent">
          {article.title}
        </h2>
        <p className="t-body mt-4 line-clamp-3 max-w-[52ch] flex-1 text-muted">{article.excerpt}</p>
        <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
          <p className="t-caption text-muted">
            {article.date}
            <span className="mx-2 text-muted/50">·</span>
            {article.time}
          </p>
          <span className="t-label inline-flex items-center gap-2 text-muted transition-colors duration-300 group-hover:text-accent">
            Read
            <Arrow className="h-3.5 w-3.5 transition-transform duration-[400ms] ease-[var(--ease-out-expo)] group-hover:translate-x-[5px]" />
          </span>
        </div>
      </div>
    </Link>
  );
}

function SideCard({ article, delay }: { article: Insight; delay: number }) {
  return (
    <Reveal delay={delay} className="h-full">
      <Link
        href={`/insights/${article.slug}`}
        className="group flex h-full min-w-0 flex-col gap-0 bg-background transition-colors duration-300 focus-visible:bg-surface-2/40 sm:flex-row sm:items-stretch sm:gap-6 sm:p-6"
      >
        <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden sm:aspect-[4/3] sm:w-[38%]">
          <Image
            src={withBasePath(article.image)}
            alt={`${article.title}: editorial illustration`}
            fill
            sizes="(max-width: 640px) 42vw, 20vw"
            className="photo object-cover transition-transform duration-[600ms] ease-[var(--ease-out-expo)] group-hover:scale-[1.025]"
          />
        </div>
        <div className="flex min-w-0 flex-1 flex-col p-5 sm:py-0.5 sm:pl-0">
          <p className="t-label text-muted">
            <span className="text-accent-strong">{article.cat}</span>
            <span className="mx-2 text-muted/50">·</span>
            {article.time}
          </p>
          <h3 className="t-h4 mt-2.5 leading-snug transition-colors duration-300 group-hover:text-accent">
            {article.title}
          </h3>
          <p className="t-caption mt-2 line-clamp-2 flex-1 text-muted">{article.excerpt}</p>
          <p className="t-caption mt-3 inline-flex items-center gap-2 text-muted">
            {article.date}
            <Arrow className="h-3 w-3 text-accent transition-transform duration-[400ms] ease-[var(--ease-out-expo)] group-hover:translate-x-[5px]" />
          </p>
        </div>
      </Link>
    </Reveal>
  );
}

function InsightCard({ article, wide = false }: { article: Insight; wide?: boolean }) {
  return (
    <Link
      href={`/insights/${article.slug}`}
      className="group flex h-full flex-col bg-background transition-colors duration-300 focus-visible:bg-surface-2/40"
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        <Image
          src={withBasePath(article.image)}
          alt={`${article.title}: editorial illustration`}
          fill
          sizes={wide ? "(max-width: 640px) 100vw, 66vw" : "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"}
          className="photo object-cover transition-transform duration-[600ms] ease-[var(--ease-out-expo)] group-hover:scale-[1.025]"
        />
      </div>
      <div className="flex flex-1 flex-col p-6 sm:p-7">
        <p className="t-label text-muted">
          <span className="text-accent-strong">{article.cat}</span>
          <span className="mx-2 text-muted/50">·</span>
          {article.time}
        </p>
        <h3 className="t-h4 mt-3 leading-snug transition-colors duration-300 group-hover:text-accent">
          {article.title}
        </h3>
        <p className="t-sm mt-2.5 line-clamp-2 flex-1 text-muted">{article.excerpt}</p>
        <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
          <p className="t-caption text-muted">{article.date}</p>
          <Arrow className="h-3.5 w-3.5 text-muted transition-all duration-[400ms] ease-[var(--ease-out-expo)] group-hover:translate-x-[5px] group-hover:text-accent" />
        </div>
      </div>
    </Link>
  );
}

export default async function InsightsPage() {
  const ARTICLES = await getManagedArticles();
  const [first, second, third, ...others] = ARTICLES;
  const featured = first;
  const side = [second, third].filter(Boolean);
  const rest = others;
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
                <div className="lg:pl-6">
                  <p className="t-label text-muted">The index</p>
                  <ul className="mt-4 divide-y divide-border border-y border-border">
                    {(["AI", "Engineering", "Design", "Delivery"] as const).map((cat) => (
                      <li key={cat} className="flex items-center justify-between py-3">
                        <span className="t-sm font-semibold text-foreground/85">{cat}</span>
                        <span className="t-label tnum text-muted">
                          {String(ARTICLES.filter((a) => a.cat === cat).length).padStart(2, "0")} notes
                        </span>
                      </li>
                    ))}
                  </ul>
                  <p className="t-caption mt-4 text-muted">
                    {ARTICLES.length} notes in the library, newest first.
                  </p>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* The library: featured lead, editorial side column, refined grid */}
      <Section index="The Library" labelledBy="library-heading">
        <div className="grid grid-cols-1 gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-12">
          {/* Featured: newest note, the anchor of the page */}
          <Reveal className="lg:col-span-7 lg:row-span-2">
            <FeaturedCard article={featured} />
          </Reveal>
          {/* Two editorial side cards */}
          {side.map((article) => (
            <SideCard key={article.slug} article={article} delay={120} />
          ))}
          {/* The rest of the library */}
          {rest.map((article, i) => {
            const wide = rest.length % 3 === 2 && i === rest.length - 1;
            return (
              <Reveal
                key={article.slug}
                delay={(i % 3) * 60}
                className={wide ? "sm:col-span-2 lg:col-span-8" : ""}
              >
                <InsightCard article={article} wide={wide} />
              </Reveal>
            );
          })}
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
