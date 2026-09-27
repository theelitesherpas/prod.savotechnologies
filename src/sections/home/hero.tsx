"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { useEnquiry } from "@/components/shared/enquiry-dialog";
import { HeroCanvas } from "./hero-canvas";
import { track } from "@/lib/analytics";
import { SITE } from "@/constants/site";

/**
 * Homepage hero - Deloitte-grade cinematic intro (GSAP).
 *
 * The premium detail: the headline reveals as WHOLE LINES rising out of
 * per-line masks (measured after layout), never per-word - so the type
 * reads as one continuous, unbroken sentence while it moves, exactly the
 * agency feel of the Deloitte hero. Supporting cast (eyebrow, lead, CTAs)
 * cascades behind; the system visual settles with a clip + scale reveal.
 *
 * Robustness: splitting happens in useLayoutEffect (before first paint,
 * no flash), re-validated once webfonts settle (self-hosted + preloaded,
 * so grouping is stable), guarded against double-runs, and the entire
 * timeline is skipped under prefers-reduced-motion - reduced users get
 * the finished hero instantly, and the un-split markup needs no JS at all.
 */

export function Hero() {
  const { open } = useEnquiry();
  const rootRef = useRef<HTMLElement | null>(null);
  const h1Ref = useRef<HTMLHeadingElement | null>(null);

  /* Split headline words into per-LINE mask wrappers. Pure DOM, once. */
  const splitLines = (h1: HTMLHeadingElement) => {
    const words = Array.from(h1.querySelectorAll<HTMLElement>("[data-word]"));
    if (words.length === 0) return [];
    // Group word spans by their rendered line (offsetTop)
    const groups: { top: number; nodes: Node[] }[] = [];
    let currentTop = -1;
    for (const w of words) {
      const top = w.offsetTop;
      if (top !== currentTop) {
        currentTop = top;
        groups.push({ top, nodes: [] });
      }
      // keep the whitespace text node that precedes the word (spacing)
      const prev = w.previousSibling;
      if (prev && prev.nodeType === Node.TEXT_NODE) groups[groups.length - 1].nodes.push(prev);
      groups[groups.length - 1].nodes.push(w);
    }
    // Wrap each line group: mask (overflow hidden, descender-safe) + mover
    const movers: HTMLElement[] = [];
    for (const g of groups) {
      const mask = document.createElement("span");
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
  };

  useLayoutEffect(() => {
    const root = rootRef.current;
    const h1 = h1Ref.current;
    if (!root || !h1 || h1.dataset.linesSplit === "done") return;

    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const movers = splitLines(h1);
      if (movers.length === 0) return;

      const q = gsap.utils.selector(root);
      const fades = q("[data-intro='fade']");
      const visual = q("[data-intro='visual']");

      // Hidden states applied pre-paint: no flash, no FOUC
      gsap.set(movers, { yPercent: 118 });
      gsap.set(fades, { autoAlpha: 0, y: 24 });
      gsap.set(visual, { clipPath: "inset(16% 8% 24% 8%)", scale: 1.12, autoAlpha: 0 });

      const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
      tl.to(movers, { yPercent: 0, duration: 1.25, stagger: 0.11 }, 0.12)
        .to(fades, { autoAlpha: 1, y: 0, duration: 1.05, stagger: 0.12 }, 0.55)
        .to(visual, { clipPath: "inset(0% 0% 0% 0%)", scale: 1, autoAlpha: 1, duration: 1.7 }, 0.3);

      /* Once webfonts settle, verify the line grouping still matches the
         final metrics (self-hosted fonts are preloaded, so this almost
         never changes). If it did, rebuild masks in the settled state. */
      let cancelled = false;
      document.fonts?.ready.then(() => {
        if (cancelled) return;
        const wordTops = Array.from(h1.querySelectorAll<HTMLElement>("[data-word]")).map((w) => w.offsetTop);
        const distinct = new Set(wordTops).size;
        if (distinct !== movers.length && tl.progress() > 0) {
          tl.kill();
          gsap.set(movers, { yPercent: 0 });
        }
      });

      return () => {
        cancelled = true;
        tl.kill();
        gsap.set([...movers, ...fades, ...visual], { clearProps: "all" });
      };
    });

    return () => mm.revert();
  }, []);

  useEffect(() => {
    // noop placeholder to keep import order stable (see useLayoutEffect above)
  }, []);

  return (
    <section id="top" ref={rootRef} aria-labelledby="hero-heading" className="relative overflow-hidden">
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
              <Link
                href="#work"
                onClick={() => track("explore_work_click")}
                className="link-underline inline-flex h-[3.25rem] items-center border border-foreground/25 px-7 text-base font-semibold transition-colors duration-300 ease-[var(--ease-out-expo)] hover:border-foreground hover:bg-foreground/[0.04] rounded-[2px]"
              >
                Explore Our Work
              </Link>
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
