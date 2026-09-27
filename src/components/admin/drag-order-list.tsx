"use client";

import { useRef, useState, useTransition, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * DragOrderList - drag-to-reorder rows for admin content lists.
 *
 * Rows are supplied by the server page as { id, node } pairs; this client
 * wrapper owns the order: an HTML5 drag handle reorders optimistically,
 * then persists through the page's reorder server action (passed as a
 * prop). Up/down buttons stay for touch and keyboard.
 */

export type DragRow = { id: string; node: ReactNode };

export function DragOrderList({
  rows,
  reorder,
  hidden,
  disabled = false,
}: {
  rows: DragRow[];
  /** Server action receiving FormData: order (JSON id array) + hidden fields. */
  reorder: (formData: FormData) => Promise<void>;
  /** Extra hidden fields for the action (collection, kind, …). */
  hidden?: Record<string, string>;
  /** Hide handles when the list is not reorderable. */
  disabled?: boolean;
}) {
  const [order, setOrder] = useState<string[]>(() => rows.map((r) => r.id));
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const rowRefs = useRef(new Map<string, HTMLLIElement>());

  const byId = new Map(rows.map((r) => [r.id, r]));

  const persist = (next: string[]) => {
    const fd = new FormData();
    fd.set("order", JSON.stringify(next));
    for (const [k, v] of Object.entries(hidden ?? {})) fd.set(k, v);
    startTransition(async () => {
      await reorder(fd);
    });
  };

  const move = (id: string, dir: -1 | 1) => {
    const idx = order.indexOf(id);
    const to = idx + dir;
    if (idx < 0 || to < 0 || to >= order.length) return;
    const next = [...order];
    [next[idx], next[to]] = [next[to], next[idx]];
    setOrder(next);
    persist(next);
  };

  const drop = (targetId: string) => {
    if (!dragId || dragId === targetId) {
      setDragId(null);
      setOverId(null);
      return;
    }
    const next = order.filter((id) => id !== dragId);
    next.splice(next.indexOf(targetId), 0, dragId);
    setOrder(next);
    persist(next);
    setDragId(null);
    setOverId(null);
  };

  if (rows.length === 0) return null;

  return (
    <div className={cn("relative", pending && "pointer-events-none opacity-70")}>
      {pending ? (
        <p className="t-caption absolute -top-7 right-0 font-semibold text-accent">Saving order…</p>
      ) : null}
      <ul className="adm-card divide-y divide-border" aria-label="Drag to reorder">
        {order.map((id, i) => {
          const row = byId.get(id);
          if (!row) return null;
          return (
            <li
              key={id}
              ref={(el) => {
                if (el) rowRefs.current.set(id, el);
              }}
              draggable={!disabled && dragId === id}
              onDragStart={(e) => {
                e.dataTransfer.effectAllowed = "move";
                e.dataTransfer.setData("text/plain", id);
                setDragId(id);
              }}
              onDragEnd={() => {
                setDragId(null);
                setOverId(null);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                if (id !== dragId) setOverId(id);
              }}
              onDrop={(e) => {
                e.preventDefault();
                drop(id);
              }}
              className={cn(
                "flex items-stretch gap-0 transition-opacity duration-150",
                dragId === id && "opacity-40",
                overId === id && dragId !== id && "shadow-[inset_0_3px_0_0_var(--accent)]",
              )}
            >
              {/* Handle + order + arrows */}
              <div className="flex w-[4.4rem] shrink-0 flex-col items-center justify-center gap-1 border-r border-border bg-surface-2/40 py-3">
                <button
                  type="button"
                  aria-label={`Reorder row ${i + 1} (drag or use arrows)`}
                  onMouseDown={(e) => {
                    // Enable dragging only from the handle so text selection
                    // and form controls inside rows keep working.
                    const li = rowRefs.current.get(id);
                    if (li) {
                      li.draggable = true;
                    }
                  }}
                  onMouseUp={() => {
                    const li = rowRefs.current.get(id);
                    if (li) li.draggable = false;
                  }}
                  onDragEnd={() => {
                    const li = rowRefs.current.get(id);
                    if (li) li.draggable = false;
                  }}
                  className={cn(
                    "cursor-grab touch-none rounded-md p-1.5 text-muted transition-colors hover:bg-border/60 hover:text-foreground active:cursor-grabbing",
                    disabled && "hidden",
                  )}
                  tabIndex={-1}
                >
                  <svg viewBox="0 0 16 16" aria-hidden="true" className="h-4 w-4" fill="currentColor">
                    <circle cx="5.5" cy="3" r="1.3" /><circle cx="10.5" cy="3" r="1.3" />
                    <circle cx="5.5" cy="8" r="1.3" /><circle cx="10.5" cy="8" r="1.3" />
                    <circle cx="5.5" cy="13" r="1.3" /><circle cx="10.5" cy="13" r="1.3" />
                  </svg>
                </button>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => move(id, -1)}
                    disabled={i === 0 || pending}
                    aria-label="Move up"
                    className="flex h-5 w-5 items-center justify-center rounded border border-border text-muted transition-colors hover:border-foreground/40 hover:text-foreground disabled:pointer-events-none disabled:opacity-25"
                  >
                    <svg viewBox="0 0 10 10" aria-hidden="true" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M2 6.5 5 3.5l3 3" /></svg>
                  </button>
                  <span className="tnum font-mono text-[0.6875rem] text-muted">{String(i + 1).padStart(2, "0")}</span>
                  <button
                    type="button"
                    onClick={() => move(id, 1)}
                    disabled={i === order.length - 1 || pending}
                    aria-label="Move down"
                    className="flex h-5 w-5 items-center justify-center rounded border border-border text-muted transition-colors hover:border-foreground/40 hover:text-foreground disabled:pointer-events-none disabled:opacity-25"
                  >
                    <svg viewBox="0 0 10 10" aria-hidden="true" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M2 3.5 5 6.5l3-3" /></svg>
                  </button>
                </div>
              </div>
              {/* Row content from the server page */}
              <div className="min-w-0 flex-1 px-4 py-3">{row.node}</div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
