import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/env";
import { initialProjectType } from "@/sections/start/start-content";
import styles from "@/sections/start/start.module.css";
import { StartHero, StartBriefSection, WhatHappensNext } from "@/sections/start/start-hero";
import { openGraphFor } from "@/lib/seo";
import { getManagedTestimonials } from "@/lib/content-items";
import { TestimonialsVideoV2 } from "@/sections/home-v2/sections";

export const revalidate = 0; // Share the homepage’s current Published testimonial records.

/**
 * Start a Project - the full-page project brief. The landing-page popup
 * remains separate; this route provides three steps, review, and the
 * defined reply path. Posts through the standard enquiry pipeline
 * (Zod, honeypot, rate limit, admin inbox).
 */

const DESCRIPTION = "Start a project with Savo Technologies. Share your goals, constraints and project details in a three-step brief. Review before sending. Nothing binding.";

export const metadata: Metadata = {
  title: "Start a Project",
  description: DESCRIPTION,
  alternates: { canonical: "/start-a-project" },
  openGraph: openGraphFor({ title: "Start a Project | Savo Technologies", description: DESCRIPTION, url: "/start-a-project" }),
};

export default async function StartPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string | string[] }>;
}) {
  // ?type= pre-selects the project type when it matches a known option
  // (e.g. /start-a-project?type=AI%20Automation), so targeted CTAs land pre-filled.
  const [{ type }, testimonials] = await Promise.all([searchParams, getManagedTestimonials()]);
  const initialType = initialProjectType(type);
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": absoluteUrl("/start-a-project/#webpage"),
        url: absoluteUrl("/start-a-project"),
        name: "Start a Project | Savo Technologies",
        description: DESCRIPTION,
        isPartOf: { "@id": absoluteUrl("/#website") },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
          { "@type": "ListItem", position: 2, name: "Start a Project", item: absoluteUrl("/start-a-project") },
        ],
      },
    ],
  };

  return (
    <div className={styles.page} data-start-page="detailed-project-brief" data-design-contract="start-v7:THESIS=an-early-idea-is-enough;OWN-WORLD=Outfit-Inter-white-black-red-grey;STORY=encouragement-you-project-review;FIRST-VIEWPORT=compact-offer-black-brief-invitation-white-live-step-form;FORM=owner-pinned-three-step-workspace;FINISH=review-verdict-documentation-provenance">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <StartHero />
      <StartBriefSection initialType={initialType} />
      <div className={styles.testimonials} data-start-testimonials>
        <TestimonialsVideoV2 items={testimonials} demo={false} />
      </div>
      <WhatHappensNext />
    </div>
  );
}
