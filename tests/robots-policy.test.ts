import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env", () => ({ absoluteUrl: (path: string) => `https://example.test${path}`, INDEXABLE: true }));
vi.mock("@/lib/content-mode", () => ({ IS_DEMO: false }));

import robots from "@/app/robots";

describe("production crawler exclusions", () => {
  it("keeps private/token-bearing and unpublished preview paths out of general and AI crawler rules", () => {
    const result = robots();
    expect(result.sitemap).toBe("https://example.test/sitemap.xml");
    expect(Array.isArray(result.rules)).toBe(true);
    if (!Array.isArray(result.rules)) return;
    expect(result.rules).toHaveLength(2);
    const expected = ["/api/", "/admin", "/portal", "/employee-portal", "/meeting/", "/unsubscribe", "/case-studies/preview/", "/insights/preview/"];
    for (const rule of result.rules) {
      for (const path of expected) expect(rule.disallow).toContain(path);
    }
  });
});
