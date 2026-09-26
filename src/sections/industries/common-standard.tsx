import { Section } from "@/components/ui/section";
import { SectionHeader } from "@/components/ui/section-header";
import { Reveal } from "@/components/ui/reveal";
import { INDUSTRY_FOUNDATIONS } from "@/constants/industries";

/**
 * The common standard - ink chapter. What carries across all ten sectors:
 * the load-bearing walls under every engagement. Hairline gap-px grid on
 * the blue-black chapter, square-node marks instead of icons.
 */
export function CommonStandard() {
  return (
    <Section
      id="standard"
      chapter="ink"
      index="The Common Standard"
      labelledBy="standard-heading"
    >
      <SectionHeader
        id="standard-heading"
        heading="What carries across all ten."
        lead={
          <>
            Sector knowledge sets the vocabulary. These are the load-bearing
            walls under every engagement, whatever the industry.
          </>
        }
      />

      <Reveal>
        <ul className="grid grid-cols-1 gap-px border border-border bg-border md:grid-cols-2">
          {INDUSTRY_FOUNDATIONS.map((foundation) => (
            <li
              key={foundation.title}
              className="flex flex-col gap-6 bg-background p-7 sm:p-9"
            >
              <div className="flex items-start justify-between gap-4">
                <h3 className="t-h3">{foundation.title}</h3>
                <span aria-hidden="true" className="mt-2 h-2 w-2 shrink-0 bg-accent" />
              </div>
              <p className="t-body max-w-lg text-muted">{foundation.text}</p>
              <ul
                aria-label={`${foundation.title} practices`}
                className="mt-auto flex flex-wrap gap-x-6 gap-y-2 border-t border-border pt-5"
              >
                {foundation.points.map((point) => (
                  <li key={point} className="flex items-center gap-2.5">
                    <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 bg-accent" />
                    <span className="t-label text-muted">{point}</span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </Reveal>
    </Section>
  );
}
