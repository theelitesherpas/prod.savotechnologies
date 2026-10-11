import { z } from "zod";

/** Public configuration ONLY. Secrets live behind lib/server-env.ts's server-only guard. */
const clientSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_GA_ID: z.preprocess(v => v === "" ? undefined : v, z.string().optional()),
});

/**
 * Canonical production origin - the domain every canonical URL, sitemap
 * entry, JSON-LD @id and Open Graph absolute URL must use.
 * https://savotechnologies.com by default; testing deployments NEVER change
 * this (they carry noindex instead), so previews cannot compete with the
 * production domain. NEXT_PUBLIC_CANONICAL_ORIGIN exists only for unusual
 * local verification builds.
 */
export const canonicalOrigin = (
  process.env.NEXT_PUBLIC_CANONICAL_ORIGIN ?? "https://savotechnologies.com"
).replace(/\/$/, "");

/**
 * Indexing gate. Production sets NEXT_PUBLIC_INDEXABLE=true only when the
 * site is live on savotechnologies.com. Everything else (local dev, Vercel
 * test/preview deployments) defaults to noindex.
 */
export const INDEXABLE = process.env.NEXT_PUBLIC_INDEXABLE === "true";

const processEnv = {
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_GA_ID: process.env.NEXT_PUBLIC_GA_ID,
};

const parsed = clientSchema.safeParse(processEnv);
if (!parsed.success) throw new Error("Invalid public environment configuration");
export const env = parsed.data;

/**
 * Absolute URL helper for metadata, sitemaps and JSON-LD - always built on
 * the canonical production origin, never on the deployment host.
 * Path trailing slashes are normalized away (except the root) so every
 * emitted URL - canonical, sitemap entry, JSON-LD - matches the served
 * 200 URL instead of a 308 redirect.
 */
export function absoluteUrl(path = "/"): string {
  const normalized = path === "/" || !path.endsWith("/") ? path : path.replace(/\/+$/, "");
  return `${canonicalOrigin}${normalized === "/" ? "/" : normalized}`;
}
