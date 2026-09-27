"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { useEnquiry } from "@/components/shared/enquiry-dialog";
import { HeroCanvas } from "./hero-canvas";
import { track } from "@/lib/analytics";
import { SITE } from "@/constants/site";

/**
 * Homepage hero with the Deloitte-style cinematic intro (GSAP):
 *
 * - headline words rise out of per-word masks, staggered (expo.out)
 * - eyebrow, lead copy and CTAs cascade in behind the words
 * - the system visual reveals with a clip + scale settle
 * - the footer meta row fades up last
 *
 * Accessibility first: initial states are applied by JS only, so the
 * server-rendered page is complete without motion; the timeline runs
 * exclusively under prefers-reduced-motion: no-preference, once per load.
 */

/** Headline split into per-word masks (descender-safe padding). */
function MaskedLine({ text, accent }: { text: string; accent?: string }) {
  const words = text.split(" ");
  return (
    <>
      {words.map((w, i) => (
        <span key={`${w}-${i}`} className="inline-block overflow-hidden pb-[0.14em] -mb-[0.14em] align-bottom">
          <span data-intro="word" className="inline-block will-change-transform">
            {w}
            {i < words.length - 1 ? "\u00A0" : ""}
          </span>
        </span>
      ))}
      {accent ? (
        <span className="inline-block overflow-hidden pb-[0.14em] -mb-[0.14em] align-bottom">
          <span data-intro="word" className="inline-block text-accent will-change-transform">
            {accent}
          </span>
        </span>
      ) : null}
    </>
  );
}

export function Hero() {
  const { open } = useEnquiry();
  const rootRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const q = gsap.utils.selector(root);
      const words = q("[data-intro='word']");
      const fades = q("[data-intro='fade']");
      const visual = q("[data-intro='visual']");

      // Initial states (JS-only; the page is complete without them)
      gsap.set(words, { yPercent: 120 });
      gsap.set(fades, { autoAlpha: 0, y: 26 });
      gsap.set(visual, { clipPath: "inset(18% 10% 26% 10%)", scale: 1.12, autoAlpha: 0 });

      const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
      tl.to(words, { yPercent: 0, duration: 1.05, stagger: 0.085 }, 0.15)
        .to(fades, { autoAlpha: 1, y: 0, duration: 0.9, stagger: 0.11 }, 0.45)
        .to(visual, { clipPath: "inset(0% 0% 0% 0%)", scale: 1, autoAlpha: 1, duration: 1.5 }, 0.35);

      return () => {
        tl.kill();
        gsap.set([...words, ...fades, ...visual], { clearProps: "all" });
      };
    });

    return () => mm.revert();
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

            <h1 id="hero-heading" className="t-dxl max-w-[15ch]">
              <MaskedLine text="We design and engineer what's next" accent="." />
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
