import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminUser } from "@/lib/auth";
import { COLLECTION_KEYS, CONTENT_COLLECTIONS } from "@/lib/content-registry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/search?q=… — global palette search across every managed
 * collection plus the enquiry inbox. Session-guarded; results are capped.
 */
export async function GET(req: Request) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  if (!prisma) return NextResponse.json({ ok: true, groups: [] });

  const q = (new URL(req.url).searchParams.get("q") ?? "").trim().toLowerCase();
  if (q.length < 2) return NextResponse.json({ ok: true, groups: [] });

  const contains = { contains: q, mode: "insensitive" as const };
  type ItemRow = { id: string; collection: string; title: string; slug: string };
  type NamedRow = { id: string; title: string; slug: string };
  type EnqRow = { id: string; name: string; email: string | null; projectType: string };
  const empty = { items: [] as ItemRow[], services: [] as NamedRow[], industries: [] as NamedRow[], enquiries: [] as EnqRow[] };
  const [items, services, industries, enquiries] = await Promise.all([
    prisma.contentItem.findMany({
      where: { OR: [{ title: contains }, { slug: contains }] },
      orderBy: [{ order: "asc" }],
      take: 24,
      select: { id: true, collection: true, title: true, slug: true },
    }),
    prisma.service.findMany({
      where: { OR: [{ title: contains }, { slug: contains }] },
      take: 5,
      select: { id: true, title: true, slug: true },
    }),
    prisma.industry.findMany({
      where: { OR: [{ title: contains }, { slug: contains }] },
      take: 5,
      select: { id: true, title: true, slug: true },
    }),
    prisma.projectEnquiry.findMany({
      where: { OR: [{ name: contains }, { email: contains }, { company: contains }] },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: { id: true, name: true, email: true, projectType: true },
    }),
  ]).catch(() => [empty.items, empty.services, empty.industries, empty.enquiries]);

  const groups: { label: string; icon: string; results: { href: string; title: string; hint: string }[] }[] = [];

  const enquiriesHits = (enquiries as EnqRow[]).map((e) => ({
    href: `/admin/enquiries/${e.id}`,
    title: e.name,
    hint: `${e.projectType}${e.email ? ` · ${e.email}` : ""}`,
  }));
  if (enquiriesHits.length) groups.push({ label: "Enquiries", icon: "inbox", results: enquiriesHits });

  const contentByCollection = new Map<string, ItemRow[]>();
  for (const it of items as ItemRow[]) {
    const list = contentByCollection.get(it.collection) ?? [];
    list.push(it);
    contentByCollection.set(it.collection, list);
  }
  for (const key of COLLECTION_KEYS) {
    const list = contentByCollection.get(key);
    if (!list?.length) continue;
    groups.push({
      label: CONTENT_COLLECTIONS[key].label,
      icon: CONTENT_COLLECTIONS[key].icon,
      results: list.map((it) => ({
        href: `/admin/content/${key}/${it.id}`,
        title: it.title,
        hint: `/${it.slug}`,
      })),
    });
  }

  if (services.length) {
    groups.push({
      label: "Services",
      icon: "layers",
      results: (services as NamedRow[]).map((s) => ({
        href: `/admin/services/${s.id}`,
        title: s.title,
        hint: `/services/${s.slug}/`,
      })),
    });
  }
  if (industries.length) {
    groups.push({
      label: "Industries",
      icon: "grid",
      results: (industries as NamedRow[]).map((s) => ({
        href: `/admin/industries/${s.id}`,
        title: s.title,
        hint: `/industries/${s.slug}/`,
      })),
    });
  }

  return NextResponse.json({ ok: true, groups });
}
