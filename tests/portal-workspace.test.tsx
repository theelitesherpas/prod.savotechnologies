import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import {
  EmptyState,
  invoiceTotals,
  InvoiceTable,
  PortalProgress,
  PortalStatus,
  ProjectCard,
  progressValue,
  type InvoiceRecord,
} from "@/components/portal/workspace-ui";
import { invoiceRecord, projectRecord } from "@/components/portal/records";
import {
  InvoiceBrowser,
  ProjectBrowser,
} from "@/components/portal/record-browsers";
import { WorkspaceNav } from "@/components/portal/workspace-nav";
import { isAutomaticProjectLeadModalExcludedPath } from "@/lib/lead-modal-routes";
import type { ClientProject, Invoice } from "@prisma/client";

const route = vi.hoisted(() => ({ pathname: "/portal/projects/example" }));
vi.mock("next/navigation", () => ({ usePathname: () => route.pathname }));
const invoice: InvoiceRecord = {
  id: "invoice",
  number: "TEST-001",
  status: "paid",
  amount: 12345,
  currency: "USD",
  issuedAt: "2026-10-01T00:00:00Z",
  dueDate: null,
  paidAt: "2026-10-02T00:00:00Z",
  notes: "Example invoice",
  project: { code: "TEST-PRJ", title: "Example project" },
};

describe("client workspace presentation", () => {
  it("never combines different currencies or includes cancelled/draft balances", () => {
    expect(
      invoiceTotals([
        { currency: "USD", status: "sent", amount: 2500 },
        { currency: "USD", status: "overdue", amount: 7500 },
        { currency: "INR", status: "paid", amount: 8000 },
        { currency: "INR", status: "sent", amount: 12000 },
        { currency: "USD", status: "cancelled", amount: 99999 },
        { currency: "USD", status: "draft", amount: 99999 },
      ]),
    ).toEqual([
      { currency: "INR", paid: 8000, due: 12000 },
      { currency: "USD", paid: 0, due: 10000 },
    ]);
    expect(invoiceTotals([])).toEqual([]);
  });
  it("clamps progress display and accessible values, including malformed input", () => {
    expect(progressValue(-10)).toBe(0);
    expect(progressValue(200)).toBe(100);
    expect(progressValue(NaN)).toBe(0);
    const html = renderToStaticMarkup(
      <PortalProgress value={200} label="Example project progress" />,
    );
    expect(html).toContain('aria-valuenow="100"');
    expect(html).toContain('aria-label="Example project progress"');
  });
  it("labels statuses with text, not just colour", () => {
    expect(renderToStaticMarkup(<PortalStatus status="overdue" />)).toContain(
      "Overdue",
    );
    expect(
      renderToStaticMarkup(<PortalStatus status="new_status" />),
    ).toContain("new status");
  });
  it("provides scoped active navigation for project details", () => {
    const html = renderToStaticMarkup(<WorkspaceNav />);
    expect(html.match(/aria-current="page"/g)).toHaveLength(1);
    expect(html).toMatch(
      /<a(?=[^>]*href="\/portal\/projects")(?=[^>]*aria-current="page")[^>]*>/,
    );
    route.pathname = "/portal/invoices";
    expect(renderToStaticMarkup(<WorkspaceNav />)).toMatch(
      /<a(?=[^>]*href="\/portal\/invoices")(?=[^>]*aria-current="page")[^>]*>/,
    );
  });
  it("keeps invoices accessible with labelled tables, status and original currency", () => {
    const html = renderToStaticMarkup(<InvoiceTable invoices={[invoice]} />);
    expect(html).toContain("<caption>Invoice history</caption>");
    expect(html).toContain('scope="col"');
    expect(html).toContain("USD");
    expect(html).toContain("123.45");
    expect(html).toContain("Paid");
    expect(html).toContain('data-label="Amount"');
    expect(html).not.toContain("Not scheduled");
  });
  it.each(["paid", "sent", "overdue", "cancelled"])("offers authorized PDF download and printing for %s invoices without inventing payments", (status) => {
    const html = renderToStaticMarkup(<InvoiceTable invoices={[{ ...invoice, status }]} />);
    expect(html).toContain('href="/portal/invoices/invoice/pdf"');
    expect(html).toContain('href="/portal/invoices/invoice/pdf?view=1"');
    expect(html).toContain('aria-label="Download PDF for invoice TEST-001"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).not.toContain("Pay now");
  });
  it("does not offer documents for private drafts or unsupported statuses", () => {
    for (const status of ["draft", "unknown"]) {
      const html = renderToStaticMarkup(<InvoiceTable invoices={[{ ...invoice, status }]} />);
      expect(html).not.toContain("/pdf");
    }
  });
  it("keeps missing dates and empty states explicit and recoverable", () => {
    const project = {
      id: "example",
      code: "TEST",
      title: "Example project",
      status: "planning",
      progress: 0,
      summary: null,
      dueDate: null,
      updatedAt: "2026-10-01T00:00:00Z",
    };
    const html = renderToStaticMarkup(<ProjectCard project={project} />);
    expect(html).toContain("Due date not set");
    expect(html).toContain("/portal/projects/example");
    expect(
      renderToStaticMarkup(
        <EmptyState title="No projects." contact>
          Published projects will appear here.
        </EmptyState>,
      ),
    ).toContain("mailto:hello@savotechnologies.com");
    expect(renderToStaticMarkup(<ProjectBrowser projects={[]} />)).toContain(
      "Your first project starts here.",
    );
    expect(renderToStaticMarkup(<InvoiceBrowser invoices={[]} />)).toContain(
      "No invoices issued yet.",
    );
  });
  it("only passes display fields across the browser boundary", () => {
    const date = new Date("2026-10-01T00:00:00Z");
    const p = projectRecord({
      id: "p",
      code: "REF",
      title: "Project",
      summary: "",
      status: "review",
      progress: 50,
      dueDate: null,
      updatedAt: date,
      clientId: "private-client",
    } as ClientProject);
    expect(p.updatedAt).toBe(date.toISOString());
    expect(p).not.toHaveProperty("clientId");
    const inv = invoiceRecord({
      ...invoice,
      businessId: null,
      issuedAt: date,
      dueDate: null,
      paidAt: date,
      clientId: "private-client",
      createdAt: date,
      updatedAt: date,
      projectId: null,
      milestoneId: null,
      razorpayLinkId: null,
      razorpayPaymentId: null,
    } as Invoice);
    expect(inv).not.toHaveProperty("clientId");
    expect(inv.paidAt).toBe(date.toISOString());
  });
  it("suppresses only automatic sales interruptions on portal task routes", () => {
    expect(isAutomaticProjectLeadModalExcludedPath("/portal")).toBe(true);
    expect(isAutomaticProjectLeadModalExcludedPath("/portal/")).toBe(true);
    expect(isAutomaticProjectLeadModalExcludedPath("/portal/projects/p")).toBe(
      true,
    );
    expect(isAutomaticProjectLeadModalExcludedPath("/portals")).toBe(false);
    expect(isAutomaticProjectLeadModalExcludedPath("/case-studies")).toBe(
      false,
    );
  });
});
