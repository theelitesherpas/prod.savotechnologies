import { withBasePath } from "@/lib/utils";

const AUTO_MODAL_EXCLUDED_ROUTES = ["/about", "/careers", "/contact"].map(withBasePath);

/** Suppress only automatic lead-modal interruptions on pages with their own contact or application path. */
export function isAutomaticProjectLeadModalExcludedPath(pathname: string): boolean {
  const path = pathname.replace(/\/+$/, "") || "/";
  return AUTO_MODAL_EXCLUDED_ROUTES.some(route => path === route || path.startsWith(`${route}/`));
}
