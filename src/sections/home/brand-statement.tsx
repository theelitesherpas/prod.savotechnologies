import { Reveal } from "@/components/ui/reveal";

/** Full-width brand moment before the final CTA. */
export function BrandStatement() {
  return (
    <section aria-labelledby="brand-heading" className="chapter-ink reftheme-dark bg-background text-foreground">
      <div className="shell py-14 sm:py-18 lg:py-22">
        <Reveal>
          <h2
            id="brand-heading"
            className="max-w-[25ch] font-serif text-[clamp(1.9rem,3.8vw,3.1rem)] font-semibold leading-[1.08] tracking-[-0.018em] text-white"
          >
            Technology should earn its place in your business
            <span aria-hidden="true" className="text-[#FF3333]">.</span>
          </h2>
        </Reveal>
        <Reveal delay={160}>
          <p className="mt-5 max-w-[70ch] text-[1rem] leading-[1.7] text-white/70">
            Savo Technologies—Savo for short—believes a better product is not just more features. It should remove friction for users, make day-to-day work easier and give your team a sound foundation for what comes next.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
