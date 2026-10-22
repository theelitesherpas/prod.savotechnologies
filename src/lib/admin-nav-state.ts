export function activeAdminHref(items: { href: string }[], pathname: string, search: string) {
  const current = new URL(`${pathname}?${search}`, "https://admin.invalid");
  return items.map(item => {
    const target = new URL(item.href, current.origin);
    const matchesPath = current.pathname === target.pathname || (target.pathname !== "/admin" && current.pathname.startsWith(`${target.pathname}/`));
    const pairs = [...target.searchParams];
    const nestedSalesDetail = current.pathname !== target.pathname && target.pathname === "/admin/enquiries";
    if (!matchesPath || !pairs.every(([k, v]) => current.searchParams.get(k) === v || (nestedSalesDetail && k === "type" && v === "Client" && !current.searchParams.has("type")))) return { href: item.href, score: -1 };
    return { href: item.href, score: target.pathname.length * 10 + pairs.length };
  }).filter(item => item.score >= 0).sort((a, b) => b.score - a.score)[0]?.href;
}
