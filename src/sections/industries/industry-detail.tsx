import Image from "next/image";
import Link from "next/link";
import { Section } from "@/components/ui/section";
import { SectionHeader } from "@/components/ui/section-header";
import { Reveal } from "@/components/ui/reveal";
import { ImageReveal } from "@/components/ui/image-reveal";
import { IndustryIcon } from "@/components/shared/industry-icon";
import { Faq } from "@/components/shared/faq";
import { FlowPlate } from "./flow-plate";
import type { IndustryDetail } from "@/constants/industry-details";
import type { Industry } from "@/constants/industries";

export type CrossLink = { label: string; hint: string; href: string };

/* ------------------------------------------------------------------ */
/* Hero — paper chapter: rail, statement, chips, at-a-glance, image band */

export function IndustryDetailHero({
  detail,
  chips,
}: {
  detail: IndustryDetail;
  chips: string[];
}) {
  return (
    <section aria-labelledby="industry-heading" className="relative overflow-hidden">
      <div className="shell pb-20 pt-[calc(var(--nav-h)+4.5rem)] sm:pb-24">
        {/* Rail */}
        <div aria-hidden="true" className="mb-12 flex items-center gap-4 sm:mb-16">
          <span className="h-2 w-2 shrink-0 bg-accent" />
          <span className="t-label text-muted">
            <Link href="/industries" className="transition-colors hover:text-foreground">Industries</Link>
            <span className="mx-2.5 text-muted/60">·</span>
            {detail.title}
          </span>
          <span className="h-px flex-1 bg-border" />
        </div>

        <div className="grid items-end gap-12 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-7">
            <Reveal>
              <h1 id="industry-heading" className="t-statement max-w-[15ch]">
                {detail.tagline.replace(/\.$/, "")}
                <span aria-hidden="true" className="text-accent">.</span>
              </h1>
            </Reveal>
            <Reveal delay={120}>
              <p className="t-body-lg mt-8 max-w-xl text-muted">{detail.heroLead}</p>
            </Reveal>
            <Reveal delay={200}>
              <ul className="mt-9 flex max-w-xl flex-wrap gap-2" aria-label="What we build here">
                {chips.map((chip) => (
                  <li key={chip} className="t-caption rounded-[2px] border border-border px-2.5 py-1 text-muted">
                    {chip}
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>

          {/* At a glance */}
          <div className="lg:col-span-5">
            <Reveal delay={240}>
              <div className="border border-border bg-surface p-7 sm:p-8">
                <div className="flex items-center justify-between gap-4">
                  <p className="t-label text-muted">At a glance</p>
                  <IndustryIcon
                    id={detail.id}
                    className="[&_svg]:h-6 [&_svg]:w-6 text-foreground/70"
                  />
                </div>
                <ul className="mt-5 border-t border-border">
                  {detail.markers.map((marker) => (
                    <li key={marker} className="flex items-center gap-3.5 border-b border-border py-3.5">
                      <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 bg-accent" />
                      <span className="t-sm font-medium text-foreground/85">{marker}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
        </div>

        {/* Sector image band */}
        <Reveal delay={160}>
          <figure className="mt-16">
            <ImageReveal className="relative aspect-[16/9] overflow-hidden border border-border sm:aspect-[21/9]">
              <Image
                src={`/images/sectors/${detail.id}-hero.webp`}
                alt={detail.imageCaption}
                fill
                priority
                sizes="(max-width: 1536px) 100vw, 1440px"
                className="duotone object-cover"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[rgb(16_19_25/0.35)] to-transparent"
              />
            </ImageReveal>
            <figcaption className="mt-4 flex items-center justify-between gap-6">
              <span className="t-caption text-muted">{detail.imageCaption}</span>
              <span className="t-label hidden shrink-0 text-muted/70 sm:block">{detail.title}</span>
            </figcaption>
          </figure>
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Landscape — paper: overview copy + detail image rail                 */

export function IndustryLandscape({ detail }: { detail: IndustryDetail }) {
  const headingId = "landscape-heading";
  return (
    <Section index="The Landscape" labelledBy={headingId}>
      <SectionHeader id={headingId} heading="The landscape." lead={detail.overview[0]} />
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-7">
          <Reveal delay={120}>
            <div className="max-w-[42rem] space-y-6 border-l border-border pl-8 text-muted">
              <p className="t-body-lg">{detail.overview[1]}</p>
            </div>
          </Reveal>
          <Reveal delay={200}>
            <ul className="mt-10 flex flex-wrap gap-2" aria-label="Engagement markers">
              {detail.markers.map((marker) => (
                <li key={marker} className="t-caption rounded-[2px] border border-border bg-surface px-2.5 py-1 text-muted">
                  {marker}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
        <div className="lg:col-span-5">
          <Reveal delay={240} className="lg:sticky lg:top-28">
            <ImageReveal className="relative aspect-[4/5] overflow-hidden border border-border">
              <Image
                src={`/images/sectors/${detail.id}-detail.webp`}
                alt={detail.detailCaption}
                fill
                sizes="(max-width: 1024px) 100vw, 480px"
                className="duotone object-cover"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[rgb(16_19_25/0.4)] to-transparent"
              />
            </ImageReveal>
            <p className="t-caption mt-4 text-muted">{detail.detailCaption}</p>
          </Reveal>
        </div>
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/* What we build — sand band: gap-px solution cabinet                   */

export function IndustrySolutions({ detail }: { detail: IndustryDetail }) {
  const headingId = "build-heading";
  return (
    <Section
      index="What We Build"
      labelledBy={headingId}
      className="bg-surface-2/60"
    >
      <SectionHeader
        id={headingId}
        heading={`What we build for ${detail.title.toLowerCase()}.`}
        lead={
          <>
            Engagement types from our full service catalogue, shaped around
            this sector&rsquo;s constraints and workflows.
          </>
        }
      />
      <Reveal>
        <ul className="grid grid-cols-1 gap-px border border-border bg-border md:grid-cols-2 lg:grid-cols-3">
          {detail.solutions.map((solution) => (
            <li key={solution.title} className="flex flex-col gap-3.5 bg-background p-7">
              <span aria-hidden="true" className="h-2 w-2 shrink-0 bg-accent" />
              <h3 className="t-h4 pt-1">{solution.title}</h3>
              <p className="t-sm mt-auto text-muted">{solution.text}</p>
            </li>
          ))}
        </ul>
      </Reveal>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/* Flow — ink chapter: the sector infographic plate                     */

export function IndustryFlow({ detail }: { detail: IndustryDetail }) {
  const headingId = "flow-heading";
  return (
    <Section index="The Flow" chapter="ink" labelledBy={headingId}>
      <SectionHeader id={headingId} heading={detail.flow.heading} lead={detail.flow.intro} />
      <FlowPlate nodes={detail.flow.nodes} caption={`${detail.title}, engineered flow`} />
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/* FAQ — sand band                                                      */

export function IndustryFaqs({ detail }: { detail: IndustryDetail }) {
  const headingId = "faq-heading";
  return (
    <Section index="Questions" labelledBy={headingId} className="bg-surface-2/60">
      <SectionHeader
        id={headingId}
        heading={`Asked about ${detail.title.toLowerCase()}.`}
        lead={
          <>
            The questions buyers and product teams raise before bringing us
            into this sector, answered plainly.
          </>
        }
      />
      <div className="max-w-3xl">
        <Faq items={detail.faqs} label={`${detail.title}, frequently asked questions`} />
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/* Explore further — paper: industries + services cross-links           */

export function IndustryCrossLinks({
  industries,
  services,
}: {
  industries: CrossLink[];
  services: CrossLink[];
}) {
  const headingId = "explore-heading";
  return (
    <Section index="Explore Further" labelledBy={headingId}>
      <SectionHeader
        id={headingId}
        heading="Explore further."
        lead={
          <>
            Adjacent sectors and the services that carry most of the work
            in this one.
          </>
        }
      />
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
        <nav aria-label="Related industries" className="lg:col-span-7">
          <Reveal>
            <p className="t-label mb-5 text-muted">Adjacent sectors</p>
            <ul className="border-t border-border">
              {industries.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="group flex items-center justify-between gap-6 border-b border-border py-6 transition-colors"
                  >
                    <div>
                      <p className="t-h3 transition-transform duration-300 ease-[var(--ease-out-expo)] group-hover:translate-x-1">
                        {link.label}
                      </p>
                      <p className="t-caption mt-2 text-muted">{link.hint}</p>
                    </div>
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 14 14"
                      className="h-4 w-4 shrink-0 text-muted transition-all duration-300 ease-[var(--ease-out-expo)] group-hover:translate-x-[4px] group-hover:text-accent"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                    >
                      <path d="M1 7h11M7.5 2.5 12 7l-4.5 4.5" />
                    </svg>
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/industries"
                  className="group flex items-center gap-3 border-b border-border py-6"
                >
                  <span aria-hidden="true" className="h-2 w-2 shrink-0 scale-0 bg-accent transition-transform duration-300 ease-[var(--ease-out-expo)] group-hover:scale-100" />
                  <span className="t-h4 text-foreground/80 transition-colors group-hover:text-foreground">
                    All industries
                  </span>
                </Link>
              </li>
            </ul>
          </Reveal>
        </nav>
        <nav aria-label="Services used in this sector" className="lg:col-span-5">
          <Reveal delay={120}>
            <p className="t-label mb-5 text-muted">Services that carry the work</p>
            <ul className="border-t border-border">
              {services.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="group flex items-center justify-between gap-6 border-b border-border py-5"
                  >
                    <div>
                      <p className="t-h4 font-medium transition-transform duration-300 ease-[var(--ease-out-expo)] group-hover:translate-x-1">
                        {link.label}
                      </p>
                      <p className="t-caption mt-1.5 text-muted">{link.hint}</p>
                    </div>
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 14 14"
                      className="h-3.5 w-3.5 shrink-0 text-muted transition-all duration-300 ease-[var(--ease-out-expo)] group-hover:translate-x-[3px] group-hover:text-accent"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                    >
                      <path d="M1 7h11M7.5 2.5 12 7l-4.5 4.5" />
                    </svg>
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/case-studies" className="group flex items-center gap-3 border-b border-border py-5">
                  <span aria-hidden="true" className="h-2 w-2 shrink-0 scale-0 bg-accent transition-transform duration-300 ease-[var(--ease-out-expo)] group-hover:scale-100" />
                  <span className="t-h4 font-medium text-foreground/80 transition-colors group-hover:text-foreground">
                    How the work gets filed
                  </span>
                </Link>
              </li>
            </ul>
          </Reveal>
        </nav>
      </div>
    </Section>
  );
}

export type { Industry };
