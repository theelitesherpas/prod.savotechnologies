import { Reveal } from "@/components/ui/reveal";

/**
 * Contact page hero — statement opening with the response-time specimen
 * on the right rail. Content carried from version 1, rendered in the
 * v6 document language (index rail, serif statement, hairline card).
 */
export function ContactHero() {
  return (
    <section aria-labelledby="contact-heading" className="relative overflow-hidden">
      <div className="shell pb-20 pt-[calc(var(--nav-h)+4.5rem)] sm:pb-28">
        {/* Index rail */}
        <div aria-hidden="true" className="mb-12 flex items-center gap-4 sm:mb-16">
          <span aria-hidden="true" className="h-2 w-2 shrink-0 bg-accent" />
          <span className="t-label text-muted">Contact</span>
          <span className="h-px flex-1 bg-border" />
        </div>

        <div className="grid items-end gap-12 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-8">
            <Reveal>
              <h1 id="contact-heading" className="t-statement max-w-[16ch]">
                Talk to the people who will build it
                <span aria-hidden="true" className="text-accent">.</span>
              </h1>
            </Reveal>
            <Reveal delay={120}>
              <p className="t-body-lg mt-8 max-w-xl text-muted">
                No gatekeeping, no discovery paywalls. Tell us what you are
                thinking about and a senior consultant replies within one
                business day.
              </p>
            </Reveal>
          </div>

          {/* Response-time specimen */}
          <div className="lg:col-span-4">
            <Reveal delay={200}>
              <div className="border border-border bg-surface p-7 sm:p-8">
                <p className="t-label text-muted">Response time</p>
                <p className="t-dl mt-3 tnum">
                  &lt;24h
                  <span aria-hidden="true" className="ml-2 inline-block h-2.5 w-2.5 bg-accent align-baseline" />
                </p>
                <p className="t-sm mt-3 text-muted">
                  First reply, every business day. NDA on request.
                </p>
                <div className="mt-6 flex items-center gap-3 border-t border-border pt-5">
                  <span aria-hidden="true" className="h-2 w-2 shrink-0 bg-accent" />
                  <p className="t-caption text-muted">
                    Every message reaches a human — never a ticket queue.
                  </p>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
