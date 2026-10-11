"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { requireSection } from "@/lib/permissions";
import { audit } from "@/lib/audit";
import { revalidateManagedContent } from "@/lib/collections";
import { isAllowedStoredPhoto, persistSitePhoto } from "@/lib/site-photo";
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
 * at 2× its 510px render width), persisted via the shared site-photo
 * pipeline (content-addressed WebP under public/uploads/site).
 */
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
  if (image.startsWith("data:image/")) stored = await persistSitePhoto(image, CONTACT_HERO_WIDTH, CONTACT_HERO_HEIGHT);
  else if (image && isAllowedStoredPhoto(image)) stored = image;
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
