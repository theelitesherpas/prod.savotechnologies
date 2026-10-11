"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavFeature, NavLink, NavItem } from "@/constants/navigation";
import { AI_LINKS, SERVICE_LINKS, HIRE_LINKS, INDUSTRY_LINKS } from "@/constants/navigation";
import styles from "./nav-panels.module.css";
import { AiGlyph } from "@/sections/ai/ai-art";

/**
 * THESIS: A useful capability catalogue, not a wall of indistinguishable links.
 * OWN-WORLD: Inherit Savo black/white/red, Outfit headings and Inter navigation.
 * STORY: Choose a discipline, understand its scope, follow the right destination.
 * FIRST VIEWPORT: Editorial introduction, two link columns, light feature rail;
 * one anchored action bar. Mobile drills into one category without losing Back.
 * FORM: Scoped navigation replacement inside the approved identity; no seed or
 * comp tournament. One 220ms drawer entrance, no stagger or animated height.
 * FINISH: Bounded captures, preserved-route checks and documented inline review.
 */

export const NAV_INTROS: Record<string, string> = {
  AI: "Find the right kind of AI work: a focused agent, a connected workflow, a product feature or a plan for what comes next.",
  Services: "From the first design decision to the systems behind your product. Find the discipline your project needs.",
  "Hire Developers": "Bring the right engineering skills into your team. Explore roles around the work you need to get done.",
  Industries: "Different industries work in different ways. Explore products and systems shaped around your sector.",
  "Who We Are": "Get to know Savo: the people behind the work, the services we offer and how to start a conversation.",
};

const canonical = (href: string) => href.replace(/\/$/, "");
const descriptions = new Map([...AI_LINKS, ...SERVICE_LINKS, ...HIRE_LINKS, ...INDUSTRY_LINKS].map(link => [canonical(link.href), link.desc]));

export function MenuArrow({ back = false }: { back?: boolean }) {
  return <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={back ? { transform: "rotate(180deg)" } : undefined}><path d="M4 12h15m-6-6 6 6-6 6" /></svg>;
}

export function MenuChevron() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="m9 5 7 7-7 7" /></svg>;
}

function MenuGlyph({ href }: { href: string }) {
  if (/^\/(?:ai-agents|ai\/)/.test(href)) return <AiGlyph kind={href} size={22} />;
  // Company destinations have their own pictograms, not the code-window fallback.
  const companyIcons: Record<string, React.ReactNode> = {
    "/about": <><circle cx="9" cy="8" r="3" /><path d="M3 21v-2a6 6 0 0 1 12 0v2M17 5a3 3 0 0 1 0 6m2 10v-2a5 5 0 0 0-2-4" /></>,
    "/services": <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
    "/enterprise": <><rect x="5" y="3" width="14" height="18" rx="1" /><path d="M3 21h18M9 7h1m4 0h1M9 11h1m4 0h1M10 21v-6h4v6" /></>,
    "/contact": <path d="M21 11a8 8 0 0 1-8 8H8l-5 3V7a4 4 0 0 1 4-4h6a8 8 0 0 1 8 8ZM7 8h10M7 12h7" />,
  };
  const companyIcon = companyIcons[canonical(href)];
  if (companyIcon) return <svg aria-hidden="true" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.45" strokeLinecap="round" strokeLinejoin="round">{companyIcon}</svg>;
  const paths = /mobile/.test(href) ? <><rect x="7" y="3" width="10" height="18" rx="2" /><path d="M10 17h4" /></> : /ai|machine-learning/.test(href) ? <><rect x="7" y="7" width="10" height="10" rx="2" /><path d="M9 3v4m6-4v4M9 17v4m6-4v4M3 9h4m-4 6h4m10-6h4m-4 6h4M10 10h4v4h-4z" /></> : /cloud|devops/.test(href) ? <><path d="M7 17H6a4 4 0 0 1-1-7.8 6 6 0 0 1 11.7-1.6A4.7 4.7 0 0 1 18 17h-1M12 13v8m-3-5 3-3 3 3" /></> : /design/.test(href) ? <><path d="m5 19 1-5L17 3l4 4-11 11-5 1Zm9-13 4 4M3 21h18" /></> : /data|analytics/.test(href) ? <><path d="M4 4v16h16M8 16V9m5 7V6m5 10v-5" /></> : /hire/.test(href) ? <><circle cx="9" cy="8" r="3" /><path d="M3 20v-2a6 6 0 0 1 12 0v2M17 5a3 3 0 0 1 0 6m2 9v-2a5 5 0 0 0-2-4" /></> : /healthcare/.test(href) ? <path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6V3Z" /> : /fintech/.test(href) ? <><path d="m3 8 9-5 9 5H3Zm0 13h18M5 11v7m7-7v7m7-7v7" /></> : /industries/.test(href) ? <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></> : /marketing/.test(href) ? <><path d="m4 14 5-5 4 3 7-8M15 4h5v5M4 20h16" /></> : <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 9h18m-12 4-2 2 2 2m6-4 2 2-2 2" /></>;
  return <svg aria-hidden="true" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.45" strokeLinecap="round" strokeLinejoin="round">{paths}</svg>;
}

export function NavigationLink({ link, onNavigate, mobile = false }: { link: NavLink; onNavigate: () => void; mobile?: boolean }) {
  const pathname = usePathname();
  const current = canonical(pathname) === canonical(link.href);
  const desc = link.desc || descriptions.get(canonical(link.href));
  return <li className={styles.linkItem}>
    <Link href={link.href} onClick={onNavigate} aria-current={current ? "page" : undefined} className={`${styles.link} ${mobile ? styles.mobileLink : ""}`}>
      <span className={styles.glyph}><MenuGlyph href={link.href} /></span>
      <span className={styles.linkText}><span className={styles.linkName}>{link.label}{link.pro ? <span className={styles.pro}>PRO</span> : null}</span>{desc ? <span className={styles.description}>{desc}</span> : null}</span>
      <span className={styles.linkArrow}><MenuArrow /></span>
    </Link>
  </li>;
}

function FeatureDiagram({ label }: { label: string }) {
  return <svg className={styles.featureArt} aria-hidden="true" viewBox="0 0 240 104" fill="none" stroke="currentColor" strokeWidth="1.2">
    {label === "AI" ? <><path d="M62 47h24m68 0h24" /><rect x="3" y="26" width="59" height="42" rx="5" /><rect x="86" y="26" width="68" height="42" rx="5" /><rect x="178" y="26" width="59" height="42" rx="5" /><g fill="currentColor" stroke="none" style={{fontFamily:"var(--font-sans)",fontSize:10}}><text x="32" y="50" textAnchor="middle">Sources</text><text x="120" y="50" textAnchor="middle">Prepare</text><text x="207" y="50" textAnchor="middle">Review</text></g><path d="m110 85 6 6 13-13" className={styles.diagramAccent}/></> : label === "Hire Developers" ? <><path d="M47 67h146m-73-35v35" /><rect x="94" y="8" width="52" height="24" rx="4" /><rect x="21" y="67" width="52" height="24" rx="4" /><rect x="94" y="67" width="52" height="24" rx="4" /><rect x="167" y="67" width="52" height="24" rx="4" /><path d="M34 79h25m48 0h26m47 0h26" className={styles.diagramAccent} /></> : label === "Industries" ? <><path d="M24 82h192M41 82V39h43v43m28 0V18h43v64m27 0V49h23v33" /><path d="M52 51h21m-21 12h21m50-32h21m-21 14h21m-21 14h21" className={styles.diagramAccent} /></> : <><rect x="24" y="16" width="136" height="75" rx="5" /><path d="M24 32h136m-121 13h59m-59 12h42m-42 12h51" /><rect x="120" y="47" width="31" height="27" rx="2" className={styles.diagramAccent} /><rect x="178" y="30" width="37" height="61" rx="5" /><path d="M189 81h14" className={styles.diagramAccent} /></>}
  </svg>;
}

export function NavigationFeature({ feature, label, onNavigate }: { feature: NavFeature; label: string; onNavigate: () => void }) {
  return <aside className={styles.feature}>
    <FeatureDiagram label={label} />
    <h3>{feature.title}</h3>
    <p>{feature.copy}</p>
    <Link href={feature.href} onClick={onNavigate} className={styles.featureLink}>{feature.cta}<MenuArrow /></Link>
  </aside>;
}

export function AiNavigationLinks({ links, onNavigate, mobile = false }: { links: NavLink[]; onNavigate: (link: NavLink) => void; mobile?: boolean }) {
  const planning = links.filter(link => /\/(?:consulting|machine-learning)\/?$/.test(link.href));
  const building = links.filter(link => !planning.includes(link));
  return <div className={`${styles.aiGroups} ${mobile ? styles.aiMobileGroups : ""}`}>
    {[{title:"Build & connect",links:building},{title:"Plan & analyse",links:planning}].filter(group => group.links.length).map(group => <section key={group.title} aria-label={group.title}><h3>{group.title}</h3><ul>{group.links.map(link => <NavigationLink key={link.href} link={link} mobile={mobile} onNavigate={() => onNavigate(link)} />)}</ul></section>)}
  </div>;
}

type MegaItem = NavItem & { children: NavLink[] };
export function MegaDrawer({ items, active, panelIdOf, onNavigate, onProject, onDismiss, onMouseEnter, onMouseLeave }: {
  items: MegaItem[]; active: string | null; panelIdOf: (label: string) => string;
  onNavigate: () => void; onProject: () => void; onDismiss: () => void;
  onMouseEnter: () => void; onMouseLeave: () => void;
}) {
  const item = items.find(i => i.label === active);
  if (!item) return null;
  return <>
    <button type="button" className={styles.backdrop} tabIndex={-1} aria-label="Dismiss navigation" onClick={onNavigate} />
    <div className={styles.mega} data-mega-drawer onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
      <section id={panelIdOf(item.label)} className={styles.panel} role="region" aria-labelledby={`${panelIdOf(item.label)}-title`}>
        <div className={styles.catalogue}>
          <div className={styles.intro}>
            <h2 id={`${panelIdOf(item.label)}-title`}>{item.label}</h2>
            <p>{NAV_INTROS[item.label] || `Explore ${item.label.toLowerCase()} and find the right starting point.`}</p>
            {item.href ? <Link href={item.href} onClick={onNavigate} className={styles.overview}>All {item.label}<MenuArrow /></Link> : null}
          </div>
          {item.label === "AI" ? <AiNavigationLinks links={item.children} onNavigate={onNavigate} /> : <ul className={styles.links} key={item.label}>{item.children.map(link => <NavigationLink key={link.href} link={link} onNavigate={onNavigate} />)}</ul>}
          {item.feature ? <NavigationFeature feature={item.feature} label={item.label} onNavigate={onNavigate} /> : null}
        </div>
      </section>
      <div className={styles.toolbar}>
        <p>Not sure where to start?</p><Link href="/start-a-project" onClick={onProject} className={styles.help}>Talk through your project<MenuArrow /></Link>
        <button type="button" className={styles.close} onClick={onDismiss} aria-label={`Close ${item.label} menu`}><span>Close</span><svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="m6 6 12 12M6 18 18 6" /></svg></button>
      </div>
    </div>
  </>;
}
