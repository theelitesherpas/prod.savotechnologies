import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { openGraphFor } from "@/lib/seo";
import { Reveal } from "@/components/ui/reveal";
import { Section } from "@/components/ui/section";
import { SectionHeader } from "@/components/ui/section-header";
import { DetailCta } from "@/components/shared/detail-cta";
import { getCaseStudies, getCaseStudy } from "@/lib/case-studies";
import { resolveCaseImages } from "@/lib/case-study-schema";
import { CASE_DISCIPLINES } from "@/constants/case-studies";

/**
 * Case-study dossier — premium detail page.
 *
 * Chapter flow (balanced, dense, no wasted space):
 *   01 Hero + Facts     (paper)  — title, CTAs, inline meta
 *   02 Showcase         (framed) — bordered image with glass caption
 *   03 Challenge        (ink)    — the problem
 *   04 Solution         (paper)  — what we built + sidebar
 *   05 Key Features     (sand)   — feature grid
 *   06 Results          (ink)    — headline number + metrics
 *   07 Gallery          (paper)  — screenshots
 *   08 Palette + Quote  (sand)   — side by side
 *   09 More Work        (paper)  — 3 related cards
 *   10 CTA              (accent) — start your project
 */

export async function generateStaticParams() {
  const studies = await getCaseStudies();
  return studies.map((s) => ({ slug: s.slug }));
}

export const revalidate = 0;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const study = await getCaseStudy(slug);
  if (!study) return {};
  const discipline = CASE_DISCIPLINES.find((d) => d.id === study.discipline);
  const title = `${study.displayClientName || study.title} — ${discipline?.title ?? "Case Study"}`;
  return {
    title,
    description: study.summary || `${study.title} case study by Savo Technologies.`,
    alternates: { canonical: `/case-studies/${study.slug}` },
    openGraph: openGraphFor({ title: `${title} | Savo Technologies`, description: study.summary || study.industry, url: `/case-studies/${study.slug}`, images: [{ url: "/opengraph-image", width: 1200, height: 630 }] }),
  };
}

export default async function CaseStudyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const study = await getCaseStudy(slug);
  if (!study) notFound();

  const discipline = CASE_DISCIPLINES.find((d) => d.id === study.discipline);
  const all = await getCaseStudies();
  const others = all.filter((s) => s.slug !== study.slug).slice(0, 3);
  const isDemo = study.status === "demo";
  const shownResults = isDemo ? study.results : study.results.filter((r) => r.verified);
  const displayName = study.displayClientName || study.title;
  const images = resolveCaseImages(study);
  const showcaseImage = images.showcase;
  const headlineResult = shownResults[0];

  const metaFacts = [
    { k: "Client", v: displayName },
    { k: "Industry", v: study.industry },
    { k: "Location", v: study.clientLocation },
    { k: "Business Model", v: study.businessModel },
    { k: "Platforms", v: study.platforms },
    { k: "Year", v: study.year },
    { k: "Duration", v: study.duration },
    { k: "Team", v: study.teamSize },
  ].filter((f) => f.v);

  return (
    <>
      {/* ═══ 01 · HERO + FACTS (paper) ═══ */}
      <section aria-labelledby="cs-heading" className="border-b border-border">
        <div className="shell pb-10 pt-[calc(var(--nav-h)+3rem)] sm:pb-14">
          <div aria-hidden="true" className="mb-8 flex items-center gap-4">
            <span className="h-2 w-2 shrink-0 bg-accent" />
            <p className="t-label text-muted">
              <Link href="/case-studies" className="transition-colors hover:text-foreground">Case Studies</Link>
              <span className="mx-2 text-muted/50">/</span>
              {discipline?.title ?? "Dossier"}
              {study.year ? <span className="text-muted/50"> · {study.year}</span> : null}
            </p>
            <span className="h-px flex-1 bg-border" />
          </div>

          <div className="grid items-end gap-10 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <h1 id="cs-heading" className="t-h1">
                {displayName}<span aria-hidden="true" className="text-accent">.</span>
              </h1>
              {study.industry ? <p className="t-label mt-4 text-accent-strong">{study.industry}</p> : null}
              <div className="mt-7 flex flex-wrap items-center gap-4">
                {study.liveUrl ? (
                  <a href={study.liveUrl} target="_blank" rel="noopener noreferrer"
                    className="group/live inline-flex h-11 items-center gap-2.5 rounded-[2px] bg-foreground px-6 text-[0.9375rem] font-semibold text-background transition-colors hover:bg-accent hover:text-on-accent">
                    View Live
                    <svg aria-hidden="true" viewBox="0 0 14 14" className="h-3 w-3 transition-transform group-hover/live:translate-x-[3px] group-hover/live:-translate-y-[3px]" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M6 2h6v6M12 2 4 10M4 4H2v8h8v-2" /></svg>
                  </a>
                ) : null}
                <Link href="/#start" className="inline-flex h-11 items-center rounded-[2px] border border-foreground/25 px-6 text-[0.9375rem] font-semibold transition-colors hover:border-foreground hover:bg-foreground/[0.04]">
                  Start a Similar Project
                </Link>
              </div>
            </div>
            <div className="lg:col-span-5">
              {study.summary ? <p className="t-body-lg text-muted">{study.summary}</p> : null}
              {study.services.length > 0 ? (
                <ul className="mt-5 flex flex-wrap gap-1.5" aria-label="Capabilities">
                  {study.services.map((s) => (
                    <li key={s} className="t-caption rounded-[2px] border border-border px-2.5 py-1 text-muted">{s}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>

          {/* Meta facts strip — dense, scannable */}
          {metaFacts.length > 0 ? (
            <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-3 border-t border-border pt-5 sm:grid-cols-4 lg:grid-cols-8">
              {metaFacts.map((f) => (
                <div key={f.k} className="min-w-0">
                  <dt className="t-caption text-muted/70">{f.k}</dt>
                  <dd className="truncate text-[0.8125rem] font-semibold text-foreground/85">{f.v}</dd>
                </div>
              ))}
            </dl>
          ) : null}
        </div>
      </section>

      {/* ═══ 02 · SHOWCASE (framed, light, glass caption) ═══ */}
      {showcaseImage ? (
        <section aria-label="Project showcase" className="border-b border-border bg-surface-2/40 py-10 sm:py-14">
          <div className="shell">
            <Reveal>
              <figure className="relative overflow-hidden rounded-lg border border-border bg-background shadow-[0_8px_32px_rgb(10_10_14/0.08)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={showcaseImage.dataUrl}
                  alt={showcaseImage.alt || `${displayName} — project showcase`}
                  className="aspect-[21/9] w-full object-cover"
                />
                {/* Glass caption bar */}
                {showcaseImage.alt || displayName ? (
                  <figcaption className="absolute inset-x-4 bottom-4 flex items-center justify-between gap-4 rounded-lg border border-white/20 bg-white/70 px-4 py-3 backdrop-blur-md">
                    <p className="t-caption font-medium text-foreground/80">
                      {showcaseImage.alt || `${displayName} — project showcase`}
                    </p>
                    <span className="t-label hidden shrink-0 text-muted/60 sm:block">{discipline?.title}</span>
                  </figcaption>
                ) : null}
              </figure>
            </Reveal>
          </div>
        </section>
      ) : null}

      {/* ═══ 03 · THE CHALLENGE (ink) ═══ */}
      {study.challenge ? (
        <Section index="The Challenge" chapter="ink" labelledBy="cs-challenge-heading" className="!py-14 sm:!py-18 lg:!py-22">
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-10">
            <div className="lg:col-span-4">
              <SectionHeader id="cs-challenge-heading" heading="The problem." lead="What was holding the client back." />
            </div>
            <div className="lg:col-span-7 lg:col-start-6">
              <Reveal><p className="t-body-lg leading-relaxed text-muted">{study.challenge}</p></Reveal>
            </div>
          </div>
        </Section>
      ) : null}

      {/* ═══ 04 · THE SOLUTION (paper) ═══ */}
      {study.solution ? (
        <Section index="The Solution" labelledBy="cs-solution-heading" className="!py-14 sm:!py-18 lg:!py-22">
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-10">
            <div className="lg:col-span-7">
              <SectionHeader id="cs-solution-heading" heading="What we built." lead="Approach, architecture and how it shipped." />
              <Reveal><p className="t-body-lg leading-relaxed text-muted">{study.solution}</p></Reveal>

              {/* Integrations inline chips */}
              {study.integrations && study.integrations.length > 0 ? (
                <Reveal delay={120}>
                  <div className="mt-8 border-t border-border pt-6">
                    <p className="t-label mb-3 text-muted">Integrations</p>
                    <ul className="flex flex-wrap gap-2">
                      {study.integrations.map((int) => (
                        <li key={int} className="t-caption rounded-[2px] border border-border bg-surface-2/60 px-3 py-1.5 text-foreground/75">{int}</li>
                      ))}
                    </ul>
                  </div>
                </Reveal>
              ) : null}
            </div>

            <aside className="lg:col-span-5">
              <Reveal delay={140}>
                {study.technologies.length > 0 ? (
                  <div className="border border-border bg-surface-2/60 p-6">
                    <p className="t-label mb-4 text-muted">Technology stack</p>
                    <ul className="flex flex-wrap gap-2">
                      {study.technologies.map((t) => (
                        <li key={t} className="t-caption flex items-center gap-2 rounded-[2px] border border-border bg-background px-3 py-1.5 text-foreground/80">
                          <span aria-hidden="true" className="h-1 w-1 rounded-full bg-accent" />{t}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {study.services.length > 0 ? (
                  <div className="mt-6 border border-border bg-surface p-6">
                    <p className="t-label mb-4 text-muted">Services delivered</p>
                    <ul className="space-y-2.5">
                      {study.services.map((s) => (
                        <li key={s} className="flex items-start gap-3">
                          <span aria-hidden="true" className="mt-[0.5em] h-1.5 w-1.5 shrink-0 bg-accent" />
                          <span className="t-sm font-medium text-foreground/85">{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </Reveal>
            </aside>
          </div>
        </Section>
      ) : null}

      {/* ═══ 05 · KEY FEATURES (sand) ═══ */}
      {study.keyFeatures && study.keyFeatures.length > 0 ? (
        <Section index="Key Features" labelledBy="cs-features-heading" className="bg-surface-2/60 !py-14 sm:!py-18 lg:!py-22">
          <SectionHeader id="cs-features-heading" heading="Notable features." lead={<>What makes this build stand out.</>} />
          <div className="grid gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
            {study.keyFeatures.map((f, i) => (
              <Reveal key={i} delay={i * 60}>
                <div className="h-full bg-background p-6 sm:p-7">
                  <span aria-hidden="true" className="mb-4 block h-2 w-2 bg-accent" />
                  <h3 className="t-h4">{f.title}</h3>
                  <p className="t-sm mt-3 text-muted">{f.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Section>
      ) : null}

      {/* ═══ 06 · RESULTS (ink) ═══ */}
      {shownResults.length > 0 ? (
        <Section index="Results" chapter="ink" labelledBy="cs-results-heading" className="!py-14 sm:!py-18 lg:!py-22">
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-10">
            {headlineResult ? (
              <div className="lg:col-span-5">
                <Reveal>
                  <div className="flex h-full flex-col justify-center">
                    <p className="t-label mb-4 text-accent">{isDemo ? "Design-preview result" : "Headline result"}</p>
                    <p className="font-[family-name:var(--font-serif)] text-[clamp(3.5rem,7vw,6rem)] font-semibold leading-none tracking-[-0.03em] text-foreground">
                      {headlineResult.value}
                    </p>
                    <p className="t-body-lg mt-4 max-w-sm text-muted">{headlineResult.label}</p>
                  </div>
                </Reveal>
              </div>
            ) : null}
            <div className={headlineResult ? "lg:col-span-7" : "lg:col-span-10 lg:col-start-2"}>
              <Reveal delay={100}>
                <dl className="grid grid-cols-2 gap-px border border-border bg-border lg:grid-cols-3">
                  {shownResults.map((r, i) => (
                    <div key={i} className="flex flex-col bg-background p-6 sm:p-8">
                      <dd className="font-[family-name:var(--font-serif)] text-3xl font-semibold text-foreground/85 sm:text-4xl">{r.value}</dd>
                      <dt className="t-label mt-3 text-muted">{r.label}</dt>
                    </div>
                  ))}
                </dl>
                {isDemo ? <p className="t-caption mt-4 text-muted/70">Design-preview figures — verified, client-approved results replace them at publication.</p> : null}
              </Reveal>
            </div>
          </div>
        </Section>
      ) : null}

      {/* ═══ 07 · GALLERY (paper) ═══ */}
      {study.gallery && study.gallery.length > 0 ? (
        <Section index="Gallery" labelledBy="cs-gallery-heading" className="!py-14 sm:!py-16 lg:!py-20">
          <SectionHeader id="cs-gallery-heading" heading="Inside the project." lead={<>Screens and detail views from the build.</>} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {study.gallery.map((img, i) => (
              <Reveal key={i} delay={i * 60}>
                <figure className="group relative overflow-hidden rounded-lg border border-border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.dataUrl} alt={img.alt || `${displayName} — image ${i + 1}`}
                    className="aspect-[4/3] w-full object-cover transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:scale-[1.03]" loading="lazy" />
                  {img.alt ? (
                    <figcaption className="absolute inset-x-3 bottom-3 rounded-md bg-white/70 px-3 py-2 backdrop-blur-md">
                      <p className="t-caption font-medium text-foreground/80">{img.alt}</p>
                    </figcaption>
                  ) : null}
                </figure>
              </Reveal>
            ))}
          </div>
        </Section>
      ) : null}

      {/* ═══ 08 · PALETTE + TESTIMONIAL (sand) ═══ */}
      {study.palette.length > 0 || study.testimonial ? (
        <Section index="Details" labelledBy="cs-details-heading" className="bg-surface-2/60 !py-14 sm:!py-18 lg:!py-22">
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-10">
            {study.palette.length > 0 ? (
              <div className={study.testimonial ? "lg:col-span-5" : "lg:col-span-8"}>
                <Reveal>
                  <p className="t-label mb-5 text-muted">Project palette</p>
                  <ul className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-4 lg:grid-cols-2">
                    {study.palette.map((c) => (
                      <li key={c.hex} className="bg-background">
                        <div className="h-20 w-full" style={{ backgroundColor: c.hex }} />
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
            {study.testimonial ? (
              <div className={study.palette.length > 0 ? "lg:col-span-7" : "lg:col-span-10 lg:col-start-2"}>
                <Reveal delay={100}>
                  <figure className="flex h-full flex-col justify-center rounded-lg border border-border bg-surface p-8 sm:p-10">
                    <p className="t-label text-accent-strong">{isDemo ? "Client testimonial preview" : "Client testimonial"}</p>
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

      {/* ═══ 09 · MORE WORK (paper) ═══ */}
      {others.length > 0 ? (
        <Section index="More Work" labelledBy="cs-more-heading" className="!py-14 sm:!py-18 lg:!py-22">
          <SectionHeader id="cs-more-heading" heading="More from the dossier." lead={<>Other verified engagements.</>} />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {others.map((other, i) => {
              const oi = resolveCaseImages(other);
              const art = oi.card ?? oi.cardWide;
              return (
                <Reveal key={other.slug} delay={i * 80}>
                  <Link href={`/case-studies/${other.slug}`} className="group block overflow-hidden rounded-lg border border-border bg-surface transition-colors hover:border-foreground/30">
                    <div className="relative aspect-[16/10] overflow-hidden">
                      {art ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={art.dataUrl} alt={art.alt || `${other.displayClientName || other.title} — project`}
                          className="h-full w-full object-cover transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:scale-[1.03]" />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-surface-2/60 text-muted/40">
                          <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 15l5-5 4 4 3-3 6 6" /></svg>
                        </div>
                      )}
                      <span className="t-label absolute left-3 top-3 rounded-md border border-white/25 bg-[rgb(16_19_25/0.5)] px-2 py-1 text-white/85 backdrop-blur-md">
                        {CASE_DISCIPLINES.find(d => d.id === other.discipline)?.title ?? other.discipline}
                      </span>
                    </div>
                    <div className="p-5">
                      <h3 className="t-h4 transition-colors group-hover:text-accent">{other.displayClientName || other.title}</h3>
                      {other.industry ? <p className="t-caption mt-2 text-muted">{other.industry}</p> : null}
                      {other.results?.[0] ? <p className="t-caption mt-3 font-medium text-foreground/70">{other.results[0].value} {other.results[0].label}</p> : null}
                    </div>
                  </Link>
                </Reveal>
              );
            })}
          </div>
          <Reveal className="mt-8">
            <Link href="/case-studies" className="group/link t-sm inline-flex items-center gap-2 py-3 font-semibold text-foreground transition-colors hover:text-accent">
              Browse all case studies
              <svg aria-hidden="true" viewBox="0 0 14 14" className="h-3 w-3 transition-transform group-hover/link:translate-x-[3px]" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M1 7h11M7.5 2.5 12 7l-4.5 4.5" /></svg>
            </Link>
          </Reveal>
        </Section>
      ) : null}

      {/* ═══ 10 · CTA (accent) ═══ */}
      <DetailCta
        headingId="cs-cta-heading"
        heading="Start your project."
        lead="Every case study here started as a plain-language brief. Send the problem and its constraints — a senior consultant replies within one business day."
        location="case-study-close"
        secondaryLabel="Browse Services"
        secondaryHref="/services"
      />
    </>
  );
}
