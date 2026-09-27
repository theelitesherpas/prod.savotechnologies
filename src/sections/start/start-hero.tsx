import { Section } from "@/components/ui/section";
import { SectionHeader } from "@/components/ui/section-header";
import { Reveal } from "@/components/ui/reveal";
import { StartBrief } from "./start-brief";

/**
 * Start a Project - the detailed brief. Hero and guarantees on paper;
 * the wizard is the page's centerpiece; what happens next closes on ink.
 */

export function StartHero() {
  return (
    <section aria-labelledby="start-heading" className="relative overflow-hidden">
      <div className="shell pb-16 pt-[calc(var(--nav-h)+4.5rem)] sm:pb-20">
        {/* Rail */}
        <div aria-hidden="true" className="mb-12 flex items-center gap-4 sm:mb-16">
          <span className="h-2 w-2 shrink-0 bg-accent" />
          <span className="t-label text-muted">Start a Project</span>
          <span className="h-px flex-1 bg-border" />
        </div>

        <div className="grid items-end gap-12 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-7">
            <Reveal>
              <h1 id="start-heading" className="t-statement max-w-[15ch]">
                Tell us what you are building
                <span aria-hidden="true" className="text-accent">.</span>
              </h1>
            </Reveal>
            <Reveal delay={120}>
              <p className="t-body-lg mt-8 max-w-xl text-muted">
                One brief is all it takes. A senior engineer reads it, replies
                within one business day, and you get scope, timeline and a
                price, before any commitment.
              </p>
            </Reveal>
          </div>
          <div className="lg:col-span-5">
            <Reveal delay={200}>
              <div className="border border-border bg-surface p-7 sm:p-8">
                <p className="t-label text-muted">Two minutes</p>
                <p className="t-body mt-4 text-muted">
                  Three short steps, nothing binding, and an NDA available
                  before you share anything sensitive. The brief is the
                  beginning of the proposal, not a sales capture.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

export function StartBriefSection() {
  const headingId = "brief-heading";
  return (
    <Section index="The Brief" labelledBy={headingId}>
      <SectionHeader
        id={headingId}
        heading="Write the brief."
        lead={
          <>
            The more you tell us, the sharper the first reply. Everything
            goes to an engineer who can build it, never to a script.
          </>
        }
      />
      <StartBrief />
    </Section>
  );
}

const NEXT_STEPS = [
  { when: "Within 24 hours", what: "A senior engineer, not a sales rep, reads your brief and replies with first questions." },
  { when: "Day two to three", what: "A free 30 minute scoping call, goals, constraints, success metrics and a rough range." },
  { when: "Day three to five", what: "A written proposal with fixed milestones, transparent pricing and a start date you can hold us to." },
];

export function WhatHappensNext() {
  const headingId = "next-heading";
  return (
    <Section index="What Happens Next" chapter="ink" labelledBy={headingId}>
      <SectionHeader
        id={headingId}
        heading="What happens next."
        lead={
          <>
            A defined path from your brief to a working engagement, the
            same every time, so you always know where you stand.
          </>
        }
      />
      <Reveal>
        <ol className="relative space-y-10 sm:space-y-12">
          <div aria-hidden="true" className="absolute bottom-2 left-[5px] top-2 w-px bg-border" />
          {NEXT_STEPS.map((step, i) => (
            <li key={step.when} className={i % 2 === 1 ? "lg:ml-16" : ""}>
              <div className="relative pl-8 sm:pl-10">
                <span aria-hidden="true" className="absolute left-0 top-[0.45rem] h-[11px] w-[11px] border border-border bg-surface" />
                <p className="t-label text-accent-strong">{step.when}</p>
                <p className="t-body mt-3 max-w-lg text-muted">{step.what}</p>
              </div>
            </li>
          ))}
        </ol>
      </Reveal>
    </Section>
  );
}
