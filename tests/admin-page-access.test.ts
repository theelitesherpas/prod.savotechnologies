import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import ts from "typescript";

const m = vi.hoisted(() => ({
  user: null as { id: string; name: string; email: string; role: string; permissions: unknown } | null,
  queries: new Map<string, ReturnType<typeof vi.fn>>(),
}));
vi.mock("@/lib/auth", () => ({
  getAdminUser: async () => m.user,
  requireAdmin: async () => { if (!m.user) throw Error("UNAUTHORIZED"); return m.user; },
  requireAdminRole: async () => { if (m.user?.role !== "admin") throw Error("FORBIDDEN"); return m.user; },
  hashPassword: vi.fn(), verifyPassword: vi.fn(),
}));
vi.mock("@/lib/prisma", () => ({ prisma: new Proxy({}, {
  get: (_, model: string) => new Proxy({}, { get: (_, method: string) => {
    const key = `${model}.${method}`;
    if (!m.queries.has(key)) m.queries.set(key, vi.fn(async () => method === "count" ? 0 : method.startsWith("find") && method !== "findMany" ? null : []));
    return m.queries.get(key);
  } }),
}) }));
vi.mock("next/navigation", () => ({ redirect: (p: string) => { throw Error(`REDIRECT:${p}`); }, notFound: () => { throw Error("NOT_FOUND"); } }));
vi.mock("next/headers", () => ({ headers: async () => new Headers({ "x-pathname": "/admin/my-profile" }) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn(), unstable_cache: (fn: unknown) => fn }));
vi.mock("@/lib/mail", () => ({ sendTemplateNow: vi.fn(), sendMailNow: vi.fn(), sendMail: vi.fn(), teamEmail: () => "test@example.test" }));

import { allowedComposeDepts, pathToSection, requireAdminPage, SECTIONS } from "@/lib/permissions";
import Compose from "@/app/admin/(protected)/email-compose/page";
import { getAdminItems } from "@/lib/content-items";
import { nextEmployeeCode } from "@/lib/employees";

const modules = import.meta.glob("../src/app/admin/**/page.tsx") as Record<string, () => Promise<{ default: (props: never) => Promise<unknown> }>>;
const pages = Object.entries(modules).filter(([file]) => file.includes("/(protected)/")).map(([file, load]) => ({
  file, load, path: "/admin" + file.slice("../src/app/admin/(protected)".length).replace(/\/page\.tsx$/, ""),
}));
const props = () => ({ params: Promise.resolve({ id: "sentinel-record", collection: "insights" }), searchParams: Promise.resolve({}) });
function actor(permissions: string[] = [], role = "editor") { return { id: "operator", name: "Operator", email: "operator@example.test", role, permissions }; }
function noQueries() { for (const query of m.queries.values()) expect(query).not.toHaveBeenCalled(); }
beforeEach(() => {
  m.user = actor();
  for (const [key, query] of m.queries) {
    const method = key.split(".")[1];
    query.mockReset().mockResolvedValue(method === "count" ? 0 : method.startsWith("find") && method !== "findMany" ? null : []);
  }
});

describe("all protected admin leaves authorize independently of their layout", () => {
  it("covers all protected leaves and keeps an awaited page-owned guard before data work", () => {
    expect(pages).toHaveLength(41);
    for (const { file, path } of pages) {
      const source = readFileSync(file.replace(/^\.\.\//, ""), "utf8");
      const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
      const fn = ast.statements.find(n => ts.isFunctionDeclaration(n) && n.modifiers?.some(x => x.kind === ts.SyntaxKind.DefaultKeyword));
      expect(fn && ts.isFunctionDeclaration(fn) && fn.body).toBeTruthy();
      const body = (fn as ts.FunctionDeclaration).body!;
      const first = body.statements[0].getText(ast);
      if (path === "/admin/email-compose") {
        expect(body.statements.slice(0, 4).map(s => s.getText(ast)).join("\n")).toContain("await requireAdminPage");
      } else expect(first).toContain(`await requireAdminPage("${path}")`);
    }
  });
  it.each(pages)("anonymous direct child $path never queries private records", async ({ load }) => {
    m.user = null;
    const Page = (await load()).default;
    await expect(Page(props() as never)).rejects.toThrow("REDIRECT:/admin/login");
    noQueries();
  });
  it.each(pages.filter(p => !["/admin", "/admin/my-profile"].includes(p.path)))("ungranted child $path ignores a forged self-profile path", async ({ load }) => {
    const Page = (await load()).default;
    await expect(Page(props() as never)).rejects.toThrow("REDIRECT:/admin?denied=");
    noQueries();
  });
  it.each(pages.filter(p => p.path !== "/admin/email-compose"))("administrator can pass the leaf's fixed policy $path", async ({ path }) => {
    m.user = actor([], "admin");
    expect(await requireAdminPage(path)).toBe(m.user);
  });
  it.each(SECTIONS)("only the corresponding $key grant passes its page policy", async ({ key }) => {
    const matches = pages.filter(p => pathToSection(p.path) === key);
    expect(matches.length).toBeGreaterThan(0);
    m.user = actor([key]);
    for (const { path } of matches) expect(await requireAdminPage(path)).toBe(m.user);
  });
  it("content inventory follows its Audit navigation grant, not the content prefix", async () => {
    m.user = actor(["content"]);
    expect(pathToSection("/admin/content-inventory")).toBe("audit");
    await expect(requireAdminPage("/admin/content-inventory")).rejects.toThrow("denied=Audit%20log");
    m.user = actor(["audit"]); expect(await requireAdminPage("/admin/content-inventory")).toBe(m.user);
  });
  it.each(["/admin/settings-extra", "/admin/contention", "/admin/new-private-section"])("unmapped policy %s fails closed even for administrators", async path => {
    m.user = actor([], "admin");
    expect(pathToSection(path)).toBeNull();
    await expect(requireAdminPage(path)).rejects.toThrow("Unmapped%20section");
  });
  it("unknown roles and malformed permission lists fail closed", async () => {
    m.user = actor(["employees", "clients"], "unknown");
    expect(allowedComposeDepts(m.user)).toEqual([]);
    await expect(requireAdminPage("/admin")).rejects.toThrow("/admin/login");
    m.user = { ...actor(), permissions: "clients" };
    await expect(requireAdminPage("/admin/clients")).rejects.toThrow("denied=");
  });
});

describe("department DTOs and protected data readers", () => {
  it.each(["hr", "hello"])("refuses ungranted %s compose before recipient queries", async dept => {
    await expect(Compose({ searchParams: Promise.resolve({ dept }) })).rejects.toThrow("denied=Email%20compose"); noQueries();
  });
  it.each(["clients", "employees"])("single %s grant cannot open unscoped compose", async section => {
    m.user = actor([section]); await expect(Compose({ searchParams: Promise.resolve({}) })).rejects.toThrow("denied="); noQueries();
  });
  it.each(["bad", "hr&dept=hello"])("untrusted dept %s cannot expand an editor's scope", async dept => {
    m.user = actor(["clients", "employees"]); await expect(Compose({ searchParams: Promise.resolve({ dept }) })).rejects.toThrow("denied="); noQueries();
  });
  it.each([{ dept: "hello", own: "clients", other: "employee.findMany", query: "clientUser.findMany" }, { dept: "hr", own: "employees", other: "clientUser.findMany", query: "employee.findMany" }])("$dept compose never queries/serializes the other department", async ({ dept, own, other, query }) => {
    m.user = actor([own]);
    const otherQuery = m.queries.get(other) ?? vi.fn();
    otherQuery.mockResolvedValue([{ name: "OTHER_DEPARTMENT_PRIVATE_SENTINEL", ctc: 999999, email: "private@example.test" }]);
    m.queries.set(other, otherQuery);
    const tree = await Compose({ searchParams: Promise.resolve({ dept }) });
    expect(otherQuery).not.toHaveBeenCalled(); expect(m.queries.get(query)).toHaveBeenCalledOnce();
    expect(JSON.stringify(tree)).not.toContain("OTHER_DEPARTMENT_PRIVATE_SENTINEL");
  });
  it("retains both recipient pools for an explicitly dual-granted unscoped composer", async () => {
    m.user = actor(["clients", "employees"]); await Compose({ searchParams: Promise.resolve({}) });
    expect(m.queries.get("employee.findMany")).toHaveBeenCalledOnce(); expect(m.queries.get("clientUser.findMany")).toHaveBeenCalledOnce();
  });
  it("recruitment query requires the canonical category as well as its JSON marker", async () => {
    m.user = actor(["hr-portal"]);
    const { default: HR } = await import("@/app/admin/(protected)/hr-portal/page"); await HR({ searchParams: Promise.resolve({}) });
    expect(m.queries.get("projectEnquiry.findMany")!.mock.calls[0][0].where).toMatchObject({ projectType: { in: expect.any(Array) }, data: { path: ["form"], equals: "careers" } });
  });
  it("an ungranted shell neither queries private counts nor mounts a chat subscription", async () => {
    const { default: Layout } = await import("@/app/admin/(protected)/layout");
    const tree = await Layout({ children: null }); noQueries();
    expect(JSON.stringify(tree)).not.toContain("/admin/emails");
    expect(tree.props.children[0]).toBeNull();
  });
  it("shell queries only granted client counts and filters recruitment/bug navigation by their actual grants", async () => {
    m.user = actor(["clients", "hr-portal", "bug-reports"]);
    const { default: Layout } = await import("@/app/admin/(protected)/layout");
    const tree = await Layout({ children: null });
    const nav = JSON.stringify(tree.props.nav);
    expect(nav).toContain("/admin/bug-reports"); expect(nav).toContain("/admin/hr-portal");
    expect(nav).not.toContain("dept=hr"); expect(nav).not.toContain("/admin/emails");
    const allowed = new Set(["meeting.count", "clientUser.count", "clientProject.count", "invoice.count"]);
    for (const [key, query] of m.queries) if (!allowed.has(key)) expect(query).not.toHaveBeenCalled();
  });
  it("hidden content DAL denies without a content grant", async () => {
    await expect(getAdminItems("insights")).rejects.toThrow("denied=Content"); noQueries();
  });
  it("employee-code DAL denies without an employee grant", async () => {
    await expect(nextEmployeeCode()).rejects.toThrow("denied=Employee%20portal"); noQueries();
  });
  it("preserves authorised hidden-content and employee-code reads", async () => {
    m.user = actor(["content", "employees"]); await getAdminItems("insights"); expect(await nextEmployeeCode()).toBe("STPL0301IN");
    expect(m.queries.get("contentItem.findMany")!.mock.calls[0][0].where).toEqual({ collection: "insights" });
  });
});
