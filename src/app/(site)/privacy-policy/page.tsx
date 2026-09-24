import type { Metadata } from "next";
import { SITE } from "@/constants/site";
import { absoluteUrl } from "@/lib/env";
import { Section } from "@/components/ui/section";
import { SectionHeader } from "@/components/ui/section-header";
import { Reveal } from "@/components/ui/reveal";
import { openGraphFor } from "@/lib/seo";

/**
 * Privacy Policy — plain, accurate, and honest about what the site actually
 * collects (enquiry forms, callback requests, admin sessions, GA4 when
 * enabled). Bracketed slots mark where the company must confirm its own
 * details before production launch.
 */

const DESCRIPTION =
  "How Savo Technologies collects, uses and protects information submitted through savotechnologies.com, including enquiry forms, callback requests and analytics.";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: DESCRIPTION,
  alternates: { canonical: "/privacy-policy" },
  openGraph: openGraphFor({ title: "Privacy Policy | Savo Technologies", description: DESCRIPTION, url: "/privacy-policy" }),
  robots: { index: true, follow: true },
};

const SECTIONS: Array<{ title: string; body: string[] }> = [
  {
    title: "Who we are",
    body: [
      `${SITE.name}, operating as ${SITE.legalName}, maintains this website. Questions about this policy or your data can be sent to ${SITE.email}.`,
    ],
  },
  {
    title: "Information we collect",
    body: [
      "When you submit an enquiry, project brief or callback request, we collect the details you provide: your name, email address, phone number, company and a description of your project.",
      "Our server logs record technical request data such as IP address, browser and timestamps. IP addresses are hashed with a server-side pepper before storage and are used only for abuse prevention.",
      "If Google Analytics is enabled, it collects standard usage metrics. You can block analytics scripts with any standard browser setting or extension.",
    ],
  },
  {
    title: "How we use information",
    body: [
      "Enquiry and callback information is used solely to respond to your request and to discuss potential work. We do not sell, rent or trade personal information to third parties.",
      "Aggregated, non-identifying statistics may be used to improve the website.",
    ],
  },
  {
    title: "Retention",
    body: [
      "Enquiry records are retained only as long as needed to serve the enquiry and meet legal or business record requirements. You may request deletion of your enquiry records at any time by emailing us.",
    ],
  },
  {
    title: "Cookies",
    body: [
      "This site uses only functional cookies. Editors and administrators receive a strictly necessary session cookie for authentication. No advertising or cross-site tracking cookies are set by us.",
    ],
  },
  {
    title: "Your rights",
    body: [
      "You may request access to, correction of, or deletion of personal information we hold about you by writing to " + SITE.email + ". We respond to verified requests within a reasonable period.",
    ],
  },
  {
    title: "Security",
    body: [
      "Information is transmitted over HTTPS and stored with access controls. No internet transmission is perfectly secure, but we apply the same engineering standards to this website that we apply to client systems.",
    ],
  },
  {
    title: "Changes to this policy",
    body: [
      "If this policy changes, the revised version will be published on this page. Continued use of the site after changes constitutes acceptance of the updated policy.",
    ],
  },
  {
    title: "Contact",
    body: [
      `${SITE.legalName}, Indore, Madhya Pradesh, India. Email: ${SITE.email}. Phone: ${SITE.phone}.`,
    ],
  },
];

export default function PrivacyPolicyPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": absoluteUrl("/privacy-policy/#webpage"),
    url: absoluteUrl("/privacy-policy"),
    name: "Privacy Policy",
    isPartOf: { "@id": absoluteUrl("/#website") },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Section id="privacy" index="Legal" labelledBy="privacy-heading">
        <SectionHeader
          id="privacy-heading"
          heading="Privacy Policy."
          lead="Plain language about what this website collects and why. Last reviewed at launch."
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
