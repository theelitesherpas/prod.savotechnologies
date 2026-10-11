"use client";

import { useCallback, useEffect, useId, useRef, useState, useSyncExternalStore, type KeyboardEvent } from "react";
import type { PortfolioVisual } from "./portfolio-content";
import styles from "./project-details.module.css";

const subscribe = () => () => {};
/** Hydrate with the server's two-up snapshot, then adapt to the real viewport. */
const perView = () => (window.matchMedia("(max-width: 700px)").matches ? 1 : 2);
const serverPerView = () => 2;
const subscribePerView = (onChange: () => void) => {
  const media = window.matchMedia("(max-width: 700px)");
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
};
function slideStep(el: HTMLDivElement) {
  const first = el.children[0] as HTMLElement | undefined;
  const second = el.children[1] as HTMLElement | undefined;
  return first && second ? second.offsetLeft - first.offsetLeft : el.clientWidth || 1;
}

/**
 * ProjectGallery - the two-up slider experience from the v6 case studies
 * (savotechnologies.com/case-studies/the-fresh-art-club): two large screens
 * side by side on desktop, one on phones, native scroll-snap sliding with
 * arrow buttons, position dots, a per-screen counter and keyboard control.
 * Rendered in the approved v7 world: centered, frame-filling screenshots
 * (object-fit: cover preserves proportions and crops excess at the edges), solid
 * captions, one red. Gallery attachments are managed in the authenticated
 * CMS, max eight.
 */
export function ProjectGallery({ images, name }: { images: PortfolioVisual[]; name: string }) {
  const views = images.slice(0, 8);
  const id = useId();
  const track = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);
  const ready = useSyncExternalStore(subscribe, () => true, () => false);

  const screensPerView = useSyncExternalStore(subscribePerView, perView, serverPerView);
  const maxIndex = Math.max(0, views.length - screensPerView);

  const measure = useCallback(() => {
    const el = track.current;
    if (!el || !views.length) return;
    const itemWidth = slideStep(el);
    setActive(Math.min(Math.round(el.scrollLeft / itemWidth), Math.max(0, views.length - perView())));
    setCanPrev(el.scrollLeft > 10);
    setCanNext(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  }, [views.length]);

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const media = window.matchMedia("(max-width: 700px)");
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    el.addEventListener("scroll", measure, { passive: true });
    media.addEventListener("change", measure);
    measure();
    return () => { observer.disconnect(); el.removeEventListener("scroll", measure); media.removeEventListener("change", measure); };
  }, [measure]);

  const goTo = (index: number) => {
    const el = track.current;
    if (!el) return;
    const clamped = Math.max(0, Math.min(index, Math.max(0, views.length - perView())));
    const itemWidth = slideStep(el);
    el.scrollTo({ left: clamped * itemWidth, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  };

  const keys = (event: KeyboardEvent) => {
    if (!ready || event.altKey || event.ctrlKey || event.metaKey) return;
    const index = event.key === "ArrowRight" ? active + 1 : event.key === "ArrowLeft" ? active - 1 : event.key === "Home" ? 0 : event.key === "End" ? maxIndex : null;
    if (index === null) return;
    event.preventDefault(); goTo(index);
  };

  if (!views.length) return null;
  const positions = maxIndex + 1;
  return <div className={styles.slider} role="region" aria-roledescription="carousel" aria-label={`${name} project images`} onKeyDown={keys} data-project-gallery>
    {/* Only horizontal gestures bypass Lenis; vertical scrolling continues
        through the page instead of switching to native scrolling mid-gesture. */}
    <div className={styles.sliderTrack} ref={track} id={id} tabIndex={0} data-lenis-prevent-horizontal aria-label="Project images. Use left and right arrow keys or scroll to browse.">
      {views.map((image, index) => <figure key={`${image.src}-${index}`} className={styles.slide} role="group" aria-roledescription="slide" aria-label={`Image ${index + 1} of ${views.length}`}>
        <div className={styles.slideImage}>
          <span className={styles.counter} aria-hidden="true">{String(index + 1).padStart(2, "0")}/{String(views.length).padStart(2, "0")}</span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image.src} alt={image.alt} width={image.width} height={image.height} loading={index < 2 ? "eager" : "lazy"} decoding="async" draggable={false} />
        </div>
      </figure>)}
    </div>
    <div className={styles.sliderControls}>
      <button type="button" disabled={!ready || !canPrev} aria-label="Previous project image" aria-controls={id} onClick={() => goTo(active - 1)}><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M19 12H5m6-6-6 6 6 6" /></svg></button>
      <p role="status" aria-live="polite" aria-atomic="true" className={styles.position}>{Math.min(active + 1, positions)}<span> / {positions}</span></p>
      <button type="button" disabled={!ready || !canNext} aria-label="Next project image" aria-controls={id} onClick={() => goTo(active + 1)}><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M5 12h14m-6-6 6 6-6 6" /></svg></button>
      <div className={styles.dots} role="group" aria-label="Gallery positions">
        {Array.from({ length: positions }, (_, index) => <button type="button" key={index} aria-pressed={active === index} aria-label={`Go to position ${index + 1}`} aria-controls={id} disabled={!ready} onClick={() => goTo(index)} className={index === active ? styles.dotActive : undefined} />)}
      </div>
    </div>
    <noscript><p className={styles.nativeHint}>Scroll through the images.</p></noscript>
  </div>;
}
