import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
const mocks = vi.hoisted(() => ({ user: vi.fn(), count: vi.fn(), rows: vi.fn(), pathname: "/portal/transactions" }));
vi.mock("@/lib/client-auth", () => ({ getClientUser: mocks.user }));
vi.mock("@/lib/prisma", () => ({ prisma: { paymentTransaction: { count: mocks.count, findMany: mocks.rows } } }));
vi.mock("next/navigation", () => ({ redirect: (path: string) => { throw new Error(`REDIRECT:${path}`); }, usePathname: () => mocks.pathname }));
import Page from "@/app/portal/(app)/transactions/page";
import { WorkspaceNav } from "@/components/portal/workspace-nav";
const row = { id: "txn-1", invoiceNumber: "STPLIN05151", projectTitle: "Client website", paymentId: "pay_REAL1234", source: "razorpay", method: "upi", amount: 100000, chargedAmount: 102360, currency: "INR", occurredAt: new Date("2026-10-20T10:00:00Z"), invoice: { id: "invoice-1", clientId: "client-1", status: "paid" } };
beforeEach(() => {
  vi.clearAllMocks(); mocks.user.mockResolvedValue({ id: "client-1" }); mocks.count.mockResolvedValue(1);
  mocks.rows.mockImplementation(async (args) => args.distinct ? [{ currency: "INR" }] : [row]);
});
const render = async (params = {}) => renderToStaticMarkup(await Page({ searchParams: Promise.resolve(params) }));
describe("portal Transactions", () => {
  it("places Transactions immediately after Invoices and marks only it active", () => {
    const html = renderToStaticMarkup(<WorkspaceNav />);
    expect(html.indexOf('href="/portal/invoices"')).toBeLessThan(html.indexOf('href="/portal/transactions"'));
    expect(html.match(/aria-current="page"/g)).toHaveLength(1);
    expect(html).toMatch(/aria-current="page" href="\/portal\/transactions"/);
  });
  it("rejects signed-out users before any history query", async () => {
    mocks.user.mockResolvedValue(null);
    await expect(render()).rejects.toThrow("REDIRECT:/portal");
    expect(mocks.count).not.toHaveBeenCalled(); expect(mocks.rows).not.toHaveBeenCalled();
  });
  it("renders recorded facts, tabular amounts and an accessible invoice PDF action", async () => {
    const html = await render();
    expect(html).toContain("Transactions."); expect(html).toContain("pay_REAL1234");
    expect(html).toContain("Razorpay · UPI"); expect(html).toContain("1,023.60"); expect(html).toContain("1,000.00");
    expect(html).toContain('href="/portal/invoices/invoice-1/pdf" download=""');
    expect(html).toContain('aria-label="Download invoice STPLIN05151 as PDF"');
    expect(html).toMatch(/dateTime="2026-10-20T10:00:00.000Z"/i);
    expect(html).not.toContain("Pay now");
  });
  it("scopes search/count/currencies/rows to the authenticated owner and bounds pagination", async () => {
    mocks.count.mockResolvedValue(54);
    const html = await render({ q: "100% & <invoice>", page: "99999", currency: "INR", clientId: "foreign-client", source: "razorpay" });
    expect(mocks.count.mock.calls[0][0].where).toMatchObject({ clientId: "client-1", currency: "INR", source: "razorpay" });
    expect(mocks.rows.mock.calls[0][0]).toMatchObject({ where: { clientId: "client-1" }, distinct: ["currency"] });
    expect(mocks.rows.mock.calls[1][0]).toMatchObject({ where: { clientId: "client-1" }, take: 25, skip: 50 });
    expect(html).toContain("Page 3 of 3"); expect(html).toContain("Showing 51–54 of 54 transactions");
    expect(html).toContain("100% &amp; &lt;invoice&gt;"); expect(html).not.toContain("foreign-client");
    expect(html).toContain('rel="prev"'); expect(html).not.toContain('rel="next"');
  });
  it.each(["draft", "unknown"])("does not offer a PDF for a %s invoice", async status => {
    mocks.rows.mockImplementation(async args => args.distinct ? [] : [{ ...row, invoice: { ...row.invoice, status } }]);
    expect(await render()).not.toContain("/portal/invoices/invoice-1/pdf");
  });
  it("retains history without exposing a deleted/reassigned invoice PDF", async () => {
    mocks.rows.mockImplementation(async args => args.distinct ? [] : [{ ...row, invoice: { ...row.invoice, clientId: "foreign-client" } }, { ...row, id: "txn-2", invoice: null }]);
    const html = await render(); expect(html).toContain("pay_REAL1234"); expect(html).toContain("Unavailable"); expect(html).not.toContain("/portal/invoices/invoice-1/pdf");
  });
  it("shows unknown historical charges/date honestly rather than applying current fees", async () => {
    mocks.rows.mockImplementation(async args => args.distinct ? [] : [{ ...row, paymentId: null, source: "legacy", chargedAmount: null, occurredAt: null }]);
    const html = await render(); expect(html).toContain("Historical payment record"); expect(html).toContain("Not recorded"); expect(html).not.toContain("1,023.60");
  });
  it.each([false, true])("supports the %s-filtered empty state with a working recovery link", async filtered => {
    mocks.count.mockResolvedValue(0); mocks.rows.mockResolvedValue([]);
    const html = await render(filtered ? { q: "not-a-match" } : {});
    expect(html).toContain(filtered ? "No matching transactions." : "No transactions yet.");
    expect(html).toContain(filtered ? "Clear filters" : "View invoices");
  });
});
