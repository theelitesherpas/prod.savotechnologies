"use client";

import { useEffect, useRef, useState } from "react";
import { Section } from "@/components/ui/section";
import { SectionHeader } from "@/components/ui/section-header";
import { Reveal } from "@/components/ui/reveal";
import { cn } from "@/lib/utils";
import type { HireRole } from "@/constants/hire";

/**
 * How hiring runs — ink chapter, spine with traveling signal dot,
 * staggered steps, stack kit at the close.
 */

export function HireRoleProcess({ role }: { role: HireRole }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [progress, setProgress] = useState(0);
  const headingId = "process-heading";

  useEffect(() => {
    let ticking = false;
    const update = () => {
      ticking = false;
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const total = rect.height + vh * 0.5;
      const passed = vh * 0.8 - rect.top;
      setProgress(Math.min(1, Math.max(0, passed / total)));
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <Section index="How Hiring Runs" chapter="ink" labelledBy={headingId}>
      <SectionHeader
        id={headingId}
        heading="From call to first commit."
        lead={
          <>
            Fast where it can be, careful where it must be, and reversible
            at every step.
          </>
        }
      />

      <div ref={ref} className="relative">
        <div aria-hidden="true" className="absolute bottom-2 left-[5px] top-2 w-px bg-border" />
        <div
          aria-hidden="true"
          className="absolute left-[2px] h-2 w-2 bg-accent transition-[top] duration-150 ease-linear"
          style={{ top: `calc(0.5rem + ${progress} * (100% - 1.25rem))` }}
        />
        <ol className="space-y-10 sm:space-y-12">
          {role.process.map((step, i) => (
            <li key={step.name} className={cn("relative", i % 2 === 1 && "lg:ml-16")}>
              <Reveal delay={i * 80}>
                <div className="relative pl-8 sm:pl-10">
                  <span
                    aria-hidden="true"
                    className="absolute left-0 top-[0.45rem] h-[11px] w-[11px] border border-border bg-surface"
                  />
                  <div className="max-w-lg">
                    <h3 className="t-h3">{step.name}</h3>
                    <p className="t-body mt-3 text-muted">{step.text}</p>
                  </div>
                </div>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>

      {/* The kit */}
      <Reveal delay={140}>
        <div className="mt-16 border-t border-border pt-10 sm:mt-20">
          <div className="grid gap-8 lg:grid-cols-12">
            <p className="t-label text-muted lg:col-span-3">The stack</p>
            <ul className="flex flex-wrap gap-2 lg:col-span-9" aria-label="Core stack and tooling">
              {role.stack.map((item) => (
                <li
                  key={item}
                  className="t-label rounded-[2px] border border-border bg-surface px-3.5 py-2.5 text-muted transition-colors duration-300 ease-[var(--ease-out-expo)] hover:border-accent/60 hover:text-foreground"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Reveal>
    </Section>
  );
}

