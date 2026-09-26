/**
 * ─────────────────────────────────────────────────────────────────────────────
 * DEMO COMPANY METRICS - DESIGN DATA ONLY
 * DEMO - REPLACE BEFORE PRODUCTION
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * These values exist so the statistics section can be evaluated visually
 * (spacing, typography, tabular figures, responsive grid) before Savo
 * supplies verified figures.
 *
 * They are NOT factual Savo statistics and must NEVER render in
 * CONTENT_MODE=production, appear in JSON-LD, metadata, SEO copy, the
 * sitemap, or any other machine-readable factual representation.
 *
 * Source of truth for replacements: DEMO_CONTENT_REPLACEMENT.md
 */

import type { ContentStatus } from "@/lib/content-mode";

export type DemoMetric = {
  /** Fictional display value, e.g. "120+". */
  value: string;
  /** Professional, non-exaggerated label. */
  label: string;
  status: ContentStatus;
};

/** DEMO DATA - NOT VERIFIED. Homepage impact band. */
export const DEMO_METRICS: DemoMetric[] = [
  { value: "120+", label: "Projects Delivered", status: "demo" },
  { value: "45+", label: "Clients Supported", status: "demo" },
  { value: "12+", label: "Industries Served", status: "demo" },
  { value: "8+", label: "Markets Reached", status: "demo" },
];

/** DEMO DATA - NOT VERIFIED. Team-size card if the design needs one. */
export const DEMO_TEAM_SIZE: DemoMetric = {
  value: "25+",
  label: "Technology Professionals",
  status: "demo",
};

/**
 * DEMO DATA - NOT VERIFIED. Years-of-experience statistic if the design
 * needs one. Do NOT calculate or publish a real value until Savo confirms
 * the founding/incorporation date and which date represents public history.
 */
export const DEMO_YEARS_EXPERIENCE: DemoMetric = {
  value: "10+",
  label: "Years of Experience",
  status: "demo",
};
