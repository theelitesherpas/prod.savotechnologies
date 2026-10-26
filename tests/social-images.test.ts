import { afterEach, describe, expect, it, vi } from "vitest";
import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { SOCIAL_IMAGES, type SocialImageKey } from "@/constants/social-images";
import { ownerSocialImage, providedSocialImageFor } from "@/lib/social-images";
import { openGraphFor } from "@/lib/seo";

const routes: [string, SocialImageKey][] = [
  ["/", "home"], ["/about", "about"], ["/ai-agents", "ai"],
  ["/careers", "careers"], ["/case-studies", "caseStudies"], ["/contact", "contact"],
  ["/enterprise", "enterprise"], ["/hire", "hire"], ["/industries", "industries"],
  ["/employee-portal", "employeePortal"], ["/portal", "clientPortal"],
  ["/insights", "insights"], ["/meeting/example-token", "meeting"],
  ["/services/mobile-app-development", "mobile"], ["/services/ui-ux-design", "design"],
  ["/services", "services"], ["/start-a-project", "start"], ["/services/web-development", "web"],
];
afterEach(() => { vi.unstubAllEnvs(); vi.resetModules(); });

describe("owner-supplied social images", () => {
  it.each(routes)("maps %s to its named owner artwork", (path, image) => {
    expect(providedSocialImageFor(path)).toEqual(ownerSocialImage(image));
    const metadata = openGraphFor({ title: "Page title", description: "Page description", url: path });
    expect(metadata.images).toEqual([ownerSocialImage(image)]);
    expect(metadata.title).toBe("Page title"); expect(metadata.description).toBe("Page description");
  });
  it("uses every one of the eighteen supplied cards", () => {
    expect(Object.keys(SOCIAL_IMAGES)).toHaveLength(18);
    expect(new Set(routes.map(([, key]) => key)).size).toBe(18);
    expect(new Set(Object.values(SOCIAL_IMAGES).map(card => card.file)).size).toBe(18);
  });
  it.each([
    ["/ai/automation", "ai"], ["/ai-agents/supportagent", "ai"],
    ["/services/ai-agent-development", "ai"], ["/hire/backend-developers", "hire"],
    ["/services/cloud-devops", "services"], ["/careers/apply?role=hr-intern", "careers"],
    ["/industries/healthcare", "industries"], ["/insights/example-article", "insights"],
    ["/case-studies/example-project", "caseStudies"], ["/services/mobile-apps", "mobile"],
    ["/services/ui-ux", "design"], ["/start", "start"],
    ["/employee-portal/dashboard", "employeePortal"], ["/portal/dashboard", "clientPortal"],
  ] as [string, SocialImageKey][])("inherits the correct section image on %s", (path, key) => {
    expect(providedSocialImageFor(path)).toEqual(ownerSocialImage(key));
  });
  it("normalizes canonical URLs, trailing slashes and queries without misclassifying prefixes", () => {
    expect(providedSocialImageFor("https://savotechnologies.com/services/web-development/?x=1#details")).toEqual(ownerSocialImage("web"));
    for (const path of ["/ai-extra", "/careers-old", "/services-extra", "/employee-portal-old", "/portal-extra", "https://unrelated.invalid/services", "javascript:alert(1)"]) expect(providedSocialImageFor(path)).toBeUndefined();
  });
  it("never embeds invitation tokens or personal query parameters in the image URL", () => {
    const image = providedSocialImageFor("/meeting/SECRET-BEARER-TOKEN?client=Private%20Client&email=private@example.invalid");
    expect(image).toEqual(ownerSocialImage("meeting")); expect(JSON.stringify(image)).not.toMatch(/SECRET|Private|private@/);
  });
  it("matches original PNG hashes, dimensions and provenance without inventing a 1200px crop", () => {
    expect(readdirSync("public/images/og").filter(file => file.endsWith(".png"))).toHaveLength(18);
    for (const card of Object.values(SOCIAL_IMAGES)) {
      const bytes = readFileSync(`public/images/og/${card.file}`);
      expect(bytes.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
      expect(createHash("sha256").update(bytes).digest("hex")).toBe(card.sha256);
      expect(bytes.readUInt32BE(16)).toBe(card.width); expect(bytes.readUInt32BE(20)).toBe(card.height);
      expect(bytes.length).toBeLessThan(5 * 1024 * 1024);
      expect(JSON.parse(readFileSync(`public/images/og/${card.file}.json`, "utf8"))).toMatchObject({ provenance: "owner-supplied", sha256: card.sha256, width: card.width, height: card.height });
    }
  });
  it("uses content-versioned PNG URLs and useful artwork alt text", () => {
    for (const key of Object.keys(SOCIAL_IMAGES) as SocialImageKey[]) {
      const image = ownerSocialImage(key), url = new URL(image.url, "https://savotechnologies.com");
      expect(url.pathname).toBe(`/images/og/${SOCIAL_IMAGES[key].file}`);
      expect(url.searchParams.get("v")).toBe(SOCIAL_IMAGES[key].sha256.slice(0, 12));
      expect(image.type).toBe("image/png"); expect(image.alt).toContain("Savo Technologies");
    }
  });
  it("supports sub-path deployments without doubling the asset prefix", async () => {
    vi.stubEnv("NEXT_PUBLIC_BASE_PATH", "/preview"); vi.resetModules();
    const helper = await import("@/lib/social-images");
    expect(helper.providedSocialImageFor("/preview/careers")?.url).toContain("/preview/images/og/savo-og-careers.png?v=");
    expect(helper.providedSocialImageFor("/careers")?.url).toBe(helper.providedSocialImageFor("/preview/careers")?.url);
  });
});
