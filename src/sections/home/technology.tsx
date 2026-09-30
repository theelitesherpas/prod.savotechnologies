import { Section } from "@/components/ui/section";
import { Reveal } from "@/components/ui/reveal";
import { TECHNOLOGY_STACK } from "@/constants/content";

export function Technology() {
  return (
    <Section id="technology" index="Technology" labelledBy="tech-heading" className="bg-surface-2/60 !py-14 sm:!py-18 lg:!py-22">
      <div className="grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <Reveal>
            <h2 id="tech-heading" className="t-dl max-w-[15ch]">
              Technology chosen for the problem.
            </h2>
            <p className="t-body mt-6 max-w-md text-muted">
              We don&apos;t select technology because it is fashionable. We
              select it because it solves the right problem.
            </p>
          </Reveal>
        </div>

        <div className="lg:col-span-7">
          <Reveal delay={140}>
            <div className="grid gap-x-10 gap-y-10 sm:grid-cols-2 xl:grid-cols-3">
              {TECHNOLOGY_STACK.map((group) => (
                <div key={group.category}>
                  <p className="t-label mb-4 flex items-center gap-2.5 text-muted">
                    <span aria-hidden="true" className="h-1.5 w-1.5 bg-accent" />
                    {group.category}
                  </p>
                  <ul className="grid grid-cols-2 gap-x-4 sm:block sm:space-y-0 sm:border-t sm:border-border">
                    {group.items.map((item) => (
                      <li
                        key={item}
                        className="t-sm border-b border-border py-1.5 font-medium text-foreground/85 transition-colors hover:text-accent sm:py-2.5"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </Section>
  );
}
