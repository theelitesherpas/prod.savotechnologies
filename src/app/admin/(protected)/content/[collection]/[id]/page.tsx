import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCollection, isCollectionKey, toFormDef } from "@/lib/content-registry";
import { requireAdminRole } from "@/lib/auth";
import { BackLink, PageHeader, Notice, DangerZone } from "@/components/admin/ui";
import { CollectionForm, ConfirmButton } from "@/components/admin/form";
import { updateItemAction, deleteItemAction } from "../../actions";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Edit item" };
}

export default async function EditItemPage({
  params,
  searchParams,
}: {
  params: Promise<{ collection: string; id: string }>;
  searchParams: Promise<{ e?: string }>;
}) {
  const { collection: raw, id } = await params;
  if (!isCollectionKey(raw) || !prisma) notFound();
  const def = getCollection(raw);
  const { e } = await searchParams;
  const [item, user] = await Promise.all([
    prisma.contentItem.findUnique({ where: { id } }),
    requireAdminRole().catch(() => null),
  ]);
  if (!item || item.collection !== def.key) notFound();

  const data = (item.data ?? {}) as Record<string, unknown>;

  return (
    <div className="max-w-4xl">
      <BackLink href={`/admin/content/${def.key}`} label={`All ${def.label.toLowerCase()}`} />
      <PageHeader title={`Edit ${def.singular}`} description={`${def.publicNote} Slug /${item.slug}`} />

      {e === "invalid" ? <Notice kind="alert">Check the fields — a required value is missing or invalid.</Notice> : null}
      {e === "dup" ? <Notice kind="alert">That slug is already in use. Choose another.</Notice> : null}

      <CollectionForm
        def={toFormDef(def)}
        action={updateItemAction}
        onCancelHref={`/admin/content/${def.key}`}
        titleValue={typeof data[def.titleField] === "string" ? (data[def.titleField] as string) : item.title}
        item={{
          id: item.id,
          slug: item.slug,
          title: item.title,
          data,
          order: item.order,
          active: item.active,
          updatedAt: item.updatedAt.toISOString(),
        }}
      />

      {user ? (
        <div className="mt-8">
          <DangerZone title="Danger zone">
            <p className="t-sm mb-3 text-muted">
              Deleting removes this {def.singular} from the database permanently. The public site
              falls back to the coded defaults only when no rows remain.
            </p>
            <form action={deleteItemAction}>
              <input type="hidden" name="collection" value={def.key} />
              <input type="hidden" name="id" value={item.id} />
              <ConfirmButton label={`Delete this ${def.singular}`} confirmLabel="Delete permanently" />
            </form>
          </DangerZone>
        </div>
      ) : null}
    </div>
  );
}
