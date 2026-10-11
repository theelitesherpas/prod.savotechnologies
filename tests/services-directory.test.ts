import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { SERVICE_DETAILS } from "../src/constants/services-detail";
vi.mock("next/link", () => ({ default: ({ children, ...props }: React.ComponentProps<"a">) => React.createElement("a", props, children) }));
vi.mock("../src/components/shared/detail-cta", () => ({ DetailCta: ({ heading, lead, location, secondaryHref }: { heading: string; lead: string; location: string; secondaryHref: string }) => React.createElement("section", { "data-cta-source": location }, React.createElement("h2", null, heading), React.createElement("p", null, lead), React.createElement("a", { href: secondaryHref }, "Explore Industries")) }));
import ServicesPage, { metadata } from "../src/app/(site)/services/page";
import { ServicesShowcase } from "../src/sections/services/services-showcase";
const render = () => renderToStaticMarkup(React.createElement(ServicesPage));

describe("Homepage-aligned Services directory", () => {
  it("preserves every canonical service, description, and original stack preview", () => {
    const html = render();
    for (const service of SERVICE_DETAILS) {
      expect(html).toContain(`aria-label="Explore ${service.title.replaceAll("&", "&amp;")}"`);
      expect(html).toContain(`href="/services/${service.slug}"`);
      expect(html).toContain(service.heroLead.replaceAll("&", "&amp;").replaceAll("'", "&#x27;"));
      for (const item of service.stack.slice(0, 5)) expect(html).toContain(item.replaceAll("&", "&amp;"));
    }
    expect((html.match(/<a[^>]*aria-label="Explore [^"]+"/g) ?? [])).toHaveLength(10);
    expect(html).toContain('id="directory"');
    expect(html).toContain("Scoped in stages. Shipped in slices.");
    expect(html).toContain("Web platforms to AI agents");
    expect(html).toContain("Doodles from the studio, drawn the way we build, by hand");
  });
  it("retains canonical metadata, the complete structured service list and the enquiry close", () => {
    const html = render();
    expect(metadata.alternates).toEqual({ canonical: "/services" });
    const graph = JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/)![1])["@graph"];
    expect(graph.find((node: { "@type": string }) => node["@type"] === "ItemList").itemListElement.map((item: { name: string }) => item.name)).toEqual(SERVICE_DETAILS.map(s => s.title));
    expect(html).toContain('data-cta-source="services-cta"');
    expect(html).toContain("Not sure which service you need?");
    expect(html).toContain('href="/industries"');
  });
  it("offers three manual service concepts and a genuine default destination without JavaScript", () => {
    const html = renderToStaticMarkup(React.createElement(ServicesShowcase));
    expect(html).toContain('aria-label="Explore service concepts"');
    expect((html.match(/aria-pressed=/g) ?? [])).toHaveLength(3);
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain("Web platforms");
    expect(html).toContain("Mobile apps");
    expect(html).toContain("AI workflows");
    expect(html).toContain("Interface concept");
    expect(html).toContain('href="/services/web-development"');
  });
  it("scopes the homepage palette, responsive layout and motion without touching detail styles", () => {
    const css = readFileSync("src/sections/services/services-directory.module.css", "utf8");
    expect(css).toContain("--background: #fff");
    expect(css).toContain("--accent: #df2525");
    expect(css).toContain("font-family: var(--font-serif)");
    expect(css).toContain("font-family: var(--font-sans)");
    expect(css).toContain("grid-template-columns: repeat(2, minmax(0, 1fr))");
    expect(css).toContain("prefers-reduced-motion: reduce");
    expect(css).not.toMatch(/linear-gradient|backdrop-filter|infinite/);
    expect(readFileSync("src/sections/services/services-directory.tsx", "utf8")).not.toContain("SectionHeader");
    const header = readFileSync("src/components/layout/site-header.tsx", "utf8");
    expect(header).toContain('const isPinnedPage = /^\\/services\\/?$/.test(pathname) || isServiceDetail');
    expect(header).toContain('href="/start-a-project"');
    expect(header).not.toContain('if (isHome) openProject({ source }); else openEnquiry(source);');
  });
});
