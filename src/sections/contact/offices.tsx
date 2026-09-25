import { Section } from "@/components/ui/section";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeader } from "@/components/ui/section-header";
import { RegionArt } from "@/components/shared/region-art";
import { OFFICES, PRESENCE_FALLBACK_NOTE } from "@/constants/site";
import { IS_DEMO } from "@/lib/content-mode";

/**
 * Global presence — hairline grid on the sand band, one identity vector
 * per region. The strokes ink themselves in on scroll (pathLength trick),
 * like every v6 infographic. Verified HQ first; market presences are
 * clearly worded as markets (demo content, gated by CONTENT_MODE) — never
 * a fabricated street address or an invented office phone.
 */
export function Offices() {
  return (
    <Section
      id="offices"
      index="Presence"
      labelledBy="offices-heading"
      className="bg-surface-2/60"
    >
      <SectionHeader
        id="offices-heading"
        heading={IS_DEMO ? "Six regions, one accountable team." : "One accountable team, worldwide."}
        lead={
          IS_DEMO
            ? "Engineering, design and delivery run from the Indore headquarters, with market presence across Switzerland, the GCC, Australia, the UK and the US — wherever you are, someone senior is awake."
            : PRESENCE_FALLBACK_NOTE
        }
      />

      <div className="grid grid-cols-1 gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {OFFICES.map((office, i) => (
          <Reveal key={office.id} delay={i * 90} className="bg-background">
            <div className="flex h-full flex-col p-6 sm:p-7">
              <RegionArt id={office.id} draw className="mb-6 h-11 w-16" />
              <h3 className="t-h4">{office.region}</h3>
              <p className="t-label mt-2 text-accent">
                {office.kind === "hq" ? "Primary Operations" : office.cityLine}
              </p>
              <p className="t-caption mt-2.5 flex-1 leading-relaxed text-muted">
                {office.addressLine ?? office.description}
              </p>
              {office.mobile && office.mobileE164 ? (
                <div className="mt-4 space-y-2">
                  <a
                    href={`tel:${office.mobileE164}`}
                    className="flex items-center gap-2 text-[0.875rem] font-medium tnum text-foreground/85 transition-colors hover:text-accent"
                  >
                    <MobileGlyph />
                    {office.mobile}
                  </a>
                  {office.mobile2 && office.mobile2E164 ? (
                    <a
                      href={`tel:${office.mobile2E164}`}
                      className="flex items-center gap-2 text-[0.875rem] font-medium tnum text-foreground/85 transition-colors hover:text-accent"
                    >
                      <MobileGlyph />
                      <span className="t-caption text-muted">{office.mobile2Label}</span>
                      {office.mobile2}
                    </a>
                  ) : null}
                </div>
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
