import { describe, expect, it, vi } from "vitest";
const redirect = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({ permanentRedirect: redirect }));
import LegacyStartPage from "../src/app/(site)/start/page";
import { FOOTER_NAV } from "../src/constants/navigation";
import { readFileSync } from "node:fs";

describe("Start a Project canonical route migration", () => {
  it("permanently redirects legacy /start while preserving and encoding project/campaign query data", async () => {
    redirect.mockClear();
    await LegacyStartPage({ searchParams: Promise.resolve({ type: "AI Automation", utm_source: "homepage", repeated: ["one", "two"], absent: undefined }) });
    expect(redirect).toHaveBeenCalledWith("/start-a-project?type=AI+Automation&utm_source=homepage&repeated=one&repeated=two");
  });
  it("redirects bare /start to the new pathname", async () => {
    redirect.mockClear();
    await LegacyStartPage({ searchParams: Promise.resolve({}) });
    expect(redirect).toHaveBeenCalledWith("/start-a-project");
  });
  it("points the primary desktop header, mobile menu, mega-menu action, footer navigation and other internal CTAs to the canonical page", () => {
    const header = readFileSync("src/components/layout/site-header.tsx", "utf8");
    const panels = readFileSync("src/components/layout/nav-panels.tsx", "utf8");
    expect(header).toContain('href="/start-a-project" onClick={() => navigateToProject("header")}');
    expect(header).toContain('<Link href="/start-a-project" onClick={() => navigateToProject("mobile-menu")}>');
    expect(panels).toContain('href="/start-a-project" onClick={onProject}');
    expect(FOOTER_NAV.quick.find(item => item.label === "Get a Quote")?.href).toBe("/start-a-project");
    for (const file of ["src/lib/assistant.ts", "src/components/shared/project-lead-modal.tsx", "src/components/agents/salesbot-demo.tsx", "src/sections/indore/indore-sections.tsx", "src/sections/switzerland/swiss-sections.tsx", "src/sections/ai/automation-practice.tsx", "src/app/sitemap.ts", "src/app/llms.txt/route.ts"]) {
      const source = readFileSync(file, "utf8");
      expect(source, file).not.toMatch(/(?:href=|href:\s*|canonical:\s*|url:\s*|absoluteUrl\()\s*["'`]\/start(?:["'`/]|\?)/);
    }
  });
  it("routes the menu CTA to the page, not the homepage popup or enquiry side drawer, without altering popup eligibility on the landing page", () => {
    const header = readFileSync("src/components/layout/site-header.tsx", "utf8");
    expect(header).not.toContain('if (isHome) openProject({ source }); else openEnquiry(source);');
    expect(header).not.toContain('const { open: openProject } = useProjectModal();');
    const provider = readFileSync("src/components/shared/project-lead-modal.tsx", "utf8");
    expect(provider).toContain('withBasePath("/start-a-project")');
    expect(provider).toContain('if (forced) {');
    expect(provider).toContain('const timer = setTimeout(() => fire("auto"), 20_000);');
    expect(provider).toContain('window.location.pathname.replace(/\\/+$/, "") || "/"');
    expect(provider).toContain('taskPath === withBasePath("/start-a-project")');
    expect(provider).not.toContain('withBasePath("/") return;');
  });
});
