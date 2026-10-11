"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { DialogLink } from "./dialog-link";
import { ChevronDownIcon } from "@/sections/home-v2/icons";
import styles from "./site-footer.module.css";

type FooterLink = { label: string; href: string; pro?: boolean; action?: "dialog" };

/** A visible desktop directory becomes native, keyboard-operable disclosures on phones. */
export function FooterColumn({ heading, links, label }: { heading: string; links: readonly FooterLink[]; label: string }) {
  const ref = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const query = window.matchMedia("(min-width: 768px)");
    const apply = () => {
      const details = ref.current;
      const summary = details?.querySelector("summary");
      if (!details || !summary) return;
      if (!query.matches && details.contains(document.activeElement)) summary.focus({ preventScroll: true });
      details.open = query.matches;
      summary.tabIndex = query.matches ? -1 : 0;
    };
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, []);

  return (
    <nav aria-label={label} className={styles.column}>
      <details ref={ref} open>
        <summary className={styles.columnSummary} onClick={(event) => { if (window.matchMedia("(min-width: 768px)").matches) event.preventDefault(); }}>
          <h3 className={styles.columnHeading}>{heading}</h3><ChevronDownIcon size={16} />
        </summary>
        <ul className={styles.linkList}>
          {links.map((link) => (
            <li key={link.label}>
              {link.action === "dialog" ? <DialogLink label={link.label} /> : (
                <Link href={link.href} className={styles.navLink}>{link.label}{link.pro ? <span className={styles.proBadge}>PRO</span> : null}</Link>
              )}
            </li>
          ))}
        </ul>
      </details>
    </nav>
  );
}
