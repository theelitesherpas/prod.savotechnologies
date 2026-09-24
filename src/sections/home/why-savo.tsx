import Image from "next/image";
import { Section } from "@/components/ui/section";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeader } from "@/components/ui/section-header";
import { ImageReveal } from "@/components/ui/image-reveal";
import { WHY_SAVO } from "@/constants/content";

export function WhySavo() {
  return (
    <Section id="why" index="10 — Why Savo" labelledBy="why-heading">
      <SectionHeader id="why-heading" heading="Why businesses choose Savo." />

      <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
        {/* Differentiators */}
        <div className="lg:col-span-8">
          <Reveal delay={120}>
            <ul className="border-t border-border">
              {WHY_SAVO.map((reason, i) => (
                <li
                  key={reason.title}
                  className="group grid gap-3 border-b border-border py-7 transition-colors sm:grid-cols-12 sm:gap-8 sm:py-8"
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
        </div>

        {/* Studio image rail */}
        <div className="lg:col-span-4">
          <Reveal delay={200} className="lg:sticky lg:top-28">
            <ImageReveal className="relative aspect-[4/5] overflow-hidden border border-border">
              <Image
                src="/images/studio.webp"
                alt="A designer's workspace with product work in progress on screen"
                fill
                sizes="(max-width: 1024px) 100vw, 420px"
                className="duotone object-cover"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[rgb(16_19_25/0.4)] to-transparent"
              />
              <p className="t-label absolute bottom-4 left-4 text-white/85">
                Design × Engineering
              </p>
            </ImageReveal>
            <p className="t-caption mt-4 text-muted">
              Decisions on both sides of the product — made together, in one
              room.
            </p>
          </Reveal>
        </div>
      </div>
    </Section>
  );
}
