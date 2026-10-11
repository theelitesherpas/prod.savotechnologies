"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./logo-marquee.module.css";

// Supplied artwork only. Rendering these marks does not assert a client,
// certification or partnership relationship; no endorsement copy is added.
const LOGOS = [
  { file: "chevy-suburban", name: "Chevrolet Suburban", width: 176, height: 22 },
  { file: "dexef-erp-systems", name: "DEXEF ERP Systems", width: 128, height: 32 },
  { file: "dumont", name: "Dumont", width: 100, height: 52 },
  { file: "emcor", name: "EMCOR", width: 140, height: 36 },
  { file: "first-chiropractic-1", name: "First Chiropractic", width: 158, height: 38 },
  { file: "honda-11", name: "Honda", width: 80, height: 52 },
  { file: "shein-1", name: "SHEIN", width: 108, height: 28 },
  { file: "starwood-hotels-1", name: "Starwood Hotels & Resorts", width: 132, height: 48 },
  { file: "tp-link", name: "TP-Link", width: 154, height: 24 },
] as const;

export function LogoMarquee() {
  const stripRef = useRef<HTMLElement>(null);
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const strip = stripRef.current;
    if (!strip) return;
    let inView = false;
    const sync = () => setRunning(inView && !document.hidden);
    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting && entry.intersectionRatio >= 0.01;
      sync();
    }, { threshold: 0.01 });
    observer.observe(strip);
    document.addEventListener("visibilitychange", sync);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", sync);
    };
  }, []);

  return (
    <section
      ref={stripRef}
      aria-label="Brand logos"
      className={styles.strip}
      data-logo-strip
      data-running={running}
      data-paused={paused}
    >
      <div className={styles.viewport}>
        <div className={styles.track} data-logo-track>
          {[false, true].map((duplicate) => (
            <ul className={styles.group} key={String(duplicate)} aria-hidden={duplicate || undefined} data-copy={duplicate}>
              {LOGOS.map((logo) => (
                <li className={styles.logo} key={logo.file}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- local SVG vectors, explicitly sized; no raster optimization needed */}
                  <img
                    src={`/images/brand-logos/${logo.file}.svg`}
                    alt={duplicate ? "" : logo.name}
                    width={logo.width}
                    height={logo.height}
                    style={{ width: logo.width, height: logo.height }}
                    loading="eager"
                    decoding="async"
                  />
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
      <button
        type="button"
        className={styles.control}
        aria-label={paused ? "Resume logo animation" : "Pause logo animation"}
        aria-pressed={paused}
        title={paused ? "Resume animation" : "Pause animation"}
        onClick={() => setPaused((value) => !value)}
      >
        <svg viewBox="0 0 20 20" width="14" height="14" fill="currentColor" aria-hidden="true">
          {paused ? <path d="M6 4v12l10-6Z" /> : <><rect x="5" y="4" width="3" height="12" rx="0.5" /><rect x="12" y="4" width="3" height="12" rx="0.5" /></>}
        </svg>
      </button>
    </section>
  );
}
