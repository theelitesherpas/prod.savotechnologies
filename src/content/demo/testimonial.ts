/**
 * ─────────────────────────────────────────────────────────────────────────────
 * DEMO TESTIMONIAL — PREVIEW STRUCTURE
 * DEMO — REPLACE BEFORE PRODUCTION
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Keeps the testimonial layout complete on staging WITHOUT manufacturing an
 * endorsement. This is an explicit preview placeholder — never attributed
 * to a believable person or company. Production suppresses the section
 * until an approved, publishable client quote exists.
 */

import type { ContentStatus } from "@/lib/content-mode";

export type DemoTestimonial = {
  kicker: string;
  quote: string;
  name: string;
  role: string;
  status: ContentStatus;
};

/** DEMO TESTIMONIAL — structure preview, not an endorsement. */
export const DEMO_TESTIMONIAL: DemoTestimonial = {
  kicker: "Client testimonial preview",
  quote:
    "This area will feature an approved client testimonial describing the collaboration, delivery experience and measurable value created by the project.",
  name: "Client Name",
  role: "Role · Company",
  status: "demo",
};
