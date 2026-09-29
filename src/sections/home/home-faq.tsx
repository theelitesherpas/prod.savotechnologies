import Link from "next/link";
import { Section } from "@/components/ui/section";
import { SectionHeader } from "@/components/ui/section-header";
import { Faq } from "@/components/shared/faq";
import { HOME_FAQS } from "@/constants/faqs";
import { absoluteUrl } from "@/lib/env";

/**
 * Homepage FAQ — the company-level AEO/GEO surface. The questions buyers
 * and search engines ask first, answered plainly, structured as FAQPage
 * JSON-LD at page level. Mirrors the service-page question chapter:
 * sticky statement left, accordion right.
 */
export function HomeFaq() {
  const headingId = "home-faq-heading";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": absoluteUrl("/#faq-schema"),
    mainEntity: HOME_FAQS.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
  return (
    <Section id="faq" index="Questions" labelledBy={headingId} className="bg-surface-2/60">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SectionHeader
        id={headingId}
        heading="Questions clients ask first."
        lead="The questions we hear in every first conversation — answered the same way we answer them in person."
      />
      <div className="mt-12 grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-28">
            <p className="t-body max-w-xs text-muted">
              Straight answers, kept current with how we actually work —
              from Indore and Switzerland to wherever you are.
            </p>
            <Link
              href="/contact"
              className="group/btn t-sm mt-8 inline-flex items-center gap-2 font-semibold text-foreground transition-colors hover:text-accent"
            >
              A question we missed?
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
        </div>
        <div className="lg:col-span-8">
          <Faq items={HOME_FAQS} label="Savo Technologies, frequently asked questions" />
        </div>
      </div>
    </Section>
  );
}
