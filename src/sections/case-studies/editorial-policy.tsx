import Link from "next/link";
import { Section } from "@/components/ui/section";
import { SectionHeader } from "@/components/ui/section-header";
import { Reveal } from "@/components/ui/reveal";
import { DOSSIER_CONTENTS } from "@/constants/case-studies";

/**
 * Editorial policy - the ink beat before the vermilion close. States the
 * honest-content rule the whole page runs on, lists what every dossier
 * will carry once published, and offers the NDA reference path for
 * visitors who need proof today.
 */
export function EditorialPolicy() {
  return (
    <Section
      index="Editorial Policy"
      chapter="ink"
      labelledBy="policy-heading"
    >
      <SectionHeader
        id="policy-heading"
        heading="Nothing publishes unverified."
        lead={
          <>
            Every claim on this page must survive scrutiny. That standard is
            why most entries still read &ldquo;in preparation&rdquo;, and
            why that changes only when the numbers do.
          </>
        }
      />

      <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
        {/* What every dossier will carry */}
        <div className="lg:col-span-6">
          <Reveal>
            <p className="t-h4">Every dossier will carry</p>
            <ul className="mt-6 border-t border-border">
              {DOSSIER_CONTENTS.map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-3.5 border-b border-border py-3.5"
                >
                  <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 bg-accent" />
                  <span className="t-sm font-medium text-foreground/85">{item}</span>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>

        {/* The reference path */}
        <div className="lg:col-span-5 lg:col-start-8">
          <Reveal delay={140}>
            <div className="border border-border bg-surface p-7 sm:p-8">
              <p className="t-label text-muted">Need proof now?</p>
              <p className="t-body mt-4 text-muted">
                Ask directly. We will walk you through relevant engagements
                under NDA, with the numbers clients allow us to share, and
                the references to match.
              </p>
              <Link
                href="/contact"
                className="group/btn t-sm mt-6 inline-flex items-center gap-2 py-3 font-semibold text-foreground transition-colors hover:text-accent"
              >
                Request references
                <svg
                  aria-hidden="true"
                  viewBox="0 0 14 14"
                  className="h-3 w-3 transition-transform duration-300 group-hover/btn:translate-x-[3px]"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                >
                  <path d="M1 7h11M7.5 2.5 12 7l-4.5 4.5" />
                </svg>
              </Link>
            </div>
          </Reveal>
        </div>
      </div>
    </Section>
  );
}
