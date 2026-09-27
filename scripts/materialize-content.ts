/**
 * Materialize the coded frontend content into the database as editable,
 * published admin rows - so every admin section shows exactly what the
 * public site renders, ready for direct editing.
 *
 * Collections: insights, careers, hire, ai-services, agents (content_items),
 * services + industries (nav-managed tables), case studies (demo dossiers).
 * Idempotent: re-running refreshes titles/orders, never duplicates.
 *
 * Usage (against any DATABASE_URL):
 *   DATABASE_URL=… npx tsx scripts/materialize-content.ts
 */
import { PrismaClient } from "@prisma/client";
import { CONTENT_COLLECTIONS } from "../src/lib/content-registry";
import { SERVICE_LINKS, INDUSTRY_LINKS } from "../src/constants/navigation";
import { DEMO_CASE_STUDIES } from "../src/content/demo/case-studies";

const prisma = new PrismaClient();

const slugify = (t: string): string => {
  let s = t.toLowerCase().split("&").join("and");
  s = s.replace(/[^a-z0-9]+/g, "-");
  while (s.startsWith("-")) s = s.slice(1);
  while (s.endsWith("-")) s = s.slice(0, -1);
  return s.slice(0, 80);
};

async function main() {
  // ── Content collections (insights, careers, hire, ai-services, agents) ──
  // case-studies is excluded: it has its own rich editor and demo-dossier
  // import (below); the generic registry seeds are pending placeholder
  // slots that must never publish.
  const KEYS = (Object.keys(CONTENT_COLLECTIONS) as (keyof typeof CONTENT_COLLECTIONS)[]).filter(
    (k) => k !== "case-studies",
  );
  for (const key of KEYS) {
    const def = CONTENT_COLLECTIONS[key];
    const seeds = def.seeds();
    for (const [i, seed] of seeds.entries()) {
      await prisma.contentItem.upsert({
        where: { collection_slug: { collection: key, slug: seed.slug } },
        create: {
          collection: key,
          slug: seed.slug,
          title: seed.title,
          order: seed.order ?? i,
          active: seed.active ?? true,
          contentStatus: "published",
          data: seed.data as object,
        },
        update: { title: seed.title, order: seed.order ?? i },
      });
    }
    console.log(`✓ ${key}: ${seeds.length} published rows`);
  }

  // ── Services + industries (nav-managed tables) ──
  for (const [i, link] of SERVICE_LINKS.entries()) {
    const slug = link.href.split("/").filter(Boolean).pop() ?? slugify(link.label);
    await prisma.service.upsert({
      where: { slug },
      create: { slug, title: link.label, summary: "", order: i },
      update: { title: link.label },
    });
  }
  console.log(`✓ services: ${SERVICE_LINKS.length} rows`);

  for (const [i, link] of INDUSTRY_LINKS.entries()) {
    const slug = link.href.split("/").filter(Boolean).pop() ?? slugify(link.label);
    await prisma.industry.upsert({
      where: { slug },
      create: { slug, title: link.label, summary: "", order: i },
      update: { title: link.label },
    });
  }
  console.log(`✓ industries: ${INDUSTRY_LINKS.length} rows`);

  // ── Case studies: demo dossiers as editable starting points (demo
  //    status - invisible on the public production site until published) ──
  for (const [i, record] of DEMO_CASE_STUDIES.entries()) {
    const { variant: _variant, ...data } = record as Record<string, unknown> & { variant: string };
    const slug = slugify(record.title);
    await prisma.contentItem.upsert({
      where: { collection_slug: { collection: "case-studies", slug } },
      create: {
        collection: "case-studies",
        slug,
        title: record.title,
        order: i,
        active: true,
        contentStatus: record.status === "verified" ? "published" : "demo",
        data,
      },
      update: { title: record.title, order: i },
    });
  }
  console.log(`✓ case-studies: ${DEMO_CASE_STUDIES.length} demo dossiers (editable, not public until published)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
