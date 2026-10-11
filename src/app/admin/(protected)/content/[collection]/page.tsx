import { requireAdminPage } from "@/lib/permissions";
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
  reorderItemsAction,
  deleteItemAction,
  importDefaultsAction,
  saveAboutHeroAction,
} from "../actions";
import { getSettings } from "@/lib/settings";
import { SitePhotoForm } from "@/components/admin/site-photo-form";
import { ABOUT_HERO_ALT, ABOUT_HERO_HEIGHT, ABOUT_HERO_WIDTH } from "@/constants/about";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Content" };
}

const SAVED_MESSAGES: Record<string, string> = {
  created: "Item created. Public visibility follows its active flag and publication status.",
  updated: "Changes saved. Public visibility follows its active flag and publication status.",
  deleted: "Item deleted.",
  imported: "Defaults imported - the collection is now editable.",
  hero: "About photo saved. The public About page regenerates on the next request.",
};

export default async function CollectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ collection: string }>;
  searchParams: Promise<{ saved?: string; n?: string; e?: string }>;
}) {
  await requireAdminPage("/admin/content/[collection]");
  const { collection: raw } = await params;
  if (!isCollectionKey(raw)) notFound();
  const def = getCollection(raw);
  const sp = await searchParams;

  const rows = prisma ? await getAdminItems(raw) : null;
  const items = rows ?? [];
  const fallback = !rows || rows.length === 0;
  const hasSeeds = def.seeds().length > 0;
  const activeCount = items.filter((i) => i.active && i.contentStatus === "published").length;

  return (
    <div>
      <PageHeader
        title={def.label}
        description={`${def.publicNote} ${fallback ? (hasSeeds ? "The site currently renders the coded defaults." : "No published profiles are available yet.") : `${activeCount} of ${items.length} published.`}`}
        actions={
          <>
            {fallback && hasSeeds ? (
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
      {sp.e && sp.e !== "invalid" && sp.e !== "dup" ? <Notice kind="alert">{decodeURIComponent(sp.e)}</Notice> : null}

      {def.key === "team" ? <AboutHeroPanel /> : null}

      {fallback ? (
        <EmptyState
          title={`No ${def.label.toLowerCase()} in the database`}
          message={hasSeeds ? `Until rows exist, the public site renders the coded defaults. Import them as a starting point, or add the first ${def.singular} fresh.` : `There are no published team profiles yet. Add the first ${def.singular} when their details and portrait are approved.`}
          actions={
            <>
              {hasSeeds ? <form action={importDefaultsAction}>
                <input type="hidden" name="collection" value={def.key} />
                <button
                  type="submit"
                  className="inline-flex h-10 items-center gap-2 rounded-lg bg-accent px-4 text-[0.875rem] font-semibold text-on-accent shadow-sm transition-colors hover:bg-accent-hover"
                >
                  <AdminIcon name="import" className="h-4 w-4" />
                  Import defaults
                </button>
              </form> : null}
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
                  {item.active && item.contentStatus === "published" ? <Chip tone="success">Published</Chip> : <Chip tone="warning">{item.active ? item.contentStatus : "Hidden"}</Chip>}
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

/**
 * About page hero photo panel - rendered only on the About team
 * collection. The photo beside "One team, accountable since {year}." on
 * /about; uploads crop to exactly ABOUT_HERO_WIDTH × ABOUT_HERO_HEIGHT
 * (the slot's canonical 6:5 desktop aspect at 2× its ~650px render
 * width). Narrower viewports crop the same master wider, like the coded
 * photo always has.
 */
async function AboutHeroPanel() {
  const settings = await getSettings();
  return (
    <section className="adm-card mb-6 space-y-5 p-5 sm:p-6">
      <div>
        <h2 className="text-[0.9375rem] font-bold text-foreground">About page hero photo</h2>
        <p className="t-caption mt-1 text-muted">
          The photo beside “One team, accountable” on /about. Uploads are cropped to the
          canonical desktop slot - exactly {ABOUT_HERO_WIDTH} × {ABOUT_HERO_HEIGHT} px (6:5).
          Phones and tablets show the same master, cropped slightly wider by the design;
          position the crop for what must stay visible. Leave the crop tool untouched to
          keep the current photo.
        </p>
      </div>
      <SitePhotoForm
        action={saveAboutHeroAction}
        currentImage={settings.aboutHeroImage}
        currentAlt={settings.aboutHeroAlt}
        fallbackAlt={ABOUT_HERO_ALT}
        targetWidth={ABOUT_HERO_WIDTH}
        targetHeight={ABOUT_HERO_HEIGHT}
        uploadLabel="Replacement photo"
        uploadHint="Shown beside “One team, accountable” on /about - exported at exactly 1320 × 1100 px (6:5)."
        saveLabel="Save about photo"
      />
    </section>
  );
}
