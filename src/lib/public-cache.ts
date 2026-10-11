import "server-only";
import { unstable_cache } from "next/cache";

/** Public CMS/site chrome only. Never use this wrapper for sessions or private records. */
export const PUBLIC_CONTENT_CACHE_TAG = "public-managed-content";
export const PUBLIC_SITE_CHROME_CACHE_TAG = "public-site-chrome";
export const PUBLIC_CONTENT_CACHE_SECONDS = 60;

/**
 * Persist small, publication-filtered public reads across requests. Server
 * Actions invalidate these tags immediately after managed-content writes.
 * `unstable_cache` is retained for this app's current non-Cache-Components
 * architecture; migrate to `use cache` with the Cache Components rollout.
 */
export function cachePublicData<T>(
  key: string,
  load: () => Promise<T>,
  tags: string[] = [],
): () => Promise<T> {
  // Unit tests exercise data projection without Next's request cache context.
  if (process.env.NODE_ENV === "test") return load;
  return unstable_cache(load, [`savo-public-v1:${key}`], {
    revalidate: PUBLIC_CONTENT_CACHE_SECONDS,
    tags: [PUBLIC_CONTENT_CACHE_TAG, ...tags],
  });
}
