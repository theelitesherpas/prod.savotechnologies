import Image from "next/image";
import Link from "next/link";
import { Section } from "@/components/ui/section";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeader } from "@/components/ui/section-header";
import { WORK_PLACEHOLDERS } from "@/constants/content";
import { DEMO_TESTIMONIAL } from "@/content/demo";
import { getCaseStudies } from "@/lib/case-studies";
import { resolveCaseImages, type CaseStudy } from "@/lib/case-study-schema";
import { IS_DEMO } from "@/lib/content-mode";

/**
 * Selected work - CONTENT_MODE gated. Demo mode renders the dossier
 * records (admin DB rows first, coded fictional projects as fallback) so
 * the cards, typography and responsive grid stay complete for review and
 * stay in sync with the admin editor; production renders the honest
 * in-preparation placeholders until verified case studies arrive.
 */

type WorkItem = {
  name: string;
  industry: string;
  services: string;
  stack: string;
  outcome: string;
  variant: "a" | "b" | "c";
  /** Detail-page link when the item has one (demo/verified). */
  slug?: string;
  /** Attached visual slot-matched to this card (featured vs standard). */
  image?: { dataUrl: string; alt?: string } | null;
  /** Corner badge - "Design concept" (demo), none (published), "In preparation" (pending). */
  badge?: string | null;
};

/** Variant rotates across the three wireframe art sets. */
const VARIANT_BY_INDEX = ["a", "b", "c"] as const;

/** Results that may render on a card surface - unverified figures are
 *  production-suppressed exactly like the detail page (policy §27). */
const cardResults = (study: CaseStudy) =>
  study.status === "demo" ? (study.results ?? []) : (study.results ?? []).filter((r) => r.verified);

async function workItems(): Promise<{ items: WorkItem[]; live: boolean; anyDemo: boolean }> {
  const studies = await getCaseStudies();
  if (studies.length > 0) {
    // Featured records lead (stable - the (order, updatedAt) ranking from
    // getCaseStudies is preserved inside each group), then take the first
    // three: the big banner plus the two half cards.
    const ranked = [...studies].sort(
      (a, b) => Number(b.featured ?? false) - Number(a.featured ?? false),
    );
    const top = ranked.slice(0, 3);
    return {
      live: true,
      anyDemo: top.some((c) => c.status === "demo"),
      items: top.map((c, i) => {
        const resolved = resolveCaseImages(c);
        const slot = resolved.cardWide;
        const shown = cardResults(c);
        return {
          name: c.displayClientName || c.title,
          industry: c.industry ?? "",
          services: (c.services ?? []).slice(0, 2).join(" · ") || (c.industry ?? ""),
          stack: (c.technologies ?? []).join(" · "),
          outcome:
            shown.map((r) => `${r.value} ${r.label}`).join(" · ") +
            (c.status === "demo" && shown.length > 0 ? " - demo figures" : ""),
          variant: VARIANT_BY_INDEX[i % 3],
          slug: c.slug,
          image: slot ? { dataUrl: slot.dataUrl, alt: slot.alt } : null,
          badge: c.status === "demo" ? "Design concept" : null,
        };
      }),
    };
  }
  // Zero records in the current mode - the honest in-preparation slots.
  return {
    live: false,
    anyDemo: IS_DEMO,
    items: WORK_PLACEHOLDERS.map((w) => ({ ...w, badge: "In preparation" })),
  };
}

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
  item: WorkItem;
  aspect: string;
  sizes: string;
}) {
  const card = (
    <>
      <div className={`relative overflow-hidden ${aspect}`}>
        {item.image?.dataUrl ? (
          // Attached visual - slot-matched to this card class (featured vs
          // standard), cropped to its exact aspect in the admin studio.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.image.dataUrl}
            alt={item.image.alt || `${item.name} - project visual`}
            className="h-full w-full object-cover transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:scale-[1.02]"
          />
        ) : (
          <>
            <Image
              src={PHOTO_BY_VARIANT[item.variant]}
              alt={
                IS_DEMO && item.slug
                  ? `Design concept: ${item.name} - fictional demo project`
                  : item.slug
                    ? `Representative studio imagery for ${item.name}`
                    : "Representative studio imagery, case study in preparation"
              }
              fill
              sizes={sizes}
              className="photo object-cover transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:scale-[1.02]"
            />
            <WorkArt variant={item.variant} />
          </>
        )}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[rgb(16_19_25/0.28)] transition-colors duration-700 group-hover:bg-[rgb(16_19_25/0.14)]"
        />
        {item.badge ? (
          <span className="t-label absolute left-4 top-4 border border-white/25 bg-[rgb(16_19_25/0.45)] px-2.5 py-1.5 text-white/85 backdrop-blur-[2px]">
            {item.badge}
          </span>
        ) : null}
      </div>
      <div className="flex flex-wrap items-start justify-between gap-4 border-t border-border p-6 sm:p-8">
        <div>
          <h3 className="t-h3">{item.name}</h3>
          <p className="t-label mt-2.5 text-muted">
            {item.industry} · {item.services} · {item.stack}
          </p>
          <p className="t-caption mt-3 text-muted">{item.outcome}</p>
        </div>
        {item.slug ? (
          <span
            aria-hidden="true"
            className="t-sm inline-flex items-center gap-2 font-semibold text-foreground transition-colors group-hover:text-accent"
          >
            View Project
            <svg aria-hidden="true" viewBox="0 0 14 14" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M3 11 11 3M4.5 3H11v6.5" />
            </svg>
          </span>
        ) : (
        <span
          aria-disabled="true"
          title="Case study in preparation"
          className="t-sm inline-flex items-center gap-2 font-semibold text-muted"
        >
          View Project
          <svg aria-hidden="true" viewBox="0 0 14 14" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M3 11 11 3M4.5 3H11v6.5" />
          </svg>
        </span>
        )}
      </div>
    </>
  );

  // Whole card is the link - thumbnail included. Pending slots stay an
  // honest non-interactive article.
  if (item.slug) {
    return (
      <Link
        href={`/case-studies/${item.slug}`}
        className="group relative block border border-border bg-surface transition-colors duration-500 hover:border-foreground/30"
        aria-label={`${item.name} - open case study`}
      >
        {card}
      </Link>
    );
  }
  return (
    <article className="group relative border border-border bg-surface transition-colors duration-500 hover:border-foreground/30">
      {card}
    </article>
  );
}

export async function SelectedWork() {
  const { items, live, anyDemo } = await workItems();
  const [featured, ...rest] = items;

  return (
    <Section id="work" index="Selected Work" labelledBy="work-heading">
      <SectionHeader
        id="work-heading"
        heading="Selected work."
        lead={
          live && !anyDemo ? (
            <>
              Digital products designed around real business objectives. Each
              engagement below is published with client-verified outcomes. The
              full dossier, from challenge and build to numbers, lives in the
              case-study index.
            </>
          ) : live && anyDemo ? (
            <>
              Digital products designed around real business objectives. The
              engagements below are polished design concepts - fictional
              projects shown so the case-study format can be evaluated before
              verified work is published.
            </>
          ) : (
            <>
              Digital products designed around real business objectives. Case
              studies are being prepared, nothing is published here until its
              results can be verified.
            </>
          )
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
            <Reveal key={item.slug ?? item.name} delay={i * 120}>
              <WorkCard item={item} aspect="aspect-[16/10]" sizes="(max-width: 768px) 100vw, 640px" />
            </Reveal>
          ))}
        </div>
      </div>

      {/* DEMO TESTIMONIAL - layout preview only, never a fabricated endorsement.
          Suppressed entirely in production until an approved quote exists. */}
      {IS_DEMO ? (
        <Reveal className="mt-16">
          <figure className="border border-border bg-surface p-8 sm:p-12" aria-label="Client testimonial preview">
            <p className="t-label text-accent-strong">{DEMO_TESTIMONIAL.kicker}</p>
            <blockquote className="t-serif-italic mt-6 max-w-3xl text-2xl leading-snug text-foreground/90 sm:text-3xl">
              &ldquo;{DEMO_TESTIMONIAL.quote}&rdquo;
            </blockquote>
            <figcaption className="mt-8 flex items-center gap-4 border-t border-border pt-6">
              <span aria-hidden="true" className="h-2 w-2 shrink-0 bg-accent" />
              <div>
                <p className="t-sm font-semibold">{DEMO_TESTIMONIAL.name}</p>
                <p className="t-caption mt-0.5 text-muted">{DEMO_TESTIMONIAL.role}</p>
              </div>
            </figcaption>
          </figure>
        </Reveal>
      ) : null}

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
