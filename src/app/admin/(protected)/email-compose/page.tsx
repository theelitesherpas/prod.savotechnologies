import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { PageHeader, Notice } from "@/components/admin/ui";
import { ComposeForm } from "@/components/admin/compose-form";

export const metadata: Metadata = { title: "Send email" };
export const dynamic = "force-dynamic";

/** Admin · Compose — send a branded one-off email to any address. */
export default async function AdminComposePage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; e?: string }>;
}) {
  const { sent, e } = await searchParams;
  const clients = prisma
    ? await prisma.clientUser.findMany({ where: { active: true }, select: { email: true, name: true }, orderBy: { name: "asc" }, take: 200 })
    : [];

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Send an email"
        description="A one-off email on the Savo brand — same shell as every automated email, sent from the configured mailbox."
      />
      {sent ? <Notice>Sent.</Notice> : null}
      {e ? <Notice kind="alert">{decodeURIComponent(e)}</Notice> : null}
      <ComposeForm clients={clients} />
    </div>
  );
}
