import type { Metadata } from "next";
import Link from "next/link";
import { getSettings } from "@/lib/settings";
import { SITE, OFFICES } from "@/constants/site";
import { absoluteUrl } from "@/lib/env";
import { Reveal } from "@/components/ui/reveal";
import { Section } from "@/components/ui/section";
import { SectionHeader } from "@/components/ui/section-header";
import { DialogLink } from "@/components/layout/dialog-link";
import { ContactHero } from "@/sections/contact/contact-hero";
import { ContactForm } from "@/sections/contact/contact-form";
import { DirectChannels } from "@/sections/contact/direct-channels";
import { WhatNext } from "@/sections/contact/what-next";
import { Offices } from "@/sections/contact/offices";
import { Team } from "@/sections/contact/team";
import { openGraphFor } from "@/lib/seo";

/**
 * Contact Us — version-1 content (topic form, direct channels, offices,
 * team) rebuilt in the v6 design language and wired into the shared
 * enquiry pipeline (admin inbox, honeypot, rate limit, IP hashing).
 */

const DESCRIPTION =
  "Talk to the engineers who will build it. Message SAVO Technologies, book a call back, or reach the offices in Indore, Zürich, Riyadh, London and Sydney. One business day reply.";

export const metadata: Metadata = {
  title: "Contact Us",
  description: DESCRIPTION,
  alternates: { canonical: "/contact" },
  openGraph: openGraphFor({ title: "Contact Us | SAVO Technologies", description: DESCRIPTION, url: "/contact" }),
};

export default async function ContactPage() {
  const settings = await getSettings();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: "Contact SAVO Technologies",
    url: absoluteUrl("/contact"),
    description: DESCRIPTION,
    mainEntity: {
      "@type": "Organization",
      "@id": absoluteUrl("/#organization"),
      name: SITE.name,
      email: settings.contactEmail,
      telephone: SITE.phoneE164,
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "sales",
        email: settings.contactEmail,
        telephone: SITE.phoneE164,
        availableLanguage: ["en"],
        areaServed: OFFICES.map((o) => o.region),
      },
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* 01 — Statement opening + response-time specimen */}
      <ContactHero />

      {/* 02 — The form, with direct channels and shortcuts alongside */}
      <Section id="send" index="Message" labelledBy="message-heading">
        <SectionHeader
          id="message-heading"
          heading="Send a message."
          lead="Takes a minute. Everything reaches a human — no ticket queues, no autoresponders."
        />

        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <Reveal delay={120}>
              <div className="border border-border bg-surface p-7 sm:p-10">
                <ContactForm />
              </div>
            </Reveal>
          </div>

          <aside className="lg:col-span-5 lg:pt-1" aria-label="Direct contact and shortcuts">
            <Reveal delay={200} className="space-y-6">
              <DirectChannels
                email={settings.contactEmail}
                phone={settings.contactPhone}
                phoneE164={SITE.phoneE164}
              />

              <div className="border border-border p-7 sm:p-8">
                <div className="mb-4 flex items-center gap-3">
                  <span aria-hidden="true" className="h-2 w-2 bg-accent" />
                  <h3 className="t-h4">Already know what you need?</h3>
                </div>
                <ul className="divide-y divide-border border-y border-border">
                  <li className="py-3">
                    <DialogLink label="Send a full project brief" />
                  </li>
                  <li>
                    <Link
                      href="/#services"
                      className="link-underline block py-3 text-[0.875rem] text-foreground/75 transition-colors hover:text-foreground"
                    >
                      Price it with the instant estimator
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/careers"
                      className="link-underline block py-3 text-[0.875rem] text-foreground/75 transition-colors hover:text-foreground"
                    >
                      Join the team instead
                    </Link>
                  </li>
                </ul>
              </div>
            </Reveal>
          </aside>
        </div>
      </Section>

      {/* Ink band — after-send expectations */}
      <WhatNext />

      {/* 03 — Global offices */}
      <Offices />

      {/* 04 — The people who answer */}
      <Team />
    </>
  );
}
