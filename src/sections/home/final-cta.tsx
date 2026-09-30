"use client";

import { useEnquiry } from "@/components/shared/enquiry-dialog";
import { Reveal } from "@/components/ui/reveal";
import { track } from "@/lib/analytics";

export function FinalCTA() {
  const { open } = useEnquiry();

  return (
    <section
      id="start"
      aria-labelledby="cta-heading"
      className="chapter-accent bg-background text-foreground"
    >
      <div className="shell py-14 sm:py-18 lg:py-22">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <Reveal>
              <h2 id="cta-heading" className="t-statement max-w-[13ch]">
                Have something ambitious in mind?
              </h2>
            </Reveal>
            <Reveal delay={120}>
              <p className="t-body-lg mt-8 max-w-xl text-muted">
                Whether it&apos;s a website, mobile product, software platform
                or AI system, let&apos;s explore what we can build together.
              </p>
            </Reveal>
          </div>
          <div className="flex flex-wrap items-end gap-4 lg:col-span-4 lg:justify-end">
            <Reveal delay={200} className="flex flex-wrap gap-4">
              <button
                onClick={() => {
                  track("start_project_click", { location: "final-cta" });
                  open("final-cta");
                }}
                className="group/btn inline-flex h-[3.25rem] items-center justify-center gap-2.5 rounded-[2px] bg-foreground px-7 text-base font-semibold tracking-[-0.01em] text-background transition-colors duration-300 ease-[var(--ease-out-expo)] hover:bg-accent-hover"
              >
                Start a Project
                <svg aria-hidden="true" viewBox="0 0 14 14" className="h-3 w-3 transition-transform duration-300 group-hover/btn:translate-x-[3px]" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <path d="M1 7h11M7.5 2.5 12 7l-4.5 4.5" />
                </svg>
              </button>
              <button
                onClick={() => open("final-cta-talk")}
                className="inline-flex h-[3.25rem] items-center justify-center rounded-[2px] border border-foreground/40 px-7 text-base font-semibold transition-colors duration-300 ease-[var(--ease-out-expo)] hover:border-foreground hover:bg-foreground/[0.06]"
              >
                Let&apos;s Talk
              </button>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
