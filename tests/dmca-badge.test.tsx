import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import config from "../next.config";

vi.mock("../src/components/shared/callback-form", () => ({ CallbackForm: () => null }));
import { SiteFooter } from "../src/components/layout/site-footer";

const id = "2223fed3-a5cc-497c-82bb-c20de7ce5720";
const html = () => renderToStaticMarkup(<SiteFooter contact={{ email: "hello@example.test", phone: "+91 0000000000", phoneE164: "+910000000000" }} />);

describe("Owner-supplied DMCA footer badge", () => {
  it("renders exactly one official status link with the supplied registration ID", () => {
    const markup = html();
    expect(markup.match(/class="dmca-badge /g)).toHaveLength(1);
    expect(markup).toContain(`href="https://www.dmca.com/Protection/Status.aspx?ID=${id}"`);
    expect(markup).toContain(`src="https://images.dmca.com/Badges/dmca_protected_sml_120m.png?ID=${id}"`);
    expect(markup).toContain('alt="DMCA.com Protection Status"');
    expect(markup).toMatch(/<img[^>]+width="121" height="24" loading="lazy" decoding="async"/);
    expect(markup).not.toContain("/_next/image");
  });

  it("opens status safely without sending the visitor URL or executing third-party helpers", () => {
    const markup = html();
    expect(markup).toMatch(/class="dmca-badge [^"]+" target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer"/);
    expect(markup.match(/referrerPolicy="no-referrer"/g)).toHaveLength(2);
    expect(markup).not.toMatch(/DMCABadgeHelper|refurl|<script/);
    expect(readFileSync("src/components/layout/site-footer.tsx", "utf8")).not.toContain("DMCABadgeHelper");
  });

  it("allows only the image host, not external DMCA scripts or connections", async () => {
    const headers = await config.headers!();
    const policy = headers[0].headers.find(header => header.key === "Content-Security-Policy")!.value;
    const directives = Object.fromEntries(policy.split("; ").map(value => { const [name, ...hosts] = value.split(" "); return [name, hosts]; }));
    expect(directives["img-src"]).toContain("https://images.dmca.com");
    for (const name of ["script-src", "connect-src", "frame-src"]) {
      expect(directives[name].join(" ")).not.toContain("dmca.com");
    }
    expect(directives["object-src"]).toEqual(["'none'"]);
    expect(directives["frame-ancestors"]).toEqual(["'none'"]);
  });

  it("retains contacts, legal navigation and reachable badge geometry without verification changes", () => {
    const markup = html();
    expect(markup).toContain('href="mailto:hello@example.test"');
    expect(markup).toContain('href="tel:+910000000000"');
    for (const path of ["/privacy-policy", "/terms-and-conditions"]) expect(markup).toContain(`href="${path}"`);
    const css = readFileSync("src/components/layout/site-footer.module.css", "utf8");
    expect(css).toContain(".legal a { display: inline-flex; min-height: 44px;");
    expect(css).toContain(".dmcaBadge img { display: block; width: 121px; height: 24px; }");
    expect(existsSync("public/dmca-validation.html")).toBe(false);
    expect(readFileSync("src/app/layout.tsx", "utf8")).not.toContain("dmca-site-verification");
  });
});
