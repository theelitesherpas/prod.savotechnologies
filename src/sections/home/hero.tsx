"use client";

import Link from "next/link";
import { useEnquiry } from "@/components/shared/enquiry-dialog";
import { HeroCanvas } from "./hero-canvas";
import { track } from "@/lib/analytics";
import { SITE } from "@/constants/site";

export function Hero() {
  const { open } = useEnquiry();

  return (
    <section id="top" aria-labelledby="hero-heading" className="relative overflow-hidden">
      <div className="shell flex min-h-[100svh] flex-col justify-center pt-[calc(var(--nav-h)+3rem)] pb-24 lg:pt-[calc(var(--nav-h)+2rem)]">
        <div className="grid items-center gap-10 lg:grid-cols-12">
          <div className="relative z-10 lg:col-span-7 xl:col-span-7">
            <p className="t-label mb-7 inline-flex items-center gap-3 text-muted">
              <span aria-hidden="true" className="h-2 w-2 bg-accent" />
              {SITE.positioning}
            </p>

            <h1 id="hero-heading" className="t-dxl max-w-[15ch]">
              We design and engineer what&apos;s next
              <span aria-hidden="true" className="text-accent">.</span>
            </h1>

            <p className="t-body-lg mt-8 max-w-[34rem] text-muted">
              Savo Technologies creates high-performance websites, mobile apps,
              software products and AI-powered systems for ambitious businesses.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-4">
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

          {/* Interactive system visual — below the pitch on mobile, beside it on desktop */}
          <div className="relative order-last h-[240px] sm:h-[300px] lg:order-none lg:col-span-5 lg:h-[min(52vw,560px)] xl:h-[560px]">
            <HeroCanvas className="absolute inset-0" />
          </div>
        </div>

        {/* Hero footer meta */}
        <div className="mt-auto flex items-end justify-between pt-16">
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
