import type { Article } from "@/constants/insights";

export const INSIGHT_TOPICS = ["AI", "Engineering", "Design", "Delivery"] as const;

export const INSIGHTS_PAGE_SIZE = 12;
export type ArticlePreview = Pick<Article, "slug" | "title" | "cat" | "image" | "excerpt">;
export function articlePreview(a: Article): ArticlePreview {
  return { slug: a.slug, title: a.title, cat: a.cat, image: a.image, excerpt: a.excerpt };
}
export function selectReading(articles: Article[], params: { topic?: string; q?: string; page?: string }) {
  const topic = INSIGHT_TOPICS.find(category => category === params.topic) ?? "All";
  const query = (params.q ?? "").trim().slice(0, 160);
  const matched = articles.filter(a => (topic === "All" || a.cat === topic) && (!query || `${a.title} ${a.excerpt}`.toLocaleLowerCase().includes(query.toLocaleLowerCase())));
  const pages = Math.max(1, Math.ceil(matched.length / INSIGHTS_PAGE_SIZE));
  const requested = Number(params.page);
  const page = Number.isSafeInteger(requested) && requested > 0 ? Math.min(requested, pages) : 1;
  return { topic, query, page, pages, total: matched.length, articles: matched.slice((page - 1) * INSIGHTS_PAGE_SIZE, page * INSIGHTS_PAGE_SIZE).map(articlePreview) };
}
export function paginationItems(current: number, total: number): Array<number | "ellipsis"> {
  if (total <= 5) return Array.from({ length: total }, (_, index) => index + 1);
  const visible = [...new Set([1, current - 1, current, current + 1, total])].filter(page => page >= 1 && page <= total).sort((a, b) => a - b);
  return visible.flatMap((page, index) => index > 0 && page - visible[index - 1] > 1 ? ["ellipsis", page] : [page]);
}

export function readingHref(topic = "All", query = "", page = 1) {
  const params = new URLSearchParams();
  if (topic !== "All") params.set("topic", topic);
  if (query) params.set("q", query);
  if (page > 1) params.set("page", String(page));
  return `/insights${params.size ? `?${params}` : ""}#reading`;
}
