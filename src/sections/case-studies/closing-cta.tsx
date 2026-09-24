"use client";

import { useEnquiry } from "@/components/shared/enquiry-dialog";
import { Reveal } from "@/components/ui/reveal";
import { track } from "@/lib/analytics";

/**
 * Closing moment — the vermilion chapter, the page's single shout. The
 * visitor who just read the dossier policy is invited to become its
 * first verifiable entry.
 */
export function CaseStudiesCta() {
  const { open } = useEnquiry();

  return (
    <section aria-labelledby="cs-cta-heading" className="chapter-accent bg-background text-foreground">
      <div className="shell py-20 sm:py-28">
        <div className="grid items-end gap-10 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <Reveal>
              <h2 id="cs-cta-heading" className="t-h1 max-w-[18ch]">
                Your dossier could be the first filed here.
              </h2>
            </Reveal>
            <Reveal delay={120}>
              <p className="t-body-lg mt-6 max-w-xl text-muted">
                Bring us the brief. When the results verify, your project
                takes its place in the cabinet — name, numbers and all.
              </p>
            </Reveal>
          </div>
          <div className="flex flex-wrap items-center gap-4 lg:col-span-4 lg:justify-end">
            <Reveal delay={200} className="flex flex-wrap gap-4">
              <button
                onClick={() => {
                  track("start_project_click", { location: "case-studies-cta" });
                  open("case-studies-cta");
                }}
                className="group/btn inline-flex h-[3.25rem] items-center justify-center gap-2.5 rounded-[2px] bg-foreground px-7 text-base font-semibold tracking-[-0.01em] text-background transition-colors duration-300 ease-[var(--ease-out-expo)] hover:bg-accent-hover"
              >
                Start a Project
                <svg aria-hidden="true" viewBox="0 0 14 14" className="h-3 w-3 transition-transform duration-300 group-hover/btn:translate-x-[3px]" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <path d="M1 7h11M7.5 2.5 12 7l-4.5 4.5" />
                </svg>
              </button>
              <button
                onClick={() => open("case-studies-cta-talk")}
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
