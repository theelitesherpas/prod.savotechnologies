import { describe, expect, it } from "vitest";
import { HIRE_ROLES } from "../src/constants/hire";
import { CONTENT_COLLECTIONS } from "../src/lib/content-registry";

describe("managed hiring role defaults", () => {
  it("includes the requested roles in the admin import defaults", () => {
    const slugs = CONTENT_COLLECTIONS.hire.seeds().map((role) => role.slug);
    expect(slugs).toEqual(expect.arrayContaining([
      "hr-intern",
      "ai-ml-engineer-intern",
      "business-development-executive",
    ]));
  });

  it("provides substantive, role-specific responsibilities and skills", () => {
    for (const slug of ["ai-ml-engineer-intern", "business-development-executive"]) {
      const role = HIRE_ROLES.find((item) => item.slug === slug);
      expect(role).toBeDefined();
      expect(role!.engagements.length).toBeGreaterThanOrEqual(4);
      expect(role!.skills.length).toBeGreaterThanOrEqual(4);
      expect(role!.metaDescription.length).toBeGreaterThan(80);
    }
    const businessDevelopment = HIRE_ROLES.find((item) => item.slug === "business-development-executive")!;
    expect(businessDevelopment.engagements.map((item) => item.text).join(" ")).toMatch(/Upwork/);
    expect(businessDevelopment.engagements.map((item) => item.text).join(" ")).toMatch(/cold-call/);
  });
});
