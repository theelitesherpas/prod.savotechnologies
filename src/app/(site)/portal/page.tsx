import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/env";
import { Section } from "@/components/ui/section";
import { SectionHeader } from "@/components/ui/section-header";
import { Reveal } from "@/components/ui/reveal";
import { DetailCta } from "@/components/shared/detail-cta";
import { openGraphFor } from "@/lib/seo";

/**
 * Client portal — the honest teaser. The portal is in production; this
 * page says so plainly, shows what it will carry, and offers the
 * human channel meanwhile.
 */

const DESCRIPTION = `The Savo Technologies client portal — project status, deliverables, invoices and support in one place. Currently in production; talk to us directly meanwhile.`;

export const metadata: Metadata = {
  title: "Client Portal",
  description: DESCRIPTION,
  alternates: { canonical: "/portal" },
  openGraph: openGraphFor({ title: "Client Portal | SAVO Technologies", description: DESCRIPTION, url: "/portal" }),
};

const PORTAL_SECTIONS = [
  { title: "Project status", text: "Milestones, decisions and what shipped this week — the same view our delivery leads use." },
  { title: "Deliverables", text: "Documents, environments and handover artefacts, versioned and in one place." },
  { title: "Invoices & contracts", text: "Billing history, statements and agreements — no email archaeology." },
  { title: "Direct support", text: "Open a ticket with the team that builds your product, not a queue that reads scripts." },
];

export default function PortalPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": absoluteUrl("/portal/#webpage"),
        url: absoluteUrl("/portal"),
        name: "Client Portal | SAVO Technologies",
        description: DESCRIPTION,
        isPartOf: { "@id": absoluteUrl("/#website") },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
          { "@type": "ListItem", position: 2, name: "Client Portal", item: absoluteUrl("/portal") },
        ],
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <section aria-labelledby="portal-heading" className="relative overflow-hidden">
        <div className="shell pb-20 pt-[calc(var(--nav-h)+4.5rem)] sm:pb-24">
          <div aria-hidden="true" className="mb-12 flex items-center gap-4 sm:mb-16">
            <span className="h-2 w-2 shrink-0 bg-accent" />
            <span className="t-label text-muted">Client Portal</span>
            <span className="h-px flex-1 bg-border" />
          </div>
          <div className="grid items-end gap-12 lg:grid-cols-12 lg:gap-10">
            <div className="lg:col-span-7">
              <Reveal>
                <h1 id="portal-heading" className="t-statement max-w-[15ch]">
                  Your project, one login away
                  <span aria-hidden="true" className="text-accent">.</span>
                </h1>
              </Reveal>
              <Reveal delay={120}>
                <p className="t-body-lg mt-8 max-w-xl text-muted">
                  The client portal is in production. Meanwhile, every client
                  gets the same access the old way: a named delivery lead,
                  weekly demos, and a direct line to the team building
                  your product.
                </p>
              </Reveal>
            </div>
            <div className="lg:col-span-5">
              <Reveal delay={200}>
                <div className="blueprint relative border border-border bg-surface p-8 sm:p-10">
                  <div className="flex items-center justify-between">
                    <p className="t-label text-muted">Status — in production</p>
                    <span aria-hidden="true" className="flex gap-1.5">
                      <span className="h-1.5 w-1.5 bg-accent schem-pulse" />
                      <span className="h-1.5 w-1.5 bg-border" />
                      <span className="h-1.5 w-1.5 bg-border" />
                    </span>
                  </div>
                  <div className="mt-8 space-y-4" aria-hidden="true">
                    <div className="h-2 w-2/3 bg-foreground/10" />
                    <div className="h-2 w-1/2 bg-foreground/10" />
                    <div className="h-2 w-5/6 bg-foreground/10" />
                    <div className="mt-6 h-2 w-1/3 bg-accent/30" />
                  </div>
                  <p className="t-caption mt-8 text-muted">
                    We ship what we promise — including our own tools. This page updates the day the portal opens.
                  </p>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      <Section index="What It Carries" labelledBy="carries-heading">
        <SectionHeader
          id="carries-heading"
          heading="What the portal will carry."
          lead={<>Four rooms, one login — everything a running engagement produces, where you can actually find it.</>}
        />
        <Reveal>
          <ul className="grid grid-cols-1 gap-px border border-border bg-border md:grid-cols-2">
            {PORTAL_SECTIONS.map((item) => (
              <li key={item.title} className="flex flex-col gap-3.5 bg-background p-7 sm:p-8">
                <span aria-hidden="true" className="h-2 w-2 shrink-0 bg-accent" />
                <h3 className="t-h3 pt-1">{item.title}</h3>
                <p className="t-body mt-auto text-muted">{item.text}</p>
              </li>
            ))}
          </ul>
        </Reveal>
      </Section>

      <DetailCta
        headingId="portal-cta-heading"
        heading="Need something today?"
        lead="Existing client with a question? Your delivery lead answers directly — that channel never waits for software."
        location="portal-cta"
        secondaryLabel="Contact Us"
        secondaryHref="/contact"
      />
    </>
  );
}
