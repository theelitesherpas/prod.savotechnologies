"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { CSSProperties, PointerEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { INDUSTRIES_ATLAS } from "@/constants/industries";
import { track } from "@/lib/analytics";
import { ArrowIcon } from "./icons";
import styles from "./industry-fan.module.css";
import { HOME_COPY } from "./homepage-copy";

const COUNT = INDUSTRIES_ATLAS.length;
const INITIAL = Math.min(COUNT - 1, Math.max(0, Math.floor(COUNT / 2) - 1));
type Gesture = { x: number; y: number; lastX: number; pointerId: number; horizontal: boolean; start: number };

/** Stable card shells expand in place. Only the explicit sector link navigates. */
export function IndustryFan() {
  const [active, setActive] = useState(INITIAL);
  const [width, setWidth] = useState(1440);
  const selected = useRef(INITIAL);
  const stageRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const gesture = useRef<Gesture | null>(null);
  const suppressClick = useRef(false);
  const wheelAt = useRef(0);

  const select = useCallback((index: number) => {
    const next = Math.max(0, Math.min(COUNT - 1, index));
    if (next === selected.current) return;
    selected.current = next;
    setActive(next);
    track("industry_slider_select", { industry: INDUSTRIES_ATLAS[next].id });
  }, []);

  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const measure = () => setWidth(stage.getBoundingClientRect().width);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => { if (stageRef.current) stageRef.current.scrollLeft = 0; }, [active, width]);

  // Horizontal trackpad gestures select a card; ordinary page scrolling is untouched.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const onWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaX) <= Math.abs(event.deltaY) || Math.abs(event.deltaX) < 8) return;
      event.preventDefault();
      const now = Date.now();
      if (now - wheelAt.current < 350) return;
      wheelAt.current = now;
      select(selected.current + (event.deltaX > 0 ? 1 : -1));
    };
    stage.addEventListener("wheel", onWheel, { passive: false });
    return () => stage.removeEventListener("wheel", onWheel);
  }, [select]);

  const activeWidth = width < 768 ? width * .82 : width < 1200 ? Math.min(width * .6, 540) : Math.min(500, Math.max(430, width * .33));
  const stripWidth = width < 768 ? 64 : width < 1200 ? 88 : 112;
  const gap = width < 1200 ? 10 : 12;
  const height = width < 768 ? 320 : width < 1200 ? 380 : 420;
  const lefts: number[] = [];
  let total = 0;
  for (let index = 0; index < COUNT; index++) { lefts.push(total); total += (index === active ? activeWidth : stripWidth) + gap; }
  total -= gap;
  const centered = (width - activeWidth) / 2 - lefts[active];
  const trackX = total <= width ? (width - total) / 2 : Math.max(width - 20 - total, Math.min(20, centered));
  const current = INDUSTRIES_ATLAS[active];

  function resetGesture(stage: HTMLDivElement) {
    const pointer = gesture.current?.pointerId;
    if (pointer !== undefined && stage.hasPointerCapture(pointer)) stage.releasePointerCapture(pointer);
    gesture.current = null;
    stage.removeAttribute("data-dragging");
    trackRef.current?.style.setProperty("--drag-offset", "0px");
  }
  function pointerDown(event: PointerEvent<HTMLDivElement>) {
    if (!event.isPrimary || event.button !== 0 || (event.target as Element).closest("a")) return;
    suppressClick.current = false;
    gesture.current = { x: event.clientX, y: event.clientY, lastX: event.clientX, pointerId: event.pointerId, horizontal: false, start: selected.current };
  }
  function pointerMove(event: PointerEvent<HTMLDivElement>) {
    const currentGesture = gesture.current;
    if (!currentGesture || currentGesture.pointerId !== event.pointerId) return;
    const dx = event.clientX - currentGesture.x;
    const dy = event.clientY - currentGesture.y;
    currentGesture.lastX = event.clientX;
    if (!currentGesture.horizontal) {
      if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) { resetGesture(event.currentTarget); return; }
      if (Math.abs(dx) < 10 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
      currentGesture.horizontal = true;
      suppressClick.current = true;
      event.currentTarget.setPointerCapture(event.pointerId);
      event.currentTarget.setAttribute("data-dragging", "true");
    }
    trackRef.current?.style.setProperty("--drag-offset", `${Math.max(-140, Math.min(140, dx)) * .4}px`);
  }
  function pointerUp(event: PointerEvent<HTMLDivElement>) {
    const currentGesture = gesture.current;
    if (!currentGesture || currentGesture.pointerId !== event.pointerId) return;
    const dx = currentGesture.lastX - currentGesture.x;
    if (currentGesture.horizontal && Math.abs(dx) > 45) select(currentGesture.start + (dx < 0 ? 1 : -1));
    resetGesture(event.currentTarget);
  }

  return (
    <section data-home-section="industries" aria-labelledby="industry-heading" className={styles.section}>
      <div className={styles.header}>
        <h2 id="industry-heading">{HOME_COPY.industries.title}</h2>
        <p>{HOME_COPY.industries.lead}</p>
      </div>
      <div
        ref={stageRef} className={styles.stage} style={{ height }} role="group" aria-roledescription="carousel" aria-label="Industries" tabIndex={0}
        onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp}
        onPointerCancel={(event) => resetGesture(event.currentTarget)}
        onLostPointerCapture={(event) => { if (event.target === event.currentTarget && gesture.current) resetGesture(event.currentTarget); }}
        onClickCapture={(event) => { if (suppressClick.current) { event.preventDefault(); event.stopPropagation(); } }}
        onKeyDown={(event) => {
          suppressClick.current = false;
          const next = event.key === "ArrowRight" ? selected.current + 1 : event.key === "ArrowLeft" ? selected.current - 1 : event.key === "Home" ? 0 : event.key === "End" ? COUNT - 1 : null;
          if (next === null) return;
          event.preventDefault();
          const index = Math.max(0, Math.min(COUNT - 1, next));
          select(index);
          buttonRefs.current[index]?.focus({ preventScroll: true });
        }}
        onDragStart={(event) => event.preventDefault()}
      >
        <div ref={trackRef} className={styles.track} style={{ width: total, transform: `translateX(calc(${trackX}px + var(--drag-offset, 0px)))` }}>
          {INDUSTRIES_ATLAS.map((sector, index) => {
            const isActive = index === active;
            return (
              <div key={sector.id} className={styles.card} data-selected={isActive} style={{ left: lefts[index], width: isActive ? activeWidth : stripWidth, "--detail-width": `${activeWidth - 48}px` } as CSSProperties}>
                <Image src={`/images/sectors/${sector.id}-hero.webp`} alt="" fill sizes="(max-width: 768px) 82vw, 500px" draggable={false} className={styles.image} />
                <span aria-hidden="true" className={styles.scrim} />
                <button
                  type="button" ref={(element) => { buttonRefs.current[index] = element; }} className={styles.selector}
                  aria-label={`Select ${sector.title} industry`} aria-expanded={isActive} aria-controls={`industry-detail-${sector.id}`}
                  onClick={() => select(index)} onFocus={(event) => { if (event.currentTarget.matches(":focus-visible")) select(index); }}
                ><span aria-hidden="true" className={styles.stripLabel}>{sector.title}</span></button>
                <div id={`industry-detail-${sector.id}`} className={styles.detail} inert={!isActive} aria-hidden={!isActive}>
                  <h3>{sector.title}</h3><p>{sector.hint}</p>
                  <Link href={`/industries/${sector.id}`} onClick={() => track("industry_slider_open", { industry: sector.id })} className={styles.sectorLink}>
                    View sector <ArrowIcon size={14} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className={styles.controls} aria-label="Industry controls">
        <button type="button" aria-label="Previous industry" disabled={active === 0} onClick={() => select(selected.current - 1)}><ArrowIcon direction="left" size={16} /></button>
        <p aria-live="polite"><span>{current.title}</span><span>{active + 1} of {COUNT}</span></p>
        <button type="button" aria-label="Next industry" disabled={active === COUNT - 1} onClick={() => select(selected.current + 1)}><ArrowIcon size={16} /></button>
      </div>
    </section>
  );
}
