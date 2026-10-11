import { describe, expect, it } from "vitest";
import { isAutomaticProjectLeadModalExcludedPath } from "@/lib/lead-modal-routes";

describe("automatic project lead modal route exclusions", () => {
  it("excludes About, Contact, and all Careers pages with or without trailing slashes", () => {
    for (const path of [
      "/about", "/about/", "/contact", "/contact/",
      "/careers", "/careers/", "/careers/apply", "/careers/apply/",
    ]) expect(isAutomaticProjectLeadModalExcludedPath(path)).toBe(true);
  });

  it("does not exclude neighboring routes or the rest of the site", () => {
    for (const path of ["/", "/services", "/start-a-project", "/about-us", "/career", "/careers-old"]) {
      expect(isAutomaticProjectLeadModalExcludedPath(path)).toBe(false);
    }
  });
});
