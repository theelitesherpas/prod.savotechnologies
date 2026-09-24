"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { AdminIcon, type AdminIconName } from "./icons";
import { cn } from "@/lib/utils";

/**
 * Global ⌘K palette — searches enquiries and every content collection
 * through /api/admin/search. Arrow-key navigation, Enter to open, Esc to
 * close; also opens from the top bar search button.
 */

type Result = { href: string; title: string; hint: string };
type Group = { label: string; icon: string; results: Result[] };

export function SearchPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [groups, setGroups] = useState<Group[]>([]);
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const flat = groups.flatMap((g) => g.results);

  // Debounced search
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(async () => {
      if (q.trim().length < 2) {
        setGroups([]);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/search?q=${encodeURIComponent(q.trim())}`);
        const json = (await res.json()) as { groups: Group[] };
        setGroups(json.groups ?? []);
        setActive(0);
      } catch {
        setGroups([]);
      } finally {
        setLoading(false);
      }
    }, 180);
    return () => clearTimeout(t);
  }, [q, open]);

  // Focus + reset on open (deferred until after paint)
  useEffect(() => {
    if (!open) return;
    const id = requestAnimationFrame(() => {
      setQ("");
      setGroups([]);
      setActive(0);
      inputRef.current?.focus();
    });
    return () => cancelAnimationFrame(id);
  }, [open]);

  const go = useCallback(
    (href: string) => {
      onOpenChange(false);
      router.push(href);
    },
    [onOpenChange, router],
  );

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") onOpenChange(false);
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, flat.length - 1));
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    }
    if (e.key === "Enter" && flat[active]) {
      e.preventDefault();
      go(flat[active].href);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center px-4 pt-[12vh]" role="dialog" aria-modal="true" aria-label="Search the console">
      <button
        type="button"
        aria-label="Close search"
        onClick={() => onOpenChange(false)}
        className="absolute inset-0 h-full w-full cursor-default bg-foreground/45 backdrop-blur-sm"
      />
      <div className="relative w-full max-w-xl overflow-hidden rounded-xl border border-border bg-surface shadow-2xl" onKeyDown={onKey}>
        <div className="flex items-center gap-3 border-b border-border px-4">
          <AdminIcon name="search" className="h-4 w-4 shrink-0 text-muted" />
          <input
            ref={inputRef}
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search enquiries, articles, roles, services…"
            aria-label="Search query"
            className="h-12 w-full bg-transparent text-[0.9375rem] text-foreground outline-none placeholder:text-muted"
          />
          <kbd className="hidden shrink-0 rounded-md border border-border px-1.5 py-0.5 font-mono text-[0.625rem] text-muted sm:block">ESC</kbd>
        </div>

        <div className="max-h-[52vh] overflow-y-auto p-2">
          {loading && q.trim().length >= 2 ? (
            <p className="px-3 py-6 text-center text-[0.8125rem] text-muted">Searching…</p>
          ) : q.trim().length < 2 ? (
            <p className="px-3 py-6 text-center text-[0.8125rem] text-muted">
              Type at least two characters — searches every collection and the inbox.
            </p>
          ) : flat.length === 0 ? (
            <p className="px-3 py-6 text-center text-[0.8125rem] text-muted">No matches for “{q.trim()}”.</p>
          ) : (
            groups.map((g) => (
              <div key={g.label} className="mb-1.5">
                <p className="px-3 py-1.5 text-[0.6875rem] font-bold uppercase tracking-[0.07em] text-muted">{g.label}</p>
                {g.results.map((r) => {
                  const idx = flat.indexOf(r);
                  return (
                    <Link
                      key={r.href}
                      href={r.href}
                      onClick={() => onOpenChange(false)}
                      onMouseEnter={() => setActive(idx)}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-[0.875rem]",
                        idx === active ? "bg-accent/10 text-accent" : "text-foreground hover:bg-foreground/[0.05]",
                      )}
                    >
                      <AdminIcon name={(g.icon as AdminIconName) ?? "node"} className="h-4 w-4 shrink-0 opacity-70" />
                      <span className="min-w-0 flex-1 truncate font-medium">{r.title}</span>
                      <span className="t-caption hidden max-w-[40%] truncate font-mono text-muted sm:block">{r.hint}</span>
                    </Link>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
