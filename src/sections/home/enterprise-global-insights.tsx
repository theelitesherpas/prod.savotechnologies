import Link from "next/link";
import { Section } from "@/components/ui/section";
import { SectionHeader } from "@/components/ui/section-header";
import { Reveal } from "@/components/ui/reveal";
import { ARTICLES } from "@/constants/insights";
import { COMPANY_FACTS } from "@/constants/company-facts";

/**
 * Homepage spec Part 110 completeness: the enterprise-trust band (#12),
 * global delivery (#15) and insights (#16). Compact by design; deep pages
 * carry the detail.
 */

/* ── #12 · Enterprise trust ─────────────────────────────────────── */
export function EnterpriseTrustBand() {
  return (
    <section aria-labelledby="ent-trust-heading" className="chapter-ink border-y border-border">
      <div className="shell py-14 sm:py-16">
        <Reveal>
          <div className="grid items-baseline gap-8 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <h2 id="ent-trust-heading" className="t-dl max-w-[16ch]">
                Enterprise-grade trust, stated plainly.
              </h2>
            </div>
            <div className="lg:col-span-5">
              <p className="t-body-lg text-muted">
                NDA before details. Source code, design and documentation remain yours, with repository access from
                day one. No compliance framework claimed that we cannot evidence.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/trust"
                  className="t-label border border-border px-4 py-2.5 transition-colors hover:border-accent hover:text-accent-strong"
                >
                  Trust &amp; security →
                </Link>
                <Link
                  href="/enterprise"
                  className="t-label border border-border px-4 py-2.5 transition-colors hover:border-accent hover:text-accent-strong"
                >
                  For enterprise buyers →
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ── #15 · Global delivery ──────────────────────────────────────── */
export function GlobalDelivery() {
  const offices = COMPANY_FACTS.operationalOffices.value as string;
  return (
    <section aria-labelledby="global-heading" className="bg-surface">
      <div className="shell py-14">
        <Reveal>
          <div className="grid items-baseline gap-6 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <h2 id="global-heading" className="t-dl max-w-[14ch]">
                Built in India. Working globally.
              </h2>
            </div>
            <div className="lg:col-span-7">
              <p className="t-sm leading-relaxed text-muted">
                {offices}. Every other region is served as a market presence, never presented as an office, and
                senior coverage spans Indian and European working hours.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href="/locations/indore"
                  className="t-label border border-border px-4 py-2.5 transition-colors hover:border-accent hover:text-accent-strong"
                >
                  Indore HQ →
                </Link>
                <Link
                  href="/locations/switzerland"
                  className="t-label border border-border px-4 py-2.5 transition-colors hover:border-accent hover:text-accent-strong"
                >
                  Switzerland office →
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ── #16 · Insights ─────────────────────────────────────────────── */
export function HomeInsights() {
  const latest = [...ARTICLES].slice(-3).reverse();
  return (
    <Section index="Insights" labelledBy="insights-heading">
      <SectionHeader
        id="insights-heading"
        heading={<>Thinking, published.</>}
        lead={<>Field notes, comparison guides and buyer education. Useful even if you never contact us.</>}
      />
      <Reveal>
        <ul className="grid gap-px border border-border bg-border lg:grid-cols-3">
          {latest.map((a) => (
            <li key={a.slug} className="bg-background">
              <Link href={`/insights/${a.slug}`} className="group flex h-full flex-col p-6 sm:p-8">
                <p className="t-label text-muted">
                  {a.cat}
                </p>
                <h3 className="t-h4 mt-3 font-serif group-hover:text-accent-strong">{a.title}</h3>
                <p className="t-sm mt-3 flex-1 leading-relaxed text-muted">{a.excerpt}</p>
                <span className="t-label mt-5 text-accent-strong underline underline-offset-4">
                  Read →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Reveal>
    </Section>
  );
}
