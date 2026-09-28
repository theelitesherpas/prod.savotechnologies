import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { openGraphFor } from "@/lib/seo";
import { Reveal } from "@/components/ui/reveal";
import { Section } from "@/components/ui/section";
import { SectionHeader } from "@/components/ui/section-header";
import { DetailCta } from "@/components/shared/detail-cta";
import { ProjectShowcase } from "@/components/shared/project-showcase";
import { ProjectMockup } from "@/components/shared/project-mockup";
import { getCaseStudies, getCaseStudy } from "@/lib/case-studies";
import { resolveCaseImages } from "@/lib/case-study-schema";
import { CASE_DISCIPLINES } from "@/constants/case-studies";

/**
 * Case-study dossier — the full detail page for a project.
 *
 * Structure (top to bottom, tightly assembled):
 *   01 Hero: breadcrumb + title + summary + fact chips (one band)
 *   02 Showcase: the big image (full-bleed)
 *   03 The Story: challenge → solution + stack rail (one chapter, ink)
 *   04 Outcomes: verified metrics (sand band)
 *   05 Details: palette + testimonial (one chapter, side by side)
 *   06 Continue: next project → CTA (vermilion close)
 */

export async function generateStaticParams() {
  const studies = await getCaseStudies();
  return studies.map((s) => ({ slug: s.slug }));
}

export const revalidate = 0; // always fresh — managed content

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const study = await getCaseStudy(slug);
  if (!study) return {};
  const discipline = CASE_DISCIPLINES.find((d) => d.id === study.discipline);
  const title = `${study.displayClientName || study.title} - ${discipline?.title ?? "Case Study"}`;
  return {
    title,
    description: study.summary || `${study.title} case study by Savo Technologies.`,
    alternates: { canonical: `/case-studies/${study.slug}` },
    openGraph: openGraphFor({
      title: `${title} | Savo Technologies`,
      description: study.summary || study.industry,
      url: `/case-studies/${study.slug}`,
      images: [{ url: "/opengraph-image", width: 1200, height: 630 }],
    }),
  };
}

export default async function CaseStudyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const study = await getCaseStudy(slug);
  if (!study) notFound();

  const discipline = CASE_DISCIPLINES.find((d) => d.id === study.discipline);
  const all = await getCaseStudies();
  const index = all.findIndex((s) => s.slug === study.slug);
  const next = all.length > 1 ? all[(index + 1) % all.length] : null;
  const isDemo = study.status === "demo";
  const shownResults = isDemo ? study.results : study.results.filter((r) => r.verified);
  const displayName = study.displayClientName || study.title;
  const showcaseImage = resolveCaseImages(study).showcase;

  return (
    <>
      {/* ═══════════ 01 · HERO ═══════════ */}
      <section aria-labelledby="cs-heading" className="border-b border-border">
        <div className="shell pb-10 pt-[calc(var(--nav-h)+3rem)] sm:pb-14">
          {/* Breadcrumb */}
          <div aria-hidden="true" className="mb-8 flex items-center gap-4">
            <span className="h-2 w-2 shrink-0 bg-accent" />
            <p className="t-label text-muted">
              <Link href="/case-studies" className="transition-colors hover:text-foreground">
                Case Studies
              </Link>
              <span className="mx-2 text-muted/50">/</span>
              {discipline?.title ?? "Dossier"}
              {study.year ? <span className="text-muted/50"> · {study.year}</span> : null}
            </p>
            <span className="h-px flex-1 bg-border" />
          </div>

          {/* Title + summary */}
          <div className="grid items-end gap-8 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <h1 id="cs-heading" className="t-h1">
                {displayName}
                <span aria-hidden="true" className="text-accent">.</span>
              </h1>
              {study.industry ? <p className="t-label mt-4 text-accent-strong">{study.industry}</p> : null}
            </div>
            <div className="lg:col-span-5">
              {study.summary ? <p className="t-body-lg text-muted">{study.summary}</p> : null}
            </div>
          </div>

          {/* Fact chips: inline, no separate bar */}
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-border pt-6">
            {[
              discipline?.title,
              study.year,
              study.duration,
              study.teamSize,
            ].filter(Boolean).map((fact, i) => (
              <span key={i} className="flex items-center gap-2 text-[0.8125rem] text-muted">
                {i > 0 ? <span aria-hidden="true" className="h-1 w-1 rounded-full bg-border" /> : null}
                {fact}
              </span>
            ))}
            {study.services.length > 0 ? (
              <span className="ml-auto hidden flex-wrap gap-1.5 sm:flex" aria-label="Capabilities">
                {study.services.slice(0, 3).map((s) => (
                  <span key={s} className="t-caption rounded-[2px] border border-border px-2 py-0.5 text-muted">
                    {s}
                  </span>
                ))}
              </span>
            ) : null}
          </div>
        </div>
      </section>

      {/* ═══════════ 02 · SHOWCASE ═══════════ */}
      <ProjectShowcase
        discipline={study.discipline}
        palette={study.palette}
        heroImage={showcaseImage}
        isDemo={isDemo}
        title={displayName}
        caption={
          showcaseImage
            ? showcaseImage.alt || "Project visual"
            : study.discipline === "mobile"
              ? "Key screens"
              : "Representative interface views"
        }
      />

      {/* ═══════════ 03 · THE STORY (challenge + solution) ═══════════ */}
      {(study.challenge || study.solution) ? (
        <Section index="The Story" chapter="ink" labelledBy="cs-story-heading" className="!py-16 sm:!py-20 lg:!py-24">
          <SectionHeader
            id="cs-story-heading"
            heading="The problem and the build."
            lead={<>What was wrong, what we shipped, and the thinking between the two.</>}
          />

          <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
            {/* Left rail: challenge */}
            {study.challenge ? (
              <div className="lg:col-span-5">
                <Reveal>
                  <p className="t-label mb-5 text-accent">The challenge</p>
                  <p className="t-body leading-relaxed text-muted">{study.challenge}</p>
                </Reveal>
              </div>
            ) : null}

            {/* Right: solution + stack */}
            <div className="lg:col-span-7">
              {study.solution ? (
                <Reveal delay={100}>
                  <p className="t-label mb-5 text-accent">What we built</p>
                  <p className="t-body leading-relaxed text-muted">{study.solution}</p>
                </Reveal>
              ) : null}

              {/* Tech stack: inline chips, not a heavy panel */}
              {study.technologies.length > 0 ? (
                <Reveal delay={200}>
                  <div className="mt-8 border-t border-border pt-6">
                    <p className="t-label mb-4 text-muted">Stack</p>
                    <ul className="flex flex-wrap gap-2">
                      {study.technologies.map((t) => (
                        <li
                          key={t}
                          className="t-caption flex items-center gap-2 rounded-[2px] border border-border bg-surface px-3 py-1.5 text-foreground/80"
                        >
                          <span aria-hidden="true" className="h-1 w-1 rounded-full bg-accent" />
                          {t}
                        </li>
                      ))}
                    </ul>
                  </div>
                </Reveal>
              ) : null}
            </div>
          </div>
        </Section>
      ) : null}

      {/* ═══════════ 04 · OUTCOMES ═══════════ */}
      {shownResults.length > 0 ? (
        <Section index="Outcomes" labelledBy="cs-results-heading" className="bg-surface-2/60 !py-16 sm:!py-20 lg:!py-24">
          <SectionHeader
            id="cs-results-heading"
            heading="Measured outcomes."
            lead={
              isDemo ? (
                <>Design-preview figures - verified results replace them at publication.</>
              ) : (
                <>Each figure verified with the client before publication.</>
              )
            }
          />
          <Reveal>
            <dl className="grid grid-cols-1 gap-px border border-border bg-border sm:grid-cols-3">
              {shownResults.map((r) => (
                <div key={r.label} className="flex flex-col bg-background p-8 sm:p-10">
                  <dd className="t-dl text-foreground/85">{r.value}</dd>
                  <dt className="t-label mt-4 text-muted">{r.label}</dt>
                </div>
              ))}
            </dl>
          </Reveal>
        </Section>
      ) : null}

      {/* ═══════════ 05 · DETAILS (palette + testimonial) ═══════════ */}
      {study.palette.length > 0 || study.testimonial ? (
        <Section index="Details" labelledBy="cs-details-heading" className="!py-16 sm:!py-20 lg:!py-24">
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
            {/* Palette */}
            {study.palette.length > 0 ? (
              <div className={study.testimonial ? "lg:col-span-5" : "lg:col-span-8"}>
                <Reveal>
                  <p className="t-label mb-5 text-muted">Project palette</p>
                  <ul className="grid grid-cols-2 gap-px border border-border bg-border sm:grid-cols-4 lg:grid-cols-2">
                    {study.palette.map((c) => (
                      <li key={c.hex} className="bg-background">
                        <div className="h-20 w-full border-b border-border" style={{ backgroundColor: c.hex }} />
                        <div className="p-3">
                          <p className="t-caption font-medium text-foreground/90">{c.name}</p>
                          <p className="t-caption tnum mt-0.5 text-muted">{c.hex.toUpperCase()}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </Reveal>
              </div>
            ) : null}

            {/* Testimonial */}
            {study.testimonial ? (
              <div className={study.palette.length > 0 ? "lg:col-span-7" : "lg:col-span-10 lg:col-start-2"}>
                <Reveal delay={100}>
                  <figure className="flex h-full flex-col justify-center border border-border bg-surface p-8 sm:p-10">
                    <p className="t-label text-accent-strong">
                      {isDemo ? "Client testimonial preview" : "Client testimonial"}
                    </p>
                    <blockquote className="t-serif-italic mt-5 text-xl leading-relaxed text-foreground/90 sm:text-2xl">
                      &ldquo;{study.testimonial.quote}&rdquo;
                    </blockquote>
                    <figcaption className="mt-6 flex items-center gap-3 border-t border-border pt-5">
                      <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 bg-accent" />
                      <div>
                        <p className="t-sm font-semibold">{study.testimonial.name}</p>
                        <p className="t-caption mt-0.5 text-muted">{study.testimonial.role}</p>
                      </div>
                    </figcaption>
                  </figure>
                </Reveal>
              </div>
            ) : null}
          </div>
        </Section>
      ) : null}

      {/* ═══════════ 06 · CONTINUE ═══════════ */}
      {next ? (
        <Section index="Continue" className="bg-surface-2/60 !py-14 sm:!py-16 lg:!py-20">
          <Reveal>
            <Link
              href={`/case-studies/${next.slug}`}
              className="group flex flex-wrap items-center justify-between gap-6 border border-border bg-background p-8 transition-colors hover:border-foreground/30 sm:p-10"
            >
              <div>
                <p className="t-label text-muted">Next project</p>
                <p className="t-h3 mt-3 flex items-center gap-3">
                  {next.displayClientName || next.title}
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 14 14"
                    className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-[3px]"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                  >
                    <path d="M3 11 11 3M4.5 3H11v6.5" />
                  </svg>
                </p>
                {next.industry ? <p className="t-caption mt-2.5 text-muted">{next.industry}</p> : null}
              </div>
              <div className="flex h-14 w-20 shrink-0 items-center justify-center border border-border bg-surface-2/60 sm:h-16 sm:w-28">
                <ProjectMockup discipline={next.discipline} palette={next.palette} className="pointer-events-none" />
              </div>
            </Link>
          </Reveal>
        </Section>
      ) : null}

      {/* ═══════════ CLOSE ═══════════ */}
      <DetailCta
        headingId="cs-cta-heading"
        heading="Bring us a problem like this one."
        lead="Every dossier here started as a plain-language brief. Send the problem and its constraints - a senior consultant replies within one business day."
        location="case-study-close"
        secondaryLabel="Browse Services"
        secondaryHref="/services"
      />
    </>
  );
}
