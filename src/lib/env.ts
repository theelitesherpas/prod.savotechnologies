import { z } from "zod";

/**
 * Typed, validated environment configuration.
 * Server-only values are never imported into client components.
 */
const serverSchema = z.object({
  DATABASE_URL: z.string().url().optional(),
  ENQUIRY_IP_SALT: z.string().default("savo-dev-salt"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

const clientSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_GA_ID: z.string().optional(),
});

/**
 * Canonical production origin — the domain every canonical URL, sitemap
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
  DATABASE_URL: process.env.DATABASE_URL,
  ENQUIRY_IP_SALT: process.env.ENQUIRY_IP_SALT,
  NODE_ENV: process.env.NODE_ENV,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_GA_ID: process.env.NEXT_PUBLIC_GA_ID,
};

const isServer = typeof window === "undefined";
const parsed = (isServer ? serverSchema : clientSchema).safeParse(processEnv);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:", parsed.error.flatten().fieldErrors);
}

export const env = { ...clientSchema.parse(processEnv), ...(isServer ? serverSchema.parse(processEnv) : {}) } as {
  NEXT_PUBLIC_SITE_URL: string;
  NEXT_PUBLIC_GA_ID?: string;
  DATABASE_URL?: string;
  ENQUIRY_IP_SALT: string;
  NODE_ENV: "development" | "test" | "production";
};

/**
 * Absolute URL helper for metadata, sitemaps and JSON-LD — always built on
 * the canonical production origin, never on the deployment host.
 * Path trailing slashes are normalized away (except the root) so every
 * emitted URL — canonical, sitemap entry, JSON-LD — matches the served
 * 200 URL instead of a 308 redirect.
 */
export function absoluteUrl(path = "/"): string {
  const normalized = path === "/" || !path.endsWith("/") ? path : path.replace(/\/+$/, "");
  return `${canonicalOrigin}${normalized === "/" ? "/" : normalized}`;
}
