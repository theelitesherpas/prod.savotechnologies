import type { CaseStudy } from "@/lib/case-study-schema";
import { Reveal } from "@/components/ui/reveal";
import { Section } from "@/components/ui/section";
import { TrackView } from "@/components/ui/track-view";

/**
 * FLAGSHIP DOSSIER RENDERER (master spec Parts 9–12).
 *
 * The deep editorial and technical story: situation, complexity,
 * discovery, strategy, design, architecture, engineering, technology
 * decisions, quality, deployment, outcomes, verification.
 *
 * Design contract: typography-first, document rhythm, no card spam.
 * Sections alternate paper/ink chapters the way the homepage does.
 * Every block renders only when the underlying fact exists - no
 * placeholder prose is ever invented here (Part 117).
 */

function DossierHeading({ id, index, children }: { id: string; index: string; children: string }) {
  return (
    <Reveal>
      <div className="mb-10 grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <h2 id={id} className="t-dl">
            {children}
          </h2>
        </div>
        <div className="lg:col-span-5 lg:justify-self-end lg:self-end lg:pb-1.5">
          <span aria-hidden="true" className="t-label text-muted">
            {index}
          </span>
        </div>
      </div>
    </Reveal>
  );
}

function Prose({ children }: { children: string }) {
  return (
    <Reveal>
      <p className="t-body-lg max-w-[68ch] text-muted">{children}</p>
    </Reveal>
  );
}

export function FlagshipDossier({ study }: { study: CaseStudy }) {
  const d = study.dossier;
  if (!d) return null;

  const isDemo = study.status === "demo";
  const hasDesign = d.productDesign && (d.productDesign.summary || d.productDesign.research.length > 0);
  const hasOutcome = d.outcome && (d.outcome.business || d.outcome.technical || d.outcome.operational || d.outcome.user);

  const arch = d.architecture
    ? ([
        ["Frontend", d.architecture.frontend],
        ["Backend", d.architecture.backend],
        ["Database", d.architecture.database],
        ["Cloud", d.architecture.cloud],
        ["Authentication", d.architecture.authentication],
        ["APIs", d.architecture.apis],
        ["Search", d.architecture.search],
        ["Analytics", d.architecture.analytics],
        ["AI", d.architecture.ai],
      ] as const).filter(([, v]) => v)
    : [];

  return (
    <div className="border-t border-border">
      {/* ── Project information (Part 11 - restrained, factual) ── */}
      {d.projectInfo ? (
        <section aria-label="Project information" className="bg-surface">
          <div className="shell py-10 sm:py-12">
            <Reveal>
              <dl className="grid grid-cols-2 gap-x-8 gap-y-6 sm:grid-cols-3 lg:grid-cols-5">
                {[
                  ["Client identity", study.nda ? "Withheld (NDA)" : d.projectInfo.clientIdentity],
                  ["Product", d.projectInfo.product],
                  ["Platforms", study.platforms],
                  ["Engagement", d.projectInfo.engagement],
                  ["Case study approved", d.projectInfo.caseStudyApproved],
                ]
                  .filter(([, v]) => v)
                  .map(([k, v]) => (
                    <div key={k as string}>
                      <dt className="t-label text-muted">{k}</dt>
                      <dd className="t-sm mt-1.5">{v}</dd>
                    </div>
                  ))}
              </dl>
            </Reveal>
          </div>
        </section>
      ) : null}

      {study.nda ? (
        <section aria-label="Confidentiality note" className="border-y border-border">
          <div className="shell py-8">
            <p className="t-sm text-muted">
              Client identity withheld under confidentiality agreement. The industry, problem, platform,
              technology, architecture and outcomes below are described accurately.
            </p>
          </div>
        </section>
      ) : null}

      {/* ── The story ── */}
      {(d.aboutClient || d.situation) ? (
        <Section id="dossier-story" index="Story" labelledBy="dossier-story-heading">
          <DossierHeading id="dossier-story-heading" index="01 · The story">
            What existed, and why it had to change.
          </DossierHeading>
          <div className="space-y-8">
            {d.aboutClient ? (
              <div>
                <h3 className="t-h3 mb-4">About the client</h3>
                <Prose>{d.aboutClient}</Prose>
              </div>
            ) : null}
            {d.situation ? (
              <div>
                <h3 className="t-h3 mb-4">Situation</h3>
                <Prose>{d.situation}</Prose>
              </div>
            ) : null}
            {d.challenge ? (
              <div>
                <h3 className="t-h3 mb-4">Challenge</h3>
                <Prose>{d.challenge}</Prose>
              </div>
            ) : null}
          </div>
        </Section>
      ) : null}

      {/* ── Complexity ── */}
      {d.complexity.length > 0 ? (
        <section aria-labelledby="dossier-complexity-heading" className="chapter-ink border-y border-border">
          <div className="shell py-16 sm:py-20">
            <DossierHeading id="dossier-complexity-heading" index="02 · Complexity">
              What made it difficult.
            </DossierHeading>
            <Reveal>
              <ul className="grid gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
                {d.complexity.map((c) => (
                  <li key={c} className="flex items-start gap-3 bg-background p-6">
                    <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 bg-accent" />
                    <span className="t-sm">{c}</span>
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </section>
      ) : null}

      {/* ── Discovery & strategy ── */}
      {d.discovery || d.strategy ? (
        <Section id="dossier-decisions" index="Decisions" labelledBy="dossier-decisions-heading">
          <DossierHeading id="dossier-decisions-heading" index="03 · Discovery & strategy">
            What we learned, and what we decided.
          </DossierHeading>
          <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
            {d.discovery ? (
              <Reveal>
                <h3 className="t-h3 mb-4">Discovery</h3>
                <p className="t-body text-muted">{d.discovery}</p>
              </Reveal>
            ) : null}
            {d.strategy ? (
              <Reveal delay={120}>
                <h3 className="t-h3 mb-4">Strategy</h3>
                <p className="t-body text-muted">{d.strategy}</p>
              </Reveal>
            ) : null}
          </div>
        </Section>
      ) : null}

      {/* ── Product design ── */}
      {hasDesign ? (
        <section aria-labelledby="dossier-design-heading" className="bg-surface-2/40">
          <div className="shell py-16 sm:py-20">
            <DossierHeading id="dossier-design-heading" index="04 · Product design">
              How it was designed.
            </DossierHeading>
            {d.productDesign?.summary ? <Prose>{d.productDesign.summary}</Prose> : null}
            {d.productDesign && (d.productDesign.research.length > 0 || d.productDesign.artifacts.length > 0) ? (
              <div className="mt-10 grid gap-10 lg:grid-cols-2">
                {d.productDesign.research.length > 0 ? (
                  <Reveal>
                    <h3 className="t-h3 mb-5">Research</h3>
                    <ul className="space-y-3">
                      {d.productDesign.research.map((r) => (
                        <li key={r} className="flex items-start gap-3 t-sm text-muted">
                          <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 bg-accent" />
                          {r}
                        </li>
                      ))}
                    </ul>
                  </Reveal>
                ) : null}
                {d.productDesign.artifacts.length > 0 ? (
                  <Reveal delay={120}>
                    <h3 className="t-h3 mb-5">Artifacts delivered</h3>
                    <ul className="space-y-3">
                      {d.productDesign.artifacts.map((a) => (
                        <li key={a} className="flex items-start gap-3 t-sm text-muted">
                          <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 bg-accent" />
                          {a}
                        </li>
                      ))}
                    </ul>
                  </Reveal>
                ) : null}
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {/* ── Architecture & engineering ── */}
      {arch.length > 0 || d.engineering ? (
        <Section id="dossier-engineering" index="Engineering" labelledBy="dossier-engineering-heading">
          <DossierHeading id="dossier-engineering-heading" index="05 · Architecture & engineering">
            How it was engineered.
          </DossierHeading>
          {arch.length > 0 ? (
            <Reveal>
              <dl className="grid gap-px border border-border bg-border md:grid-cols-2 lg:grid-cols-3">
                {arch.map(([k, v]) => (
                  <div key={k} className="bg-background p-6">
                    <dt className="t-label text-muted">{k}</dt>
                    <dd className="t-sm mt-2 leading-relaxed">{v}</dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          ) : null}
          {d.engineering ? (
            <div className="mt-10 max-w-[72ch]">
              <h3 className="t-h3 mb-4">What was built</h3>
              <Prose>{d.engineering}</Prose>
            </div>
          ) : null}
          {d.technologyDecisions.length > 0 ? (
            <div className="mt-14">
              <h3 className="t-h3 mb-6">Technology decisions, and why</h3>
              <div className="space-y-px border border-border bg-border">
                {d.technologyDecisions.map((t) => (
                  <Reveal key={t.choice}>
                    <div className="bg-background p-6 sm:p-8">
                      <p className="t-h4 font-serif">{t.choice}</p>
                      <p className="t-sm mt-3 max-w-[70ch] text-muted">{t.why}</p>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          ) : null}
        </Section>
      ) : null}

      {/* ── Quality & deployment ── */}
      {d.qualityEngineering || d.deployment ? (
        <section aria-labelledby="dossier-quality-heading" className="chapter-ink border-y border-border">
          <div className="shell py-16 sm:py-20">
            <DossierHeading id="dossier-quality-heading" index="06 · Quality & deployment">
              How it was proven.
            </DossierHeading>
            <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
              {d.qualityEngineering ? (
                <Reveal>
                  <h3 className="t-h3 mb-4">Quality engineering</h3>
                  <p className="t-body text-muted">{d.qualityEngineering}</p>
                </Reveal>
              ) : null}
              {d.deployment ? (
                <Reveal delay={120}>
                  <h3 className="t-h3 mb-4">Deployment & operations</h3>
                  <p className="t-body text-muted">{d.deployment}</p>
                </Reveal>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      {/* ── Outcomes (completion beacon: spec Part 89) ── */}
      {hasOutcome ? (
        <TrackView event="case_study_completed" data={{ slug: study.slug, level: study.level }}>
        <Section id="dossier-outcome" index="Outcome" labelledBy="dossier-outcome-heading">
          <DossierHeading id="dossier-outcome-heading" index="07 · Outcome">
            What changed after launch.
          </DossierHeading>
          <div className="grid gap-px border border-border bg-border sm:grid-cols-2">
            {(
              [
                ["Business", d.outcome?.business],
                ["Technical", d.outcome?.technical],
                ["Operational", d.outcome?.operational],
                ["User", d.outcome?.user],
              ] as const
            )
              .filter(([, v]) => v)
              .map(([k, v]) => (
                <Reveal key={k}>
                  <div className="h-full bg-background p-6 sm:p-8">
                    <h3 className="t-label text-muted">{k}</h3>
                    <p className="t-body mt-3">{v}</p>
                  </div>
                </Reveal>
              ))}
          </div>
        </Section>
      </TrackView>
      ) : null}

      {/* ── Verification (Part 11) ── */}
      {d.verificationLinks.length > 0 ? (
        <section aria-label="Verification" className="border-t border-border">
          <div className="shell py-10">
            <Reveal>
              <h2 className="t-h3 mb-5">Verified by</h2>
              <ul className="flex flex-wrap gap-3">
                {d.verificationLinks.map((l) => (
                  <li key={l.href}>
                    <a
                      href={l.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="t-sm inline-flex items-center gap-2 border border-border px-4 py-2 transition-colors hover:border-accent hover:text-accent-strong"
                    >
                      {l.label}
                      <span aria-hidden="true">↗</span>
                    </a>
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </section>
      ) : null}

      {isDemo ? (
        <section aria-label="Demo notice" className="border-t border-border bg-surface">
          <div className="shell py-6">
            <p className="t-label text-muted">
              Design concept - this dossier is a fictional exemplar showing the flagship format. Verified
              engagements replace it before production.
            </p>
          </div>
        </section>
      ) : null}
    </div>
  );
}
