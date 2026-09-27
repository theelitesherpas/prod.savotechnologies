"use client";

import { useState } from "react";
import { Reveal } from "@/components/ui/reveal";
import { cn } from "@/lib/utils";

/**
 * Workbench - the shared deliverables/slots explorer. Tablist left, live
 * panel right; the panel swaps with a small entrance animation. Works on
 * touch the same way.
 */
export function Workbench({
  items,
  slotWord,
  includedLabel = "Included",
  panelId = "workbench-panel",
}: {
  items: { title: string; text: string }[];
  /** Short name shown in the panel footer, e.g. "Web" or "Frontend". */
  slotWord: string;
  includedLabel?: string;
  panelId?: string;
}) {
  const [active, setActive] = useState(0);
  const current = items[active];
  const slotNames = ["one", "two", "three", "four", "five", "six", "seven", "eight"];

  return (
    <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
      {/* Selector */}
      <Reveal className="lg:col-span-5">
        <ul className="border-t border-border" role="tablist" aria-label={`${slotWord} slots`}>
          {items.map((item, i) => {
            const isActive = i === active;
            return (
              <li key={item.title} role="presentation">
                <button
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActive(i)}
                  className={cn(
                    "group flex w-full items-center gap-4 border-b border-border py-5 text-left transition-colors duration-300 ease-[var(--ease-out-expo)]",
                    isActive ? "text-foreground" : "text-muted hover:text-foreground",
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "h-2 w-2 shrink-0 bg-accent transition-transform duration-300 ease-[var(--ease-out-expo)]",
                      isActive ? "scale-100" : "scale-0 group-hover:scale-100",
                    )}
                  />
                  <span className="t-h4 font-medium">{item.title}</span>
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 14 14"
                    className={cn(
                      "ml-auto h-3 w-3 shrink-0 transition-all duration-300 ease-[var(--ease-out-expo)]",
                      isActive ? "translate-x-0 text-accent opacity-100" : "-translate-x-1 opacity-0",
                    )}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                  >
                    <path d="M1 7h11M7.5 2.5 12 7l-4.5 4.5" />
                  </svg>
                </button>
              </li>
            );
          })}
        </ul>
      </Reveal>

      {/* Panel */}
      <div className="lg:col-span-7">
        <Reveal delay={120}>
          <div
            id={panelId}
            role="tabpanel"
            aria-label={current.title}
            className="flex min-h-[17rem] flex-col border border-border bg-background p-8 sm:p-10"
          >
            <div key={active} className="workbench-panel grow">
              <p className="t-label text-accent-strong">{includedLabel}</p>
              <h3 className="t-h2 mt-4 max-w-[16ch]">{current.title}</h3>
              <p className="t-body mt-5 max-w-xl text-muted">{current.text}</p>
            </div>
            <div className="mt-10 flex items-center justify-between border-t border-border pt-5">
              <span className="t-label text-muted">
                {slotWord}, slot {slotNames[active] ?? ""}
              </span>
              <div className="flex gap-1.5" aria-hidden="true">
                {items.map((_, i) => (
                  <span
                    key={i}
                    className={cn(
                      "h-1.5 w-1.5 transition-colors duration-300",
                      i === active ? "bg-accent" : "bg-border",
                    )}
                  />
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
