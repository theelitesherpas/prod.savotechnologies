import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import fs from "node:fs";
vi.mock("next/link", () => ({ default: ({ children, ...props }: React.ComponentProps<"a">) => React.createElement("a", props, children) }));
vi.mock("../src/components/shared/start-project-button", () => ({ StartProjectButton: ({ label = "Start a Similar Project", source }: { label?: string; source?: string }) => React.createElement("button", { "data-source": source }, label) }));
vi.mock("../src/components/shared/detail-cta", () => ({ DetailCta: () => React.createElement("section", { "data-closing-cta": true }, "Enquiry") }));
vi.mock("../src/components/ui/track-view", () => ({ TrackView: ({ children }: { children: React.ReactNode }) => children }));
import { caseStudySchema, CASE_IMAGE_SLOTS } from "../src/lib/case-study-schema";
import { ProjectStory } from "../src/sections/case-studies/project-story";
import { ProjectGallery } from "../src/sections/case-studies/project-gallery";
import { projectLogoFor } from "../src/sections/case-studies/project-branding";
import { NotableFeatures } from "../src/sections/case-studies/project-detail-sections";
import { PREVIEW_PROJECTS } from "../src/sections/case-studies/preview-projects";
import { projectGalleryVisuals, safeProjectLiveHref } from "../src/sections/case-studies/portfolio-content";
import portfolio from "../src/sections/case-studies/portfolio.module.css";
import detailStyles from "../src/sections/case-studies/project-details.module.css";
import heroStyles from "../src/sections/case-studies/project-hero.module.css";
const render = (component: React.ReactElement) => renderToStaticMarkup(component);
const concept = PREVIEW_PROJECTS.find(p => p.slug === "aster-health")!;
const image = { dataUrl: "data:image/png;base64,YWJj", width: 1440, height: 900, alt: "Supplied image" };
const record = () => ({ ...caseStudySchema.parse({ title: "Test-only project", discipline: "web", summary: "Test-only renderer fixture. Not client work.", challenge: "Test-only supplied challenge", solution: "Test-only supplied solution", technologies: ["TypeScript", "PostgreSQL"] }), slug: "test-only-detail" });
describe("Concise visual case-study detail", () => {
  it("keeps the title and red industry but omits the separate logo and service scope", () => {
    const study = { ...record(), slug: "the-fresh-art-club", displayClientName: "The Fresh Art Club", industry: "Contemporary Art · Arts & Culture · Digital Platform", services: ["Corporate Websites", "Web Applications"] };
    const html = render(React.createElement(ProjectStory, { study, related: [] }));
    const title = html.indexOf("The Fresh Art Club</h1>");
    const industry = html.indexOf("Contemporary Art · Arts &amp; Culture · Digital Platform");
    expect(title).toBeGreaterThan(-1);
    expect(industry).toBeGreaterThan(title);
    const hero = html.slice(0, html.indexOf("</header>"));
    expect(hero).not.toMatch(/data-project-logo|The Fresh Art Club logo|Project scope|Corporate Websites|Web Applications/);
    expect(html).not.toContain("/images/case-studies/the-fresh-art-club-logo.svg");
    const css = fs.readFileSync("src/sections/case-studies/project-hero.module.css", "utf8");
    expect(css).toMatch(/\.industry \{[^}]*color:#df2525/);
  });
  it("never invents a project logo or exposes one for NDA engagements or concept previews", () => {
    expect(projectLogoFor({ slug: "the-fresh-art-club", nda: false })?.src).toBe("/images/case-studies/the-fresh-art-club-logo.svg");
    for (const slug of ["unknown", "constructor", "__proto__"]) expect(projectLogoFor({ slug, nda: false })).toBeNull();
    expect(projectLogoFor({ slug: "the-fresh-art-club", nda: true })).toBeNull();
    const nda = { ...record(), slug: "the-fresh-art-club", nda: true };
    expect(render(React.createElement(ProjectStory, { study: nda, related: [] }))).not.toContain("data-project-logo");
    expect(render(React.createElement(ProjectStory, { concept, related: [] }))).not.toContain("data-project-logo");
    expect(render(React.createElement(ProjectStory, { study: record(), related: [] }))).not.toContain(`class="${heroStyles.industry}"`);
  });
  it("unifies the 16:9 cover with the hero and gives facts a dark band followed by a light gallery", () => {
    const html = render(React.createElement(ProjectStory, { concept, related: [] }));
    expect(html).toContain(`class="${heroStyles.coverFrame}"`);
    expect(html.indexOf("data-case-study-cover")).toBeLessThan(html.indexOf("</header>"));
    expect(html.indexOf("project-information-heading")).toBeGreaterThan(html.indexOf("</header>"));
    expect(html).toContain('fetchPriority="high"');
    expect(html).toContain(`id="interfaces" class="${detailStyles.gallerySection}"`);
    expect(html).toContain(`class="${detailStyles.informationBand}" data-project-information-band`);
    const css = fs.readFileSync("src/sections/case-studies/project-hero.module.css", "utf8");
    expect(css).toMatch(/\.coverFrame \{[^}]*width:100%[^}]*aspect-ratio:16\/9/);
    expect(css).toContain('grid-template-columns:minmax(0,.9fr) minmax(0,1.5fr)');
    expect(css).toContain('prefers-reduced-motion:no-preference');
    const detailsCss = fs.readFileSync("src/sections/case-studies/project-details.module.css", "utf8");
    expect(detailsCss).toMatch(/\.gallerySection \{[^}]*background:#f7f7f7[^}]*color:#000/);
    expect(detailsCss).toMatch(/\.informationBand \{[^}]*background:#111[^}]*color:#fff/);
    expect(detailsCss).toContain('.informationBand .factGrid dd { color:#fff; }');
    expect(detailsCss).toContain('.informationBand .factGrid,.informationBand .factGrid>div { border:0; }');
    expect(detailsCss).not.toContain('outline-color:#fff; }\n.gallerySection');
  });
  it("uses the optional managed introduction only in the hero, with a compatible summary fallback", () => {
    const s = record(); s.introduction = "A supplied project-specific introduction.";
    const html = render(React.createElement(ProjectStory, { study: s, related: [] }));
    const hero = html.slice(0, html.indexOf("</header>"));
    expect(hero).toContain(s.introduction);
    expect(hero).not.toContain(s.summary);
    s.introduction = "  ";
    expect(render(React.createElement(ProjectStory, { study: s, related: [] }))).toContain(s.summary);
    expect(record().introduction).toBeUndefined();
    expect(caseStudySchema.safeParse({ ...record(), introduction: "x".repeat(1201) }).success).toBe(false);
    const editor = fs.readFileSync("src/components/admin/case-study-form.tsx", "utf8");
    expect(editor).toContain('id="cs-introduction"');
    expect(editor).toContain('summary, introduction, challenge, solution');
  });
  it("omits missing hero metadata and imagery without inventing empty placeholders", () => {
    const html = render(React.createElement(ProjectStory, { study: record(), related: [] }));
    const hero = html.slice(0, html.indexOf("</header>"));
    expect(hero).not.toMatch(/data-project-logo|data-case-study-cover|Project scope|Explore Live Website|Live URL awaiting details/);
    expect(hero).toContain('data-with-cover="false"');
    expect(hero).toContain('Discuss a Similar Project');
    const s = record(); s.services = ["Web Applications", "", "Web Applications"];
    const scoped = render(React.createElement(ProjectStory, { study: s, related: [] })).split("</header>")[0];
    expect(scoped).not.toContain("Web Applications");
    expect(s.services).toEqual(["Web Applications", "", "Web Applications"]);
  });
  it("keeps vertical page gestures outside the gallery's horizontal Lenis exclusion", () => {
    const html = render(React.createElement(ProjectGallery, { images: concept.visuals, name: "Scrolling gallery" }));
    expect(html).toContain("data-lenis-prevent-horizontal");
    expect(html).not.toContain("data-lenis-prevent=");
    expect(html).toContain('aria-pressed="true"');
    expect(html).not.toContain('role="tab"');
    const source = fs.readFileSync("src/sections/case-studies/project-gallery.tsx", "utf8");
    expect(source).toContain("second.offsetLeft - first.offsetLeft");
    expect(source).not.toMatch(/onWheel|touchmove|pointermove/);
    const css = fs.readFileSync("src/sections/case-studies/project-details.module.css", "utf8");
    expect(css).toContain("overscroll-behavior-y:auto");
    expect(css).toContain("touch-action:pan-x pan-y pinch-zoom");
    expect(css).toMatch(/\.dots button \{[^}]*width:32px[^}]*height:44px/);
  });
  it("orders facts, left invitation, gallery, features, technology/palette, review and supporting notes", () => { const html = render(React.createElement(ProjectStory, { concept, related: [] })); const needles = ["project-information-heading", "data-similar-project", 'id="interfaces"', 'id="features"', 'id="technology"', 'id="palette"', 'id="client-review"']; const positions = needles.map(n => html.indexOf(n)); expect(positions.every(p => p >= 0)).toBe(true); expect(positions).toEqual([...positions].sort((a, b) => a - b)); });
  it("keeps supplied art metadata a labelled layout example, never Aster delivery facts", () => { const html = render(React.createElement(ProjectStory, { concept, related: [] })); expect(html).toContain("Layout example · Not Aster Health project facts"); for (const [, value] of concept.layoutFacts!) expect(html).toContain(value.replaceAll("&", "&amp;")); expect(concept.layoutFacts).toHaveLength(8); expect(html).toContain("Design preview · Not client work"); });
  it("shows six conceptual features and the original visual palette without fake reviews or URLs", () => { const html = render(React.createElement(ProjectStory, { concept, related: [] })); for (const feature of concept.features!) expect(html).toContain(feature.title.replaceAll("&", "&amp;")); for (const swatch of concept.palette!) expect(html).toContain(swatch.hex); expect(html).not.toContain("Live URL awaiting details"); expect(html).toContain("Awaiting approved client feedback"); expect(html).not.toMatch(/4\.7\/5|five-star|https:\/\/aster|Client testimonial/); });
  it("has separate original hero, new middle and original preview-close conversion sources", () => { const html = render(React.createElement(ProjectStory, { concept, related: [] })); expect(html).toContain('data-source="case-study-hero"'); expect(html).toContain('data-source="case-study-preview-aster-health-middle"'); expect(html).toContain("Start a Similar Project"); const source = fs.readFileSync("src/sections/case-studies/project-story.tsx", "utf8"); expect(source).toContain('"case-study-close"'); expect(source).toContain('`case-study-preview-${concept!.slug}-close`'); });
  it("uses only useful supplied facts on published records, not preview facts or default duration/team", () => { const s = record(); s.clientLocation = "Supplied location"; s.industry = "Supplied industry"; s.year = "2026"; const html = render(React.createElement(ProjectStory, { study: s, related: [] })); expect(html).toContain("Supplied location"); expect(html).toContain("Supplied industry"); expect(html).not.toMatch(/The Fresh Art Club|18 weeks|5 specialists|Layout example|Awaiting approved client feedback/); });
  it("shows the supplied live project URL and genuine provided quote without inventing a rating", () => { const s = record(); s.liveUrl = "https://example.invalid/approved"; s.testimonial = { quote: "Test-only approved quote.", name: "Test-only name", role: "Test-only role" }; const html = render(React.createElement(ProjectStory, { study: s, related: [] })); expect(html).toContain('href="https://example.invalid/approved"'); for (const v of Object.values(s.testimonial)) expect(html).toContain(v); expect(html).not.toMatch(/rating|stars|Awaiting approved/); });
  it("accepts only http/https project links", () => { expect(safeProjectLiveHref("https://example.invalid/project")).toBe("https://example.invalid/project"); expect(safeProjectLiveHref("javascript:alert(1)")).toBeNull(); expect(safeProjectLiveHref("data:text/html,test")).toBeNull(); expect(safeProjectLiveHref("/project")).toBeNull(); expect(safeProjectLiveHref(undefined)).toBeNull(); });
  it("projects all eight gallery attachments in CMS order, separately from the overview", () => { const s = record(); s.images = { showcase: image }; s.gallery = Array.from({ length: 8 }, (_, index) => ({ ...image, alt: `Supplied screen ${index + 1}` })); const gallery = projectGalleryVisuals(s); expect(gallery).toHaveLength(8); gallery.forEach((g, index) => { expect(g.src).toContain(`gallery-${index}`); expect(g.alt).toBe(`Supplied screen ${index + 1}`); }); expect(projectGalleryVisuals(record())).toEqual([]); });
  it("bounds the slider to eight, labels image controls and supplies native/no-JS recovery", () => { const images = Array.from({ length: 9 }, () => concept.visuals[0]); const html = render(React.createElement(ProjectGallery, { images, name: "Test-only gallery" })); expect((html.match(/aria-roledescription="slide"/g) ?? [])).toHaveLength(8); expect(html).toContain("Previous project image"); expect(html).toContain("Next project image"); expect(html).toContain("Scroll through the images"); expect(html).toContain('aria-pressed="true"'); expect(html).toContain("Go to position"); expect(html).toContain('role="status"'); expect(html).toContain("disabled"); expect(html).not.toContain("Image 9"); });
  it("uses a stable server snapshot for responsive gallery positions before hydration", () => {
    const images = Array.from({ length: 6 }, () => concept.visuals[0]);
    const html = render(React.createElement(ProjectGallery, { images, name: "Responsive gallery" }));
    expect((html.match(/Go to position/g) ?? [])).toHaveLength(5);
    const source = fs.readFileSync("src/sections/case-studies/project-gallery.tsx", "utf8");
    expect(source).toContain("useSyncExternalStore(subscribePerView, perView, serverPerView)");
    expect(source).toContain("views.length - screensPerView");
  });
  it("handles empty and single-image libraries, and caps features at six", () => { expect(render(React.createElement(ProjectGallery, { images: [], name: "Empty" }))).toBe(""); const single = render(React.createElement(ProjectGallery, { images: [concept.visuals[0]], name: "Single" })); expect((single.match(/Go to position/g) ?? [])).toHaveLength(1); expect(single).toContain("1<span> / 1</span>"); const features = Array.from({ length: 7 }, (_, index) => ({ title: `Feature ${index}`, text: "Supplied description" })); const html = render(React.createElement(NotableFeatures, { features })); expect(html).toContain("Feature 5"); expect(html).not.toContain("Feature 6"); });
  it("keeps existing eight-image/six-feature CMS contracts and neutral scoped responsive styling", () => { const editor = fs.readFileSync("src/components/admin/case-study-form.tsx", "utf8"); expect(editor).toContain("<GalleryUploader images={gallery} onChange={setGallery}"); const uploader = fs.readFileSync("src/components/admin/gallery-uploader.tsx", "utf8"); expect(uploader).toContain("const remaining = 8 - images.length"); expect(caseStudySchema.safeParse({ ...record(), gallery: Array.from({ length: 9 }, () => image) }).success).toBe(false); expect(editor).toContain("Add 1–6 features"); const css = fs.readFileSync("src/sections/case-studies/project-details.module.css", "utf8"); expect(css).toContain("grid-template-columns:repeat(3,minmax(0,1fr))"); expect(css).toContain("scroll-snap-type:x mandatory"); expect(css).toContain("object-fit:cover; object-position:center"); expect(css).toContain("prefers-reduced-motion:reduce"); const source = fs.readFileSync("src/sections/case-studies/project-gallery.tsx", "utf8"); expect(source).not.toMatch(/setInterval|pointermove|touchmove/); });

  it("auto-compresses every upload path to web weight with visible size feedback", () => {
    const crop = fs.readFileSync("src/components/admin/image-crop-field.tsx", "utf8");
    const gallery = fs.readFileSync("src/components/admin/gallery-uploader.tsx", "utf8");
    for (const src of [crop, gallery]) {
      // ≈7 bytes/px budget (1600×1000 → ≤≈230KB) with a JPEG → WebP quality ladder and a 2× best-effort ceiling
      expect(src).toContain("(w * h) / 7");
      expect(src).toContain("image/webp");
      expect(src).toContain("budget * 2");
    }
    expect(crop).toContain("auto-compressed to"); // visible size feedback on the cover/slots
    expect(gallery).toMatch(/\{Math.max\(1, Math.round\(\(\(img\.dataUrl\.length/); // per-image KB badge
  });

  it("implements the draft-vs-publish contract: sparse drafts parse and save, publishing gates every field", () => {
    const sparse = caseStudySchema.safeParse({ title: "Incomplete draft", discipline: "web" });
    expect(sparse.success).toBe(true);
    const editor = fs.readFileSync("src/components/admin/case-study-form.tsx", "utf8");
    expect(editor).toContain('const publishing = contentStatus === "published"');
    for (const gated of ["Live project URL is required to publish", "Author credit is required", "errs.industrySlugs"]) expect(editor).toContain(gated);
    expect(editor).not.toContain("errs.dAbout"); // dossier editor removed per owner decision
    for (const control of ['id="cs-nda"', 'id="cs-level"']) expect(editor).toContain(control);
    expect(editor).not.toContain("Outcome Metrics"); // outcomes editor removed per owner decision
    expect(editor).not.toContain("setResults");
    expect(editor).not.toContain("FLAGSHIP DOSSIER");
    expect(editor).toContain("dossier: r?.dossier ?? undefined");
    expect(editor).toContain("results: r?.results ?? undefined"); // legacy dossier + outcomes data preserved on save
    // One cover upload syncs every surface; advanced per-slot overrides remain
    expect(editor).toContain('id="cs-cover"');
    expect(editor).toContain("showcase: next, cardWide: next, card: next, dossierCard: next");
    expect(editor).not.toContain("use a different image for a specific surface"); // per-surface overrides removed per owner decision
    const action = fs.readFileSync("src/app/admin/(protected)/case-studies/actions.ts", "utf8");
    for (const gap of ['"Live project URL"', '"Author credit"', '"Industry associations (1 min)"']) expect(action).toContain(gap);
    expect(action).not.toContain("Outcome metrics");
    expect(action).not.toContain("Dossier ·");
    expect(action).toContain('downgradedToDraft ? "draft"');
  });

  it("aligns every cover upload slot to 16:9 and uses the shared crop dimensions", () => {
    expect(CASE_IMAGE_SLOTS.showcase.width).toBe(1600); expect(CASE_IMAGE_SLOTS.showcase.height).toBe(900);
    expect(CASE_IMAGE_SLOTS.cardWide.width).toBe(1600); expect(CASE_IMAGE_SLOTS.cardWide.height).toBe(900);
    expect(CASE_IMAGE_SLOTS.card.width).toBe(1280); expect(CASE_IMAGE_SLOTS.card.height).toBe(720);
    expect(CASE_IMAGE_SLOTS.dossierCard.width).toBe(1280); expect(CASE_IMAGE_SLOTS.dossierCard.height).toBe(720);
    for (const slot of Object.values(CASE_IMAGE_SLOTS)) { expect(slot.width / slot.height).toBeCloseTo(16 / 9); expect(slot.hint).toBe("16:9"); }
    const editor = fs.readFileSync("src/components/admin/case-study-form.tsx", "utf8");
    expect(editor).toContain("targetWidth={CASE_IMAGE_SLOTS.showcase.width}");
    expect(editor).toContain("targetHeight={CASE_IMAGE_SLOTS.showcase.height}");
    // Legacy covers are still accepted; this is not a destructive migration.
    expect(caseStudySchema.safeParse({ ...record(), images: { showcase: image } }).success).toBe(true);
  });
  it("uses filled covers and centered gallery images without letterboxing", () => {
    const details = fs.readFileSync("src/sections/case-studies/project-details.module.css", "utf8");
    const portfolio = fs.readFileSync("src/sections/case-studies/portfolio.module.css", "utf8");
    expect(portfolio).toMatch(/\.stage \{[^}]*aspect-ratio:16\/9/);
    expect(portfolio).toMatch(/\.image \{[^}]*aspect-ratio:16\/9[^}]*object-fit:cover/);
    expect(details).toMatch(/\.slideImage \{[^}]*aspect-ratio:16\/10/);
    expect(details).toContain("object-fit:cover; object-position:center");
    const story = fs.readFileSync("src/sections/case-studies/project-story.tsx", "utf8");
    expect(story).toContain("visual={visuals[0]}");
    const hero = fs.readFileSync("src/sections/case-studies/project-hero.module.css", "utf8");
    expect(hero).toMatch(/\.coverImage \{[^}]*object-fit:cover/);
  });

  it("can create eight-image actual-component SSR fixtures without publication", () => {
    if (process.env.CASE_DETAIL_FIXTURES !== "1") return;
    const s = record(); s.liveUrl = "https://example.invalid/test-only"; s.clientLocation = "Test-only location"; s.businessModel = "Test-only model"; s.platforms = "Web"; s.year = "2026"; s.duration = "Test-only duration"; s.teamSize = "Test-only team"; s.industry = "Test-only industry"; s.palette = concept.palette!; s.keyFeatures = concept.features!; s.testimonial = { quote: "Test-only quote, not an endorsement.", name: "Test-only name", role: "Test-only role" };
    const asset = (index: number) => ({ ...image, dataUrl: `data:image/svg+xml;base64,${Buffer.from(fs.readFileSync(`public${concept.visuals[index % 3].src}`)).toString("base64")}`, alt: `Test-only supplied screen ${index + 1}` });
    s.images = { showcase: asset(0) }; s.gallery = Array.from({ length: 8 }, (_, index) => asset(index));
    s.dossier = caseStudySchema.parse({ ...s, dossier: { discovery: "Test-only discovery", architecture: { backend: "Test-only backend rationale" } } }).dossier;
    const css = [["portfolio.module.css", portfolio], ["project-details.module.css", detailStyles], ["project-hero.module.css", heroStyles]].map(([file, classes]) => fs.readFileSync(`src/sections/case-studies/${file}`, "utf8").replace(/:global\(([^)]+)\)/g, "$1").replace(/\.([a-zA-Z][\w-]*)/g, (match, key: string) => (classes as Record<string, string>)[key] ? `.${(classes as Record<string, string>)[key]}` : match)).join("\n");
    const body = render(React.createElement(ProjectStory, { study: s, related: [] }));
    fs.writeFileSync("tmp/case-detail-upgrade/managed-fixture.html", `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>@font-face{font-family:Inter;src:url('/fonts/inter/Inter-VariableFont_opsz,wght.ttf');font-weight:100 900}@font-face{font-family:Outfit;src:url('/fonts/outfit/Outfit-VariableFont_wght.ttf');font-weight:100 900}*{box-sizing:border-box}body{margin:0;--nav-h:24px;--font-sans:Inter,sans-serif}h1,h2,h3,h4,p,figure,ul,dl,dd{margin:0}ul{padding:0;list-style:none}a{color:inherit;text-decoration:none}button,input{font:inherit}img{max-width:100%}.sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)}${css}</style></head><body>${body}</body></html>`);
    fs.writeFileSync("tmp/case-detail-upgrade/managed-fixture-images.json", JSON.stringify({ showcase: s.images.showcase!.dataUrl, ...Object.fromEntries(s.gallery.map((g, index) => [`gallery-${index}`, g.dataUrl])) }));
  });
});
