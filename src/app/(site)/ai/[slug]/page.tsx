import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { absoluteUrl } from "@/lib/env";
import { AI_SERVICES } from "@/constants/ai-services";
import { getManagedAiServices } from "@/lib/content-items";
import { Section } from "@/components/ui/section";
import { SectionHeader } from "@/components/ui/section-header";
import { Reveal } from "@/components/ui/reveal";
import { ServiceSchematic } from "@/sections/services/service-schematics";
import { Workbench } from "@/components/shared/workbench";
import { Faq } from "@/components/shared/faq";
import { DetailCta } from "@/components/shared/detail-cta";
import { cn } from "@/lib/utils";
import { openGraphFor } from "@/lib/seo";

/**
 * AI practice chapters — /ai/[slug]/ (generative-ai, consulting,
 * machine-learning) in the service-page grammar: specimen hero,
 * workbench, spine, FAQ, cross-links into the fleet and services.
 */

export function generateStaticParams() {
  return AI_SERVICES.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const svc = (await getManagedAiServices()).find((s) => s.slug === slug);
  if (!svc) return {};
  return {
    title: svc.title,
    description: svc.metaDescription,
    alternates: { canonical: `/ai/${svc.slug}` },
    openGraph: openGraphFor({ title: `${svc.title} | Savo Technologies`, description: svc.metaDescription, url: `/ai/${svc.slug}` }),
  };
}

export default async function AiServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const svc = (await getManagedAiServices()).find((s) => s.slug === slug);
  if (!svc) notFound();
  const headingId = "ai-heading";

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Service",
        "@id": absoluteUrl(`/ai/${svc.slug}/#service`),
        name: svc.title,
        description: svc.metaDescription,
        provider: { "@id": absoluteUrl("/#organization") },
        url: absoluteUrl(`/ai/${svc.slug}`),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
          { "@type": "ListItem", position: 2, name: "AI Agents", item: absoluteUrl("/ai-agents") },
          { "@type": "ListItem", position: 3, name: svc.title, item: absoluteUrl(`/ai/${svc.slug}`) },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: svc.faqs.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Hero, statement + specimen plate + stack marquee */}
      <section aria-labelledby={headingId} className="relative overflow-hidden">
        <div className="shell pb-16 pt-[calc(var(--nav-h)+4.5rem)] sm:pb-20">
          <div aria-hidden="true" className="mb-12 flex items-center gap-4 sm:mb-14">
            <span className="h-2 w-2 shrink-0 bg-accent" />
            <span className="t-label text-muted">
              <Link href="/ai-agents" className="transition-colors hover:text-foreground">AI</Link>
              <span className="mx-2.5 text-muted/60">·</span>
              {svc.title}
            </span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-7">
              <Reveal>
                <h1 id={headingId} className="t-statement max-w-[15ch]">
                  {svc.tagline}
                  <span aria-hidden="true" className="text-accent">.</span>
                </h1>
              </Reveal>
              <Reveal delay={120}>
                <p className="t-body-lg mt-8 max-w-xl text-muted">{svc.heroLead}</p>
              </Reveal>
            </div>
            <div className="lg:col-span-5">
              <Reveal delay={160}>
                <figure aria-label={`${svc.title}, schematic`} className="blueprint relative aspect-[4/3] border border-border bg-surface">
                  <div className="absolute inset-0 bottom-[3.25rem] p-8 text-foreground/80 sm:p-10">
                    <ServiceSchematic slug={svc.slug === "generative-ai" ? "ai-agent-development" : svc.slug === "machine-learning" ? "data-analytics" : "product-engineering"} />
                  </div>
                  <figcaption className="absolute inset-x-0 bottom-0 flex h-[3.25rem] items-center justify-between border-t border-border px-5">
                    <span className="t-label text-muted">Specimen: {svc.short}</span>
                    <span aria-hidden="true" className="flex gap-1.5">
                      <span className="h-1.5 w-1.5 bg-accent schem-pulse" />
                      <span className="h-1.5 w-1.5 bg-border" />
                      <span className="h-1.5 w-1.5 bg-border" />
                    </span>
                  </figcaption>
                </figure>
              </Reveal>
            </div>
          </div>
        </div>

        <div className="border-y border-border py-4" aria-hidden="true">
          <div className="marquee overflow-hidden">
            <div className="marquee-track" style={{ animationDuration: "64s" }}>
              {[0, 1].map((copy) => (
                <ul key={copy} className="flex shrink-0 items-center">
                  {[...svc.stack, ...svc.stack].map((item, i) => (
                    <li key={`${copy}-${i}`} className="flex items-center">
                      <span className="t-label whitespace-nowrap px-7 text-muted">{item}</span>
                      <span className="h-1.5 w-1.5 shrink-0 bg-accent/70" />
                    </li>
                  ))}
                </ul>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* The practice */}
      <Section index="The Practice" labelledBy="practice-heading">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-7">
            <Reveal>
              <h2 id="practice-heading" className="t-dl max-w-[14ch]">The practice.</h2>
            </Reveal>
            <Reveal delay={120}>
              <div className="mt-8 max-w-[40rem] space-y-6 border-l border-border pl-8 text-muted">
                <p className="t-body-lg">{svc.overview[0]}</p>
                <p className="t-body">{svc.overview[1]}</p>
              </div>
            </Reveal>
          </div>
          <div className="lg:col-span-5">
            <Reveal delay={200} className="lg:sticky lg:top-28">
              <div className="border border-border bg-surface p-7">
                <p className="t-label text-muted">Also in the practice</p>
                <ul className="mt-4 space-y-3">
                  {[
                    { label: "The agent fleet", href: "/ai-agents", hint: "six production personas" },
                    ...(await getManagedAiServices()).filter((s) => s.slug !== svc.slug).map((s) => ({
                      label: s.short,
                      href: `/ai/${s.slug}`,
                      hint: s.tagline.toLowerCase(),
                    })),
                  ].map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className="group flex items-center gap-3.5">
                        <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 scale-0 bg-accent transition-transform duration-300 ease-[var(--ease-out-expo)] group-hover:scale-100" />
                        <span className="t-sm font-medium text-foreground/85 group-hover:text-foreground">{link.label}</span>
                        <span className="t-caption ml-auto text-muted">{link.hint}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
        </div>
      </Section>

      {/* Workbench */}
      <Section index="The Workbench" labelledBy="wb-heading" className="bg-surface-2/60">
        <SectionHeader id="wb-heading" heading="What we take on." lead={<>The engagements this practice lands most often, select a slot to open it.</>} />
        <Workbench items={svc.engagements} slotWord={svc.short} includedLabel="Typical engagement" panelId={`wb-${svc.slug}`} />
      </Section>

      {/* Process spine (ink) */}
      <Section index="How It Runs" chapter="ink" labelledBy="proc-heading">
        <SectionHeader id="proc-heading" heading="How the work runs." lead={<>The same delivery rhythm every time, outcomes depend on the problem, never the process.</>} />
        <Reveal>
          <ol className="relative space-y-10 sm:space-y-12">
            <div aria-hidden="true" className="absolute bottom-2 left-[5px] top-2 w-px bg-border" />
            {svc.process.map((step, i) => (
              <li key={step.name} className={cn(i % 2 === 1 && "lg:ml-16")}>
                <div className="relative pl-8 sm:pl-10">
                  <span aria-hidden="true" className="absolute left-0 top-[0.45rem] h-[11px] w-[11px] border border-border bg-surface" />
                  <div className="max-w-lg">
                    <h3 className="t-h3">{step.name}</h3>
                    <p className="t-body mt-3 text-muted">{step.text}</p>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </Reveal>
      </Section>

      {/* FAQ */}
      <Section index="Questions" labelledBy="faq-heading" className="bg-surface-2/60">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-28">
              <Reveal>
                <h2 id="faq-heading" className="t-dl max-w-[12ch]">Asked about {svc.short.toLowerCase()}.</h2>
                <p className="t-body mt-6 max-w-xs text-muted">The questions buyers raise, answered plainly.</p>
              </Reveal>
            </div>
          </div>
          <div className="lg:col-span-8">
            <Faq items={svc.faqs} label={`${svc.title}, frequently asked questions`} />
          </div>
        </div>
      </Section>

      <DetailCta
        headingId="ai-cta-heading"
        heading="Put AI to work where it pays."
        lead="Tell us the workflow and the constraint. We will say honestly whether AI earns its place, and map the first build if it does."
        location={`ai-${svc.slug}-cta`}
        secondaryLabel="Meet the Fleet"
        secondaryHref="/ai-agents"
      />
    </>
  );
}
