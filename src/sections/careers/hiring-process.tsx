import { Section } from "@/components/ui/section";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeader } from "@/components/ui/section-header";
import { HIRING_STEPS } from "@/constants/careers";

/**
 * The four-step hiring promise - sand band, numbered hairline cells.
 * Version-1 process, tightened copy. No ghosting, ever.
 */
export function HiringProcess() {
  return (
    <Section
      id="hiring"
      index="Hiring"
      labelledBy="hiring-heading"
      className="bg-surface-2/60"
    >
      <SectionHeader
        id="hiring-heading"
        heading="Honest hiring, four steps."
        lead="Every step has a named owner and a date. You always know where you stand, no ghosting, no endless rounds."
      />

      <Reveal>
        <ol className="grid grid-cols-1 gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
          {HIRING_STEPS.map((step) => (
            <li key={step.step} className="flex flex-col bg-background p-6 sm:p-7">
              <span aria-hidden="true" className="h-2 w-2 shrink-0 bg-accent" />
              <h3 className="t-h3 mt-5">{step.title}</h3>
              <p className="t-sm mt-3 text-muted">{step.text}</p>
            </li>
          ))}
        </ol>
      </Reveal>
    </Section>
  );
}
