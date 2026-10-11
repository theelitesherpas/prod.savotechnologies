import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/env";
import { openGraphFor } from "@/lib/seo";
import { buildProfileModel, PROFILE_FAQS } from "@/sections/company-profile/profile-content";
import { ProfileCapabilities, ProfileContact, ProfileHero, ProfileIdentity, ProfileIndustries, ProfileProcess, ProfileQuestions, ProfileTechnologyAndWork, ProfileWorkingTerms } from "@/sections/company-profile/profile-sections";
import s from "@/sections/company-profile/profile.module.css";

/** THESIS: A complete company/capability record that is useful on screen and paper.
 * OWN-WORLD: User-pinned homepage/Trust Outfit/Inter, white/grey/black/red identity.
 * STORY: Identity → capabilities/industries → technology/work → process/terms → FAQ/contact.
 * FIRST VIEWPORT: Grey invitation with native print action left, real registry identity
 * on a black brand sheet right; useful chapter anchors below, not numbered sections.
 * FORM: Direct continuation of the approved family; no new-world/layout-choice gate.
 * Server-rendered facts/reading, native FAQs and a tiny browser-print client boundary.
 * FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance. */
export const metadata: Metadata = {
  title: "Company Profile",
  description: "Savo Technologies company profile: overview, legal identity, capabilities, industries, technology, process, engagement models and contact. Printable.",
  alternates: { canonical: "/company-profile" },
  openGraph: openGraphFor({ title: "Company Profile | Savo Technologies", description: "Printable Savo Technologies capability profile.", url: "/company-profile" }),
};

export default function CompanyProfilePage() {
  const model = buildProfileModel();
  const jsonLd = { "@context": "https://schema.org", "@graph": [
    { "@type": "WebPage", "@id": absoluteUrl("/company-profile/#webpage"), url: absoluteUrl("/company-profile"), name: "Company Profile | Savo Technologies", isPartOf: { "@id": absoluteUrl("/#website") } },
    { "@type": "FAQPage", mainEntity: PROFILE_FAQS.map(item => ({ "@type": "Question", name: item.q, acceptedAnswer: { "@type": "Answer", text: item.a } })) },
  ] };
  return <div className={s.page} data-company-profile-page="canonical-and-printable" data-design-contract="company-profile-v7: User-pinned Savo page family. Grey print invitation, actual registry brand sheet, complete ten-chapter company record, native questions and verified contact. Named, route-guarded paper output with every FAQ answer and no site chrome. No pretend PDF download, freshly-reviewed timestamp or proof fillers.">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    <ProfileHero model={model} />
    <ProfileIdentity model={model} />
    <ProfileCapabilities />
    <ProfileIndustries />
    <ProfileTechnologyAndWork />
    <ProfileProcess />
    <ProfileWorkingTerms />
    <ProfileQuestions />
    <ProfileContact model={model} />
  </div>;
}
