import { beforeEach, describe, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({
  user: { id: "operator-test", name: "Operator", email: "operator@example.test", role: "editor", permissions: [] as string[] },
  create: vi.fn(), update: vi.fn(), remove: vi.fn(), audit: vi.fn(), transaction: vi.fn(),
  employee: vi.fn(), client: vi.fn(), candidate: vi.fn(), count: vi.fn(), list: vi.fn(), groups: vi.fn(), raw: vi.fn(),
}));
vi.mock("@/lib/auth", () => ({ getAdminUser: async () => m.user, requireAdmin: async () => m.user }));
vi.mock("next/navigation", () => ({ redirect: (path: string) => { throw Error(`REDIRECT:${path}`); }, notFound: () => { throw Error("NOT_FOUND"); } }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: {
  $transaction: m.transaction, $queryRaw: m.raw,
  projectEnquiry: { findFirst: m.candidate, findMany: m.list, count: m.count, groupBy: m.groups },
  adminOperationalRecord: { count: m.count, findMany: m.list },
} }));
import { PORTALS, RECORD_MODULES, buildAdminNav, recordModule, recordPath } from "@/lib/admin-portals";
import { parseRecordForm, safeRecordUrl } from "@/lib/admin-records";
import { activeAdminHref } from "@/lib/admin-nav-state";
import { saveOperationalRecord, deleteOperationalRecord } from "@/app/admin/(protected)/operational-actions";
import { OperationalRegister } from "@/components/admin/operational-register";
import { EnquiryInbox } from "@/components/admin/enquiry-inbox";
import { EnquiryDetail } from "@/components/admin/enquiry-detail";
import { CAREER_ENQUIRY_WHERE, SALES_ENQUIRY_WHERE } from "@/lib/admin-enquiries";

function form(portal = "client", key = "contacts") {
  const definition = recordModule(portal, key)!;
  const data = new FormData();
  for (const [k, v] of Object.entries({ portal, module: key, title: "Test operational record", status: definition.statuses[0], subjectId: "subject-test-id", owner: "Operator", startDate: "2026-01-01", dueDate: "2026-01-31" })) data.set(k, v);
  for (const field of definition.fields) {
    const value = field.type === "number" ? "12.50" : field.type === "date" ? "2026-01-20" : field.type === "url" ? "https://documents.example.test/private" : field.type === "email" ? "contact@example.test" : field.type === "select" ? field.options![0] : "Verified test value";
    data.set(`data.${field.key}`, value);
  }
  return data;
}
const tx = {
  employee: { findUnique: m.employee }, clientUser: { findUnique: m.client }, projectEnquiry: { findFirst: m.candidate },
  adminOperationalRecord: { create: m.create, updateMany: m.update, deleteMany: m.remove }, auditLog: { create: m.audit },
};
beforeEach(() => {
  vi.clearAllMocks(); m.user.role = "editor"; m.user.permissions = [];
  m.transaction.mockImplementation(async fn => fn(tx));
  for (const mock of [m.employee, m.client, m.candidate]) mock.mockResolvedValue({ id: "subject-test-id", name: "Linked subject" });
  m.create.mockResolvedValue({ id: "record-test-id" }); m.update.mockResolvedValue({ count: 1 }); m.remove.mockResolvedValue({ count: 1 });
  m.count.mockResolvedValue(0); m.list.mockResolvedValue([]); m.groups.mockResolvedValue([]); m.raw.mockResolvedValue([]);
});

describe("department information architecture", () => {
  it("gives every operational register one owning portal and unique route", () => {
    expect(RECORD_MODULES).toHaveLength(16);
    expect(new Set(RECORD_MODULES.map(d => recordPath(d.portal, d.key))).size).toBe(16);
    const nav = buildAdminNav({ role: "admin" });
    expect(nav.slice(0, 5).map(n => n.label)).toEqual(["Dashboard", "Website analytics", "HR Portal", "Client Portal", "Employee Portal"]);
    const links = nav.flatMap(n => n.items ?? (n.href ? [{ href: n.href }] : []));
    expect(new Set(links.map(l => l.href)).size).toBe(links.length);
    expect(nav.find(n => n.key === "content")!.items!.some(l => l.href.includes("/careers"))).toBe(false);
    expect(nav.find(n => n.key === "hr")!.items!.some(l => l.href === "/admin/content/careers")).toBe(true);
    expect(nav.find(n => n.key === "employee")!.items!.some(l => l.href.includes("email"))).toBe(false);
  });
  it("keeps legacy enquiry-only candidate access discoverable without granting HR registers", () => {
    const nav = buildAdminNav({ role: "editor", permissions: ["enquiries"] });
    const hr = nav.find(n => n.key === "hr")!;
    expect(hr.items!.map(l => l.href)).toEqual(["/admin/enquiries?type=Careers"]);
    expect(nav.find(n => n.key === "client")!.items!.map(l => l.href)).toEqual(["/admin/enquiries?type=Client"]);
  });
  it("does not expose department data to content-only or ungranted editors", () => {
    expect(JSON.stringify(buildAdminNav({ role: "editor", permissions: [] }))).not.toContain("records/");
    const nav = buildAdminNav({ role: "editor", permissions: ["content"] });
    expect(nav.find(n => n.key === "hr")!.items!.map(l => l.href)).toEqual(["/admin/content/careers"]);
    expect(nav.some(n => n.key === "employee")).toBe(false);
  });
  it.each([
    ["/admin/employees/new", "", "/admin/employees/new"],
    ["/admin/hr-portal", "tab=scheduled", "/admin/hr-portal?tab=scheduled"],
    ["/admin/emails", "dept=hr", "/admin/emails?dept=hr"],
    ["/admin/enquiries", "type=Careers&page=2", "/admin/enquiries?type=Careers"],
    ["/admin/settings/payments", "", "/admin/settings/payments"],
    ["/admin/enquiries/sales-detail-id", "", "/admin/enquiries?type=Client"],
  ])("marks only the most specific destination active: %s?%s", (path, query, target) => {
    const nav = buildAdminNav({ role: "admin" });
    const all = nav.flatMap(n => n.items ?? (n.href ? [{ href: n.href }] : []));
    // Legacy links are deliberately supported even when not in full-admin navigation.
    all.push({ href: "/admin/enquiries?type=Careers" });
    expect(activeAdminHref(all, path, query)).toBe(target);
  });
});

describe("operational schemas", () => {
  it.each(RECORD_MODULES)("validates the complete $portal/$key form and strips unconfigured payload", definition => {
    const data = form(definition.portal, definition.key); data.set("data.password", "must never persist");
    const result = parseRecordForm(definition, data);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.data).not.toHaveProperty("password");
  });
  it.each(["2026-02-30", "not-a-date", "2300-01-01"])("rejects invalid calendar input %s", value => {
    const data = form(); data.set("startDate", value); expect(parseRecordForm(recordModule("client", "contacts")!, data).success).toBe(false);
  });
  it("rejects reversed periods, forged status and missing subject", () => {
    const definition = recordModule("client", "contacts")!;
    for (const [key, value] of [["dueDate", "2025-01-01"], ["status", "auto_paid"], ["subjectId", ""]]) {
      const data = form(); data.set(key, value); expect(parseRecordForm(definition, data).success).toBe(false);
    }
  });
  it("allows unlinked hiring requests only, not unlinked offers", () => {
    for (const key of ["requisitions", "offers"]) {
      const data = form("hr", key); data.set("subjectId", ""); expect(parseRecordForm(recordModule("hr", key)!, data).success).toBe(key === "requisitions");
    }
  });
  it.each(["javascript:alert(1)", "http://example.test", "https://user:secret@example.test/file"])("refuses unsafe document links %s", value => expect(safeRecordUrl(value)).toBeNull());
  it.each(["-1", "1e6", "Infinity", "1.999"])("rejects unsafe monetary or numerical input %s", value => {
    const data = form("employee", "expenses"); data.set("data.amount", value); expect(parseRecordForm(recordModule("employee", "expenses")!, data).success).toBe(false);
  });
});

describe("record ownership and mutations", () => {
  it.each(RECORD_MODULES)("denies ungranted $portal/$key actions before transaction or subject reads", async definition => {
    await expect(saveOperationalRecord(form(definition.portal, definition.key))).rejects.toThrow("denied=");
    expect(m.transaction).not.toHaveBeenCalled(); expect(m.candidate).not.toHaveBeenCalled();
  });
  it.each(RECORD_MODULES)("persists $portal/$key only in its own namespace with atomic audit", async definition => {
    m.user.permissions = [PORTALS[definition.portal].section];
    await expect(saveOperationalRecord(form(definition.portal, definition.key))).rejects.toThrow("saved=1");
    expect(m.create).toHaveBeenCalledWith({ data: expect.objectContaining({ portal: definition.portal, module: definition.key, subjectLabel: "Linked subject", createdBy: m.user.id }) });
    expect(m.audit).toHaveBeenCalledOnce();
    const read = definition.subject === "candidate" ? m.candidate : definition.subject === "client" ? m.client : m.employee;
    expect(read).toHaveBeenCalledOnce();
  });
  it("a forged portal/module pair cannot mutate another department's register", async () => {
    m.user.permissions = ["hr-portal"];
    const data = form(); data.set("portal", "hr");
    await expect(saveOperationalRecord(data)).rejects.toThrow("Unknown%20register"); expect(m.transaction).not.toHaveBeenCalled();
  });
  it("never accepts a sales enquiry as the candidate subject", async () => {
    m.user.permissions = ["hr-portal"]; m.candidate.mockResolvedValue(null);
    await expect(saveOperationalRecord(form("hr", "offers"))).rejects.toThrow("existing%20record");
    expect(m.candidate).toHaveBeenCalledWith({ where: { AND: [CAREER_ENQUIRY_WHERE, { id: "subject-test-id" }] }, select: expect.any(Object) });
    expect(m.create).not.toHaveBeenCalled(); expect(m.audit).not.toHaveBeenCalled();
  });
  it("updates are versioned and constrained to portal/module/id", async () => {
    m.user.permissions = ["clients"]; const data = form(); data.set("id", "record-test-id"); data.set("version", "7");
    await expect(saveOperationalRecord(data)).rejects.toThrow("saved=1");
    expect(m.update).toHaveBeenCalledWith({ where: { id: "record-test-id", portal: "client", module: "contacts", version: 7 }, data: expect.objectContaining({ version: { increment: 1 } }) });
  });
  it("stale or foreign record updates fail without writing an audit success", async () => {
    m.user.permissions = ["clients"]; m.update.mockResolvedValue({ count: 0 }); const data = form(); data.set("id", "record-test-id"); data.set("version", "1");
    await expect(saveOperationalRecord(data)).rejects.toThrow("record%20changed"); expect(m.audit).not.toHaveBeenCalled();
  });
  it("editors cannot delete and administrators must confirm, including version", async () => {
    m.user.permissions = ["clients"]; const data = form(); data.set("id", "record-test-id"); data.set("version", "2"); data.set("confirm", "DELETE");
    await expect(deleteOperationalRecord(data)).rejects.toThrow("Administrator%20required"); expect(m.transaction).not.toHaveBeenCalled();
    m.user.role = "admin"; await expect(deleteOperationalRecord(data)).rejects.toThrow("deleted=1");
    expect(m.remove).toHaveBeenCalledWith({ where: { id: "record-test-id", portal: "client", module: "contacts", version: 2 } });
  });
  it("rejects unknown registers before private queries even for an administrator", async () => {
    m.user.role = "admin"; await expect(OperationalRegister({ portal: "hr", moduleKey: "payroll", search: {} })).rejects.toThrow("NOT_FOUND"); expect(m.count).not.toHaveBeenCalled();
  });
});

describe("department enquiry data isolation", () => {
  it("filters sales before count, pagination and status totals, with no all-record scan", async () => {
    m.user.permissions = ["enquiries"]; m.count.mockResolvedValue(45);
    await EnquiryInbox({ sp: { type: "Client", page: "2", q: "test" } });
    expect(m.count).toHaveBeenCalledWith({ where: expect.objectContaining({ AND: [SALES_ENQUIRY_WHERE] }) });
    expect(m.list).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ AND: [SALES_ENQUIRY_WHERE] }), skip: 25, take: 25 }));
    expect(m.list).toHaveBeenCalledOnce();
  });
  it("HR-only list cannot expand into sales using the type query", async () => {
    m.user.permissions = ["hr-portal"]; await EnquiryInbox({ scope: "hr", sp: { type: "Client" } });
    expect(m.raw).toHaveBeenCalledTimes(4);
    expect(m.raw.mock.calls[3][0].sql).toContain("project_type IN (");
    expect(m.raw.mock.calls[3][0].values).not.toContain("Client");
    expect(m.list).not.toHaveBeenCalled();
  });
  it("HR candidate detail refuses an unrelated ID before loading notes, replies or audit", async () => {
    m.user.permissions = ["hr-portal"]; m.candidate.mockResolvedValue(null);
    await expect(EnquiryDetail({ scope: "hr", id: "sales-enquiry-id" })).rejects.toThrow("NOT_FOUND");
    expect(m.candidate).toHaveBeenCalledWith({ where: { AND: [CAREER_ENQUIRY_WHERE, { id: "sales-enquiry-id" }] } });
    expect(m.list).not.toHaveBeenCalled();
  });
});
