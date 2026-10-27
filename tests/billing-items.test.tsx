import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { assertBillingTotal, billingTotal, draftBillingTotal, invoiceItems, milestoneTasks, parseInvoiceItems } from "@/lib/billing-items";
import { milestoneInput, parseAdditionalForm } from "@/lib/project-input";
import { clientAddressLines, clientAddressSchema } from "@/lib/client-address";
import { invoiceDocumentItems, invoiceWorkDescription } from "@/lib/invoice-document";
import { ClientAddressFields } from "@/components/admin/client-address-fields";
import { PricedTasksEditor } from "@/components/admin/priced-tasks-editor";

const tasks = [{ title: "Booking form", amountMajor: "100.01" }, { title: "Testing", amountMajor: "25.99" }];
describe("milestone tasks and invoice price breakdown", () => {
  it("converts exact decimals and requires the task sum to match the milestone", () => {
    const result = milestoneInput.parse({ title: "Development", amountMajor: "126.00", dueDate: "", tasks });
    expect(result.tasks).toEqual([{ title: "Booking form", amount: 10001 }, { title: "Testing", amount: 2599 }]);
    expect(milestoneInput.safeParse({ title: "Development", amountMajor: "125.00", dueDate: "", tasks }).success).toBe(false);
  });
  it("keeps existing aggregate milestones valid with no invented tasks", () => {
    expect(milestoneInput.parse({ title: "Legacy milestone", amountMajor: "126.00", dueDate: "" }).tasks).toEqual([]);
    expect(milestoneTasks(null)).toEqual([]);
    expect(invoiceItems(undefined)).toEqual([]);
  });
  it("enforces the three-task maximum on milestone and invoice submissions", () => {
    const four = Array.from({ length: 4 }, () => tasks[0]);
    expect(milestoneInput.safeParse({ title: "Too many", amountMajor: "400.04", dueDate: "", tasks: four }).success).toBe(false);
    expect(() => parseInvoiceItems(JSON.stringify(four.map(t => ({ description: t.title, amountMajor: t.amountMajor }))))).toThrow("at most 3");
  });
  it.each(["-1", "0", "1.001", "1e3", "21474836.48", ""])("rejects invalid task price %s", price => {
    expect(() => parseInvoiceItems(JSON.stringify([{ description: "Example", amountMajor: price }]))).toThrow();
  });
  it("rejects malformed/oversized JSON, blank names and oversized totals", () => {
    expect(() => parseInvoiceItems("{")).toThrow("invalid");
    expect(() => parseInvoiceItems(" ".repeat(150001))).toThrow("too large");
    expect(() => parseInvoiceItems(JSON.stringify([{ description: " ", amountMajor: "10" }]))).toThrow();
    expect(() => billingTotal([{ amount: 2147483647 }, { amount: 1 }])).toThrow("limit");
    expect(draftBillingTotal([{ amountMajor: "1.01" }, { amountMajor: "2.99" }])).toBe(400);
    expect(draftBillingTotal([{ amountMajor: "" }])).toBeNull();
    expect(() => assertBillingTotal([{ amount: 101 }], 100, "Task")).toThrow("exactly");
  });
  it("validates additional work using the same task rules", () => {
    const form = new FormData();
    for (const [key, value] of Object.entries({ title: "Additional integration", description: "Agreed scope", amountMajor: "126.00", dueDate: "", tasks: JSON.stringify(tasks) })) form.set(key, value);
    expect(parseAdditionalForm(form).tasks).toHaveLength(2);
    form.set("amountMajor", "126.01");
    expect(() => parseAdditionalForm(form)).toThrow("exactly");
  });
  it("uses the issued work snapshot rather than later milestone notes", () => {
    expect(invoiceWorkDescription({ description: "Issued work", milestone: { title: "Changed", description: "Different scope" } })).toBe("Issued work");
    expect(invoiceWorkDescription({ description: null, milestone: { title: "Legacy milestone", description: "Completed the agreed work" } })).toBe("Legacy milestone\nCompleted the agreed work");
    expect(invoiceWorkDescription({ description: "", milestone: { title: "Not used", description: "" } })).toBe("");
    expect(invoiceDocumentItems({ amount: 100, items: [] })).toEqual([]);
    expect(() => invoiceDocumentItems({ amount: 100, items: [{ description: "Task", amount: 101 }] })).toThrow();
  });
  it("disables Add task after the third row and uses short task names", () => {
    const html = renderToStaticMarkup(<PricedTasksEditor currency="INR" rows={Array.from({ length: 3 }, () => tasks[0])} onChange={() => {}} invoice/>);
    expect(html).toMatch(/disabled=""[^>]*>Add task/);
    expect(html.match(/maxLength="80"/g)).toHaveLength(3);
  });
});

describe("optional customer billing address", () => {
  it("accepts entirely blank or partially supplied addresses without placeholders", () => {
    expect(clientAddressLines(clientAddressSchema.parse({}))).toEqual([]);
    expect(clientAddressLines({ addressLine1: " 14 Example Street ", city: "Indore", postalCode: "452001", country: "India" })).toEqual(["14 Example Street", "Indore 452001", "India"]);
    expect(clientAddressLines({ city: "Indore", region: "MP" })).toEqual(["Indore, MP"]);
    expect(clientAddressSchema.safeParse({ postalCode: "x".repeat(33) }).success).toBe(false);
  });
  it("renders six optional address fields using the current admin input styling", () => {
    const html = renderToStaticMarkup(<ClientAddressFields address={{ city: "Indore" }}/>);
    expect(html.match(/<input /g)).toHaveLength(6);
    expect(html).not.toContain("required");
    expect(html).toContain('value="Indore"');
    expect(html).toContain("adm-input w-full");
  });
});
