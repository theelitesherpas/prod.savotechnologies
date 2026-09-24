import { Section } from "@/components/ui/section";
import { Reveal } from "@/components/ui/reveal";
import { WORK_PLACEHOLDERS } from "@/constants/content";
import { cn } from "@/lib/utils";

/**
 * Authored placeholder compositions — abstract product wireframes in the
 * document's own drawing language. Replaced by real case-study imagery
 * once verified SAVO projects are supplied.
 */
function WorkArt({ variant }: { variant: "a" | "b" | "c" }) {
  return (
    <svg
      viewBox="0 0 800 500"
      aria-hidden="true"
      className="h-full w-full"
      preserveAspectRatio="xMidYMid slice"
    >
      <g fill="none" stroke="currentColor" strokeWidth="1.2" vectorEffect="non-scaling-stroke">
        {/* Registration grid */}
        <line x1="0" y1="250" x2="800" y2="250" opacity="0.25" strokeDasharray="2 8" />
        <line x1="400" y1="0" x2="400" y2="500" opacity="0.25" strokeDasharray="2 8" />

        {variant === "a" && (
          <>
            {/* Window frame */}
            <rect x="80" y="70" width="640" height="360" />
            <line x1="80" y1="118" x2="720" y2="118" />
            <circle cx="104" cy="94" r="3.5" opacity="0.7" />
            <circle cx="120" cy="94" r="3.5" opacity="0.4" />
            <circle cx="136" cy="94" r="3.5" opacity="0.25" />
            {/* Left column nav lines */}
            <line x1="112" y1="160" x2="240" y2="160" strokeWidth="6" opacity="0.55" />
            <line x1="112" y1="190" x2="220" y2="190" opacity="0.35" />
            <line x1="112" y1="212" x2="232" y2="212" opacity="0.35" />
            <line x1="112" y1="234" x2="204" y2="234" opacity="0.35" />
            <rect x="112" y="330" width="120" height="32" opacity="0.5" />
            {/* Hero block */}
            <line x1="300" y1="160" x2="560" y2="160" strokeWidth="10" opacity="0.8" />
            <line x1="300" y1="192" x2="520" y2="192" strokeWidth="6" opacity="0.45" />
            <line x1="300" y1="214" x2="480" y2="214" opacity="0.35" />
            <rect x="300" y="252" width="104" height="30" />
            <rect x="418" y="252" width="104" height="30" opacity="0.4" />
            {/* Right data column */}
            <line x1="620" y1="160" x2="692" y2="160" opacity="0.5" />
            <line x1="620" y1="184" x2="676" y2="184" opacity="0.35" />
            <line x1="620" y1="208" x2="688" y2="208" opacity="0.35" />
            <rect x="600" y="252" width="100" height="110" opacity="0.45" />
            <line x1="600" y1="292" x2="700" y2="292" opacity="0.5" />
          </>
        )}

        {variant === "b" && (
          <>
            {/* Two device frames */}
            <rect x="150" y="60" width="190" height="380" rx="14" />
            <rect x="460" y="60" width="190" height="380" rx="14" />
            <line x1="150" y1="108" x2="340" y2="108" opacity="0.5" />
            <line x1="460" y1="108" x2="650" y2="108" opacity="0.5" />
            <line x1="214" y1="84" x2="276" y2="84" opacity="0.4" />
            <line x1="524" y1="84" x2="586" y2="84" opacity="0.4" />
            {/* Phone 1 content */}
            <rect x="172" y="132" width="146" height="88" opacity="0.5" />
            <line x1="172" y1="248" x2="300" y2="248" strokeWidth="6" opacity="0.5" />
            <line x1="172" y1="272" x2="276" y2="272" opacity="0.3" />
            <line x1="172" y1="292" x2="288" y2="292" opacity="0.3" />
            <rect x="172" y="320" width="64" height="26" />
            <rect x="254" y="320" width="64" height="26" opacity="0.4" />
            <line x1="196" y1="392" x2="294" y2="392" opacity="0.4" />
            {/* Phone 2 content — list */}
            {[0, 1, 2, 3].map((i) => (
              <g key={i} opacity={0.42 - i * 0.07}>
                <rect x="482" y={132 + i * 62} width="34" height="34" />
                <line x1="530" y1={144 + i * 62} x2="618" y2={144 + i * 62} />
                <line x1="530" y1={162 + i * 62} x2="590" y2={162 + i * 62} />
              </g>
            ))}
          </>
        )}

        {variant === "c" && (
          <>
            {/* Modular system */}
            <rect x="80" y="70" width="300" height="180" opacity="0.6" />
            <rect x="80" y="274" width="300" height="156" opacity="0.35" />
            <rect x="406" y="70" width="314" height="360" opacity="0.5" />
            <line x1="106" y1="104" x2="260" y2="104" strokeWidth="7" opacity="0.6" />
            <line x1="106" y1="130" x2="228" y2="130" opacity="0.35" />
            <rect x="106" y="158" width="248" height="64" opacity="0.4" />
            <line x1="106" y1="308" x2="270" y2="308" strokeWidth="7" opacity="0.5" />
            <line x1="106" y1="334" x2="240" y2="334" opacity="0.3" />
            <line x1="106" y1="358" x2="254" y2="358" opacity="0.3" />
            {/* Chart polyline */}
            <polyline
              points="432,392 488,340 544,362 600,286 656,308 694,236"
              strokeWidth="2"
              opacity="0.8"
            />
            <line x1="432" y1="410" x2="694" y2="410" opacity="0.3" />
            {[432, 488, 544, 600, 656, 694].map((x, i) => (
              <rect key={x} x={x - 3} y={[392, 340, 362, 286, 308, 236][i] - 3} width="6" height="6" />
            ))}
          </>
        )}
      </g>
      {/* Accent mark — the system's signature */}
      <rect x="740" y="44" width="16" height="16" className="fill-accent" />
    </svg>
  );
}

export function SelectedWork() {
  const [featured, ...rest] = WORK_PLACEHOLDERS;

  return (
    <Section id="work" index="06 — Selected Work" labelledBy="work-heading">
      <div className="mb-14 grid gap-8 sm:mb-16 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <Reveal>
            <h2 id="work-heading" className="t-dl">
              Selected work.
            </h2>
          </Reveal>
        </div>
        <div className="lg:col-span-5 lg:pt-4">
          <Reveal delay={120}>
            <p className="t-body-lg max-w-md text-muted">
              Digital products designed around real business objectives.
              Case studies are being prepared — nothing is published here
              until its results can be verified.
            </p>
          </Reveal>
        </div>
      </div>

      <div className="space-y-8">
        {/* Featured */}
        <Reveal>
          <article className="group relative border border-border bg-surface transition-colors duration-500 hover:border-foreground/30">
            <div className="overflow-hidden">
              <div className="aspect-[16/9] text-foreground/[0.28] transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:scale-[1.015] sm:aspect-[16/7]">
                <WorkArt variant={featured.variant} />
              </div>
            </div>
            <WorkMeta item={featured} />
          </article>
        </Reveal>

        <div className="grid gap-8 md:grid-cols-2">
          {rest.map((item, i) => (
            <Reveal key={item.variant} delay={i * 120}>
              <article className="group relative border border-border bg-surface transition-colors duration-500 hover:border-foreground/30">
                <div className="overflow-hidden">
                  <div className="aspect-[16/10] text-foreground/[0.28] transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:scale-[1.015]">
                    <WorkArt variant={item.variant} />
                  </div>
                </div>
                <WorkMeta item={item} />
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </Section>
  );
}

function WorkMeta({
  item,
}: {
  item: (typeof WORK_PLACEHOLDERS)[number];
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 border-t border-border p-6 sm:p-8">
      <div>
        <h3 className="t-h3">{item.name}</h3>
        <p className="t-label mt-2.5 text-muted">
          {item.industry} · {item.services} · {item.stack}
        </p>
        <p className="t-caption mt-3 text-muted/80">{item.outcome}</p>
      </div>
      <span
        aria-disabled="true"
        title="Case study in preparation"
        className={cn(
          "t-sm inline-flex items-center gap-2 font-semibold text-muted/60",
        )}
      >
        View Project
        <svg aria-hidden="true" viewBox="0 0 14 14" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M3 11 11 3M4.5 3H11v6.5" />
        </svg>
      </span>
    </div>
  );
}
