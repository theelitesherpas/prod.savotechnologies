import { describe, expect, it } from "vitest";
import { HEADER_NAV, type NavItem } from "@/constants/navigation";
import { activeNavigationLabel } from "@/lib/navigation-active";

describe("Header route ownership", () => {
  it.each([
    ["/", null],
    ["/about", "Who We Are"],
    ["/enterprise", "Who We Are"],
    ["/services", "Services"],
    ["/services/web-development", "Services"],
    ["/services/mobile-app-development/", "Services"],
    ["/contact", "Contact"],
    ["/contact?topic=project#send", "Contact"],
    ["/case-studies", "Case Studies"],
    ["/case-studies/client-project", "Case Studies"],
    ["/insights/article", "Insights"],
    ["/ai/generative-ai", "AI"],
    ["/ai-agents/salesbot", "AI"],
    ["/hire/frontend-developers", "Hire Developers"],
    ["/industries/healthcare", "Industries"],
    ["/careers/apply", "Careers"],
    ["/services-other", null],
    ["/privacy-policy", null],
  ])("assigns %s to %s", (path, owner) => {
    expect(activeNavigationLabel(path, HEADER_NAV)).toBe(owner);
  });

  it("prefers the most specific dedicated route regardless of order", () => {
    const items: NavItem[] = [{ label: "Home", href: "/" }, { label: "Services", href: "/services" }, { label: "Web", href: "/services/web" }];
    expect(activeNavigationLabel("/services/web/example", items)).toBe("Web");
    expect(activeNavigationLabel("/unknown", items)).toBeNull();
  });
});
