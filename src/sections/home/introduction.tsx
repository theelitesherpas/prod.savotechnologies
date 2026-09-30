import Image from "next/image";
import { Section } from "@/components/ui/section";
import { Reveal } from "@/components/ui/reveal";
import { ImageReveal } from "@/components/ui/image-reveal";
import { Parallax } from "@/components/ui/parallax";
import { withBasePath } from "@/lib/utils";

const CHAIN = ["Strategy", "Design", "Technology", "Intelligence", "Growth"] as const;

export function Introduction() {
  return (
    <Section id="studio" index="The Studio" labelledBy="studio-heading" className="!py-14 sm:!py-18 lg:!py-22">
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-7">
          <Reveal>
            <h2 id="studio-heading" className="t-dl max-w-[16ch]">
              One partner from idea to scale.
            </h2>
          </Reveal>
        </div>
        <div className="lg:col-span-5 lg:pt-4">
          <Reveal delay={120}>
            <div className="max-w-[42rem] space-y-6 border-l border-border pl-8 text-muted lg:pt-2">
              <p className="t-body-lg">
                Savo brings strategy, product design, software engineering,
                artificial intelligence and digital growth under one team,
                working from Indore, India with clients across India and
                worldwide.
              </p>
              <p className="t-body">
                We don&apos;t simply deliver screens or code. We help shape the
                product, engineer the technology, launch it properly, and keep
                improving what happens afterward.
              </p>
            </div>
          </Reveal>
        </div>
      </div>

      {/* Studio band, real work, held in the document's ink */}
      <Reveal delay={160}>
        <figure className="mt-16 sm:mt-20">
          <ImageReveal className="relative aspect-[16/9] overflow-hidden border border-border sm:aspect-[21/9]">
            <Parallax strength={56} className="absolute inset-0">
              <Image
                src={withBasePath("/images/team.webp")}
                alt="A product team reviewing work together around a studio table"
                fill
                sizes="(max-width: 1536px) 100vw, 1440px"
                className="photo object-cover"
              />
            </Parallax>
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[rgb(16_19_25/0.35)] to-transparent"
            />
          </ImageReveal>
          <figcaption className="mt-4 flex items-center justify-between gap-6">
            <span className="t-caption text-muted">
              Strategy, design and engineering under one roof.
            </span>
            <span className="t-label hidden shrink-0 text-muted sm:block">The Studio</span>
          </figcaption>
        </figure>
      </Reveal>

      <Reveal delay={200}>
        <ol
          className="mt-16 flex flex-wrap items-center gap-x-4 gap-y-3 sm:mt-20"
          aria-label="How we work, end to end"
        >
          {CHAIN.map((step, i) => (
            <li key={step} className="flex items-center gap-4">
              <span
                aria-hidden="true"
                className={"h-1.5 w-1.5 shrink-0 " + (i === CHAIN.length - 1 ? "bg-accent" : "bg-foreground/30")}
              />
              <span className="t-h4">{step}</span>
              {i < CHAIN.length - 1 ? (
                <span aria-hidden="true" className="ml-2 h-px w-8 bg-border sm:w-12" />
              ) : null}
            </li>
          ))}
        </ol>
      </Reveal>
    </Section>
  );
}
