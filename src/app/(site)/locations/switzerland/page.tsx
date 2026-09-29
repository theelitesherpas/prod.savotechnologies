import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/constants/site";
import { absoluteUrl } from "@/lib/env";
import { Reveal } from "@/components/ui/reveal";
import { Section } from "@/components/ui/section";
import { SectionHeader } from "@/components/ui/section-header";
import { Faq } from "@/components/shared/faq";
import { SWITZERLAND_FAQS } from "@/constants/faqs";
import { openGraphFor } from "@/lib/seo";

/**
 * Switzerland location page — Savo Technologies' head office is in
 * Granges-Marnand. Like the Indore page, this exists because the company
 * genuinely operates there; it explains what that means for Swiss and
 * European clients. Verified facts only (address and phone from the
 * supplied office record, 2026-09-25): no invented landmarks, no
 * certification claims, no keyword blocks.
 */

const DESCRIPTION =
  "Savo Technologies' head office is in Granges-Marnand, Switzerland. Web development, mobile apps, custom software, AI agents and SEO/AEO/GEO services for Swiss and European clients, delivered with our Indore engineering headquarters.";

export const metadata: Metadata = {
  title: "Software & AI Development Company in Switzerland",
  description: DESCRIPTION,
  alternates: { canonical: "/locations/switzerland" },
  openGraph: openGraphFor({
    title: "Software & AI Development Company in Switzerland | Savo Technologies",
    description: DESCRIPTION,
    url: "/locations/switzerland",
  }),
};

const SERVICES = [
  { title: "Web development", body: "Corporate websites, web applications and platforms on Next.js and React — fast, accessible and engineered for European buyers and search engines.", href: "/services/web-development" },
  { title: "Mobile app development", body: "iOS and Android apps with Flutter and React Native, from first release to store-scale operation.", href: "/services/mobile-app-development" },
  { title: "AI agents & agentic systems", body: "Agents with tool use, retrieval, evaluation and guardrails — automation that holds up in production, not slideware.", href: "/ai-agents" },
  { title: "Custom software & SaaS", body: "Operational software, portals and SaaS platforms on PostgreSQL-grade architecture, built for the long run.", href: "/services/custom-software-development" },
  { title: "UI/UX design", body: "Product design that European users find obvious and beautiful — research, prototypes, design systems.", href: "/services/ui-ux-design" },
  { title: "SEO, AEO & GEO", body: "Classic search plus answer engines and generative engines — being found however your clients ask.", href: "/services" },
];

export default function SwitzerlandPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": absoluteUrl("/locations/switzerland/#webpage"),
        url: absoluteUrl("/locations/switzerland"),
        name: "Software & AI Development Company in Switzerland",
        description: DESCRIPTION,
        isPartOf: { "@id": absoluteUrl("/#website") },
        about: { "@id": absoluteUrl("/#organization") },
        breadcrumb: {
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
            {
              "@type": "ListItem",
              position: 2,
              name: "Switzerland",
              item: absoluteUrl("/locations/switzerland"),
            },
          ],
        },
      },
      {
        "@type": "FAQPage",
        "@id": absoluteUrl("/locations/switzerland/#faq"),
        mainEntity: SWITZERLAND_FAQS.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* 01: Position */}
      <Section id="switzerland" index="Location" labelledBy="switzerland-heading">
        <SectionHeader
          id="switzerland-heading"
          heading="Our Swiss head office."
          lead={`${SITE.name} operates its head office from Granges-Marnand, Switzerland, and its engineering headquarters from Indore, India. For Swiss and European clients that means senior presence in your time zone and a deep engineering bench behind it.`}
        />
        <Reveal className="mt-12 grid gap-px border border-border bg-border sm:grid-cols-3">
          {[
            { k: "Head office", v: "Rue de la Fruiterie 13, 1523 Granges-Marnand, Switzerland" },
            { k: "Direct line", v: "+41 76 408 28 72" },
            { k: "Engineering HQ", v: "Indore, Madhya Pradesh, India" },
          ].map((item) => (
            <div key={item.k} className="bg-background p-7">
              <p className="t-label text-muted">{item.k}</p>
              <p className="t-body mt-3 text-foreground">{item.v}</p>
            </div>
          ))}
        </Reveal>
      </Section>

      {/* 02: Services for Swiss and European clients */}
      <Section id="services" index="Services" labelledBy="services-heading">
        <SectionHeader
          id="services-heading"
          heading="What we deliver in Switzerland."
          lead="The same senior team, process and quality bar serves Swiss clients as clients anywhere — with European hours covered from the head office."
        />
        <div className="mt-12 grid gap-px border border-border bg-border sm:grid-cols-2">
          {SERVICES.map((s) => (
            <Reveal key={s.title}>
              <Link
                href={s.href}
                className="group flex h-full flex-col gap-3 bg-background p-7 transition-colors duration-300 hover:bg-foreground hover:text-background"
              >
                <h3 className="t-h3">{s.title}</h3>
                <p className="t-body text-muted group-hover:text-background/80">{s.body}</p>
              </Link>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* 03: Why the two-office setup works */}
      <Section id="working" index="Working together" labelledBy="working-heading">
        <SectionHeader
          id="working-heading"
          heading="Working with a Swiss-anchored team."
          lead="Two offices, one team — and we are specific about what each contributes."
        />
        <Reveal className="mt-12 grid gap-px border border-border bg-border sm:grid-cols-2">
          <div className="bg-background p-7">
            <h3 className="t-h3">Senior presence, European hours</h3>
            <p className="t-body mt-3 text-muted">
              The Granges-Marnand office works Central European Time, aligned with your
              business day — for conversations, decisions and accountability close to you,
              not half a world away.
            </p>
          </div>
          <div className="bg-background p-7">
            <h3 className="t-h3">Engineering depth while Europe sleeps</h3>
            <p className="t-body mt-3 text-muted">
              The Indore headquarters supplies a senior engineering bench working ahead of
              your day. Progress is visible in your morning; questions from your afternoon
              are answered by the next one.
            </p>
          </div>
        </Reveal>
      </Section>

      {/* 04: FAQ (AEO/GEO) */}
      <Section id="faq" index="Questions" labelledBy="faq-heading" className="bg-surface-2/60">
        <SectionHeader
          id="faq-heading"
          heading="Questions Swiss clients ask."
          lead="Direct answers, kept current with how we actually work."
        />
        <div className="mt-12">
          <Faq items={SWITZERLAND_FAQS} label="Savo Technologies Switzerland, frequently asked questions" />
        </div>
      </Section>

      {/* 05: Contact */}
      <Section id="start" index="Start" labelledBy="start-heading">
        <SectionHeader
          id="start-heading"
          heading="Start a conversation."
          lead="From Granges-Marnand, Indore or wherever you are — the first step is the same: tell us what you are building."
        />
        <Reveal className="mt-8 flex flex-wrap gap-4">
          <Link
            href="/start"
            className="t-button inline-flex items-center justify-center bg-foreground px-7 py-4 text-background transition-colors hover:bg-foreground/85"
          >
            Start a Project
          </Link>
          <Link
            href="/contact"
            className="t-button inline-flex items-center justify-center border border-foreground px-7 py-4 text-foreground transition-colors hover:bg-foreground hover:text-background"
          >
            Contact the team
          </Link>
        </Reveal>
        <Reveal className="mt-10">
          <p className="t-caption text-muted">
            Also in India:{" "}
            <Link href="/locations/indore" className="link-underline text-foreground">
              our Indore engineering headquarters
            </Link>
            .
          </p>
        </Reveal>
      </Section>
    </>
  );
}
