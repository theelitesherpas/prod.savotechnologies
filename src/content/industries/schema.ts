import { z } from "zod";

export const INDUSTRY_LAYOUTS = ["care", "ledger", "commerce", "route", "property", "learning", "stay", "production", "civic", "grid"] as const;
const text = z.string().trim().min(1).max(1600);
export const sectorSlug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(80);
const pair = z.object({ title: text.max(100), text });

/** Shared public/publish contract. Drafts may remain incomplete in the editor. */
export const industryDossierSchema = z.object({
  slug: sectorSlug,
  title: text.max(100),
  summary: text.max(240),
  headline: text.max(150),
  lead: text.max(600),
  overview: text,
  metaTitle: text.max(120),
  metaDescription: text.max(320),
  image: z.string().max(240).regex(/^(?:|\/images\/[a-zA-Z0-9/_.-]+\.(?:webp|png|jpg|jpeg|avif))$/).default(""),
  imageAlt: z.string().max(200).default(""),
  layout: z.enum(INDUSTRY_LAYOUTS),
  ecosystemCore: text.max(50),
  ecosystemTitle: text.max(140),
  ecosystemNodes: z.array(z.object({ title: text.max(65), text, role: text.max(100) })).min(4).max(6),
  challenges: z.array(pair).min(3).max(6),
  solutions: z.array(z.object({ title: text.max(100), text, audience: text.max(160), workflow: text.max(260), objective: text.max(400), service: sectorSlug })).min(3).max(8),
  aiOpportunities: z.array(z.object({ title: text.max(100), text, review: text.max(600) })).min(2).max(6),
  integrations: z.array(text.max(180)).min(2).max(12),
  technologies: z.array(text.max(180)).min(2).max(12),
  safeguards: z.array(pair).min(3).max(8),
  outcomes: z.array(z.object({ title: text.max(100), text, measure: text.max(260) })).min(2).max(6),
  relatedServices: z.array(sectorSlug).min(2).max(8),
  relatedIndustries: z.array(sectorSlug).max(6).default([]),
  insightSlugs: z.array(sectorSlug).max(8).default([]),
  faqs: z.array(z.object({ q: text.max(240), a: text })).min(4).max(10),
  ctaHeading: text.max(160),
  ctaText: text.max(600),
  featured: z.boolean().default(false),
  schemaEnabled: z.boolean().default(true),
}).superRefine((d, ctx) => {
  if (d.image && !d.imageAlt) ctx.addIssue({ code: "custom", path: ["imageAlt"], message: "Describe the editorial image for accessibility." });
});
export type IndustryDossier = z.infer<typeof industryDossierSchema>;
export type IndustryLayout = IndustryDossier["layout"];

export type IndustryManagedRow = { slug: string; title: string; data: unknown; active: boolean; contentStatus: string };
/** No inferred publication and no merging absent records back from defaults. */
export function publicIndustryRows(rows: IndustryManagedRow[]): IndustryDossier[] {
  return rows.flatMap(row => {
    if (!row.active || row.contentStatus !== "published") return [];
    const parsed = industryDossierSchema.safeParse({ ...(row.data && typeof row.data === "object" ? row.data : {}), slug: row.slug, title: row.title });
    return parsed.success ? [parsed.data] : [];
  });
}
