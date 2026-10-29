import { afterEach, beforeEach, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({ run: vi.fn(), log: vi.fn() }));
vi.mock("@/lib/invoice-reminders", () => ({ runInvoiceReminders: m.run }));
vi.mock("@/lib/logger", () => ({ logger: { error: m.log } }));
import { POST } from "@/app/api/internal/invoice-reminders/route";
const secret = "synthetic-job-key-".padEnd(64, "x");
function request(body: object = { apply: true }, authorization = `Bearer ${secret}`, type = "application/json") { return new Request("http://localhost/api/internal/invoice-reminders", { method: "POST", headers: { authorization, "Content-Type": type }, body: JSON.stringify(body) }); }
beforeEach(() => { vi.clearAllMocks(); vi.stubEnv("INVOICE_REMINDER_SECRET", secret); m.run.mockResolvedValue({ status: "completed", sent: 1 }); });
afterEach(() => vi.unstubAllEnvs());
it.each(["", "Bearer wrong", `Basic ${secret}`, `Bearer ${"x".repeat(1000)}`])("requires the private job bearer before running: %s", async auth => { expect((await POST(request({}, auth))).status).toBe(401); expect(m.run).not.toHaveBeenCalled(); });
it("fails closed without a sufficiently strong configured secret", async () => { vi.stubEnv("INVOICE_REMINDER_SECRET", "short"); expect((await POST(request())).status).toBe(503); expect(m.run).not.toHaveBeenCalled(); });
it.each([{ apply: true, now: "2026-11-10" }, { apply: true, email: "forged@example.invalid" }, { apply: true, invoiceId: "forged" }, { apply: "true" }])("never accepts caller-selected dates/invoices/recipients: %j", async data => { expect((await POST(request(data))).status).toBe(400); expect(m.run).not.toHaveBeenCalled(); });
it("supports explicit apply and defaults to dry-run without exposing the secret", async () => {
  const applied = await POST(request()); expect(applied.status).toBe(200); expect(m.run).toHaveBeenCalledWith({ apply: true });
  expect(await applied.text()).not.toContain(secret); expect(applied.headers.get("cache-control")).toBe("no-store");
  await POST(request({})); expect(m.run).toHaveBeenLastCalledWith({ apply: false });
});
it("rejects non-JSON and oversized inputs before the job", async () => { expect((await POST(request({}, `Bearer ${secret}`, "text/plain"))).status).toBe(415); expect((await POST(request({ padding: "x".repeat(1000) }))).status).toBe(400); expect(m.run).not.toHaveBeenCalled(); });
it("returns a safe failure without logging provider details", async () => { m.run.mockRejectedValue(new Error("private provider credential")); const response = await POST(request()); expect(response.status).toBe(500); expect(await response.text()).not.toContain("credential"); expect(JSON.stringify(m.log.mock.calls)).not.toContain("credential"); });
