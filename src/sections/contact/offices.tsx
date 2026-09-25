import { Section } from "@/components/ui/section";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeader } from "@/components/ui/section-header";
import { RegionArt } from "@/components/shared/region-art";
import { OFFICES, PRESENCE_FALLBACK_NOTE } from "@/constants/site";
import { PRESENCE_LABEL } from "@/content/demo";
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
              <p className="t-label mt-2 text-accent">{PRESENCE_LABEL[office.kind]}</p>
              {office.addressLine ? (
                <p className="t-caption mt-3 flex-1 leading-relaxed text-muted">{office.addressLine}</p>
              ) : (
                <p className="t-caption mt-3 flex-1 leading-relaxed text-muted">{office.description}</p>
              )}
              {office.phones && office.phones.length > 0 ? (
                <div className="mt-4 space-y-2">
                  {office.phones.map((phone) => (
                    <a
                      key={phone.e164}
                      href={`tel:${phone.e164}`}
                      className="flex items-center gap-2 text-[0.875rem] font-medium tnum text-foreground/85 transition-colors hover:text-accent"
                    >
                      <MobileGlyph />
                      {phone.display}
                      {phone.label ? <span className="t-caption text-muted">({phone.label})</span> : null}
                    </a>
                  ))}
                </div>
              ) : null}
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
