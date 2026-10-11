"use client";

import { useId, useState } from "react";
import { Reveal } from "@/components/ui/reveal";
import { cn } from "@/lib/utils";

/**
 * FAQ accordion - hairline rows, native button semantics, grid-rows
 * animation matching the services accordion. Doubles as the AEO surface:
 * questions render in the DOM (and as FAQPage JSON-LD at page level).
 */
export function Faq({
  items,
  label,
  initialVisible,
}: {
  items: { q: string; a: string }[];
  label: string;
  /** Optional progressive disclosure; all answers remain in the DOM. */
  initialVisible?: number;
}) {
  const id = useId();
  const [open, setOpen] = useState<number | null>(0);
  const [showAll, setShowAll] = useState(false);
  const limit = initialVisible === undefined ? items.length : Math.max(1, initialVisible);

  return (
    <Reveal>
      <div id={`${id}-questions`} className="border-t border-border">
        {items.map((item, i) => {
          const isOpen = open === i;
          return (
            <div key={item.q} hidden={!showAll && i >= limit} className="border-b border-border">
              <h3>
                <button
                  type="button"
                  id={`${id}-question-${i}`}
                  aria-expanded={isOpen}
                  aria-controls={`${id}-panel-${i}`}
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="group grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-4 py-5 text-left sm:py-6"
                >
                  <span
                    className={cn(
                      "t-h4 transition-colors duration-300",
                      isOpen ? "text-foreground" : "text-foreground/75 group-hover:text-foreground",
                    )}
                  >
                    {item.q}
                  </span>
                  <span
                    aria-hidden="true"
                    className={cn(
                      "relative h-3.5 w-3.5 justify-self-end transition-transform duration-500 ease-[var(--ease-out-expo)]",
                      isOpen && "rotate-45",
                    )}
                  >
                    <span className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-current" />
                    <span className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-current" />
                  </span>
                </button>
              </h3>
              <div
                id={`${id}-panel-${i}`}
                role="region"
                aria-labelledby={`${id}-question-${i}`}
                inert={!isOpen}
                className={cn(
                  "grid transition-[grid-template-rows] duration-500 ease-[var(--ease-out-expo)]",
                  isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                )}
              >
                <div className="overflow-hidden">
                  <p className="t-body max-w-2xl pb-6 text-muted">{item.a}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {items.length > limit ? (
        <button
          type="button"
          aria-expanded={showAll}
          aria-controls={`${id}-questions`}
          onClick={() => { setShowAll(!showAll); if (showAll && open !== null && open >= limit) setOpen(null); }}
          className="mt-6 inline-flex min-h-12 items-center justify-center rounded-[4px] border border-border px-5 text-[0.875rem] font-semibold text-foreground transition-colors hover:border-foreground"
        >
          {showAll ? "Show fewer questions" : `Show all ${items.length} questions`}
        </button>
      ) : null}
      <p className="t-caption sr-only">{label}</p>
    </Reveal>
  );
}
