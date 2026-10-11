import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
vi.mock("next/link", () => ({ default: ({ children, ...props }: React.ComponentProps<"a">) => React.createElement("a", props, children) }));
vi.mock("next/image", () => ({ default: ({ fill, sizes, priority, unoptimized, ...props }: React.ComponentProps<"img"> & { fill?: boolean; priority?: boolean; unoptimized?: boolean }) => { void fill; void sizes; void priority; void unoptimized; return React.createElement("img", props); } }));
vi.mock("../src/lib/settings", () => ({ getSettings: async () => ({ metrics: { projectsDelivered:"", clientsSupported:"", industriesServed:"", marketsReached:"" } }) }));
vi.mock("../src/lib/content-items", () => ({ getManagedTeam: async () => [] }));
vi.mock("../src/components/shared/detail-cta", () => ({ DetailCta: ({ heading, lead }: { heading: string; lead: string }) => React.createElement("section", { "data-closing-cta": true, "data-heading": heading, "data-lead": lead }) }));
import AboutPage, { metadata, revalidate } from "../src/app/(site)/about/page";
import { ABOUT_CRAFTS, ABOUT_DISCIPLINES, ABOUT_FAQS, ABOUT_PURPOSE, ABOUT_VALUES, aboutFacts, buildAboutMetrics } from "../src/sections/about/about-content";
import { ABOUT_PREVIEW_LEADERSHIP, ABOUT_PREVIEW_MILESTONES } from "../src/sections/about/about-preview-content";
import { AboutOverview, AboutStory, AboutTeam } from "../src/sections/about/about-sections";
import { CONTENT_COLLECTIONS } from "../src/lib/content-registry";
const render = (el: React.ReactElement) => renderToStaticMarkup(el);
const emptyMetrics = { projectsDelivered:"", clientsSupported:"", industriesServed:"", marketsReached:"" };

describe("About complete company story", () => {
  it("keeps canonical, dynamic rendering, company metadata and the page marker", async () => {
    expect(metadata.alternates).toEqual({ canonical: "/about" });
    expect(revalidate).toBe(0);
    expect(metadata.description).toContain("verified identity");
    const html = render(await AboutPage());
    expect(html).toContain('data-about-page="complete-company-story"');
  });

  it("restores the whole story and team, adds purpose/culture and preserves the close", async () => {
    const html = render(await AboutPage());
    const ids = ["about-heading", "identity-heading", "story-heading", "purpose-heading", "team-heading", "values-heading", "craft-heading", "disciplines-heading", "culture-heading", "presence-heading", "questions-heading", "data-closing-cta"];
    const positions = ids.map(id => html.indexOf(id));
    expect(positions.every(position => position >= 0)).toBe(true);
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
    expect(html).toContain("One team,");
    expect(html).toContain("Bold Brands. Built by Savo.");
  });

  it("retains canonical company facts without turning demo history into identity", async () => {
    const html = render(await AboutPage());
    for (const fact of aboutFacts()) expect(html).toContain(fact.value);
    expect(html).toContain("Savo Technologies Private Limited");
    expect(html).toContain("Indore, Madhya Pradesh, India");
    expect(html).toContain("Granges-Marnand, Switzerland");
  });

  it("shows names and portraits with two named contact icons, without biographies or disclosures", async () => {
    const html = render(React.createElement(AboutTeam, { demo: true }));
    expect(ABOUT_PREVIEW_LEADERSHIP).toHaveLength(4);
    for (const person of ABOUT_PREVIEW_LEADERSHIP) {
      expect(html).toContain(person.name);
      expect(html).toContain(person.img);
      expect(html).not.toContain(person.bio);
      expect(html).toContain(`href="mailto:${person.mail}"`);
      expect(html).toContain(`href="https://www.linkedin.com/in/${person.linkedin}"`);
      expect(html).toContain(`aria-label="Email ${person.name}"`);
      expect(html).toContain(`aria-label="${person.name} on LinkedIn"`);
    }
    expect(html).toContain("not verified Savo team profiles");
    expect(html).toContain('data-demo-content="true"');
    expect(html).not.toContain("Preview profile details");
    expect(html).not.toContain("Email sample");
    expect(html).not.toContain("LinkedIn sample slug");
    expect(html).not.toContain("<details");
    expect((html.match(/rel="noopener noreferrer"/g) ?? [])).toHaveLength(8);
    expect((html.match(/<h3><a /g) ?? [])).toHaveLength(4);
  });

  it("renders published CMS profiles with portraits and approved contact links, without biographies", () => {
    const person = { name: "Alex Example", role: "Product Lead", photo: "data:image/webp;base64,AAAA", photoAlt: "Portrait of Alex Example", linkedinUrl: "https://www.linkedin.com/in/alex-example", email: "alex@example.com" };
    const html = render(React.createElement(AboutTeam, { demo: false, people: [person] }));
    for (const value of [person.name, person.role, person.photo, person.photoAlt, person.linkedinUrl, "mailto:alex@example.com"]) expect(html).toContain(value);
    expect(html).not.toContain("not verified Savo team profiles");
    expect(html).not.toContain("Meet your project team.");
    const namePosition = html.indexOf("<h3><a ");
    const linkedInPosition = html.indexOf('aria-label="Alex Example on LinkedIn"');
    const rolePosition = html.indexOf("Product Lead");
    expect(html).toMatch(/<h3><a [^>]*href="https:\/\/www.linkedin.com\/in\/alex-example"[^>]*target="_blank"[^>]*>Alex Example<\/a><\/h3>/);
    expect(namePosition).toBeGreaterThanOrEqual(0);
    expect(namePosition).toBeLessThan(linkedInPosition);
    expect(linkedInPosition).toBeLessThan(rolePosition);
  });

  it("exposes an About team collection with a required portrait crop and no fabricated seeds", () => {
    const collection = CONTENT_COLLECTIONS.team;
    expect(collection.label).toBe("About team");
    expect(collection.seeds()).toEqual([]);
    expect(collection.fields.find(field => field.name === "photo")).toMatchObject({ type: "image", required: true, altFieldRequired: true, targetWidth: 560, targetHeight: 840 });
    expect(collection.fields.some(field => field.name === "bio")).toBe(false);
    for (const field of ["name", "role", "photo", "photoAlt"]) expect(collection.newDefaults()).toHaveProperty(field);
  });

  it("retains the team section in production without publishing invented identities", () => {
    const html = render(React.createElement(AboutTeam, { demo: false }));
    expect(html).toContain('id="team"');
    expect(html).toContain("Meet your project team.");
    expect(html).toContain("profiles are approved for publication");
    for (const person of ABOUT_PREVIEW_LEADERSHIP) expect(html).not.toContain(person.name);
  });

  it("restores all six original timeline milestones with an explicit demo notice", () => {
    const html = render(React.createElement(AboutStory, { demo: true }));
    expect(ABOUT_PREVIEW_MILESTONES).toHaveLength(6);
    for (const milestone of ABOUT_PREVIEW_MILESTONES) {
      expect(html).toContain(milestone.year);
      expect(html).toContain(milestone.t);
      expect(html).toContain(milestone.d);
    }
    expect(html).toContain("not verified company history");
    const production = render(React.createElement(AboutStory, { demo: false }));
    expect(production).toContain("founded in 2015");
    expect(production).not.toContain("Jaipur");
    expect(production).not.toContain("70% of tier 1");
  });

  it("restores all metric slots with a labelled preview and production-safe pending values", () => {
    const demo = buildAboutMetrics(emptyMetrics, true);
    expect(demo.map(item => item.value)).toEqual(["120+", "45+", "12+", "8+"]);
    expect(render(React.createElement(AboutOverview, { metrics: demo, demo: true }))).toContain("not verified Savo results");
    const production = buildAboutMetrics(emptyMetrics, false);
    expect(production.every(item => item.value === "To be confirmed")).toBe(true);
    expect(buildAboutMetrics({ ...emptyMetrics, projectsDelivered:"36" }, false)[0].value).toBe("36");
  });

  it("labels editorial images and keeps the four original portraits", async () => {
    const html = render(await AboutPage());
    expect(html).toContain("/images/team.webp");
    expect(html).toContain("/images/meeting.webp");
    expect(html).toContain("Editorial workplace photography - not the Savo team or office.");
    expect(html).toContain("Editorial collaboration image - not the Savo team or office.");
    expect((html.match(/src="\/images\/team\//g) ?? [])).toHaveLength(4);
  });

  it("keeps every original value and craft visible, not hidden behind selection", async () => {
    const html = render(await AboutPage());
    expect(ABOUT_VALUES).toHaveLength(6);
    for (const value of ABOUT_VALUES) expect(html).toContain(value.d);
    for (const craft of ABOUT_CRAFTS) expect(html).toContain(craft.v);
    for (const purpose of ABOUT_PURPOSE) expect(html).toContain(purpose.statement);
    expect(html).not.toContain('type="radio"');
  });

  it("links all ten specialist disciplines to canonical destinations", async () => {
    expect(ABOUT_DISCIPLINES).toHaveLength(10);
    const real = new Set(["/services", "/ai-agents", "/enterprise", "/services/ui-ux-design", "/services/web-development", "/services/custom-software-development", "/services/mobile-app-development", "/services/cloud-devops", "/services/qa-testing", "/services/digital-marketing"]);
    const html = render(await AboutPage());
    for (const discipline of ABOUT_DISCIPLINES) {
      expect(real.has(discipline.href)).toBe(true);
      expect(html).toContain(`href="${discipline.href}"`);
    }
  });

  it("restores verified regions while separating market presence from physical offices", async () => {
    const html = render(await AboutPage());
    for (const value of ["139 PU4", "Rue de la Fruiterie 13", "Dubai &amp; GCC", "United States", "tel:+917502901234", "tel:+41764082872", "tel:+971509741305"]) expect(html).toContain(value);
    expect(html).toContain("not an office claim");
  });

  it("keeps FAQ/schema parity and excludes demo claims from structured data", async () => {
    const html = render(await AboutPage());
    const graph = JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/)![1])["@graph"];
    expect(graph.map((node: { "@type": string }) => node["@type"])).toEqual(["AboutPage", "BreadcrumbList", "FAQPage"]);
    expect(graph[2].mainEntity.map((q: { name: string }) => q.name)).toEqual(ABOUT_FAQS.map(item => item.q));
    const structured = JSON.stringify(graph);
    for (const person of ABOUT_PREVIEW_LEADERSHIP) expect(structured).not.toContain(person.name);
    expect(structured).not.toContain("120+");
    expect(structured).not.toContain("Jaipur");
  });

  it("preserves native disclosures, enquiry attribution, Careers and pinned navigation", async () => {
    const html = render(await AboutPage());
    expect((html.match(/<details/g) ?? [])).toHaveLength(6);
    expect(html).toContain('href="/careers"');
    expect(readFileSync("src/app/(site)/about/page.tsx", "utf8")).toContain('location="about-cta"');
    expect(readFileSync("src/components/layout/site-header.tsx", "utf8")).toContain("/^\\/about\\/?$/.test(pathname)");
  });

  it("inherits the Enterprise type/rail/palette, with responsive photography and reduced motion", () => {
    const css = readFileSync("src/sections/about/about.module.css", "utf8");
    for (const value of ["#df2525", "1280px,calc(100% - 64px)", "width:calc(100% - 40px)", "clamp(2.4rem,4.7vw,4.2rem)", "prefers-reduced-motion:reduce", "animation:none"]) expect(css).toContain(value);
    expect(css).not.toMatch(/infinite|linear-gradient/);
    expect(css).not.toContain(".heroFigure { display:none");
  });
});
