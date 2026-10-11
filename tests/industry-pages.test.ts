import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { INDUSTRY_DOSSIERS } from "../src/content/industries/dossiers";
import { industryDossierSchema, publicIndustryRows } from "../src/content/industries/schema";
import { sectorArticles, sectorCaseStudies } from "../src/content/industries/relationships";
import { CONTENT_COLLECTIONS, isCollectionKey } from "../src/lib/content-registry";
import { caseStudySchema } from "../src/lib/case-study-schema";
import { industryJsonLd, industryServiceLinks, industryStructuredData } from "../src/lib/industry-seo";
import { SERVICE_DETAILS } from "../src/constants/services-detail";
import { ARTICLES } from "../src/constants/insights";

const { findMany, articles } = vi.hoisted(() => ({ findMany: vi.fn(), articles: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: { contentItem: { findMany } } }));
vi.mock("@/lib/content-items", () => ({ getManagedArticles: articles }));
import { getIndustryAuthority, getIndustryArticles, getIndustryCaseStudies } from "../src/lib/industry-dossiers";
const row = (index = 0, changes = {}) => ({ slug: INDUSTRY_DOSSIERS[index].slug, title: INDUSTRY_DOSSIERS[index].title, data: INDUSTRY_DOSSIERS[index], active: true, contentStatus: "published", ...changes });
const testStudy = (changes = {}) => ({ ...caseStudySchema.parse({ title: "Testing-only fixture", discipline: "web", status: "verified", industrySlugs: ["healthcare", "education"] }), slug: "testing-only", ...changes });

beforeEach(() => { findMany.mockReset(); articles.mockReset(); });
describe("Sector dossier content and publishing", () => {
  it.each(INDUSTRY_DOSSIERS.map(d => [d.slug]))("validates the complete %s dossier and local imagery", slug => {
    const d = INDUSTRY_DOSSIERS.find(d => d.slug === slug)!;
    expect(industryDossierSchema.safeParse(d).success).toBe(true);
    expect(existsSync(`public${d.image}`)).toBe(true);
    expect(d.ecosystemNodes).toHaveLength(6);
    expect(d.solutions).toHaveLength(6);
    expect(d.aiOpportunities.every(a => a.review.length > 45)).toBe(true);
    for (const service of [...d.relatedServices, ...d.solutions.map(s => s.service)]) expect(SERVICE_DETAILS.some(s => s.slug === service)).toBe(true);
    for (const related of d.relatedIndustries) expect(INDUSTRY_DOSSIERS.some(s => s.slug === related)).toBe(true);
    for (const slug of d.insightSlugs) expect(ARTICLES.some(a => a.slug === slug)).toBe(true);
  });
  it("preserves all ten canonical slugs with distinct sector material", () => {
    expect(INDUSTRY_DOSSIERS.map(d => d.slug)).toEqual(["healthcare", "fintech", "ecommerce", "logistics", "real-estate", "education", "travel", "manufacturing", "government", "energy"]);
    for (const field of ["headline", "overview", "ecosystemCore", "metaDescription", "layout"] as const) expect(new Set(INDUSTRY_DOSSIERS.map(d => d[field])).size).toBe(10);
    expect(new Set(INDUSTRY_DOSSIERS.flatMap(d => d.solutions.map(s => s.title))).size).toBeGreaterThan(45);
  });
  it("defines the regulatory and consequential decision boundaries", () => {
    expect(JSON.stringify(INDUSTRY_DOSSIERS[0].safeguards)).toMatch(/HIPAA.*not a certification/);
    expect(JSON.stringify(INDUSTRY_DOSSIERS.find(d => d.slug === "manufacturing")!.safeguards)).toMatch(/OT owners.*not treat.*safety controls/);
    expect(JSON.stringify(INDUSTRY_DOSSIERS.find(d => d.slug === "government")!.aiOpportunities)).toMatch(/eligibility.*not delegated/);
    expect(JSON.stringify(INDUSTRY_DOSSIERS.find(d => d.slug === "energy")!.aiOpportunities)).toMatch(/not autonomously disconnect/);
  });
  it("never publishes a draft, hidden, invalid or absent managed record", () => {
    expect(publicIndustryRows([row(0, { contentStatus: "draft" }), row(1, { active: false }), row(2, { data: {} })])).toEqual([]);
    expect(publicIndustryRows([row(0)])).toHaveLength(1);
    expect(publicIndustryRows([])).toEqual([]);
  });
  it("keeps a valid new managed sector and its authoritative row identity", () => {
    const result = publicIndustryRows([row(0, { slug: "new-sector", title: "Managed industry" })]);
    expect(result[0].slug).toBe("new-sector"); expect(result[0].title).toBe("Managed industry");
  });
  it("rejects script paths, incomplete publishing and unlabelled images", () => {
    expect(industryDossierSchema.safeParse({ ...INDUSTRY_DOSSIERS[0], image: "javascript:alert(1)" }).success).toBe(false);
    expect(industryDossierSchema.safeParse({ ...INDUSTRY_DOSSIERS[0], imageAlt: "" }).success).toBe(false);
    expect(industryDossierSchema.safeParse({ ...INDUSTRY_DOSSIERS[0], aiOpportunities: [] }).success).toBe(false);
  });
  it("registers editable fields, import seeds and publication controls", () => {
    expect(isCollectionKey("industry-dossiers")).toBe(true);
    const def = CONTENT_COLLECTIONS["industry-dossiers"];
    expect(def.seeds()).toHaveLength(10);
    for (const d of def.seeds()) expect(industryDossierSchema.safeParse({ ...d.data, slug: d.slug, title: d.title }).success).toBe(true);
    for (const field of ["ecosystemNodes", "challenges", "solutions", "aiOpportunities", "safeguards", "outcomes", "faqs", "ctaHeading", "metaTitle", "schemaEnabled", "featured"]) expect(def.fields.some(f => f.name === field)).toBe(true);
    expect(CONTENT_COLLECTIONS.insights.fields.some(f => f.name === "industrySlugs")).toBe(true);
    const actions = readFileSync("src/app/admin/(protected)/content/actions.ts", "utf8");
    expect(actions).toContain('contentStatus === "published"'); expect(actions).toContain("industryDossierSchema.safeParse");
  });
});
describe("Explicit public resource relationships", () => {
  it("supports multi-industry project records without inferring tags", () => {
    const study = testStudy();
    expect(sectorCaseStudies([study], ["healthcare"])).toHaveLength(1);
    expect(sectorCaseStudies([study], ["education"])).toHaveLength(1);
    expect(sectorCaseStudies([study], ["fintech"])).toEqual([]);
    expect(sectorCaseStudies([testStudy({ status: "demo" })], ["healthcare"])).toEqual([]);
    expect(sectorCaseStudies([testStudy({ industrySlugs: undefined, industry: "Healthcare" })], ["healthcare"])).toEqual([]);
    expect(caseStudySchema.safeParse({ title: "Legacy fixture", discipline: "web" }).success).toBe(true);
  });
  it("does not manufacture missing reading records and de-duplicates explicit selections", () => {
    const d = INDUSTRY_DOSSIERS[0];
    expect(sectorArticles([], [d])).toEqual([]);
    const a = { ...ARTICLES[0], slug: "curated", industrySlugs: ["healthcare"] };
    expect(sectorArticles([a], [{ slug: "healthcare", insightSlugs: ["absent", "curated", "curated"] }])).toEqual([a]);
    expect(sectorArticles([a], [{ slug: "fintech", insightSlugs: [] }])).toEqual([]);
  });
  it("uses only provided managed service labels and canonicalises known aliases", () => {
    expect(industryServiceLinks([{ label: "Managed mobile label", href: "/services/mobile-apps/", summary: null }])).toEqual([{ slug: "mobile-app-development", title: "Managed mobile label" }]);
    expect(industryServiceLinks([])).toEqual([]);
    expect(industryServiceLinks([{ label: "Unknown", href: "/services/absent/", summary: null }])).toEqual([]);
  });
  it("matches FAQ structured data to the visible dossier and makes no rating claims", () => {
    const d = INDUSTRY_DOSSIERS[0]; const graph = industryStructuredData(INDUSTRY_DOSSIERS, d)!;
    const faq = graph["@graph"].find(x => x["@type"] === "FAQPage")!;
    expect("mainEntity" in faq ? faq.mainEntity?.map(q => q.name) : []).toEqual(d.faqs.map(f => f.q));
    expect(JSON.stringify(graph)).not.toMatch(/"@type":"(?:AggregateRating|Review)"|"(?:award|certification|priceCurrency)":/);
    expect(industryStructuredData(INDUSTRY_DOSSIERS, { ...d, schemaEnabled: false })).toBeNull();
    expect(industryJsonLd({ name: "</script><script>" })).not.toContain("<");
  });
});
describe("Industry DAL lifecycle and fallback boundaries", () => {
  it("uses defaults only before a managed collection exists", async () => {
    findMany.mockResolvedValueOnce([]); expect((await getIndustryAuthority()).managed).toBe(false);
    findMany.mockResolvedValueOnce([row(0, { contentStatus: "draft" })]); expect(await getIndustryAuthority()).toEqual({ managed: true, items: [] });
    findMany.mockResolvedValueOnce([row(1)]); expect((await getIndustryAuthority()).items.map(d => d.slug)).toEqual(["fintech"]);
  });
  it("fails closed on an unavailable managed collection read", async () => {
    findMany.mockRejectedValueOnce(new Error("testing-only outage"));
    expect(await getIndustryAuthority()).toEqual({ managed: true, items: [] });
  });
  it("reads published, active, verified case studies only; never coded demos", async () => {
    findMany.mockResolvedValueOnce([{ slug: "real-record", data: testStudy() }, { slug: "demo", data: testStudy({ status: "demo" }) }]);
    expect((await getIndustryCaseStudies()).map(s => s.slug)).toEqual(["real-record"]);
    expect(findMany.mock.calls[0][0].where).toEqual({ collection: "case-studies", active: true, contentStatus: "published" });
    findMany.mockResolvedValueOnce([]); expect(await getIndustryCaseStudies()).toEqual([]);
  });
  it("reuses the published-only article mapper without an extra publication query", async () => {
    articles.mockResolvedValueOnce([]);
    expect(await getIndustryArticles()).toEqual([]);
    articles.mockResolvedValueOnce([{ ...ARTICLES[0], slug: "actual" }]);
    expect((await getIndustryArticles()).map(a => a.slug)).toEqual(["actual"]);
    expect(findMany).not.toHaveBeenCalled();
  });
});
