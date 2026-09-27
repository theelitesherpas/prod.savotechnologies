"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { HEADER_NAV, type NavItem, type NavLink } from "@/constants/navigation";
import { SavoLogo } from "@/components/shared/savo-logo";
import { useEnquiry } from "@/components/shared/enquiry-dialog";
import { MegaBar } from "./nav-panels";
import { track } from "@/lib/analytics";
import { cn, withBasePath } from "@/lib/utils";

const FOCUSABLE =
  'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

const panelId = (label: string) => `nav-panel-${label.replace(/\s+/g, "-").toLowerCase()}`;

export function SiteHeader({ nav = HEADER_NAV }: { nav?: NavItem[] }) {
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [openPanel, setOpenPanel] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileAcc, setMobileAcc] = useState<string | null>(null);
  const { open: openEnquiry } = useEnquiry();
  const pathname = usePathname();

  const headerRef = useRef<HTMLElement | null>(null);
  const triggerRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const burgerRef = useRef<HTMLButtonElement | null>(null);
  const mobileRef = useRef<HTMLDivElement | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* Navigation closes the mega panel and the drawer - the visitor has
     chosen a destination; hovering the menu again reopens it. */
  useEffect(() => {
    setOpenPanel(null);
    setMobileAcc(null);
  }, [pathname]);

  /* Scroll state */
  useEffect(() => {
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 12);
      // hide on scroll-down (past 120px), show on scroll-up
      if (y > 120 && y > lastY + 1) setHidden(true);
      else if (y < lastY - 1 || y < 120) setHidden(false);
      lastY = y;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true, capture: true });
    return () => window.removeEventListener("scroll", onScroll, { capture: true });
  }, []);

  /* Desktop panel dismissal: Esc + outside click, focus return */
  useEffect(() => {
    if (!openPanel) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        const label = openPanel;
        setOpenPanel(null);
        triggerRefs.current[label]?.focus();
      }
    };
    const onDown = (e: MouseEvent) => {
      if (!headerRef.current?.contains(e.target as Node)) setOpenPanel(null);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
    };
  }, [openPanel]);

  /* Mobile menu: scroll lock + focus trap */
  useEffect(() => {
    const root = document.documentElement;
    const burger = burgerRef.current;
    if (mobileOpen) {
      const sw = window.innerWidth - root.clientWidth;
      root.style.overflow = "hidden";
      if (sw > 0) root.style.paddingRight = `${sw}px`;
      track("nav_open");
      mobileRef.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus();

      const onKey = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          setMobileOpen(false);
          return;
        }
        if (e.key === "Tab" && mobileRef.current) {
          const items = Array.from(mobileRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
          if (!items.length) return;
          const first = items[0];
          const last = items[items.length - 1];
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      };
      document.addEventListener("keydown", onKey);
      return () => {
        document.removeEventListener("keydown", onKey);
        root.style.overflow = "";
        root.style.paddingRight = "";
        burger?.focus();
      };
    }
  }, [mobileOpen]);

  /* Hover grace timer - diagonal moves between trigger and panel never close */
  const keepOpen = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };
  const closeSoon = (label: string) => {
    keepOpen();
    closeTimer.current = setTimeout(() => {
      setOpenPanel((cur) => (cur === label ? null : cur));
    }, 160);
  };
  useEffect(() => keepOpen, []);

  const withChildren = nav.filter((n): n is NavItem & { children: NavLink[] } => !!n.children);

  const activate = (item: NavItem) => {
    if (item.action === "dialog") {
      setOpenPanel(null);
      openEnquiry("nav-contact");
      return;
    }
    if (item.children) {
      setOpenPanel((cur) => (cur === item.label ? null : item.label));
      return;
    }
    setOpenPanel(null);
    track("nav_link_click", { label: item.label });
  };

  /* Active-route highlighting: a nav item is active when the current
     path starts with its href (so /services/web-development lights
     "Services"). Mega-menu items match their section root; plain links
     match exactly or by prefix. */
  const isActive = (item: NavItem) => {
    if (!item.href) return false;
    const p = pathname.replace(/\/$/, "");
    const h = item.href.replace(/\/$/, "");
    if (h === "" || h === "/") return p === "/";
    if (p === h || p.startsWith(h + "/")) return true;
    // Mega-menu sections own multiple route prefixes (AI: /ai-agents + /ai/*)
    if (item.children) {
      return item.children.some((child) => {
        const ch = child.href.replace(/\/$/, "");
        return p === ch || p.startsWith(ch + "/");
      });
    }
    return false;
  };

  return (
    <header
      ref={headerRef}
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,color,transform,box-shadow] duration-500 ease-[var(--ease-out-expo)]",
        mobileOpen && "chapter-ink border-b border-border bg-background text-foreground",
        !mobileOpen &&
          (scrolled || openPanel
            ? "border-b border-border bg-background/85 backdrop-blur-md shadow-[0_1px_12px_rgb(10_10_14/0.06)]"
            : "border-b border-transparent bg-background/60 backdrop-blur-sm"),
        hidden && !mobileOpen && !openPanel && "-translate-y-full",
      )}
    >
      {/* Bar stays above the open menu (burger must stay reachable) */}
      <div className="shell relative z-10 flex h-[var(--nav-h)] items-center justify-between gap-6">
        <Link href="/" aria-label="Savo Technologies, home" className="shrink-0 text-foreground">
          <SavoLogo className="h-8 w-auto sm:h-9" />
        </Link>

        {/* Desktop navigation (version-1 architecture) */}
        <nav aria-label="Primary" className="hidden items-center lg:flex">
          <ul className="flex items-center gap-1">
            {nav.map((item) =>
              item.children ? (
                <li
                  key={item.label}
                  onMouseEnter={() => {
                    keepOpen();
                    setOpenPanel(item.label);
                  }}
                  onMouseLeave={() => closeSoon(item.label)}
                >
                  <button
                    ref={(el) => {
                      triggerRefs.current[item.label] = el;
                    }}
                    className={cn(
                      "t-sm group flex items-center gap-1.5 px-3 py-2 font-medium transition-colors",
                      isActive(item) || openPanel === item.label
                        ? "text-accent"
                        : "text-foreground/75 hover:text-accent",
                    )}
                    aria-expanded={openPanel === item.label}
                    aria-controls={panelId(item.label)}
                    /* Hover opens before the click lands, so a toggle here would
                       close the panel it just opened, click opens; Esc, outside
                       click and hover-leave close. */
                    onClick={() => setOpenPanel(item.label)}
                  >
                    {item.label}
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 12 12"
                      className={cn(
                        "h-2.5 w-2.5 transition-transform duration-300",
                        openPanel === item.label && "rotate-180",
                      )}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <path d="M2.5 4.5 6 8l3.5-3.5" />
                    </svg>
                  </button>
                </li>
              ) : item.action === "dialog" ? (
                <li key={item.label}>
                  <button
                    onClick={() => activate(item)}
                    className="t-sm px-3 py-2 font-medium text-foreground/75 transition-colors duration-300 hover:text-accent"
                  >
                    {item.label}
                  </button>
                </li>
              ) : (
                <li key={item.label}>
                  <Link
                    href={item.href ?? "/"}
                    /* Plain top-level links skip prefetch - future routes
                       (careers) would prefetch a 404 and log console noise. */
                    prefetch={false}
                    onClick={() => track("nav_link_click", { label: item.label })}
                    className={cn(
                      "t-sm px-3 py-2 font-medium transition-colors duration-300 hover:text-accent",
                      isActive(item) ? "text-accent" : "text-foreground/75",
                    )}
                    aria-current={isActive(item) ? "page" : undefined}
                  >
                    {item.label}
                  </Link>
                </li>
              ),
            )}
          </ul>
        </nav>

        <div className="flex items-center gap-3">
          <button
            onClick={() => openEnquiry("header")}
            className="group/btn hidden h-10 items-center gap-2 rounded-[2px] bg-foreground px-5 text-sm font-semibold text-background transition-colors duration-300 ease-[var(--ease-out-expo)] hover:bg-accent hover:text-on-accent lg:inline-flex"
          >
            Start a Project
            <svg aria-hidden="true" viewBox="0 0 14 14" className="h-3 w-3 transition-transform duration-300 group-hover/btn:translate-x-[3px]" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M1 7h11M7.5 2.5 12 7l-4.5 4.5" />
            </svg>
          </button>

          {/* Mobile trigger */}
          <button
            ref={burgerRef}
            className="flex h-10 w-10 items-center justify-center border border-border lg:hidden"
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            onClick={() => setMobileOpen((v) => !v)}
          >
            <span className="relative block h-3 w-4" aria-hidden="true">
              <span
                className={cn(
                  "absolute left-0 top-0 h-px w-full bg-current transition-transform duration-300 ease-[var(--ease-out-expo)]",
                  mobileOpen && "translate-y-[5.5px] rotate-45",
                )}
              />
              <span
                className={cn(
                  "absolute bottom-0 left-0 h-px w-full bg-current transition-transform duration-300 ease-[var(--ease-out-expo)]",
                  mobileOpen && "-translate-y-[5.5px] -rotate-45",
                )}
              />
            </span>
          </button>
        </div>

        {/* Desktop mega bars */}
        {withChildren.map((item, i) => (
          <div
            key={item.label}
            onMouseEnter={keepOpen}
            onMouseLeave={() => closeSoon(item.label)}
            className={cn(
              "absolute inset-x-0 top-full hidden",
              openPanel === item.label ? "lg:block" : "lg:hidden",
            )}
          >
            <MegaBar
              onNavigate={() => {
                keepOpen();
                setOpenPanel(null);
              }}
              id={panelId(item.label)}
              label={item.label === "AI" ? "AI Services" : item.label}
              links={item.children}
              allLabel={item.href && item.label !== "AI" ? `All ${item.label}` : undefined}
              allHref={item.href && item.label !== "AI" ? item.href : undefined}
              feature={item.feature}
              featureVariant={i}
              twoCols={item.children.length > 6}
            />
          </div>
        ))}
      </div>

      {/* Mobile full-screen navigation */}
      <div
        id="mobile-menu"
        ref={mobileRef}
        inert={!mobileOpen}
        className={cn(
          // h-[100dvh] + explicit edges: robust even under a filtered ancestor.
          // text-foreground: the ink chapter redefines the color tokens, and the
          // labels below inherit - without this the menu renders dark-on-dark.
          "chapter-ink fixed left-0 top-0 z-0 flex h-[100dvh] w-full flex-col overflow-y-auto bg-background text-foreground transition-[opacity,clip-path] duration-500 ease-[var(--ease-out-expo)] lg:hidden",
          mobileOpen
            ? "pointer-events-auto opacity-100 [clip-path:inset(0_0_0%_0)]"
            : "pointer-events-none opacity-0 [clip-path:inset(0_0_100%_0)]",
        )}
      >
        {/* Spacer for the fixed bar (logo + burger live above the overlay -
            a label here would sit right behind the logo) */}
        <div aria-hidden="true" className="h-[var(--nav-h)] shrink-0" />
        <nav aria-label="Mobile" className="shell flex-1 pb-10">
          <ul>
            {nav.map((item, i) => (
              <li
                key={item.label}
                style={{ transitionDelay: `${80 + i * 45}ms` }}
                className={cn(
                  "scroll-mt-[calc(var(--nav-h)+1rem)] border-b border-border transition-[transform,opacity] duration-500 ease-[var(--ease-out-expo)]",
                  mobileOpen ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
                )}
              >
                {item.children ? (
                  <div>
                    <button
                      className="group flex w-full items-center gap-4 py-4 text-left"
                      aria-expanded={mobileAcc === item.label}
                      aria-controls={`acc-${panelId(item.label)}`}
                      onClick={() => setMobileAcc((cur) => (cur === item.label ? null : item.label))}
                    >
                      <span className="t-h2 flex-1">{item.label}</span>
                      <span
                        aria-hidden="true"
                        className={cn(
                          "relative h-3 w-3 self-center transition-transform duration-500 ease-[var(--ease-out-expo)]",
                          mobileAcc === item.label && "rotate-45",
                        )}
                      >
                        <span className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-current" />
                        <span className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-current" />
                      </span>
                    </button>
                    <div
                      id={`acc-${panelId(item.label)}`}
                      className={cn(
                        "grid transition-[grid-template-rows] duration-500 ease-[var(--ease-out-expo)]",
                        mobileAcc === item.label ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                      )}
                    >
                      <div className="overflow-hidden">
                        <ul className="pb-4 pl-5">
                          {item.children.map((link) => (
                            <li key={link.href}>
                              <Link
                                href={link.href}
                                onClick={() => {
                                  setMobileOpen(false);
                                  track("nav_link_click", { label: link.label, mobile: true });
                                }}
                                className="group/m flex items-center gap-2.5 py-2 text-sm font-medium text-foreground/70 transition-colors hover:text-foreground"
                              >
                                <span
                                  aria-hidden="true"
                                  className="h-1.5 w-1.5 shrink-0 scale-0 bg-accent transition-transform duration-300 ease-[var(--ease-out-expo)] group-hover/m:scale-100"
                                />
                                {link.label}
                                {link.pro ? (
                                  <span className="t-label rounded-[2px] border border-accent/40 px-1.5 py-0.5 text-accent-strong">PRO</span>
                                ) : null}
                              </Link>
                            </li>
                          ))}
                          {item.href && item.label !== "AI" ? (
                            <li>
                              <Link
                                href={item.href}
                                onClick={() => setMobileOpen(false)}
                                className="t-label py-2 text-accent-strong"
                              >
                                All {item.label} →
                              </Link>
                            </li>
                          ) : null}
                        </ul>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button
                    className="group flex w-full items-center gap-4 py-4 text-left"
                    onClick={() => {
                      if (item.action === "dialog") {
                        setMobileOpen(false);
                        openEnquiry("nav-contact");
                      } else {
                        setMobileOpen(false);
                        track("nav_link_click", { label: item.label, mobile: true });
                        window.location.hash = item.href?.startsWith("/#") ? item.href.slice(1) : "";
                        if (!item.href?.startsWith("/#") && item.href) window.location.href = withBasePath(item.href);
                      }
                    }}
                  >
                    <span className="t-h2">{item.label}</span>
                  </button>
                )}
              </li>
            ))}
          </ul>
          <div
            style={{ transitionDelay: "420ms" }}
            className={cn(
              "mt-8 transition-[transform,opacity] duration-500 ease-[var(--ease-out-expo)]",
              mobileOpen ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
            )}
          >
            <button
              onClick={() => {
                setMobileOpen(false);
                openEnquiry("mobile-menu");
              }}
              className="group/btn inline-flex h-[3.25rem] w-full items-center justify-center gap-2.5 rounded-[2px] bg-accent px-7 text-base font-semibold text-on-accent transition-colors duration-300 hover:bg-accent-hover"
            >
              Start a Project
              <svg aria-hidden="true" viewBox="0 0 14 14" className="h-3 w-3 transition-transform duration-300 group-hover/btn:translate-x-[3px]" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M1 7h11M7.5 2.5 12 7l-4.5 4.5" />
              </svg>
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
}
