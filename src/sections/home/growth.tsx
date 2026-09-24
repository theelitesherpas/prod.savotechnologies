import { Section } from "@/components/ui/section";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeader } from "@/components/ui/section-header";
import { GROWTH_CAPABILITIES, GROWTH_CHANNELS } from "@/constants/content";

/**
 * Convergence infographic — how discovery channels meet the product.
 * Lines draw themselves on scroll (pathLength trick + .reveal trigger).
 */
function ConvergenceDiagram() {
  return (
    <svg
      viewBox="0 0 1160 280"
      role="img"
      aria-label="Search engines, answer engines and generative engines all converge on your product."
      className="w-full text-foreground/50"
    >
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      >
        <g data-draw>
          <path pathLength={1} d="M250 62 C 480 62, 640 140, 872 140" />
          <path pathLength={1} d="M262 140 H 872" style={{ ["--draw-delay" as string]: "0.45s" }} />
          <path pathLength={1} d="M250 218 C 480 218, 640 140, 872 140" style={{ ["--draw-delay" as string]: "0.9s" }} />
        </g>
        <path pathLength={1} data-draw d="M872 140 h56" style={{ ["--draw-delay" as string]: "1.3s" }} />
      </g>

      {/* Source nodes */}
      {[
        { y: 62, label: "Search Engines", sub: "SEO" },
        { y: 140, label: "Answer Engines", sub: "AEO" },
        { y: 218, label: "Generative Engines", sub: "GEO" },
      ].map((n) => (
        <g key={n.label}>
          <rect x="150" y={n.y - 7} width="14" height="14" className="fill-foreground/60" />
          <text
            x="128"
            y={n.y - 14}
            textAnchor="end"
            className="fill-muted"
            style={{ font: "600 13px var(--font-fragment)", letterSpacing: "0.14em" }}
          >
            {n.sub}
          </text>
          <text
            x="128"
            y={n.y + 4}
            textAnchor="end"
            className="fill-foreground"
            style={{ font: "600 15px var(--font-manrope)" }}
          >
            {n.label}
          </text>
        </g>
      ))}

      {/* Product node */}
      <g>
        <rect x="928" y="118" width="44" height="44" className="fill-accent" />
        <text
          x="1000"
          y="134"
          className="fill-foreground"
          style={{ font: "700 16px var(--font-manrope)" }}
        >
          Your product
        </text>
        <text
          x="1000"
          y="154"
          className="fill-muted"
          style={{ font: "600 12px var(--font-fragment)", letterSpacing: "0.12em" }}
        >
          FOUND · UNDERSTOOD · CHOSEN
        </text>
      </g>
    </svg>
  );
}

export function Growth() {
  return (
    <Section id="growth" index="13 — Discoverability" labelledBy="growth-heading" className="bg-surface-2/70">
      <SectionHeader
        id="growth-heading"
        heading="Built to perform. Built to be found."
        lead={
          <>
            A great product still needs to be discovered. SAVO combines
            engineering with modern digital discoverability — because search
            engines still matter, and AI-powered discovery increasingly decides
            who gets found.
          </>
        }
      />

      <Reveal>
        <div className="mb-14 border-y border-border py-8 sm:py-10">
          <ConvergenceDiagram />
        </div>
      </Reveal>

      <div className="grid gap-px border border-border bg-border md:grid-cols-3">
        {GROWTH_CHANNELS.map((channel, i) => (
          <Reveal key={channel.abbr} delay={i * 110} className="bg-background">
            <div className="flex h-full flex-col p-7 sm:p-9">
              <div className="flex items-baseline justify-between">
                <span className="t-h1 text-accent">{channel.abbr}</span>
                <span aria-hidden="true" className="h-2 w-2 bg-border" />
              </div>
              <h3 className="t-h4 mt-6 text-foreground/90">{channel.name}</h3>
              <p className="t-sm mt-4 text-muted">{channel.text}</p>
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal delay={200}>
        <ul className="mt-8 flex flex-wrap gap-2" aria-label="Additional growth capabilities">
          {GROWTH_CAPABILITIES.map((cap) => (
            <li key={cap} className="t-caption rounded-[2px] border border-border px-3 py-1.5 text-muted">
              {cap}
            </li>
          ))}
        </ul>
      </Reveal>
    </Section>
  );
}
