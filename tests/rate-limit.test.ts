import { describe, expect, it } from "vitest";
import { rateLimit } from "@/lib/rate-limit";

describe("rateLimit", () => {
  it("allows requests under the limit and reports remaining", () => {
    const key = `t-${Math.random()}`;
    const r = rateLimit(key, 3, 60_000);
    expect(r.ok).toBe(true);
    expect(r.remaining).toBe(2);
  });

  it("blocks the request that exceeds the limit", () => {
    const key = `t-${Math.random()}`;
    for (let i = 0; i < 3; i++) rateLimit(key, 3, 60_000);
    const r = rateLimit(key, 3, 60_000);
    expect(r.ok).toBe(false);
    expect(r.retryAfterSeconds).toBeGreaterThan(0);
    expect(r.retryAfterSeconds).toBeLessThanOrEqual(60);
  });

  it("isolates buckets by key", () => {
    const a = `a-${Math.random()}`;
    const b = `b-${Math.random()}`;
    for (let i = 0; i < 2; i++) rateLimit(a, 2, 60_000);
    expect(rateLimit(a, 2, 60_000).ok).toBe(false);
    expect(rateLimit(b, 2, 60_000).ok).toBe(true);
  });
});
