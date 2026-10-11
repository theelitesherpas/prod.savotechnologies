import type { Metadata } from "next";
import { SITE } from "@/constants/site";
import { absoluteUrl } from "@/lib/env";
import { LegalDocument } from "@/sections/legal/legal-document";
import { openGraphFor } from "@/lib/seo";

/**
 * Terms and Conditions - scoped honestly to what this website is: an
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
    title: "Governing Law and Jurisdiction",
    body: [
      "These Terms shall be governed by and interpreted in accordance with the laws of India.",
      "Any dispute, claim, or legal proceeding arising out of or relating to these Terms, the use of this website, or the services provided by Savo Technologies Private Limited shall be subject to the exclusive jurisdiction of the competent courts located in Indore, Madhya Pradesh, India.",
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

      <LegalDocument
        kind="terms"
        title="Terms and Conditions."
        lead="The short, honest version: this site is informational, and real projects run on signed agreements."
        sections={SECTIONS}
      />
    </>
  );
}
