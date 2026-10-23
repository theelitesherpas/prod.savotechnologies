import { SOCIAL_IMAGES, type SocialImageKey } from "@/constants/social-images";
import { canonicalOrigin } from "@/lib/env";
import { withBasePath } from "@/lib/utils";

/** Most-specific routes precede section fallbacks; matches respect path boundaries. */
export const SOCIAL_IMAGE_ROUTES: readonly { path: string; image: SocialImageKey }[] = [
  { path: "/services/web-development", image: "web" },
  { path: "/services/mobile-app-development", image: "mobile" },
  { path: "/services/mobile-apps", image: "mobile" },
  { path: "/services/ui-ux-design", image: "design" },
  { path: "/services/ui-ux", image: "design" },
  { path: "/services/ai-agent-development", image: "ai" },
  { path: "/ai-agents", image: "ai" },
  { path: "/ai", image: "ai" },
  { path: "/about", image: "about" },
  { path: "/careers", image: "careers" },
  { path: "/case-studies", image: "caseStudies" },
  { path: "/contact", image: "contact" },
  { path: "/enterprise", image: "enterprise" },
  { path: "/hire", image: "hire" },
  { path: "/industries", image: "industries" },
  { path: "/insights", image: "insights" },
  { path: "/meeting", image: "meeting" },
  { path: "/services", image: "services" },
  { path: "/start-a-project", image: "start" },
  { path: "/start", image: "start" },
  { path: "/", image: "home" },
];

export function ownerSocialImage(image: SocialImageKey) {
  const card = SOCIAL_IMAGES[image];
  return {
    url: withBasePath(`/images/og/${card.file}?v=${card.sha256.slice(0, 12)}`),
    width: card.width,
    height: card.height,
    alt: card.alt,
    type: "image/png",
  };
}

/** The URL contains only a public image/hash, never query data or meeting tokens. */
export function providedSocialImageFor(pageUrl: string) {
  let path: string;
  try {
    const url = new URL(pageUrl, canonicalOrigin);
    if (url.origin !== new URL(canonicalOrigin).origin) return undefined;
    path = url.pathname.replace(/\/+$/, "") || "/";
    const base = (process.env.NEXT_PUBLIC_BASE_PATH || "").replace(/\/+$/, "");
    if (base && (path === base || path.startsWith(`${base}/`))) path = path.slice(base.length) || "/";
  } catch { return undefined; }
  const match = SOCIAL_IMAGE_ROUTES.find(rule => path === rule.path || (rule.path !== "/" && path.startsWith(`${rule.path}/`)));
  return match ? ownerSocialImage(match.image) : undefined;
}
