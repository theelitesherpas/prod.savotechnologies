import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { absoluteUrl } from "@/lib/env";
import { openGraphFor } from "@/lib/seo";
import { Reveal } from "@/components/ui/reveal";
import { DetailCta } from "@/components/shared/detail-cta";
import { ARTICLES } from "@/constants/insights";
import { getManagedArticles } from "@/lib/content-items";
import { withBasePath } from "@/lib/utils";

/**
 * The reading page — one article, set in the document's reading style:
 * serif display title, measured measure, hairline rhythm.
 */

export function generateStaticParams() {
  return ARTICLES.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = (await getManagedArticles()).find((a) => a.slug === slug);
  if (!article) return {};
  return {
    title: article.title,
    description: article.excerpt,
    alternates: { canonical: `/insights/${article.slug}` },
    openGraph: {
      ...openGraphFor({
        title: `${article.title} | Savo Technologies`,
        description: article.excerpt,
        url: `/insights/${article.slug}`,
        images: [{ url: withBasePath(article.image), width: 1200, height: 750 }],
      }),
      type: "article",
    },
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const all = await getManagedArticles();
  const article = all.find((a) => a.slug === slug);
  if (!article) notFound();

  const others = all.filter((a) => a.slug !== slug).slice(0, 2);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: article.title,
        description: article.excerpt,
        datePublished: article.date,
        url: absoluteUrl(`/insights/${article.slug}`),
        author: { "@id": absoluteUrl("/#organization") },
        publisher: { "@id": absoluteUrl("/#organization") },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
          { "@type": "ListItem", position: 2, name: "Insights", item: absoluteUrl("/insights") },
          { "@type": "ListItem", position: 3, name: article.title, item: absoluteUrl(`/insights/${article.slug}`) },
        ],
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <article className="relative overflow-hidden">
        {/* Header */}
        <header className="shell pb-14 pt-[calc(var(--nav-h)+4.5rem)] sm:pb-16">
          <div aria-hidden="true" className="mb-12 flex items-center gap-4">
            <span className="h-2 w-2 shrink-0 bg-accent" />
            <span className="t-label text-muted">
              <Link href="/insights" className="transition-colors hover:text-foreground">Insights</Link>
              <span className="mx-2.5 text-muted/60">·</span>
              {article.cat}
            </span>
            <span className="h-px flex-1 bg-border" />
          </div>
          <div className="max-w-3xl">
            <Reveal>
              <h1 className="t-dl">{article.title}</h1>
            </Reveal>
            <Reveal delay={120}>
              <p className="t-body-lg mt-6 text-muted">{article.excerpt}</p>
            </Reveal>
            <Reveal delay={200}>
              <p className="t-label mt-8 text-muted">
                {article.date}
                <span className="mx-2.5 text-muted/60">·</span>
                {article.time}
                {article.authorName ? (
                  <>
                    <span className="mx-2.5 text-muted/60">·</span>
                    By <span className="font-semibold text-foreground">{article.authorName}</span>
                  </>
                ) : null}
                <span className="mx-2.5 text-muted/60">·</span>
                Savo Technologies
              </p>
            </Reveal>
          </div>
        </header>

        {/* Editorial image */}
        <div className="shell">
          <Reveal>
            <figure className="relative aspect-[21/9] overflow-hidden border border-border">
              <Image
                src={withBasePath(article.image)}
                alt={`${article.title}: editorial illustration`}
                fill
                priority
                sizes="(max-width: 1536px) 100vw, 1440px"
                className="photo object-cover"
              />
            </figure>
          </Reveal>
        </div>

        {/* Body, measured reading column */}
        <div className="border-t border-border">
          <div className="shell py-16 sm:py-20">
            <div className="mx-auto max-w-[42rem] space-y-7">
              {article.body.map((block, i) => {
                if (block.h) {
                  return (
                    <Reveal key={i} delay={40}>
                      <h2 className="t-h2 pt-6">{block.h}</h2>
                    </Reveal>
                  );
                }
                if (block.li) {
                  return (
                    <Reveal key={i} delay={40}>
                      <ul className="space-y-3.5 border-l border-border pl-7">
                        {block.li.map((item) => (
                          <li key={item} className="flex items-start gap-3.5">
                            <span aria-hidden="true" className="mt-2.5 h-1.5 w-1.5 shrink-0 bg-accent" />
                            <span className="t-body text-muted">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </Reveal>
                  );
                }
                return (
                  <Reveal key={i} delay={40}>
                    <p className="t-body-lg text-foreground/85">{block.p}</p>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </div>

        {/* Keep reading */}
        <div className="border-t border-border">
          <div className="shell py-14 sm:py-16">
            <Reveal>
              <p className="t-label mb-6 text-muted">Keep reading</p>
              <ul className="grid gap-px border border-border bg-border md:grid-cols-2">
                {others.map((other) => (
                  <li key={other.slug}>
                    <Link href={`/insights/${other.slug}`} className="group flex h-full flex-col gap-3 bg-background p-7 transition-colors duration-300 ease-[var(--ease-out-expo)] hover:bg-foreground hover:text-background">
                      <p className="t-label text-accent transition-colors group-hover:text-background/80">
                        {other.cat} · {other.time}
                      </p>
                      <p className="t-h4">{other.title}</p>
                      <p className="t-caption text-muted transition-colors group-hover:text-background/70">{other.excerpt}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </div>
      </article>

      <DetailCta
        headingId="article-cta-heading"
        heading="Reading is the easy part."
        lead="Applying it to a real product is where we come in. Bring the brief, first reply within one business day."
        location={`article-${article.slug}-cta`}
      />
    </>
  );
}
