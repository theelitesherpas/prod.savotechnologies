"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireAdminRole } from "@/lib/auth";
import { requireSection } from "@/lib/permissions";
import { audit } from "@/lib/audit";
import { revalidateManagedContent } from "@/lib/collections";
import {
  getCollection,
  isCollectionKey,
  type CollectionKey,
} from "@/lib/content-registry";
import { importDefaults } from "@/lib/content-items";
import { insightRichHtmlToText, sanitizeInsightRichHtml } from "@/lib/insight-rich-text";
import { industryDossierSchema } from "@/content/industries/schema";
import { ABOUT_TEAM_PHOTO_SIZE } from "@/constants/about-team";
import { persistTestimonialPoster } from "@/lib/testimonial-poster";
import { isAllowedStoredPhoto, persistSitePhoto } from "@/lib/site-photo";
import { ABOUT_HERO_ALT, ABOUT_HERO_HEIGHT, ABOUT_HERO_WIDTH } from "@/constants/about";

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

    if (field.type === "image") {
      const image = typeof raw === "string" ? raw.trim() : "";
      const dataUrl = /^data:image\/(?:jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(image);
      const legacyUploadedPath = /^\/api\/insight-image\?v=([a-f0-9]{64})$/i.exec(image);
      const uploadedPath = /^\/api\/insight-image\/([a-f0-9]{64})$/i.exec(image);
      const localPath = /^\/images\/[a-zA-Z0-9_./-]+\.(?:webp|png|jpe?g|avif|svg)$/i.test(image)
        || !!legacyUploadedPath
        || !!uploadedPath;
      if ((field.required && !image) || (image && ((!dataUrl && !localPath) || (dataUrl && image.length > 700_000) || image.includes("..")))) return null;
      data[field.name] = legacyUploadedPath ? `/api/insight-image/${legacyUploadedPath[1].toLowerCase()}` : image;
      if (field.altFieldName) {
        const alt = formData.get(field.altFieldName);
        const altText = typeof alt === "string" ? alt.trim() : "";
        if (altText.length > 200 || (field.altFieldRequired && !altText)) return null;
        data[field.altFieldName] = altText;
      }
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
      const values = arr
        .map((x) => (typeof x === "string" ? x.trim() : ""))
        .filter(Boolean)
        .slice(0, 100);
      if ((field.required && values.length === 0) || (field.options && values.some((value) => !field.options!.some((option) => option.value === value)))) return null;
      data[field.name] = [...new Set(values)];
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
      const blocks = arr.slice(0, 200);
      if (collection === "insights" && field.name === "body") {
        let totalHtmlLength = 0;
        const safeBlocks: Record<string, unknown>[] = [];
        for (const value of blocks) {
          if (!value || typeof value !== "object" || Array.isArray(value)) continue;
          const block = value as Record<string, unknown>;
          if (typeof block.html === "string") {
            const html = sanitizeInsightRichHtml(block.html);
            totalHtmlLength += html.length;
            if (totalHtmlLength > 300_000) return null;
            if (insightRichHtmlToText(html)) safeBlocks.push({ html });
            continue;
          }
          const h = typeof block.h === "string" ? block.h.trim().slice(0, 10000) : "";
          const p = typeof block.p === "string" ? block.p.trim().slice(0, 20000) : "";
          const li = Array.isArray(block.li) ? block.li.filter((line): line is string => typeof line === "string").map((line) => line.trim().slice(0, 10000)).filter(Boolean).slice(0, 200) : [];
          if (h) safeBlocks.push({ h });
          else if (p) safeBlocks.push({ p });
          else if (li.length) safeBlocks.push({ li });
        }
        const hasBodyText = safeBlocks.some((block) => typeof block.html === "string"
          ? !!insightRichHtmlToText(block.html)
          : (typeof block.h === "string" && !!block.h) || (typeof block.p === "string" && !!block.p) || (Array.isArray(block.li) && block.li.length > 0));
        if (field.required && !hasBodyText) return null;
        data[field.name] = safeBlocks;
        continue;
      }
      if (field.required && !blocks.some((value) => {
        if (!value || typeof value !== "object" || Array.isArray(value)) return false;
        const block = value as Record<string, unknown>;
        return (typeof block.h === "string" && block.h.trim())
          || (typeof block.p === "string" && block.p.trim())
          || (Array.isArray(block.li) && block.li.some((line) => typeof line === "string" && line.trim()));
      })) return null;
      data[field.name] = blocks;
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
  if (collection === "industry-dossiers" && contentStatus === "published") {
    const dossier = industryDossierSchema.safeParse({ ...data, title, slug });
    if (!dossier.success) return null;
    return { title, slug, order, active, contentStatus, data: dossier.data };
  }

  return { title, slug, order, active, contentStatus, data };
}

async function persistTeamPhoto(value: unknown): Promise<string | null> {
  if (typeof value !== "string") return null;
  const match = /^data:image\/(?:jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(value);
  if (!match || value.length > 700_000) return null;
  try {
    const input = Buffer.from(match[1], "base64");
    if (!input.length || input.length > 500_000) return null;
    const metadata = await sharp(input, { limitInputPixels: 1_000_000 }).metadata();
    if (metadata.width !== ABOUT_TEAM_PHOTO_SIZE.width || metadata.height !== ABOUT_TEAM_PHOTO_SIZE.height || !["jpeg", "webp"].includes(metadata.format ?? "")) return null;
    const output = await sharp(input, { limitInputPixels: 1_000_000 })
      .rotate()
      .resize(ABOUT_TEAM_PHOTO_SIZE.width, ABOUT_TEAM_PHOTO_SIZE.height, { fit: "cover", position: "centre" })
      .webp({ quality: 76, effort: 5 })
      .toBuffer();
    if (output.length > 180_000) return null;
    return `data:image/webp;base64,${output.toString("base64")}`;
  } catch {
    return null;
  }
}

async function validateTeamData(data: Record<string, unknown>): Promise<boolean> {
  const photo = await persistTeamPhoto(data.photo);
  if (!photo) return false;
  const linkedinUrl = typeof data.linkedinUrl === "string" ? data.linkedinUrl : "";
  if (linkedinUrl) {
    try {
      const url = new URL(linkedinUrl);
      if (url.protocol !== "https:" || !["linkedin.com", "www.linkedin.com"].includes(url.hostname) || !/^\/in\/[A-Za-z0-9_%.-]+\/?$/.test(url.pathname) || url.search || url.hash) return false;
    } catch {
      return false;
    }
  }
  const email = typeof data.email === "string" ? data.email : "";
  if (email && !z.email().safeParse(email).success) return false;
  data.photo = photo;
  return true;
}

async function persistInsightImage(value: unknown): Promise<string | null> {
  if (typeof value !== "string" || !value) return typeof value === "string" ? "" : null;
  const match = /^data:image\/(?:jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(value);
  if (!match) {
    const localImage = /^\/images\/[a-zA-Z0-9_./-]+\.(?:webp|png|jpe?g|avif|svg)$/i.test(value) && !value.includes("..");
    const uploadedImage = /^\/api\/insight-image(?:\/|\?v=)([a-f0-9]{64})$/i.exec(value);
    return localImage ? value : uploadedImage ? `/api/insight-image/${uploadedImage[1].toLowerCase()}` : null;
  }

  try {
    const input = Buffer.from(match[1], "base64");
    if (!input.length || input.length > 500_000) return null;
    const metadata = await sharp(input, { limitInputPixels: 1_500_000 }).metadata();
    if (metadata.width !== 1600 || metadata.height !== 900 || !["jpeg", "webp"].includes(metadata.format ?? "")) return null;

    let output: Buffer | null = null;
    for (const quality of [78, 70, 62, 54, 46]) {
      output = await sharp(input)
        .rotate()
        .resize(1600, 900, { fit: "cover", position: "centre" })
        .webp({ quality, effort: 5 })
        .toBuffer();
      if (output.length <= 220_000) break;
    }
    if (!output || output.length > 320_000) return null;

    const hash = createHash("sha256").update(output).digest("hex");
    const relativePath = `/api/insight-image/${hash}`;
    const directory = join(process.cwd(), "public", "uploads", "insights");
    await mkdir(directory, { recursive: true });
    try {
      await writeFile(join(directory, `${hash}.webp`), output, { flag: "wx" });
    } catch (error) {
      if (!(error && typeof error === "object" && "code" in error && error.code === "EEXIST")) return null;
    }
    return relativePath;
  } catch {
    return null;
  }
}

async function readCollection(formData: FormData): Promise<CollectionKey | null> {
  const key = formData.get("collection");
  return typeof key === "string" && isCollectionKey(key) ? key : null;
}

export async function createItemAction(formData: FormData): Promise<void> {
  const user = await requireAdmin();
  await requireSection("content");
  const collection = await readCollection(formData);
  if (!collection || !prisma) redirect("/admin?e=invalid");

  const parsed = parseItemForm(collection, formData);
  const base = `/admin/content/${collection}`;
  if (!parsed) redirect(`${base}/new?e=invalid`);
  if (collection === "team" && !(await validateTeamData(parsed.data))) redirect(`${base}/new?e=invalid`);
  if (collection === "testimonials") {
    const poster = await persistTestimonialPoster(parsed.data.posterImage);
    if (poster === null) redirect(`${base}/new?e=invalid`);
    parsed.data.posterImage = poster;
  }
  if (collection === "insights") {
    const image = await persistInsightImage(parsed.data.image);
    if (image === null) redirect(`${base}/new?e=invalid`);
    parsed.data.image = image;
  }

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
  await requireSection("content");
  const collection = await readCollection(formData);
  const id = z.string().min(10).max(32).parse(formData.get("id"));
  const base = `/admin/content/${collection ?? ""}`;
  if (!collection || !prisma) redirect("/admin?e=invalid");

  const parsed = parseItemForm(collection, formData);
  if (!parsed) redirect(`${base}/${id}?e=invalid`);

  const existingItem = collection === "insights"
    ? await prisma!.contentItem.findUnique({ where: { id }, select: { collection: true, contentStatus: true, publishedAt: true, data: true } })
    : null;
  if (collection === "team" && !(await validateTeamData(parsed.data))) redirect(`${base}/${id}?e=invalid`);
  if (collection === "testimonials") {
    const poster = await persistTestimonialPoster(parsed.data.posterImage);
    if (poster === null) redirect(`${base}/${id}?e=invalid`);
    parsed.data.posterImage = poster;
  }
  if (collection === "insights") {
    if (!existingItem || existingItem.collection !== collection) redirect(`${base}/${id}?e=invalid`);
    const image = await persistInsightImage(parsed.data.image);
    if (image === null) redirect(`${base}/${id}?e=invalid`);
    parsed.data.image = image;
    const previousData = existingItem.data && typeof existingItem.data === "object" && !Array.isArray(existingItem.data)
      ? existingItem.data as Record<string, unknown>
      : {};
    for (const legacyField of ["date", "time"]) {
      if (!(legacyField in parsed.data) && typeof previousData[legacyField] === "string") {
        parsed.data[legacyField] = previousData[legacyField];
      }
    }
  }

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
        publishedAt: effectiveStatus2 === "published"
          ? existingItem?.contentStatus === "published" ? existingItem.publishedAt ?? new Date() : new Date()
          : null,
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
  await requireSection("content");
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
  await requireSection("content");
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
export async function reorderItemsAction(formData: FormData): Promise<void> {
  await requireAdmin();
  await requireSection("content");
  if (!prisma) redirect("/admin/content?e=Database%20unavailable.");
  const collection = z.enum(["insights", "careers", "hire", "ai-services", "agents", "industry-dossiers", "team"]).parse(formData.get("collection"));
  let ids: string[] = [];
  try {
    ids = z.array(z.string().min(10).max(32)).min(1).max(200).parse(JSON.parse(String(formData.get("order"))));
  } catch {
    redirect(`/admin/content/${collection}?e=Invalid%20order.`);
  }
  await prisma!.$transaction(ids.map((id, i) => prisma!.contentItem.updateMany({ where: { id, collection }, data: { order: i } })));
  await revalidateManagedContent();
  revalidatePath(`/admin/content/${collection}`);
}

export async function importDefaultsAction(formData: FormData): Promise<void> {
  const user = await requireAdmin();
  await requireSection("content");
  const collection = await readCollection(formData);
  if (!collection || !prisma) redirect("/admin?e=invalid");

  const count = await importDefaults(collection);
  await audit(user.id, "content.import_defaults", "ContentItem", collection, { count });
  redirect(`/admin/content/${collection}?saved=imported&n=${count}`);
}

/**
 * About page hero photo - the figure beside "One team, accountable since
 * {year}." on /about. Managed from the About team collection page
 * (Website content → About team); stored as SiteSetting keys
 * (about_hero_image / about_hero_alt). The crop tool fixes uploads at
 * exactly ABOUT_HERO_WIDTH × ABOUT_HERO_HEIGHT (the slot's canonical 6:5
 * desktop aspect at 2× its ~650px render width; narrower viewports crop
 * the same master wider via object-fit:cover, like the coded photo).
 */
export async function saveAboutHeroAction(formData: FormData): Promise<void> {
  const user = await requireAdmin();
  await requireSection("content");

  const image = String(formData.get("image") ?? "");
  const alt = String(formData.get("alt") ?? "")
    .trim()
    .slice(0, 200);

  // A fresh upload arrives as a data URL; an untouched form resubmits the
  // currently stored (already validated) path - only the alt may change.
  let stored: string | null = null;
  if (image.startsWith("data:image/")) stored = await persistSitePhoto(image, ABOUT_HERO_WIDTH, ABOUT_HERO_HEIGHT);
  else if (image && isAllowedStoredPhoto(image)) stored = image;
  if (!stored) {
    redirect(`/admin/content/team?e=${encodeURIComponent("Invalid about photo - attach one with the crop tool and save again.")}`);
  }

  const heroAlt = alt || ABOUT_HERO_ALT;

  await prisma!.$transaction([
    prisma!.siteSetting.upsert({
      where: { key: "about_hero_image" },
      create: { key: "about_hero_image", value: stored },
      update: { value: stored },
    }),
    prisma!.siteSetting.upsert({
      where: { key: "about_hero_alt" },
      create: { key: "about_hero_alt", value: heroAlt },
      update: { value: heroAlt },
    }),
  ]);

  await audit(user.id, "content.hero", "SiteSetting", "about_hero_image", {
    image: stored,
    alt: heroAlt,
  });
  await revalidateManagedContent();
  redirect("/admin/content/team?saved=hero");
}
