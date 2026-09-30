import { Section } from "@/components/ui/section";
import { Reveal } from "@/components/ui/reveal";
import { TrackView } from "@/components/ui/track-view";
import { AI_PIPELINE, AI_TRUST_POINTS, AI_USE_CASES } from "@/constants/content";

export function AISystems() {
  return (
    <Section id="ai" index="Intelligence" chapter="ink" labelledBy="ai-heading" className="!py-14 sm:!py-18 lg:!py-22">
      <TrackView event="ai_section_engagement">
        <div className="grid gap-16 lg:grid-cols-12 lg:gap-12">
          {/* Copy column */}
          <div className="lg:col-span-6">
            <Reveal>
              <h2 id="ai-heading" className="t-dl max-w-[15ch]">
                AI should do more than answer questions.
              </h2>
            </Reveal>
            <Reveal delay={120}>
              <p className="t-body-lg mt-8 max-w-xl text-muted">
                Savo builds AI systems capable of working across information,
                applications and workflows, from customer support and research
                to document processing, sales operations and internal automation.
              </p>
            </Reveal>

            <Reveal delay={200}>
              <div className="mt-14">
                <p className="t-label mb-6 text-muted">Selected use cases</p>
                <ul className="divide-y divide-border border-y border-border">
                  {AI_USE_CASES.map((useCase) => (
                    <li
                      key={useCase}
                      className="group flex items-center gap-3.5 py-4 transition-colors"
                    >
                      <span
                        aria-hidden="true"
                        className="h-2 w-2 shrink-0 scale-0 bg-accent transition-transform duration-300 ease-[var(--ease-out-expo)] group-hover:scale-100"
                      />
                      <span className="t-h4 transition-transform duration-300 ease-[var(--ease-out-expo)] group-hover:translate-x-1">
                        {useCase}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>

            <Reveal delay={260}>
              <div className="mt-14 border border-border bg-surface p-7 sm:p-8">
                <p className="t-h4">
                  Production AI requires more than connecting an API.
                </p>
                <p className="t-sm mt-3 text-muted">
                  Every system we ship is engineered for the real world:
                </p>
                <ul className="mt-5 flex flex-wrap gap-2" aria-label="Production AI requirements">
                  {AI_TRUST_POINTS.map((point) => (
                    <li
                      key={point}
                      className="t-caption rounded-[2px] border border-border bg-surface-2 px-2.5 py-1 text-foreground/80"
                    >
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>

          {/* Pipeline column */}
          <div className="lg:col-span-6">
            <Reveal delay={150} className="lg:sticky lg:top-28">
              <figure
                aria-label="How a Savo AI agent works: an event triggers the agent, which reasons over company data and tools, acts on business systems, and defers to human approval when required."
                className="blueprint relative border border-border bg-surface p-6 sm:p-9"
              >
                <figcaption className="t-label mb-8 flex items-center justify-between text-muted">
                  <span>Agent architecture</span>
                  <span aria-hidden="true" className="flex gap-1.5">
                    <span className="h-1.5 w-1.5 bg-accent" />
                    <span className="h-1.5 w-1.5 bg-border" />
                    <span className="h-1.5 w-1.5 bg-border" />
                  </span>
                </figcaption>

                <ol className="relative ml-1 space-y-0">
                  {/* Spine */}
                  <span aria-hidden="true" className="absolute bottom-5 left-0 top-5 w-px bg-border" />
                  <span aria-hidden="true" className="pipeline-dot absolute left-0 top-5 h-2 w-2 -translate-x-[3.5px] bg-accent" />

                  {AI_PIPELINE.map((stage, i) => {
                    const isLast = i === AI_PIPELINE.length - 1;
                    return (
                      <li key={stage.label} className="relative flex items-center gap-6 py-[0.9rem]">
                        <span
                          aria-hidden="true"
                          className={`relative z-10 -ml-[5px] shrink-0 border border-border bg-surface ${
                            isLast ? "h-2.5 w-2.5 rounded-full" : "h-2.5 w-2.5"
                          } ${isLast ? "border-accent" : ""}`}
                        />
                        <div className="flex w-full flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 border-b border-border/60 pb-[0.9rem] pr-1">
                          <span className={`t-sm font-semibold ${isLast ? "text-accent" : "text-foreground"}`}>
                            {stage.label}
                          </span>
                          <span className="t-label text-muted">{stage.note}</span>
                        </div>
                      </li>
                    );
                  })}
                </ol>

                <p className="t-caption mt-6 text-muted">
                  Supervised by design, every agent knows what it may do alone,
                  and what it must escalate.
                </p>
              </figure>
            </Reveal>
          </div>
        </div>
      </TrackView>
    </Section>
  );
}
