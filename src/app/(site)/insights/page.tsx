import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { absoluteUrl } from "@/lib/env";
import { Section } from "@/components/ui/section";
import { Reveal } from "@/components/ui/reveal";
import { DetailCta } from "@/components/shared/detail-cta";
import { getManagedArticles } from "@/lib/content-items";
import type { Article } from "@/constants/insights";
import { withBasePath } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { openGraphFor } from "@/lib/seo";

/**
 * Insights — the field-notes library. One quiet system: hero statement,
 * a restrained category row, then a perfectly balanced grid (3×2 desktop,
 * 2×3 tablet, 1-column feed on mobile). Every card is the same object —
 * same image ratio, same type scale, same aligned footer — so the page
 * reads as one designed system rather than six individual cards.
 */

const DESCRIPTION = `Insights from Savo Technologies on engineering, AI, design and delivery. Field notes on shipping production AI agents, performance budgets, accessibility loops and honest estimation.`;

export const metadata: Metadata = {
  title: "Insights",
  description: DESCRIPTION,
  alternates: { canonical: "/insights" },
  openGraph: openGraphFor({ title: "Insights | Savo Technologies", description: DESCRIPTION, url: "/insights" }),
};

const CATS = ["AI", "Engineering", "Design", "Delivery"] as const;
type Cat = (typeof CATS)[number];

/* ────────────────────────────────────────────────────────────────── */
/* The card — one component, six instances, zero variation.           */
/* ────────────────────────────────────────────────────────────────── */

function InsightCard({ article, featured }: { article: Article; featured?: boolean }) {
  return (
    <article className="h-full">
      <Link
        href={`/insights/${article.slug}`}
        className="group flex h-full flex-col focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-4"
      >
        <div className="relative aspect-[16/10] overflow-hidden">
          <Image
            src={withBasePath(article.image)}
            alt={`${article.title}: editorial illustration`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="photo object-cover transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:scale-[1.02]"
          />
        </div>
        <div className="flex flex-1 flex-col pt-5">
          <p className="t-label flex items-baseline justify-between gap-4 text-muted">
            <span>
              {featured ? (
                <>
                  <span className="text-accent-strong">Featured</span>
                  <span className="mx-2 text-muted/50" aria-hidden="true">·</span>
                </>
              ) : null}
              <span className={featured ? "" : "text-accent-strong"}>{article.cat}</span>
            </span>
            <span>{article.time}</span>
          </p>
          <h3 className="t-h3 mt-3 line-clamp-3 leading-snug transition-colors duration-300 group-hover:text-accent">
            {article.title}
          </h3>
          <p className="t-sm mt-2.5 line-clamp-3 flex-1 text-muted">{article.excerpt}</p>
          <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
            <time className="t-caption text-muted">{article.date}</time>
            <svg
              aria-hidden="true"
              viewBox="0 0 14 14"
              className="h-3.5 w-3.5 text-muted transition-all duration-500 ease-[var(--ease-out-expo)] group-hover:translate-x-1 group-hover:text-accent"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
            >
              <path d="M1 7h11M7.5 2.5 12 7l-4.5 4.5" />
            </svg>
          </div>
        </div>
      </Link>
    </article>
  );
}

/* ────────────────────────────────────────────────────────────────── */
/* Page                                                               */
/* ────────────────────────────────────────────────────────────────── */

export default async function InsightsPage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string }>;
}) {
  const sp = await searchParams;
  const activeCat: Cat | undefined = (CATS as readonly string[]).includes(sp.cat ?? "")
    ? (sp.cat as Cat)
    : undefined;

  const ARTICLES = await getManagedArticles();
  const visible = activeCat ? ARTICLES.filter((a) => a.cat === activeCat) : ARTICLES;

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

      {/* ── Hero: one dominant heading, then a quiet category row ── */}
      <section aria-labelledby="insights-heading" className="relative overflow-hidden">
        <div className="shell pb-14 pt-[calc(var(--nav-h)+4.5rem)] sm:pb-16">
          <div aria-hidden="true" className="mb-10 flex items-center gap-4 sm:mb-12">
            <span className="h-2 w-2 shrink-0 bg-accent" />
            <span className="t-label text-muted">Insights</span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <Reveal>
            <h1 id="insights-heading" className="t-statement max-w-[15ch]">
              Field notes from the build
              <span aria-hidden="true" className="text-accent">.</span>
            </h1>
          </Reveal>
          <Reveal delay={120}>
            <p className="t-body-lg mt-8 max-w-xl text-muted">
              What we learn shipping products, written down while it is fresh.
              No listicles, no hype: the practices that survived production
              and the ones we retired.
            </p>
          </Reveal>

          {/* Category row — a quiet control layer, not a section */}
          <Reveal delay={200}>
            <nav aria-label="Filter notes by category" className="mt-12 border-y border-border">
              <ul className="flex flex-wrap items-center gap-x-8 gap-y-2 py-3.5">
                {[undefined, ...CATS].map((cat) => {
                  const active = activeCat === cat;
                  const count = cat ? ARTICLES.filter((a) => a.cat === cat).length : ARTICLES.length;
                  return (
                    <li key={cat ?? "all"}>
                      <Link
                        href={cat ? `/insights?cat=${encodeURIComponent(cat)}` : "/insights"}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "t-label flex items-baseline gap-2 transition-colors duration-300",
                          active ? "text-accent-strong" : "text-muted hover:text-foreground",
                        )}
                      >
                        {cat ?? "All"}
                        <span className="tnum text-muted/60">{String(count).padStart(2, "0")}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </Reveal>
        </div>
      </section>

      {/* ── The library: one balanced grid, every card the same object ── */}
      <Section labelledBy="library-heading" className="!pt-4 sm:!pt-6">
        <div className="mb-10 flex items-baseline justify-between gap-6 sm:mb-12">
          <h2 id="library-heading" className="t-label text-muted">The Library</h2>
          <p className="t-caption tnum text-muted">
            {String(visible.length).padStart(2, "0")} notes · newest first
          </p>
        </div>

        <div className="grid grid-cols-1 gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((article, i) => (
            <Reveal key={article.slug} delay={(i % 3) * 70} className="h-full">
              <InsightCard article={article} featured={i === 0 && !activeCat} />
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
