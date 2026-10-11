import { beforeEach, describe, expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({ study: vi.fn(), resolve: vi.fn() }));
vi.mock("@/lib/case-studies", () => ({ getCaseStudy: m.study }));
vi.mock("@/lib/case-study-schema", () => ({ resolveCaseImages: m.resolve }));

import { GET } from "@/app/api/cs-img/route";

const request = (_src: string) => { void _src; return new Request("https://example.test/api/cs-img?s=test-case&k=showcase&v=fixture"); };

beforeEach(() => {
  vi.clearAllMocks();
  m.study.mockResolvedValue({ slug: "test-case", gallery: [] });
  m.resolve.mockReturnValue({ showcase: { dataUrl: "" } });
});

describe("case-study image delivery", () => {
  it("serves a signature-checked passive raster with immutable cache headers", async () => {
    const png = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 0]);
    m.resolve.mockReturnValue({ showcase: { dataUrl: `data:image/png;base64,${png.toString("base64")}` } });
    const response = await GET(request(""));
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/png");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(response.headers.get("cache-control")).toContain("immutable");
    expect(Buffer.from(await response.arrayBuffer())).toEqual(png);
  });

  it("rejects active SVG data and raster-mime payloads without a matching file signature", async () => {
    const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
    m.resolve.mockReturnValue({ showcase: { dataUrl: `data:image/svg+xml;base64,${svg.toString("base64")}` } });
    expect((await GET(request(""))).status).toBe(404);

    m.resolve.mockReturnValue({ showcase: { dataUrl: `data:image/png;base64,${svg.toString("base64")}` } });
    expect((await GET(request(""))).status).toBe(404);
  });

  it("rejects malformed/non-canonical base64 before returning bytes", async () => {
    m.resolve.mockReturnValue({ showcase: { dataUrl: "data:image/png;base64,not_base64!" } });
    expect((await GET(request(""))).status).toBe(404);
  });
});
