import Link from "next/link";
import { Section } from "@/components/ui/section";
import { SectionHeader } from "@/components/ui/section-header";
import { Reveal } from "@/components/ui/reveal";

/**
 * PROOF, NOT PROMISES (master spec Part 112) - the editorial connector
 * between clients, projects, verification and outcomes. Honest about the
 * publication standard: verification before claims, always.
 */

const COLUMNS = [
  {
    k: "Work",
    v: "Case studies documented at full depth: situation, complexity, decisions, architecture, quality and outcomes.",
    href: "/case-studies",
    link: "Explore the dossier",
  },
  {
    k: "Verification",
    v: "Metrics publish only when they can be evidenced. Testimonials publish only with permission. Client identities publish only with approval.",
    href: "/trust",
    link: "How we handle proof",
  },
  {
    k: "Transparency",
    v: "Milestones, approvals, invoices and meetings in a client portal. Documentation and handover by default.",
    href: "/enterprise",
    link: "For enterprise buyers",
  },
] as const;

export function ProofNotPromises() {
  return (
    <Section index="Proof" labelledBy="proof-heading" className="bg-surface-2/40">
      <SectionHeader
        id="proof-heading"
        heading={<>Proof, not promises.</>}
        lead={<>Anyone can claim capability. Evidence is harder to fake - so the site is built around it.</>}
      />
      <Reveal>
        <div className="grid gap-px border border-border bg-border lg:grid-cols-3">
          {COLUMNS.map((c) => (
            <div key={c.k} className="flex h-full flex-col bg-background p-6 sm:p-8">
              <h3 className="t-h4 font-serif">{c.k}</h3>
              <p className="t-sm mt-3 flex-1 leading-relaxed text-muted">{c.v}</p>
              <Link
                href={c.href}
                className="t-label mt-6 text-accent-strong underline underline-offset-4 transition-colors hover:text-foreground"
              >
                {c.link} →
              </Link>
            </div>
          ))}
        </div>
      </Reveal>
    </Section>
  );
}
