import * as React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("next/navigation", () => ({ notFound: () => { throw new Error("NOT_FOUND"); } }));
vi.mock("@/components/mail/email-design-review", () => ({ EmailDesignReview: () => null }));
import EmailPreviewPage, { metadata } from "@/app/email-preview/page";
import { TEMPLATE_REGISTRY } from "@/lib/mail/registry";

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
describe("local-only sample email review", () => {
  it("renders all samples in development without using private records", () => {
    vi.stubGlobal("React", React);
    vi.stubEnv("NODE_ENV", "development");
    const result = EmailPreviewPage();
    expect(result.props.previews).toHaveLength(TEMPLATE_REGISTRY.length);
    expect(result.props.previews.every((p: { html: string }) => p.html.includes("Savo v7 correspondence"))).toBe(true);
  });
  it("returns notFound in production, regardless of content mode", () => {
    vi.stubEnv("NODE_ENV", "production");
    for (const mode of ["demo", "production"]) {
      vi.stubEnv("NEXT_PUBLIC_CONTENT_MODE", mode);
      expect(() => EmailPreviewPage()).toThrow("NOT_FOUND");
    }
  });
  it("stays noindex and contains no send/save control", () => {
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });
});
