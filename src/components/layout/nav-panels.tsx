"use client";

import Link from "next/link";
import { useLayoutEffect, useRef, useState } from "react";
import type { NavFeature, NavLink, NavItem } from "@/constants/navigation";
import { cn } from "@/lib/utils";

/**
 * The mega-drawer: ONE persistent shell under the full header; category
 * content transitions inside it. Opening plays a single drawer-in
 * motion; switching AI → Services → Hire → Industries never closes the
 * shell, the active panel staggers in and the drawer height eases to
 * fit. Editorial layout: indexed link column(s) left, contextual
 * feature panel right, hairline rules and generous air throughout.
 */

/* Square-node mini diagrams: the house motif, one per category. */
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
    <svg viewBox="0 0 60 60" aria-hidden="true" className="h-12 w-12 shrink-0 text-foreground/60">
      {art[variant % art.length]}
    </svg>
  );
}

const ArrowIcon = ({ className }: { className?: string }) => (
  <svg
    aria-hidden="true"
    viewBox="0 0 14 14"
    className={cn("h-3 w-3 shrink-0", className)}
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
  >
    <path d="M1 7h11M7.5 2.5 12 7l-4.5 4.5" />
  </svg>
);

/* Eyebrow labels: small, understated, one per category. */
const EYEBROWS: Record<string, string> = {
  AI: "AI & Intelligence",
  Services: "Services",
  "Hire Developers": "Build Your Team",
  Industries: "Industries",
};

/** One indexed editorial link row: number, name, descriptor, arrow on hover. */
function DrawerLink({ link, index, delay, onNavigate }: { link: NavLink; index: number; delay: number; onNavigate?: () => void }) {
  return (
    <li className="mega-row border-b border-border/60" style={{ animationDelay: `${delay}ms` }}>
      <Link
        href={link.href}
        onClick={onNavigate}
        className="group/drawer-link flex items-center gap-4 py-3.5"
      >
        <span aria-hidden="true" className="t-label tnum w-6 shrink-0 pt-0.5 text-muted/70 transition-colors duration-300 group-hover/drawer-link:text-accent">
          {String(index + 1).padStart(2, "0")}
        </span>
        <span className="min-w-0 flex-1 transition-transform duration-300 ease-[var(--ease-out-expo)] group-hover/drawer-link:translate-x-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-[0.9375rem] font-semibold leading-snug text-foreground/85 transition-colors duration-300 group-hover/drawer-link:text-foreground">
              {link.label}
            </span>
            {link.pro ? (
              <span className="t-label rounded-[2px] border border-accent/40 px-1.5 py-0.5 text-accent-strong">PRO</span>
            ) : null}
          </span>
          {link.desc ? (
            <span className="t-caption mt-0.5 block text-muted/80 transition-colors duration-300 group-hover/drawer-link:text-muted">
              {link.desc}
            </span>
          ) : null}
        </span>
        <ArrowIcon className="-translate-x-1 text-accent opacity-0 transition-all duration-300 ease-[var(--ease-out-expo)] group-hover/drawer-link:translate-x-0 group-hover/drawer-link:opacity-100" />
      </Link>
    </li>
  );
}

/** The contextual feature panel: eyebrow, motif, proposition, one CTA. */
function DrawerFeature({ feature, variant, delay, onNavigate }: { feature: NavFeature; variant: number; delay: number; onNavigate?: () => void }) {
  return (
    <div
      className="mega-row flex h-full flex-col border-l border-border bg-surface-2/40 p-8 xl:p-10"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between gap-5">
        <p className="t-label pt-1.5 uppercase tracking-[0.14em] text-accent-strong">
          {feature.eyebrow ?? "Featured"}
        </p>
        <FeatureArt variant={variant} />
      </div>
      <p className="t-h4 mt-7 max-w-[24ch] leading-snug text-foreground">{feature.title}</p>
      <p className="t-sm mt-4 max-w-[36ch] leading-relaxed text-muted">{feature.copy}</p>
      <Link
        href={feature.href}
        onClick={onNavigate}
        className="group/btn t-sm mt-auto inline-flex items-center gap-2 pt-8 font-semibold text-accent transition-colors hover:text-accent-hover"
      >
        {feature.cta}
        <ArrowIcon className="transition-transform duration-300 group-hover/btn:translate-x-[3px]" />
      </Link>
    </div>
  );
}

type MegaItem = NavItem & { children: NavLink[] };

export function MegaDrawer({
  items,
  active,
  panelIdOf,
  onNavigate,
  onMouseEnter,
  onMouseLeave,
}: {
  items: MegaItem[];
  active: string | null;
  panelIdOf: (label: string) => string;
  onNavigate: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}) {
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [height, setHeight] = useState<number | null>(null);

  /* Ease the shell height between categories: measure the active panel. */
  useLayoutEffect(() => {
    const measure = () => {
      if (contentRef.current) setHeight(contentRef.current.offsetHeight);
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (contentRef.current) ro.observe(contentRef.current);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [active]);

  const activeItem = items.find((i) => i.label === active) ?? null;
  const variant = activeItem ? items.findIndex((i) => i.label === active) : 0;

  return (
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={cn(
        "chapter-ink absolute inset-x-0 top-full hidden border-y border-border bg-background shadow-[0_24px_60px_rgb(10_10_14/0.28)]",
        active ? "drawer-in lg:block" : "lg:hidden",
      )}
    >
      {/* Height-eased viewport: the shell stays open while panels swap */}
      <div
        className="overflow-hidden transition-[height] duration-[280ms] ease-[var(--ease-out-expo)]"
        style={height !== null ? { height } : undefined}
      >
        {activeItem ? (
          <div
            key={activeItem.label}
            ref={contentRef}
            id={panelIdOf(activeItem.label)}
            role="region"
            aria-label={activeItem.label}
          >
            <div className="shell grid gap-10 py-10 lg:grid-cols-12">
              {/* Links */}
              <div className="lg:col-span-8">
                <p className="t-label mb-6 flex items-center gap-3 uppercase tracking-[0.14em] text-muted">
                  <span aria-hidden="true" className="h-1.5 w-1.5 bg-accent" />
                  {EYEBROWS[activeItem.label] ?? activeItem.label}
                </p>
                <ul
                  className={cn(
                    activeItem.children.length > 6 && "grid grid-cols-2 gap-x-10",
                    "[&>li:last-child]:border-b-0",
                  )}
                >
                  {activeItem.children.map((link, i) => (
                    <DrawerLink key={link.href} link={link} index={i} delay={48 + i * 24} onNavigate={onNavigate} />
                  ))}
                </ul>
                {activeItem.href && activeItem.label !== "AI" ? (
                  <Link
                    href={activeItem.href}
                    onClick={onNavigate}
                    className="group/all t-label mega-row mt-6 inline-flex items-center gap-2 border-t border-border pt-5 uppercase tracking-[0.12em] text-muted transition-colors hover:text-accent"
                    style={{ animationDelay: `${48 + activeItem.children.length * 24}ms` }}
                  >
                    All {activeItem.label}
                    <ArrowIcon className="transition-transform duration-300 group-hover/all:translate-x-[3px]" />
                  </Link>
                ) : null}
              </div>
              {/* Feature */}
              {activeItem.feature ? (
                <div className="lg:col-span-4">
                  <DrawerFeature feature={activeItem.feature} variant={variant} delay={140} onNavigate={onNavigate} />
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
