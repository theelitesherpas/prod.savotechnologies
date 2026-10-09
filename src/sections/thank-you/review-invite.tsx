import type { CSSProperties } from "react";
import { Section } from "@/components/ui/section";
import { Reveal } from "@/components/ui/reveal";
import { ReviewCta } from "./review-cta";

/**
 * Share your experience — the Google review invitation as a compact paper
 * band: the invitation and CTA on the left, and to the right a small
 * abstract feedback plate (a serif quotation mark over hairline text lines
 * that ink themselves in). Deliberately no review card, no rating, no
 * testimonial — nothing is invented; real review data doesn't exist in
 * this codebase, so the design stays honest and still stands on its own.
 */

export function ReviewInvite() {
  return (
    <Section
      id="review"
      index="Your experience matters"
      labelledBy="review-heading"
      className="!py-12 sm:!py-16 lg:!py-18"
    >
      <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-7">
          <Reveal>
            <h2 id="review-heading" className="t-h1 max-w-[22ch]">
              Your experience could help someone discover Savo
              <span aria-hidden="true" className="text-accent">.</span>
            </h2>
          </Reveal>
          <Reveal delay={100}>
            <p className="t-body mt-5 max-w-xl text-muted">
              If you&rsquo;ve worked with Savo Technologies, we&rsquo;d love to
              hear about your experience in your own words. Your honest
              review helps other businesses understand what it&rsquo;s like to
              work with us, and shows our team where we&rsquo;re getting it
              right.
            </p>
          </Reveal>
          <Reveal delay={160}>
            <ReviewCta />
          </Reveal>
        </div>

        <div className="lg:col-span-5">
          <Reveal delay={220}>
            <FeedbackPlate />
          </Reveal>
        </div>
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/* The feedback plate — quotation mark over drawn text lines          */
/* ------------------------------------------------------------------ */

function FeedbackPlate() {
  return (
    <figure aria-hidden="true" className="relative m-0 border border-border bg-surface p-6 sm:p-7">
      <div className="flex items-center gap-3">
        <span className="h-2 w-2 shrink-0 bg-accent" />
        <span className="t-label text-muted">Feedback</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <div className="relative py-6 pl-1.5">
        {/* The serif quote — the document voice, at display scale */}
        <span className="t-statement t-serif-italic block select-none !text-[clamp(3.5rem,7vw,6rem)] leading-[0.6] text-accent">
          &ldquo;
        </span>

        {/* Abstract lines of a review, drawn in on scroll */}
        <svg viewBox="0 0 220 72" className="mt-5 block w-full" fill="none" aria-hidden="true">
          <line data-draw pathLength={1} x1="0" y1="6" x2="204" y2="6" stroke="currentColor" strokeOpacity="0.28" strokeWidth="1.5" className="text-foreground" />
          <line data-draw pathLength={1} style={{ "--draw-delay": "0.35s" } as CSSProperties} x1="0" y1="28" x2="220" y2="28" stroke="currentColor" strokeOpacity="0.28" strokeWidth="1.5" className="text-foreground" />
          <line data-draw pathLength={1} style={{ "--draw-delay": "0.5s" } as CSSProperties} x1="0" y1="50" x2="152" y2="50" stroke="currentColor" strokeOpacity="0.28" strokeWidth="1.5" className="text-foreground" />
          {/* The signal — one vermilion node at the close of the last line */}
          <rect x="164" y="45" width="10" height="10" className="fill-accent" />
        </svg>
      </div>

      <figcaption className="m-0">
        <div className="flex items-center justify-between gap-4 border-t border-border pt-3.5">
          <span className="t-label text-muted">Your words, on Google</span>
          <span className="t-label text-muted">Optional · honest · unfiltered</span>
        </div>
      </figcaption>
    </figure>
  );
}
