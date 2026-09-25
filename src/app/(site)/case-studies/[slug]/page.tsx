import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { openGraphFor } from "@/lib/seo";
import { Reveal } from "@/components/ui/reveal";
import { Section } from "@/components/ui/section";
import { SectionHeader } from "@/components/ui/section-header";
import { DetailCta } from "@/components/shared/detail-cta";
import { ProjectMockup } from "@/components/shared/project-mockup";
import { getCaseStudies, getCaseStudy } from "@/lib/case-studies";
import { CASE_DISCIPLINES } from "@/constants/case-studies";

/**
 * Case-study dossier — the full detail page for a project.
 *
 * Grammar (top to bottom): hero with a bespoke palette-driven product
 * mockup → engagement fact bar → challenge (ink) → solution + stack rail →
 * outcomes band → project palette → testimonial → next project → the
 * vermilion close.
 *
 * Content policy: records render only when available in the current mode
 * (demo projects on staging; verified engagements in production). Demo
 * dossiers wear the "Design concept" badge and never claim to be a real
 * Savo client.
 */

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
  const displayName = study.displayClientName || study.title;

  const facts = [
    { k: "Discipline", v: discipline?.title ?? study.discipline },
    { k: "Year", v: study.year },
    { k: "Duration", v: study.duration },
    { k: "Team", v: study.teamSize },
    { k: "Client", v: displayName },
  ].filter((f) => f.v);

  return (
    <>
      {/* ---------- Hero: statement + bespoke product mockup ---------- */}
      <section aria-labelledby="cs-heading" className="relative overflow-hidden border-b border-border">
        <div className="shell grid items-center gap-12 pb-16 pt-[calc(var(--nav-h)+4.5rem)] sm:pb-20 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <div aria-hidden="true" className="mb-10 flex items-center gap-4">
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
            <h1 id="cs-heading" className="t-h1">
              {displayName}
            </h1>
            {study.industry ? <p className="t-label mt-5 text-accent">{study.industry}</p> : null}
            {study.summary ? <p className="t-body-lg mt-6 max-w-xl text-muted">{study.summary}</p> : null}
            {study.services.length > 0 ? (
              <ul className="mt-8 flex max-w-xl flex-wrap gap-2" aria-label="Engagement capabilities">
                {study.services.map((s) => (
                  <li key={s} className="t-caption rounded-[2px] border border-border px-2.5 py-1 text-muted">
                    {s}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          <div className="lg:col-span-6">
            <Reveal delay={120}>
              <figure className="relative border border-border bg-surface">
                <div className="aspect-[5/4]">
                  {study.heroImage ? (
                    // Data URL stored in the record — skip the optimizer, render directly.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={study.heroImage.dataUrl}
                      alt={study.heroImage.alt || `${displayName} — project visual`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <ProjectMockup discipline={study.discipline} palette={study.palette} />
                  )}
                </div>
                {isDemo ? (
                  <span className="t-label absolute left-4 top-4 border border-white/25 bg-[rgb(16_19_25/0.5)] px-2.5 py-1.5 text-white/85 backdrop-blur-[2px]">
                    Design concept
                  </span>
                ) : null}
                <figcaption className="flex items-center justify-between gap-4 border-t border-border px-4 py-3">
                  <span className="t-caption text-muted">
                    {study.heroImage
                      ? study.heroImage.alt || "Project visual"
                      : study.discipline === "mobile"
                        ? "Key screens — home, detail and conversation"
                        : study.discipline === "web" || study.discipline === "design"
                          ? "Representative interface views"
                          : "Operations dashboard overview"}
                  </span>
                  <span aria-hidden="true" className="h-2 w-2 shrink-0 bg-accent" />
                </figcaption>
              </figure>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ---------- Engagement fact bar ---------- */}
      {facts.length > 0 ? (
        <div className="border-b border-border bg-surface-2/60">
          <dl className="shell grid grid-cols-2 gap-px sm:grid-cols-5">
            {facts.map((f) => (
              <div key={f.k} className="flex flex-col bg-background px-4 py-6 sm:px-6">
                <dt className="t-label text-muted">{f.k}</dt>
                <dd className="t-sm mt-2 font-medium text-foreground/90">{f.v}</dd>
              </div>
            ))}
          </dl>
        </div>
      ) : null}

      {/* ---------- Challenge ---------- */}
      {study.challenge ? (
        <Section index="Challenge" chapter="ink" labelledBy="cs-challenge-heading">
          <div className="grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <SectionHeader
                id="cs-challenge-heading"
                heading="The challenge."
                lead="The problem exactly as it arrived — constraints included."
              />
            </div>
            <div className="lg:col-span-7 lg:col-start-6">
              <Reveal>
                <p className="t-body-lg text-muted">{study.challenge}</p>
              </Reveal>
            </div>
          </div>
        </Section>
      ) : null}

      {/* ---------- Solution + stack rail ---------- */}
      {study.solution ? (
        <Section index="Solution" labelledBy="cs-solution-heading">
          <div className="grid gap-12 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <SectionHeader
                id="cs-solution-heading"
                heading="What we built."
                lead="Approach, architecture and how it shipped."
              />
              <Reveal>
                <p className="t-body-lg text-muted">{study.solution}</p>
              </Reveal>
            </div>
            {study.technologies.length > 0 ? (
              <aside className="lg:col-span-5">
                <Reveal delay={140}>
                  <div className="border border-border bg-surface-2/60 p-6 sm:p-8">
                    <p className="t-label mb-6 text-muted">Technology stack</p>
                    <ul className="grid grid-cols-1 gap-px bg-border sm:grid-cols-2">
                      {study.technologies.map((t) => (
                        <li key={t} className="flex items-center gap-3 bg-background p-4">
                          <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 bg-accent" />
                          <span className="t-sm font-medium text-foreground/90">{t}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="t-caption mt-6 text-muted/80">
                      Chosen for the load-bearing walls — proven technology where it counts.
                    </p>
                  </div>
                </Reveal>
              </aside>
            ) : null}
          </div>
        </Section>
      ) : null}

      {/* ---------- Outcomes ---------- */}
      {shownResults.length > 0 ? (
        <Section index="Outcomes" chapter="ink" labelledBy="cs-results-heading">
          <SectionHeader
            id="cs-results-heading"
            heading="Measured outcomes."
            lead={
              isDemo ? (
                <>Design-preview figures — replaced by client-approved, verified results at publication.</>
              ) : (
                <>Each figure verified with the client before publication.</>
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

      {/* ---------- Palette ---------- */}
      {study.palette.length > 0 ? (
        <Section index="Palette" labelledBy="cs-palette-heading" className="bg-surface-2/60">
          <SectionHeader
            id="cs-palette-heading"
            heading="Project palette."
            lead="The color system that carries the product's interface — ink, surfaces and the accent that earns attention."
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

      {/* ---------- Testimonial ---------- */}
      {study.testimonial ? (
        <Section index="In Their Words" labelledBy="cs-testimonial-heading">
          <div className="mx-auto max-w-4xl">
            <Reveal>
              <figure className="border border-border bg-surface p-8 sm:p-12">
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

      {/* ---------- Next project ---------- */}
      {next ? (
        <Section index="Continue" labelledBy="cs-next-heading" className="bg-surface-2/60">
          <div className="mx-auto max-w-5xl">
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
                  <p className="t-caption mt-2.5 text-muted">{next.industry}</p>
                </div>
                <div className="flex h-14 w-20 shrink-0 items-center justify-center border border-border bg-surface-2/60 sm:h-16 sm:w-28">
                  <ProjectMockup discipline={next.discipline} palette={next.palette} className="pointer-events-none" />
                </div>
              </Link>
            </Reveal>
          </div>
        </Section>
      ) : null}

      {/* ---------- Close ---------- */}
      <DetailCta
        headingId="cs-cta-heading"
        heading="Bring us a problem like this one."
        lead="Every dossier here started as a plain-language brief. Send the problem and its constraints — a senior consultant replies within one business day, with questions worth answering."
        location="case-study-close"
        secondaryLabel="Browse Services"
        secondaryHref="/services"
      />
    </>
  );
}
