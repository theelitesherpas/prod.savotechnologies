import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAdminUser } from "@/lib/auth";
import { ServiceFields } from "@/components/admin/service-fields";
import { BackLink, PageHeader, Notice, DangerZone } from "@/components/admin/ui";
import { SubmitButton, ConfirmButton } from "@/components/admin/form";
import { updateServiceAction, deleteServiceAction } from "../actions";

export const metadata: Metadata = { title: "Edit service" };

export default async function EditServicePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; e?: string }>;
}) {
  const { id } = await params;
  const { saved, e } = await searchParams;

  const [user, service] = await Promise.all([
    getAdminUser(),
    prisma ? prisma.service.findUnique({ where: { id } }) : Promise.resolve(null),
  ]);
  if (!service) notFound();

  return (
    <div className="max-w-2xl">
      <BackLink href="/admin/services" label="All services" />
      <PageHeader title={`Edit · ${service.title}`} description={`/services/${service.slug}/`} />

      {saved ? <Notice>Saved. Public pages regenerate on the next request.</Notice> : null}
      {e === "dup" ? <Notice kind="alert">That slug is already in use by another service.</Notice> : null}
      {e === "invalid" ? <Notice kind="alert">Check the fields — titles need 2–80 characters, slugs lowercase/hyphens.</Notice> : null}

      <form action={updateServiceAction} className="adm-card space-y-5 p-5">
        <input type="hidden" name="id" value={service.id} />
        <ServiceFields
          service={{
            title: service.title,
            slug: service.slug,
            summary: service.summary ?? "",
            order: service.order,
            featured: service.featured,
            active: service.active,
          }}
        />
        <div className="flex items-center gap-3 border-t border-border pt-5">
          <SubmitButton label="Save changes" />
        </div>
      </form>

      {user?.role === "admin" ? (
        <div className="mt-8">
          <DangerZone title="Danger zone">
            <p className="t-sm mb-3 text-muted">
              Removes the service from the collection permanently. The site falls
              back to coded defaults only if the table becomes empty.
            </p>
            <form action={deleteServiceAction}>
              <input type="hidden" name="id" value={service.id} />
              <ConfirmButton label="Delete this service…" confirmLabel="Delete permanently" />
            </form>
          </DangerZone>
        </div>
      ) : null}
    </div>
  );
}
