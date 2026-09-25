import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { absoluteUrl, env } from "@/lib/env";
import { openGraphFor } from "@/lib/seo";
import { Reveal } from "@/components/ui/reveal";
import { Section } from "@/components/ui/section";
import { SectionHeader } from "@/components/ui/section-header";
import { DetailCta } from "@/components/shared/detail-cta";
import { getCaseStudies, getCaseStudy } from "@/lib/case-studies";
import { CASE_DISCIPLINES } from "@/constants/case-studies";
import { cn } from "@/lib/utils";

/**
 * Case-study dossier — the full detail page for a project: hero, fact bar,
 * summary, challenge, solution, stack, palette, results, testimonial and
 * next-project navigation.
 *
 * Content policy: records render only when available in the current mode
 * (demo projects on staging; verified engagements in production — see
 * src/lib/case-studies.ts). Demo dossiers wear the "Design concept" badge
 * and never claim to be a real Savo client.
 */

const DISCIPLINE_PHOTO: Record<string, string> = {
  web: "/images/meeting.webp",
  mobile: "/images/mobile.webp",
  ai: "/images/architecture.webp",
  software: "/images/code.webp",
  design: "/images/studio.webp",
  growth: "/images/team.webp",
};

export async function generateStaticParams() {
  const studies = await getCaseStudies();
  return studies.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const study = await getCaseStudy(slug);
  if (!study) return {};
  const discipline = CASE_DISCIPLINES.find((d) => d.id === study.discipline);
  const title = `${study.displayClientName || study.title} — ${discipline?.title ?? "Case Study"}`;
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

  return (
    <>
      {/* ---------- Hero ---------- */}
      <section aria-labelledby="cs-heading" className="relative overflow-hidden border-b border-border">
        <div className="shell grid gap-10 pb-16 pt-[calc(var(--nav-h)+4.5rem)] sm:pb-20 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <div aria-hidden="true" className="mb-10 flex items-center gap-4">
              <span className="h-2 w-2 shrink-0 bg-accent" />
              <p className="t-label text-muted">
                <Link href="/case-studies" className="transition-colors hover:text-foreground">
                  Case Studies
                </Link>
                <span className="mx-2 text-muted/50">/</span>
                {discipline?.title ?? "Dossier"}
              </p>
              <span className="h-px flex-1 bg-border" />
            </div>
            <h1 id="cs-heading" className="t-h1">
              {study.displayClientName || study.title}
            </h1>
            <p className="t-label mt-5 text-accent">{study.industry}</p>
            <p className="t-body-lg mt-6 max-w-xl text-muted">{study.summary}</p>
            {study.services.length > 0 ? (
              <ul className="mt-8 flex max-w-2xl flex-wrap gap-2" aria-label="Engagement capabilities">
                {study.services.map((s) => (
                  <li key={s} className="t-caption rounded-[2px] border border-border px-2.5 py-1 text-muted">
                    {s}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          <div className="lg:col-span-5">
            <div className="relative aspect-[4/3] overflow-hidden border border-border">
              <Image
                src={DISCIPLINE_PHOTO[study.discipline] ?? DISCIPLINE_PHOTO.web}
                alt={
                  isDemo
                    ? `Design concept artwork for ${study.title} — fictional demo project`
                    : `${study.title} case study`
                }
                fill
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="duotone object-cover"
                priority
              />
              <div aria-hidden="true" className="absolute inset-0 bg-[rgb(16_19_25/0.25)]" />
              {isDemo ? (
                <span className="t-label absolute left-4 top-4 border border-white/25 bg-[rgb(16_19_25/0.45)] px-2.5 py-1.5 text-white/85 backdrop-blur-[2px]">
                  Design concept
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Fact bar ---------- */}
      {(study.year || study.duration || study.teamSize || study.clientName) && (
        <div className="border-b border-border bg-surface-2/60">
          <dl className="shell grid grid-cols-2 gap-px sm:grid-cols-4">
            {[
              { k: "Year", v: study.year },
              { k: "Duration", v: study.duration },
              { k: "Team", v: study.teamSize },
              { k: "Client", v: study.displayClientName || study.clientName },
            ]
              .filter((f) => f.v)
              .map((f) => (
                <div key={f.k} className="flex flex-col bg-background px-4 py-6 sm:px-6">
                  <dt className="t-label text-muted">{f.k}</dt>
                  <dd className="t-sm mt-2 font-medium text-foreground/90">{f.v}</dd>
                </div>
              ))}
          </dl>
        </div>
      )}

      {/* ---------- Challenge ---------- */}
      {study.challenge ? (
        <Section index="Challenge" chapter="ink" labelledBy="cs-challenge-heading">
          <div className="max-w-3xl">
            <SectionHeader id="cs-challenge-heading" heading="The challenge." />
            <Reveal>
              <p className="t-body-lg text-muted">{study.challenge}</p>
            </Reveal>
          </div>
        </Section>
      ) : null}

      {/* ---------- Solution ---------- */}
      {study.solution ? (
        <Section index="Solution" labelledBy="cs-solution-heading">
          <div className="grid gap-12 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <SectionHeader id="cs-solution-heading" heading="What we built." />
              <Reveal>
                <p className="t-body-lg text-muted">{study.solution}</p>
              </Reveal>
            </div>
            {study.technologies.length > 0 ? (
              <div className="lg:col-span-5">
                <Reveal delay={140}>
                  <p className="t-label mb-5 text-muted">Technology stack</p>
                  <ul className="grid grid-cols-1 gap-px border border-border bg-border sm:grid-cols-2">
                    {study.technologies.map((t) => (
                      <li key={t} className="flex items-center gap-3 bg-background p-4">
                        <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 bg-accent" />
                        <span className="t-sm font-medium text-foreground/90">{t}</span>
                      </li>
                    ))}
                  </ul>
                </Reveal>
              </div>
            ) : null}
          </div>
        </Section>
      ) : null}

      {/* ---------- Palette ---------- */}
      {study.palette.length > 0 ? (
        <Section index="Palette" labelledBy="cs-palette-heading" className="bg-surface-2/60">
          <SectionHeader
            id="cs-palette-heading"
            heading="Project palette."
            lead={<>The color system that carries the product's interface, from ink to accent.</>}
          />
          <Reveal>
            <ul className="grid grid-cols-2 gap-px border border-border bg-border sm:grid-cols-4">
              {study.palette.map((c) => (
                <li key={c.hex} className="bg-background">
                  <div className="h-28 w-full border-b border-border" style={{ backgroundColor: c.hex }} />
                  <div className="p-4">
                    <p className="t-sm font-medium text-foreground/90">{c.name}</p>
                    <p className="t-caption tnum mt-1 text-muted">{c.hex.toUpperCase()}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Reveal>
        </Section>
      ) : null}

      {/* ---------- Results ---------- */}
      {shownResults.length > 0 ? (
        <Section index="Results" chapter="ink" labelledBy="cs-results-heading">
          <SectionHeader
            id="cs-results-heading"
            heading="Outcomes."
            lead={
              isDemo ? (
                <>Design-preview figures — replaced by client-approved, verified results at publication.</>
              ) : (
                <>Verified with the client before publication.</>
              )
            }
          />
          <Reveal>
            <dl className="grid grid-cols-1 gap-px border border-border bg-border sm:grid-cols-3">
              {shownResults.map((r) => (
                <div key={r.label} className="flex flex-col bg-background p-7 sm:p-9">
                  <dd className="t-dl text-foreground/85">{r.value}</dd>
                  <dt className="t-label order-2 mt-4 text-muted">{r.label}</dt>
                </div>
              ))}
            </dl>
          </Reveal>
        </Section>
      ) : null}

      {/* ---------- Testimonial ---------- */}
      {study.testimonial ? (
        <Section index="In Their Words" labelledBy="cs-testimonial-heading">
          <div className="max-w-4xl">
            <Reveal>
              <figure>
                <p className="t-label text-accent">
                  {isDemo ? "Client testimonial preview" : "Client testimonial"}
                </p>
                <blockquote className="t-serif-italic mt-6 text-2xl leading-snug text-foreground/90 sm:text-3xl">
                  &ldquo;{study.testimonial.quote}&rdquo;
                </blockquote>
                <figcaption className="mt-8 flex items-center gap-4 border-t border-border pt-6">
                  <span aria-hidden="true" className="h-2 w-2 shrink-0 bg-accent" />
                  <div>
                    <p className="t-sm font-semibold">{study.testimonial.name}</p>
                    <p className="t-caption mt-0.5 text-muted">{study.testimonial.role}</p>
                  </div>
                </figcaption>
              </figure>
            </Reveal>
          </div>
        </Section>
      ) : null}

      {/* ---------- Next project + CTA ---------- */}
      <Section index="Continue" labelledBy="cs-next-heading">
        <div className="grid gap-10 lg:grid-cols-12">
          {next ? (
            <div className="lg:col-span-7">
              <Reveal>
                <Link
                  href={`/case-studies/${next.slug}`}
                  className="group block border border-border bg-surface p-8 transition-colors hover:border-foreground/30 sm:p-10"
                >
                  <p className="t-label text-muted">Next project</p>
                  <p className="t-h3 mt-4 flex items-center gap-3">
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
                  <p className="t-caption mt-2.5 text-muted">{next.industry}</p>
                </Link>
              </Reveal>
            </div>
          ) : null}
          <div className={cn("lg:col-span-5", !next && "lg:col-start-8")}>
            <DetailCta
              headingId="cs-cta-heading"
              heading="Have a project in this shape?"
              lead="Tell us the problem, the constraints and what success looks like — a senior consultant replies within one business day."
              location="Case study"
            />
          </div>
        </div>
      </Section>
    </>
  );
}
