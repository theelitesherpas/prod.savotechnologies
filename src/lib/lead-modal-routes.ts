import { withBasePath } from "@/lib/utils";

const AUTO_MODAL_EXCLUDED_ROUTES = ["/about", "/careers", "/contact", "/portal"].map(withBasePath);

/** Suppress automatic lead prompts during contact, application and client sign-in tasks. Manual CTAs remain available. */
export function isAutomaticProjectLeadModalExcludedPath(pathname: string): boolean {
  const path = pathname.replace(/\/+$/, "") || "/";
  return AUTO_MODAL_EXCLUDED_ROUTES.some(route => path === route || path.startsWith(`${route}/`));
}
