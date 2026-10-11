import "server-only";
import { prisma } from "@/lib/prisma";
import { requireSection } from "@/lib/permissions";
import { EMPLOYEE_CODE_START, EMPLOYEE_CODE_COUNTRY } from "@/lib/employee-model";
export * from "@/lib/employee-model";

/** Next suggested employee code - max existing + 1, floor at 301. */
export async function nextEmployeeCode(): Promise<string> {
  await requireSection("employees");
  if (!prisma) return `STPL${String(EMPLOYEE_CODE_START).padStart(4, "0")}${EMPLOYEE_CODE_COUNTRY}`;
  const last = await prisma.employee.findFirst({
    orderBy: { employeeCode: "desc" },
    select: { employeeCode: true },
  });
  const max = last ? parseInt(last.employeeCode.replace(/\D/g, ""), 10) : EMPLOYEE_CODE_START - 1;
  const n = Math.max(EMPLOYEE_CODE_START, max + 1);
  return `STPL${String(n).padStart(4, "0")}${EMPLOYEE_CODE_COUNTRY}`;
}
