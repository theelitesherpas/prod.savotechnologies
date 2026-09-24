import { Reveal } from "@/components/ui/reveal";
import { SITE } from "@/constants/site";

/** Full-width brand moment before the final CTA. */
export function BrandStatement() {
  return (
    <section aria-labelledby="brand-heading" className="chapter-ink bg-background text-foreground">
      <div className="shell py-28 sm:py-36 lg:py-44">
        <Reveal>
          <p className="t-label mb-10 text-muted">Our belief</p>
          <h2 id="brand-heading" className="t-statement max-w-[13ch]">
            Bold ideas deserve serious technology
            <span aria-hidden="true" className="text-accent">.</span>
          </h2>
        </Reveal>
        <Reveal delay={160}>
          <p className="t-serif-italic mt-12 text-[clamp(1.35rem,2.4vw,1.9rem)] text-muted">
            {SITE.tagline}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
