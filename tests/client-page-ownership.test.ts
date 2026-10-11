import { beforeEach, describe, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({ client: null as { id: string; name: string } | null, projects: vi.fn(), project: vi.fn(), invoices: vi.fn() }));
vi.mock("@/lib/client-auth", () => ({ getClientUser: async () => m.client }));
vi.mock("@/lib/prisma", () => ({ prisma: { clientProject: { findMany: m.projects, findFirst: m.project }, invoice: { findMany: m.invoices } } }));
vi.mock("next/navigation", () => ({ redirect: (p: string) => { throw Error(`REDIRECT:${p}`); }, notFound: () => { throw Error("NOT_FOUND"); } }));
import Dashboard from "@/app/portal/(app)/dashboard/page";
import Projects from "@/app/portal/(app)/projects/page";
import Project from "@/app/portal/(app)/projects/[id]/page";
import Invoices from "@/app/portal/(app)/invoices/page";
const pages = [() => Dashboard(), () => Projects(), () => Project({ params: Promise.resolve({ id: "foreign-project" }) }), () => Invoices()];
beforeEach(() => { vi.clearAllMocks(); m.client = { id: "client-a", name: "Client A" }; m.projects.mockResolvedValue([]); m.project.mockResolvedValue(null); m.invoices.mockResolvedValue([]); });
describe("client leaves keep ownership checks outside the layout", () => {
  it.each(pages)("anonymous leaf never reads a project/invoice", async page => {
    m.client = null; await expect(page()).rejects.toThrow("REDIRECT:/portal");
    expect(m.projects).not.toHaveBeenCalled(); expect(m.project).not.toHaveBeenCalled(); expect(m.invoices).not.toHaveBeenCalled();
  });
  it("overview scopes both finance and projects to the current client", async () => {
    await Dashboard(); expect(m.projects.mock.calls[0][0].where.clientId).toBe("client-a"); expect(m.invoices.mock.calls[0][0].where).toEqual({ clientId: "client-a", status: { in: ["sent", "overdue"] } });
  });
  it("project listing cannot be expanded by another client ID", async () => {
    await Projects(); expect(m.projects.mock.calls[0][0].where).toEqual({ clientId: "client-a" });
  });
  it("foreign/missing project fails closed with an ownership-constrained query", async () => {
    await expect(Project({ params: Promise.resolve({ id: "foreign-project" }) })).rejects.toThrow("NOT_FOUND");
    expect(m.project.mock.calls[0][0].where).toEqual({ id: "foreign-project", clientId: "client-a" });
  });
  it("related invoices must belong to this client AND be published, even if a bad FK links another client's invoice", async () => {
    await expect(Project({ params: Promise.resolve({ id: "foreign-project" }) })).rejects.toThrow("NOT_FOUND");
    expect(m.project.mock.calls[0][0].include.invoices.where).toEqual({ clientId: "client-a", status: { notIn: ["draft"] } });
  });
  it("invoice listing cannot reveal another client's linked project", async () => {
    await Invoices(); const query = m.invoices.mock.calls[0][0];
    expect(query.where).toEqual({ clientId: "client-a", status: { notIn: ["draft"] } });
    expect(query.include.project).toEqual({ where: { clientId: "client-a" }, select: { code: true, title: true } });
  });
});
