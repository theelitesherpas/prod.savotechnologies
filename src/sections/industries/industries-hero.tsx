import Link from "next/link";
import { Reveal } from "@/components/ui/reveal";
import { IndustryIcon } from "@/components/shared/industry-icon";
import { INDUSTRIES_ATLAS } from "@/constants/industries";

/**
 * Industries hero - paper chapter. Statement opening, the coverage card
 * (honest counts only - no invented figures), and the sector contents
 * board: a hairline cabinet of anchor cells that invert to ink on hover,
 * matching the case-studies index board grammar.
 */

const COVERAGE_ROWS = [
  { label: "Sectors", note: "healthcare to energy" },
  { label: "Service groups", note: "one connected team" },
  { label: "Sector chapters", note: "one dossier each" },
];

export function IndustriesHero() {
  return (
    <section aria-labelledby="industries-heading" className="relative overflow-hidden">
      <div className="shell pb-20 pt-[calc(var(--nav-h)+4.5rem)] sm:pb-24">
        {/* Index rail */}
        <div aria-hidden="true" className="mb-12 flex items-center gap-4 sm:mb-16">
          <span aria-hidden="true" className="h-2 w-2 shrink-0 bg-accent" />
          <span className="t-label text-muted">Industries</span>
          <span className="h-px flex-1 bg-border" />
        </div>

        <div className="grid items-end gap-12 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-7">
            <Reveal>
              <h1 id="industries-heading" className="t-statement max-w-[15ch]">
                Ten sectors. One playbook
                <span aria-hidden="true" className="text-accent">.</span>
              </h1>
            </Reveal>
            <Reveal delay={120}>
              <p className="t-body-lg mt-8 max-w-xl text-muted">
                We learn the rules of your industry before we write a line of
                code, the regulations, the systems of record, the way your
                customers actually decide. What never changes is the
                engineering standard underneath.
              </p>
            </Reveal>
          </div>

          {/* The coverage card, counts the site itself can verify */}
          <div className="lg:col-span-5">
            <Reveal delay={200}>
              <div className="border border-border bg-surface p-7 sm:p-8">
                <p className="t-label text-muted">The coverage</p>
                <ul className="mt-5 border-t border-border">
                  {COVERAGE_ROWS.map((row) => (
                    <li
                      key={row.label}
                      className="flex items-center justify-between gap-4 border-b border-border py-3.5"
                    >
                      <span className="flex items-center gap-3.5">
                        <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 bg-accent" />
                        <span className="t-sm font-medium text-foreground/85">{row.label}</span>
                      </span>
                      <span className="t-label text-muted">{row.note}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-5 flex items-center gap-3">
                  <span aria-hidden="true" className="h-2 w-2 shrink-0 bg-accent" />
                  <p className="t-caption text-muted">Sector-fluent, team-fixed.</p>
                </div>
              </div>
            </Reveal>
          </div>
        </div>

        {/* Sector contents board, the cabinet of anchor cells */}
        <Reveal delay={140}>
          <nav aria-label="Industries contents" className="mt-16 sm:mt-20">
            <p className="t-label mb-5 text-muted">Contents, by sector</p>
            <ul className="grid grid-cols-2 gap-px border border-border bg-border sm:grid-cols-3 lg:grid-cols-5">
              {INDUSTRIES_ATLAS.map((industry) => (
                <li key={industry.id}>
                  <Link
                    href={`#${industry.id}`}
                    aria-label={`Jump to ${industry.title}`}
                    className="group flex h-full min-h-[8.5rem] flex-col justify-between gap-8 bg-background p-5 text-foreground transition-colors duration-300 ease-[var(--ease-out-expo)] hover:bg-foreground hover:text-background sm:p-6"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <IndustryIcon
                        id={industry.id}
                        className="[&_svg]:h-5 [&_svg]:w-5 text-muted transition-colors duration-300 group-hover:text-background"
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
                      <p className="t-h4">{industry.boardLabel}</p>
                      <p className="t-caption mt-2 text-muted transition-colors duration-300 group-hover:text-background/70">
                        {industry.hint}
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
