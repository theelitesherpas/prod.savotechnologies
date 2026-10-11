import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { AI_LINKS, SERVICE_LINKS, HIRE_LINKS, INDUSTRY_LINKS, WHO_WE_ARE_LINKS, HEADER_NAV, FOOTER_NAV } from "../src/constants/navigation";
import { SERVICE_DETAILS } from "../src/constants/services-detail";
import { HIRE_ROLES } from "../src/constants/hire";
import { AI_SERVICES } from "../src/constants/ai-services";
import { INDUSTRY_DOSSIERS } from "../src/content/industries/dossiers";
import { INDUSTRIES_ATLAS } from "../src/constants/industries";
import { managedHref } from "../src/lib/collections";
import { ROUTE_LOADER_SHOW_DELAY_MS, shouldArmVeil } from "../src/components/ui/route-loader";

const hrefs = (links: { href: string }[]) => links.map(l => l.href);
const legacySlugs = ["/services/mobile-apps", "/services/ui-ux", "/services/custom-software", "/ai"];

describe("Navigation connectivity contract", () => {
  const allNavLinks = HEADER_NAV.flatMap(item => item.children ?? []);
  const topLevel = HEADER_NAV.flatMap(item => item.href ? [item.href] : []);
  const featureHrefs = HEADER_NAV.flatMap(item => item.feature ? [item.feature.href] : []);
  const footerHrefs = Object.values(FOOTER_NAV).flatMap(links => links.map(l => l.href));
  const everyInternalHref = [...hrefs(allNavLinks), ...topLevel, ...featureHrefs, ...footerHrefs].filter(h => h.startsWith("/"));

  it("groups company pages under Who we are without moving the Services menu", () => {
    const company = HEADER_NAV.find(item => item.label === "Who we are");
    expect(company?.children).toEqual([
      { label: "About Us", href: "/about", desc: expect.any(String) },
      { label: "Services", href: "/services", desc: expect.any(String) },
      { label: "Enterprise", href: "/enterprise", desc: expect.any(String) },
      { label: "Contact Us", href: "/contact", desc: expect.any(String) },
    ]);
    expect(company?.children).toBe(WHO_WE_ARE_LINKS);
    expect(company?.mega).toBe(true);
    expect(company?.feature?.href).toBe("/about");
    expect(HEADER_NAV.some(item => item.label === "Enterprise")).toBe(false);
    expect(HEADER_NAV[0]).toBe(company);
    expect(HEADER_NAV[1]?.label).toBe("AI");
    expect(HEADER_NAV[2]).toMatchObject({ label: "Services", href: "/services", children: SERVICE_LINKS });
    expect(HEADER_NAV.find(item => item.label === "Contact")?.href).toBe("/contact");
  });

  it("retains all company destinations in the existing sitemap", () => {
    const sitemap = fs.readFileSync("src/app/sitemap.ts", "utf8");
    for (const { href } of WHO_WE_ARE_LINKS) expect(sitemap).toContain(`page("${href}",`);
  });

  it("uses root-relative hrefs without trailing slashes or doubled slashes", () => {
    for (const href of everyInternalHref) {
      expect(href.startsWith("/"), `${href} is root-relative`).toBe(true);
      expect(href.endsWith("/"), `${href} has a trailing slash (causes a redirect)`).toBe(false);
      expect(href.includes("//"), `${href} has doubled slashes`).toBe(false);
    }
  });

  it("never points internal menus at legacy slugs or nonexistent /ai", () => {
    for (const href of everyInternalHref) expect(legacySlugs.includes(href), `${href} is a legacy/404 destination`).toBe(false);
  });

  it("points service links at real detail routes", () => {
    const real = new Set(SERVICE_DETAILS.map(s => `/services/${s.slug}`));
    for (const href of [...hrefs(SERVICE_LINKS), ...footerHrefs.filter(h => h.startsWith("/services/"))]) expect(real.has(href), `${href} is not a service detail route`).toBe(true);
  });

  it("points industry links at real dossier routes", () => {
    const real = new Set(INDUSTRY_DOSSIERS.map(d => `/industries/${d.slug}`));
    for (const href of [...hrefs(INDUSTRY_LINKS), ...hrefs(INDUSTRIES_ATLAS), ...footerHrefs.filter(h => h.startsWith("/industries/"))]) expect(real.has(href), `${href} is not an industry route`).toBe(true);
  });

  it("points hire and AI links at real role/service routes", () => {
    const hire = new Set(HIRE_ROLES.map(r => `/hire/${r.slug}`));
    for (const href of hrefs(HIRE_LINKS)) expect(hire.has(href), `${href} is not a hire role route`).toBe(true);
    const ai = new Set(['/ai-agents', ...AI_SERVICES.map(s => `/ai/${s.slug}`)]);
    for (const href of hrefs(AI_LINKS)) expect(ai.has(href), `${href} is not an AI service route`).toBe(true);
  });

  it("resolves every static top-level and footer destination to a real app route or declared redirect", () => {
    const redirects = fs.readFileSync("next.config.ts", "utf8");
    const staticHrefs = [...topLevel, ...hrefs(allNavLinks), ...footerHrefs, "/privacy-policy", "/terms-and-conditions"].filter(h => !h.includes("#") && !h.startsWith("/services/") && !h.startsWith("/industries/") && !h.startsWith("/hire/") && !h.startsWith("/ai/"));
    for (const href of new Set(staticHrefs)) {
      const page = path.join("src/app/(site)", href, "page.tsx");
      const exists = fs.existsSync(page);
      const redirected = redirects.includes(`source: "${href}"`);
      expect(exists || redirected, `${href} has no app route and no declared redirect`).toBe(true);
    }
  });

  it("canonicalizes managed rows so menu clicks never bounce through redirects", () => {
    expect(managedHref("/services", "mobile-apps")).toBe("/services/mobile-app-development");
    expect(managedHref("/services", "ui-ux")).toBe("/services/ui-ux-design");
    expect(managedHref("/services", "custom-software")).toBe("/services/custom-software-development");
    expect(managedHref("/services", "web-development")).toBe("/services/web-development");
    expect(managedHref("/industries", "healthcare", "industry")).toBe("/industries/healthcare");
  });

  it("keeps the homepage services anchor and canonical service card links", () => {
    const source = fs.readFileSync("src/sections/home-v2/sections.tsx", "utf8");
    expect(source).toContain('<section id="services" data-home-section="services"');
    expect(source).toContain('mobile: "/services/mobile-app-development"');
    expect(source).toContain('ai: "/ai-agents"');
    expect(source).toContain('software: "/services/custom-software-development"');
    expect(source).toContain('design: "/services/ui-ux-design"');
    expect(source).not.toMatch(/href[s]?\[[a-z]+\]\s*=\s*"\/ai"|\/services\/mobile-apps|\/services\/ui-ux"|\/services\/custom-software"/);
  });

  it("anchors used by menus exist on their target pages", () => {
    const home = fs.readFileSync("src/app/(site)/page.tsx", "utf8").concat(fs.readFileSync("src/sections/home-v2/ai-capabilities.tsx", "utf8")).concat(fs.readFileSync("src/sections/home-v2/sections.tsx", "utf8"));
    expect(home).toContain('id="ai"');
    expect(home).toContain('id="services"');
    const cases = fs.readFileSync("src/app/(site)/case-studies/page.tsx", "utf8").concat(fs.readFileSync("src/sections/case-studies/portfolio-sections.tsx", "utf8"));
    expect(cases).toContain('id="work"');
    for (const href of [...featureHrefs, ...footerHrefs]) {
      const hash = href.split("#")[1];
      if (!hash) continue;
      const target = href.split("#")[0] || "/";
      const file = target === "/" ? home : target === "/case-studies" ? cases : null;
      expect(file, `no anchor check source for ${href}`).not.toBeNull();
      expect((file as string).includes(`id="${hash}"`), `${href} target anchor #${hash} missing`).toBe(true);
    }
  });
});

describe("Route loader arming rules", () => {
  it("avoids flashing on ordinary transitions and animates without per-frame React updates", () => {
    expect(ROUTE_LOADER_SHOW_DELAY_MS).toBe(600);
    const source = fs.readFileSync("src/components/ui/route-loader.tsx", "utf8");
    expect(source).toContain("clip-path ${fill >= 1 ? COMPLETE_MS : SWEEP_MS}");
    expect(source).not.toContain("backdropFilter");
    expect(source).not.toContain("elapsed / SWEEP_MS");
  });

  it("arms only for real document transitions", () => {
    const here = { pathname: "/case-studies", search: "" };
    expect(shouldArmVeil({ pathname: "/case-studies", search: "" }, here)).toBe(false);
    expect(shouldArmVeil({ pathname: "/case-studies", search: "?category=web" }, here)).toBe(false);
    expect(shouldArmVeil({ pathname: "/", search: "", hash: "#ai" } as URL & { hash?: string }, here)).toBe(true);
    expect(shouldArmVeil({ pathname: "/insights" }, here)).toBe(true);
  });

  it("never arms for same-page hash jumps from any page, including home", () => {
    const home = { pathname: "/", search: "" };
    expect(shouldArmVeil({ pathname: "/", search: "", hash: "#services" } as URL & { hash?: string }, home)).toBe(false);
    expect(shouldArmVeil({ pathname: "/services/web-development/" }, { pathname: "/services/web-development", search: "" })).toBe(false);
    expect(shouldArmVeil({ pathname: "/services/web-development" }, { pathname: "/services/web-development/", search: "" })).toBe(false);
    expect(shouldArmVeil({ pathname: "/" }, home)).toBe(false);
  });

  it("arms for trailing-slash variants only when the document differs", () => {
    expect(shouldArmVeil({ pathname: "/hire/" }, { pathname: "/hire", search: "" })).toBe(false);
    expect(shouldArmVeil({ pathname: "/careers/apply" }, { pathname: "/careers", search: "" })).toBe(true);
  });
});
