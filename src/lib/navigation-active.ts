import type { NavItem } from "@/constants/navigation";

const canonical = (path: string) => path.split(/[?#]/, 1)[0].replace(/\/+$/, "") || "/";

/** Give a route one header owner. Dedicated top-level destinations take
 * precedence over links duplicated inside company/group menus. */
export function activeNavigationLabel(pathname: string, nav: NavItem[]): string | null {
  const path = canonical(pathname);
  const matches = (href: string) => {
    if (!href.startsWith("/")) return false;
    const target = canonical(href);
    return path === target || (target !== "/" && path.startsWith(`${target}/`));
  };
  const dedicated = nav
    .filter(item => item.href && matches(item.href))
    .sort((a, b) => canonical(b.href!).length - canonical(a.href!).length);
  if (dedicated[0]) return dedicated[0].label;

  const grouped = nav.flatMap(item => (item.children ?? [])
    .filter(link => matches(link.href))
    .map(link => ({ label: item.label, specificity: canonical(link.href).length })))
    .sort((a, b) => b.specificity - a.specificity);
  return grouped[0]?.label ?? null;
}
