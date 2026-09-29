"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";

/**
 * GalleryCarousel: premium two-up image slider.
 * Desktop: two large images side by side with arrow navigation.
 * Mobile: single image with swipe/drag.
 * Smooth scroll-snap, dots indicator, keyboard arrows, lazy loading.
 */

export type GalleryImage = { src: string; alt: string; width: number; height: number };

export function GalleryCarousel({ images, title }: { images: GalleryImage[]; title: string }) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);

  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  const perView = isMobile ? 1 : 2;
  const maxIndex = Math.max(0, images.length - perView);

  const updateState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const itemWidth = el.scrollWidth / images.length;
    const idx = Math.round(el.scrollLeft / itemWidth);
    setActiveIndex(Math.min(idx, maxIndex));
    setCanPrev(el.scrollLeft > 10);
    setCanNext(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  }, [images.length, maxIndex]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateState, { passive: true });
    updateState();
    return () => el.removeEventListener("scroll", updateState);
  }, [updateState]);

  const scrollTo = (idx: number) => {
    const el = scrollRef.current;
    if (!el) return;
    const clamped = Math.max(0, Math.min(idx, maxIndex));
    const itemWidth = el.scrollWidth / images.length;
    el.scrollTo({ left: clamped * itemWidth, behavior: "smooth" });
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") scrollTo(activeIndex - 1);
    if (e.key === "ArrowRight") scrollTo(activeIndex + 1);
  };

  if (images.length === 0) return null;

  return (
    <div className="relative" onKeyDown={handleKey} tabIndex={0} aria-label={`${title} gallery`}>
      {/* Scroll container */}
      <div
        ref={scrollRef}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ paddingBottom: 4 }}
      >
        {images.map((img, i) => (
          <figure
            key={i}
            className="group relative shrink-0 snap-center overflow-hidden rounded-xl border border-border bg-surface shadow-[0_4px_20px_rgb(10_10_14/0.06)]"
            style={{ width: isMobile ? "100%" : "calc(50% - 8px)" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img.src}
              alt={img.alt || `${title} · screen ${i + 1}`}
              className="aspect-[4/3] w-full object-cover transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:scale-[1.02]"
              loading={i < 2 ? "eager" : "lazy"}
              draggable={false}
            />
            {/* Glass caption */}
            {img.alt ? (
              <figcaption className="absolute inset-x-3 bottom-3 rounded-lg bg-white/70 px-3.5 py-2.5 backdrop-blur-md">
                <p className="text-[0.75rem] font-medium text-foreground/80">{img.alt}</p>
              </figcaption>
            ) : null}
            {/* Image counter */}
            <span className="absolute right-3 top-3 rounded-md bg-[rgb(16_19_25/0.5)] px-2 py-1 font-mono text-[0.625rem] text-white/80 backdrop-blur-sm">
              {String(i + 1).padStart(2, "0")}/{String(images.length).padStart(2, "0")}
            </span>
          </figure>
        ))}
      </div>

      {/* Navigation arrows (desktop) */}
      <div className="mt-4 hidden items-center justify-between sm:flex">
        <button
          type="button"
          onClick={() => scrollTo(activeIndex - 1)}
          disabled={!canPrev}
          aria-label="Previous images"
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-full border border-border bg-background shadow-sm transition-all",
            canPrev ? "text-foreground hover:border-foreground/40 hover:shadow-md" : "cursor-not-allowed text-muted/30",
          )}
        >
          <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10 3 5 8l5 5" /></svg>
        </button>

        {/* Dots */}
        <div className="flex items-center gap-2" role="tablist" aria-label="Gallery position">
          {Array.from({ length: maxIndex + 1 }).map((_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={activeIndex === i}
              aria-label={`Go to position ${i + 1}`}
              onClick={() => scrollTo(i)}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                activeIndex === i ? "w-8 bg-accent" : "w-2 bg-border hover:bg-foreground/20",
              )}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={() => scrollTo(activeIndex + 1)}
          disabled={!canNext}
          aria-label="Next images"
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-full border border-border bg-background shadow-sm transition-all",
            canNext ? "text-foreground hover:border-foreground/40 hover:shadow-md" : "cursor-not-allowed text-muted/30",
          )}
        >
          <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3l5 5-5 5" /></svg>
        </button>
      </div>

      {/* Mobile hint */}
      <p className="t-caption mt-3 text-center text-muted/60 sm:hidden">
        Swipe to browse {images.length} screens
      </p>
    </div>
  );
}
