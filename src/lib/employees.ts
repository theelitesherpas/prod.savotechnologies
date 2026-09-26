import { prisma } from "@/lib/prisma";
import type { Employee, EmployeeLeave } from "@prisma/client";

/**
 * Leave policy engine — deterministic balance, no cron needed.
 *
 * One leave is credited per completed month of service (from the
 * joining date), credited up to the last working day for exited
 * employees. The available balance is simply:
 *
 *     credited months − approved leave days
 *
 * which makes unused months carry forward automatically and
 * approvals reduce availability in real time.
 */

export const LEAVE_PER_MONTH = 1;

export type LeaveSummary = {
  credited: number;
  approvedDays: number;
  pendingDays: number;
  balance: number;
};

function monthsBetween(from: Date, to: Date): number {
  let months = (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());
  // Count the month only once the joining day-of-month is reached.
  if (to.getDate() < from.getDate()) months -= 1;
  return Math.max(0, months);
}

export function leaveSummary(
  employee: Pick<Employee, "joiningDate" | "lastWorkingDay">,
  leaves: Pick<EmployeeLeave, "status" | "days">[],
): LeaveSummary {
  const until = employee.lastWorkingDay && employee.lastWorkingDay < new Date() ? employee.lastWorkingDay : new Date();
  const credited = monthsBetween(employee.joiningDate, until) * LEAVE_PER_MONTH;
  const approvedDays = leaves.filter((l) => l.status === "approved").reduce((s, l) => s + l.days, 0);
  const pendingDays = leaves.filter((l) => l.status === "pending").reduce((s, l) => s + l.days, 0);
  return { credited, approvedDays, pendingDays, balance: credited - approvedDays };
}

/** Next employee code in the STPL00xxx series. */
export async function nextEmployeeCode(): Promise<string> {
  if (!prisma) return "STPL00001";
  const last = await prisma.employee.findFirst({
    orderBy: { employeeCode: "desc" },
    select: { employeeCode: true },
  });
  const n = last ? parseInt(last.employeeCode.replace(/\D/g, ""), 10) + 1 : 1;
  return `STPL${String(n).padStart(5, "0")}`;
}

export const EMPLOYEE_STATUS_META: Record<string, { label: string; tone: "default" | "accent" | "success" | "warning" | "muted" }> = {
  joining: { label: "Pre-joining", tone: "warning" },
  probation: { label: "Probation", tone: "accent" },
  active: { label: "Active", tone: "success" },
  notice: { label: "Notice period", tone: "warning" },
  exited: { label: "Exited", tone: "muted" },
};

export const LEAVE_TYPES = ["privilege", "sick", "casual", "unpaid", "other"] as const;

export const fmtDate = (d: Date | null | undefined) =>
  d ? d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";

/** Variable map for email autofill from an employee record. */
export function employeeVars(
  e: Pick<
    Employee,
    "name" | "employeeCode" | "position" | "department" | "joiningDate" | "probationEnds" | "lastWorkingDay" | "ctc" | "manager" | "location"
  > & { id?: string; email?: string },
  leaves: Pick<EmployeeLeave, "status" | "days">[] = [],
): Record<string, string> {
  const lv = leaveSummary(e, leaves);
  return {
    employeeName: e.name,
    candidateName: e.name,
    recipientName: e.name,
    employeeCode: e.employeeCode,
    position: e.position,
    designation: e.position,
    department: e.department,
    joiningDate: fmtDate(e.joiningDate),
    reportTo: e.manager ?? "",
    managerName: e.manager ?? "",
    ctc: e.ctc ?? "",
    newCtc: e.ctc ?? "",
    probationEndsOn: fmtDate(e.probationEnds),
    confirmationDate: fmtDate(e.probationEnds),
    lastWorkingDay: fmtDate(e.lastWorkingDay),
    leaveBalance: `${lv.balance}`,
    leavesCredited: `${lv.credited}`,
    officeLocation: e.location ?? "",
  };
}
