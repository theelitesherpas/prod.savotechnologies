"use client";

import { useState } from "react";
import { CATEGORY_LABEL, CATEGORY_ORDER, type TemplateCategory } from "@/lib/mail/registry";
import { SavoLogo } from "@/components/shared/savo-logo";
import styles from "./email-design-review.module.css";

type Preview = {
  key: string;
  label: string;
  dept: "hello" | "hr";
  category: TemplateCategory;
  fires: string;
  subject: string;
  html: string;
  text: string;
};

/** Read-only sample gallery. Frames have no scripts, forms or navigation permissions. */
export function EmailDesignReview({ previews }: { previews: Preview[] }) {
  const [dept, setDept] = useState<"all" | "hello" | "hr">("all");
  const [key, setKey] = useState(previews.find(p => p.key === "clientWelcome")?.key ?? previews[0].key);
  const [width, setWidth] = useState<"desktop" | "mobile">("desktop");
  const [format, setFormat] = useState<"html" | "text">("html");
  const [appearance, setAppearance] = useState<"light" | "dark">("light");
  const pool = previews.filter(p => dept === "all" || p.dept === dept);
  const active = pool.find(p => p.key === key) ?? pool[0];
  const index = pool.indexOf(active);
  // Preview only: force the chosen palette without changing the actual email.
  // Real Gmail/Outlook auto-inversion still needs a physical inbox check.
  const previewHtml = active.html
    // srcDoc inherits this gallery's origin; avoid a stale configured dev port.
    .replace(/https?:\/\/[^/"'\s]+(\/(?:images\/email|fonts)\/)/g, "$1")
    .replace('@media (prefers-color-scheme:dark)', appearance === "dark" ? '@media all' : '@media not all')
    .replace('<html lang="en"', `<html lang="en" style="color-scheme:${appearance}"`);

  return (
    <main className={styles.review}>
      <div className={styles.rail}>
        <header className={styles.header}>
          <div className={styles.brand}><SavoLogo className={styles.logo} /><div><h1>Email design review</h1><p>Local preview. Sample data only. Nothing is sent or saved.</p></div></div>
          <a href="/admin/email-templates">Open admin templates <span aria-hidden="true">→</span></a>
        </header>
        <section aria-label="Choose an email" className={styles.tools}>
          <div><label htmlFor="review-dept">Department</label><select id="review-dept" value={dept} onChange={event => { setDept(event.target.value as typeof dept); setFormat("html"); }}><option value="all">All departments ({previews.length})</option><option value="hello">Client & team emails</option><option value="hr">Human Resources</option></select></div>
          <div><label htmlFor="review-template">Template</label><select id="review-template" value={active.key} onChange={event => { setKey(event.target.value); setFormat("html"); }}>{CATEGORY_ORDER.map(category => {
            const entries = pool.filter(p => p.category === category);
            return entries.length ? <optgroup label={CATEGORY_LABEL[category]} key={category}>{entries.map(p => <option value={p.key} key={p.key}>{p.label}</option>)}</optgroup> : null;
          })}</select></div>
          <div className={styles.previousNext}><button type="button" disabled={index === 0} onClick={() => setKey(pool[index - 1].key)} aria-label="Previous template">←</button><p aria-live="polite">{index + 1} of {pool.length}</p><button type="button" disabled={index === pool.length - 1} onClick={() => setKey(pool[index + 1].key)} aria-label="Next template">→</button></div>
        </section>
        <section aria-label="Email preview" className={styles.workspace}>
          <div className={styles.context}>
            <div><h2>{active.label}</h2><p className={styles.subject}><strong>Subject:</strong> {active.subject}</p><p>{active.dept === "hr" ? "hr@savotechnologies.com" : "hello@savotechnologies.com"} · {CATEGORY_LABEL[active.category]}</p></div>
            <div className={styles.controls}>
              <div role="group" aria-label="Preview size"><button type="button" aria-pressed={width === "desktop"} onClick={() => setWidth("desktop")}>Desktop</button><button type="button" aria-pressed={width === "mobile"} onClick={() => setWidth("mobile")}>Phone · 320px</button></div>
              <div role="group" aria-label="Inbox appearance"><button type="button" aria-pressed={appearance === "light"} onClick={() => setAppearance("light")}>Light</button><button type="button" aria-pressed={appearance === "dark"} onClick={() => setAppearance("dark")}>Dark</button></div>
              <div role="group" aria-label="Email format"><button type="button" aria-pressed={format === "html"} onClick={() => setFormat("html")}>Design</button><button type="button" aria-pressed={format === "text"} onClick={() => setFormat("text")}>Plain text</button></div>
            </div>
          </div>
          {format === "html" ? <div className={styles.previewCanvas}><iframe key={`${active.key}-${width}-${appearance}`} title={`${active.label} design preview`} sandbox="" srcDoc={previewHtml} className={styles.frame} style={{ maxWidth: width === "mobile" ? 320 : 640 }} /></div> : <pre className={styles.plain}>{active.text}</pre>}
          <p className={styles.note}>Sample content only; nothing is sent. Light/Dark previews show the authored email palettes, not a guarantee of inbox rendering. The logo has its own opaque backing so its contrast does not depend on the inbox background. Saved admin bodies inherit this same branding.</p>
        </section>
      </div>
    </main>
  );
}
