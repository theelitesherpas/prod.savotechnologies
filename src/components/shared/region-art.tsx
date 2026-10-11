import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Region identity vectors - one hand-drawn line illustration per region,
 * shared by the contact offices grid and the footer presence strip.
 * Abstract technical marks, 1.5px stroke on a 64×44 grid; strokes ink
 * themselves in on scroll (pathLength trick) when `draw` is set.
 */

const ART: Record<string, ReactNode> = {
  /* India · Headquarters - Taj Mahal: dome, finial, minarets, pool */
  india: (
    <>
      {/* finial */}
      <path pathLength={1} d="M32 2.5v1" />
      {/* onion dome */}
      <path pathLength={1} d="M32 3.5c3.1 3.6 4.7 6.7 4.7 9.6a4.7 4.7 0 0 1-9.4 0c0-2.9 1.6-6 4.7-9.6Z" />
      {/* drum below dome */}
      <path pathLength={1} d="M28.6 17.8h6.8" />
      {/* main arch iwan */}
      <path pathLength={1} d="M21 38V22.5h22V38" />
      <path pathLength={1} d="M28.2 38v-6.2a3.8 3.8 0 0 1 7.6 0V38" />
      {/* side arches */}
      <path pathLength={1} d="M24.5 38v-4.5a2 2 0 0 1 4 0V38M35.5 38v-4.5a2 2 0 0 1 4 0V38" />
      {/* minarets */}
      <path pathLength={1} d="M14.5 38V12M49.5 38V12" />
      <path pathLength={1} d="M13 12h3M48 12h3" />
      <path pathLength={1} d="M14.5 16.5h0M49.5 16.5h0" />
      {/* platform + pool */}
      <path pathLength={1} d="M10 38h44M16 42h32" />
      <path pathLength={1} d="M27 42v0M32 3.5v0" style={{ display: "none" }} />
      {/* reflection */}
      <path pathLength={1} d="M29.5 41h5" style={{ ["--draw-delay" as string]: "0.8s" }} />
    </>
  ),
  /* Switzerland · Head Office - Matterhorn, flag, chalet */
  switzerland: (
    <>
      {/* Matterhorn with snow cap */}
      <path pathLength={1} d="M8 38 24 12l7 10.5" />
      <path pathLength={1} d="M35 27.5 44 9l13 29" />
      {/* snow cap zigzag */}
      <path pathLength={1} d="m21.5 16.5 2.5 2.5 2-2 2.5 3M40.5 15l2.5 3 2-2.5 2.5 3.5" />
      {/* summit flag */}
      <path pathLength={1} d="M44 9V4.5M44 4.5h5l-1.5 1.7 1.5 1.8h-5" />
      {/* chalet */}
      <path pathLength={1} d="M14 38v-6.5h7V38" />
      <path pathLength={1} d="m12.5 31.5 5-4.5 5 4.5" />
      {/* baselines */}
      <path pathLength={1} d="M8 38h48" />
      <path pathLength={1} d="M14 42h9M41 42h9" />
    </>
  ),
  /* Dubai & GCC - Burj Khalifa spire over the gulf */
  "dubai-gcc": (
    <>
      {/* central spire */}
      <path pathLength={1} d="M32 3c1.8 4.5 2.6 9 2.6 14" />
      <path pathLength={1} d="M32 3c-1.8 4.5-2.6 9-2.6 14" />
      {/* tiered setbacks */}
      <path pathLength={1} d="M24.5 26c2.5-4 4.5-6 7.5-9 3 3 5 5 7.5 9" />
      <path pathLength={1} d="M21.5 32c3.5-4.5 6.5-7.5 10.5-11 4 3.5 7 6.5 10.5 11" />
      <path pathLength={1} d="M18.5 38c4.5-5 8-8.5 13.5-13.5C37.5 29.5 41 33 45.5 38" />
      {/* side towers */}
      <path pathLength={1} d="M13 38v-7M51 38v-7M13 31h4M47 31h4" />
      {/* gulf baseline */}
      <path pathLength={1} d="M8 38h48" />
      <path pathLength={1} d="M14 42h9M41 42h9" />
    </>
  ),
  /* Australia - sails over water */
  australia: (
    <>
      <path pathLength={1} d="M13 36c2-10 8-16 16-18-6 6-9 12-9 18" />
      <path pathLength={1} d="M23 36c3-12 10-19 19-21-8 7-12 14-12 21" />
      <path pathLength={1} d="M33 36c3-9 9-15 16-16-6 5-9 10-9 16" />
      <path pathLength={1} d="M8 36h48" />
      <path pathLength={1} d="M14 40.5h8M42 40.5h8" />
    </>
  ),
  /* United Kingdom - clock tower over the baseline */
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
  /* USA - Statue of Liberty torch over the skyline */
  usa: (
    <>
      {/* torch arm + flame */}
      <path pathLength={1} d="M27 16c-1.5-3.5-.5-7 2-9.5" />
      <path pathLength={1} d="M29 6.5c.8-1.6 2.4-2.6 4-3-0.4 1.8-1.4 3.2-3 4" />
      {/* crowned head silhouette */}
      <path pathLength={1} d="M27.5 16.5a3.2 3.2 0 0 1 6.4 0" />
      <path pathLength={1} d="M27.5 16.5l-1.2-3M33.9 16.5l1.2-3M30.7 15.2v-3.4" />
      {/* robe to pedestal */}
      <path pathLength={1} d="M26.5 21.5c1 8 1.5 12 1.5 16.5h5c0-4.5.5-8.5 1.5-16.5" />
      <path pathLength={1} d="M26.5 21.5a4.5 4.5 0 0 1 8 0" />
      {/* pedestal + base */}
      <path pathLength={1} d="M25 38h11M26.5 34h8" />
      {/* skyline */}
      <path pathLength={1} d="M13 38v-8h5v8M46 38v-6h6v6M19.5 30v-3M52.5 32v-3" />
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
