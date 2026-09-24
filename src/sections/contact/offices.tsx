import { Section } from "@/components/ui/section";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeader } from "@/components/ui/section-header";
import { RegionArt } from "@/components/shared/region-art";
import { OFFICES } from "@/constants/site";

/**
 * Global offices — hairline grid on the sand band, one identity vector
 * per region. The strokes ink themselves in on scroll (pathLength trick),
 * like every v6 infographic. Cards carry designation, address and mobile
 * where verified; bracketed slots stay until the company supplies them.
 */
export function Offices() {
  return (
    <Section
      id="offices"
      index="Offices"
      labelledBy="offices-heading"
      className="bg-surface-2/60"
    >
      <SectionHeader
        id="offices-heading"
        heading="Six regions, one accountable team."
        lead="Strategy and engineering run from the India headquarters; the head office sits in Zürich. Offices in Riyadh, London, Sydney and the USA cover their regions — wherever you are, someone senior is awake."
      />

      <div className="grid grid-cols-1 gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {OFFICES.map((office, i) => (
          <Reveal key={office.id} delay={i * 90} className="bg-background">
            <div className="flex h-full flex-col p-6 sm:p-7">
              <RegionArt id={office.id} draw className="mb-6 h-11 w-16" />
              <h3 className="t-h4">{office.region}</h3>
              <p className="t-caption mt-2.5 flex-1 leading-relaxed text-muted">
                {office.address.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </p>
              {office.mobile && office.mobileE164 ? (
                <a
                  href={`tel:${office.mobileE164}`}
                  className="mt-4 flex items-center gap-2 text-[0.875rem] font-medium tnum text-foreground/85 transition-colors hover:text-accent"
                >
                  <MobileGlyph />
                  {office.mobile}
                </a>
              ) : (
                <p className="t-caption mt-4 flex items-center gap-2 text-muted/70">
                  <MobileGlyph />
                  [Local mobile pending]
                </p>
              )}
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

function MobileGlyph() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-3.5 w-3.5 shrink-0 text-muted"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="8" y="3" width="8" height="18" rx="2" />
      <path d="M11 18.5h2" />
    </svg>
  );
}
