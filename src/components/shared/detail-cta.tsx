"use client";

import Link from "next/link";
import { useEnquiry } from "@/components/shared/enquiry-dialog";
import { Reveal } from "@/components/ui/reveal";
import { track } from "@/lib/analytics";

/**
 * Closing moment - the vermilion chapter for detail pages. One shout per
 * page, parameterised copy, same controls as the site-wide close.
 */
export function DetailCta({
  headingId,
  heading,
  lead,
  location,
  secondaryLabel = "Let's Talk",
  secondaryHref,
}: {
  headingId: string;
  heading: string;
  lead: string;
  location: string;
  secondaryLabel?: string;
  /** When set, the secondary control links instead of opening the drawer. */
  secondaryHref?: string;
}) {
  const { open } = useEnquiry();

  return (
    <section aria-labelledby={headingId} className="chapter-accent bg-background text-foreground">
      <div className="shell py-20 sm:py-28">
        <div className="grid items-end gap-10 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <Reveal>
              <h2 id={headingId} className="t-h1 max-w-[18ch]">
                {heading}
              </h2>
            </Reveal>
            <Reveal delay={120}>
              <p className="t-body-lg mt-6 max-w-xl text-muted">{lead}</p>
            </Reveal>
          </div>
          <div className="flex flex-wrap items-center gap-4 lg:col-span-4 lg:justify-end">
            <Reveal delay={200} className="flex flex-wrap gap-4">
              <button
                onClick={() => {
                  track("start_project_click", { location });
                  open(location);
                }}
                className="group/btn inline-flex h-[3.25rem] items-center justify-center gap-2.5 rounded-[2px] bg-foreground px-7 text-base font-semibold tracking-[-0.01em] text-background transition-colors duration-300 ease-[var(--ease-out-expo)] hover:bg-accent-hover"
              >
                Start a Project
                <svg aria-hidden="true" viewBox="0 0 14 14" className="h-3 w-3 transition-transform duration-300 group-hover/btn:translate-x-[3px]" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <path d="M1 7h11M7.5 2.5 12 7l-4.5 4.5" />
                </svg>
              </button>
              {secondaryHref ? (
                <Link
                  href={secondaryHref}
                  className="inline-flex h-[3.25rem] items-center justify-center rounded-[2px] border border-foreground/40 px-7 text-base font-semibold transition-colors duration-300 ease-[var(--ease-out-expo)] hover:border-foreground hover:bg-foreground/[0.06]"
                >
                  {secondaryLabel}
                </Link>
              ) : (
                <button
                  onClick={() => open(`${location}-talk`)}
                  className="inline-flex h-[3.25rem] items-center justify-center rounded-[2px] border border-foreground/40 px-7 text-base font-semibold transition-colors duration-300 ease-[var(--ease-out-expo)] hover:border-foreground hover:bg-foreground/[0.06]"
                >
                  {secondaryLabel}
                </button>
              )}
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
