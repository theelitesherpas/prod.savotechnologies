"use client";

import { useEffect, useRef, useState } from "react";
import { Section } from "@/components/ui/section";
import { Reveal } from "@/components/ui/reveal";
import { METHODOLOGY } from "@/constants/content";

export function Methodology() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let ticking = false;
    const update = () => {
      ticking = false;
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      // 0 when the row enters the lower viewport, 1 when it passes the upper third
      const total = rect.height + vh * 0.6;
      const passed = vh * 0.85 - rect.top;
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
    <Section id="process" index="Method" labelledBy="process-heading">
      <div className="mb-14 sm:mb-20">
        <Reveal>
          <h2 id="process-heading" className="t-dl max-w-[16ch]">
            From ambiguity to launch.
          </h2>
        </Reveal>
      </div>

      <div ref={ref}>
        {/* Progress hairline */}
        <div className="relative mb-10 h-px w-full bg-border" aria-hidden="true">
          <div
            className="absolute left-0 top-0 h-px bg-accent transition-[width] duration-150 ease-linear"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>

        <ol className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-5 lg:gap-x-6">
          {METHODOLOGY.map((step, i) => (
            <li key={step.index} className="group">
              <Reveal delay={i * 90}>
                <div className="flex items-center gap-4">
                  <span aria-hidden="true" className="h-2 w-2 shrink-0 bg-accent" />
                  <span aria-hidden="true" className="h-px flex-1 bg-border" />
                </div>
                <h3 className="t-h3 mt-5">{step.name}</h3>
                <p className="t-sm mt-3 max-w-[26ch] text-muted">{step.text}</p>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </Section>
  );
}
