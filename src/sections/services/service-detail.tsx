import Image from "next/image";
import Link from "next/link";
import { Section } from "@/components/ui/section";
import { SectionHeader } from "@/components/ui/section-header";
import { Reveal } from "@/components/ui/reveal";
import { ImageReveal } from "@/components/ui/image-reveal";
import { ServiceIcon } from "@/components/shared/service-icon";
import { Faq } from "@/components/shared/faq";
import { ServiceSchematic } from "./service-schematics";
import type { ServiceDetail } from "@/constants/services-detail";
import type { CrossLink } from "@/sections/industries/industry-detail";

/* ================================================================== */
/* Hero - the specimen plate. No stock band: each service opens on     */
/* its own animated blueprint schematic beside the statement, with     */
/* the toolchain passing on a slow hairline marquee below.             */
/* ================================================================== */

export function ServiceDetailHero({ detail }: { detail: ServiceDetail }) {
  return (
    <section aria-labelledby="service-heading" className="relative overflow-hidden">
      <div className="shell pb-16 pt-[calc(var(--nav-h)+4.5rem)] sm:pb-20">
        {/* Rail */}
        <div aria-hidden="true" className="mb-12 flex items-center gap-4 sm:mb-14">
          <span className="h-2 w-2 shrink-0 bg-accent" />
          <span className="t-label text-muted">
            <Link href="/services" className="transition-colors hover:text-foreground">Services</Link>
            <span className="mx-2.5 text-muted">·</span>
            {detail.title}
          </span>
          <span className="h-px flex-1 bg-border" />
        </div>

        <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-7">
            <Reveal>
              <h1 id="service-heading" className="t-statement max-w-[15ch]">
                {detail.tagline.replace(/\.$/, "")}
                <span aria-hidden="true" className="text-accent">.</span>
              </h1>
            </Reveal>
            <Reveal delay={120}>
              <p className="t-body-lg mt-8 max-w-xl text-muted">{detail.heroLead}</p>
            </Reveal>
            <Reveal delay={200}>
              <div className="mt-9 flex flex-wrap items-center gap-4">
                <ServiceIcon
                  slug={detail.slug}
                  className="h-10 w-10 text-foreground/70 [&_svg]:h-full [&_svg]:w-full"
                />
                <p className="t-caption max-w-[24ch] text-muted">
                  Strategy, design and engineering, one practice, delivered in slices.
                </p>
              </div>
            </Reveal>
          </div>

          {/* The specimen plate */}
          <div className="lg:col-span-5">
            <Reveal delay={160}>
              <figure
                aria-label={`${detail.title}, schematic`}
                className="blueprint relative aspect-[4/3] border border-border bg-surface"
              >
                <div className="absolute inset-0 bottom-[3.25rem] p-8 text-foreground/80 sm:p-10">
                  <ServiceSchematic slug={detail.slug} />
                </div>
                <figcaption className="absolute inset-x-0 bottom-0 flex h-[3.25rem] items-center justify-between border-t border-border px-5">
                  <span className="t-label text-muted">Specimen: {detail.short}</span>
                  <span aria-hidden="true" className="flex gap-1.5">
                    <span className="h-1.5 w-1.5 bg-accent" />
                    <span className="h-1.5 w-1.5 bg-border" />
                    <span className="h-1.5 w-1.5 bg-border" />
                  </span>
                </figcaption>
              </figure>
            </Reveal>
          </div>
        </div>
      </div>

      {/* Stack marquee, the toolchain, slowly passing (the kit list
          further down is the accessible source) */}
      <div className="border-y border-border py-4" aria-hidden="true">
        <div className="marquee overflow-hidden">
          <div className="marquee-track" style={{ animationDuration: "64s" }}>
            {[0, 1].map((copy) => (
              <ul key={copy} className="flex shrink-0 items-center">
                {[...detail.stack, ...detail.stack].map((item, i) => (
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
  );
}

/* ================================================================== */
/* The practice - editorial: photo rail left, copy + modes right       */
/* ================================================================== */

export function ServiceOverview({ detail }: { detail: ServiceDetail }) {
  const headingId = "overview-heading";
  return (
    <Section index="The Practice" labelledBy={headingId}>
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
        {/* Photo rail */}
        <div className="lg:col-span-5">
          <Reveal className="lg:sticky lg:top-28">
            <ImageReveal className="relative aspect-[4/5] overflow-hidden border border-border">
              <Image
                src={detail.image}
                alt={detail.imageCaption}
                fill
                sizes="(max-width: 1024px) 100vw, 480px"
                className="photo object-cover"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[rgb(16_19_25/0.4)] to-transparent"
              />
            </ImageReveal>
            <p className="t-caption mt-4 text-muted">{detail.imageCaption}</p>
          </Reveal>
        </div>

        {/* Editorial */}
        <div className="lg:col-span-7 lg:pl-6">
          <Reveal>
            <h2 id={headingId} className="t-dl max-w-[14ch]">
              The practice.
            </h2>
          </Reveal>
          <Reveal delay={120}>
            <div className="mt-8 max-w-[40rem] space-y-6 text-muted">
              <p className="t-body-lg">{detail.overview[0]}</p>
              <p className="t-body">{detail.overview[1]}</p>
            </div>
          </Reveal>
          <Reveal delay={200}>
            <div className="mt-12 border-t border-border">
              <p className="t-label pt-6 text-muted">Delivered as</p>
              <ul className="mt-2">
                {["Fixed-scope projects", "Staged programmes", "Retainer partnerships"].map((mode) => (
                  <li
                    key={mode}
                    className="group flex items-center gap-3.5 border-b border-border py-4"
                  >
                    <span
                      aria-hidden="true"
                      className="h-2 w-2 shrink-0 scale-0 bg-accent transition-transform duration-300 ease-[var(--ease-out-expo)] group-hover:scale-100"
                    />
                    <span className="t-h4 font-medium text-foreground/85 transition-transform duration-300 ease-[var(--ease-out-expo)] group-hover:translate-x-1">
                      {mode}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </div>
    </Section>
  );
}

/* ================================================================== */
/* FAQ - sand band, sticky heading left, accordion right               */
/* ================================================================== */

export function ServiceFaqs({ detail }: { detail: ServiceDetail }) {
  const headingId = `faq-${detail.slug}-heading`;
  return (
    <Section index="Questions" labelledBy={headingId} className="bg-surface-2/60">
      <div className="grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-28">
            <Reveal>
              <h2 id={headingId} className="t-dl max-w-[12ch]">
                Asked about {detail.short.toLowerCase()}.
              </h2>
              <p className="t-body mt-6 max-w-xs text-muted">
                The questions buyers raise before starting this kind of
                engagement, answered plainly.
              </p>
              <Link
                href="/contact"
                className="group/btn t-sm mt-8 inline-flex items-center gap-2 font-semibold text-foreground transition-colors hover:text-accent"
              >
                A question we missed?
                <svg
                  aria-hidden="true"
                  viewBox="0 0 14 14"
                  className="h-3 w-3 transition-transform duration-300 group-hover/btn:translate-x-[3px]"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                >
                  <path d="M1 7h11M7.5 2.5 12 7l-4.5 4.5" />
                </svg>
              </Link>
            </Reveal>
          </div>
        </div>
        <div className="lg:col-span-8">
          <Faq items={detail.faqs} label={`${detail.title}, frequently asked questions`} />
        </div>
      </div>
    </Section>
  );
}

/* ================================================================== */
/* Explore further - paper cross-links                                 */
/* ================================================================== */

export function ServiceCrossLinks({
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
            Where this service does its heaviest lifting, and the services
            that pair with it.
          </>
        }
      />
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
        <nav aria-label="Industries where this service lands" className="lg:col-span-7">
          <Reveal>
            <p className="t-label mb-5 text-muted">Where the work lands</p>
            <ul className="border-t border-border">
              {industries.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="group flex items-center justify-between gap-6 border-b border-border py-6"
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
                <Link href="/industries" className="group flex items-center gap-3 border-b border-border py-6">
                  <span aria-hidden="true" className="h-2 w-2 shrink-0 scale-0 bg-accent transition-transform duration-300 ease-[var(--ease-out-expo)] group-hover:scale-100" />
                  <span className="t-h4 text-foreground/80 transition-colors group-hover:text-foreground">
                    All industries
                  </span>
                </Link>
              </li>
            </ul>
          </Reveal>
        </nav>
        <nav aria-label="Related services" className="lg:col-span-5">
          <Reveal delay={120}>
            <p className="t-label mb-5 text-muted">Pairs well with</p>
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
                <Link href="/services" className="group flex items-center gap-3 border-b border-border py-5">
                  <span aria-hidden="true" className="h-2 w-2 shrink-0 scale-0 bg-accent transition-transform duration-300 ease-[var(--ease-out-expo)] group-hover:scale-100" />
                  <span className="t-h4 font-medium text-foreground/80 transition-colors group-hover:text-foreground">
                    All services
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
