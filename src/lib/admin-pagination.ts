export type PageSearch = { page?: string; pageSize?: string };
export function parseAdminPage(search: PageSearch = {}, total?: number) {
  const pageSize = [10, 25, 50, 100].includes(Number(search.pageSize)) ? Number(search.pageSize) : 25;
  const requested = Math.max(1, Math.min(100000, Number.parseInt(search.page ?? "1", 10) || 1));
  const page = total === undefined ? requested : Math.min(requested, Math.max(1, Math.ceil(total / pageSize)));
  return { page, pageSize, take: pageSize, skip: (page - 1) * pageSize };
}
export function adminPageUrl(path: string, search: Record<string, unknown>, page: number, pageSize: number) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(search)) if (!["page", "pageSize", "e", "saved", "deleted", "created", "reset"].includes(key) && typeof value === "string" && value) params.set(key, value);
  if (page > 1) params.set("page", String(page));
  if (pageSize !== 25) params.set("pageSize", String(pageSize));
  return `${path}${params.size ? `?${params}` : ""}`;
}
