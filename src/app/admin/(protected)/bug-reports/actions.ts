"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { audit } from "@/lib/audit";

export async function updateBugStatusAction(formData: FormData): Promise<void> {
  const user = await requireAdmin();
  if (!prisma) redirect("/admin/bug-reports?e=Database%20unavailable.");

  const parsed = z
    .object({
      id: z.string().min(10).max(32),
      status: z.enum(["new", "acknowledged", "resolved", "ignored"]),
    })
    .safeParse({
      id: formData.get("id"),
      status: formData.get("status"),
    });
  if (!parsed.success) redirect("/admin/bug-reports?e=invalid");

  await prisma!.bugReport.update({
    where: { id: parsed.data.id },
    data: { status: parsed.data.status, handledBy: user.name },
  });
  await audit(user.id, "bug.status", "BugReport", parsed.data.id, { status: parsed.data.status });
  revalidatePath("/admin/bug-reports");
  redirect("/admin/bug-reports?saved=1");
}
