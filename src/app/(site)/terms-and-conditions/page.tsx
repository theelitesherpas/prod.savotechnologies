import type { Metadata } from "next";
import { SITE } from "@/constants/site";
import { absoluteUrl } from "@/lib/env";
import { Section } from "@/components/ui/section";
import { SectionHeader } from "@/components/ui/section-header";
import { Reveal } from "@/components/ui/reveal";
import { openGraphFor } from "@/lib/seo";

/**
 * Terms and Conditions — scoped honestly to what this website is: an
 * informational site with an enquiry pipeline. Project engagements are
 * governed by individual written agreements, not by these terms.
 */

const DESCRIPTION =
  "The terms that apply to use of the Savo Technologies website. Client engagements are governed by their own written agreements.";

export const metadata: Metadata = {
  title: "Terms and Conditions",
  description: DESCRIPTION,
  alternates: { canonical: "/terms-and-conditions" },
  openGraph: openGraphFor({
    title: "Terms and Conditions | Savo Technologies",
    description: DESCRIPTION,
    url: "/terms-and-conditions",
  }),
  robots: { index: true, follow: true },
};

const SECTIONS: Array<{ title: string; body: string[] }> = [
  {
    title: "Acceptance",
    body: [
      `By using this website you agree to these terms. The site is operated by ${SITE.legalName}, Indore, Madhya Pradesh, India.`,
    ],
  },
  {
    title: "Purpose of this website",
    body: [
      "This website presents information about Savo Technologies and provides enquiry and contact forms. It is informational; nothing on it constitutes a binding offer, a quote or professional advice.",
      "Any engagement, project or service relationship is formed only through a separate written agreement signed by both parties.",
    ],
  },
  {
    title: "Acceptable use",
    body: [
      "You agree not to misuse this website: no automated scraping that degrades the service, no submitting false or abusive enquiries, and no attempts to access non-public areas without authorization.",
    ],
  },
  {
    title: "Intellectual property",
    body: [
      "The design, text and code of this website are owned by Savo Technologies. Case study and portfolio descriptions remain the property of the company and its clients as applicable.",
    ],
  },
  {
    title: "No warranties",
    body: [
      "The website is provided as is. We work to keep information accurate and current, but content may change and we do not warrant uninterrupted availability.",
    ],
  },
  {
    title: "Limitation of liability",
    body: [
      "To the extent permitted by law, Savo Technologies is not liable for indirect or consequential losses arising from use of this website.",
    ],
  },
  {
    title: "Governing law",
    body: [
      "These terms are governed by the laws of India, with jurisdiction in the courts of Indore, Madhya Pradesh. [Company to confirm before production launch.]",
    ],
  },
  {
    title: "Contact",
    body: [`${SITE.email} · ${SITE.phone}`],
  },
];

export default function TermsPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": absoluteUrl("/terms-and-conditions/#webpage"),
    url: absoluteUrl("/terms-and-conditions"),
    name: "Terms and Conditions",
    isPartOf: { "@id": absoluteUrl("/#website") },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Section id="terms" index="Legal" labelledBy="terms-heading">
        <SectionHeader
          id="terms-heading"
          heading="Terms and Conditions."
          lead="The short, honest version: this site is informational, and real projects run on signed agreements."
        />
        <div className="mt-12 divide-y divide-border border-y border-border">
          {SECTIONS.map((s) => (
            <Reveal key={s.title} className="py-7">
              <h2 className="t-h3">{s.title}</h2>
              {s.body.map((p) => (
                <p key={p.slice(0, 40)} className="t-body mt-3 max-w-3xl text-muted">
                  {p}
                </p>
              ))}
            </Reveal>
          ))}
        </div>
      </Section>
    </>
  );
}
