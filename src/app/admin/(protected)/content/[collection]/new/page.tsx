import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCollection, isCollectionKey, toFormDef } from "@/lib/content-registry";
import { PageHeader, Notice } from "@/components/admin/ui";
import { CollectionForm } from "@/components/admin/form";
import { createItemAction } from "../../actions";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "New item" };
}

export default async function NewItemPage({
  params,
  searchParams,
}: {
  params: Promise<{ collection: string }>;
  searchParams: Promise<{ e?: string }>;
}) {
  const { collection: raw } = await params;
  if (!isCollectionKey(raw)) notFound();
  const def = getCollection(raw);
  const { e } = await searchParams;

  return (
    <div className="max-w-4xl">
      <PageHeader
        title={`New ${def.singular}`}
        description={`Add a ${def.singular} to ${def.label.toLowerCase()} — it goes live on the site the moment you create it.`}
      />
      {e === "invalid" ? <Notice kind="alert">Check the fields — a required value is missing or invalid.</Notice> : null}
      {e === "dup" ? <Notice kind="alert">That slug is already in use. Choose another.</Notice> : null}
      <CollectionForm
        def={toFormDef(def)}
        action={createItemAction}
        onCancelHref={`/admin/content/${def.key}`}
        titleValue=""
      />
    </div>
  );
}
