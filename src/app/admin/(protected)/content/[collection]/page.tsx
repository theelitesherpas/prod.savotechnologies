import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCollection, isCollectionKey } from "@/lib/content-registry";
import { getAdminItems } from "@/lib/content-items";
import { prisma } from "@/lib/prisma";
import { PageHeader, Notice, Chip, EmptyState } from "@/components/admin/ui";
import { AdminIcon } from "@/components/admin/icons";
import { ConfirmButton } from "@/components/admin/form";
import { DragOrderList } from "@/components/admin/drag-order-list";
import {
  toggleItemAction,
  moveItemAction,
  reorderItemsAction,
  deleteItemAction,
  importDefaultsAction,
} from "../actions";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Content" };
}

const SAVED_MESSAGES: Record<string, string> = {
  created: "Item created and now live on the site.",
  updated: "Changes saved and live on the site.",
  deleted: "Item deleted.",
  imported: "Defaults imported - the collection is now editable.",
};

export default async function CollectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ collection: string }>;
  searchParams: Promise<{ saved?: string; n?: string; e?: string }>;
}) {
  const { collection: raw } = await params;
  if (!isCollectionKey(raw)) notFound();
  const def = getCollection(raw);
  const sp = await searchParams;

  const rows = prisma ? await getAdminItems(raw) : null;
  const items = rows ?? [];
  const fallback = !rows || rows.length === 0;
  const activeCount = items.filter((i) => i.active).length;

  return (
    <div>
      <PageHeader
        title={def.label}
        description={`${def.publicNote} ${fallback ? "The site currently renders the coded defaults." : `${activeCount} of ${items.length} published.`}`}
        actions={
          <>
            {fallback ? (
              <form action={importDefaultsAction}>
                <input type="hidden" name="collection" value={def.key} />
                <button
                  type="submit"
                  className="inline-flex h-10 items-center gap-2 rounded-lg border border-border px-4 text-[0.875rem] font-semibold text-foreground/80 transition-colors hover:border-foreground/40 hover:text-foreground"
                >
                  <AdminIcon name="import" className="h-4 w-4" />
                  Import defaults
                </button>
              </form>
            ) : null}
            <Link
              href={`/admin/content/${def.key}/new`}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-accent px-4 text-[0.875rem] font-semibold text-on-accent shadow-sm transition-colors hover:bg-accent-hover"
            >
              <AdminIcon name="plus" className="h-4 w-4" />
              New {def.singular}
            </Link>
          </>
        }
      />

      {sp.saved && SAVED_MESSAGES[sp.saved] ? (
        <Notice>
          {sp.saved === "imported" && sp.n ? `${SAVED_MESSAGES[sp.saved]} (${sp.n} items)` : SAVED_MESSAGES[sp.saved]}
        </Notice>
      ) : null}
      {sp.e === "invalid" ? <Notice kind="alert">Check the fields - a required value is missing or invalid.</Notice> : null}
      {sp.e === "dup" ? <Notice kind="alert">That slug is already in use. Choose another.</Notice> : null}

      {fallback ? (
        <EmptyState
          title={`No ${def.label.toLowerCase()} in the database`}
          message={`Until rows exist, the public site renders the coded defaults. Import them as a starting point, or add the first ${def.singular} fresh.`}
          actions={
            <>
              <form action={importDefaultsAction}>
                <input type="hidden" name="collection" value={def.key} />
                <button
                  type="submit"
                  className="inline-flex h-10 items-center gap-2 rounded-lg bg-accent px-4 text-[0.875rem] font-semibold text-on-accent shadow-sm transition-colors hover:bg-accent-hover"
                >
                  <AdminIcon name="import" className="h-4 w-4" />
                  Import defaults
                </button>
              </form>
              <Link
                href={`/admin/content/${def.key}/new`}
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-border px-4 text-[0.875rem] font-semibold text-foreground/80 transition-colors hover:border-foreground/40 hover:text-foreground"
              >
                <AdminIcon name="plus" className="h-4 w-4" />
                New {def.singular}
              </Link>
            </>
          }
        />
      ) : (
        <DragOrderList
          rows={items.map((item) => ({
            id: item.id,
            node: (
              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                <div className="min-w-0">
                  <Link
                    href={`/admin/content/${def.key}/${item.id}`}
                    className="block max-w-md truncate text-[0.875rem] font-semibold text-foreground transition-colors hover:text-accent"
                  >
                    {item.title}
                  </Link>
                  <span className="t-caption font-mono text-muted">
                    /{item.slug} · updated {item.updatedAt.toISOString().slice(0, 10)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {item.active ? <Chip tone="success">Published</Chip> : <Chip tone="warning">Hidden</Chip>}
                  <Link
                    href={`/admin/content/${def.key}/${item.id}`}
                    className="inline-flex h-9 items-center rounded-lg border border-border px-3.5 text-[0.8125rem] font-semibold text-foreground/80 transition-colors hover:border-foreground/40 hover:text-foreground"
                  >
                    Edit
                  </Link>
                  <form action={toggleItemAction}>
                    <input type="hidden" name="collection" value={def.key} />
                    <input type="hidden" name="id" value={item.id} />
                    <input type="hidden" name="active" value={item.active ? "false" : "true"} />
                    <button
                      type="submit"
                      className="inline-flex h-9 items-center gap-2 rounded-lg border border-border px-3.5 text-[0.8125rem] font-semibold text-muted transition-colors hover:border-foreground/40 hover:text-foreground"
                    >
                      <AdminIcon name={item.active ? "eyeOff" : "eye"} className="h-3.5 w-3.5" />
                      {item.active ? "Hide" : "Show"}
                    </button>
                  </form>
                  <form action={deleteItemAction}>
                    <input type="hidden" name="collection" value={def.key} />
                    <input type="hidden" name="id" value={item.id} />
                    <ConfirmButton label="Delete" confirmLabel="Confirm" />
                  </form>
                </div>
              </div>
            ),
          }))}
          reorder={reorderItemsAction}
          hidden={{ collection: def.key }}
        />
      )}
    </div>
  );
}
