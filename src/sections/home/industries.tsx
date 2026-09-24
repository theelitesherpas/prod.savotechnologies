import { Section } from "@/components/ui/section";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeader } from "@/components/ui/section-header";
import { INDUSTRIES } from "@/constants/content";

export function Industries() {
  return (
    <Section id="industries" index="12 — Industries" labelledBy="industries-heading">
      <SectionHeader
        id="industries-heading"
        heading="Technology without industry boundaries."
        lead={
          <>
            The fundamentals of good product thinking transfer. We adapt them
            to the realities of each sector we work in.
          </>
        }
      />

      <Reveal delay={160}>
        <ul className="mt-16 grid grid-cols-1 gap-x-10 border-t border-border sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {INDUSTRIES.map((industry) => (
            <li key={industry} className="group flex items-center gap-3.5 border-b border-border py-5">
              <span
                aria-hidden="true"
                className="h-2 w-2 shrink-0 scale-0 bg-accent transition-transform duration-300 ease-[var(--ease-out-expo)] group-hover:scale-100"
              />
              <span className="t-h4 font-medium text-foreground/85 transition-colors group-hover:text-foreground">
                {industry}
              </span>
            </li>
          ))}
        </ul>
      </Reveal>
    </Section>
  );
}
