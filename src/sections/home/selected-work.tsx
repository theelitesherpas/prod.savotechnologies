import Image from "next/image";
import Link from "next/link";
import { Section } from "@/components/ui/section";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeader } from "@/components/ui/section-header";
import { WORK_PLACEHOLDERS } from "@/constants/content";

/**
 * Placeholder case-study cards. Photography is representative studio imagery
 * (duotone, inside the document's ink); wireframes mark each card as
 * in-development. Nothing is presented as a real client until verified
 * case studies arrive.
 */
const PHOTO_BY_VARIANT = {
  a: "/images/meeting.webp",
  b: "/images/code.webp",
  c: "/images/mobile.webp",
} as const;

function WorkArt({ variant }: { variant: "a" | "b" | "c" }) {
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

        {variant === "a" && (
          <>
            <rect x="80" y="70" width="640" height="360" />
            <line x1="80" y1="118" x2="720" y2="118" />
            <circle cx="104" cy="94" r="3.5" opacity="0.7" />
            <circle cx="120" cy="94" r="3.5" opacity="0.4" />
            <line x1="112" y1="160" x2="240" y2="160" strokeWidth="6" opacity="0.55" />
            <line x1="112" y1="190" x2="220" y2="190" opacity="0.35" />
            <line x1="112" y1="212" x2="232" y2="212" opacity="0.35" />
            <line x1="300" y1="160" x2="560" y2="160" strokeWidth="10" opacity="0.8" />
            <line x1="300" y1="192" x2="520" y2="192" strokeWidth="6" opacity="0.45" />
            <rect x="300" y="252" width="104" height="30" />
            <rect x="418" y="252" width="104" height="30" opacity="0.4" />
          </>
        )}

        {variant === "b" && (
          <>
            <rect x="150" y="60" width="190" height="380" rx="14" />
            <rect x="460" y="60" width="190" height="380" rx="14" />
            <line x1="150" y1="108" x2="340" y2="108" opacity="0.5" />
            <rect x="172" y="132" width="146" height="88" opacity="0.5" />
            <line x1="172" y1="248" x2="300" y2="248" strokeWidth="6" opacity="0.5" />
            <rect x="172" y="320" width="64" height="26" />
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
            <rect x="80" y="70" width="300" height="180" opacity="0.6" />
            <rect x="80" y="274" width="300" height="156" opacity="0.35" />
            <rect x="406" y="70" width="314" height="360" opacity="0.5" />
            <line x1="106" y1="104" x2="260" y2="104" strokeWidth="7" opacity="0.6" />
            <rect x="106" y="158" width="248" height="64" opacity="0.4" />
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
      <rect x="740" y="44" width="16" height="16" className="fill-accent" />
    </svg>
  );
}

function WorkCard({
  item,
  aspect,
  sizes,
}: {
  item: (typeof WORK_PLACEHOLDERS)[number];
  aspect: string;
  sizes: string;
}) {
  return (
    <article className="group relative border border-border bg-surface transition-colors duration-500 hover:border-foreground/30">
      <div className={`relative overflow-hidden ${aspect}`}>
        <Image
          src={PHOTO_BY_VARIANT[item.variant]}
          alt="Representative studio imagery, case study in preparation"
          fill
          sizes={sizes}
          className="duotone object-cover transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:scale-[1.02]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[rgb(16_19_25/0.38)] transition-colors duration-700 group-hover:bg-[rgb(16_19_25/0.22)]"
        />
        <WorkArt variant={item.variant} />
        <span className="t-label absolute left-4 top-4 border border-white/25 bg-[rgb(16_19_25/0.45)] px-2.5 py-1.5 text-white/85 backdrop-blur-[2px]">
          In preparation
        </span>
      </div>
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

export function SelectedWork() {
  const [featured, ...rest] = WORK_PLACEHOLDERS;

  return (
    <Section id="work" index="Selected Work" labelledBy="work-heading">
      <SectionHeader
        id="work-heading"
        heading="Selected work."
        lead={
          <>
            Digital products designed around real business objectives. Case
            studies are being prepared, nothing is published here until its
            results can be verified.
          </>
        }
      />

      <div className="space-y-8">
        <Reveal>
          <WorkCard
            item={featured}
            aspect="aspect-[16/9] sm:aspect-[16/7]"
            sizes="(max-width: 1536px) 100vw, 1440px"
          />
        </Reveal>
        <div className="grid gap-8 md:grid-cols-2">
          {rest.map((item, i) => (
            <Reveal key={item.variant} delay={i * 120}>
              <WorkCard item={item} aspect="aspect-[16/10]" sizes="(max-width: 768px) 100vw, 640px" />
            </Reveal>
          ))}
        </div>
      </div>

      <Reveal className="mt-12">
        <Link
          href="/case-studies"
          className="group/link t-sm -ml-1 inline-flex items-center gap-2 py-3 font-semibold text-foreground transition-colors hover:text-accent"
        >
          Browse the full dossier, all disciplines
          <svg
            aria-hidden="true"
            viewBox="0 0 14 14"
            className="h-3 w-3 transition-transform duration-300 group-hover/link:translate-x-[3px]"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          >
            <path d="M1 7h11M7.5 2.5 12 7l-4.5 4.5" />
          </svg>
        </Link>
      </Reveal>
    </Section>
  );
}
