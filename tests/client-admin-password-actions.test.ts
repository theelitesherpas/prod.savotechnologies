import { beforeEach, describe, expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({
  clientCreate: vi.fn(), clientFind: vi.fn(), clientUpdate: vi.fn(), sessionDelete: vi.fn(), transaction: vi.fn(),
  admin: vi.fn(), section: vi.fn(), audit: vi.fn(), send: vi.fn(), receiptSet: vi.fn(), receiptConsume: vi.fn(),
  hash: vi.fn(), generate: vi.fn(), passwordFits: vi.fn(), revalidate: vi.fn(),
}));
vi.mock("@/lib/prisma", () => ({ prisma: {
  clientUser: { create: m.clientCreate, findUnique: m.clientFind, update: m.clientUpdate },
  clientSession: { deleteMany: m.sessionDelete },
  $transaction: m.transaction,
} }));
vi.mock("@/lib/auth", () => ({ requireAdmin: m.admin }));
vi.mock("@/lib/permissions", () => ({ requireSection: m.section }));
vi.mock("@/lib/audit", () => ({ audit: m.audit }));
vi.mock("@/lib/mail", () => ({ sendTemplateNow: m.send }));
vi.mock("@/lib/client-auth", () => ({ hashPassword: m.hash, generateClientPassword: m.generate }));
vi.mock("@/lib/passwords", () => ({ passwordFitsBcrypt: m.passwordFits }));
vi.mock("@/lib/client-password-receipt", () => ({ setClientPasswordReceipt: m.receiptSet, consumeClientPasswordReceipt: m.receiptConsume }));
vi.mock("next/cache", () => ({ revalidatePath: m.revalidate }));
vi.mock("next/navigation", () => ({ redirect: (path: string) => { throw new Error(`REDIRECT:${path}`); } }));

import { createClientAction, resetClientPasswordAction, revealClientPasswordReceiptAction } from "@/app/admin/(protected)/clients/actions";

const admin = { id: "admin-fixture", name: "Test Admin", role: "admin" };
const password = "TestOnly_ClientPass_49!";
const form = (values: Record<string, string>) => {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
};

beforeEach(() => {
  vi.clearAllMocks();
  m.admin.mockResolvedValue(admin);
  m.section.mockResolvedValue(undefined);
  m.clientCreate.mockResolvedValue({ id: "client-fixture", email: "client@example.test" });
  m.clientFind.mockResolvedValue({ id: "client-fixture", email: "client@example.test", name: "Test Client" });
  m.clientUpdate.mockResolvedValue({});
  m.sessionDelete.mockResolvedValue({ count: 1 });
  m.transaction.mockImplementation(async (ops: Promise<unknown>[]) => Promise.all(ops));
  m.audit.mockResolvedValue(undefined);
  m.hash.mockResolvedValue("bcrypt-fixture");
  m.generate.mockReturnValue(password);
  m.passwordFits.mockReturnValue(true);
  m.receiptSet.mockResolvedValue(true);
  m.receiptConsume.mockResolvedValue({ kind: "reset", password });
});

describe("client password admin actions", () => {
  it("redirects after account creation without putting the password in the URL", async () => {
    await expect(createClientAction(form({ name: "Test Client", email: "client@example.test" })))
      .rejects.toThrow("REDIRECT:/admin/clients?created=1");
    expect(m.clientCreate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ passwordHash: "bcrypt-fixture" }) }));
    expect(m.receiptSet).toHaveBeenCalledWith(admin.id, "created", password);
    expect(m.send).toHaveBeenCalledWith("clientWelcome", "client@example.test", expect.objectContaining({ password }));
    expect(m.revalidate).toHaveBeenCalledWith("/admin/clients");
  });

  it("rotates the password and revokes client sessions in one transaction", async () => {
    await expect(resetClientPasswordAction(form({ id: "client-fixture" })))
      .rejects.toThrow("REDIRECT:/admin/clients?reset=1");
    expect(m.transaction).toHaveBeenCalledTimes(1);
    expect(m.transaction.mock.calls[0][0]).toHaveLength(2);
    expect(m.clientUpdate).toHaveBeenCalledWith({ where: { id: "client-fixture" }, data: { passwordHash: "bcrypt-fixture" } });
    expect(m.sessionDelete).toHaveBeenCalledWith({ where: { clientId: "client-fixture" } });
    expect(m.receiptSet).toHaveBeenCalledWith(admin.id, "reset", password);
  });

  it("does not claim a successful reset or issue a receipt when the transaction fails", async () => {
    m.transaction.mockRejectedValueOnce(new Error("database failure"));
    await expect(resetClientPasswordAction(form({ id: "client-fixture" })))
      .rejects.toThrow("REDIRECT:/admin/clients?e=Password%20reset%20failed%3B%20no%20changes%20were%20applied.");
    expect(m.audit).not.toHaveBeenCalled();
    expect(m.send).not.toHaveBeenCalled();
    expect(m.receiptSet).not.toHaveBeenCalled();
  });

  it("reauthenticates and returns only the current admin's consumed receipt", async () => {
    await expect(revealClientPasswordReceiptAction({ status: "idle" }, new FormData())).resolves.toEqual({
      status: "revealed", kind: "reset", password,
    });
    expect(m.admin).toHaveBeenCalledTimes(1);
    expect(m.section).toHaveBeenCalledWith("clients");
    expect(m.receiptConsume).toHaveBeenCalledWith(admin.id);
  });

  it("reports an expired receipt without returning a credential", async () => {
    m.receiptConsume.mockResolvedValueOnce(null);
    await expect(revealClientPasswordReceiptAction({ status: "idle" }, new FormData())).resolves.toEqual({ status: "expired" });
  });
});
