import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/constants/site";
import { absoluteUrl } from "@/lib/env";
import { roleSlug, toPublicRole } from "@/constants/careers";
import { getManagedRoles } from "@/lib/content-items";
import { ClosingCta, ClosingArrow } from "@/components/shared/closing-cta";
import { OpenRoles } from "@/sections/careers/open-roles";
import { CareersHero, CareersHiring, CareersQuestions, CAREERS_QUESTIONS } from "@/sections/careers/careers-sections";
import { openGraphFor } from "@/lib/seo";
import s from "@/sections/careers/careers.module.css";

/** Developer workspace, real content, short sentences. Contract: tmp/careers-redesign/brief.md.
 * Shared brand and application pipeline retained; no sample jobs, code, team or benefits.
 * Finish: unreviewed and undocumented is unfinished; this build ends with the finish review,
 * the verdict, DESIGN.md, and every shipping raster carrying its provenance. */
export const revalidate = 0;
const DESCRIPTION = "Explore careers at Savo Technologies. View current openings or send a general application for work in design, software engineering and AI.";
export const metadata: Metadata = {
  title: "Careers", description: DESCRIPTION, alternates: { canonical: "/careers" },
  openGraph: openGraphFor({ title: "Careers | Savo Technologies", description: DESCRIPTION, url: "/careers" }),
};

export default async function CareersPage() {
  const roles = await getManagedRoles();
  // Compensation stays server-only, including the RSC payload and structured data.
  const publicRoles = roles.map(toPublicRole);
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "WebPage", "@id": absoluteUrl("/careers/#webpage"), url: absoluteUrl("/careers"), name: "Careers | Savo Technologies", description: DESCRIPTION, isPartOf: { "@id": absoluteUrl("/#website") } },
      { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") }, { "@type": "ListItem", position: 2, name: "Careers", item: absoluteUrl("/careers") }] },
      { "@type": "FAQPage", mainEntity: CAREERS_QUESTIONS.map(item => ({ "@type": "Question", name: item.q, acceptedAnswer: { "@type": "Answer", text: item.a } })) },
      ...publicRoles.map(role => ({
        "@type": "JobPosting", title: role.title, ...(role.datePosted ? { datePosted: role.datePosted } : {}),
        description: [role.blurb, "What you will do:", ...role.duties, "What you bring:", ...role.brings, role.exp].join("\n"),
        hiringOrganization: { "@type": "Organization", "@id": absoluteUrl("/#organization"), name: SITE.name, sameAs: absoluteUrl("/") },
        url: absoluteUrl(`/careers/apply?role=${roleSlug(role.title)}`),
        // Location and employment terms are not inferred from company defaults.
      })),
    ],
  };
  return <div className={s.page} data-careers-page="workspace">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    <CareersHero count={publicRoles.length} />
    <OpenRoles roles={publicRoles} />
    <CareersHiring />
    <CareersQuestions />
    <ClosingCta headingId="careers-close-heading" title="Let’s start with you." description="Tell us what you do well and what you want to build next.">
      <Link href="/careers/apply?role=general-application">Send a general application <ClosingArrow /></Link>
    </ClosingCta>
  </div>;
}
