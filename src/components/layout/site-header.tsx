"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { usePathname } from "next/navigation";
import { HEADER_NAV, type NavItem, type NavLink } from "@/constants/navigation";
import { SavoLogo } from "@/components/shared/savo-logo";
import { useEnquiry } from "@/components/shared/enquiry-dialog";
import { MegaDrawer, NavigationLink, NavigationFeature, AiNavigationLinks, NAV_INTROS, MenuArrow, MenuChevron } from "./nav-panels";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import styles from "./site-header.module.css";
import menu from "./nav-panels.module.css";

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';
const panelId = (label: string) => `nav-panel-${label.replace(/\s+/g, "-").toLowerCase()}`;

export function SiteHeader({ nav = HEADER_NAV }: { nav?: NavItem[] }) {
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [openPanel, setOpenPanel] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileAcc, setMobileAcc] = useState<string | null>(null);
  const { open: openEnquiry } = useEnquiry();
  const pathname = usePathname();
  const isHome = pathname === "/";
  const isServiceDetail = /^\/services\/[^/]+\/?$/.test(pathname);
  const isAiPage = /^\/(?:ai-agents(?:\/[^/]+)?|ai\/[^/]+)\/?$/.test(pathname);
  const isHirePage = /^\/hire(?:\/[^/]+)?\/?$/.test(pathname);
  const isIndustryPage = /^\/industries(?:\/[^/]+)?\/?$/.test(pathname);
  const isLegalPage = /^\/(?:privacy-policy|terms-and-conditions)\/?$/.test(pathname);
  const isPinnedPage = /^\/services\/?$/.test(pathname) || isServiceDetail || isLegalPage || isAiPage || isHirePage || isIndustryPage || /^\/enterprise\/?$/.test(pathname) || /^\/careers(?:\/apply)?\/?$/.test(pathname) || /^\/insights(?:\/[^/]+)?\/?$/.test(pathname) || /^\/insights\/preview\/[^/]+\/?$/.test(pathname) || /^\/contact\/?$/.test(pathname) || /^\/case-studies(?:\/[^/]+|\/preview\/[^/]+)?\/?$/.test(pathname) || /^\/about\/?$/.test(pathname) || /^\/technology\/?$/.test(pathname) || /^\/trust\/?$/.test(pathname) || /^\/company-profile\/?$/.test(pathname) || /^\/start-a-project\/?$/.test(pathname) || /^\/locations\/indore\/?$/.test(pathname) || /^\/locations\/switzerland\/?$/.test(pathname) || /^\/meeting\/[^/]+\/?$/.test(pathname);
  const logoRef = useRef<HTMLAnchorElement>(null);
  const projectRef = useRef<HTMLAnchorElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const triggerRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const categoryRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const burgerRef = useRef<HTMLButtonElement>(null);
  const mobileRef = useRef<HTMLDivElement>(null);
  const mobileBodyRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLButtonElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const desktopFocus = useRef<{ label: string; last: boolean } | null>(null);
  const returnCategory = useRef<string | null>(null);
  const withChildren = nav.filter((n): n is NavItem & { children: NavLink[] } => !!n.children);
  const mobileItem = withChildren.find(item => item.label === mobileAcc);

  const [prevPath, setPrevPath] = useState(pathname);
  if (prevPath !== pathname) {
    setPrevPath(pathname);
    setOpenPanel(null);
    setMobileAcc(null);
    setMobileOpen(false);
  }

  useEffect(() => {
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 12);
      if (y > 120 && y > lastY + 1) setHidden(true);
      else if (y < lastY - 1 || y < 120) setHidden(false);
      lastY = y;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true, capture: true });
    return () => window.removeEventListener("scroll", onScroll, { capture: true });
  }, []);

  /* Preserve the approved hero's measured, header-anchored lighting. */
  useEffect(() => {
    if (!isHome) return;
    const hero = document.querySelector<HTMLElement>("[data-home-hero]");
    const logo = logoRef.current;
    const project = projectRef.current;
    if (!hero || !logo || !project) return;
    let disposed = false;
    const measure = () => {
      if (disposed) return;
      const origin = hero.getBoundingClientRect();
      for (const [name, element] of [["left", logo], ["right", project]] as const) {
        const bounds = element.getBoundingClientRect();
        hero.style.setProperty(`--hero-light-${name}-x`, `${bounds.left + bounds.width / 2 - origin.left}px`);
        hero.style.setProperty(`--hero-light-${name}-y`, `${bounds.height / 2 + element.offsetTop}px`);
      }
    };
    const observer = new ResizeObserver(measure);
    observer.observe(hero); observer.observe(logo); observer.observe(project);
    window.addEventListener("resize", measure, { passive: true });
    void document.fonts.ready.then(measure); measure();
    return () => {
      disposed = true; observer.disconnect(); window.removeEventListener("resize", measure);
      for (const side of ["left", "right"]) { hero.style.removeProperty(`--hero-light-${side}-x`); hero.style.removeProperty(`--hero-light-${side}-y`); }
    };
  }, [isHome]);

  const keepOpen = () => {
    if (closeTimer.current) { clearTimeout(closeTimer.current); closeTimer.current = null; }
  };
  const closePanels = () => { keepOpen(); setOpenPanel(null); };
  const closeMobile = () => { setMobileOpen(false); setMobileAcc(null); };
  const navigateToProject = (source: string) => {
    closePanels(); closeMobile();
    track("start_project_click", { location: source });
  };
  const closeSoon = (label: string) => {
    keepOpen();
    closeTimer.current = setTimeout(() => {
      if (document.getElementById(panelId(label))?.contains(document.activeElement)) return;
      setOpenPanel(cur => cur === label ? null : cur);
    }, 220);
  };
  useEffect(() => () => { if (closeTimer.current) clearTimeout(closeTimer.current); }, []);

  useEffect(() => {
    if (!openPanel) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (closeTimer.current) clearTimeout(closeTimer.current);
        setOpenPanel(null); triggerRefs.current[openPanel]?.focus();
      }
    };
    const onDown = (event: MouseEvent) => { if (!headerRef.current?.contains(event.target as Node)) setOpenPanel(null); };
    const onFocus = (event: FocusEvent) => { if (!headerRef.current?.contains(event.target as Node)) setOpenPanel(null); };
    document.addEventListener("keydown", onKey); document.addEventListener("mousedown", onDown); document.addEventListener("focusin", onFocus);
    return () => { document.removeEventListener("keydown", onKey); document.removeEventListener("mousedown", onDown); document.removeEventListener("focusin", onFocus); };
  }, [openPanel]);

  useEffect(() => {
    if (!mobileOpen) return;
    const burger = burgerRef.current;
    const root = document.documentElement;
    const previousOverflow = root.style.overflow, previousPadding = root.style.paddingRight;
    const sw = window.innerWidth - root.clientWidth;
    root.style.overflow = "hidden";
    if (sw > 0) root.style.paddingRight = `${sw}px`;
    const background = [document.querySelector<HTMLElement>("main"), document.querySelector<HTMLElement>("footer"), document.querySelector<HTMLElement>("[data-home-assistant]")].filter((el): el is HTMLElement => !!el).map(el => ({ el, inert: el.inert }));
    for (const {el} of background) el.inert = true;
    track("nav_open");
    mobileRef.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setMobileOpen(false); setMobileAcc(null); return; }
      if (event.key !== "Tab" || !headerRef.current) return;
      const items = Array.from(headerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(el => el.getClientRects().length && el.tabIndex >= 0 && !el.closest("[inert]"));
      const first = items[0], last = items.at(-1);
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey);
    const media = window.matchMedia("(min-width:1280px)");
    const resize = () => { if (media.matches) { setMobileOpen(false); setMobileAcc(null); } };
    media.addEventListener("change", resize);
    return () => {
      document.removeEventListener("keydown", onKey); media.removeEventListener("change", resize);
      root.style.overflow = previousOverflow; root.style.paddingRight = previousPadding;
      for (const {el,inert} of background) el.inert = inert;
      burger?.focus();
    };
  }, [mobileOpen]);

  useEffect(() => {
    const media = window.matchMedia("(min-width:1280px)");
    const resize = () => { if (!media.matches) setOpenPanel(null); };
    media.addEventListener("change", resize);
    return () => media.removeEventListener("change", resize);
  }, []);

  useLayoutEffect(() => {
    const intent = desktopFocus.current;
    if (!intent || intent.label !== openPanel) return;
    const links = document.getElementById(panelId(intent.label))?.querySelectorAll<HTMLAnchorElement>("a");
    (intent.last ? links?.item(links.length - 1) : links?.item(0))?.focus();
    desktopFocus.current = null;
  }, [openPanel]);

  useLayoutEffect(() => {
    if (!mobileOpen) return;
    mobileBodyRef.current?.scrollTo({ top:0 });
    if (mobileAcc) backRef.current?.focus();
    else if (returnCategory.current) {
      categoryRefs.current[returnCategory.current]?.focus();
      returnCategory.current = null;
    }
  }, [mobileAcc, mobileOpen]);

  const enterCategory = (label: string) => {
    returnCategory.current = label;
    setMobileAcc(label);
  };
  const leaveCategory = () => { setMobileAcc(null); };
  const triggerKey = (event: ReactKeyboardEvent<HTMLButtonElement>, label: string) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault(); keepOpen();
      const last = event.key === "ArrowUp";
      const panel = document.getElementById(panelId(label));
      if (panel) {
        const links = panel.querySelectorAll<HTMLAnchorElement>("a");
        (last ? links.item(links.length - 1) : links.item(0))?.focus();
      } else {
        desktopFocus.current = { label, last };
        setOpenPanel(label);
      }
    } else if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      const index = withChildren.findIndex(item => item.label === label);
      const next = withChildren[(index + (event.key === "ArrowRight" ? 1 : -1) + withChildren.length) % withChildren.length];
      keepOpen(); setOpenPanel(next.label); triggerRefs.current[next.label]?.focus();
    }
  };
  const isActive = (item: NavItem) => [item.href, ...(item.children?.map(child => child.href) ?? [])].some(href => {
    if (!href) return false;
    const p = pathname.replace(/\/$/, ""), h = href.replace(/\/$/, "");
    return p === h || (h !== "" && p.startsWith(h + "/"));
  });
  const mobileNavigate = (label: string) => { closeMobile(); track("nav_link_click", { label, mobile:true }); };

  return <header ref={headerRef} role={mobileOpen ? "dialog" : undefined} aria-modal={mobileOpen ? true : undefined} aria-label={mobileOpen ? "Site navigation" : undefined} className={cn(
    "fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,color,transform,box-shadow] duration-300",
    isHome && styles.home, isHome && (scrolled || openPanel || mobileOpen) && styles.solid,
    isPinnedPage && styles.service,
    (isServiceDetail || isIndustryPage) && !scrolled && !openPanel && !mobileOpen && styles.serviceHero,
    (openPanel || mobileOpen) && styles.menuActive,
    !isHome && !openPanel && !mobileOpen && (scrolled ? "border-b border-border bg-background/95 shadow-[0_1px_12px_rgb(0_0_0/0.06)]" : "border-b border-transparent bg-background/90"),
    hidden && !isPinnedPage && !mobileOpen && !openPanel && "-translate-y-full",
  )}>
    <div className={cn("shell relative z-10 flex h-[var(--nav-h)] items-center justify-between gap-6", styles.bar)}>
      <Link ref={logoRef} href="/" aria-label="Savo Technologies, home" onClick={() => { closePanels(); closeMobile(); }} className={cn("shrink-0 text-foreground", styles.logo)}><SavoLogo className="h-8 w-auto sm:h-9" /></Link>
      <nav aria-label="Primary" className="hidden items-center xl:flex"><ul className="flex items-center gap-1">{nav.map(item => <li key={item.label} onPointerEnter={item.children ? event => { if (event.pointerType === "mouse") { keepOpen(); setOpenPanel(item.label); } } : undefined} onPointerLeave={item.children ? () => closeSoon(item.label) : undefined}>
        {item.children ? <button ref={el => { triggerRefs.current[item.label] = el; }} className={cn("t-sm group flex min-h-11 items-center gap-1.5 px-3 font-medium transition-colors", isActive(item) || openPanel === item.label ? "text-accent" : "text-foreground/75 hover:text-accent")} aria-expanded={openPanel === item.label} aria-controls={openPanel === item.label ? panelId(item.label) : undefined} onKeyDown={event => triggerKey(event,item.label)} onClick={() => { keepOpen(); setOpenPanel(item.label); }}>
          {item.label}<svg aria-hidden="true" viewBox="0 0 12 12" className={cn("h-2.5 w-2.5 transition-transform duration-200", openPanel === item.label && "rotate-180")} fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2.5 4.5 6 8l3.5-3.5" /></svg>
        </button> : item.action === "dialog" ? <button onClick={() => { closePanels(); openEnquiry("nav-contact"); }} className="t-sm flex min-h-11 items-center px-3 font-medium text-foreground/75 hover:text-accent">{item.label}</button> : <Link href={item.href ?? "/"} prefetch={false} onClick={() => { closePanels(); track("nav_link_click", {label:item.label}); }} className={cn("t-sm flex min-h-11 items-center px-3 font-medium hover:text-accent", isActive(item) ? "text-accent" : "text-foreground/75")} aria-current={isActive(item) ? "page" : undefined}>{item.label}</Link>}
      </li>)}</ul></nav>
      <div className={cn("flex items-center gap-3",styles.actions)}>
        <Link ref={projectRef} href="/start-a-project" onClick={() => navigateToProject("header")} className={cn("group/btn inline-flex h-11 items-center gap-2 rounded-[2px] bg-foreground px-5 text-sm font-semibold text-background transition-colors hover:bg-accent hover:text-on-accent",styles.projectButton)}>Start a Project<MenuArrow /></Link>
        <button ref={burgerRef} className={cn("flex h-11 w-11 items-center justify-center border border-border xl:hidden",styles.menuButton)} aria-expanded={mobileOpen} aria-controls="mobile-menu" aria-label={mobileOpen ? "Close menu" : "Open menu"} onClick={() => { closePanels(); if (mobileOpen) closeMobile(); else { setMobileAcc(null); setMobileOpen(true); } }}>
          <span className="relative block h-3 w-4" aria-hidden="true"><span className={cn("absolute left-0 top-0 h-px w-full bg-current transition-transform duration-200",mobileOpen && "translate-y-[5.5px] rotate-45")} /><span className={cn("absolute bottom-0 left-0 h-px w-full bg-current transition-transform duration-200",mobileOpen && "-translate-y-[5.5px] -rotate-45")} /></span>
        </button>
      </div>
      <MegaDrawer items={withChildren} active={openPanel} panelIdOf={panelId} onNavigate={closePanels} onProject={() => navigateToProject("mega-menu")} onDismiss={() => { const label = openPanel; closePanels(); if (label) triggerRefs.current[label]?.focus(); }} onMouseEnter={keepOpen} onMouseLeave={() => openPanel && closeSoon(openPanel)} />
    </div>
    <div id="mobile-menu" ref={mobileRef} inert={!mobileOpen} aria-hidden={!mobileOpen} data-open={mobileOpen} className={menu.mobile}>
      <div aria-hidden="true" className={menu.mobileSpacer} />
      <div ref={mobileBodyRef} className={menu.mobileBody} data-lenis-prevent>
        <nav aria-label="Mobile">{mobileItem ? <>
          <button ref={backRef} type="button" className={menu.back} onClick={leaveCategory}><MenuArrow back />Back to navigation</button>
          <h2 className={menu.mobileTitle}>{mobileItem.label}</h2><p className={menu.mobileLead}>{NAV_INTROS[mobileItem.label]}</p>
          {mobileItem.label === "AI" ? <AiNavigationLinks links={mobileItem.children} mobile onNavigate={link => mobileNavigate(link.label)} /> : <ul>{mobileItem.children.map(link => <NavigationLink key={link.href} link={link} mobile onNavigate={() => mobileNavigate(link.label)} />)}</ul>}
          {mobileItem.href ? <Link href={mobileItem.href} className={menu.mobileOverview} onClick={() => mobileNavigate(mobileItem.label)}>All {mobileItem.label}<MenuArrow /></Link> : null}
          {mobileItem.feature ? <div className="mt-6"><NavigationFeature feature={mobileItem.feature} label={mobileItem.label} onNavigate={() => mobileNavigate(mobileItem.feature!.cta)} /></div> : null}
        </> : <>
          <h2 className={menu.mobileTitle}>What can we help you with?</h2>
          <ul className={menu.mobileChoices}>{nav.map(item => <li key={item.label}>
            {item.children ? <button ref={el => { categoryRefs.current[item.label] = el; }} type="button" className={menu.mobileChoice} onClick={() => enterCategory(item.label)}>{item.label}<MenuChevron /></button> : item.action === "dialog" ? <button className={menu.mobileChoice} onClick={() => { closeMobile(); openEnquiry("nav-contact"); }}>{item.label}<MenuArrow /></button> : <Link href={item.href ?? "/"} className={menu.mobileChoice} onClick={() => mobileNavigate(item.label)} aria-current={isActive(item) ? "page" : undefined}>{item.label}<MenuArrow /></Link>}
          </li>)}</ul>
        </>}</nav>
      </div>
      <div className={menu.mobileFooter}><Link href="/start-a-project" onClick={() => navigateToProject("mobile-menu")}>Start a Project<MenuArrow /></Link><p>A short brief is enough to get started.</p></div>
    </div>
  </header>;
}
