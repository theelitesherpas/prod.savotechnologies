import Link from "next/link";
import Image from "next/image";
import { Section } from "@/components/ui/section";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeader } from "@/components/ui/section-header";
import { getManagedArticles } from "@/lib/content-items";
import { withBasePath } from "@/lib/utils";

/**
 * While you decide - the reading shelf. Replaces the former offices grid
 * (the footer already carries the full six-region presence on every page,
 * so the contact body no longer duplicates it). Three recent field notes
 * from the insights library give a mid-decision visitor something real to
 * judge the thinking by - the same engineers who reply to the form wrote
 * them. Admin-managed via the "insights" collection; renders nothing when
 * the library is empty.
 */
export async function WhileYouDecide() {
  const articles = (await getManagedArticles()).slice(0, 3);
  if (articles.length === 0) return null;

  return (
    <Section
      id="reading"
      index="While you decide"
      labelledBy="reading-heading"
      className="bg-surface-2/60"
    >
      <SectionHeader
        id="reading-heading"
        heading="Written by the people who reply."
        lead={
          <>
            No whitepapers behind a form, no thought-leadership theatre. A few
            recent field notes from the build: if the thinking fits, the work
            will too.
          </>
        }
      />

      <div className="grid gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
        {articles.map((article, i) => (
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
                  <span className="mx-2 text-muted group-hover:text-background/50">·</span>
                  {article.time}
                </p>
                <h3 className="t-h4 mt-3 leading-snug transition-colors duration-300 group-hover:text-background">
                  {article.title}
                </h3>
                <p className="t-sm mt-3 flex-1 text-muted transition-colors duration-300 group-hover:text-background/75">
                  {article.excerpt}
                </p>
                <span className="t-label mt-5 inline-flex items-center gap-2 text-accent-strong">
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

      <Reveal className="mt-12">
        <Link
          href="/insights"
          className="group/link t-sm -ml-1 inline-flex items-center gap-2 py-3 font-semibold text-foreground transition-colors hover:text-accent"
        >
          Browse the full library
          <svg
            aria-hidden="true"
            viewBox="0 0 14 14"
            className="h-3 w-3 transition-transform duration-300 group-hover/link:translate-x-[3px]"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          >
            <path d="M1 7h11M7.5 2.5 12 7l-4.5 4.5" />
          </svg>
        </Link>
      </Reveal>
    </Section>
  );
}
