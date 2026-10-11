"use client";

import { useSyncExternalStore } from "react";
import styles from "./insights.module.css";

const subscribe = () => () => {};

export function PrintPreviewButton() {
  const ready = useSyncExternalStore(subscribe, () => true, () => false);
  return <div><button type="button" className={styles.printPreview} disabled={!ready} onClick={() => window.print()}>Print article preview<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M7 8V3h10v5M7 16H3V8h18v8h-4M7 13h10v8H7Z" /><path d="M17 11h1" /></svg></button><noscript><p className={styles.printSupport}>Use your browser’s Print command to save this preview.</p></noscript></div>;
}
