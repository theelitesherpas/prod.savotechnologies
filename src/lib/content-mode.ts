/**
 * Demo Content System - central mode gate.
 *
 * CONTENT_MODE controls how unverified business facts are presented:
 *
 *   demo       (default) Polished demo content renders so the complete
 *                        design - statistics, case studies, testimonial
 *                        layout, market presence - can be evaluated before
 *                        Savo supplies verified data. Demo builds are
 *                        always noindex.
 *   production             Demo records are suppressed: the site shows only
 *                        verified data, truthful non-specific wording, or
 *                        honest pending slots. Never invented facts.
 *
 * Mode is set via NEXT_PUBLIC_CONTENT_MODE (needed in both server and
 * client bundles because constants feed both). Anything absent or misspelled
 * resolves to "demo" - the safe default: an unconfigured production launch
 * can never accidentally publish demo facts.
 */

export type ContentMode = "demo" | "production";

export const CONTENT_MODE: ContentMode =
  process.env.NEXT_PUBLIC_CONTENT_MODE === "production" ? "production" : "demo";

/** True when demo/design content may render. */
export const IS_DEMO = CONTENT_MODE === "demo";

/**
 * Content lifecycle status for any record that states a business fact.
 * - "demo"     - fictional design data; staging only, never production.
 * - "verified" - confirmed by Savo; safe everywhere.
 * (The admin/DB layer additionally uses draft | review | published for
 * editorial workflow - see prisma/schema.prisma ContentItem.contentStatus.)
 */
export type ContentStatus = "demo" | "verified";

/**
 * Gate for demo records. Demo records render ONLY in demo mode; in
 * production mode the caller's verified fallback is used instead.
 *
 *   demoRecord(DEMO_METRICS, VERIFIED_METRICS)
 */
export function demoRecord<T>(demo: T, verifiedFallback: T): T {
  return IS_DEMO ? demo : verifiedFallback;
}

/**
 * Filter a list to its production-safe entries: verified records pass,
 * demo records are dropped unless the site runs in demo mode.
 */
export function productionSafe<T extends { status: ContentStatus }>(items: readonly T[]): T[] {
  return IS_DEMO ? [...items] : items.filter((i) => i.status === "verified");
}
