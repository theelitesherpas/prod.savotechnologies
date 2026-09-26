import { Section } from "@/components/ui/section";
import { SectionHeader } from "@/components/ui/section-header";
import { Reveal } from "@/components/ui/reveal";
import type { CaseDiscipline } from "@/constants/case-studies";
import { CaseStudyCard } from "./case-study-card";

/**
 * One discipline chapter of the dossier - index rail, SectionHeader,
 * capability chips, then the specimen entries: featured full-width,
 * the rest in a two-up editorial grid.
 */
export function DisciplineSection({ discipline }: { discipline: CaseDiscipline }) {
  const featured = discipline.entries.filter((e) => e.featured);
  const rest = discipline.entries.filter((e) => !e.featured);
  const headingId = `cs-${discipline.id}-heading`;

  return (
    <Section
      id={discipline.id}
      index={discipline.title}
      labelledBy={headingId}
      className="scroll-mt-[calc(var(--nav-h)+2rem)]"
    >
      <SectionHeader id={headingId} heading={`${discipline.title}.`} lead={discipline.lead} />

      <Reveal>
        <ul
          className="mb-12 flex max-w-3xl flex-wrap gap-2"
          aria-label={`${discipline.title} engagement types`}
        >
          {discipline.capabilities.map((cap) => (
            <li
              key={cap}
              className="t-caption rounded-[2px] border border-border px-2.5 py-1 text-muted"
            >
              {cap}
            </li>
          ))}
        </ul>
      </Reveal>

      <div className="space-y-8">
        {featured.map((entry, i) => (
          <Reveal key={entry.slug ?? `featured-${entry.sector}-${i}`}>
            <CaseStudyCard
              entry={entry}
              variant={discipline.id}
              aspect="aspect-[16/9] sm:aspect-[16/7]"
              sizes="(max-width: 1536px) 100vw, 1440px"
            />
          </Reveal>
        ))}
        {rest.length > 0 && (
          <div className="grid gap-8 md:grid-cols-2">
            {rest.map((entry, i) => (
              <Reveal key={entry.slug ?? `pending-${entry.sector}-${i}`} delay={i * 120}>
                <CaseStudyCard
                  entry={entry}
                  variant={discipline.id}
                  aspect="aspect-[16/10]"
                  sizes="(max-width: 768px) 100vw, 640px"
                />
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </Section>
  );
}
