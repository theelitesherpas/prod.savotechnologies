import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { openGraphFor } from "@/lib/seo";
import { Reveal } from "@/components/ui/reveal";
import { Section } from "@/components/ui/section";
import { SectionHeader } from "@/components/ui/section-header";
import { DetailCta } from "@/components/shared/detail-cta";
import { StartProjectButton } from "@/components/shared/start-project-button";
import { GalleryCarousel } from "@/components/shared/gallery-carousel";
import { DisciplineDoodle } from "@/components/shared/discipline-doodle";
import { FeatureIcon } from "@/components/shared/feature-icon";
import { getCaseStudies, getCaseStudy } from "@/lib/case-studies";
import { resolveCaseImages } from "@/lib/case-study-schema";
import { caseImageSrc } from "@/lib/case-img";
import { CASE_DISCIPLINES } from "@/constants/case-studies";

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
  const title = `${study.displayClientName || study.title} · ${discipline?.title ?? "Case Study"}`;
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
  const showcaseSrc = images.showcase ? caseImageSrc(study.slug, "showcase", images.showcase.dataUrl) : null;
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
      {/* ═══ 01 · HERO + FACTS ═══ */}
      <section aria-labelledby="cs-heading" className="border-b border-border">
        <div className="shell pb-10 pt-[calc(var(--nav-h)+3rem)] sm:pb-14">
          <div aria-hidden="true" className="mb-8 flex items-center gap-4">
            <span className="h-2 w-2 shrink-0 bg-accent" />
            <p className="t-label text-muted">
              <Link href="/case-studies" className="transition-colors hover:text-foreground">Case Studies</Link>
              <span className="mx-2 text-muted/50">/</span>{discipline?.title ?? "Dossier"}
              {study.year ? <span className="text-muted/50"> · {study.year}</span> : null}
            </p>
            <span className="h-px flex-1 bg-border" />
          </div>

          <div className="grid items-end gap-10 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <h1 id="cs-heading" className="t-h1">{displayName}<span aria-hidden="true" className="text-accent">.</span></h1>
              {study.industry ? <p className="t-label mt-4 text-accent-strong">{study.industry}</p> : null}
              <div className="mt-7 flex flex-wrap items-center gap-4">
                {study.liveUrl ? (
                  <a href={study.liveUrl} target="_blank" rel="noopener noreferrer"
                    className="group/live inline-flex h-11 items-center gap-2.5 rounded-[2px] bg-foreground px-6 text-[0.9375rem] font-semibold text-background transition-colors hover:bg-accent hover:text-on-accent">
                    View Live
                    <svg aria-hidden="true" viewBox="0 0 14 14" className="h-3 w-3 transition-transform group-hover/live:translate-x-[3px] group-hover/live:-translate-y-[3px]" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M6 2h6v6M12 2 4 10M4 4H2v8h8v-2" /></svg>
                  </a>
                ) : null}
                <StartProjectButton source="case-study-hero" />
              </div>
            </div>
            <div className="lg:col-span-5">
              {study.summary ? <p className="t-body-lg text-muted">{study.summary}</p> : null}
              {study.services.length > 0 ? (
                <ul className="mt-5 flex flex-wrap gap-1.5" aria-label="Capabilities">
                  {study.services.map((s) => (<li key={s} className="t-caption rounded-[2px] border border-border px-2.5 py-1 text-muted">{s}</li>))}
                </ul>
              ) : null}
            </div>
          </div>

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

      {/* ═══ 02 · SHOWCASE (framed, glass caption) ═══ */}
      {showcaseSrc ? (
        <section aria-label="Project showcase" className="border-b border-border bg-surface-2/40 py-10 sm:py-14">
          <div className="shell">
            <Reveal>
              <figure className="relative overflow-hidden rounded-xl border border-border bg-background shadow-[0_8px_32px_rgb(10_10_14/0.08)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={showcaseSrc} alt={images.showcase?.alt || `${displayName} · project showcase`}
                  className="w-full object-cover" style={{ aspectRatio: "16/7" }} />
                {images.showcase?.alt || displayName ? (
                  <figcaption className="absolute inset-x-4 bottom-4 flex items-center justify-between gap-4 rounded-lg border border-white/20 bg-white/70 px-4 py-3 backdrop-blur-md">
                    <p className="t-caption font-medium text-foreground/80">{images.showcase?.alt || `${displayName} · project showcase`}</p>
                    <span className="t-label hidden shrink-0 text-muted/60 sm:block">{discipline?.title}</span>
                  </figcaption>
                ) : null}
              </figure>
            </Reveal>
          </div>
        </section>
      ) : null}

      {/* ═══ 03 · THE CHALLENGE → SOLUTION PROCESS (ink) ═══ */}
      {study.challenge || study.solution ? (
        <Section index="The Story" chapter="ink" labelledBy="cs-story-heading" className="!py-14 sm:!py-18 lg:!py-22">
          <SectionHeader id="cs-story-heading" heading="Problem to solution." lead={<>How the challenge was understood, approached and solved.</>} />

          {/* Process flow: Problem → Approach → Solution */}
          <div className="grid gap-4 lg:grid-cols-3 lg:gap-6">
            {/* Step 1: The Problem */}
            {study.challenge ? (
              <Reveal>
                <div className="h-full rounded-xl border border-border/50 bg-surface/10 p-6 sm:p-7">
                  <div className="mb-5 flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-error/30 bg-error/10 font-mono text-[0.75rem] font-bold text-error">01</span>
                    <p className="t-label text-error">The Problem</p>
                  </div>
                  <p className="t-sm leading-relaxed text-muted">{study.challenge}</p>
                </div>
              </Reveal>
            ) : null}

            {/* Step 2: The Approach (discipline doodle) */}
            <Reveal delay={80}>
              <div className="flex h-full flex-col rounded-xl border border-border/50 bg-surface/10 p-6 sm:p-7">
                <div className="mb-5 flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-accent/30 bg-accent/10 font-mono text-[0.75rem] font-bold text-accent">02</span>
                  <p className="t-label text-accent">The Approach</p>
                </div>
                <p className="t-sm leading-relaxed text-muted">
                  We approached this as a {discipline?.title?.toLowerCase() ?? "product"} engagement,
                  applying our proven delivery rhythm: understand the constraints, architect for the
                  real load, and ship in weekly slices.
                </p>
                {/* Discipline doodle */}
                <div className="mt-4 h-28 rounded-lg bg-surface/20 p-3">
                  <DisciplineDoodle discipline={study.discipline} className="h-full w-full" />
                </div>
              </div>
            </Reveal>

            {/* Step 3: The Solution */}
            {study.solution ? (
              <Reveal delay={160}>
                <div className="h-full rounded-xl border border-border/50 bg-surface/10 p-6 sm:p-7">
                  <div className="mb-5 flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-success/30 bg-success/10 font-mono text-[0.75rem] font-bold text-success">03</span>
                    <p className="t-label text-success">The Solution</p>
                  </div>
                  <p className="t-sm leading-relaxed text-muted">{study.solution}</p>
                </div>
              </Reveal>
            ) : null}
          </div>

          {/* Tech stack + integrations inline */}
          {study.technologies.length > 0 || (study.integrations && study.integrations.length > 0) ? (
            <Reveal delay={200}>
              <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-4 border-t border-border/30 pt-6">
                {study.technologies.length > 0 ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="t-label text-muted">Stack:</span>
                    {study.technologies.map((t) => (
                      <span key={t} className="t-caption rounded-full border border-border/40 bg-surface/20 px-3 py-1 text-foreground/70">{t}</span>
                    ))}
                  </div>
                ) : null}
                {study.integrations && study.integrations.length > 0 ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="t-label text-muted">Integrations:</span>
                    {study.integrations.map((int) => (
                      <span key={int} className="t-caption rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-accent">{int}</span>
                    ))}
                  </div>
                ) : null}
              </div>
            </Reveal>
          ) : null}
        </Section>
      ) : null}

      {/* ═══ 04 · KEY FEATURES (sand) ═══ */}
      {study.keyFeatures && study.keyFeatures.length > 0 ? (
        <Section index="Key Features" labelledBy="cs-features-heading" className="bg-surface-2/60 !py-14 sm:!py-18 lg:!py-22">
          <SectionHeader id="cs-features-heading" heading="Notable features." lead={<>What makes this build stand out: the capabilities that earned attention.</>} />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {study.keyFeatures.map((f, i) => (
              <Reveal key={i} delay={i * 80}>
                <div className="group relative h-full overflow-hidden rounded-2xl border border-border bg-background p-7 transition-all duration-300 hover:border-foreground/20 hover:shadow-[0_8px_32px_rgb(10_10_14/0.08)]">
                  {/* Animated infographic icon */}
                  <div className="mb-6 h-14 w-14">
                    <FeatureIcon index={i} className="h-full w-full" />
                  </div>
                  {/* Accent line */}
                  <span aria-hidden="true" className="absolute right-6 top-6 h-px w-8 bg-accent/30 transition-all duration-500 group-hover:w-12 group-hover:bg-accent/60" />
                  <h3 className="t-h4 leading-snug">{f.title}</h3>
                  <p className="t-sm mt-3 leading-relaxed text-muted">{f.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Section>
      ) : null}

      {/* ═══ 05 · RESULTS (paper) ═══ */}
      

      {/* ═══ 06 · GALLERY CAROUSEL (sand) ═══ */}
      {study.gallery && study.gallery.length > 0 ? (
        <Section index="Gallery" labelledBy="cs-gallery-heading" className="bg-surface-2/60 !py-14 sm:!py-18 lg:!py-22">
          <SectionHeader id="cs-gallery-heading" heading="Inside the project." lead={<>Screens and detail views, swipe or use the arrows.</>} />
          <Reveal>
            <GalleryCarousel
              images={study.gallery.map((g, i) => ({ src: caseImageSrc(study.slug, `gallery-${i}`, g.dataUrl), alt: g.alt, width: g.width, height: g.height }))}
              title={displayName}
            />
          </Reveal>
        </Section>
      ) : null}

      {/* ═══ 07 · TESTIMONIAL (accent spotlight) ═══ */}
      {study.testimonial ? (
        <section aria-labelledby="cs-testimonial-heading" className="chapter-accent border-y border-border">
          <div className="shell py-16 sm:py-20 lg:py-24">
            <Reveal>
              <div className="mx-auto max-w-3xl text-center">
                {/* Big quote mark */}
                <span aria-hidden="true" className="mb-8 block font-[family-name:var(--font-serif)] text-[5rem] leading-none text-foreground/20 select-none">&ldquo;</span>

                <blockquote className="t-serif-italic text-2xl leading-relaxed text-foreground sm:text-3xl lg:text-[2.25rem]">
                  {study.testimonial.quote}
                </blockquote>

                {/* Rating stars */}
                <div className="mt-8 flex items-center justify-center gap-1.5" aria-label="Client rating">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} viewBox="0 0 20 20" className="h-5 w-5 text-foreground" fill="currentColor" aria-hidden="true">
                      <path d="M10 1.5 12.6 7l5.9.9-4.3 4.1 1 5.9L10 15.1 4.8 17.9l1-5.9L1.5 7.9 7.4 7z" />
                    </svg>
                  ))}
                </div>

                <div className="mt-8 flex items-center justify-center gap-4">
                  <span aria-hidden="true" className="h-px w-12 bg-foreground/20" />
                  <div className="text-center">
                    <p className="text-[0.9375rem] font-bold text-foreground">{study.testimonial.name}</p>
                    <p className="t-caption mt-1 text-foreground/60">{study.testimonial.role}</p>
                  </div>
                  <span aria-hidden="true" className="h-px w-12 bg-foreground/20" />
                </div>

                <p className="t-label mt-6 text-foreground/40">
                  {isDemo ? "Client testimonial preview" : "Verified client feedback"}
                </p>
              </div>
            </Reveal>
          </div>
        </section>
      ) : null}

      {/* ═══ 08 · PALETTE (paper) ═══ */}
      {study.palette.length > 0 ? (
        <Section index="Palette" labelledBy="cs-palette-heading" className="!py-14 sm:!py-18 lg:!py-22">
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-10">
            <div className="lg:col-span-4">
              <SectionHeader id="cs-palette-heading" heading="Project palette." lead={<>The color system behind the interface.</>} />
              {study.authorName ? (
                <p className="t-caption mt-6 flex items-center gap-2 text-muted" aria-label="Case study author">
                  <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 shrink-0 text-accent" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
                    <path d="M2.5 14a5.5 5.5 0 0 1 11 0" />
                  </svg>
                  <span>Case study by</span>
                  <span className="font-semibold text-foreground/80">{study.authorName}</span>
                </p>
              ) : null}
            </div>
            <div className="lg:col-span-8">
              <Reveal>
                <ul className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  {study.palette.map((c) => (
                    <li key={c.hex} className="group overflow-hidden rounded-xl border border-border transition-shadow hover:shadow-[0_4px_16px_rgb(10_10_14/0.08)]">
                      <div className="h-24 w-full transition-transform duration-300 group-hover:scale-[1.02]" style={{ backgroundColor: c.hex }} />
                      <div className="bg-background p-3.5">
                        <p className="t-sm font-semibold text-foreground/90">{c.name}</p>
                        <p className="t-caption tnum mt-1 font-mono text-muted">{c.hex.toUpperCase()}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </Reveal>
            </div>
          </div>
        </Section>
      ) : null}

      {/* ═══ 09 · MORE WORK (sand) ═══ */}
      {others.length > 0 ? (
        <Section index="More Work" labelledBy="cs-more-heading" className="bg-surface-2/60 !py-14 sm:!py-18 lg:!py-22">
          <SectionHeader id="cs-more-heading" heading="More from the dossier." lead={<>Other verified engagements.</>} />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {others.map((other, i) => {
              const oi = resolveCaseImages(other);
              const art = oi.dossierCard;
              return (
                <Reveal key={other.slug} delay={i * 80}>
                  <Link href={`/case-studies/${other.slug}`} className="group block overflow-hidden rounded-xl border border-border bg-surface transition-all hover:border-foreground/30 hover:shadow-[0_4px_20px_rgb(10_10_14/0.08)]">
                    <div className="relative aspect-[16/10] overflow-hidden">
                      {art ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={caseImageSrc(other.slug, "dossierCard", art.dataUrl)} alt={art.alt || `${other.displayClientName || other.title} · project`}
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
                      {/* Same verified-figures policy as every other card
                          surface (policy §27): demo shows all, published
                          records show verified outcomes only. */}
                      {(() => {
                        const shown = other.status === "demo" ? other.results : (other.results ?? []).filter((r) => r.verified);
                        return shown?.[0] ? (
                          <p className="t-caption mt-3 font-medium text-foreground/70">{shown[0].value} {shown[0].label}</p>
                        ) : null;
                      })()}
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

      {/* ═══ 10 · CTA ═══ */}
      <DetailCta
        headingId="cs-cta-heading"
        heading="Start your project."
        lead="Every case study here started as a plain-language brief. Send the problem and its constraints, and a senior consultant replies within one business day."
        location="case-study-close"
        secondaryLabel="Browse Services"
        secondaryHref="/services"
      />
    </>
  );
}
