"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * The rate plate — one honest price, cycle switch, what's included.
 * The transparent-rates promise, made interactive.
 */

const inr = (n: number) => `₹${new Intl.NumberFormat("en-IN").format(n)}`;

const CYCLES = [
  { key: "m", label: "Monthly", months: 1, discount: 0, note: "cancel with 30 days notice" },
  { key: "q", label: "Quarterly", months: 3, discount: 0.05, note: "3 month commitment" },
  { key: "y", label: "Yearly", months: 12, discount: 0.1, note: "12 month commitment" },
] as const;

const INCLUDED = [
  "Dedicated senior engineer, yours only",
  "Two week paid trial to start",
  "Your tools, your standups, your repo",
  "Free instant replacement, anytime",
];

export function RatePlate({ monthly, short }: { monthly: number; short: string }) {
  const [cycle, setCycle] = useState<(typeof CYCLES)[number]>(CYCLES[1]);
  const perMonth = Math.round(monthly * (1 - cycle.discount));

  return (
    <div className="border border-border bg-surface p-7 sm:p-8">
      <div className="flex items-center justify-between gap-4">
        <p className="t-label text-muted">One rate — {short}</p>
        <span aria-hidden="true" className="h-2 w-2 bg-accent" />
      </div>

      <p className="t-dl mt-5 tnum">
        {inr(perMonth)}
        <span className="t-h4 ml-2 font-sans text-muted">/ month</span>
      </p>
      <p className="t-caption mt-1.5 text-muted">
        Dedicated senior · {cycle.note}
        {cycle.discount > 0 ? ` · saves ${inr(monthly - perMonth)} monthly` : ""}
      </p>

      {/* Cycle switch */}
      <div className="mt-6 grid grid-cols-3 gap-px border border-border bg-border" role="tablist" aria-label="Billing cycle">
        {CYCLES.map((c) => {
          const active = c.key === cycle.key;
          return (
            <button
              key={c.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setCycle(c)}
              className={cn(
                "flex flex-col items-center gap-1 px-2 py-3 transition-colors duration-300 ease-[var(--ease-out-expo)]",
                active ? "bg-foreground text-background" : "bg-background text-muted hover:text-foreground",
              )}
            >
              <span className="t-label">{c.label}</span>
              {c.discount > 0 ? (
                <span className={cn("t-label", active ? "text-background/70" : "text-accent")}>
                  −{Math.round(c.discount * 100)}%
                </span>
              ) : (
                <span className="t-label opacity-0" aria-hidden="true">·</span>
              )}
            </button>
          );
        })}
      </div>

      <ul className="mt-6 border-t border-border">
        {INCLUDED.map((item) => (
          <li key={item} className="flex items-center gap-3 border-b border-border py-2.5">
            <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 bg-accent" />
            <span className="t-caption text-foreground/85">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

