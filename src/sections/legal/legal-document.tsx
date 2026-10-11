import Link from "next/link";
import { LEGAL_LINKS, SITE } from "@/constants/site";
import styles from "./legal-document.module.css";

export type LegalDocumentKind = "privacy" | "terms";
export type LegalSection = { title: string; body: string[] };

/**
 * THESIS: Legal text is a reading task, not a marketing landing page.
 * OWN-WORLD: Current Savo Outfit/Inter, white and light grey, restrained red navigation.
 * STORY: Choose a document, jump to a provision, read its unabridged text, contact Savo.
 * FIRST VIEWPORT: Document switcher, sticky contents left, moderate title and prose right.
 * FORM: Homepage-aligned reading rail; native mobile disclosure and fragment links, no new JS.
 * Preserve every legal paragraph, qualification, review note and existing metadata.
 */
export function legalSectionId(kind: LegalDocumentKind, title: string) {
  return `${kind}-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
}

function Contents({ kind, sections }: { kind: LegalDocumentKind; sections: LegalSection[] }) {
  return (
    <ul className={styles.contentsList}>
      {sections.map(section => <li key={section.title}><a href={`#${legalSectionId(kind, section.title)}`}>{section.title}</a></li>)}
    </ul>
  );
}

/** Link the original contact strings without rewriting any surrounding policy text. */
function ContactText({ text }: { text: string }) {
  const values = [SITE.email, SITE.phone];
  const pattern = values.map(value => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
  return text.split(new RegExp(`(${pattern})`, "g")).map((part, index) => {
    if (part === SITE.email) return <a key={index} href={`mailto:${SITE.email}`}>{part}</a>;
    if (part === SITE.phone) return <a key={index} href={`tel:${SITE.phoneE164}`}>{part}</a>;
    return part;
  });
}

function Arrow({ up = false }: { up?: boolean }) {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">{up ? <path d="M12 19V5m-6 6 6-6 6 6" /> : <path d="M5 12h14m-6-6 6 6-6 6" />}</svg>;
}

export function LegalDocument({ kind, title, lead, sections }: {
  kind: LegalDocumentKind;
  title: string;
  lead: string;
  sections: LegalSection[];
}) {
  const currentHref = kind === "privacy" ? "/privacy-policy" : "/terms-and-conditions";
  const related = LEGAL_LINKS.find(link => link.href !== currentHref)!;
  return (
    <section id={kind} aria-labelledby={`${kind}-heading`} className={styles.page} data-legal-document={kind}>
      <div className={styles.rail}>
        <nav aria-label="Legal documents" className={styles.documentNav}>
          {LEGAL_LINKS.map(link => <Link key={link.href} href={link.href} aria-current={link.href === currentHref ? "page" : undefined}>{link.label}</Link>)}
        </nav>
        <div className={styles.layout}>
          <aside className={styles.desktopContents}>
            <nav aria-labelledby={`${kind}-contents-heading`}>
              <h2 id={`${kind}-contents-heading`}>On this page</h2>
              <Contents kind={kind} sections={sections} />
            </nav>
          </aside>
          <div className={styles.reading}>
            <header className={styles.intro}>
              <h1 id={`${kind}-heading`} tabIndex={-1}>{title.endsWith(".") ? <>{title.slice(0, -1)}<span>.</span></> : title}</h1>
              <p>{lead}</p>
            </header>
            <details className={styles.mobileContents}>
              <summary>On this page<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg></summary>
              <nav aria-label="On this page"><Contents kind={kind} sections={sections} /></nav>
            </details>
            <div className={styles.chapters}>
              {sections.map(section => {
                const id = legalSectionId(kind, section.title);
                return (
                  <section id={id} key={section.title} aria-labelledby={`${id}-heading`} tabIndex={-1} className={styles.chapter} data-legal-chapter>
                    <h2 id={`${id}-heading`}>{section.title}</h2>
                    {section.body.map((paragraph, index) => <p key={index}><ContactText text={paragraph} /></p>)}
                  </section>
                );
              })}
            </div>
            <nav aria-label="Continue reading" className={styles.documentFooter}>
              <Link href={related.href}>{related.label}<Arrow /></Link>
              <a href={`#${kind}-heading`}>Back to top<Arrow up /></a>
            </nav>
          </div>
        </div>
      </div>
    </section>
  );
}
