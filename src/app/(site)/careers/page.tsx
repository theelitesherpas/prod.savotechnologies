import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/constants/site";
import { absoluteUrl } from "@/lib/env";
import { ROLES_POSTED, roleSlug } from "@/constants/careers";
import { getManagedRoles } from "@/lib/content-items";
import { Reveal } from "@/components/ui/reveal";
import { CareersHero } from "@/sections/careers/careers-hero";
import { OpenRoles } from "@/sections/careers/open-roles";
import { HiringProcess } from "@/sections/careers/hiring-process";
import { LifeAtSavo } from "@/sections/careers/life-at-savo";
import { openGraphFor } from "@/lib/seo";

/**
 * Careers - version-1 content (roles, bands, hiring promise, apply flow)
 * rebuilt in the v6 document language. Applications share the enquiry
 * pipeline (admin inbox, honeypot, rate limit, IP hashing).
 *
 * v1 placeholder stats (team size, retention, eNPS) are intentionally
 * not carried over - v6 publishes only verifiable figures.
 */

const DESCRIPTION =
  "Open engineering and design roles at Savo Technologies: frontend, backend, AI and ML, mobile, DevOps and UI/UX. Full time from our Indore office with hybrid options, INR salaries, honest hiring in four steps.";

export const metadata: Metadata = {
  title: "Careers",
  description: DESCRIPTION,
  alternates: { canonical: "/careers" },
  openGraph: openGraphFor({ title: "Careers | Savo Technologies", description: DESCRIPTION, url: "/careers" }),
};

export default async function CareersPage() {
  const ROLES = await getManagedRoles();
  // Public shape only - compensation fields (band/ctc) never cross the
  // server/client boundary, so they cannot leak into the HTML payload.
  const publicRoles = ROLES.map(({ band: _band, ctc: _ctc, ...role }) => role);
  // JobPosting structured data - one entry per open role (Google Jobs / AEO).
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": ROLES.map((role) => ({
      "@type": "JobPosting",
      title: role.title,
      description: [
        role.blurb,
        "",
        "What you will do:",
        ...role.duties.map((d) => `- ${d}`),
        "",
        "What you bring:",
        ...role.brings.map((b) => `- ${b}`),
        "",
        `${role.exp} · Full time · Office (Indore) · Hybrid available`,
      ].join("\n"),
      employmentType: "FULL_TIME",
      datePosted: ROLES_POSTED,
      hiringOrganization: {
        "@type": "Organization",
        "@id": absoluteUrl("/#organization"),
        name: SITE.name,
        sameAs: absoluteUrl("/"),
      },
      jobLocation: {
        "@type": "Place",
        address: {
          "@type": "PostalAddress",
          streetAddress: SITE.hq.street,
          addressLocality: SITE.hq.city,
          addressRegion: SITE.hq.region,
          postalCode: SITE.hq.postalCode,
          addressCountry: SITE.hq.countryCode,
        },
      },
      url: absoluteUrl(`/careers/apply?role=${roleSlug(role.title)}`),
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* 01: Ink hero: statement, facts, code specimen */}
      <CareersHero roles={ROLES} />

      {/* 02: Open roles, filterable accordion */}
      <OpenRoles roles={publicRoles} />

      {/* 03: The four-step hiring promise (sand band) */}
      <HiringProcess />

      {/* 04: What working here is like */}
      <LifeAtSavo />

      {/* Closing note */}
      <section aria-labelledby="careers-close-heading" className="border-t border-border">
        <div className="shell flex flex-wrap items-center justify-between gap-6 py-14 sm:py-16">
          <Reveal>
            <h2 id="careers-close-heading" className="t-h2 max-w-[24ch]">
              Curious, ships weekly, ego checked in?
            </h2>
          </Reveal>
          <Reveal delay={100}>
            <Link
              href="/careers/apply"
              className="group/btn inline-flex h-[3.25rem] items-center justify-center gap-2.5 rounded-[2px] bg-foreground px-7 text-base font-semibold tracking-[-0.01em] text-background transition-colors duration-300 ease-[var(--ease-out-expo)] hover:bg-accent hover:text-on-accent"
            >
              Apply to join Savo
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
          </Reveal>
        </div>
      </section>
    </>
  );
}
