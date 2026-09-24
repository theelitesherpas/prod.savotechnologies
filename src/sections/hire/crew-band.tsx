import { Section } from "@/components/ui/section";
import { Reveal } from "@/components/ui/reveal";
import { CrewScene, crewCopy } from "./crew-scene";

/**
 * The crew band — a playful hand-drawn scene before the vermilion
 * close. One scene per page, drawn in the site's own stroke grammar,
 * gently animated. The energy moment; the doodles stay in character.
 */
export function CrewBand({ variant }: { variant: string }) {
  const copy = crewCopy(variant);
  const headingId = `crew-${variant}-heading`;
  return (
    <Section index="The Crew" labelledBy={headingId} className="!py-16 sm:!py-20">
      <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-8">
          <Reveal>
            <figure aria-label={copy.title}>
              <CrewScene variant={variant} />
            </figure>
          </Reveal>
        </div>
        <div className="lg:col-span-4">
          <Reveal delay={120}>
            <h2 id={headingId} className="t-h2 max-w-[16ch]">
              {copy.title}
            </h2>
            <p className="t-caption mt-4 text-muted">{copy.note}.</p>
            <p className="t-label mt-8 text-muted/70">
              Doodles from the studio, drawn the way we build, by hand
            </p>
          </Reveal>
        </div>
      </div>
    </Section>
  );
}
