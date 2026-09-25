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

/** One attached visual: cropped to its slot's exact target size. */
const attachedImageSchema = z.object({
  dataUrl: z.string().startsWith("data:image/").max(4_000_000),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  alt: z.string().max(200).default(""),
});

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
  /** Attached visuals — one slot per rendering surface, each cropped to
   * the exact aspect that surface shows (no distortion anywhere):
   *   showcase (1920×1080) — detail-page big band
   *   cardWide  (1600×900)  — featured cards (home + index)
   *   card      (1280×800)  — standard cards (home + index)
   * Empty slots fall back down the chain (card → cardWide → showcase),
   * then to the generated mockup. Data URLs live inside the record JSON
   * so images travel with the database everywhere. */
  images: z
    .object({
      showcase: attachedImageSchema.nullish(),
      cardWide: attachedImageSchema.nullish(),
      card: attachedImageSchema.nullish(),
    })
    .optional(),
  /** Legacy single image (pre multi-slot) — treated as the showcase slot
   * by resolveCaseImages below. */
  heroImage: attachedImageSchema.nullish(),
  featured: z.boolean().optional().default(false),
  /** Constants-side content status — records marked demo never render in production. */
  status: z.enum(["demo", "verified"]).optional().default("demo"),
});

export type CaseStudyRecord = z.infer<typeof caseStudySchema>;

/** Public shape: the record plus its slug. */
export type CaseStudy = CaseStudyRecord & { slug: string };

export type AttachedImageRecord = z.infer<typeof attachedImageSchema>;

/** Fixed slot dimensions (single source for the admin crop fields). */
export const CASE_IMAGE_SLOTS = {
  showcase: {
    width: 1920,
    height: 1080,
    label: "Showcase",
    where: "Detail page — the big cinematic band",
    hint: "16:9",
  },
  cardWide: {
    width: 1600,
    height: 700,
    label: "Featured card",
    where: "Homepage + dossier index — full-width featured card (16:7 on desktop)",
    hint: "16:7",
  },
  card: {
    width: 1280,
    height: 800,
    label: "Standard card",
    where: "Homepage + dossier index — two-up half cards",
    hint: "16:10",
  },
} as const;

export type SlotKey = keyof typeof CASE_IMAGE_SLOTS;

/**
 * Resolve the effective image per surface with the fallback chain
 * card → cardWide → showcase → legacy heroImage. Pure — usable on the
 * server and inside the admin form's live preview.
 */
export function resolveCaseImages(study: {
  images?: { showcase?: AttachedImageRecord | null; cardWide?: AttachedImageRecord | null; card?: AttachedImageRecord | null } | null;
  heroImage?: AttachedImageRecord | null;
}): Record<SlotKey, AttachedImageRecord | null> {
  const slots = study.images ?? {};
  const showcase = slots.showcase ?? study.heroImage ?? null;
  const cardWide = slots.cardWide ?? showcase;
  const card = slots.card ?? cardWide;
  return { showcase, cardWide, card };
}

export const slugifyCaseStudy = (title: string) =>
  title
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
