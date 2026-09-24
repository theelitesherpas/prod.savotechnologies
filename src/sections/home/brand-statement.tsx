import { Reveal } from "@/components/ui/reveal";
import { SITE } from "@/constants/site";

/** Full-width brand moment before the final CTA. */
export function BrandStatement() {
  return (
    <section aria-labelledby="brand-heading" className="chapter-ink bg-background text-foreground">
      <div className="shell py-28 sm:py-36 lg:py-44">
        <Reveal>
          <h2
            id="brand-heading"
            className="t-statement max-w-[12ch]"
          >
            Bold ideas deserve serious technology
            <span aria-hidden="true" className="text-accent">.</span>
          </h2>
        </Reveal>
        <Reveal delay={160}>
          <p className="t-label mt-12 inline-flex items-center gap-3 text-muted">
            <span aria-hidden="true" className="h-2 w-2 bg-accent" />
            {SITE.tagline}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
