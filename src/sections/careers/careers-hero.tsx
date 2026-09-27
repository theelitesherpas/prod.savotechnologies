import { Reveal } from "@/components/ui/reveal";
import type { Role } from "@/constants/careers";
import { CodeResultLoop } from "./code-result-loop";

/**
 * Careers hero - the ink chapter opens below the navigation bar (a paper
 * strip stays behind the fixed header, exactly like every other page), then
 * the statement, the at-a-glance facts strip, and the developer specimen:
 * an animated code→UI loop - careers.js writes itself, then the interface
 * it renders builds in, over and over.
 */
export function CareersHero({ roles }: { roles: Role[] }) {
  const facts = [
    { v: String(roles.length), l: "open roles" },
    { v: "Remote", l: "first · India" },
    { v: "4 steps", l: "to an offer" },
    { v: "<2 days", l: "reply, always" },
  ];

  return (
    <section aria-labelledby="careers-heading" className="relative bg-background pt-[var(--nav-h)]">
      <div className="chapter-ink relative overflow-hidden bg-background text-foreground">
        <div className="shell pb-20 pt-[4.5rem] sm:pb-28">
          {/* Index rail */}
          <div aria-hidden="true" className="mb-12 flex items-center gap-4 sm:mb-16">
            <span aria-hidden="true" className="h-2 w-2 shrink-0 bg-accent" />
          <span className="t-label text-muted">Careers</span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-10">
            <div className="lg:col-span-7">
              <Reveal>
                <h1 id="careers-heading" className="t-statement max-w-[15ch]">
                  Ship work you are proud to sign
                  <span aria-hidden="true" className="text-accent">.</span>
                </h1>
              </Reveal>
              <Reveal delay={120}>
                <p className="t-body-lg mt-8 max-w-xl text-muted">
                  Every commit you push here lands in a real product: hospital
                  systems, payment rails, AI agents in production. Small teams,
                  genuine ownership, office-first in Indore with hybrid options.
                </p>
              </Reveal>

              {/* Facts strip */}
              <Reveal delay={200}>
                <dl className="mt-12 grid grid-cols-2 gap-px border border-border bg-border sm:grid-cols-4">
                  {facts.map((f) => (
                    <div key={f.l} className="flex flex-col bg-background p-5 sm:p-6">
                      <dd className="t-h1 tnum">{f.v}</dd>
                      <dt className="t-label order-2 mt-2 text-muted">{f.l}</dt>
                    </div>
                  ))}
                </dl>
              </Reveal>
            </div>

            {/* Developer specimen, the code, then the UI it renders, in a loop */}
            <div className="lg:col-span-5">
              <Reveal delay={260}>
                <CodeResultLoop />
              </Reveal>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
