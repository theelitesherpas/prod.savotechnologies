import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { Prisma } from "@prisma/client";
const m = vi.hoisted(() => ({ user: { id: "hr-reviewer", name: "Reviewer", email: "reviewer@example.invalid", role: "editor", permissions: ["hr-portal"] as string[] }, raw: vi.fn(), find: vi.fn(), update: vi.fn(), audit: vi.fn(), transaction: vi.fn(), mail: vi.fn() }));
vi.mock("@/lib/auth", () => ({ getAdminUser: async () => m.user, requireAdmin: async () => m.user }));
vi.mock("next/navigation", () => ({ redirect: (url: string) => { throw Error(`REDIRECT:${url}`); } }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: { $queryRaw: m.raw, projectEnquiry: { findUnique: m.find, update: m.update }, $transaction: m.transaction } }));
vi.mock("@/lib/audit", () => ({ audit: m.audit }));
vi.mock("@/lib/mail", () => ({ sendTemplateNow: m.mail }));
import { parseCandidateFilters, candidateListUrl, candidateReturnPath, candidateProfile, candidateProfileSchema, formatExperience } from "@/lib/hr-candidates";
import { candidateSqlBase, candidateSqlFilter, getCandidatePage } from "@/lib/hr-candidate-data";
import { saveCandidateProfileAction, scheduleInterviewAction } from "@/app/admin/(protected)/enquiries/career-actions";
import { Pagination, pageWindow } from "@/components/admin/pagination";
import { parseAdminPage, adminPageUrl } from "@/lib/admin-pagination";
import { searchIndiaCities, type IndiaCityDirectory } from "@/lib/india-cities";
import { CAREER_PROJECT_TYPES } from "@/lib/admin-enquiries";

beforeEach(() => {
  vi.clearAllMocks(); m.user.permissions = ["hr-portal"];
  m.raw.mockResolvedValue([]); m.find.mockResolvedValue(null); m.update.mockResolvedValue({ count: 1 });
  m.transaction.mockImplementation(async fn => fn({ projectEnquiry: { updateMany: m.update }, auditLog: { create: m.audit } }));
});
describe("candidate filters and URL state", () => {
  it("honors legacy interview links while validating unknown filters and page sizes", () => {
    expect(parseCandidateFilters({ tab: "scheduled", page: "-1", pageSize: "999", experience: "invented" })).toMatchObject({ stage: "interview_scheduled", sort: "interview", page: 1, pageSize: 25, experience: "" });
    expect(parseCandidateFilters({}, true).stage).toBe("active"); expect(parseCandidateFilters({}).stage).toBe("all");
  });
  it("retains all combined filters on page links and resets to first page on size changes", () => {
    const filters = parseCandidateFilters({ q: "Tester", city: "Indore", hometown: "Jaipur", role: "Engineer", experience: "3-5", stage: "shortlisted", page: "2", pageSize: "10" });
    const url = new URL(candidateListUrl("/admin/hr-portal/applications", filters, { page: 3 }), "http://local");
    expect(Object.fromEntries(url.searchParams)).toMatchObject({ q: "Tester", city: "Indore", hometown: "Jaipur", role: "Engineer", experience: "3-5", stage: "shortlisted", page: "3", pageSize: "10" });
    expect(candidateListUrl(url.pathname, filters, { page: 1, pageSize: 50 })).not.toContain("page=2");
  });
  it.each(["https://evil.example/admin/hr-portal", "//evil.example/admin/hr-portal", "/admin/settings", "/admin/hr-portal/applications/foreign", "javascript:alert(1)"])("refuses forged return destination %s", value => expect(candidateReturnPath(value)).toBe("/admin/hr-portal/applications"));
  it("preserves only allowlisted filter state in safe return links", () => {
    const value = candidateReturnPath("/admin/hr-portal/applications?city=Indore&page=3&role=Engineer&arbitrary=secret");
    expect(value).toContain("city=Indore"); expect(value).toContain("page=3"); expect(value).not.toContain("arbitrary");
  });
});
describe("candidate SQL readers", () => {
  it("parameterizes all values and always restricts reads to career categories", () => {
    const query = Prisma.sql`${candidateSqlBase()} SELECT id FROM candidates WHERE ${candidateSqlFilter(parseCandidateFilters({ city: "' OR TRUE --", hometown: "Not provided", experience: "3-5", stage: "shortlisted" }))}`;
    expect(query.sql).not.toContain("' OR TRUE --"); expect(query.values).toEqual(expect.arrayContaining(CAREER_PROJECT_TYPES));
    expect(query.sql).toContain("project_type IN ("); expect(query.sql).toContain("hometown = ''");
    expect(query.values).toContain("3-5"); expect(query.values).toContain("shortlisted");
  });
  it("denies unrelated editors before options, counts or row reads", async () => {
    m.user.permissions = ["clients"]; await expect(getCandidatePage(parseCandidateFilters({}), "/admin/hr-portal/applications")).rejects.toThrow("denied="); expect(m.raw).not.toHaveBeenCalled();
  });
  it("counts first, clamps a deleted/out-of-range page and applies SQL LIMIT/OFFSET", async () => {
    m.raw.mockResolvedValueOnce([{ stage: "new", count: 27 }]).mockResolvedValueOnce([{ count: 27 }]).mockResolvedValueOnce([]).mockResolvedValueOnce([]);
    const result = await getCandidatePage(parseCandidateFilters({ page: "999", pageSize: "10", city: "Indore" }), "/admin/hr-portal/applications");
    expect(result).toMatchObject({ total: 27, pages: 3, page: 3 }); expect(m.raw.mock.calls[3][0].values.slice(-2)).toEqual([10, 20]); expect(m.raw.mock.calls[3][0].sql).toMatch(/LIMIT \? OFFSET \?/);
    expect(m.raw.mock.calls[0][0].values).toContain("%Indore%");
  });
});
describe("HR-reviewed facts preserve the original application", () => {
  const original = { form: "careers", role: "Backend Engineer", city: "Indore", experience: "3 to 5 years", resume: "https://example.invalid/resume", skills: ["Node.js"], currentCtc: "Prefer not to disclose" };
  const revision = "2026-10-22T10:00:00.000Z";
  function profileForm() { const fd = new FormData(); for (const [key, value] of Object.entries({ id: "candidate-fixture-id", revision, city: "Bengaluru", hometown: "Jaipur", role: "Backend Engineer", years: "4", months: "6", returnTo: "/admin/hr-portal/applications?city=Indore&page=2" })) fd.set(key, value); return fd; }
  it("does not infer hometown or precise experience from current city or a reported band", () => {
    expect(candidateProfile(original)).toMatchObject({ city: "Indore", hometown: "", experience: "3 to 5 years", months: null });
    expect(formatExperience(0)).toBe("Fresher"); expect(formatExperience(54)).toBe("4 years 6 months");
  });
  it("supports explicit legacy hometown keys without treating current city as hometown", () => expect(candidateProfile({ city: "Delhi", homeTown: "Lucknow" }).hometown).toBe("Lucknow"));
  it("saves an independently reviewed profile with category/revision checks and no email", async () => {
    m.find.mockResolvedValue({ id: "candidate-fixture-id", projectType: "Backend Engineer", data: original, updatedAt: new Date(revision) });
    await expect(saveCandidateProfileAction(profileForm())).rejects.toThrow("saved=profile");
    const { where, data } = m.update.mock.calls[0][0]; expect(where.AND[1]).toEqual({ id: "candidate-fixture-id", updatedAt: new Date(revision) });
    expect(data.data).toMatchObject({ ...original, hrProfile: { city: "Bengaluru", hometown: "Jaipur", totalExperienceMonths: 54 } }); expect(m.audit).toHaveBeenCalledOnce(); expect(m.mail).not.toHaveBeenCalled();
    expect(candidateProfile(data.data)).toMatchObject({ experience: "4 years 6 months", city: "Bengaluru", hometown: "Jaipur" });
  });
  it("rejects stale profile edits without audit success", async () => {
    m.find.mockResolvedValue({ id: "candidate-fixture-id", projectType: "Backend Engineer", data: original, updatedAt: new Date(revision) }); m.update.mockResolvedValue({ count: 0 });
    await expect(saveCandidateProfileAction(profileForm())).rejects.toThrow("changed"); expect(m.audit).not.toHaveBeenCalled();
  });
  it("cannot turn a sales enquiry into a candidate by posting an ID", async () => {
    m.find.mockResolvedValue({ projectType: "Website", data: original }); await expect(saveCandidateProfileAction(profileForm())).rejects.toThrow("not%20found"); expect(m.transaction).not.toHaveBeenCalled();
  });
  it("validates whole years and months without converting unknown to zero", () => {
    const values = Object.fromEntries(profileForm()); expect(candidateProfileSchema.safeParse({ ...values, months: "12" }).success).toBe(false); expect(candidateProfileSchema.safeParse({ ...values, years: "-1" }).success).toBe(false); expect(candidateProfileSchema.safeParse({ ...values, years: "", months: "" }).success).toBe(true);
  });
});
describe("interview scheduling clarity", () => {
  it("interprets the displayed IST time independently of the server timezone", async () => {
    m.find.mockResolvedValue({ id: "candidate-fixture-id", status: "in_progress", careerStatus: "shortlisted", updatedAt: new Date(), projectType: "Backend Engineer", name: "Synthetic candidate", email: "candidate@example.invalid", data: { role: "Backend Engineer" } });
    const form = new FormData(); for (const [key, value] of Object.entries({ id: "candidate-fixture-id", interviewDate: "2099-11-05", interviewTime: "10:00 AM", meetingLink: "https://meet.google.com/synthetic", interviewer: "Synthetic reviewer" })) form.set(key, value);
    await expect(scheduleInterviewAction(form)).rejects.toThrow("career=interview");
    expect(m.update.mock.calls[0][0].data.interviewDate.toISOString()).toBe("2099-11-05T04:30:00.000Z");
  });
});

describe("reference-style pagination", () => {
  it.each([[1, 20, [1, 2, 3, 4, 5]], [10, 20, [8, 9, 10, 11, 12]], [20, 20, [16, 17, 18, 19, 20]], [1, 3, [1, 2, 3]]])("keeps a consecutive numbered window at page %s", (page, pages, expected) => expect(pageWindow(page as number, pages as number)).toEqual(expected));
  it("renders first/previous/numbered/next/last controls and an arbitrary-page jump", () => {
    const html = renderToStaticMarkup(<Pagination page={3} total={300} pageSize={25} label="candidates" href={(page, size) => `/admin/hr-portal/applications?city=Indore&page=${page}&pageSize=${size}`} />);
    for (const label of ["First page", "Previous page", "Page 1", "Page 5", "Next page", "Last page", "candidates page number"]) expect(html).toContain(`aria-label="${label}"`);
    expect(html).toContain('aria-current="page"'); expect(html).toContain('name="city" value="Indore"'); expect(html).toContain('name="page"');
  });
  it("keeps ID reservation refreshes tied to full record counts, never one page's length", () => {
    const clients = readFileSync("src/app/admin/(protected)/clients/page.tsx", "utf8"), invoices = readFileSync("src/app/admin/(protected)/invoices/page.tsx", "utf8");
    expect(clients).toContain("<CreateClientCard resetKey={total}"); expect(invoices).toContain("resetKey={reservationCount}");
    expect(clients).not.toContain("resetKey={clients.length}"); expect(invoices).not.toContain("resetKey={invoices.length}");
  });
  it("clamps general admin pages and preserves real filters, not stale success notices", () => {
    expect(parseAdminPage({ page: "999", pageSize: "10" }, 27)).toMatchObject({ page: 3, skip: 20, take: 10 });
    expect(adminPageUrl("/admin/projects", { client: "client-id", showArchived: "1", saved: "created" }, 2, 50)).toBe("/admin/projects?client=client-id&showArchived=1&page=2&pageSize=50");
  });
});
describe("India city/town directory", () => {
  const directory = JSON.parse(readFileSync("public/data/india-cities.json", "utf8")) as IndiaCityDirectory;
  it("ships the complete de-duplicated source extract across all states/territories with attribution", () => {
    expect(directory.cities).toHaveLength(directory.count); expect(directory.count).toBeGreaterThan(4000); expect(new Set(directory.cities.map(row => row[1])).size).toBe(36); expect(directory.license).toBe("ODbL-1.0");
  });
  it.each(["Indore", "Jaipur", "Bengaluru", "Mumbai", "Kolkata", "Uttar Pradesh", "Ladakh"])("searches the full directory for %s, not a short preset", query => expect(searchIndiaCities(directory.cities, query).options.length).toBeGreaterThan(0));
  it("caps only visible suggestions, not searchable coverage, and supports missing places", () => {
    expect(searchIndiaCities(directory.cities, "").options).toHaveLength(40); expect(searchIndiaCities(directory.cities, "").total).toBe(directory.count); expect(searchIndiaCities(directory.cities, "Synthetic missing town").total).toBe(0);
  });
});
