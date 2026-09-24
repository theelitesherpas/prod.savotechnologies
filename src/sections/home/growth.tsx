import { Section } from "@/components/ui/section";
import { Reveal } from "@/components/ui/reveal";
import { GROWTH_CAPABILITIES, GROWTH_CHANNELS } from "@/constants/content";

export function Growth() {
  return (
    <Section id="growth" index="13 — Discoverability" labelledBy="growth-heading" className="bg-surface-2/60">
      <div className="grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <Reveal>
            <h2 id="growth-heading" className="t-dl max-w-[15ch]">
              Built to perform. Built to be found.
            </h2>
          </Reveal>
        </div>
        <div className="lg:col-span-5 lg:pt-4">
          <Reveal delay={120}>
            <p className="t-body-lg max-w-md text-muted">
              A great product still needs to be discovered. SAVO combines
              engineering with modern digital discoverability — because search
              engines still matter, and AI-powered discovery increasingly
              decides who gets found.
            </p>
          </Reveal>
        </div>
      </div>

      <div className="mt-16 grid gap-px border border-border bg-border md:grid-cols-3">
        {GROWTH_CHANNELS.map((channel, i) => (
          <Reveal key={channel.abbr} delay={i * 110} className="bg-background">
            <div className="flex h-full flex-col p-7 sm:p-9">
              <div className="flex items-baseline justify-between">
                <span
                  className="text-[2.6rem] font-extrabold leading-none tracking-[-0.03em] text-accent"
                  style={{ fontStretch: "112%" }}
                >
                  {channel.abbr}
                </span>
                <span aria-hidden="true" className="h-2 w-2 bg-border" />
              </div>
              <h3 className="t-h4 mt-6 text-foreground/90">{channel.name}</h3>
              <p className="t-sm mt-4 text-muted">{channel.text}</p>
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal delay={200}>
        <ul className="mt-8 flex flex-wrap gap-2" aria-label="Additional growth capabilities">
          {GROWTH_CAPABILITIES.map((cap) => (
            <li key={cap} className="t-caption rounded-[2px] border border-border px-3 py-1.5 text-muted">
              {cap}
            </li>
          ))}
        </ul>
      </Reveal>
    </Section>
  );
}
