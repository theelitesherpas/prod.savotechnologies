import { Section } from "@/components/ui/section";
import { SectionHeader } from "@/components/ui/section-header";
import { Reveal } from "@/components/ui/reveal";

/**
 * DESIGNED BEAUTIFULLY. ENGINEERED SERIOUSLY. (master spec Part 52)
 *
 * The Savo concept connecting design quality with serious engineering.
 * Compact, typography-first - the qualities named in the spec, no badges.
 */

const QUALITIES = [
  ["Performance", "Fast is a feature. Server-first rendering, lean JavaScript, measured budgets."],
  ["Security", "Validated inputs, scoped access, rate limits, secrets kept server-side."],
  ["Accessibility", "Interfaces that work for every user, engineered to WCAG 2.2 AA."],
  ["Testing", "Critical paths covered by automated tests before release, not after complaints."],
  ["Scalability", "Architecture that grows with usage instead of fighting it."],
  ["Maintainability", "Code and documentation the next engineer can actually work with."],
  ["Monitoring", "Errors surface to us. Users should never be the alerting system."],
  ["Analytics", "Events that answer business questions, not vanity dashboards."],
  ["Searchability", "Structured, machine-readable, findable by people and AI systems alike."],
] as const;

export function EngineeredSeriously() {
  const headingId = "engineered-heading";
  return (
    <Section index="Standard" chapter="ink" labelledBy={headingId}>
      <SectionHeader
        id={headingId}
        heading={<>Designed beautifully. Engineered seriously.</>}
        lead={
          <>
            Design earns attention. Engineering keeps it. The same team is
            accountable for both.
          </>
        }
      />
      <Reveal>
        <dl className="grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
          {QUALITIES.map(([k, v]) => (
            <div key={k} className="border-l border-border pl-5">
              <dt className="t-h4 font-serif">{k}</dt>
              <dd className="t-sm mt-2 leading-relaxed text-muted">{v}</dd>
            </div>
          ))}
        </dl>
      </Reveal>
    </Section>
  );
}
