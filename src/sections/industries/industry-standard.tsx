import Image from "next/image";
import Link from "next/link";
import type { IndustryDetail } from "@/constants/industry-details";
import { Section } from "@/components/ui/section";
import { SectionHeader } from "@/components/ui/section-header";
import { Reveal } from "@/components/ui/reveal";
import { FeatureIcon } from "@/components/shared/feature-icon";

/**
 * INDUSTRY STANDARD SECTIONS (master spec Parts 53–55).
 *
 * The operational-depth layer: real challenges, the workflows the sector
 * runs, technology, integrations, security posture, AI opportunities and
 * cross-links - rendered in the site's own visual vocabulary: sector
 * photography (duotone `photo` treatment) anchored beside icon-led
 * workflow groups, drawn vector icons from the FeatureIcon set.
 */

export function IndustryChallenges({ detail }: { detail: IndustryDetail }) {
  if (!detail.challenges?.length) return null;
  const headingId = `${detail.id}-challenges-heading`;
  return (
    <Section index="Reality" labelledBy={headingId}>
      <SectionHeader
        id={headingId}
        heading={<>What makes this sector hard.</>}
        lead={<>The operational reality the software has to survive, understood before anything is designed.</>}
      />
      <Reveal>
        <div className="grid gap-px border border-border bg-border md:grid-cols-2">
          {detail.challenges.map((c, i) => (
            <div key={c.title} className="flex gap-5 bg-background p-6 sm:p-8">
              <FeatureIcon index={i} className="mt-0.5 h-7 w-7 shrink-0 text-accent" />
              <div>
                <h3 className="t-h4 font-semibold">{c.title}</h3>
                <p className="t-sm mt-2 max-w-[52ch] leading-relaxed text-muted">{c.text}</p>
              </div>
            </div>
          ))}
        </div>
      </Reveal>
    </Section>
  );
}

export function IndustryOperations({ detail }: { detail: IndustryDetail }) {
  if (!detail.operations?.length) return null;
  const headingId = `${detail.id}-operations-heading`;
  return (
    <Section index="Workflows" chapter="ink" labelledBy={headingId}>
      <SectionHeader
        id={headingId}
        heading={<>How the sector actually runs.</>}
        lead={<>The workflows behind the product, because the software has to match the operation, not the reverse.</>}
      />
      <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
        {/* Sector photography anchor - the system's duotone treatment */}
        <Reveal className="lg:col-span-5">
          <div className="group relative aspect-[4/5] overflow-hidden border border-border lg:sticky lg:top-28">
            <Image
              src={`/images/sectors/${detail.id}-detail.webp`}
              alt={`${detail.title} operations`}
              fill
              sizes="(max-width: 1024px) 100vw, 40vw"
              className="photo object-cover"
            />
            <div aria-hidden="true" className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#101319cc] to-transparent p-6 pt-16">
              <p className="t-label text-[#eef0f4]">{detail.title}</p>
              <p className="t-caption mt-1 text-[#a3a8b3]">Operational workflows, field view</p>
            </div>
          </div>
        </Reveal>

        {/* Icon-led workflow groups */}
        <div className="space-y-8 lg:col-span-7">
          {detail.operations.map((o, i) => (
            <Reveal key={o.title} delay={i * 60}>
              <div className="border border-border bg-surface p-6 sm:p-7">
                <div className="flex items-center gap-4">
                  <FeatureIcon index={i} className="h-7 w-7 shrink-0 text-accent" />
                  <h3 className="t-h4 font-semibold">{o.title}</h3>
                </div>
                <ul className="mt-5 grid gap-x-8 gap-y-2.5 sm:grid-cols-2">
                  {o.items.map((item) => (
                    <li key={item} className="flex items-start gap-3 t-sm text-muted">
                      <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 bg-accent" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </Section>
  );
}

export function IndustrySystems({ detail }: { detail: IndustryDetail }) {
  const hasTech = !!detail.technology?.length;
  const hasInt = !!detail.integrations?.length;
  const hasAi = !!detail.aiOpportunities?.length;
  if (!hasTech && !hasInt && !detail.security && !hasAi && !detail.relatedWork?.length) return null;
  const headingId = `${detail.id}-systems-heading`;

  return (
    <Section index="Systems" labelledBy={headingId} className="bg-surface-2/40">
      <SectionHeader
        id={headingId}
        heading={<>Technology, systems and judgment.</>}
        lead={<>What these platforms are built on, connect to, and where AI genuinely earns its place.</>}
      />
      <div className="space-y-10">
        {hasTech || hasInt ? (
          <Reveal>
            <div className="grid gap-6 md:grid-cols-2">
              {hasTech ? (
                <div className="border border-border bg-background p-6 sm:p-7">
                  <h3 className="t-label mb-4 text-muted">Technology</h3>
                  <div className="flex flex-wrap gap-2">
                    {detail.technology!.map((t) => (
                      <span key={t} className="t-sm border border-border bg-surface px-3 py-1.5">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
              {hasInt ? (
                <div className="border border-border bg-background p-6 sm:p-7">
                  <h3 className="t-label mb-4 text-muted">Integrations</h3>
                  <div className="flex flex-wrap gap-2">
                    {detail.integrations!.map((t) => (
                      <span key={t} className="t-sm border border-border bg-surface px-3 py-1.5">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </Reveal>
        ) : null}
        {detail.security ? (
          <Reveal>
            <div className="flex gap-5 border border-border bg-background p-6 sm:p-7">
              <FeatureIcon index={0} className="mt-0.5 h-7 w-7 shrink-0 text-accent" />
              <div>
                <h3 className="t-label mb-2 text-muted">Security considerations</h3>
                <p className="t-sm max-w-[80ch] leading-relaxed text-muted">{detail.security}</p>
              </div>
            </div>
          </Reveal>
        ) : null}
        {hasAi ? (
          <Reveal>
            <h3 className="t-label mb-5 text-muted">Where AI applies, honestly</h3>
            <div className="grid gap-px border border-border bg-border md:grid-cols-3">
              {detail.aiOpportunities!.map((a, i) => (
                <div key={a.title} className="bg-background p-6">
                  <FeatureIcon index={i + 1} className="mb-4 h-8 w-8 text-accent" />
                  <h4 className="t-h4 font-semibold">{a.title}</h4>
                  <p className="t-sm mt-2.5 leading-relaxed text-muted">{a.text}</p>
                </div>
              ))}
            </div>
          </Reveal>
        ) : null}
        {detail.relatedWork?.length ? (
          <Reveal>
            <div className="flex flex-wrap items-center gap-3 border-t border-border pt-8">
              <span className="t-label text-muted">Keep exploring</span>
              {detail.relatedWork.map((w) => (
                <Link
                  key={w.href}
                  href={w.href}
                  className="t-label border border-border bg-background px-4 py-2 transition-colors hover:border-accent hover:text-accent-strong"
                >
                  {w.label} →
                </Link>
              ))}
            </div>
          </Reveal>
        ) : null}
      </div>
    </Section>
  );
}
