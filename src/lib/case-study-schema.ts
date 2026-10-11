/**
 * Case-study record - shared schema for the public detail pages and the
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

/**
 * FLAGSHIP DOSSIER (master specification Parts 9–12).
 *
 * Three case-study levels (Part 14):
 *   flagship - deep editorial + technical story (dossier present)
 *   standard - strong business + technical overview
 *   verified-entry - short verified portfolio entry
 *
 * The dossier is optional so existing records remain valid; when present,
 * the detail page renders the full narrative below the existing overview.
 * NDA engagements (Part 12) set `nda: true` - the renderer states
 * "Client identity withheld under confidentiality agreement" and never
 * invents a client name.
 */
export const CASE_LEVELS = ["flagship", "standard", "verified-entry"] as const;
export type CaseLevel = (typeof CASE_LEVELS)[number];

const richText = z.string().max(8_000).optional().default("");

export const flagshipDossierSchema = z.object({
  /* Project Overview - Part 10 */
  overview: z
    .object({
      client: z.string().max(160).optional().default(""),
      industry: z.string().max(160).optional().default(""),
      country: z.string().max(120).optional().default(""),
      engagement: z.string().max(160).optional().default(""),
      year: z.string().max(40).optional().default(""),
      projectType: z.string().max(160).optional().default(""),
      status: z.string().max(80).optional().default(""),
    })
    .optional(),

  aboutClient: richText,
  situation: richText,
  challenge: richText,
  complexity: z.array(z.string().min(2).max(160)).max(12).optional().default([]),
  discovery: richText,
  strategy: richText,

  productDesign: z
    .object({
      summary: richText,
      research: z.array(z.string().max(240)).max(10).optional().default([]),
      artifacts: z.array(z.string().max(240)).max(10).optional().default([]),
    })
    .optional(),

  architecture: z
    .object({
      frontend: z.string().max(400).optional().default(""),
      backend: z.string().max(400).optional().default(""),
      database: z.string().max(400).optional().default(""),
      cloud: z.string().max(400).optional().default(""),
      authentication: z.string().max(400).optional().default(""),
      apis: z.string().max(400).optional().default(""),
      search: z.string().max(400).optional().default(""),
      analytics: z.string().max(400).optional().default(""),
      ai: z.string().max(400).optional().default(""),
    })
    .optional(),

  engineering: richText,

  technologyDecisions: z
    .array(z.object({ choice: z.string().max(160), why: z.string().max(600) }))
    .max(10)
    .optional()
    .default([]),

  qualityEngineering: richText,
  deployment: richText,

  outcome: z
    .object({
      business: richText,
      technical: richText,
      operational: richText,
      user: richText,
    })
    .optional(),

  /** Part 11 - restrained, factual project information block. */
  projectInfo: z
    .object({
      clientIdentity: z.string().max(80).optional().default(""),
      product: z.string().max(80).optional().default(""),
      engagement: z.string().max(80).optional().default(""),
      caseStudyApproved: z.string().max(40).optional().default(""),
      externalVerification: z.string().max(120).optional().default(""),
    })
    .optional(),

  /** Part 11 - verification links (live site, store listings, reviews). */
  verificationLinks: z
    .array(z.object({ label: z.string().max(120), href: z.string().url().max(500) }))
    .max(6)
    .optional()
    .default([]),
});

export type FlagshipDossier = z.infer<typeof flagshipDossierSchema>;

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
  /** Explicit many-to-many sector links; no inference from prose or discipline. */
  industrySlugs: z.array(z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(80)).max(20).optional(),
  summary: z.string().max(600).optional().default(""),
  /** Optional detail-hero introduction. Empty falls back to the card summary. */
  introduction: z.string().max(1200).optional(),
  challenge: z.string().max(4000).optional().default(""),
  solution: z.string().max(4000).optional().default(""),
  /** Capability chips - multiselected from the discipline's list. */
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
  /** Project palette - design system colors shown as swatches. */
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
  /** Attached covers - new uploads are cropped to 16:9 for the portfolio
   * cards and detail-page overview. Existing image dimensions remain valid.
   *   showcase (1600×900) - detail-page band + fallback for cards
   *   cardWide  (1600×900) - homepage and portfolio cards
   *   card      (1280×720) - legacy standard-card slot
   * Empty slots fall back down the chain (card → cardWide → showcase),
   * then to the legacy hero image. Data URLs live inside the record JSON
   * so images travel with the database everywhere. */
  images: z
    .object({
      showcase: attachedImageSchema.nullish(),
      cardWide: attachedImageSchema.nullish(),
      card: attachedImageSchema.nullish(),
      dossierCard: attachedImageSchema.nullish(),
    })
    .optional(),
  /** Legacy single image (pre multi-slot) - treated as the showcase slot
   * by resolveCaseImages below. */
  heroImage: attachedImageSchema.nullish(),
  featured: z.boolean().optional().default(false),
  /** Live project URL - shown as "View Live" on the detail page. */
  liveUrl: z.string().url().max(500).nullish(),
  /** Author credit: who wrote this case study. Shown after the palette. */
  authorName: z.string().max(120).optional().default(""),
  /** Client location - e.g. "Dubai, UAE" or "Indore, India". */
  clientLocation: z.string().max(120).optional().default(""),
  /** Business model - B2B / B2C / B2B2C / Marketplace / SaaS. */
  businessModel: z.string().max(80).optional().default(""),
  /** Target platforms - e.g. "Web + iOS + Android". */
  platforms: z.string().max(160).optional().default(""),
  /** Key features delivered: title + short description each. */
  keyFeatures: z
    .array(z.object({ title: z.string().min(2).max(80), text: z.string().max(300) }))
    .max(6)
    .optional()
    .default([]),
  /** Third-party integrations: e.g. "Stripe, SendGrid, Twilio". */
  integrations: z.array(z.string().min(1).max(80)).max(12).optional().default([]),
  /** Gallery images - additional project visuals beyond the three slots
   *  (screenshots, detail views, process shots). Auto-compressed. */
  gallery: z
    .array(
      z.object({
        dataUrl: z.string().startsWith("data:image/").max(4_000_000),
        width: z.number().int().positive(),
        height: z.number().int().positive(),
        alt: z.string().max(200).default(""),
      }),
    )
    .max(8)
    .optional()
    .default([]),
  /** Constants-side content status - records marked demo never render in production. */
  status: z.enum(["demo", "verified"]).optional().default("demo"),

  /** Case-study level (Part 14) - defaults to standard behaviour. */
  level: z.enum(CASE_LEVELS).optional().default("standard"),
  /** NDA engagement (Part 12) - identity withheld, never fabricated. */
  nda: z.boolean().optional().default(false),
  /** Flagship dossier (Part 10) - drives the deep editorial layout. */
  dossier: flagshipDossierSchema.optional(),
});

export type CaseStudyRecord = z.infer<typeof caseStudySchema>;

/** Public shape: the record plus its slug. */
export type CaseStudy = CaseStudyRecord & { slug: string };

export type AttachedImageRecord = z.infer<typeof attachedImageSchema>;

/** Fixed slot dimensions (single source for the admin crop fields). */
export const CASE_IMAGE_SLOTS = {
  showcase: {
    width: 1600,
    height: 900,
    label: "Showcase",
    where: "Detail page - the wide cover image",
    hint: "16:9",
  },
  cardWide: {
    width: 1600,
    height: 900,
    label: "Portfolio cover",
    where: "Homepage and case-study listing cards",
    hint: "16:9",
  },
  card: {
    width: 1280,
    height: 720,
    label: "Standard card",
    where: "Standard case-study cards",
    hint: "16:9",
  },
  dossierCard: {
    width: 1280,
    height: 720,
    label: "Related project cover",
    where: "Detail page - related project cards",
    hint: "16:9",
  },
} as const;

export type SlotKey = keyof typeof CASE_IMAGE_SLOTS;

/**
 * Resolve the effective image per surface with the fallback chain
 * card → cardWide → showcase → legacy heroImage. Pure - usable on the
 * server and inside the admin form's live preview.
 */
export function resolveCaseImages(study: {
  images?: { showcase?: AttachedImageRecord | null; cardWide?: AttachedImageRecord | null; card?: AttachedImageRecord | null; dossierCard?: AttachedImageRecord | null } | null;
  heroImage?: AttachedImageRecord | null;
}): { showcase: AttachedImageRecord | null; cardWide: AttachedImageRecord | null; card: AttachedImageRecord | null; dossierCard: AttachedImageRecord | null } {
  const slots = study.images ?? {};
  const galleryFirst = (study as { gallery?: { dataUrl: string; width: number; height: number; alt: string }[] }).gallery?.[0] ?? null;
  const showcase = slots.showcase ?? study.heroImage ?? slots.cardWide ?? slots.card ?? galleryFirst ?? null;
  const cardWide = slots.cardWide ?? slots.showcase ?? study.heroImage ?? slots.card ?? galleryFirst ?? null;
  const card = slots.card ?? cardWide ?? galleryFirst ?? null;
  const dossierCard = slots.dossierCard ?? card ?? null;
  return { showcase, cardWide, card, dossierCard };
}

export const slugifyCaseStudy = (title: string) =>
  title
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
