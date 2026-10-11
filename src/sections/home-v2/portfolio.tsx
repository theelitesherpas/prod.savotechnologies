"use client";

import Link from "next/link";
import Image from "next/image";
import { useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import styles from "./portfolio.module.css";
import { HOME_COPY } from "./homepage-copy";
import type { HomePortfolioFeatures } from "./portfolio-content";

/** Original exhibition shell, tabs and capability copy stay unchanged.
 * Each view shows one straight, frame-filling cover from its featured published case study.
 * No tilted mock interfaces or substitute projects for an empty discipline. */
const VIEWS = [
  { id: "web", label: "Web", title: "Websites and web applications", text: "Company sites, customer portals and online stores, designed around your users and the tasks they need to complete.", href: "/case-studies", tags: ["Websites", "Portals", "Online stores"] },
  { id: "mobile", label: "Mobile", title: "Apps for customers and teams", text: "iOS and Android products with the user journeys, integrations and offline features the job calls for.", href: "/case-studies", tags: ["iOS & Android", "Integrations", "Offline features"] },
  { id: "ai", label: "AI", title: "AI assistants for your business", text: "Search documents, work with approved tools and keep a person in control when a task needs judgement.", href: "/ai-agents", tags: ["Your information", "Approved tools", "Human oversight"] },
] as const;

function Arrow({ backward = false }: { backward?: boolean }) {
  return <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" style={backward ? { transform: "rotate(180deg)" } : undefined}><path d="M4 12h15m-6-6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function ViewIcon({ type }: { type: typeof VIEWS[number]["id"] }) {
  return <svg aria-hidden="true" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    {type === "web" ? <><rect x="3" y="4" width="18" height="15" rx="2" /><path d="M3 8h18M7 6h.01M10 6h.01" /></> : type === "mobile" ? <><rect x="6" y="2" width="12" height="20" rx="3" /><path d="M10 5h4M11 19h2" /></> : <><rect x="8" y="8" width="8" height="8" rx="2" /><path d="M12 2v6m0 8v6M2 12h6m8 0h6M5 5l3 3m8 8 3 3M19 5l-3 3M8 16l-3 3" /></>}
  </svg>;
}

export function PortfolioShowcase({ features = {} }: { features?: HomePortfolioFeatures }) {
  const [active, setActive] = useState(0);
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const gesture = useRef<{ x: number; y: number; id: number } | null>(null);
  const suppressClick = useRef(false);
  const selected = VIEWS[active];
  const feature = features[selected.id];

  function select(index: number, focus = false) {
    const next = (index + VIEWS.length) % VIEWS.length;
    setActive(next);
    if (focus) tabRefs.current[next]?.focus();
  }

  function onTabKey(e: KeyboardEvent<HTMLButtonElement>, index: number) {
    const next = e.key === "ArrowRight" ? index + 1 : e.key === "ArrowLeft" ? index - 1 : e.key === "Home" ? 0 : e.key === "End" ? VIEWS.length - 1 : null;
    if (next !== null) { e.preventDefault(); select(next, true); }
  }

  function endGesture(e: PointerEvent<HTMLDivElement>) {
    const start = gesture.current;
    gesture.current = null;
    if (!start || start.id !== e.pointerId) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (Math.abs(dx) > 55 && Math.abs(dy) < Math.abs(dx) * 0.65) {
      suppressClick.current = true;
      select(active + (dx < 0 ? 1 : -1));
    }
  }

  return <section className={styles.section} aria-labelledby="portfolio-heading" data-home-portfolio data-home-section="portfolio">
    <div className={styles.shell}>
      <div className={styles.heading}>
        <h2 id="portfolio-heading">{HOME_COPY.portfolio.title}</h2>
        <div className={styles.introduction}>
          <p>{HOME_COPY.portfolio.lead}</p>
          <Link href="/case-studies" className={styles.dossierLink}>View case studies <Arrow /></Link>
        </div>
      </div>
      <div className={styles.exhibition}>
        <div className={styles.gallery}>
          <div className={styles.tabs} role="tablist" aria-label="Product previews">
            {VIEWS.map((view, index) => <button key={view.id} ref={el => { tabRefs.current[index] = el; }} id={`portfolio-tab-${view.id}`} type="button" role="tab" aria-selected={index === active} aria-controls={`portfolio-panel-${view.id}`} tabIndex={index === active ? 0 : -1} onClick={() => select(index)} onKeyDown={e => onTabKey(e, index)} className={styles.tab}>
              <ViewIcon type={view.id} /><span>{view.label}</span>
            </button>)}
          </div>
          <figure className={styles.figure}>
            <div className={styles.scene} data-view={selected.id} onPointerDown={e => { suppressClick.current = false; if (e.pointerType === "touch") gesture.current = { x: e.clientX, y: e.clientY, id: e.pointerId }; }} onPointerUp={endGesture} onPointerCancel={() => { gesture.current = null; }} onClickCapture={e => { if (suppressClick.current) { suppressClick.current = false; if (e.detail > 0) { e.preventDefault(); e.stopPropagation(); } } }}>
              <div className={styles.stageLight} aria-hidden="true" />
              <div className={`${styles.coverFrame} ${selected.id === "mobile" ? styles.plainCover : ""}`} data-cover-frame={selected.id === "mobile" ? "plain" : "browser"}>
                {selected.id !== "mobile" && <div className={styles.browserBar} aria-hidden="true" data-browser-bar>
                  <span className={styles.browserDots}><span /><span /><span /></span>
                  <span className={styles.browserTitle}>{feature?.name ?? `${selected.label} project`}</span>
                </div>}
                <div className={styles.coverViewport}>
                  {feature ? <Link href={feature.href} className={styles.coverLink} aria-label={`View ${feature.name} case study`}>
                    {failedImage === feature.image.src ? <span className={styles.emptyCover}>The cover image couldn’t be loaded. Open the case study to explore the project.</span> : <Image key={feature.image.src} src={feature.image.src} alt={feature.image.alt} fill unoptimized sizes="(max-width: 799px) calc(100vw - 40px), (max-width: 1099px) calc(100vw - 354px), 896px" className={styles.coverImage} draggable={false} onError={() => setFailedImage(feature.image.src)} />}
                  </Link> : <div className={styles.emptyCover}>No featured {selected.label} case study is available.</div>}
                </div>
              </div>
            </div>
            <figcaption className={styles.artDisclosure}><Link href={feature?.href ?? `/case-studies?category=${selected.id}#work`}>{feature?.name ?? `View ${selected.label} case studies`}</Link></figcaption>
          </figure>
        </div>
        <div className={styles.editorial}>
          <div className={styles.panels}>
            {VIEWS.map((view, index) => <div key={view.id} id={`portfolio-panel-${view.id}`} role="tabpanel" aria-labelledby={`portfolio-tab-${view.id}`} tabIndex={0} hidden={index !== active} className={styles.panel}>
              <h3>{view.title}</h3>
              <p>{view.text}</p>
              <ul className={styles.attributes} aria-label={`${view.label} focus areas`}>{view.tags.map(tag => <li key={tag}>{tag}</li>)}</ul>
              <Link href={features[view.id]?.href ?? view.href} className={styles.exploreLink} aria-label={features[view.id] ? `Explore ${features[view.id]?.name} case study` : `Explore ${view.label.toLowerCase()} work`}>Explore <span><Arrow /></span></Link>
            </div>)}
          </div>
          <div className={styles.navigation}>
            <span className={styles.position} aria-live="polite" aria-atomic="true"><span className="sr-only">{selected.label} preview, </span>{String(active + 1).padStart(2, "0")} <span>/ 03</span></span>
            <div className={styles.arrows}>
              <button type="button" aria-label="Previous product preview" onClick={() => select(active - 1)}><Arrow backward /></button>
              <button type="button" aria-label="Next product preview" onClick={() => select(active + 1)}><Arrow /></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>;
}
