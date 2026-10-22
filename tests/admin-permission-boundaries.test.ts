import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { CAREERS_TYPES } from "@/constants/careers";

const state = vi.hoisted(() => ({
  user: null as { id: string; email: string; name: string; role: "admin" | "editor"; permissions: unknown } | null,
  meetingList: vi.fn(), meetingFind: vi.fn(), meetingUpdate: vi.fn(), meetingDelete: vi.fn(),
  clients: vi.fn(), content: vi.fn(), services: vi.fn(), industries: vi.fn(),
  enquiries: vi.fn(), enquiryFind: vi.fn(), enquiryUpdate: vi.fn(),
  createMeeting: vi.fn(), sendInvitation: vi.fn(), audit: vi.fn(), mail: vi.fn(),
}));
vi.mock("@/lib/auth", () => ({
  getAdminUser: async () => state.user,
  requireAdmin: async () => { if (!state.user) throw new Error("UNAUTHORIZED"); return state.user; },
}));
vi.mock("@/lib/prisma", () => ({ prisma: {
  meeting: { count: vi.fn(async () => 0), groupBy: vi.fn(async () => []), findMany: state.meetingList, findUnique: state.meetingFind, update: state.meetingUpdate, delete: state.meetingDelete },
  clientUser: { findMany: state.clients }, contentItem: { findMany: state.content },
  service: { findMany: state.services }, industry: { findMany: state.industries },
  projectEnquiry: { findMany: state.enquiries, findUnique: state.enquiryFind, update: state.enquiryUpdate },
  $transaction: async (fn: (tx: unknown) => unknown) => fn({ projectEnquiry: { updateMany: state.enquiryUpdate }, auditLog: { create: state.audit } }),
} }));
vi.mock("@/lib/rate-limit", () => ({ rateLimit: () => ({ ok: true, remaining: 10, retryAfterSeconds: 0 }) }));
vi.mock("@/lib/meeting/service", () => ({
  createMeeting: state.createMeeting, sendInvitation: state.sendInvitation,
  generateICS: () => "calendar", confirmMeeting: vi.fn(), requestReschedule: vi.fn(),
  updateMeetingStatus: vi.fn(), regenerateLink: vi.fn(), extendExpiration: vi.fn(),
}));
vi.mock("@/lib/audit", () => ({ audit: state.audit }));
vi.mock("@/lib/mail", () => ({ sendTemplateNow: state.mail }));
vi.mock("next/navigation", () => ({ redirect: (url: string) => { throw new Error(`REDIRECT:${url}`); } }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { canAccess, enforcePathAccess, pathToSection } from "@/lib/permissions";
import { canReceiveAdminEvent } from "@/lib/livechat/admin-guard";
import * as meetingList from "@/app/api/admin/meetings/route";
import * as meetingDetail from "@/app/api/admin/meetings/[id]/route";
import { GET as search } from "@/app/api/admin/search/route";
import * as career from "@/app/admin/(protected)/enquiries/career-actions";
import AdminDashboard from "@/app/admin/(protected)/page";

function user(role: "admin" | "editor" = "editor", permissions: string[] = []) {
  return { id: "operator-test", email: "operator@example.test", name: "Test Operator", role, permissions };
}
function req(method = "GET", data?: unknown) {
  return new Request("https://example.test/api/admin/meetings/test", {
    method, ...(data === undefined ? {} : { body: JSON.stringify(data), headers: { "content-type": "application/json" } }),
  });
}
const context = () => ({ params: Promise.resolve({ id: "meeting-test" }) });
const queries = () => [state.meetingList, state.meetingFind, state.meetingUpdate, state.meetingDelete, state.clients, state.content, state.services, state.industries, state.enquiries, state.enquiryFind, state.enquiryUpdate];
beforeEach(() => {
  vi.clearAllMocks(); state.user = user();
  for (const mock of queries()) mock.mockResolvedValue([]);
  state.enquiryUpdate.mockResolvedValue({ count: 1 });
  state.sendInvitation.mockResolvedValue({ ok: true });
  state.createMeeting.mockResolvedValue({ meeting: { id: "meeting-created" } });
});

describe("admin route section enforcement", () => {
  const routes = [
    () => meetingList.GET(req()), () => meetingList.POST(req("POST", { clientName: "Client", title: "Planning" })),
    () => meetingDetail.GET(req(), context()), () => meetingDetail.PUT(req("PUT", { action: "send" }), context()),
    () => meetingDetail.DELETE(req("DELETE"), context()),
  ];
  it.each(routes)("denies a logged-in editor with no client grant before DB/service calls", async run => {
    expect((await run()).status).toBe(403);
    for (const query of queries()) expect(query).not.toHaveBeenCalled();
    expect(state.createMeeting).not.toHaveBeenCalled(); expect(state.sendInvitation).not.toHaveBeenCalled();
  });
  it.each(routes)("denies missing sessions before DB/service calls", async run => {
    state.user = null;
    expect((await run()).status).toBe(401);
    for (const query of queries()) expect(query).not.toHaveBeenCalled();
  });
  it("preserves granted client listing and creation", async () => {
    state.user = user("editor", ["clients"]);
    expect((await meetingList.GET(req())).status).toBe(200);
    expect(state.meetingList).toHaveBeenCalledTimes(1);
    expect((await meetingList.POST(req("POST", { clientName: "Client", title: "Planning" }))).status).toBe(200);
    expect(state.createMeeting).toHaveBeenCalledTimes(1);
  });
  it("preserves granted send action but refuses permanent deletion to editors", async () => {
    state.user = user("editor", ["clients"]);
    expect((await meetingDetail.PUT(req("PUT", { action: "send" }), context())).status).toBe(200);
    expect(state.sendInvitation).toHaveBeenCalledWith("meeting-test", "Test Operator");
    expect((await meetingDetail.PUT(req("PUT", { action: "permanent_delete" }), context())).status).toBe(403);
    expect(state.meetingDelete).not.toHaveBeenCalled();
  });
  it("retains administrator permanent deletion", async () => {
    state.user = user("admin");
    expect((await meetingDetail.PUT(req("PUT", { action: "permanent_delete" }), context())).status).toBe(200);
    expect(state.meetingDelete).toHaveBeenCalledTimes(1);
  });
  it.each([null, [], "data"])("rejects non-object JSON mutation payload %s", async data => {
    state.user = user("admin");
    expect((await meetingList.POST(req("POST", data))).status).toBe(400);
    expect((await meetingDetail.PUT(req("PUT", data), context())).status).toBe(400);
    expect(state.createMeeting).not.toHaveBeenCalled();
  });
  it("maps meeting pages with query strings to the client grant", async () => {
    expect(pathToSection("/admin/meetings?filter=all")).toBe("clients");
    await expect(enforcePathAccess("/admin/meetings?filter=all")).rejects.toThrow("REDIRECT:/admin?denied=Client%20portal");
  });
  it("unknown roles never gain editor grants", () => {
    expect(canAccess({ role: "unexpected", permissions: ["clients"] }, "clients")).toBe(false);
  });
});

describe("search, dashboard and notifications", () => {
  it("never queries hidden sections for an unprivileged editor", async () => {
    const response = await search(new Request("https://example.test/api/admin/search?q=client"));
    expect(await response.json()).toEqual({ ok: true, groups: [] });
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    for (const query of queries()) expect(query).not.toHaveBeenCalled();
  });
  it("content editors can search content but not enquiries", async () => {
    state.user = user("editor", ["content"]);
    state.services.mockResolvedValue([{ id: "service-id", title: "Web", slug: "web" }]);
    const response = await search(new Request("https://example.test/api/admin/search?q=web"));
    expect((await response.json()).groups[0].label).toBe("Services");
    expect(state.content).toHaveBeenCalledOnce(); expect(state.enquiries).not.toHaveBeenCalled();
  });
  it("enquiry editors can search enquiries but not unpublished content", async () => {
    state.user = user("editor", ["enquiries"]);
    state.enquiries.mockResolvedValue([{ id: "enquiry-id", name: "Client", email: "test@example.test", projectType: "Website" }]);
    const response = await search(new Request("https://example.test/api/admin/search?q=client"));
    expect((await response.json()).groups[0].label).toBe("Enquiries");
    expect(state.enquiries).toHaveBeenCalledOnce(); expect(state.content).not.toHaveBeenCalled();
  });
  it("bounds search query length before querying", async () => {
    state.user = user("admin");
    expect((await search(new Request(`https://example.test/api/admin/search?q=${"x".repeat(101)}`))).status).toBe(400);
    for (const query of queries()) expect(query).not.toHaveBeenCalled();
  });
  it("renders an editor workspace without fetching cross-department data", async () => {
    state.user = user("editor", ["content"]);
    const html = renderToStaticMarkup(await AdminDashboard());
    expect(html).toContain("Your workspace"); expect(html).toContain('/admin/content');
    expect(html).not.toContain('/admin/enquiries'); expect(html).not.toContain("Payments");
    for (const query of queries()) expect(query).not.toHaveBeenCalled();
  });
  it("chat-only grant cannot consume email or enquiry notification PII", () => {
    const operator = user("editor", ["live-chat"]);
    expect(canReceiveAdminEvent(operator, { type: "email.new" })).toBe(false);
    expect(canReceiveAdminEvent(operator, { type: "enquiry.new" })).toBe(false);
    expect(canReceiveAdminEvent(operator, { type: "message.new" })).toBe(true);
    expect(canReceiveAdminEvent(user("admin"), { type: "email.new" })).toBe(true);
    expect(canReceiveAdminEvent(user("editor", ["emails"]), { type: "email.new" })).toBe(true);
  });
});

describe("career Server Actions", () => {
  const actions = [career.shortlistEnquiryAction, career.rejectEnquiryAction, career.scheduleInterviewAction, career.requestDocumentsAction, career.markHiredAction, career.resetCareerStatusAction, career.saveCandidateContactAction];
  function form() { const data = new FormData(); data.set("id", "enquiry-test-id"); return data; }
  it.each(actions)("denies unrelated editors before any read/write/email", async action => {
    state.user = user("editor", ["content"]);
    await expect(action(form())).rejects.toThrow("REDIRECT:/admin?denied=Recruitment");
    expect(state.enquiryFind).not.toHaveBeenCalled(); expect(state.enquiryUpdate).not.toHaveBeenCalled();
    expect(state.mail).not.toHaveBeenCalled(); expect(state.audit).not.toHaveBeenCalled();
  });
  it.each(["enquiries", "hr-portal"])("preserves authorised shortlist via %s grant", async section => {
    state.user = user("editor", [section]);
    state.enquiryFind.mockResolvedValue({ id: "enquiry-test-id", updatedAt: new Date(), status: "new", careerStatus: null, projectType: CAREERS_TYPES[0], name: "Applicant", email: "applicant@example.test", data: { role: "Engineer" } });
    await expect(career.shortlistEnquiryAction(form())).rejects.toThrow("career=shortlisted");
    expect(state.enquiryUpdate).toHaveBeenCalledOnce(); expect(state.mail).toHaveBeenCalledOnce();
  });
  it("recruitment grant cannot reset unrelated sales enquiries", async () => {
    state.user = user("editor", ["hr-portal"]);
    state.enquiryFind.mockResolvedValue({ projectType: "Website" });
    await expect(career.resetCareerStatusAction(form())).rejects.toThrow("Enquiry%20not%20found");
    expect(state.enquiryUpdate).not.toHaveBeenCalled(); expect(state.mail).not.toHaveBeenCalled();
  });
});
