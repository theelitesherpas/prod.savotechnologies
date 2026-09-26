import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { PageHeader, Notice } from "@/components/admin/ui";
import { ComposeForm } from "@/components/admin/compose-form";

export const metadata: Metadata = { title: "Send email" };
export const dynamic = "force-dynamic";

/** Admin · Compose - send a branded one-off email to any address. */
export default async function AdminComposePage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; e?: string; dept?: string; to?: string; subject?: string }>;
}) {
  const { sent, e } = await searchParams;
  const dept = new URLSearchParams(
    Object.entries(await searchParams).map(([k, v]) => [k, v ?? ""]),
  ).get("dept");
  const sp = await searchParams; const preTo = sp.to ?? ""; const preSubject = sp.subject ?? ""; const scoped: "hr" | "hello" | undefined = dept === "hr" || dept === "hello" ? dept : undefined;
  const [clients, employees] = prisma
    ? await Promise.all([
        prisma.clientUser.findMany({ where: { active: true }, select: { email: true, name: true }, orderBy: { name: "asc" }, take: 200 }),
        prisma.employee.findMany({
          orderBy: { createdAt: "desc" },
          select: { id: true, employeeCode: true, name: true, email: true, position: true, department: true, joiningDate: true, probationEnds: true, lastWorkingDay: true, ctc: true, manager: true, location: true, status: true, leaves: { select: { status: true, days: true } } },
        }),
      ])
    : [[], []];

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Send an email"
        description="A one-off email on the Savo brand - same shell as every automated email, sent from the configured mailbox."
      />
      {sent ? <Notice>Sent.</Notice> : null}
      {e ? <Notice kind="alert">{decodeURIComponent(e)}</Notice> : null}
      <ComposeForm clients={clients} employees={employees} dept={scoped} preTo={preTo} preSubject={preSubject} />
    </div>
  );
}
