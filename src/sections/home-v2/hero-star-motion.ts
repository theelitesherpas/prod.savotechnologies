export type GalaxyStar = { x: number; y: number; depth: number };
export type AtmosphereStar = GalaxyStar & {
  radius: number;
  opacity: number;
  phase: number;
  period: number;
  twinkles: boolean;
  sparkles: boolean;
  anchorX?: number;
  anchorY?: number;
};
export type HorizonEllipse = { centerX: number; centerY: number; radiusX: number; radiusY: number };

/** Noticeable idle motion, not a warp-speed flight: nearer stars drift faster. */
export const STAR_DRIFT_PX_PER_SECOND = [8, 14, 22] as const;
const ORBIT_FLATTENING = 0.68;
const WRAP_MARGIN = 32;

/** Advance clockwise along a gently flattened galactic orbit, independent of FPS.
 * Recycling occurs outside the clipped canvas, including its pointer-parallax range.
 * Mutates the existing particle; no per-frame particle allocations or React updates.
 */
export function advanceGalaxyStar(star: GalaxyStar, width: number, height: number, elapsedMs: number) {
  if (width <= 0 || height <= 0 || !Number.isFinite(elapsedMs) || elapsedMs <= 0) return;
  const centerX = width * 0.5;
  const centerY = height * 0.45;
  const x = star.x - centerX;
  const y = (star.y - centerY) / ORBIT_FLATTENING;
  const speed = STAR_DRIFT_PX_PER_SECOND[star.depth] ?? STAR_DRIFT_PX_PER_SECOND[0];
  const angle = speed * elapsedMs / 1000 / Math.max(120, Math.hypot(x, y));
  const cosine = Math.cos(angle), sine = Math.sin(angle);
  star.x = centerX + x * cosine - y * sine;
  star.y = centerY + (x * sine + y * cosine) * ORBIT_FLATTENING;
  // Never recycle a visible star at an edge: leave a full parallax-safe margin.
  for (const axis of ["x", "y"] as const) {
    const extent = axis === "x" ? width : height;
    if (star[axis] < -WRAP_MARGIN || star[axis] > extent + WRAP_MARGIN) {
      const span = extent + WRAP_MARGIN * 2;
      star[axis] = ((star[axis] + WRAP_MARGIN) % span + span) % span - WRAP_MARGIN;
    }
  }
}

/** The light follows the actual responsive ellipse, including its local tangent. */
export function horizonLightPoint(pointerX: number, width: number, ellipse: HorizonEllipse) {
  const pointer = Number.isFinite(pointerX) ? Math.max(0, Math.min(1, pointerX)) : 0.5;
  const radiusX = Math.max(1, ellipse.radiusX), radiusY = Math.max(1, ellipse.radiusY);
  const u = Math.max(-0.98, Math.min(0.98, (pointer - 0.5) * width * 0.8 / radiusX));
  const root = Math.sqrt(1 - u * u);
  return {
    x: ellipse.centerX + radiusX * u,
    y: ellipse.centerY - radiusY * root,
    tangent: Math.atan2(radiusY * u, radiusX * root),
  };
}

/** Localized, independently phased glints: a slow rise/fall, never an on/off flash. */
export function starSparkle(phase: number, reducedMotion: boolean) {
  return reducedMotion ? 0 : Math.pow((1 + Math.sin(phase)) * 0.5, 10);
}

/** Additional stars stay above the central glow and below the actual CTA bounds. */
export function createHorizonCluster(width: number, apex: number, safeTop: number): AtmosphereStar[] {
  const gap = apex - safeTop - 20;
  if (width <= 0 || gap < 12) return [];
  let seed = 851;
  const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  const mobile = width < 768;
  const count = Math.min(mobile ? 24 : 52, Math.floor(width / 26) + (mobile ? 9 : 0));
  return Array.from({ length: count }, (_, index) => {
    const angle = random() * Math.PI * 2, spread = Math.pow(random(), 0.8);
    const x = width * 0.5 + Math.cos(angle) * spread * Math.min(width * 0.27, 410);
    const y = apex - 16 - gap * 0.5 + Math.sin(angle) * spread * gap * 0.5;
    const sparkles = index % 7 === 0;
    return {
      x, y, anchorX: x, anchorY: y,
      radius: sparkles ? 1 + random() * 0.3 : 0.3 + random() * 0.6,
      opacity: sparkles ? 0.72 : 0.2 + random() * 0.26,
      depth: sparkles ? 2 : 0,
      phase: index * 2.39996 + random() * 0.75,
      period: 5000 + random() * 4500,
      twinkles: true, sparkles,
    };
  });
}
