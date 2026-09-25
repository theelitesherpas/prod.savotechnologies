/**
 * ─────────────────────────────────────────────────────────────────────────────
 * DEMO CONTENT — CENTRAL REGISTRY
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Every invented factual value in this project lives under src/content/demo/
 * and carries `status: "demo"`. Nothing here may be imported directly into
 * rendered components — constants consume it through the CONTENT_MODE gate
 * (src/lib/content-mode.ts), so a production build can never expose it.
 *
 * scripts/verify-content.mjs enforces this at build time.
 *
 * DEMO — REPLACE BEFORE PRODUCTION (see DEMO_CONTENT_REPLACEMENT.md)
 */

export {
  DEMO_METRICS,
  DEMO_TEAM_SIZE,
  DEMO_YEARS_EXPERIENCE,
  type DemoMetric,
} from "./company";

export {
  DEMO_CASE_STUDIES,
  DEMO_CLIENTS,
  type DemoCaseStudy,
} from "./case-studies";

export { DEMO_TESTIMONIAL, type DemoTestimonial } from "./testimonial";

export {
  HQ_PRESENCE,
  CH_OFFICE,
  VERIFIED_OFFICES,
  DEMO_MARKET_PRESENCE,
  type MarketPresence,
  type PresencePhone,
} from "./locations";

/**
 * Trust & compliance — NON-CERTIFICATION capability labels (always safe).
 *
 * The v1 footer claimed "GDPR Compliant", "PCI DSS Ready", "ISO 27001
 * Aligned" — certification statements Savo does not hold, removed per the
 * demo content policy. These replacements describe engineering practices,
 * not certifications, and are safe in both modes.
 */
export const TRUST_CAPABILITY_LABELS = [
  "Security-Conscious Engineering",
  "Privacy-Aware Development",
  "Secure Delivery Practices",
  "Production-Focused QA",
] as const;
