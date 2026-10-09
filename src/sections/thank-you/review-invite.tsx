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
/* The feedback plate — the review itself, drawn as an instruction   */
/* ------------------------------------------------------------------ */

/** A five-point star centred on its own origin. */
const STAR =
  "M0 -11 L3.23 -3.55 L11.3 -3.67 L5.1 1.66 L7.02 9.49 L0 4.95 L-7.02 9.49 L-5.1 1.66 L-11.3 -3.67 L-3.23 -3.55 Z";

const STEPS = ["Pick your stars", "Write a few words", "Post your review"] as const;

function FeedbackPlate() {
  return (
    <figure className="relative m-0 border border-border bg-surface p-6 sm:p-7">
      <div aria-hidden="true" className="flex items-center gap-3">
        <span className="h-2 w-2 shrink-0 bg-accent" />
        <span className="t-label text-muted">Feedback</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      {/* The doodle: the Google review, drawn in the site's hand.
          Card and hairlines ink themselves in, five stars draw then paint
          gold one by one, a few words get written, the Post button fills
          vermilion under the cursor. */}
      <div className="py-7">
        <svg
          aria-hidden="true"
          viewBox="0 0 260 172"
          className="mx-auto block w-full max-w-[15.5rem]"
          fill="none"
        >
          {/* Review card */}
          <rect
            data-draw
            pathLength={1}
            x="18"
            y="14"
            width="224"
            height="128"
            stroke="currentColor"
            strokeOpacity="0.45"
            strokeWidth="1.5"
            className="text-foreground"
          />
          {/* Card header: the G mark on its own hairline */}
          <g transform="translate(30 21) scale(0.78)">
            <path fill="#4285F4" d="M17.64 9.2045c0-.6381-.0573-1.2518-.1636-1.8409H9v3.4814h4.8436c-.2086 1.125-.8427 2.0782-1.7959 2.7164v2.2581h2.9087c1.7018-1.5668 2.6836-3.874 2.6836-6.615z" />
            <path fill="#34A853" d="M9 18c2.43 0 4.4673-.806 5.9564-2.18l-2.9087-2.2581c-.8059.54-1.8368.859-3.0477.859-2.344 0-4.3282-1.5831-5.036-3.7104H.9573v2.3318C2.4382 15.9832 5.4818 18 9 18z" />
            <path fill="#FBBC05" d="M3.964 10.71c-.18-.54-.2823-1.1168-.2823-1.71s.1023-1.17.2823-1.71V4.9582H.9573C.3477 6.1732 0 7.5477 0 9s.3477 2.8268.9573 4.0418L3.964 10.71z" />
            <path fill="#EA4335" d="M9 3.5795c1.3214 0 2.5077.4541 3.4405 1.346l2.5813-2.5814C13.4632.8918 11.426 0 9 0 5.4818 0 2.4382 2.0168.9573 4.9582L3.964 7.29c.7077-2.1273 2.6918-3.7105 5.036-3.7105z" />
          </g>
          <line
            data-draw
            pathLength={1}
            style={{ "--draw-delay": "0.35s" } as CSSProperties}
            x1="18"
            y1="40"
            x2="242"
            y2="40"
            stroke="currentColor"
            strokeOpacity="0.25"
            strokeWidth="1.5"
            className="text-foreground"
          />

          {/* Five stars: each outline draws, then paints gold */}
          {[0, 1, 2, 3, 4].map((i) => (
            <path
              key={i}
              data-draw
              pathLength={1}
              className="doodle-fill"
              style={
                {
                  "--draw-delay": `${0.5 + i * 0.16}s`,
                  transitionDelay: `${0.72 + i * 0.16}s`,
                } as CSSProperties
              }
              transform={`translate(${52 + i * 39} 62)`}
              d={STAR}
              fill="#FBBC05"
              stroke="#F9AB00"
              strokeWidth="1.4"
              strokeLinejoin="round"
            />
          ))}

          {/* A few words, being written */}
          <path
            data-draw
            pathLength={1}
            style={{ "--draw-delay": "1.3s" } as CSSProperties}
            d="M32 98 q12 -6 24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0"
            stroke="currentColor"
            strokeOpacity="0.28"
            strokeWidth="1.5"
            strokeLinecap="round"
            className="text-foreground"
          />
          <path
            data-draw
            pathLength={1}
            style={{ "--draw-delay": "1.45s" } as CSSProperties}
            d="M32 116 q12 -5 24 0 t24 0 t24 0 t24 0"
            stroke="currentColor"
            strokeOpacity="0.28"
            strokeWidth="1.5"
            strokeLinecap="round"
            className="text-foreground"
          />

          {/* Post button, filling vermilion under the cursor */}
          <rect
            className="doodle-fill"
            style={{ transitionDelay: "1.7s" } as CSSProperties}
            x="180"
            y="124"
            width="48"
            height="14"
            rx="2"
            fill="var(--accent)"
          />
          <text
            x="204"
            y="134"
            textAnchor="middle"
            fill="var(--on-accent)"
            fontSize="8.5"
            fontWeight="700"
            letterSpacing="0.02em"
            fontFamily="var(--font-sans)"
          >
            Post
          </text>

          {/* The cursor and its click */}
          <path
            data-draw
            pathLength={1}
            style={{ "--draw-delay": "1.85s" } as CSSProperties}
            d="M232 118 l0 17 l4.5 -4.5 l3 7 l3.5 -1.5 l-3 -7 l6.5 -1 z"
            stroke="currentColor"
            strokeOpacity="0.55"
            strokeWidth="1.2"
            strokeLinejoin="round"
            className="text-foreground"
          />
          <path
            data-draw
            pathLength={1}
            style={{ "--draw-delay": "2s" } as CSSProperties}
            d="M224 112 a 11 11 0 0 1 8 -5"
            stroke="currentColor"
            strokeOpacity="0.4"
            strokeWidth="1.2"
            strokeLinecap="round"
            className="text-foreground"
          />
          <path
            data-draw
            pathLength={1}
            style={{ "--draw-delay": "2.1s" } as CSSProperties}
            d="M221 118 a 16 16 0 0 1 11 -9"
            stroke="currentColor"
            strokeOpacity="0.4"
            strokeWidth="1.2"
            strokeLinecap="round"
            className="text-foreground"
          />
        </svg>
      </div>

      {/* The three moves, in order */}
      <ol className="m-0 flex list-none flex-wrap items-center justify-center gap-x-3 gap-y-2">
        {STEPS.map((step, i) => (
          <li key={step} className="flex list-none items-center gap-3">
            <span className="t-label text-muted">{step}</span>
            {i < STEPS.length - 1 ? (
              <svg aria-hidden="true" viewBox="0 0 14 14" className="h-2.5 w-2.5 text-muted" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M1 7h11M7.5 2.5 12 7l-4.5 4.5" />
              </svg>
            ) : null}
          </li>
        ))}
      </ol>

      <figcaption className="m-0">
        <div aria-hidden="true" className="mt-5 flex items-center justify-between gap-4 border-t border-border pt-3.5">
          <span className="t-label text-muted">Your words, on Google</span>
          <span className="t-label text-muted">Optional · honest · unfiltered</span>
        </div>
      </figcaption>
    </figure>
  );
}
