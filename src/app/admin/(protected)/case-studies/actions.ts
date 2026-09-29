"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { requireAdmin } from "@/lib/auth";
import { requireSection } from "@/lib/permissions";
import { audit } from "@/lib/audit";
import { caseStudySchema, slugifyCaseStudy } from "@/lib/case-study-schema";
import { CASE_STUDY_DETAILS } from "@/constants/case-studies";
import { DEMO_CASE_STUDIES } from "@/content/demo/case-studies";
import { IS_DEMO } from "@/lib/content-mode";

/**
 * Case-study mutations for the dedicated rich editor (/admin/case-studies).
 *
 * The form submits one JSON payload (assembled by the client-side
 * CaseStudyForm) which is validated by the shared caseStudySchema - the
 * same schema the public renderer trusts, so admin input and public output
 * can never drift. Records land in ContentItem (collection "case-studies")
 * with an explicit lifecycle; only "published" rows render publicly.
 */

const LIFECYCLE = ["draft", "demo", "review", "verified", "published"] as const;

const formSchema = z.object({
  id: z.string().min(10).max(32).optional(),
  slug: z.string().regex(/^[a-z0-9-]{2,80}$/).optional(),
  payload: z.string().min(2),
  contentStatus: z.enum(LIFECYCLE),
  order: z.coerce.number().int().min(0).max(9999).optional(),
});

/** Invalidate every surface that renders case studies: the homepage,
 *  the dossier index and its detail pages (root-layout wide), plus the
 *  sitemap whose URLs change as records publish/unpublish. */
function revalidateCaseStudies(slug?: string) {
  revalidatePath("/", "layout");
  revalidatePath("/sitemap.xml");
  if (slug) revalidatePath(`/case-studies/${slug}`);
}

export async function saveCaseStudyAction(formData: FormData): Promise<void> {
  const user = await requireAdmin();
  await requireSection("content");
  if (!prisma) redirect("/admin/case-studies?e=db");

  const form = formSchema.safeParse({
    id: formData.get("id") || undefined,
    slug: formData.get("slug") || undefined,
    payload: formData.get("payload"),
    contentStatus: formData.get("contentStatus"),
    order: formData.get("order") ?? undefined,
  });
  if (!form.success) redirect("/admin/case-studies?e=invalid");

  const record = caseStudySchema.safeParse(JSON.parse(form.data.payload));
  if (!record.success) {
    logger.warn("case_studies.schema_rejected", {
      issues: record.error.issues.slice(0, 5).map(i => `${i.path.join(".")}: ${i.message}`),
    });
    redirect(`/admin/case-studies?e=${encodeURIComponent(
      `Validation failed: ${record.error.issues[0]?.path.join(".") ?? "unknown"} — ${record.error.issues[0]?.message ?? "check all fields"}`,
    )}`);
  }

  const data = record.data;

  /* Completeness is a PUBLISH requirement, not a save requirement — an
     in-progress record may always be saved as draft/review. A publish
     attempt with missing fields is downgraded to draft, SAVED, and the
     editor is redirected back with the list of gaps — work is never
     lost. (Exceptions per owner: author credit and live URL.) */
  const missing: string[] = [];
  if (!data.clientName?.trim()) missing.push("Client name");
  if (!data.displayClientName?.trim()) missing.push("Display name");
  if (!data.clientLocation?.trim()) missing.push("Client location");
  if (!data.businessModel?.trim()) missing.push("Business model");
  if (!data.platforms?.trim()) missing.push("Platforms");
  if (!data.images?.showcase) missing.push("Showcase image");
  if (!data.images?.cardWide) missing.push("Featured card image");
  if (!data.images?.card) missing.push("Standard card image");
  if (!data.images?.dossierCard) missing.push("Dossier card image");
  if (!data.gallery || data.gallery.length === 0) missing.push("Gallery (1 image min)");
  if (!data.integrations || data.integrations.length === 0) missing.push("Integrations (1 min)");
  if (!data.palette || data.palette.length === 0) missing.push("Palette (1 color min)");
  if (!data.testimonial) missing.push("Client testimonial");
  const downgradedToDraft = missing.length > 0 && form.data.contentStatus === "published";
  const effectiveStatus = downgradedToDraft ? "draft" : form.data.contentStatus;
  const slug = form.data.slug || slugifyCaseStudy(data.title);
  if (!/^[a-z0-9-]{2,80}$/.test(slug)) redirect("/admin/case-studies?e=invalid");

  const values = {
    collection: "case-studies",
    slug,
    title: data.title,
    order: form.data.order ?? 0,
    active: true,
    contentStatus: effectiveStatus,
    ...(effectiveStatus === "published" ? { publishedAt: new Date() } : {}),
    data: data as unknown as import("@prisma/client").Prisma.InputJsonValue,
  };

  let savedId = form.data.id;
  try {
    if (form.data.id) {
      await prisma.contentItem.update({ where: { id: form.data.id }, data: values });
    } else {
      const created = await prisma.contentItem.create({ data: values });
      savedId = created.id;
    }
  } catch (err) {
    const code = err && typeof err === "object" && "code" in err ? String(err.code) : "";
    if (code === "P2002") {
      redirect(`/admin/case-studies?e=dup`);
    }
    logger.error("case_studies.save_failed", {
      code,
      message: err instanceof Error ? err.message.slice(0, 300) : String(err),
    });
    redirect(`/admin/case-studies?e=save`);
  }

  await audit(user.id, form.data.id ? "caseStudy.update" : "caseStudy.create", "ContentItem", `case-studies:${slug}`);

  revalidateCaseStudies(slug);

  /* The publish attempt was downgraded — the work is safe as a draft;
     send the editor back to the form with the exact gaps listed. */
  if (downgradedToDraft && savedId) {
    redirect(`/admin/case-studies/${savedId}?e=${encodeURIComponent(
      `Saved as draft — complete before publishing: ${missing.join(", ")}`,
    )}`);
  }
  redirect(`/admin/case-studies?saved=${form.data.id ? "updated" : "created"}`);
}

export async function deleteCaseStudyAction(formData: FormData): Promise<void> {
  const user = await requireAdmin();
  await requireSection("content");
  if (!prisma) redirect("/admin/case-studies?e=db");
  const id = z.string().min(10).max(32).parse(formData.get("id"));

  const item = await prisma.contentItem.findUnique({ where: { id } });
  if (!item || item.collection !== "case-studies") redirect("/admin/case-studies?e=invalid");

  await prisma.contentItem.delete({ where: { id } });
  await audit(user.id, "caseStudy.delete", "ContentItem", `case-studies:${item.slug}`);

  revalidateCaseStudies(item.slug);
  redirect("/admin/case-studies?saved=deleted");
}

export async function setCaseStudyStatusAction(formData: FormData): Promise<void> {
  const user = await requireAdmin();
  await requireSection("content");
  if (!prisma) redirect("/admin/case-studies?e=db");
  const id = z.string().min(10).max(32).parse(formData.get("id"));
  const status = z.enum(LIFECYCLE).parse(formData.get("contentStatus"));

  const item = await prisma.contentItem.findUnique({ where: { id } });
  if (!item || item.collection !== "case-studies") redirect("/admin/case-studies?e=invalid");

  await prisma.contentItem.update({
    where: { id },
    data: { contentStatus: status, ...(status === "published" ? { publishedAt: new Date() } : {}) },
  });
  await audit(user.id, "caseStudy.status", "ContentItem", `case-studies:${item.slug}→${status}`);

  revalidateCaseStudies(item.slug);
  redirect("/admin/case-studies?saved=status");
}

/**
 * Import (upsert) the coded dossier records - the four demo projects on
 * staging, or any verified records appended to the constants later - as
 * editable database rows. Imported demo dossiers land with lifecycle
 * "demo": visible on staging (never production) and fully editable from
 * the admin panel. Existing slugs are refreshed, not duplicated.
 */
export async function reorderCaseStudiesAction(formData: FormData): Promise<void> {
  await requireAdmin();
  await requireSection("content");
  if (!prisma) redirect("/admin/case-studies?e=Database%20unavailable.");
  let ids: string[] = [];
  try {
    ids = z.array(z.string().min(10).max(32)).min(1).max(200).parse(JSON.parse(String(formData.get("order"))));
  } catch {
    redirect("/admin/case-studies?e=Invalid%20order.");
  }
  await prisma!.$transaction(
    ids.map((id, i) => prisma!.contentItem.updateMany({ where: { id, collection: "case-studies" }, data: { order: i } })),
  );
  revalidateCaseStudies();
  revalidatePath("/admin/case-studies");
}

export async function importCaseStudyDefaultsAction(): Promise<void> {
  const user = await requireAdmin();
  await requireSection("content");
  if (!prisma) redirect("/admin/case-studies?e=db");

  // In production mode CASE_STUDY_DETAILS is empty (demo is gated out),
  // so import the demo dossiers directly: editable starting points that
  // stay invisible on the public site until individually published.
  const source = CASE_STUDY_DETAILS.length > 0
    ? CASE_STUDY_DETAILS.map(({ slug, ...record }) => ({ slug, record: record as Omit<typeof record, never>, status: record.status }))
    : DEMO_CASE_STUDIES.map((record) => ({
        slug: slugifyCaseStudy(record.title),
        record: record as unknown as Record<string, unknown>,
        status: record.status,
      }));

  let count = 0;
  for (const [i, { slug, record, status }] of source.entries()) {
    await prisma.contentItem.upsert({
      where: { collection_slug: { collection: "case-studies", slug } },
      create: {
        collection: "case-studies",
        slug,
        title: record.title as string,
        order: i,
        active: true,
        contentStatus: (status as string) === "verified" ? "published" : "demo",
        data: record as unknown as import("@prisma/client").Prisma.InputJsonValue,
      },
      update: { title: record.title as string, order: i },
    });
    count += 1;
  }

  await audit(user.id, "caseStudy.importDefaults", "ContentItem", `case-studies:${count} records`, { mode: IS_DEMO ? "demo" : "production" });

  revalidateCaseStudies();
  redirect(`/admin/case-studies?saved=imported&n=${count}`);
}
