"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";
import { requireSection } from "@/lib/permissions";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { clientFullName } from "@/lib/client-name";
import { PORTALS, recordModule, recordPath } from "@/lib/admin-portals";
import { parseRecordForm, recordDate, recordId } from "@/lib/admin-records";
import { CAREER_ENQUIRY_WHERE } from "@/lib/admin-enquiries";

/** Posted portal/module are untrusted selectors, never authorization. */
export async function saveOperationalRecord(form: FormData): Promise<void> {
  const user = await requireAdmin();
  const definition = recordModule(String(form.get("portal")), String(form.get("module")));
  if (!definition) redirect("/admin?denied=Unknown%20register");
  await requireSection(PORTALS[definition.portal].section);
  const path = recordPath(definition.portal, definition.key);
  const id = String(form.get("id") ?? "");
  const version = Number(form.get("version"));
  const back = id && recordId.safeParse(id).success ? `${path}?edit=${encodeURIComponent(id)}&` : `${path}?new=1&`;
  if (!prisma) redirect(`${back}e=Database%20unavailable`);
  if ((id && (!recordId.safeParse(id).success || !Number.isSafeInteger(version) || version < 1))) redirect(`${path}?e=Invalid%20record`);
  const parsed = parseRecordForm(definition, form);
  if (!parsed.success) redirect(`${back}e=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Check the fields.")}`);
  const d = parsed.data;
  let outcome: "saved" | "subject" | "conflict";
  try {
    outcome = await prisma.$transaction(async tx => {
      // Verify linkage in the same transaction; candidate registers cannot target sales leads.
      const subject = !d.subjectId ? null : definition.subject === "employee"
        ? await tx.employee.findUnique({ where: { id: d.subjectId }, select: { name: true, employeeCode: true } })
        : definition.subject === "client"
          ? await tx.clientUser.findUnique({ where: { id: d.subjectId }, select: { name: true, title: true, businessId: true } })
          : await tx.projectEnquiry.findFirst({ where: { AND: [CAREER_ENQUIRY_WHERE, { id: d.subjectId }] }, select: { name: true, reference: true } });
      if (d.subjectId && !subject) return "subject";
      const data = {
        title: d.title, status: d.status, owner: d.owner, startDate: recordDate(d.startDate), dueDate: recordDate(d.dueDate), notes: d.notes,
        data: d.data as Prisma.InputJsonObject, subjectLabel: subject ? clientFullName(subject.name, "title" in subject ? subject.title : undefined) : "", updatedBy: user.id,
        employeeId: definition.subject === "employee" && d.subjectId ? d.subjectId : null,
        clientId: definition.subject === "client" && d.subjectId ? d.subjectId : null,
        candidateId: definition.subject === "candidate" && d.subjectId ? d.subjectId : null,
      };
      let savedId = id;
      if (id) {
        const changed = await tx.adminOperationalRecord.updateMany({ where: { id, portal: definition.portal, module: definition.key, version }, data: { ...data, version: { increment: 1 } } });
        if (!changed.count) return "conflict";
      } else {
        const created = await tx.adminOperationalRecord.create({ data: { ...data, portal: definition.portal, module: definition.key, createdBy: user.id } });
        savedId = created.id;
      }
      // Audit and mutation commit together, without private payload contents.
      await tx.auditLog.create({ data: { userId: user.id, action: id ? "operations.update" : "operations.create", entity: "AdminOperationalRecord", entityId: savedId, meta: { portal: definition.portal, module: definition.key } } });
      return "saved";
    });
  } catch {
    redirect(`${back}e=Could%20not%20save.%20Check%20database%20setup%20and%20try%20again.`);
  }
  if (outcome === "subject") redirect(`${back}e=Choose%20an%20existing%20record%20from%20this%20department.`);
  if (outcome === "conflict") redirect(`${back}e=This%20record%20changed%20or%20was%20removed.%20Reload%20before%20saving.`);
  revalidatePath(path);
  revalidatePath(PORTALS[definition.portal].href);
  redirect(`${path}?saved=1`);
}

export async function deleteOperationalRecord(form: FormData): Promise<void> {
  const user = await requireAdmin();
  const definition = recordModule(String(form.get("portal")), String(form.get("module")));
  if (!definition) redirect("/admin?denied=Unknown%20register");
  await requireSection(PORTALS[definition.portal].section);
  if (user.role !== "admin") redirect("/admin?denied=Administrator%20required");
  const path = recordPath(definition.portal, definition.key);
  const id = recordId.safeParse(form.get("id"));
  const version = Number(form.get("version"));
  if (!prisma || !id.success || form.get("confirm") !== "DELETE" || !Number.isSafeInteger(version)) redirect(`${path}?e=Invalid%20deletion`);
  let deleted = false;
  try {
    deleted = await prisma.$transaction(async tx => {
      const result = await tx.adminOperationalRecord.deleteMany({ where: { id: id.data, portal: definition.portal, module: definition.key, version } });
      if (!result.count) return false;
      await tx.auditLog.create({ data: { userId: user.id, action: "operations.delete", entity: "AdminOperationalRecord", entityId: id.data, meta: { portal: definition.portal, module: definition.key } } });
      return true;
    });
  } catch { redirect(`${path}?e=Could%20not%20delete.%20Try%20again.`); }
  revalidatePath(path);
  revalidatePath(PORTALS[definition.portal].href);
  redirect(`${path}?${deleted ? "deleted=1" : "e=Record%20changed.%20Reload%20before%20deleting."}`);
}
