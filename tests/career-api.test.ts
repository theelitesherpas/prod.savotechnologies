import { beforeEach, describe, expect, it, vi } from "vitest";
const { create, mail } = vi.hoisted(() => ({ create: vi.fn(), mail: vi.fn() }));
vi.mock("@/lib/business-ids", async original => ({ ...await original<typeof import("@/lib/business-ids")>(), businessTransaction: async (work: (tx: unknown) => Promise<unknown>) => work({projectEnquiry:{create}}), generateBusinessId: vi.fn(async () => "STPLLD07321") }));
vi.mock("@/lib/prisma", () => ({ prisma: { projectEnquiry: { create } } }));
vi.mock("@/lib/mail", () => ({ sendTemplateNow: mail, teamEmail: () => "test@example.com" }));
vi.mock("@/lib/captcha", () => ({ enforceCaptcha: vi.fn(async () => ({ ok: true })), recordSubmission: vi.fn() }));
vi.mock("@/lib/rate-limit", () => ({ rateLimit: () => ({ ok: true }) }));
vi.mock("@/lib/livechat/pubsub", () => ({ publish: vi.fn() }));
import { POST } from "../src/app/api/enquiries/route";
const base = { name: "Test Applicant", email: "test@example.com", projectType: "General application", message: "A sufficient test application introduction.", source: "careers:hr-intern" };
const details = { form: "careers", role: "HR Intern", city: "Test City", skills: ["CV screening"], experience: "Fresher", notice: "To be discussed", consent: true };
const request = (body: unknown) => new Request("http://test.local/api/enquiries", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

describe("Career-only API requirements (all persistence and mail mocked)", () => {
  beforeEach(() => { vi.clearAllMocks(); create.mockResolvedValue({}); });
  it("blocks missing skills and availability before storage or mail", async () => { const res = await POST(request({ ...base, details: { ...details, skills: [], experience: "", notice: "" } })); expect(res.status).toBe(400); const json = await res.json(); expect(Object.keys(json.careerFieldErrors)).toEqual(["skills", "experience", "notice"]); expect(create).not.toHaveBeenCalled(); expect(mail).not.toHaveBeenCalled(); });
  it("requires consent on the server and does not store unconfirmed applications", async () => { const res = await POST(request({ ...base, details: { ...details, consent: false } })); expect(res.status).toBe(400); expect(create).not.toHaveBeenCalled(); expect(mail).not.toHaveBeenCalled(); });
  it("does not let a career source omit the details object", async () => { expect((await POST(request(base))).status).toBe(400); expect(create).not.toHaveBeenCalled(); });
  it("does not let career project types remove both form and source flags", async () => { expect((await POST(request({ ...base, source: "homepage" }))).status).toBe(400); expect(create).not.toHaveBeenCalled(); });
  it("also validates a careers form when its source differs", async () => { expect((await POST(request({ ...base, source: "changed-source", details: { ...details, skills: [] } }))).status).toBe(400); expect(create).not.toHaveBeenCalled(); });
  it("stores freshers' selected skills and uncertain start availability", async () => { const res = await POST(request({ ...base, details })); expect(res.status).toBe(200); expect(create.mock.calls[0][0].data.data).toMatchObject(details); expect(mail).toHaveBeenCalledTimes(2); });
  it("does not add career requirements to project or contact questions", async () => { for (const body of [{ ...base, source: "homepage", projectType: "Website" }, { ...base, source: "contact", projectType: "Careers" }]) expect((await POST(request(body))).status).toBe(200); expect(create).toHaveBeenCalledTimes(2); });
  it("preserves the silent honeypot response", async () => { expect((await POST(request({ ...base, website: "test-bot" }))).status).toBe(200); expect(create).not.toHaveBeenCalled(); expect(mail).not.toHaveBeenCalled(); });
});
