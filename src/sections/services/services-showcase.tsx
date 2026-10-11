"use client";

import { useState } from "react";
import Link from "next/link";
import { SERVICE_DETAILS } from "@/constants/services-detail";
import { ServiceArtwork, type ArtKind } from "./service-art";
import styles from "./services-directory.module.css";

const VIEWS: { label: string; slug: string; kind: ArtKind }[] = [
  { label: "Web platforms", slug: "web-development", kind: "website" },
  { label: "Mobile apps", slug: "mobile-app-development", kind: "phone" },
  { label: "AI workflows", slug: "ai-agent-development", kind: "workflow" },
];

/** Manual, accessible concept preview; service records still own every destination. */
export function ServicesShowcase() {
  const [selected, setSelected] = useState(0);
  const view = VIEWS[selected];
  const service = SERVICE_DETAILS.find(item => item.slug === view.slug)!;
  return (
    <div className={styles.showcase}>
      <div className={styles.viewControls} role="group" aria-label="Explore service concepts">
        {VIEWS.map((item, index) => <button key={item.slug} type="button" aria-pressed={selected === index} aria-controls="services-concept" onClick={() => setSelected(index)}>{item.label}</button>)}
      </div>
      <figure id="services-concept" className={styles.concept}>
        <div className={styles.conceptStage}><ServiceArtwork kind={view.kind} slug={view.slug} /></div>
        <figcaption>
          <span>Interface concept</span>
          <Link href={`/services/${service.slug}`}>Explore {service.title}<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M5 19 19 5M5 5h14v14" /></svg></Link>
        </figcaption>
      </figure>
    </div>
  );
}
