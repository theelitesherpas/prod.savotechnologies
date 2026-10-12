import { SITE } from "@/constants/site";

/**
 * Open Graph builder for page metadata.
 *
 * Next.js *replaces* (does not merge) the parent layout's openGraph object
 * when a page defines its own - so every page-level OG must carry the full
 * shape (type, site name, locale, default social card). Centralising it
 * here keeps og:* tags consistent across all routes.
 *
 * Pass `images` to use genuine page artwork (e.g. an insight cover or
 * industry image); otherwise a branded share card is generated from this
 * page's own title, description and canonical path.
 */
function boundedText(value: string, max: number) {
  const chars = Array.from(value.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim());
  if (chars.length <= max) return chars.join("");
  return `${chars.slice(0, max - 1).join("").trimEnd()}…`;
}

export function socialImageFor(title: string, description: string, pageUrl: string) {
  const cardTitle = boundedText(title, 120);
  const cardDescription = boundedText(description, 180);
  const page = pageUrl.startsWith("/") ? pageUrl.split(/[?#]/, 1)[0] : "/";
  const imageUrl = new URLSearchParams({ v: "2", title: cardTitle, description: cardDescription, page });
  return {
    url: `/share-image?${imageUrl.toString()}`,
    width: 1200,
    height: 630,
    alt: boundedText(`${cardTitle} — ${cardDescription}`, 220),
  };
}

export function openGraphFor({
  title,
  description,
  url,
  images,
}: {
  title: string;
  description: string;
  url: string;
  images?: { url: string; width?: number; height?: number; alt?: string }[];
}) {
  return {
    type: "website" as const,
    siteName: SITE.name,
    locale: "en_US",
    images: images ?? [socialImageFor(title, description, url)],
    title,
    description,
    url,
  };
}
