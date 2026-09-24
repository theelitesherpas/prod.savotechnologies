import Link from "next/link";
import { Reveal } from "@/components/ui/reveal";
import { CASE_DISCIPLINES, type CaseDiscipline } from "@/constants/case-studies";

/**
 * Case studies hero — paper chapter. Statement opening, the editorial
 * standard card, and the discipline index board: a hairline cabinet of
 * anchor cells that invert to ink on hover. No code specimen here — that
 * voice belongs to the developers' chapter on careers.
 */

const BOARD_LABEL: Record<CaseDiscipline["id"], string> = {
  web: "Web",
  mobile: "Mobile",
  ai: "AI & Agents",
  software: "Software & SaaS",
  design: "Design",
  growth: "Growth",
};

const STANDARD_ROWS = [
  "Client named on publication",
  "Outcomes verified before release",
  "Approach and stack in full",
];

export function CaseStudiesHero() {
  return (
    <section aria-labelledby="case-studies-heading" className="relative overflow-hidden">
      <div className="shell pb-20 pt-[calc(var(--nav-h)+4.5rem)] sm:pb-24">
        {/* Rail */}
        <div aria-hidden="true" className="mb-12 flex items-center gap-4 sm:mb-16">
          <span aria-hidden="true" className="h-2 w-2 shrink-0 bg-accent" />
          <span className="t-label text-muted">Case Studies</span>
          <span className="h-px flex-1 bg-border" />
        </div>

        <div className="grid items-end gap-12 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-7">
            <Reveal>
              <h1 id="case-studies-heading" className="t-statement max-w-[15ch]">
                Proof, filed by discipline
                <span aria-hidden="true" className="text-accent">.</span>
              </h1>
            </Reveal>
            <Reveal delay={120}>
              <p className="t-body-lg mt-8 max-w-xl text-muted">
                Every engagement we ship earns a dossier here, the challenge,
                the build, the verified numbers. Until a result can be
                verified it stays in preparation; what you can read today is
                where each entry will land.
              </p>
            </Reveal>
          </div>

          {/* The editorial standard */}
          <div className="lg:col-span-5">
            <Reveal delay={200}>
              <div className="border border-border bg-surface p-7 sm:p-8">
                <p className="t-label text-muted">The standard</p>
                <ul className="mt-5 border-t border-border">
                  {STANDARD_ROWS.map((row) => (
                    <li
                      key={row}
                      className="flex items-center gap-3.5 border-b border-border py-3.5"
                    >
                      <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 bg-accent" />
                      <span className="t-sm font-medium text-foreground/85">{row}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-5 flex items-center gap-3">
                  <span aria-hidden="true" className="h-2 w-2 shrink-0 bg-accent" />
                  <p className="t-caption text-muted">Evidence, not marketing copy.</p>
                </div>
              </div>
            </Reveal>
          </div>
        </div>

        {/* Discipline index board, the cabinet of anchor cells */}
        <Reveal delay={140}>
          <nav aria-label="Case studies contents" className="mt-16 sm:mt-20">
            <p className="t-label mb-5 text-muted">Contents, by discipline</p>
            <ul className="grid grid-cols-2 gap-px border border-border bg-border sm:grid-cols-3 lg:grid-cols-6">
              {CASE_DISCIPLINES.map((d) => (
                <li key={d.id}>
                  <Link
                    href={`#${d.id}`}
                    aria-label={`Jump to ${d.title} case studies`}
                    className="group flex h-full min-h-[8.5rem] flex-col justify-between gap-8 bg-background p-5 text-foreground transition-colors duration-300 ease-[var(--ease-out-expo)] hover:bg-foreground hover:text-background sm:p-6 lg:min-h-[10.5rem]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span
                        aria-hidden="true"
                        className="mt-1 h-2 w-2 shrink-0 bg-accent transition-colors duration-300 group-hover:bg-background/70"
                      />
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 14 14"
                        className="mt-0.5 h-3 w-3 shrink-0 text-muted transition-all duration-300 ease-[var(--ease-out-expo)] group-hover:translate-x-[3px] group-hover:text-background"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.6"
                      >
                        <path d="M1 7h11M7.5 2.5 12 7l-4.5 4.5" />
                      </svg>
                    </div>
                    <div>
                      <p className="t-h4">{BOARD_LABEL[d.id]}</p>
                      <p className="t-caption mt-2 text-muted transition-colors duration-300 group-hover:text-background/70">
                        {d.hint}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </Reveal>
      </div>
    </section>
  );
}
