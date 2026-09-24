import Image from "next/image";
import type { CaseDiscipline, CaseEntry } from "@/constants/case-studies";
import { CASE_PHOTO } from "@/constants/case-studies";

/**
 * Case-study specimen card. Photography is representative studio imagery
 * (duotone, inside the document's ink); the wireframe overlay marks each
 * card as a slot in preparation. Nothing is presented as a real client
 * until a verified case study is published.
 */

type Variant = CaseDiscipline["id"];

/* Hand-drawn wireframe art, one per discipline — hairline strokes with the
   square node accent, matching the homepage selected-work grammar. */
function CaseArt({ variant }: { variant: Variant }) {
  return (
    <svg
      viewBox="0 0 800 500"
      aria-hidden="true"
      className="absolute inset-0 h-full w-full text-white/25"
      preserveAspectRatio="xMidYMid slice"
    >
      <g fill="none" stroke="currentColor" strokeWidth="1.2" vectorEffect="non-scaling-stroke">
        <line x1="0" y1="250" x2="800" y2="250" opacity="0.35" strokeDasharray="2 8" />
        <line x1="400" y1="0" x2="400" y2="500" opacity="0.35" strokeDasharray="2 8" />

        {variant === "web" && (
          <>
            {/* browser frame with editorial layout blocks */}
            <rect x="70" y="66" width="660" height="368" />
            <line x1="70" y1="114" x2="730" y2="114" />
            <circle cx="94" cy="90" r="3.5" opacity="0.7" />
            <circle cx="110" cy="90" r="3.5" opacity="0.4" />
            <line x1="104" y1="146" x2="212" y2="146" strokeWidth="7" opacity="0.6" />
            <line x1="104" y1="172" x2="184" y2="172" opacity="0.35" />
            <rect x="104" y="200" width="280" height="120" opacity="0.45" />
            <rect x="404" y="146" width="292" height="174" opacity="0.3" />
            <line x1="104" y1="352" x2="380" y2="352" opacity="0.35" />
            <line x1="104" y1="374" x2="330" y2="374" opacity="0.35" />
            <rect x="404" y="344" width="118" height="32" />
            <rect x="536" y="344" width="118" height="32" opacity="0.4" />
          </>
        )}

        {variant === "mobile" && (
          <>
            {/* one large device with app grid, one companion */}
            <rect x="210" y="52" width="230" height="396" rx="16" />
            <line x1="210" y1="100" x2="440" y2="100" opacity="0.5" />
            <rect x="232" y="122" width="186" height="84" opacity="0.5" />
            {[0, 1, 2].map((r) =>
              [0, 1, 2].map((c) => (
                <rect
                  key={`${r}-${c}`}
                  x={232 + c * 64}
                  y={222 + r * 62}
                  width="48"
                  height="48"
                  opacity={0.45 - (r + c) * 0.06}
                />
              )),
            )}
            <line x1="292" y1="416" x2="358" y2="416" strokeWidth="4" opacity="0.55" />
            <rect x="500" y="120" width="160" height="276" rx="12" opacity="0.4" />
            <line x1="522" y1="152" x2="620" y2="152" opacity="0.4" />
            <line x1="522" y1="176" x2="600" y2="176" opacity="0.3" />
            <rect x="522" y="196" width="116" height="60" opacity="0.3" />
            <line x1="522" y1="284" x2="638" y2="284" opacity="0.3" />
            <line x1="522" y1="308" x2="606" y2="308" opacity="0.3" />
          </>
        )}

        {variant === "ai" && (
          <>
            {/* agent graph, central node, satellites, orthogonal links */}
            <rect x="356" y="206" width="88" height="88" strokeWidth="1.6" />
            <rect x="374" y="224" width="52" height="52" opacity="0.35" />
            <path d="M400 206V118M400 294v88M356 250h-98M444 250h98" opacity="0.6" />
            <rect x="368" y="76" width="64" height="42" opacity="0.55" />
            <rect x="368" y="382" width="64" height="42" opacity="0.55" />
            <rect x="176" y="229" width="64" height="42" opacity="0.55" />
            <rect x="560" y="229" width="64" height="42" opacity="0.55" />
            <path d="M258 190h96M446 190h96M258 310h96M446 310h96" opacity="0.28" strokeDasharray="3 6" />
            <rect x="258" y="169" width="50" height="34" opacity="0.35" />
            <rect x="492" y="169" width="50" height="34" opacity="0.35" />
            <rect x="258" y="297" width="50" height="34" opacity="0.35" />
            <rect x="492" y="297" width="50" height="34" opacity="0.35" />
          </>
        )}

        {variant === "software" && (
          <>
            {/* operations console, sidebar, panels, table rows */}
            <rect x="80" y="70" width="640" height="360" />
            <line x1="216" y1="70" x2="216" y2="430" />
            {[0, 1, 2, 3].map((i) => (
              <g key={i} opacity={0.42 - i * 0.06}>
                <rect x="100" y={104 + i * 40} width="18" height="18" />
                <line x1="128" y1={113 + i * 40} x2="190" y2={113 + i * 40} />
              </g>
            ))}
            <line x1="240" y1="108" x2="340" y2="108" strokeWidth="6" opacity="0.55" />
            <line x1="240" y1="132" x2="310" y2="132" opacity="0.3" />
            <rect x="240" y="156" width="220" height="96" opacity="0.4" />
            <rect x="484" y="156" width="212" height="96" opacity="0.28" />
            <line x1="252" y1="186" x2="330" y2="186" opacity="0.4" />
            <line x1="252" y1="212" x2="368" y2="212" opacity="0.3" />
            <line x1="496" y1="186" x2="580" y2="186" opacity="0.4" />
            <line x1="496" y1="212" x2="620" y2="212" opacity="0.3" />
            {[0, 1, 2, 3].map((i) => (
              <g key={i} opacity={0.4 - i * 0.05}>
                <line x1="240" y1={284 + i * 34} x2="696" y2={284 + i * 34} opacity="0.3" />
                <rect x="240" y={274 + i * 34} width="14" height="14" opacity="0.5" />
              </g>
            ))}
          </>
        )}

        {variant === "design" && (
          <>
            {/* type specimen + artboards + pen path */}
            <rect x="80" y="70" width="300" height="180" opacity="0.55" />
            <path
              d="M126 208 166 108 206 208M141 176h50"
              strokeWidth="2"
              opacity="0.7"
            />
            <line x1="238" y1="120" x2="356" y2="120" strokeWidth="5" opacity="0.5" />
            <line x1="238" y1="142" x2="330" y2="142" opacity="0.3" />
            <line x1="238" y1="162" x2="356" y2="162" opacity="0.3" />
            <rect x="80" y="274" width="300" height="156" opacity="0.3" />
            {[0, 1, 2].map((i) => (
              <rect key={i} x={104 + i * 88} y="298" width="64" height="80" opacity="0.35" />
            ))}
            <rect x="406" y="70" width="314" height="360" opacity="0.45" />
            <path d="M446 360c60-10 84-70 120-118s82-62 122-96" strokeWidth="1.6" opacity="0.7" />
            {[0, 1, 2, 3].map((i) => (
              <rect
                key={i}
                x={[446, 566, 688, 688][i] - 3.5}
                y={[360, 242, 146, 146][i] - 3.5}
                width="7"
                height="7"
                opacity="0.8"
              />
            ))}
            <line x1="446" y1="392" x2="688" y2="392" opacity="0.3" />
          </>
        )}

        {variant === "growth" && (
          <>
            {/* ascending series, axes, bars, trend with square markers */}
            <line x1="120" y1="90" x2="120" y2="404" opacity="0.5" />
            <line x1="120" y1="404" x2="700" y2="404" opacity="0.5" />
            {[168, 244, 320, 396].map((y) => (
              <line key={y} x1="132" y1={y} x2="688" y2={y} opacity="0.22" strokeDasharray="2 8" />
            ))}
            {[200, 300, 400, 500, 600].map((x, i) => (
              <rect key={x} x={x - 26} y={330 - i * 42} width="52" height={74 + i * 42} opacity={0.24 + i * 0.05} />
            ))}
            <polyline
              points="174,352 280,300 386,262 492,196 598,150 666,104"
              strokeWidth="2"
              opacity="0.85"
            />
            {[174, 280, 386, 492, 598, 666].map((x, i) => (
              <rect
                key={x}
                x={x - 3.5}
                y={[352, 300, 262, 196, 150, 104][i] - 3.5}
                width="7"
                height="7"
                opacity="0.9"
              />
            ))}
          </>
        )}
      </g>
      <rect x="740" y="44" width="16" height="16" className="fill-accent" />
    </svg>
  );
}

export function CaseStudyCard({
  entry,
  variant,
  aspect,
  sizes,
}: {
  entry: CaseEntry;
  variant: Variant;
  aspect: string;
  sizes: string;
}) {
  return (
    <article className="group relative border border-border bg-surface transition-colors duration-500 hover:border-foreground/30">
      <div className={`relative overflow-hidden ${aspect}`}>
        <Image
          src={CASE_PHOTO[variant]}
          alt={`Representative studio imagery: ${variant} case study in preparation`}
          fill
          sizes={sizes}
          className="duotone object-cover transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:scale-[1.02]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[rgb(16_19_25/0.38)] transition-colors duration-700 group-hover:bg-[rgb(16_19_25/0.22)]"
        />
        <CaseArt variant={variant} />
        <span className="t-label absolute left-4 top-4 border border-white/25 bg-[rgb(16_19_25/0.45)] px-2.5 py-1.5 text-white/85 backdrop-blur-[2px]">
          In preparation
        </span>
        <span className="t-label absolute bottom-4 right-4 tnum text-white/75">{entry.sector}</span>
      </div>
      <div className="flex flex-wrap items-start justify-between gap-4 border-t border-border p-6 sm:p-8">
        <div>
          <h3 className="t-h3">{entry.name}</h3>
          <p className="t-label mt-2.5 text-muted">
            {entry.sector} · {entry.services}
          </p>
          <p className="t-label mt-1.5 text-muted/80">{entry.stack}</p>
          <p className="t-caption mt-3 text-muted/80">{entry.outcome}</p>
        </div>
        <span
          aria-disabled="true"
          title="Case study in preparation"
          className="t-sm inline-flex items-center gap-2 font-semibold text-muted/60"
        >
          View Project
          <svg aria-hidden="true" viewBox="0 0 14 14" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M3 11 11 3M4.5 3H11v6.5" />
          </svg>
        </span>
      </div>
    </article>
  );
}
