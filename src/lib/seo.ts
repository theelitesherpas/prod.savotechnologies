import { SITE } from "@/constants/site";

/**
 * Open Graph builder for page metadata.
 *
 * Next.js *replaces* (does not merge) the parent layout's openGraph object
 * when a page defines its own — so every page-level OG must carry the full
 * shape (type, site name, locale, default social card). Centralising it
 * here keeps og:* tags consistent across all routes.
 *
 * Pass `images` to override the default card (e.g. industry hero
 * photography); otherwise the statically-generated /opengraph-image card
 * (src/app/opengraph-image.tsx) is used.
 */
export function openGraphFor({
  title,
  description,
  url,
  images,
}: {
  title: string;
  description: string;
  url: string;
  images?: { url: string; width: number; height: number }[];
}) {
  return {
    type: "website" as const,
    siteName: SITE.name,
    locale: "en_US",
    images: images ?? [{ url: "/opengraph-image", width: 1200, height: 630 }],
    title,
    description,
    url,
  };
}
