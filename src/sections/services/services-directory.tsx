import Link from "next/link";
import { Section } from "@/components/ui/section";
import { SectionHeader } from "@/components/ui/section-header";
import { Reveal } from "@/components/ui/reveal";
import { ServiceIcon } from "@/components/shared/service-icon";
import { SERVICE_DETAILS } from "@/constants/services-detail";
import { CrewBand } from "@/sections/hire/crew-band";

/**
 * Services directory — paper hero plus the ten-service index in the
 * atlas grammar: hairline rows that invert to ink on hover, each opening
 * its service chapter.
 */

const CATALOGUE_ROWS = [
  { label: "Web platforms to AI agents", note: "the full span" },
  { label: "One connected team", note: "strategy to run" },
  { label: "Ten services, one standard", note: "the dossier way" },
];

export function ServicesDirectory() {
  return (
    <>
      <section aria-labelledby="services-heading" className="relative overflow-hidden">
        <div className="shell pb-20 pt-[calc(var(--nav-h)+4.5rem)] sm:pb-24">
          {/* Rail */}
          <div aria-hidden="true" className="mb-12 flex items-center gap-4 sm:mb-16">
            <span className="h-2 w-2 shrink-0 bg-accent" />
            <span className="t-label text-muted">Services</span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <div className="grid items-end gap-12 lg:grid-cols-12 lg:gap-10">
            <div className="lg:col-span-7">
              <Reveal>
                <h1 id="services-heading" className="t-statement max-w-[15ch]">
                  Everything a product needs. End to end
                  <span aria-hidden="true" className="text-accent">.</span>
                </h1>
              </Reveal>
              <Reveal delay={120}>
                <p className="t-body-lg mt-8 max-w-xl text-muted">
                  Ten services under one engineering standard, from the first
                  website to the AI agent answering your support queue. Each
                  opens into its own chapter below.
                </p>
              </Reveal>
            </div>

            {/* The catalogue card */}
            <div className="lg:col-span-5">
              <Reveal delay={200}>
                <div className="border border-border bg-surface p-7 sm:p-8">
                  <p className="t-label text-muted">The catalogue</p>
                  <ul className="mt-5 border-t border-border">
                    {CATALOGUE_ROWS.map((row) => (
                      <li
                        key={row.label}
                        className="flex items-center justify-between gap-4 border-b border-border py-3.5"
                      >
                        <span className="flex items-center gap-3.5">
                          <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 bg-accent" />
                          <span className="t-sm font-medium text-foreground/85">{row.label}</span>
                        </span>
                        <span className="t-label text-muted">{row.note}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-5 flex items-center gap-3">
                    <span aria-hidden="true" className="h-2 w-2 shrink-0 bg-accent" />
                    <p className="t-caption text-muted">Scoped in stages. Shipped in slices.</p>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* The directory, atlas grammar */}
      <Section id="directory" index="The Directory" labelledBy="directory-heading">
        <SectionHeader
          id="directory-heading"
          heading="The directory."
          lead={
            <>
              Every service we sell, one row each, what it is, what it
              includes, how it runs. Start where the pain is.
            </>
          }
        />
        <Reveal>
          <ul className="border-t border-border">
            {SERVICE_DETAILS.map((service) => (
              <li key={service.slug}>
                <Link
                  href={`/services/${service.slug}`}
                  aria-label={`Explore ${service.title}`}
                  className="group grid gap-5 border-b border-border px-2 py-8 transition-colors duration-300 ease-[var(--ease-out-expo)] hover:bg-foreground focus-visible:bg-foreground sm:grid-cols-12 sm:gap-8 sm:px-4 lg:py-9"
                >
                  <ServiceIcon
                    slug={service.slug}
                    className="h-9 w-9 shrink-0 text-foreground/75 transition-colors duration-300 group-hover:text-background [&_svg]:h-full [&_svg]:w-full"
                  />
                  <div className="sm:col-span-6">
                    <h3 className="t-h3 transition-colors duration-300 group-hover:text-background">
                      {service.title}
                    </h3>
                    <p className="t-body mt-3 max-w-lg text-muted transition-colors duration-300 group-hover:text-background/75">
                      {service.heroLead}
                    </p>
                  </div>
                  <ul
                    aria-label={`${service.title} stack`}
                    className="flex max-w-md flex-wrap content-start gap-1.5 sm:col-span-4 sm:self-center"
                  >
                    {service.stack.slice(0, 5).map((item) => (
                      <li
                        key={item}
                        className="t-caption rounded-[2px] border border-border px-2.5 py-1 text-muted transition-colors duration-300 group-hover:border-background/35 group-hover:text-background/75"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                  <span
                    aria-hidden="true"
                    className="hidden items-center justify-end self-center sm:col-span-1 sm:flex"
                  >
                    <svg
                      viewBox="0 0 14 14"
                      className="h-4 w-4 text-muted transition-all duration-300 ease-[var(--ease-out-expo)] group-hover:translate-x-[4px] group-hover:text-background"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                    >
                      <path d="M1 7h11M7.5 2.5 12 7l-4.5 4.5" />
                    </svg>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Reveal>
      </Section>
      <CrewBand variant="svc-index" />
    </>
  );
}
