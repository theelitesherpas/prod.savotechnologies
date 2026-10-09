import type { CSSProperties } from "react";
import { Reveal } from "@/components/ui/reveal";
import { CopyReference } from "@/components/shared/copy-reference";

/**
 * Thank-you hero — the confirmation moment, set in the ink chapter exactly
 * like the careers opening: paper strip behind the fixed nav, name rail,
 * serif statement with the vermilion full stop, and the enquiry docket
 * (the document-world's confirmation slip, drawn in the site's own hand —
 * hairline strokes that ink themselves in, the square node seal, one drawn
 * check). The "what happens next" stages ride along as the hero's facts
 * strip, the same instrument the careers hero uses.
 *
 * Without a verified reference the hero tells the truth: it thanks the
 * visitor for connecting without claiming an enquiry was received.
 */

/** The three honest stages. Only the first is marked live ("Now") — it is
 *  the one state the submission itself proves; the rest explain what comes
 *  next. No response-time promises (no published SLA to lean on). */
const STAGES = [
  {
    marker: "Now",
    live: true,
    title: "Enquiry received",
    text: "We've received your details. A confirmation is on its way to your inbox.",
  },
  {
    marker: "Then",
    live: false,
    title: "Our team reviews",
    text: "We'll read your requirements and prepare a considered response.",
  },
  {
    marker: "Later",
    live: false,
    title: "We'll be in touch",
    text: "We'll connect with you about the next steps. By email, from a person.",
  },
] as const;

export function ThankYouHero({
  reference,
  journey,
  contactEmail,
}: {
  reference: string | null;
  journey: "careers" | "project";
  contactEmail: string;
}) {
  const verified = reference !== null;

  return (
    <section aria-labelledby="thank-you-heading" className="relative bg-background pt-[var(--nav-h)]">
      <div className="chapter-ink relative overflow-hidden bg-background text-foreground">
        <div className="shell pb-14 pt-[3.5rem] sm:pb-20 sm:pt-16">
          {/* Name rail */}
          <div aria-hidden="true" className="mb-8 flex items-center gap-4 sm:mb-10">
            <span aria-hidden="true" className="h-2 w-2 shrink-0 bg-accent" />
            <span className="t-label text-muted">{verified ? "Enquiry received" : "Thank you"}</span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-7">
              <Reveal>
                <h1 id="thank-you-heading" className="t-dl max-w-[18ch]">
                  {verified ? (
                    <>
                      Thank you for reaching out to Savo
                      <span aria-hidden="true" className="text-accent">.</span>
                    </>
                  ) : (
                    <>
                      Thanks for connecting with Savo
                      <span aria-hidden="true" className="text-accent">.</span>
                    </>
                  )}
                </h1>
              </Reveal>
              <Reveal delay={100}>
                <p className="t-body-lg mt-6 max-w-xl text-muted">
                  {verified
                    ? "We've received your enquiry, and our team will review the details you've shared. We look forward to understanding your requirements and helping you take the next step."
                    : "This is where enquiries sent through savotechnologies.com are confirmed. If you've just submitted a form, it is already with our team and a confirmation is on its way to your inbox."}
                </p>
              </Reveal>
              {verified ? (
                <Reveal delay={180}>
                  {reference && <CopyReference value={reference} />}
                  <p className="t-caption mt-4 text-muted">
                    {journey === "careers" ? (
                      <>Questions about your application? Write to{" "}</>
                    ) : (
                      <>Questions about your enquiry? Write to{" "}</>
                    )}
                    <a
                      href={`mailto:${contactEmail}`}
                      className="link-underline font-semibold text-foreground"
                    >
                      {contactEmail}
                    </a>
                    .
                  </p>
                </Reveal>
              ) : null}
            </div>

            <div className="lg:col-span-5">
              <Reveal delay={220}>
                <ReceivedDocket reference={reference} />
              </Reveal>
            </div>
          </div>

          {/* What happens next — the hero's facts strip (verified only) */}
          {verified ? (
            <Reveal delay={280}>
              <div className="mt-12 sm:mt-14">
                <div aria-hidden="true" className="mb-4 flex items-center gap-4">
                  <span className="t-label text-muted">What happens next</span>
                  <span className="h-px flex-1 bg-border" />
                </div>
                <ol className="grid grid-cols-1 gap-px border border-border bg-border sm:grid-cols-3">
                  {STAGES.map((stage) => (
                    <li key={stage.marker} className="flex flex-col bg-background p-5 sm:p-6">
                      <div className="flex items-center justify-between gap-4">
                        <span
                          aria-hidden="true"
                          className={stage.live ? "h-2 w-2 shrink-0 bg-accent" : "h-2 w-2 shrink-0 bg-border"}
                        />
                        <span className={`t-label ${stage.live ? "text-accent" : "text-muted"}`}>
                          {stage.marker}
                        </span>
                      </div>
                      <h2 className="t-h3 mt-4">{stage.title}</h2>
                      <p className="t-sm mt-2 text-muted">{stage.text}</p>
                    </li>
                  ))}
                </ol>
              </div>
            </Reveal>
          ) : null}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* The enquiry docket — a document-world confirmation slip             */
/* ------------------------------------------------------------------ */

function ReceivedDocket({ reference }: { reference: string | null }) {
  return (
    <figure
      aria-hidden="true"
      className="relative m-0 border border-border bg-surface p-6 sm:p-7"
    >
      {/* Docket header */}
      <div className="flex items-center gap-3">
        <span className="h-2 w-2 shrink-0 bg-accent" />
        <span className="t-label text-muted">Enquiry docket</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      {/* The received document, drawn in hairlines */}
      <div className="relative mx-auto my-7 max-w-[11rem]">
        <svg viewBox="0 0 220 220" className="block w-full" fill="none">
          {/* Sheet */}
          <path
            data-draw
            pathLength={1}
            d="M74 30h70l32 32v104a12 12 0 0 1-12 12H86a12 12 0 0 1-12-12V42a12 12 0 0 1 12-12Z"
            stroke="currentColor"
            strokeOpacity="0.45"
            strokeWidth="1.5"
            className="text-foreground"
          />
          {/* Fold */}
          <path
            data-draw
            pathLength={1}
            style={{ "--draw-delay": "0.45s" } as CSSProperties}
            d="M144 30v20a12 12 0 0 0 12 12h20"
            stroke="currentColor"
            strokeOpacity="0.45"
            strokeWidth="1.5"
            className="text-foreground"
          />
          {/* Content lines */}
          <line data-draw pathLength={1} x1="96" y1="98" x2="164" y2="98" stroke="currentColor" strokeOpacity="0.22" strokeWidth="1.5" className="text-foreground" />
          <line data-draw pathLength={1} style={{ "--draw-delay": "0.55s" } as CSSProperties} x1="96" y1="118" x2="152" y2="118" stroke="currentColor" strokeOpacity="0.22" strokeWidth="1.5" className="text-foreground" />
          <line data-draw pathLength={1} style={{ "--draw-delay": "0.65s" } as CSSProperties} x1="96" y1="138" x2="164" y2="138" stroke="currentColor" strokeOpacity="0.22" strokeWidth="1.5" className="text-foreground" />
          <line data-draw pathLength={1} style={{ "--draw-delay": "0.75s" } as CSSProperties} x1="96" y1="158" x2="136" y2="158" stroke="currentColor" strokeOpacity="0.22" strokeWidth="1.5" className="text-foreground" />
        </svg>

        {/* The vermilion node seal — received, checked, stamped */}
        <span className="success-draw absolute -bottom-2 right-1 flex h-11 w-11 items-center justify-center bg-accent">
          <svg viewBox="0 0 36 36" className="h-[1.15rem] w-[1.15rem]" fill="none" aria-hidden="true">
            <path
              className="success-draw-tick"
              d="M10.5 19l6 6 12-13.5"
              stroke="var(--on-accent)"
              strokeWidth="2.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="36"
            />
          </svg>
        </span>
      </div>

      {/* Docket footer */}
      <figcaption className="m-0">
        <div className="flex items-center justify-between gap-4 border-t border-border pt-3.5">
          <span className="t-label text-muted">Received · Savo Technologies</span>
          <span className="t-label tnum text-muted">{reference ?? "savotechnologies.com"}</span>
        </div>
      </figcaption>
    </figure>
  );
}
