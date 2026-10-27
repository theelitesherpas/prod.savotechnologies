import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { searchIndiaCities, INDIA_CITY_DIRECTORY_VERSION, INDIA_CITY_DIRECTORY_URL, type IndiaCityDirectory } from "@/lib/india-cities";
import { parseCandidateFilters, candidateListUrl, candidateReturnPath } from "@/lib/hr-candidates";
import { candidateSqlFilter, getCandidatePage } from "@/lib/hr-candidate-data";
const m = vi.hoisted(() => ({ user: { id: "viewer-user", role: "editor", permissions: ["hr-portal"] }, find: vi.fn(), update: vi.fn(), audit: vi.fn(), raw: vi.fn(), tx: vi.fn(), mail: vi.fn(), revalidate: vi.fn() }));
vi.mock("@/lib/auth", () => ({ requireAdmin: async () => m.user, getAdminUser: async () => m.user }));
vi.mock("@/lib/prisma", () => ({ prisma: { projectEnquiry: { findUnique: m.find }, $queryRaw: m.raw, $transaction: m.tx } }));
vi.mock("@/lib/mail", () => ({ sendTemplateNow: m.mail }));
vi.mock("next/cache", () => ({ revalidatePath: m.revalidate }));
vi.mock("next/navigation", () => ({ redirect: (url: string) => { throw Error(`REDIRECT:${url}`); } }));
import { markCandidateViewedAction, markCandidateNotViewedAction } from "@/app/admin/(protected)/enquiries/career-actions";
import config from "../next.config";
const id = "candidate-view-fixture", revision = "2026-10-23T00:00:00.000Z";
beforeEach(() => {
  vi.clearAllMocks(); m.user.permissions = ["hr-portal"];
  m.find.mockResolvedValue({ id, projectType: "General application", status: "new", careerStatus: null, updatedAt: new Date(revision), data: { city: "Indore", hrContact: { outcome: "contacted" } } });
  m.update.mockResolvedValue({ count: 1 }); m.raw.mockResolvedValue([]);
  m.tx.mockImplementation(async fn => fn({ projectEnquiry: { updateMany: m.update }, auditLog: { create: m.audit } }));
});
const directory = JSON.parse(readFileSync("public/data/india-cities.json", "utf8")) as IndiaCityDirectory;
describe("curated, locally cached India cities", () => {
  it("shows Indore, Delhi, Pune and Bengaluru first without changing or preselecting submitted data", () => {
    const before = JSON.stringify(directory.cities);
    expect(searchIndiaCities(directory.cities, "").options.slice(0, 7).map(row => row[0])).toEqual(["Indore", "Delhi", "Pune", "Bengaluru", "Bhopal", "Ujjain", "Dewas"]);
    expect(JSON.stringify(directory.cities)).toBe(before);
  });
  it.each(["Bangalore", "Bengaluru", "Bangalore Karnataka"])("finds Bengaluru using %s", input => expect(searchIndiaCities(directory.cities, input).options[0][0]).toBe("Bengaluru"));
  it("keeps search relevance ahead of shortcuts and does not hide smaller towns", () => {
    expect(searchIndiaCities(directory.cities, "New Delhi").options[0][0]).toBe("New Delhi");
    expect(searchIndiaCities(directory.cities, "Uttar Pradesh").options.every(row => row[1] === "Uttar Pradesh")).toBe(true);
    const small = directory.cities.find(row => row[0] === "Zunheboto")!; expect(small).toBeDefined();
    expect(searchIndiaCities(directory.cities, "Zunheboto").options).toContainEqual(small);
    expect(searchIndiaCities(directory.cities, "Invented missing location").total).toBe(0);
  });
  it("keeps source coverage intact and safely bounds rendered options", () => {
    expect(searchIndiaCities(directory.cities, "").total).toBe(4328); expect(searchIndiaCities(directory.cities, "", 3).options).toHaveLength(3);
    expect(searchIndiaCities(directory.cities, "", -2).options).toHaveLength(0);
  });
  it("uses an immutable cache only for the pinned version, not an unversioned download", async () => {
    const headers = await config.headers!(); const route = headers.find(route => route.source === "/data/india-cities.json")!;
    expect(route.has).toEqual([{ type: "query", key: "v", value: INDIA_CITY_DIRECTORY_VERSION }]);
    expect(route.headers).toContainEqual({ key: "Cache-Control", value: "public, max-age=31536000, immutable" });
    expect(INDIA_CITY_DIRECTORY_URL).toContain(`?v=${INDIA_CITY_DIRECTORY_VERSION}`);
  });
  it("removes duplicate inline credit, retaining license/download on the linked credit page", () => {
    expect(readFileSync("src/sections/careers/application-form.tsx", "utf8")).not.toContain("City/town directory:");
    const picker = readFileSync("src/sections/careers/city-picker.tsx", "utf8"), credits = readFileSync("src/app/(site)/data-sources/page.tsx", "utf8");
    expect(picker).toContain("/data-sources#india-cities"); expect(picker).toContain("Search by city or state, or enter it manually.");
    expect(credits).toContain("Countries States Cities Database"); expect(credits).toContain("Open Database License"); expect(credits).toContain("download");
  });
});
describe("multi-city and skill filters", () => {
  it("supports old single-city links plus case-insensitive deduplicated checkbox selections", () => {
    expect(parseCandidateFilters({ city: "Indore" }).city).toEqual(["Indore"]);
    expect(parseCandidateFilters({ city: ["Indore", "Pune", " indore ", ""], skills: ["React", "react", "Node.js"], skillMatch: "all" })).toMatchObject({ city: ["Indore", "Pune"], skills: ["React", "Node.js"], skillMatch: "all" });
    expect(parseCandidateFilters({ city: Array.from({ length: 25 }, (_, i) => `City ${i}`) }).city).toHaveLength(20);
  });
  it("preserves every checked choice and matching rule through pagination and return URLs", () => {
    const filters = parseCandidateFilters({ city: ["Indore", "Pune"], hometown: ["Jaipur", "Delhi"], skills: ["React", "Node.js"], skillMatch: "all", read: "not_viewed" });
    const url = candidateReturnPath(candidateListUrl("/admin/hr-portal/applications", filters, { page: 3 }));
    const params = new URL(url, "http://local").searchParams;
    expect(params.getAll("city")).toEqual(["Indore", "Pune"]); expect(params.getAll("hometown")).toEqual(["Jaipur", "Delhi"]);
    expect(params.getAll("skills")).toEqual(["React", "Node.js"]); expect(params.get("skillMatch")).toBe("all"); expect(params.get("page")).toBe("3");
  });
  it("matches cities with OR, combines filter groups with AND, and parameterizes all selected skills", () => {
    const query = candidateSqlFilter(parseCandidateFilters({ city: ["Indore", "Pune"], skills: ["React", "Node.js"], skillMatch: "all" }));
    expect(query.sql).toContain("city ILIKE ? OR city ILIKE ?"); expect(query.sql).toContain("COUNT(DISTINCT matched.value)");
    expect(query.sql).toContain("jsonb_typeof(skill.value) = 'string'"); expect(query.values).toEqual(expect.arrayContaining(["%Indore%", "%Pune%", "react", "node.js", 2]));
    expect(query.sql).not.toContain("Node.js");
    expect(candidateSqlFilter(parseCandidateFilters({ skills: ["React", "Node.js"] })).sql).toContain("EXISTS (");
  });
  it("keeps hidden selections submitted while narrowing searchable checkbox options", () => {
    const source = readFileSync("src/components/admin/hr/filter-checkboxes.tsx", "utf8");
    expect(source).toContain('type="hidden" name={name} value={value}'); expect(source).toContain('name={name} value={value}');
    expect(source).toContain('if (event.key === "Enter") event.preventDefault()');
    expect(readFileSync("src/lib/hr-candidate-data.ts", "utf8")).not.toContain("position <= 250");
  });
});

describe("shared viewed/not viewed queues", () => {
  it("validates, persists and returns to independent view filters", () => {
    expect(parseCandidateFilters({ read: "invented" }).read).toBe("all");
    const filters = parseCandidateFilters({ read: "not_viewed", stage: "shortlisted", contact: "contacted", city: "Indore", page: "2" });
    const url = candidateListUrl("/admin/hr-portal/applications", filters, { page: 3 });
    expect(candidateReturnPath(url)).toContain("read=not_viewed"); expect(url).toContain("stage=shortlisted"); expect(url).toContain("page=3");
    expect(candidateSqlFilter(filters).sql).toContain('"inboxStatus" = \'new\'');
    expect(candidateSqlFilter({ ...filters, read: "viewed" }).sql).toContain('"inboxStatus" <> \'new\'');
    expect(candidateSqlFilter(filters, true, false).sql).not.toContain('"inboxStatus" =');
  });
  it("filters before pagination while view counters span both queues under other filters", async () => {
    m.raw.mockResolvedValueOnce([{ stage: "new", count: 17 }]).mockResolvedValueOnce([{ count: 42, notViewed: 17, viewed: 25 }]).mockResolvedValueOnce([]).mockResolvedValueOnce([]);
    const result = await getCandidatePage(parseCandidateFilters({ read: "not_viewed", pageSize: "10", page: "9", city: "Indore" }), "/admin/hr-portal/applications");
    expect(result).toMatchObject({ total: 17, page: 2, pages: 2, readCounts: { all: 42, not_viewed: 17, viewed: 25 } });
    expect(m.raw.mock.calls[3][0].sql).toContain('"inboxStatus" = \'new\''); expect(m.raw.mock.calls[3][0].values.slice(-2)).toEqual([10, 10]);
    expect(m.raw.mock.calls[1][0].values).toContain("%Indore%");
  });
  it("marks a visible application with an atomic team-wide inbox transition and one audit, without email/hiring/data changes", async () => {
    expect(await markCandidateViewedAction(id)).toEqual({ ok: true });
    expect(m.update.mock.calls[0][0]).toMatchObject({ where: { AND: [expect.anything(), { id, status: "new" }] }, data: { status: "in_progress" } });
    expect(m.audit.mock.calls[0][0].data).toMatchObject({ action: "enquiry.viewed", userId: "viewer-user", entityId: id });
    expect(m.mail).not.toHaveBeenCalled(); expect(m.revalidate).toHaveBeenCalledWith("/admin", "layout");
  });
  it("makes concurrent/duplicate opens idempotent without extra audits", async () => {
    m.update.mockResolvedValue({ count: 0 }); await markCandidateViewedAction(id); expect(m.audit).not.toHaveBeenCalled();
  });
  it("checks permissions and career ownership before marking anything viewed", async () => {
    m.user.permissions = ["clients"]; await expect(markCandidateViewedAction(id)).rejects.toThrow("denied=Recruitment"); expect(m.find).not.toHaveBeenCalled();
    m.user.permissions = ["hr-portal"]; m.find.mockResolvedValue({ projectType: "Website" }); expect(await markCandidateViewedAction(id)).toEqual({ ok: false }); expect(m.tx).not.toHaveBeenCalled();
  });
  it("can return an application to the unread queue without changing hiring/contact and without immediately reopening it", async () => {
    m.find.mockResolvedValue({ ...(await m.find()), status: "in_progress", careerStatus: "shortlisted" });
    const form = new FormData(); for (const [key, value] of Object.entries({ id, revision, returnTo: "/admin/hr-portal/applications?read=viewed&city=Indore" })) form.set(key, value);
    await expect(markCandidateNotViewedAction(form)).rejects.toThrow("unread=1"); expect(m.update.mock.calls[0][0].data).toEqual({ status: "new" }); expect(m.mail).not.toHaveBeenCalled();
  });
  it("keeps HR records unprefetched and makes the entire record clickable without hijacking controls", () => {
    const workspace = readFileSync("src/components/admin/hr/candidate-workspace.tsx", "utf8"), clickRecord = readFileSync("src/components/admin/hr/clickable-candidate-record.tsx", "utf8"), detail = readFileSync("src/components/admin/enquiry-detail.tsx", "utf8");
    expect(workspace).not.toContain("PortalDirectory"); expect(workspace).toContain('<details key={url()} id="candidate-filter-panel"'); expect(workspace).not.toContain("<details open");
    expect(workspace).toContain("prefetch={false} href={detail(row.id)}"); expect(workspace).not.toContain('aria-label="Recruitment stage shortcuts"');
    expect(workspace).toContain("<ClickableCandidateRow"); expect(workspace).toContain("<ClickableCandidateCard");
    expect(clickRecord).toContain("router.push(href)"); expect(clickRecord).toContain("target.closest(INTERACTIVE_TARGETS)");
    expect(clickRecord).toContain("button, input, select, textarea, summary");
    expect(detail).toContain('if (!isCareer && enquiry.status === "new"'); expect(detail).toContain("<CandidateReadBoundary");
  });
});
