import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Region identity vectors — one hand-drawn line illustration per region,
 * shared by the contact offices grid and the footer presence strip.
 * Abstract technical marks, 1.5px stroke on a 64×44 grid; strokes ink
 * themselves in on scroll (pathLength trick) when `draw` is set.
 */

const ART: Record<string, ReactNode> = {
  /* India · Headquarters — dome monument over an arched base */
  india: (
    <>
      <path pathLength={1} d="M32 3v2.5" />
      <path pathLength={1} d="M32 5.5c2.9 3.5 4.3 6.4 4.3 9a4.3 4.3 0 0 1-8.6 0c0-2.6 1.4-5.5 4.3-9Z" />
      <path pathLength={1} d="M21 38V23h22v15" />
      <path pathLength={1} d="M28.6 38v-6.4a3.4 3.4 0 0 1 6.8 0V38" />
      <path pathLength={1} d="M15.5 38V27M48.5 38V27" />
      <path pathLength={1} d="M13 27h5M46 27h5" />
      <path pathLength={1} d="M8 38h48M14 42h36" />
    </>
  ),
  /* Switzerland · Head Office — alpine ridge with snow cap */
  switzerland: (
    <>
      <path pathLength={1} d="M9 38 25 14l6.5 9.5" />
      <path pathLength={1} d="M33.5 25.5 42 9l12 29" />
      <path pathLength={1} d="m38.5 16 3 3 2.5-2.5 3 3" />
      <path pathLength={1} d="M8 38h48" />
      <path pathLength={1} d="M14 42h10M42 42h10" />
    </>
  ),
  /* Saudi Arabia — dhow sail over the gulf line */
  "saudi-arabia": (
    <>
      <path pathLength={1} d="M26 32C26 19.5 32.5 9.5 45.5 5.5 37 13.5 33.5 23 33.5 32" />
      <path pathLength={1} d="M20 32c2.5 3.5 21.5 3.5 24 0" />
      <path pathLength={1} d="M24 35.5h16" />
      <path pathLength={1} d="M8 40.5h12M44 40.5h12" />
    </>
  ),
  /* Australia — sails over water */
  australia: (
    <>
      <path pathLength={1} d="M13 36c2-10 8-16 16-18-6 6-9 12-9 18" />
      <path pathLength={1} d="M23 36c3-12 10-19 19-21-8 7-12 14-12 21" />
      <path pathLength={1} d="M33 36c3-9 9-15 16-16-6 5-9 10-9 16" />
      <path pathLength={1} d="M8 36h48" />
      <path pathLength={1} d="M14 40.5h8M42 40.5h8" />
    </>
  ),
  /* United Kingdom — clock tower over the baseline */
  "united-kingdom": (
    <>
      <path pathLength={1} d="M27 38V14h10v24" />
      <path pathLength={1} d="M27 14l5-6.5 5 6.5" />
      <path pathLength={1} d="M29 19a3 3 0 0 0 6 0 3 3 0 0 0-6 0" />
      <path pathLength={1} d="M32 17.6v1.6M33.4 19h-1.4" />
      <path pathLength={1} d="M22 38h20M20 38v-4M44 38v-4" />
      <path pathLength={1} d="M8 38h48" style={{ ["--draw-delay" as string]: "0.7s" }} />
    </>
  ),
  /* USA — tower and skyline */
  usa: (
    <>
      <path pathLength={1} d="M30 38V13h4v25" />
      <path pathLength={1} d="M32 13V5.5" />
      <path pathLength={1} d="M13 38v-8h6v8M45 38V26h6v12" />
      <path pathLength={1} d="M31.6 18h.8M31.6 23h.8M31.6 28h.8M31.6 33h.8" />
      <path pathLength={1} d="M15.5 33h1M18.5 33h1M47.5 31h1M50.5 31h1" />
      <path pathLength={1} d="M8 38h48" />
    </>
  ),
};

export function RegionArt({
  id,
  className,
  draw = false,
}: {
  id: string;
  className?: string;
  /** Enable the scroll draw-on animation (contact grid); footers stay static. */
  draw?: boolean;
}) {
  const art = ART[id];
  if (!art) return null;
  return (
    <svg
      viewBox="0 0 64 44"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={cn("text-foreground/55", className)}
    >
      <g data-draw={draw ? "" : undefined}>{art}</g>
    </svg>
  );
}
