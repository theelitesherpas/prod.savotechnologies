import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { employeeVars, EMPLOYEE_CODE_PATTERN, EMPLOYEE_STATUS_META, fmtDate, leaveSummary } from "@/lib/employee-model";
beforeEach(()=>{vi.useFakeTimers();vi.setSystemTime(new Date("2026-06-15T12:00:00Z"));});
afterEach(()=>vi.useRealTimers());
describe("pure employee preview contract",()=>{
 it("preserves completed-month credit and approved/pending balances",()=>{expect(leaveSummary({joiningDate:new Date("2026-01-15T12:00:00Z"),lastWorkingDay:null},[{status:"approved",days:2},{status:"pending",days:1},{status:"rejected",days:9}])).toEqual({credited:5,approvedDays:2,pendingDays:1,balance:3});});
 it("preserves last-working-day credit cutoff",()=>{expect(leaveSummary({joiningDate:new Date("2026-01-15T12:00:00Z"),lastWorkingDay:new Date("2026-03-15T12:00:00Z")},[]).credited).toBe(2);});
 it("never credits incomplete months or future joining dates",()=>{expect(leaveSummary({joiningDate:new Date("2026-05-16T12:00:00Z"),lastWorkingDay:null},[]).credited).toBe(0);expect(leaveSummary({joiningDate:new Date("2027-01-01T12:00:00Z"),lastWorkingDay:null},[]).credited).toBe(0);});
 it("preserves every template variable and null fallback",()=>{expect(employeeVars({name:"Test",employeeCode:"STPL0301IN",position:"Engineer",department:"Engineering",joiningDate:new Date("2026-01-15T12:00:00Z"),probationEnds:null,lastWorkingDay:null,ctc:null,manager:null,location:null})).toEqual({employeeName:"Test",candidateName:"Test",recipientName:"Test",employeeCode:"STPL0301IN",position:"Engineer",designation:"Engineer",department:"Engineering",joiningDate:"15 Jan 2026",reportTo:"",managerName:"",ctc:"",newCtc:"",probationEndsOn:"-",confirmationDate:"-",lastWorkingDay:"-",leaveBalance:"5",leavesCredited:"5",officeLocation:""});});
 it("preserves native date, code and lifecycle display contracts",()=>{expect(fmtDate(null)).toBe("-");expect(EMPLOYEE_CODE_PATTERN.test("STPL0301IN")).toBe(true);expect(Object.keys(EMPLOYEE_STATUS_META)).toEqual(["joining","probation","active","notice","exited"]);});
});
