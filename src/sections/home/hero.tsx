"use client";

import { useLayoutEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { useEnquiry } from "@/components/shared/enquiry-dialog";
import { Magnetic } from "@/components/ui/magnetic";
import { HeroCanvas } from "./hero-canvas";
import { track } from "@/lib/analytics";
import { SITE } from "@/constants/site";

/**
 * Homepage hero - Deloitte-grade line reveal (GSAP).
 *
 * Whole rendered LINES rise out of per-line masks (measured after
 * layout), so the sentence moves as continuous units - never fragmented
 * per word. Eyebrow, lead, CTAs and footer cascade behind; the system
 * visual settles with a clip + scale reveal.
 *
 * Cold-cache safety (the hard-refresh bug this replaces): webfonts can
 * swap AFTER the first split and change line wrapping. So the split is
 * re-measured once fonts settle (racing a 350ms ceiling so the intro is
 * never held hostage by a slow font), rebuilt while still hidden, and
 * only then does the timeline play. There is no kill-path that can leave
 * content invisible: every animated element ends at its final state.
 *
 * Accessibility: initial hidden states are JS-applied pre-paint only;
 * the un-split markup is fully readable without JS, and the whole
 * timeline is skipped under prefers-reduced-motion.
 */

const FONT_CEILING_MS = 350;

function unwrapLines(h1: HTMLHeadingElement) {
  for (const mask of Array.from(h1.querySelectorAll(":scope > span[data-line-mask]"))) {
    const mover = mask.firstElementChild;
    const parent = mask.parentElement;
    if (!mover || !parent) continue;
    while (mover.firstChild) parent.insertBefore(mover.firstChild, mask);
    mask.remove();
  }
  h1.dataset.linesSplit = "";
}

function splitLines(h1: HTMLHeadingElement): HTMLElement[] {
  const words = Array.from(h1.querySelectorAll<HTMLElement>("[data-word]"));
  if (words.length === 0) return [];
  const groups: { nodes: Node[] }[] = [];
  let currentTop = -1;
  for (const w of words) {
    const top = w.offsetTop;
    if (top !== currentTop) {
      currentTop = top;
      groups.push({ nodes: [] });
    }
    const prev = w.previousSibling;
    if (prev && prev.nodeType === Node.TEXT_NODE) groups[groups.length - 1].nodes.push(prev);
    groups[groups.length - 1].nodes.push(w);
  }
  const movers: HTMLElement[] = [];
  for (const g of groups) {
    const mask = document.createElement("span");
    mask.dataset.lineMask = "";
    mask.style.display = "block";
    mask.style.overflow = "hidden";
    mask.style.paddingBottom = "0.16em";
    mask.style.marginBottom = "-0.16em";
    const mover = document.createElement("span");
    mover.style.display = "block";
    mover.style.willChange = "transform";
    mask.appendChild(mover);
    h1.insertBefore(mask, g.nodes[0]);
    for (const n of g.nodes) mover.appendChild(n);
    movers.push(mover);
  }
  h1.dataset.linesSplit = "done";
  return movers;
}

const lineCount = (h1: HTMLHeadingElement) =>
  new Set(Array.from(h1.querySelectorAll<HTMLElement>("[data-word]"), (w) => w.offsetTop)).size;

export function Hero() {
  const { open } = useEnquiry();
  const rootRef = useRef<HTMLElement | null>(null);
  const h1Ref = useRef<HTMLHeadingElement | null>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    const h1 = h1Ref.current;
    if (!root || !h1 || h1.dataset.linesSplit === "done") return;

    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      // 1. Split + hide pre-paint (no flash, no FOUC).
      let movers = splitLines(h1);
      if (movers.length === 0) return;

      const q = gsap.utils.selector(root);
      const fades = q("[data-intro='fade']");
      const visual = q("[data-intro='visual']");

      gsap.set(movers, { yPercent: 118 });
      gsap.set(fades, { autoAlpha: 0, y: 26 });
      gsap.set(visual, { clipPath: "inset(16% 8% 24% 8%)", scale: 1.12, autoAlpha: 0 });

      let disposed = false;
      let played = false;

      // 2. Play once fonts settle (or the ceiling hits) - re-splitting
      //    first if final font metrics changed the line breaks.
      const play = () => {
        if (disposed || played) return;
        played = true;
        if (lineCount(h1) !== movers.length) {
          // final metrics differ: rebuild masks to the real lines, hidden
          movers.forEach((m) => {
            const mask = m.parentElement;
            const parent = mask?.parentElement;
            if (!mask || !parent) return;
            while (m.firstChild) parent.insertBefore(m.firstChild, mask);
            mask.remove();
          });
          h1.dataset.linesSplit = "";
          movers = splitLines(h1);
          gsap.set(movers, { yPercent: 118 });
        }

        const tl = gsap.timeline({
          defaults: { ease: "expo.out" },
          onComplete: () => {
            gsap.set([...movers, ...fades], { clearProps: "transform,willChange" });
          },
        });
        tl.to(movers, { yPercent: 0, duration: 1.3, stagger: 0.12 }, 0.12)
          .to(fades, { autoAlpha: 1, y: 0, duration: 1.1, stagger: 0.14 }, 0.7)
          .to(visual, { clipPath: "inset(0% 0% 0% 0%)", scale: 1, autoAlpha: 1, duration: 1.8 }, 0.35);
        cleanupFns.push(() => {
          // any teardown completes the intro: nothing may stay hidden
          tl.progress(1);
          tl.kill();
        });
      };

      const cleanupFns: Array<() => void> = [];
      let ceiling: ReturnType<typeof setTimeout> | undefined;
      const fontsReady = (document.fonts?.ready ?? Promise.resolve()).then(() => {
        if (!disposed) {
          if (ceiling) clearTimeout(ceiling);
          play();
        }
      });
      ceiling = setTimeout(() => {
        if (!played) play();
      }, FONT_CEILING_MS);

      return () => {
        disposed = true;
        if (ceiling) clearTimeout(ceiling);
        for (const fn of cleanupFns) fn();
        // belt and braces: everything at its final, visible state
        gsap.set([...movers, ...fades, ...visual], { clearProps: "all" });
      };
    });

    return () => mm.revert();
  }, []);

  return (
    <section id="top" ref={rootRef} aria-labelledby="hero-heading" className="relative overflow-hidden">
      <div
        aria-hidden="true"
        className="hero-blob pointer-events-none absolute inset-0 z-0"
        style={{ background: "radial-gradient(ellipse 500px 400px at 70% 40%, rgba(217,72,15,0.05), transparent 70%)" }}
      />
      <div className="shell flex min-h-[100svh] flex-col justify-center pt-[calc(var(--nav-h)+3rem)] pb-24 lg:pt-[calc(var(--nav-h)+2rem)]">
        <div className="grid items-center gap-10 lg:grid-cols-12">
          <div className="relative z-10 lg:col-span-7 xl:col-span-7">
            <p data-intro="fade" className="t-label mb-7 inline-flex items-center gap-3 text-muted">
              <span aria-hidden="true" className="h-2 w-2 bg-accent" />
              {SITE.positioning}
            </p>

            {/* Words only in markup - lines are measured and masked at runtime */}
            <h1 id="hero-heading" ref={h1Ref} className="t-dxl max-w-[15ch]">
              <span data-word className="inline-block">We</span>{" "}
              <span data-word className="inline-block">design</span>{" "}
              <span data-word className="inline-block">and</span>{" "}
              <span data-word className="inline-block">engineer</span>{" "}
              <span data-word className="inline-block">what&apos;s</span>{" "}
              <span data-word className="inline-block">next</span>
              <span data-word className="inline-block text-accent">.</span>
            </h1>

            <p data-intro="fade" className="t-body-lg mt-8 max-w-[34rem] text-muted">
              Savo Technologies creates high-performance websites, mobile apps,
              software products and AI-powered systems for ambitious businesses.
            </p>

            <div data-intro="fade" className="mt-10 flex flex-wrap items-center gap-4">
              <Magnetic strength={0.25}>
              <button
                onClick={() => {
                  track("hero_cta_click");
                  open("hero");
                }}
                className="group/btn inline-flex h-[3.25rem] items-center justify-center gap-2.5 rounded-[2px] bg-foreground px-7 text-base font-semibold tracking-[-0.01em] text-background transition-colors duration-300 ease-[var(--ease-out-expo)] hover:bg-accent hover:text-on-accent"
              >
                Start a Project
                <svg aria-hidden="true" viewBox="0 0 14 14" className="h-3 w-3 transition-transform duration-300 group-hover/btn:translate-x-[3px]" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <path d="M1 7h11M7.5 2.5 12 7l-4.5 4.5" />
                </svg>
              </button>
              </Magnetic>
              <Magnetic strength={0.2}>
              <Link
                href="#work"
                onClick={() => track("explore_work_click")}
                className="link-underline inline-flex h-[3.25rem] items-center border border-foreground/25 px-7 text-base font-semibold transition-colors duration-300 ease-[var(--ease-out-expo)] hover:border-foreground hover:bg-foreground/[0.04] rounded-[2px]"
              >
                Explore Our Work
              </Link>
              </Magnetic>
            </div>
          </div>

          {/* Interactive system visual, below the pitch on mobile, beside it on desktop */}
          <div
            data-intro="visual"
            className="relative order-last h-[240px] sm:h-[300px] lg:order-none lg:col-span-5 lg:h-[min(52vw,560px)] xl:h-[560px]"
          >
            <HeroCanvas className="absolute inset-0" />
          </div>
        </div>

        {/* Hero footer meta */}
        <div data-intro="fade" className="mt-auto flex items-end justify-between pt-16">
          <a
            href="#studio"
            className="t-label group inline-flex items-center gap-2 py-3 text-muted transition-colors hover:text-foreground"
            aria-label="Scroll to discover Savo"
          >
            Discover Savo
            <svg aria-hidden="true" viewBox="0 0 14 14" className="h-3 w-3 transition-transform duration-300 group-hover:translate-y-[3px]" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M7 1v11M2.5 7.5 7 12l4.5-4.5" />
            </svg>
          </a>
          <p className="t-label hidden text-muted sm:block">Design × Engineering × AI</p>
        </div>
      </div>
    </section>
  );
}
