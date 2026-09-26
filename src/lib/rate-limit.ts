/**
 * In-memory sliding-window rate limiter.
 * Sufficient for a single-instance deployment; swap for Upstash/Redis
 * (same interface) when the platform scales horizontally.
 */

type Bucket = { hits: number[] };

// Global singleton — survives Turbopack module isolation between
// server actions and API routes (same pattern as the Prisma client).
const globalForRate = globalThis as unknown as { __rateBuckets?: Map<string, Bucket> };
const buckets = globalForRate.__rateBuckets ?? new Map<string, Bucket>();
globalForRate.__rateBuckets = buckets;
const MAX_BUCKETS = 5_000;

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

export function rateLimit(
  key: string,
  limit = 5,
  windowMs = 60 * 60 * 1000,
): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key) ?? { hits: [] };

  // Evict hits outside the window
  bucket.hits = bucket.hits.filter((t) => now - t < windowMs);

  if (bucket.hits.length >= limit) {
    const oldest = bucket.hits[0];
    buckets.set(key, bucket);
    return {
      ok: false,
      remaining: 0,
      retryAfterSeconds: Math.ceil((windowMs - (now - oldest)) / 1000),
    };
  }

  bucket.hits.push(now);
  buckets.set(key, bucket);

  // Opportunistic cleanup to bound memory
  if (buckets.size > MAX_BUCKETS) {
    for (const [k, b] of buckets) {
      if (b.hits.every((t) => now - t >= windowMs)) buckets.delete(k);
      if (buckets.size <= MAX_BUCKETS) break;
    }
  }

  return { ok: true, remaining: limit - bucket.hits.length, retryAfterSeconds: 0 };
}

/** Read-only: how many hits a key has inside its window, without
 *  registering a new one - powers the progressive captcha gate
 *  (first N submissions free, then verify). */
export function rateCount(key: string, windowMs: number): number {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket) return 0;
  return bucket.hits.filter((t) => now - t < windowMs).length;
}
