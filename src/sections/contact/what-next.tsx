import { Reveal } from "@/components/ui/reveal";
import { WHAT_HAPPENS_NEXT } from "@/constants/contact";

/**
 * After-send expectations — an ink band that sets the process straight:
 * what actually happens once the message leaves the form.
 */
export function WhatNext() {
  return (
    <section
      aria-labelledby="what-next-heading"
      className="chapter-ink border-y border-border bg-background"
    >
      <div className="shell py-16 sm:py-20">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
          <h2 id="what-next-heading" className="t-h2">
            What happens after you hit send.
          </h2>
          <p className="t-caption max-w-xs text-muted">
            No autoresponders, no &ldquo;we&apos;ll be in touch&rdquo; — a defined
            path from your message to a working engagement.
          </p>
        </div>

        <Reveal>
          <ol className="grid grid-cols-1 gap-px border border-border bg-border sm:grid-cols-3">
            {WHAT_HAPPENS_NEXT.map((step) => (
              <li key={step.step} className="flex flex-col bg-background p-6 sm:p-7">
                <span aria-hidden="true" className="h-2 w-2 shrink-0 bg-accent" />
                <h3 className="t-h3 mt-5">{step.title}</h3>
                <p className="t-sm mt-3 text-muted">{step.text}</p>
              </li>
            ))}
          </ol>
        </Reveal>
      </div>
    </section>
  );
}
