import Link from "next/link";
import s from "./pagination.module.css";

/** The reference's five consecutive page numbers, centered where possible. */
export function pageWindow(page: number, pages: number) {
  const count = Math.min(5, Math.max(1, pages));
  const start = Math.max(1, Math.min(page - 2, pages - count + 1));
  return Array.from({ length: count }, (_, index) => start + index);
}
export function PageArrow({ direction, edge = false }: { direction: "previous" | "next"; edge?: boolean }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" style={direction === "previous" ? { transform: "rotate(180deg)" } : undefined}><path d="m9 6 6 6-6 6" />{edge ? <path d="M19 5v14" /> : null}</svg>;
}
export function Pagination({ page, total, pageSize, href, label = "records", sizes = true }: { page: number; total: number; pageSize: number; href: (page: number, size: number) => string; label?: string; sizes?: boolean }) {
  const pages = Math.max(1, Math.ceil(total / pageSize)), current = Math.min(pages, Math.max(1, page));
  const target = new URL(href(1, pageSize), "https://admin.invalid");
  const arrow = (name: string, to: number, direction: "previous" | "next", edge: boolean, disabled: boolean) => disabled
    ? <span role="link" tabIndex={-1} aria-disabled="true" aria-label={name} className={`${s.button} ${s.disabled}`}><PageArrow direction={direction} edge={edge} /></span>
    : <Link href={href(to, pageSize)} aria-label={name} title={name} className={s.button}><PageArrow direction={direction} edge={edge} /></Link>;
  return <div className={s.footer}>
    <div className={s.meta}><p role="status">{total ? `${((current - 1) * pageSize + 1).toLocaleString("en-IN")}–${Math.min(current * pageSize, total).toLocaleString("en-IN")} of ${total.toLocaleString("en-IN")}` : "0"} {label}</p>
      {sizes ? <details className="relative"><summary className="cursor-pointer rounded-md border border-border px-3 py-2">{pageSize} per page</summary><div className="absolute bottom-full left-0 z-10 mb-2 flex gap-1 rounded-lg border border-border bg-surface p-2 shadow-md">{[10, 25, 50, 100].map(size => <Link key={size} href={href(1, size)} aria-label={`Show ${size} ${label} per page`} aria-current={size === pageSize ? "true" : undefined} className={`${s.button} ${size === pageSize ? s.active : ""}`}>{size}</Link>)}</div></details> : null}
    </div>
    {total > 0 ? <nav aria-label={`${label} pagination`} className={s.controls}>
      <span className={s.group}>{arrow("First page", 1, "previous", true, current === 1)}{arrow("Previous page", current - 1, "previous", false, current === 1)}</span>
      <span className={s.numbers}>{pageWindow(current, pages).map(number => <Link key={number} className={`${s.button} ${number === current ? s.active : ""}`} href={href(number, pageSize)} aria-label={`Page ${number}`} aria-current={number === current ? "page" : undefined}>{number}</Link>)}</span>
      <span className={s.group}>{arrow("Next page", current + 1, "next", false, current === pages)}{arrow("Last page", pages, "next", true, current === pages)}</span>
      {pages > 5 ? <form action={target.pathname} method="get" className={s.jump}>{[...target.searchParams].filter(([key]) => key !== "page").map(([key, value]) => <input key={key} type="hidden" name={key} value={value} />)}<label><span className="sr-only">{label} page number</span><input type="number" name="page" min={1} max={pages} defaultValue={current} required aria-label={`${label} page number`} /></label><button type="submit">Go</button><span className="sr-only">of {pages} pages</span></form> : null}
    </nav> : null}
  </div>;
}
