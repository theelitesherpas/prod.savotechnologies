"use server";

import { redirect } from "next/navigation";
import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { requireSection } from "@/lib/permissions";
import { audit } from "@/lib/audit";
import { revalidateManagedContent } from "@/lib/collections";
import {
  CONTACT_HERO_ALT,
  CONTACT_HERO_HEIGHT,
  CONTACT_HERO_WIDTH,
} from "@/constants/contact";

/**
 * Contact page hero photo - the figure beside "Let's talk about what's
 * next." on /contact. Stored as SiteSetting keys (contact_hero_image /
 * contact_hero_alt); the crop tool fixes uploads at exactly
 * CONTACT_HERO_WIDTH × CONTACT_HERO_HEIGHT (the public slot's 1.75 aspect
 * at 2× its 510px render width), persisted as a content-addressed WebP
 * under public/uploads/site (same pipeline as insight covers).
 */

const STORED_IMAGE = /^\/api\/site-img\/[a-f0-9]{64}$/;
const CODED_IMAGE = /^\/images\/[a-zA-Z0-9_./-]+\.(?:webp|png|jpe?g|avif)$/i;

async function persistHeroImage(value: string): Promise<string | null> {
  const match = /^data:image\/(?:jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(value);
  if (!match) return null;

  try {
    const input = Buffer.from(match[1], "base64");
    if (!input.length || input.length > 500_000) return null;
    const metadata = await sharp(input, { limitInputPixels: 1_500_000 }).metadata();
    if (
      metadata.width !== CONTACT_HERO_WIDTH ||
      metadata.height !== CONTACT_HERO_HEIGHT ||
      !["jpeg", "png", "webp"].includes(metadata.format ?? "")
    ) {
      return null;
    }

    let output: Buffer | null = null;
    for (const quality of [78, 70, 62, 54, 46]) {
      output = await sharp(input)
        .rotate()
        .webp({ quality, effort: 5 })
        .toBuffer();
      if (output.length <= 200_000) break;
    }
    if (!output || output.length > 320_000) return null;

    const hash = createHash("sha256").update(output).digest("hex");
    const relativePath = `/api/site-img/${hash}`;
    const directory = join(process.cwd(), "public", "uploads", "site");
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

export async function saveContactHeroAction(formData: FormData): Promise<void> {
  const user = await requireAdmin();
  await requireSection("content");

  const image = String(formData.get("image") ?? "");
  const alt = String(formData.get("alt") ?? "")
    .trim()
    .slice(0, 200);

  // A fresh upload arrives as a data URL; an untouched form resubmits the
  // currently stored (already validated) path - only the alt may change.
  let stored: string | null = null;
  if (image.startsWith("data:image/")) stored = await persistHeroImage(image);
  else if (image && STORED_IMAGE.test(image)) stored = image;
  else if (image && CODED_IMAGE.test(image) && !image.includes("..")) stored = image;
  if (!stored) {
    redirect(`/admin/content/contact?e=${encodeURIComponent("Invalid contact photo - attach one with the crop tool and save again.")}`);
  }

  const heroAlt = alt || CONTACT_HERO_ALT;

  await prisma!.$transaction([
    prisma!.siteSetting.upsert({
      where: { key: "contact_hero_image" },
      create: { key: "contact_hero_image", value: stored },
      update: { value: stored },
    }),
    prisma!.siteSetting.upsert({
      where: { key: "contact_hero_alt" },
      create: { key: "contact_hero_alt", value: heroAlt },
      update: { value: heroAlt },
    }),
  ]);

  await audit(user.id, "content.hero", "SiteSetting", "contact_hero_image", {
    image: stored,
    alt: heroAlt,
  });
  await revalidateManagedContent();
  redirect("/admin/content/contact?saved=hero");
}
