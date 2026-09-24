import Link from "next/link";
import { Section } from "@/components/ui/section";
import { SectionHeader } from "@/components/ui/section-header";
import { Reveal } from "@/components/ui/reveal";
import { IndustryIcon } from "@/components/shared/industry-icon";
import { INDUSTRIES_ATLAS } from "@/constants/industries";

/**
 * The industry atlas — the page's centerpiece. Ten hairline rows, each a
 * gateway: index, hand-drawn sector icon, lead copy and capability chips,
 * with the whole row inverting to ink on hover (the cabinet grammar) and
 * linking to the sector's detail chapter at /industries/[slug]/.
 */
export function IndustryAtlas() {
  return (
    <Section id="atlas" index="The Atlas" labelledBy="atlas-heading">
      <SectionHeader
        id="atlas-heading"
        heading="The atlas."
        lead={
          <>
            Every sector below opens into its own chapter, what we build
            there, the constraints we respect, the systems we join. Start
            with yours.
          </>
        }
      />

      <Reveal>
        <ul className="border-t border-border">
          {INDUSTRIES_ATLAS.map((industry) => (
            <li key={industry.id} id={industry.id} className="scroll-mt-[calc(var(--nav-h)+2rem)]">
              <Link
                href={industry.href}
                aria-label={`Explore ${industry.title}`}
                className="group grid gap-5 border-b border-border px-2 py-8 transition-colors duration-300 ease-[var(--ease-out-expo)] hover:bg-foreground focus-visible:bg-foreground sm:grid-cols-12 sm:gap-8 sm:px-4 lg:py-9"
              >
                {/* Icon */}
                <IndustryIcon
                  id={industry.id}
                  className="h-9 w-9 shrink-0 text-foreground/75 transition-colors duration-300 group-hover:text-background [&_svg]:h-full [&_svg]:w-full"
                />

                {/* Title + lead */}
                <div className="sm:col-span-6">
                  <h3 className="t-h3 transition-colors duration-300 group-hover:text-background">
                    {industry.title}
                  </h3>
                  <p className="t-body mt-3 max-w-lg text-muted transition-colors duration-300 group-hover:text-background/75">
                    {industry.lead}
                  </p>
                </div>

                {/* Capability chips */}
                <ul
                  aria-label={`${industry.title} capabilities`}
                  className="flex max-w-md flex-wrap content-start gap-1.5 sm:col-span-4 sm:self-center"
                >
                  {industry.capabilities.map((cap) => (
                    <li
                      key={cap}
                      className="t-caption rounded-[2px] border border-border px-2.5 py-1 text-muted transition-colors duration-300 group-hover:border-background/35 group-hover:text-background/75"
                    >
                      {cap}
                    </li>
                  ))}
                </ul>

                {/* Arrow */}
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
  );
}
