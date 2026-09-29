/**
 * Backfill compressor for case-study images.
 *
 * Every stored visual (4 slots + gallery) is re-encoded with sharp/mozjpeg
 * at quality 80 and resized to its slot's exact rendering dimensions —
 * visually lossless by web standards, typically 40–70% lighter. A record
 * is only rewritten when the total saving is meaningful (≥8%), so images
 * already within budget are never re-encoded (no generation loss).
 *
 * Usage:
 *   node scripts/compress-case-images.mjs            # dry run (report only)
 *   node scripts/compress-case-images.mjs apply      # rewrite the database
 *
 * Env: DATABASE_URL (reads .env / .env.production automatically).
 */
import { PrismaClient } from "@prisma/client";
import sharp from "sharp";
import { config } from "dotenv";

config({ path: ".env.production" });
config({ path: ".env" });

const APPLY = process.argv[2] === "apply";
const prisma = new PrismaClient();

/** Slot rendering dimensions — the exact CSS aspect each surface shows. */
const SLOTS = {
  showcase: { w: 1600, h: 700 },
  cardWide: { w: 1600, h: 700 },
  card: { w: 1280, h: 800 },
  dossierCard: { w: 1280, h: 800 },
};
const GALLERY_MAX = 1600; // longest side, aspect preserved
const QUALITY = 80;
const MIN_SAVING = 0.08; // replace only if ≥8% lighter

const kb = (n) => `${Math.round(n / 1024)}KB`;

async function reencode(dataUrl, { w, h, cover } = {}) {
  const comma = dataUrl.indexOf(",");
  const b64 = dataUrl.slice(comma + 1);
  const buf = Buffer.from(b64, "base64");

  let img = sharp(buf, { failOn: "none" });
  let meta2;
  try {
    meta2 = await img.metadata();
  } catch {
    return { corrupt: true };
  }
  if (!meta2.width || !meta2.height) return null;

  if (w && h) {
    img = img.resize(w, h, { fit: "cover", withoutEnlargement: true });
  } else if (w || h) {
    // longest-side cap, aspect preserved
    const landscape = meta2.width >= meta2.height;
    img = img.resize(
      landscape ? { width: w } : { height: w },
      { withoutEnlargement: true },
    );
  }

  try {
    const out = await img.jpeg({ quality: QUALITY, mozjpeg: true, chromaSubsampling: "4:2:0" }).toBuffer({ resolveWithObject: true });
    const outUrl = `data:image/jpeg;base64,${out.data.toString("base64")}`;
    return { dataUrl: outUrl, width: out.info.width, height: out.info.height, chars: outUrl.length };
  } catch {
    return { corrupt: true };
  }
}

const rows = [];
const corrupt = [];
let totalBefore = 0;
let totalAfter = 0;

const records = await prisma.contentItem.findMany({
  where: { collection: "case-studies" },
  select: { id: true, slug: true, data: true },
});

for (const rec of records) {
  const data = rec.data ?? {};
  let recordBefore = 0;
  let recordAfter = 0;
  let touched = 0;
  const nextImages = { ...(data.images ?? {}) };
  const nextGallery = [...(data.gallery ?? [])];

  for (const [slot, dims] of Object.entries(SLOTS)) {
    const cur = nextImages[slot];
    if (!cur?.dataUrl) continue;
    const before = cur.dataUrl.length;
    const res = await reencode(cur.dataUrl, dims);
    if (!res) continue;
    if (res.corrupt) { corrupt.push(`${rec.slug}:${slot}`); continue; }
    recordBefore += before;
    recordAfter += res.chars;
    if (res.chars < before * (1 - MIN_SAVING)) {
      nextImages[slot] = { ...cur, dataUrl: res.dataUrl, width: res.width, height: res.height };
      touched++;
      rows.push([`${rec.slug}:${slot}`, before, res.chars]);
    } else {
      recordAfter = recordAfter - res.chars + before; // keeping original
    }
  }

  for (let i = 0; i < nextGallery.length; i++) {
    const cur = nextGallery[i];
    if (!cur?.dataUrl) continue;
    const before = cur.dataUrl.length;
    const res = await reencode(cur.dataUrl, { w: GALLERY_MAX });
    if (!res) continue;
    if (res.corrupt) { corrupt.push(`${rec.slug}:gallery[${i}]`); continue; }
    recordBefore += before;
    recordAfter += res.chars;
    if (res.chars < before * (1 - MIN_SAVING)) {
      nextGallery[i] = { ...cur, dataUrl: res.dataUrl, width: res.width, height: res.height };
      touched++;
      rows.push([`${rec.slug}:gallery[${i}]`, before, res.chars]);
    } else {
      recordAfter = recordAfter - res.chars + before;
    }
  }

  totalBefore += recordBefore;
  totalAfter += recordAfter;

  if (touched > 0 && APPLY) {
    await prisma.contentItem.update({
      where: { id: rec.id },
      data: {
        data: { ...data, images: nextImages, gallery: nextGallery },
        updatedAt: new Date(),
      },
    });
    console.log(`↻ ${rec.slug}: ${touched} image(s) re-encoded ${APPLY ? "and saved" : "(dry run)"}`);
  }
}

console.log("");
for (const [label, before, after] of rows) {
  const pct = Math.round((1 - after / before) * 100);
  console.log(`  ${label.padEnd(34)} ${kb(before).padStart(8)} → ${kb(after).padStart(8)}  (−${pct}%)`);
}
if (corrupt.length) {
  console.log("");
  console.log("  ⚠ CORRUPT (cannot decode — re-upload these via the admin form):");
  for (const c of corrupt) console.log(`     ${c}`);
}
console.log("─".repeat(64));
if (totalBefore > 0) {
  console.log(
    `  TOTAL inline image weight   ${kb(totalBefore).padStart(8)} → ${kb(totalAfter).padStart(8)}  (−${Math.round((1 - totalAfter / totalBefore) * 100)}%)`,
  );
}
console.log(APPLY ? "  Mode: APPLY (database updated)" : "  Mode: DRY RUN — pass 'apply' to write");
if (!APPLY && rows.length) console.log("  ↑ nothing was changed yet");

await prisma.$disconnect();
