import Image from "next/image";
import { Section } from "@/components/ui/section";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeader } from "@/components/ui/section-header";
import { ImageReveal } from "@/components/ui/image-reveal";
import { LIFE_POINTS } from "@/constants/careers";
import { withBasePath } from "@/lib/utils";

/**
 * Life at Savo — the candidate pitch as hairline rows (why-savo idiom),
 * with the studio meeting photo on a sticky true-color rail.
 */
export function LifeAtSavo() {
  return (
    <Section id="life" index="Life at Savo" labelledBy="life-heading">
      <SectionHeader id="life-heading" heading="What working here is like." />

      <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
        {/* Differentiators */}
        <div className="lg:col-span-8">
          <Reveal delay={120}>
            <ul className="border-t border-border">
              {LIFE_POINTS.map((point) => (
                <li
                  key={point.title}
                  className="group grid gap-3 border-b border-border py-7 sm:grid-cols-12 sm:gap-8"
                >
                  <div className="flex items-center gap-3.5 sm:col-span-5">
                    <span
                      aria-hidden="true"
                      className="h-2 w-2 shrink-0 scale-0 bg-accent transition-transform duration-300 ease-[var(--ease-out-expo)] group-hover:scale-100"
                    />
                    <h3 className="t-h3">{point.title}</h3>
                  </div>
                  <p className="t-sm text-muted sm:col-span-7 sm:pt-1">
                    {point.text}
                  </p>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>

        {/* Photo rail */}
        <div className="lg:col-span-4">
          <Reveal delay={200} className="lg:sticky lg:top-28">
            <ImageReveal className="relative aspect-[4/5] overflow-hidden border border-border">
              <Image
                src={withBasePath("/images/meeting.webp")}
                alt="The Savo team reviewing product work together around a table"
                fill
                sizes="(max-width: 1024px) 100vw, 420px"
                className="photo object-cover"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[rgb(16_19_25/0.4)] to-transparent"
              />
              <p className="t-label absolute bottom-4 left-4 text-white/85">
                One team · since 2016
              </p>
            </ImageReveal>
            <p className="t-caption mt-4 text-muted">
              Small senior teams, the people who interview you are the people
              you ship with.
            </p>
          </Reveal>
        </div>
      </div>
    </Section>
  );
}
