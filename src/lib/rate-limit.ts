/** Process-local sliding windows. NOT a distributed/ingress abuse defence. */
type Bucket = { hits: number[]; windowMs: number };
export const RATE_LIMIT_CAPACITY = 5_000;
const MAX_HITS = 1_000;
const MAX_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
const globalForRate = globalThis as unknown as {
  __savoRateLimiterV2?: { buckets: Map<string, Bucket>; nextSweep: number };
};
const state = globalForRate.__savoRateLimiterV2 ?? { buckets: new Map<string, Bucket>(), nextSweep: 0 };
globalForRate.__savoRateLimiterV2 = state;

export type RateLimitResult = { ok: boolean; remaining: number; retryAfterSeconds: number };
const denied = (retryAfterSeconds = 1): RateLimitResult => ({ ok: false, remaining: 0, retryAfterSeconds });
const validKey = (key: string) => typeof key === "string" && key.length > 0 && key.length <= 512;
const validWindow = (windowMs: number) => Number.isSafeInteger(windowMs) && windowMs > 0 && windowMs <= MAX_WINDOW_MS;

function prune(bucket: Bucket, now: number): void {
  bucket.hits = bucket.hits.filter(t => now - t < bucket.windowMs);
}

function sweep(now: number): void {
  if (now < state.nextSweep) return;
  state.nextSweep = now + 1_000;
  for (const [key, bucket] of state.buckets) {
    prune(bucket, now); // each bucket's own window, not the incoming request's
    if (!bucket.hits.length) state.buckets.delete(key);
  }
}

export function rateLimit(key: string, limit = 5, windowMs = 60 * 60 * 1000): RateLimitResult {
  if (!validKey(key) || !validWindow(windowMs) || !Number.isSafeInteger(limit) || limit < 1 || limit > MAX_HITS) return denied();
  const now = Date.now();
  let bucket = state.buckets.get(key);
  if (bucket) {
    // Policy is internal, not request-controlled. Fail closed on conflicting policies.
    if (bucket.windowMs !== windowMs) return denied();
    prune(bucket, now);
  } else {
    if (state.buckets.size >= RATE_LIMIT_CAPACITY) sweep(now);
    // Do not evict active authentication buckets (that would reset their protection).
    if (state.buckets.size >= RATE_LIMIT_CAPACITY) return denied();
    bucket = { hits: [], windowMs };
    state.buckets.set(key, bucket);
  }
  if (bucket.hits.length >= limit) {
    return denied(Math.max(1, Math.ceil((bucket.hits[0] + windowMs - now) / 1_000)));
  }
  bucket.hits.push(now);
  return { ok: true, remaining: limit - bucket.hits.length, retryAfterSeconds: 0 };
}

/** Read without recording; saturation fails closed for progressive CAPTCHA gates. */
export function rateCount(key: string, windowMs: number): number {
  if (!validKey(key) || !validWindow(windowMs)) return MAX_HITS;
  const now = Date.now();
  const bucket = state.buckets.get(key);
  if (!bucket) {
    if (state.buckets.size >= RATE_LIMIT_CAPACITY) sweep(now);
    return state.buckets.size >= RATE_LIMIT_CAPACITY ? MAX_HITS : 0;
  }
  if (bucket.windowMs !== windowMs) return MAX_HITS;
  prune(bucket, now);
  if (!bucket.hits.length) state.buckets.delete(key);
  return bucket.hits.length;
}

/** Explicit reset of ONE trusted application key, e.g. after successful login. */
export function clearRateLimit(key: string): void {
  state.buckets.delete(key);
}
