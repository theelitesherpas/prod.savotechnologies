import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/constants/site";
import { absoluteUrl } from "@/lib/env";
import { Reveal } from "@/components/ui/reveal";
import { Section } from "@/components/ui/section";
import { SectionHeader } from "@/components/ui/section-header";
import { openGraphFor } from "@/lib/seo";

/**
 * Indore location page - Savo Technologies is headquartered in Indore,
 * Madhya Pradesh. This page exists because the company genuinely operates
 * from Indore; it explains what that means for clients rather than
 * repeating the homepage. No fabricated street address, no invented
 * landmarks, no keyword blocks.
 */

const DESCRIPTION =
  "Savo Technologies is a software development company headquartered in Indore, Madhya Pradesh. Web development, mobile apps, custom software and AI systems, delivered from our Indore engineering headquarters to clients across India.";

export const metadata: Metadata = {
  title: "Software, Web & Mobile App Development Company in Indore",
  description: DESCRIPTION,
  alternates: { canonical: "/locations/indore" },
  openGraph: openGraphFor({
    title: "Software, Web & Mobile App Development Company in Indore | Savo Technologies",
    description: DESCRIPTION,
    url: "/locations/indore",
  }),
};

const SERVICES = [
  {
    title: "Website development in Indore",
    body: "Corporate websites, marketing sites and storefronts built with Next.js and React, engineered for speed and search from the first commit.",
    href: "/services/web-development",
  },
  {
    title: "Mobile app development in Indore",
    body: "iOS, Android and Flutter applications, from product discovery through store launch and post-release iteration.",
    href: "/services/mobile-app-development",
  },
  {
    title: "Custom software development in Indore",
    body: "Internal tools, portals, integrations and line-of-business systems shaped around the way your company actually works.",
    href: "/services/custom-software-development",
  },
  {
    title: "AI development in Indore",
    body: "AI agents, generative AI integrations and automation built on the same engineering discipline as the rest of our work.",
    href: "/ai-agents",
  },
];

const FAQS = [
  {
    q: "Where is Savo Technologies located?",
    a: "Savo Technologies is headquartered in Indore, Madhya Pradesh, India. The incorporated company operates as Savo Technologies Private Limited and works with clients across India and worldwide.",
  },
  {
    q: "Does Savo Technologies work with clients outside Indore?",
    a: "Yes. Most engagements run remotely with structured communication, and our delivery track record includes clients across India and other countries. Indore clients can also meet the team on site.",
  },
  {
    q: "What services does Savo Technologies offer from Indore?",
    a: "Website and web application development, mobile app development for iOS and Android, custom software development, AI agents and AI automation, SaaS product development and UI/UX design.",
  },
  {
    q: "How do I start a project with Savo Technologies?",
    a: "Send a message through the contact page or start a project brief. A senior engineer replies within one business day, and discovery begins with your actual constraints, not a generic pitch.",
  },
];

export default function IndorePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": absoluteUrl("/locations/indore/#webpage"),
        url: absoluteUrl("/locations/indore"),
        name: "Software, Web & Mobile App Development Company in Indore",
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
              name: "Indore",
              item: absoluteUrl("/locations/indore"),
            },
          ],
        },
      },
      {
        "@type": "FAQPage",
        "@id": absoluteUrl("/locations/indore/#faq"),
        mainEntity: FAQS.map((f) => ({
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
      <Section id="indore" index="Location" labelledBy="indore-heading">
        <SectionHeader
          id="indore-heading"
          heading="An engineering company based in Indore."
          lead={`${SITE.name} builds software from Indore, Madhya Pradesh, one of India's fastest growing technology cities. The company operates as ${SITE.legalName} and works with clients across India and worldwide.`}
        />
        <Reveal className="mt-12 grid gap-px border border-border bg-border sm:grid-cols-3">
          {[
            { k: "Headquarters", v: "Indore, Madhya Pradesh, India" },
            { k: "Legal entity", v: SITE.legalName },
            { k: "Working language", v: "English, Hindi" },
          ].map((item) => (
            <div key={item.k} className="bg-background p-7">
              <p className="t-label text-muted">{item.k}</p>
              <p className="t-body mt-3 text-foreground">{item.v}</p>
            </div>
          ))}
        </Reveal>
      </Section>

      {/* 02: Services delivered from Indore */}
      <Section id="services" index="Services" labelledBy="services-heading">
        <SectionHeader
          id="services-heading"
          heading="What we build from here."
          lead="The same senior team, process and quality bar serves Indore businesses and clients anywhere in India."
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

      {/* 03: Why Indore works for clients */}
      <Section id="working" index="Working together" labelledBy="working-heading">
        <SectionHeader
          id="working-heading"
          heading="Working with an Indore based team."
          lead="Indore gives our clients two practical advantages, and we are specific about both."
        />
        <Reveal className="mt-12 grid gap-px border border-border bg-border sm:grid-cols-2">
          <div className="bg-background p-7">
            <h3 className="t-h3">Deep engineering talent, sensible rates</h3>
            <p className="t-body mt-3 text-muted">
              Indore produces strong engineers across web, mobile and data work. Costs stay
              lower than the metros without compromising seniority, a combination we pass
              on in project pricing.
            </p>
          </div>
          <div className="bg-background p-7">
            <h3 className="t-h3">One timezone, direct access</h3>
            <p className="t-body mt-3 text-muted">
              For clients anywhere in India, we are in your working hours. You talk to the
              engineers building your product, not an account layer relaying messages.
            </p>
          </div>
        </Reveal>
      </Section>

      {/* 04: FAQ (AEO) */}
      <Section id="faq" index="Questions" labelledBy="faq-heading">
        <SectionHeader
          id="faq-heading"
          heading="Questions clients ask."
          lead="Direct answers, kept current with how we actually work."
        />
        <div className="mt-12 divide-y divide-border border-y border-border">
          {FAQS.map((f) => (
            <Reveal key={f.q} className="py-6">
              <h3 className="t-h3">{f.q}</h3>
              <p className="t-body mt-3 max-w-3xl text-muted">{f.a}</p>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* 05: Contact */}
      <Section id="start" index="Start" labelledBy="start-heading">
        <SectionHeader
          id="start-heading"
          heading="Start a conversation."
          lead="Indore client or fully remote, the first step is the same: tell us what you are building."
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
      </Section>
    </>
  );
}
