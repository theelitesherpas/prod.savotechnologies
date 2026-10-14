import { beforeEach, describe, expect, it, vi } from "vitest";
const { findMany } = vi.hoisted(() => ({ findMany: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("../src/lib/prisma", () => ({ prisma: { contentItem: { findMany } } }));
vi.mock("../src/lib/logger", () => ({ logger: { warn: vi.fn() } }));
import { getManagedHireRoles } from "../src/lib/content-items";
import { HIRE_ROLES } from "../src/constants/hire";

describe("hire role publication", () => {
  beforeEach(() => findMany.mockReset());

  it("uses defaults only when the collection has never been materialized", async () => {
    findMany.mockResolvedValueOnce([]).mockResolvedValueOnce([]);
    expect(await getManagedHireRoles()).toEqual(HIRE_ROLES);
  });

  it("does not restore fallback roles when all persisted roles are paused", async () => {
    findMany.mockResolvedValueOnce([]).mockResolvedValueOnce([{ id: "paused-role", active: false }]);
    expect(await getManagedHireRoles()).toEqual([]);
    expect(findMany.mock.calls[0][0].where).toEqual({ collection: "hire", active: true, contentStatus: "published" });
    expect(findMany.mock.calls[1][0].where).toEqual({ collection: "hire" });
  });
});
