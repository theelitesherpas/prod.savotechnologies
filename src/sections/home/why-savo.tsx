import { Section } from "@/components/ui/section";
import { Reveal } from "@/components/ui/reveal";
import { WHY_SAVO } from "@/constants/content";

export function WhySavo() {
  return (
    <Section id="why" index="10 — Why Savo" labelledBy="why-heading">
      <div className="mb-14 sm:mb-16">
        <Reveal>
          <h2 id="why-heading" className="t-dl max-w-[16ch]">
            Why businesses choose Savo.
          </h2>
        </Reveal>
      </div>

      <Reveal delay={120}>
        <ul className="border-t border-border">
          {WHY_SAVO.map((reason, i) => (
            <li
              key={reason.title}
              className="group grid gap-3 border-b border-border py-7 transition-colors sm:grid-cols-12 sm:gap-8 sm:py-9"
            >
              <div className="flex items-baseline gap-5 sm:col-span-6">
                <span className="t-label tnum text-muted transition-colors group-hover:text-accent">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="t-h3">{reason.title}</h3>
              </div>
              <p className="t-body pl-[3.4rem] text-muted sm:col-span-6 sm:pl-0 sm:pt-1">
                {reason.text}
              </p>
            </li>
          ))}
        </ul>
      </Reveal>
    </Section>
  );
}
