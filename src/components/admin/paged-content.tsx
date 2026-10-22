"use client";

import { Children, useId, useRef, useState, type ReactNode } from "react";
import { pageWindow, PageArrow } from "./pagination";
import s from "./pagination.module.css";

export function ClientPager({ total, page, pageSize, onPage, onPageSize, label = "records" }: { total: number; page: number; pageSize: number; onPage: (page: number) => void; onPageSize: (size: number) => void; label?: string }) {
  const id = useId(), pages = Math.max(1, Math.ceil(total / pageSize));
  const arrow = (name: string, target: number, direction: "previous" | "next", edge: boolean, disabled: boolean) => <button type="button" className={`${s.button} ${disabled ? s.disabled : ""}`} disabled={disabled} aria-label={name} title={name} onClick={() => onPage(target)}><PageArrow direction={direction} edge={edge} /></button>;
  return <div className={s.footer}>
    <div className={s.meta}><p role="status">{total ? `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)} of ${total}` : "0"} {label}</p><label htmlFor={id} className="sr-only">{label} per page</label><select id={id} className="rounded-lg border border-border bg-surface p-2 text-foreground" value={pageSize} onChange={event => onPageSize(Number(event.target.value))}>{[10, 25, 50, 100].map(size => <option key={size} value={size}>{size} per page</option>)}</select></div>
    {total > 0 ? <nav aria-label={`${label} pagination`} className={s.controls}><span className={s.group}>{arrow("First page", 1, "previous", true, page === 1)}{arrow("Previous page", page - 1, "previous", false, page === 1)}</span><span className={s.numbers}>{pageWindow(page, pages).map(number => <button key={number} className={`${s.button} ${number === page ? s.active : ""}`} type="button" aria-label={`Page ${number}`} aria-current={number === page ? "page" : undefined} onClick={() => onPage(number)}>{number}</button>)}</span><span className={s.group}>{arrow("Next page", page + 1, "next", false, page === pages)}{arrow("Last page", pages, "next", true, page === pages)}</span>{pages > 5 ? <form className={s.jump} onSubmit={event => { event.preventDefault(); const target = Number(new FormData(event.currentTarget).get("jumpPage")); if (Number.isInteger(target) && target >= 1 && target <= pages) onPage(target); }}><input type="number" name="jumpPage" min={1} max={pages} defaultValue={page} key={page} required aria-label={`${label} page number`} /><button type="submit">Go</button></form> : null}</nav> : null}
  </div>;
}
/** Paginate already-complete bounded collections without breaking their native list/table markup. */
export function PagedContent({ children, as = "div", colSpan = 1, className, label = "records", initialPageSize = 25 }: { children: ReactNode; as?: "div" | "ul" | "ol" | "tbody"; colSpan?: number; className?: string; label?: string; initialPageSize?: number }) {
  const [requested, setPage] = useState(1), [pageSize, setSize] = useState(initialPageSize), anchor = useRef<HTMLDivElement>(null);
  const tableBody = useRef<HTMLTableSectionElement>(null);
  const showPage = () => requestAnimationFrame(() => { const target = tableBody.current?.closest("table") ?? anchor.current; if (target) window.scrollTo({ top: Math.max(0, scrollY + target.getBoundingClientRect().top - 80), behavior: "auto" }); });
  const rows = Children.toArray(children), pages = Math.max(1, Math.ceil(rows.length / pageSize)), page = Math.min(requested, pages);
  const controls = <ClientPager total={rows.length} page={page} pageSize={pageSize} onPage={value => { setPage(value); showPage(); }} onPageSize={value => { setSize(value); setPage(1); showPage(); }} label={label} />;
  const items = rows.slice((page - 1) * pageSize, page * pageSize);
  if (as === "tbody") return <tbody ref={tableBody} className={className}>{items}<tr><td colSpan={colSpan} className="px-4 pb-4"><div ref={anchor}>{controls}</div></td></tr></tbody>;
  const Element = as;
  return <div ref={anchor}><Element className={className}>{items}</Element>{controls}</div>;
}
