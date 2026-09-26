"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { sendTemplateNow } from "@/lib/mail";
import { nextEmployeeCode, leaveSummary } from "@/lib/employees";

/** Employee portal actions - records, lifecycle, leaves. */

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const back = (e: string): never => redirect(`/admin/employees?e=${encodeURIComponent(e)}`);
const backId = (id: string, e: string): never =>
  redirect(`/admin/employees/${id}?e=${encodeURIComponent(e)}`);

const createSchema = z.object({
  employeeCode: z.string().trim().optional().or(z.literal("")),
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().toLowerCase().email().max(120),
  phone: z.string().trim().max(24).optional().or(z.literal("")),
  position: z.string().trim().min(2).max(80),
  department: z.string().trim().min(2).max(80),
  joiningDate: z.string().trim().min(4),
  ctc: z.string().trim().max(60).optional().or(z.literal("")),
  manager: z.string().trim().max(80).optional().or(z.literal("")),
  location: z.string().trim().max(80).optional().or(z.literal("")),
  probationMonths: z.string().trim().optional().or(z.literal("")),
});

function parseDate(v: string): Date | null {
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

export async function createEmployeeAction(formData: FormData): Promise<void> {
  const user = await requireAdmin();
  if (!prisma) redirect("/admin/employees?e=Database%20unavailable.");

  const parsed = createSchema.safeParse({
    employeeCode: formData.get("employeeCode") ?? "",
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone") ?? "",
    position: formData.get("position"),
    department: formData.get("department"),
    joiningDate: formData.get("joiningDate"),
    ctc: formData.get("ctc") ?? "",
    manager: formData.get("manager") ?? "",
    location: formData.get("location") ?? "",
    probationMonths: formData.get("probationMonths") ?? "",
  });
  if (!parsed.success) {
    redirect("/admin/employees/new?e=" + encodeURIComponent(parsed.error?.issues[0]?.message ?? "Check the fields."));
  }
  const d = parsed.data!;

  const joining = parseDate(d.joiningDate);
  if (!joining) {
    redirect("/admin/employees/new?e=" + encodeURIComponent("Enter a valid joining date."));
  }
  const months = Number(d.probationMonths || "6");
  const probationEnds = new Date(joining);
  probationEnds.setMonth(probationEnds.getMonth() + (isNaN(months) || months <= 0 ? 6 : months));

  // Manual ID (existing/older employees) or the next auto ID.
  const manual = (d.employeeCode ?? "").trim().toUpperCase();
  const code = manual.match(/^STPL\d{4}[A-Z]{2}$/)
    ? manual
    : await nextEmployeeCode();
  if (prisma && await prisma.employee.findUnique({ where: { employeeCode: code } })) {
    redirect("/admin/employees/new?e=" + encodeURIComponent(`Employee ID ${code} is already in use.`));
  }
  let employee: { id: string; employeeCode: string; name: string; email: string; manager: string | null; position: string; department: string; joiningDate: Date } | null = null;
  try {
    employee = await prisma!.employee.create({
      data: {
        employeeCode: code,
        name: d.name,
        email: d.email,
        phone: d.phone || null,
        position: d.position,
        department: d.department,
        status: "joining",
        joiningDate: joining,
        probationEnds,
        ctc: d.ctc || null,
        manager: d.manager || null,
        location: d.location || null,
      },
    });
  } catch {
    redirect("/admin/employees/new?e=" + encodeURIComponent("That email is already registered to an employee."));
  }
  if (!employee) {
    redirect("/admin/employees/new?e=" + encodeURIComponent("That email is already registered to an employee."));
  }
  await audit(user.id, "employee.create", "Employee", employee.employeeCode, { name: employee.name });

  // Welcome email - employee ID, joining details, leave policy.
  sendTemplateNow("employeeWelcome", employee.email, {
    employeeName: employee.name,
    employeeCode: employee.employeeCode,
    position: employee.position,
    department: employee.department,
    joiningDate: joining.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
    reportTo: employee.manager ?? "-",
    leavePolicy: "One leave is credited for every completed month of service; unused leaves carry forward.",
  });

  revalidatePath("/admin/employees");
  redirect(`/admin/employees/${employee.id}?created=1`);
}

const updateSchema = createSchema.partial().extend({
  id: z.string().min(10).max(32),
  employeeCode: z.string().trim().optional().or(z.literal("")),
  status: z.string().max(20).optional(),
  lastWorkingDay: z.string().trim().optional().or(z.literal("")),
  notes: z.string().max(2000).optional().or(z.literal("")),
});

export async function updateEmployeeAction(formData: FormData): Promise<void> {
  const user = await requireAdmin();
  if (!prisma) redirect("/admin/employees?e=Database%20unavailable.");
  const id = z.string().min(10).max(32).parse(formData.get("id"));
  const parsed = updateSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    redirect(`/admin/employees/${id}?e=${encodeURIComponent(parsed.error?.issues[0]?.message ?? "Check the fields.")}`);
  }
  const d = parsed.data!;

  const existing = await prisma!.employee.findUnique({ where: { id } });
  if (!existing) {
    redirect("/admin/employees?e=Employee%20not%20found.");
  }

  const data: Record<string, unknown> = {};
  if (d.employeeCode !== undefined && d.employeeCode !== "") {
    const newCode = d.employeeCode.trim().toUpperCase();
    if (!newCode.match(/^STPL\d{4}[A-Z]{2}$/)) {
      redirect(`/admin/employees/${id}?e=` + encodeURIComponent("Employee ID must be STPL0300IN format (STPL + digits + country code)."));
    }
    if (newCode !== existing.employeeCode) {
      const clash = await prisma!.employee.findUnique({ where: { employeeCode: newCode } });
      if (clash) {
        redirect(`/admin/employees/${id}?e=` + encodeURIComponent(`Employee ID ${newCode} is already in use.`));
      }
      data.employeeCode = newCode;
    }
  }
  if (d.name) data.name = d.name;
  if (d.email) data.email = d.email;
  if (d.phone !== undefined) data.phone = d.phone || null;
  if (d.position) data.position = d.position;
  if (d.department) data.department = d.department;
  if (d.joiningDate) {
    const j = parseDate(d.joiningDate);
    if (j) data.joiningDate = j;
  }
  if (d.ctc !== undefined) data.ctc = d.ctc || null;
  if (d.manager !== undefined) data.manager = d.manager || null;
  if (d.location !== undefined) data.location = d.location || null;
  if (d.notes !== undefined) data.notes = d.notes ?? "";
  if (d.status && ["joining", "probation", "active", "notice", "exited"].includes(d.status)) data.status = d.status;
  if (d.lastWorkingDay !== undefined) data.lastWorkingDay = d.lastWorkingDay ? parseDate(d.lastWorkingDay) : null;

  await prisma!.employee.update({ where: { id }, data });
  await audit(user.id, "employee.update", "Employee", existing.employeeCode);
  revalidatePath(`/admin/employees/${id}`);
  revalidatePath("/admin/employees");
  redirect(`/admin/employees/${id}?saved=1`);
}

const leaveSchema = z.object({
  employeeId: z.string().min(10).max(32),
  type: z.string().max(20),
  fromDate: z.string().trim().min(4),
  toDate: z.string().trim().min(4),
  reason: z.string().trim().max(500).optional().or(z.literal("")),
});

export async function addLeaveAction(formData: FormData): Promise<void> {
  const user = await requireAdmin();
  if (!prisma) redirect("/admin/employees?e=Database%20unavailable.");
  const parsed = leaveSchema.safeParse({
    employeeId: formData.get("employeeId"),
    type: formData.get("type") ?? "privilege",
    fromDate: formData.get("fromDate"),
    toDate: formData.get("toDate"),
    reason: formData.get("reason") ?? "",
  });
  if (!parsed.success) {
    const empId = (parsed.error && typeof formData.get("employeeId") === "string" && String(formData.get("employeeId")).length >= 10)
      ? String(formData.get("employeeId"))
      : "";
    backId(empId, parsed.error?.issues[0]?.message ?? "Check the fields.");
  }
  const d = parsed.data!;
  const from = parseDate(d.fromDate);
  const to = parseDate(d.toDate);
  if (!from || !to || to < from) {
    redirect(`/admin/employees/${d.employeeId}?e=${encodeURIComponent("Enter valid from/to dates.")}`);
  }

  const employee = await prisma!.employee.findUnique({ where: { id: d.employeeId }, include: { leaves: true } });
  if (!employee) {
    redirect("/admin/employees?e=Employee%20not%20found.");
  }
  const days = Math.round(((to.getTime() - from.getTime()) / 86400000 + 1) * 10) / 10;
  const summary = leaveSummary(employee, employee.leaves);
  if (d.type !== "unpaid" && days > summary.balance) {
    backId(d.employeeId, `Insufficient balance - available ${summary.balance}, requested ${days}.`);
  }

  await prisma!.employeeLeave.create({
    data: {
      employeeId: d.employeeId,
      type: d.type,
      fromDate: from as Date,
      toDate: to as Date,
      days,
      reason: d.reason ?? "",
      status: "pending",
    },
  });
  await audit(user.id, "employee.leaveRequest", "Employee", employee!.employeeCode, { days });
  revalidatePath(`/admin/employees/${d.employeeId}`);
  redirect(`/admin/employees/${d.employeeId}?leave=added`);
}

export async function decideLeaveAction(formData: FormData): Promise<void> {
  const user = await requireAdmin();
  const db = prisma;
  if (!db) redirect("/admin/employees?e=Database%20unavailable.");
  const id = z.string().min(10).max(32).parse(formData.get("id"));
  const decision = z.enum(["approved", "rejected"]).parse(formData.get("decision"));

  const leave = await prisma!.employeeLeave.findUnique({ where: { id }, include: { employee: true } });
  if (!leave || leave.status !== "pending" || !leave.employee) {
    redirect("/admin/employees?e=Leave%20request%20not%20found.");
  }
  const e = leave.employee;

  await db.employeeLeave.update({
    where: { id },
    data: { status: decision, actedBy: user.name, actedAt: new Date() },
  });
  await audit(user.id, `employee.leave.${decision}`, "Employee", e.employeeCode, { days: leave.days });

  // Auto-email on decision (leaveApproval / leaveRejection templates).
  const common = {
    employeeName: e.name,
    leaveType: leave.type.charAt(0).toUpperCase() + leave.type.slice(1),
    fromDate: leave.fromDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
    toDate: leave.toDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
    days: `${leave.days}`,
    approvedBy: user.name,
    reason: decision === "rejected" ? leave.reason || "Operational requirements" : "",
  };
  sendTemplateNow(decision === "approved" ? "leaveApproval" : "leaveRejection", e.email, common);

  revalidatePath(`/admin/employees/${e.id}`);
  redirect(`/admin/employees/${e.id}?leave=${decision}`);
}

export async function deleteEmployeeAction(formData: FormData): Promise<void> {
  const user = await requireAdmin();
  const db = prisma;
  if (!db) redirect("/admin/employees?e=Database%20unavailable.");
  const id = z.string().min(10).max(32).parse(formData.get("id"));
  const employee = await db.employee.findUnique({ where: { id } });
  if (!employee) redirect("/admin/employees?e=Employee%20not%20found.");
  await db.employee.delete({ where: { id } });
  await audit(user.id, "employee.delete", "Employee", employee.employeeCode);
  revalidatePath("/admin/employees");
  redirect("/admin/employees?deleted=1");
}
