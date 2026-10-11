import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/env";
import { DetailCta } from "@/components/shared/detail-cta";
import { ABOUT_FAQS, buildAboutMetrics } from "@/sections/about/about-content";
import { AboutCrafts, AboutCulture, AboutDisciplines, AboutHero, AboutOverview, AboutPresence, AboutPurpose, AboutQuestions, AboutStory, AboutTeam, AboutValues } from "@/sections/about/about-sections";
import { getSettings } from "@/lib/settings";
import { getManagedTeam } from "@/lib/content-items";
import styles from "@/sections/about/about.module.css";
import { openGraphFor } from "@/lib/seo";

/**
 * About - complete, people-focused company story. Original demo timeline,
 * leadership profiles and metrics are restored for labelled staging previews,
 * never as production facts. Canonical identity and FAQ/schema parity remain.
 * The shared grey close, global footer and enquiry attribution are unchanged.
 */

export const revalidate = 0;

const DESCRIPTION = "About Savo Technologies: our company story, verified identity, offices, values, specialist disciplines and approach to engineering, design and AI.";

export const metadata: Metadata = {
  title: "About Us",
  description: DESCRIPTION,
  alternates: { canonical: "/about" },
  openGraph: openGraphFor({ title: "About Us | Savo Technologies", description: DESCRIPTION, url: "/about" }),
};

export default async function AboutPage() {
  const [settings, team] = await Promise.all([getSettings(), getManagedTeam()]);
  const metrics = buildAboutMetrics(settings.metrics);
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "AboutPage",
        "@id": absoluteUrl("/about/#webpage"),
        url: absoluteUrl("/about"),
        name: "About Us | Savo Technologies",
        description: DESCRIPTION,
        isPartOf: { "@id": absoluteUrl("/#website") },
        about: { "@id": absoluteUrl("/#organization") },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
          { "@type": "ListItem", position: 2, name: "About", item: absoluteUrl("/about") },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: ABOUT_FAQS.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <div className={styles.page} data-about-page="complete-company-story">
        <AboutHero />
        <AboutOverview metrics={metrics} />
        <AboutStory />
        <AboutPurpose />
        <AboutTeam people={team} />
        <AboutValues />
        <AboutCrafts />
        <AboutDisciplines />
        <AboutCulture />
        <AboutPresence />
        <AboutQuestions />
        <DetailCta
          headingId="about-cta-heading"
          heading="Build your next chapter with Savo."
          lead="Tell us what you are building. We reply with substance - the people on your project stay named and reachable."
          location="about-cta"
          secondaryLabel="Join the Team"
          secondaryHref="/careers"
        />
      </div>
    </>
  );
}
