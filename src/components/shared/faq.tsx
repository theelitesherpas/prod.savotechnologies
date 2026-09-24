"use client";

import { useState } from "react";
import { Reveal } from "@/components/ui/reveal";
import { cn } from "@/lib/utils";

/**
 * FAQ accordion — hairline rows, native button semantics, grid-rows
 * animation matching the services accordion. Doubles as the AEO surface:
 * questions render in the DOM (and as FAQPage JSON-LD at page level).
 */
export function Faq({
  items,
  label,
}: {
  items: { q: string; a: string }[];
  label: string;
}) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <Reveal>
      <div className="border-t border-border">
        {items.map((item, i) => {
          const isOpen = open === i;
          return (
            <div key={item.q} className="border-b border-border">
              <h3>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={`faq-panel-${i}`}
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
                id={`faq-panel-${i}`}
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
      <p className="t-caption sr-only">{label}</p>
    </Reveal>
  );
}
