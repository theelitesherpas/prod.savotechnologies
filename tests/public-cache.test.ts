import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({
  unstableCache: vi.fn((loader: () => Promise<unknown>) => loader),
}));
vi.mock("next/cache", () => ({ unstable_cache: m.unstableCache }));

import { cachePublicData, PUBLIC_CONTENT_CACHE_SECONDS, PUBLIC_CONTENT_CACHE_TAG } from "../src/lib/public-cache";

afterEach(() => vi.unstubAllEnvs());
beforeEach(() => vi.clearAllMocks());

describe("public data cache policy", () => {
  it("uses a bounded, tagged Next data cache outside unit tests", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const loader = vi.fn(async () => ["public fixture"]);
    const read = cachePublicData("fixture", loader, ["fixture-collection"]);

    await expect(read()).resolves.toEqual(["public fixture"]);
    expect(m.unstableCache).toHaveBeenCalledWith(loader, ["savo-public-v1:fixture"], {
      revalidate: PUBLIC_CONTENT_CACHE_SECONDS,
      tags: [PUBLIC_CONTENT_CACHE_TAG, "fixture-collection"],
    });
  });

  it("expires managed-content caches while case-study writes invalidate affected routes", () => {
    const collections = readFileSync("src/lib/collections.ts", "utf8");
    const cases = readFileSync("src/app/admin/(protected)/case-studies/actions.ts", "utf8");
    expect(collections).toContain('revalidateTag("public-managed-content", { expire: 0 })');
    expect(collections).toContain('revalidateTag("public-site-chrome", { expire: 0 })');
    expect(cases).toContain('revalidatePath("/", "layout")');
    expect(cases).not.toContain("revalidateTag(");
  });

  it("keeps unit tests independent from Next's request cache context", async () => {
    vi.stubEnv("NODE_ENV", "test");
    const loader = vi.fn(async () => "test-only");
    await expect(cachePublicData("test", loader)()).resolves.toBe("test-only");
    expect(m.unstableCache).not.toHaveBeenCalled();
    expect(loader).toHaveBeenCalledOnce();
  });
});
