"use client";

import * as React from "react";
import { useId, useLayoutEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import s from "./industry-case-fan.module.css";

export type CaseFanItem = { id: string; title: string; kind: "published" | "placeholder"; description: string; href?: string; cover: ReactNode; identity?: ReactNode; brief?: ReactNode };
export function CaseFanArrow({ previous = false }: { previous?: boolean }) {
  return <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d={previous ? "M20 12H5m6-6-6 6 6 6" : "M6 18 18 6M7 6h11v11"} /></svg>;
}

/* Screenshot 2026-10-05 at 21.43.06: wide photographic feature story, homepage
   vertical side titles (latest instruction), top-left headline, lower-left context and circular
   lower-right action. Desktop expands in place; phone keeps a usable focal card. */
export function IndustryCaseFan({ items }: { items: CaseFanItem[] }) {
  const count = items.length;
  const [active, setActive] = useState(0);
  const [{ width, phone, padding }, setGeometry] = useState({ width: 1280, phone: false, padding: 40 });
  const [briefOpen, setBriefOpen] = useState(false);
  const stage = useRef<HTMLDivElement>(null);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const brief = useRef<HTMLDetailsElement>(null);
  const groupId = useId();
  const current = items[active];

  useLayoutEffect(() => {
    const element = stage.current;
    if (!element) return;
    const measure = () => setGeometry({ width: element.getBoundingClientRect().width, phone: window.innerWidth < 768, padding: window.innerWidth < 640 ? 24 : window.innerWidth < 1100 ? 32 : 40 });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  function select(index: number, focus = false) {
    const next = (index + count) % count;
    if (next !== active) {
      setActive(next); setBriefOpen(false);
      if (brief.current) brief.current.open = false;
    }
    if (focus) buttons.current[next]?.focus({ preventScroll: true });
  }
  function showBrief() {
    if (!brief.current) return;
    brief.current.open = !brief.current.open;
    setBriefOpen(brief.current.open);
    if (brief.current.open) brief.current.querySelector("summary")?.focus();
  }

  const gap = phone ? 10 : 16;
  const available = width - gap * (count - 1);
  const expanded = phone ? width * .82 : available * 8 / (count + 7);
  const strip = phone ? 44 : available / (count + 7);
  const lefts: number[] = [];
  let total = 0;
  for (let index = 0; index < count; index++) { lefts.push(total); total += (index === active ? expanded : strip) + gap; }
  const offset = phone ? (width - expanded) / 2 - lefts[active] : 0;

  return <div className={s.root} data-industry-case-studies data-case-fan>
    <div ref={stage} className={s.stage} role="group" aria-label="Industry case studies" tabIndex={0} data-case-fan-stage
      onKeyDown={event => {
        const next = event.key === "ArrowRight" ? active + 1 : event.key === "ArrowLeft" ? active - 1 : event.key === "Home" ? 0 : event.key === "End" ? count - 1 : null;
        if (next === null) return;
        event.preventDefault(); select(next, true);
      }}>
      <div className={s.track} style={{ width: total - gap, transform: `translateX(${offset}px)` }}>
        {items.map((item, index) => {
          const selected = index === active;
          const panelId = `${groupId}-${index}`;
          return <article key={item.id} className={s.card} data-selected={selected} data-case-kind={item.kind} style={{ left: lefts[index], width: selected ? expanded : strip, "--case-copy-width": `${expanded - padding * 2}px` } as CSSProperties}>
            {item.cover}<span aria-hidden="true" className={s.scrim} />
            <button type="button" ref={element => { buttons.current[index] = element; }} className={s.selector} aria-label={`Select ${item.kind === "placeholder" ? "solution direction" : "case study"}: ${item.title}`} aria-expanded={selected} aria-controls={panelId} tabIndex={selected ? 0 : -1}
              onClick={() => select(index)} onFocus={event => { if (event.currentTarget.matches(":focus-visible")) select(index); }}>
              <span className={s.minimizedLabel} aria-hidden="true">{item.title}</span>
            </button>
            <div id={panelId} className={s.detail} data-case-detail inert={!selected} aria-hidden={!selected}>
              <div className={s.storyTop}>
                {item.identity && <div className={s.identity}>{item.identity}</div>}
                <h3>{item.title}</h3>
                <span className={s.state}>{item.kind === "published" ? "Published case study" : "Solution direction"}</span>
              </div>
              <div className={s.storyBottom}><p>{item.description}</p><span>{item.kind === "published" ? "Explore the project scope and decisions in its published dossier." : "Explore the workflow and intended outcome."}</span></div>
              {item.href ? <Link href={item.href} className={s.open} aria-label={`Read case study: ${item.title}`}><CaseFanArrow /></Link> : <button type="button" className={s.open} onClick={showBrief} aria-label={`View solution details: ${item.title}`} aria-controls={`${groupId}-brief`} aria-expanded={selected && briefOpen}><CaseFanArrow /></button>}
            </div>
          </article>;
        })}
      </div>
    </div>
    <div className={s.controls} aria-label="Case study controls" data-case-fan-controls>
      <button type="button" aria-label="Previous case study" onClick={() => select(active - 1)}><CaseFanArrow previous /></button>
      <p aria-live="polite"><span>{current.title}</span><span>{active + 1} of {count}</span></p>
      <button type="button" aria-label="Next case study" onClick={() => select(active + 1)}><CaseFanArrow /></button>
    </div>
    {current.brief && <details key={current.id} ref={brief} id={`${groupId}-brief`} className={s.brief} onToggle={event => setBriefOpen(event.currentTarget.open)}>
      <summary>Solution direction: {current.title}<CaseFanArrow /></summary>{current.brief}
    </details>}
    <noscript><style>{"[data-case-fan-stage],[data-case-fan-controls]{display:none}"}</style><ul className={s.staticList}>{items.map(item => <li key={item.id}>{item.href ? <Link href={item.href}>{item.title} - Read published case study</Link> : <><strong>{item.title} - Solution direction</strong>{item.brief}</>}</li>)}</ul></noscript>
  </div>;
}
