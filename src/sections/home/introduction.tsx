import { Section } from "@/components/ui/section";
import { Reveal } from "@/components/ui/reveal";

const CHAIN = ["Strategy", "Design", "Technology", "Intelligence", "Growth"] as const;

export function Introduction() {
  return (
    <Section id="studio" index="02 — The Studio" labelledBy="studio-heading">
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-7">
          <Reveal>
            <h2 id="studio-heading" className="t-dl max-w-[16ch]">
              One partner from idea to scale.
            </h2>
          </Reveal>
        </div>
        <div className="lg:col-span-5 lg:pt-4">
          <Reveal delay={120}>
            <div className="max-w-[42rem] space-y-6 border-l border-border pl-8 text-muted lg:pt-2">
              <p className="t-body-lg">
                SAVO brings strategy, product design, software engineering,
                artificial intelligence and digital growth under one team.
              </p>
              <p className="t-body">
                We don&apos;t simply deliver screens or code. We help shape the
                product, engineer the technology, launch it properly — and keep
                improving what happens afterward.
              </p>
            </div>
          </Reveal>
        </div>
      </div>

      <Reveal delay={200}>
        <ol className="mt-20 flex flex-wrap items-center gap-x-4 gap-y-3 sm:mt-24" aria-label="How we work, end to end">
          {CHAIN.map((step, i) => (
            <li key={step} className="flex items-center gap-4">
              <span className="t-label tnum text-muted">{String(i + 1).padStart(2, "0")}</span>
              <span className="t-h4">{step}</span>
              {i < CHAIN.length - 1 ? (
                <span aria-hidden="true" className="ml-2 h-px w-8 bg-border sm:w-12" />
              ) : (
                <span aria-hidden="true" className="ml-2 h-2 w-2 bg-accent" />
              )}
            </li>
          ))}
        </ol>
      </Reveal>
    </Section>
  );
}
