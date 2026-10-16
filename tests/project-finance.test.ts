import { describe, expect, it } from "vitest";
import { minorUnits, majorUnits, calendarDate, deliveryProgress, projectFinancials } from "@/lib/project-finance";
import { parseProjectForm } from "@/lib/project-input";
import { templateEntry } from "@/lib/mail/registry";
const milestones = [{ amount: 3000, status: "done", scope: "base" }, { amount: 7000, status: "pending", scope: "base" }];
function form() {
  const f = new FormData(); for (const [k,v] of Object.entries({ clientId: "client-example123", title: "Example project", code: "TEST-001", summary: "An agreed project description.", budgetMajor: "100.00", currency: "USD", status: "in_progress", startDate: "2026-10-01", dueDate: "2026-12-01", milestones: JSON.stringify([{ title: "Discovery", amountMajor: "30.00", status: "done", dueDate: "" }, { title: "Implementation", amountMajor: "70.00", status: "pending", dueDate: "" }]) })) f.set(k,v); return f;
}
describe("project budgets and milestone input", () => {
  it.each(["0.10", "12.34", "999.99", "21474836.47"])("round-trips %s without floating point allocation drift", value => expect(majorUnits(minorUnits(value))).toBe(value));
  it.each(["1.001", "-1", "1e3", "1,000", "Infinity", "21474836.48"])("rejects invalid money %s", value => expect(() => minorUnits(value)).toThrow());
  it("rejects impossible dates and reversed schedules", () => {
    expect(() => calendarDate("2026-02-30")).toThrow();
    const f=form(); f.set("dueDate","2026-09-30"); expect(() => parseProjectForm(f)).toThrow("before the start");
  });
  it("requires a complete exact allocation, description and estimate", () => {
    expect(parseProjectForm(form()).budgetMajor).toBe(10000);
    for (const budget of ["99.99","100.01"]) { const f=form(); f.set("budgetMajor",budget); expect(() => parseProjectForm(f)).toThrow("exactly"); }
    for (const field of ["summary","dueDate"]) { const f=form(); f.set(field,""); expect(() => parseProjectForm(f)).toThrow(); }
  });
  it("does not accept duplicate IDs, empty milestones or malformed JSON", () => {
    for(const rows of ["broken","[]",JSON.stringify([{id:"milestone-123",title:"First",amountMajor:"50",dueDate:""},{id:"milestone-123",title:"Second",amountMajor:"50",dueDate:""}])]) {
      const f=form(); f.set("milestones",rows); expect(() => parseProjectForm(f)).toThrow();
    }
  });
});
describe("delivery and payment calculations", () => {
  it("derives delivery from costs rather than an editable percentage", () => {
    expect(deliveryProgress(milestones)).toBe(30);
    expect(deliveryProgress(milestones.map(m=>({...m,status:"done"})))).toBe(100);
    expect(deliveryProgress([{amount:99999,status:"done",scope:"base"},{amount:1,status:"pending",scope:"base"}])).toBe(99);
    expect(deliveryProgress([])).toBe(0);
    expect(deliveryProgress([{amount:null,status:"done",scope:"base"},{amount:null,status:"pending",scope:"base"}])).toBe(50);
  });
  it("includes additional work in the agreed total and delivered progress", () => {
    const work=[...milestones,{amount:2000,status:"pending",scope:"additional"}];
    const result=projectFinancials({budget:10000,currency:"USD"},work,[{amount:10000,currency:"USD",status:"paid"}]);
    expect(result).toMatchObject({total:12000,additional:2000,paid:10000,balance:2000,fullyPaid:false});
    expect(deliveryProgress(work)).toBe(25);
  });
  it("never completes a project merely because its first partial invoice was paid", () => {
    expect(projectFinancials({budget:10000,currency:"USD"},milestones,[{amount:3000,currency:"USD",status:"paid"}]).fullyPaid).toBe(false);
  });
  it("does not count drafts, cancelled invoices or another currency", () => {
    const result=projectFinancials({budget:10000,currency:"USD"},milestones,[{amount:10000,currency:"INR",status:"paid"},{amount:10000,currency:"USD",status:"draft"},{amount:10000,currency:"USD",status:"cancelled"}]);
    expect(result).toMatchObject({paid:0,balance:10000,fullyPaid:false});
  });
  it("requires no unpaid issued balance and a real positive budget for automatic completion", () => {
    const paid={amount:10000,currency:"USD",status:"paid"};
    expect(projectFinancials({budget:10000,currency:"USD"},milestones,[paid]).fullyPaid).toBe(true);
    expect(projectFinancials({budget:10000,currency:"USD"},milestones,[paid,{...paid,status:"overdue",amount:1}]).fullyPaid).toBe(false);
    expect(projectFinancials({budget:null,currency:"USD"},milestones,[paid]).fullyPaid).toBe(false);
    expect(projectFinancials({budget:0,currency:"USD"},[],[]).fullyPaid).toBe(false);
  });
});
describe("actual project billing email bindings", () => {
  it("uses the real invoice currency, fractional amount and due date rather than INR sample constants", () => {
    const m=templateEntry("invoiceIssued")!.default({name:"Example",number:"REAL-001",amountMinor:"98765",currency:"USD",dueDateIso:"2027-03-02T00:00:00Z"});
    expect(m.text).toContain("987.65"); expect(m.text).toContain("2 Mar 2027"); expect(m.text).not.toContain("2,500"); expect(m.subject).toContain("987.65");
    expect(templateEntry("invoiceIssued")!.default({name:"Example",number:"REAL-002",amountMinor:"100",currency:"EUR",dueDateIso:""}).text).toContain("On receipt");
  });
  it("uses actual overdue days and a started milestone is never reported as completed", () => {
    expect(templateEntry("invoiceOverdue")!.default({name:"Example",number:"REF",amountMinor:"12345",currency:"CHF",days:"19"}).text).toContain("19 day");
    const started=templateEntry("milestoneUpdate")!.default({name:"Example",project:"Website",milestone:"Booking",status:"started"});
    expect(started.subject).toContain("started"); expect(started.subject).not.toContain("completed");
  });
});
