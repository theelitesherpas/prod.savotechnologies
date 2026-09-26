"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireAdminRole } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { revalidateManagedContent } from "@/lib/collections";
import {
  getCollection,
  isCollectionKey,
  type CollectionKey,
} from "@/lib/content-registry";
import { importDefaults } from "@/lib/content-items";

/**
 * Generic collection mutations. FormData is parsed against the
 * collection's registry schema; the title column mirrors the
 * collection's title field and everything else lands in `data` JSON.
 */

const slugify = (t: string) =>
  t.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

type ParsedItem = {
  title: string;
  slug: string;
  order: number;
  active: boolean;
  contentStatus: ContentLifecycle;
  data: Record<string, unknown>;
};

/** Content lifecycle (demo content policy) - publication is explicit. */
const LIFECYCLE = ["draft", "demo", "review", "verified", "published"] as const;
export type ContentLifecycle = (typeof LIFECYCLE)[number];
const parseLifecycle = (v: FormDataEntryValue | null): ContentLifecycle => {
  const s = typeof v === "string" ? v : "";
  return (LIFECYCLE as readonly string[]).includes(s) ? (s as ContentLifecycle) : "draft";
};

function parseItemForm(collection: CollectionKey, formData: FormData): ParsedItem | null {
  const def = getCollection(collection);
  const data: Record<string, unknown> = {};
  let title = "";
  let slug = "";

  for (const field of def.fields) {
    const raw = formData.get(field.name);

    if (field.type === "slug") {
      const s = slugify(typeof raw === "string" ? raw : "");
      if (!/^[a-z0-9-]{2,80}$/.test(s)) return null;
      slug = s;
      continue;
    }

    if (field.type === "boolean") {
      data[field.name] = raw === "on" || raw === "true";
      continue;
    }

    if (field.type === "number") {
      const n = Number(typeof raw === "string" ? raw : NaN);
      if (!Number.isFinite(n)) return null;
      data[field.name] = Math.round(n);
      continue;
    }

    if (field.type === "list") {
      let arr: unknown = null;
      try {
        arr = JSON.parse(typeof raw === "string" && raw ? raw : "[]");
      } catch {
        return null;
      }
      if (!Array.isArray(arr)) return null;
      data[field.name] = arr
        .map((x) => (typeof x === "string" ? x.trim() : ""))
        .filter(Boolean)
        .slice(0, 100);
      continue;
    }

    if (field.type === "object-list" || field.type === "blocks") {
      let arr: unknown = null;
      try {
        arr = JSON.parse(typeof raw === "string" && raw ? raw : "[]");
      } catch {
        return null;
      }
      if (!Array.isArray(arr)) return null;
      data[field.name] = arr.slice(0, 200);
      continue;
    }

    // text / textarea / select
    const s = typeof raw === "string" ? raw.trim() : "";
    if (field.required && !s) return null;
    if (s.length > (field.type === "textarea" ? 16000 : 2000)) return null;
    if (field.type === "select" && field.options && !field.options.some((o) => o.value === s)) {
      return null;
    }
    data[field.name] = s;
    if (field.name === def.titleField) title = s;
  }

  if (!title) return null;

  // Collections without an explicit slug field (case studies) derive it
  // from the title - guaranteeing a non-empty unique-ish key.
  if (!slug) {
    slug = slugify(title);
    if (!/^[a-z0-9-]{2,80}$/.test(slug)) return null;
  }

  const order = z.coerce.number().int().min(0).max(999).catch(0).parse(formData.get("order") ?? 0);
  const active = formData.get("active") === "on" || formData.get("active") === "true";
  const contentStatus = parseLifecycle(formData.get("contentStatus"));

  return { title, slug, order, active, contentStatus, data };
}

async function readCollection(formData: FormData): Promise<CollectionKey | null> {
  const key = formData.get("collection");
  return typeof key === "string" && isCollectionKey(key) ? key : null;
}

export async function createItemAction(formData: FormData): Promise<void> {
  const user = await requireAdmin();
  const collection = await readCollection(formData);
  if (!collection || !prisma) redirect("/admin?e=invalid");

  const parsed = parseItemForm(collection, formData);
  const base = `/admin/content/${collection}`;
  if (!parsed) redirect(`${base}/new?e=invalid`);

  // Author tracking + approval workflow: editors create as "review"
  // (pending admin approval); admins can publish directly.
  const adminUser = await prisma.adminUser.findUnique({
    where: { id: user.id },
    select: { employeeId: true, employee: { select: { id: true, name: true } }, role: true },
  });
  const author = adminUser?.employee ?? null;
  const isEditor = adminUser?.role !== "admin";
  const effectiveStatus = isEditor && parsed.contentStatus === "published" ? "review" : parsed.contentStatus;

  try {
    await prisma!.contentItem.create({
      data: {
        collection,
        slug: parsed.slug,
        title: parsed.title,
        order: parsed.order,
        active: parsed.active,
        contentStatus: effectiveStatus,
        publishedAt: effectiveStatus === "published" ? new Date() : null,
        data: parsed.data as Prisma.InputJsonValue,
        ...(author ? { authorId: author.id, authorName: author.name } : {}),
      },
    });
  } catch {
    redirect(`${base}/new?e=dup`);
  }

  await audit(user.id, "content.create", "ContentItem", `${collection}:${parsed.slug}`);
  await revalidateManagedContent();
  redirect(`${base}?saved=created`);
}

export async function updateItemAction(formData: FormData): Promise<void> {
  const user = await requireAdmin();
  const collection = await readCollection(formData);
  const id = z.string().min(10).max(32).parse(formData.get("id"));
  const base = `/admin/content/${collection ?? ""}`;
  if (!collection || !prisma) redirect("/admin?e=invalid");

  const parsed = parseItemForm(collection, formData);
  if (!parsed) redirect(`${base}/${id}?e=invalid`);

  // Approval workflow: editors cannot self-publish; their edits revert to review.
  const adminUser2 = await prisma.adminUser.findUnique({
    where: { id: user.id },
    select: { role: true },
  });
  const isEditor2 = adminUser2?.role !== "admin";
  const effectiveStatus2 = isEditor2 && parsed.contentStatus === "published" ? "review" : parsed.contentStatus;

  try {
    await prisma!.contentItem.update({
      where: { id },
      data: {
        slug: parsed.slug,
        title: parsed.title,
        order: parsed.order,
        active: parsed.active,
        contentStatus: effectiveStatus2,
        ...(effectiveStatus2 === "published" ? { publishedAt: new Date() } : {}),
        data: parsed.data as Prisma.InputJsonValue,
      },
    });
  } catch {
    redirect(`${base}/${id}?e=dup`);
  }

  await audit(user.id, "content.update", "ContentItem", `${collection}:${parsed.slug}`);
  await revalidateManagedContent();
  redirect(`${base}?saved=updated`);
}

export async function toggleItemAction(formData: FormData): Promise<void> {
  const user = await requireAdmin();
  const collection = await readCollection(formData);
  const id = z.string().min(10).max(32).parse(formData.get("id"));
  const active = formData.get("active") === "true";
  if (!collection || !prisma) redirect("/admin?e=invalid");

  await prisma!.contentItem.update({ where: { id }, data: { active } });
  await audit(user.id, active ? "content.activate" : "content.deactivate", "ContentItem", id);
  await revalidateManagedContent();
  revalidatePath(`/admin/content/${collection}`);
}

export async function moveItemAction(formData: FormData): Promise<void> {
  const user = await requireAdmin();
  const collection = await readCollection(formData);
  const id = z.string().min(10).max(32).parse(formData.get("id"));
  const dir = formData.get("dir") === "down" ? 1 : -1;
  if (!collection || !prisma) redirect("/admin?e=invalid");

  // Swap `order` with the adjacent row - small collections, cheap query.
  const rows = await prisma!.contentItem.findMany({
    where: { collection },
    orderBy: [{ order: "asc" }, { updatedAt: "asc" }],
    select: { id: true, order: true },
  });
  const idx = rows.findIndex((r) => r.id === id);
  if (idx >= 0 && idx + dir >= 0 && idx + dir < rows.length) {
    const a = rows[idx];
    const b = rows[idx + dir];
    await prisma!.$transaction([
      prisma!.contentItem.update({ where: { id: a.id }, data: { order: b.order } }),
      prisma!.contentItem.update({ where: { id: b.id }, data: { order: a.order } }),
    ]);
    await audit(user.id, "content.move", "ContentItem", id, { dir });
    await revalidateManagedContent();
  }
  revalidatePath(`/admin/content/${collection}`);
}

export async function deleteItemAction(formData: FormData): Promise<void> {
  const user = await requireAdminRole(); // destructive: admin role only
  const collection = await readCollection(formData);
  const id = z.string().min(10).max(32).parse(formData.get("id"));
  if (!collection || !prisma) redirect("/admin?e=invalid");

  const deleted = await prisma!.contentItem.deleteMany({ where: { id, collection } });
  if (deleted.count) await audit(user.id, "content.delete", "ContentItem", id);
  await revalidateManagedContent();
  redirect(`/admin/content/${collection}?saved=deleted`);
}

/** Materialize the constants baseline so the collection becomes editable. */
export async function importDefaultsAction(formData: FormData): Promise<void> {
  const user = await requireAdmin();
  const collection = await readCollection(formData);
  if (!collection || !prisma) redirect("/admin?e=invalid");

  const count = await importDefaults(collection);
  await audit(user.id, "content.import_defaults", "ContentItem", collection, { count });
  redirect(`/admin/content/${collection}?saved=imported&n=${count}`);
}
