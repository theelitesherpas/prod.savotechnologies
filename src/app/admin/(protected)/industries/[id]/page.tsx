import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAdminUser } from "@/lib/auth";
import { IndustryFields } from "@/components/admin/industry-fields";
import { BackLink, PageHeader, Notice, DangerZone } from "@/components/admin/ui";
import { SubmitButton, ConfirmButton } from "@/components/admin/form";
import { FormGuard } from "@/components/admin/form-guard";
import { updateIndustryAction, deleteIndustryAction } from "../actions";

export const metadata: Metadata = { title: "Edit industry" };

export default async function EditIndustryPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; e?: string }>;
}) {
  const { id } = await params;
  const { saved, e } = await searchParams;

  const [user, industry] = await Promise.all([
    getAdminUser(),
    prisma ? prisma.industry.findUnique({ where: { id } }) : Promise.resolve(null),
  ]);
  if (!industry) notFound();

  return (
    <div className="max-w-2xl">
      <BackLink href="/admin/industries" label="All industries" />
      <PageHeader title={`Edit · ${industry.title}`} description={`/industries/${industry.slug}/`} />

      {saved ? <Notice>Saved. Public pages regenerate on the next request.</Notice> : null}
      {e === "dup" ? <Notice kind="alert">That slug is already in use by another industry.</Notice> : null}
      {e === "invalid" ? <Notice kind="alert">Check the fields — titles need 2–80 characters, slugs lowercase/hyphens.</Notice> : null}

      <FormGuard action={updateIndustryAction} className="adm-card space-y-5 p-5">
        <input type="hidden" name="id" value={industry.id} />
        <IndustryFields
          industry={{
            title: industry.title,
            slug: industry.slug,
            summary: industry.summary ?? "",
            order: industry.order,
            active: industry.active,
          }}
        />
        <div className="flex items-center gap-3 border-t border-border pt-5">
          <SubmitButton label="Save changes" />
        </div>
      </FormGuard>

      {user?.role === "admin" ? (
        <div className="mt-8">
          <DangerZone title="Danger zone">
            <p className="t-sm mb-3 text-muted">
              Removes the industry from the collection permanently. The site falls
              back to coded defaults only if the table becomes empty.
            </p>
            <form action={deleteIndustryAction}>
              <input type="hidden" name="id" value={industry.id} />
              <ConfirmButton label="Delete this industry…" confirmLabel="Delete permanently" />
            </form>
          </DangerZone>
        </div>
      ) : null}
    </div>
  );
}
