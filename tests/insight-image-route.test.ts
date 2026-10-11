import { beforeEach, describe, expect, it, vi } from "vitest";
const { readFile } = vi.hoisted(() => ({ readFile: vi.fn() }));
vi.mock("node:fs/promises", () => ({ readFile }));
import { GET as getLegacyImage } from "../src/app/api/insight-image/route";
import { GET as getImageByHash } from "../src/app/api/insight-image/[hash]/route";

describe("content-addressed Insights image delivery", () => {
  beforeEach(() => readFile.mockReset());

  it("rejects malformed image hashes without touching disk", async () => {
    const response = await getImageByHash(new Request("http://localhost/api/insight-image/bad"), { params: Promise.resolve({ hash: "bad" }) });
    expect(response.status).toBe(404);
    expect(readFile).not.toHaveBeenCalled();
  });

  it("serves optimized WebP assets with immutable caching", async () => {
    readFile.mockResolvedValue(Buffer.from("compressed-webp"));
    const hash = "a".repeat(64);
    const response = await getImageByHash(new Request(`http://localhost/api/insight-image/${hash}`), { params: Promise.resolve({ hash }) });
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/webp");
    expect(response.headers.get("cache-control")).toContain("immutable");
    expect(await response.text()).toBe("compressed-webp");
    expect(readFile).toHaveBeenCalledWith(expect.stringContaining(`${hash}.webp`));
  });

  it("continues serving legacy query URLs for existing admin image previews", async () => {
    readFile.mockResolvedValue(Buffer.from("compressed-webp"));
    const hash = "b".repeat(64);
    const response = await getLegacyImage(new Request(`http://localhost/api/insight-image?v=${hash}`));
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/webp");
  });
});
