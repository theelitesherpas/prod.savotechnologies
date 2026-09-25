/**
 * Case-study record — shared schema for the public detail pages and the
 * admin editor. One zod schema validates both directions so the admin form
 * and the public renderer can never drift.
 *
 * Fields follow the demo content policy concept model: identity, dossier
 * (challenge/solution), capability chips, stack, verified-gated results,
 * project palette, testimonial slot and the content lifecycle.
 */

import { z } from "zod";

export const CASE_DISCIPLINE_IDS = ["web", "mobile", "ai", "software", "design", "growth"] as const;
export type CaseDisciplineId = (typeof CASE_DISCIPLINE_IDS)[number];

export const caseStudySchema = z.object({
  /** Display title, e.g. "Meridian Commerce" (or the real client name). */
  title: z.string().min(2).max(120),
  /** Internal client name (may differ from what is displayed publicly). */
  clientName: z.string().max(120).optional().default(""),
  /** Name shown on the public card (anonymized engagements use this). */
  displayClientName: z.string().max(120).optional().default(""),
  discipline: z.enum(CASE_DISCIPLINE_IDS),
  /** e.g. "Ecommerce · Web Platform · Product Engineering". */
  industry: z.string().max(160).optional().default(""),
  summary: z.string().max(600).optional().default(""),
  challenge: z.string().max(4000).optional().default(""),
  solution: z.string().max(4000).optional().default(""),
  /** Capability chips — multiselected from the discipline's list. */
  services: z.array(z.string().min(1).max(80)).max(12).optional().default([]),
  /** Tech stack chips. */
  technologies: z.array(z.string().min(1).max(60)).max(20).optional().default([]),
  /** Outcome metrics. `verified` gates production rendering (policy §27). */
  results: z
    .array(
      z.object({
        value: z.string().min(1).max(24),
        label: z.string().min(1).max(80),
        verified: z.boolean().optional().default(false),
      }),
    )
    .max(6)
    .optional()
    .default([]),
  /** Project palette — design system colors shown as swatches. */
  palette: z
    .array(
      z.object({
        name: z.string().min(1).max(60),
        hex: z.string().regex(/^#[0-9a-fA-F]{6}$/),
      }),
    )
    .max(8)
    .optional()
    .default([]),
  year: z.string().max(20).optional().default(""),
  duration: z.string().max(60).optional().default(""),
  teamSize: z.string().max(60).optional().default(""),
  testimonial: z
    .object({
      quote: z.string().min(2).max(1200),
      name: z.string().min(1).max(120),
      role: z.string().min(1).max(160),
    })
    .nullish(),
  featured: z.boolean().optional().default(false),
  /** Constants-side content status — records marked demo never render in production. */
  status: z.enum(["demo", "verified"]).optional().default("demo"),
});

export type CaseStudyRecord = z.infer<typeof caseStudySchema>;

/** Public shape: the record plus its slug. */
export type CaseStudy = CaseStudyRecord & { slug: string };

export const slugifyCaseStudy = (title: string) =>
  title
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
