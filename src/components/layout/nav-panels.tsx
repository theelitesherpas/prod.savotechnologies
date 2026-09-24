"use client";

import Link from "next/link";
import type { NavFeature, NavLink } from "@/constants/navigation";
import { cn } from "@/lib/utils";

/**
 * v6 mega-panel pieces, rendered inside the ink panel bar under the header.
 */

export function PanelLink({ link }: { link: NavLink }) {
  return (
    <Link
      href={link.href}
      className="group/panel-link flex items-center gap-3 py-2.5 text-[0.9375rem] font-medium text-foreground/75 transition-colors hover:text-foreground"
    >
      <span
        aria-hidden="true"
        className="h-1.5 w-1.5 shrink-0 scale-0 bg-accent transition-transform duration-300 ease-[var(--ease-out-expo)] group-hover/panel-link:scale-100"
      />
      <span className="transition-transform duration-300 ease-[var(--ease-out-expo)] group-hover/panel-link:translate-x-1">
        {link.label}
      </span>
      {link.pro ? (
        <span className="t-label rounded-[2px] border border-accent/40 px-1.5 py-0.5 text-accent">
          PRO
        </span>
      ) : null}
      <svg
        aria-hidden="true"
        viewBox="0 0 14 14"
        className="ml-auto h-3 w-3 shrink-0 -translate-x-1 text-accent opacity-0 transition-all duration-300 group-hover/panel-link:translate-x-0 group-hover/panel-link:opacity-100"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      >
        <path d="M1 7h11M7.5 2.5 12 7l-4.5 4.5" />
      </svg>
    </Link>
  );
}

/** Square-node mini diagram — the motif, small, one per feature card. */
function FeatureArt({ variant }: { variant: number }) {
  const art = [
    // agent: core + satellites
    <g key="a" fill="none" stroke="currentColor" strokeWidth="1.4">
      <rect x="26" y="26" width="8" height="8" className="fill-accent" stroke="none" />
      <path d="M30 12v10M30 38v10M12 30h10M38 30h10" />
      <rect x="26" y="9" width="8" height="8" />
      <rect x="26" y="43" width="8" height="8" />
      <rect x="9" y="26" width="8" height="8" />
      <rect x="43" y="26" width="8" height="8" />
    </g>,
    // estimator: sliders
    <g key="b" fill="none" stroke="currentColor" strokeWidth="1.4">
      <path d="M14 18h32M14 30h32M14 42h32" />
      <rect x="24" y="13" width="8" height="8" className="fill-accent" stroke="none" />
      <rect x="14" y="26" width="8" height="8" />
      <rect x="34" y="38" width="8" height="8" />
    </g>,
    // team: two nodes linked
    <g key="c" fill="none" stroke="currentColor" strokeWidth="1.4">
      <rect x="10" y="22" width="12" height="12" />
      <rect x="38" y="22" width="12" height="12" className="fill-accent" stroke="none" />
      <path d="M22 28h16" />
      <path d="M16 22v-8h28v8M30 14v8" />
    </g>,
    // sectors: quadrant grid
    <g key="d" fill="none" stroke="currentColor" strokeWidth="1.4">
      <rect x="12" y="12" width="16" height="16" />
      <rect x="32" y="12" width="16" height="16" className="fill-accent" stroke="none" />
      <rect x="12" y="32" width="16" height="16" />
      <rect x="32" y="32" width="16" height="16" />
    </g>,
  ];
  return (
    <svg viewBox="0 0 60 60" aria-hidden="true" className="h-12 w-12 text-foreground/70">
      {art[variant % art.length]}
    </svg>
  );
}

export function PanelFeature({ feature, variant }: { feature: NavFeature; variant: number }) {
  return (
    <div className="flex h-full flex-col border-border/70 pl-8 lg:border-l lg:pl-10">
      <div className="flex items-start justify-between gap-6">
        <p className="t-h4 max-w-[26ch] leading-snug text-foreground">{feature.title}</p>
        <FeatureArt variant={variant} />
      </div>
      <p className="t-sm mt-4 max-w-[38ch] text-muted">{feature.copy}</p>
      <Link
        href={feature.href}
        className="group/btn t-sm mt-6 inline-flex items-center gap-2 font-semibold text-accent transition-colors hover:text-accent-hover"
      >
        {feature.cta}
        <svg aria-hidden="true" viewBox="0 0 14 14" className="h-3 w-3 transition-transform duration-300 group-hover/btn:translate-x-[3px]" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M1 7h11M7.5 2.5 12 7l-4.5 4.5" />
        </svg>
      </Link>
    </div>
  );
}

export function PanelAllLink({ label, href }: { label: string; href: string }) {
  return (
    <Link
      href={href}
      className="group/all t-label mt-4 inline-flex items-center gap-2 border-t border-border pt-4 text-muted transition-colors hover:text-accent"
    >
      {label}
      <svg aria-hidden="true" viewBox="0 0 14 14" className="h-3 w-3 transition-transform duration-300 group-hover/all:translate-x-[3px]" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M1 7h11M7.5 2.5 12 7l-4.5 4.5" />
      </svg>
    </Link>
  );
}

/** One full-width ink mega bar (list column(s) + feature). */
export function MegaBar({
  label,
  links,
  allLabel,
  allHref,
  feature,
  featureVariant,
  twoCols,
  id,
}: {
  label: string;
  links: NavLink[];
  allLabel?: string;
  allHref?: string;
  feature?: NavFeature;
  featureVariant?: number;
  twoCols?: boolean;
  id: string;
}) {
  return (
    <div
      id={id}
      className={cn(
        "chapter-ink absolute inset-x-0 top-full hidden border-y border-border bg-background/85 shadow-[0_24px_60px_rgb(10_10_14/0.28)] backdrop-blur-xl lg:block",
      )}
    >
      <div className="shell grid gap-10 py-9 lg:grid-cols-12">
        <div className={cn(twoCols ? "lg:col-span-7" : "lg:col-span-5")}>
          <p className="t-label mb-5 text-muted">{label}</p>
          <ul className={cn(twoCols && "grid grid-cols-2 gap-x-10")}>
            {links.map((link) => (
              <li key={link.href} className="border-b border-border/60">
                <PanelLink link={link} />
              </li>
            ))}
          </ul>
          {allLabel && allHref ? (
            <PanelAllLink label={allLabel} href={allHref} />
          ) : null}
        </div>
        {feature ? (
          <div className="lg:col-span-5 lg:col-start-8">
            <PanelFeature feature={feature} variant={featureVariant ?? 0} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
