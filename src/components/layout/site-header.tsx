"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { NAV_ITEMS } from "@/constants/site";
import { BrandMark } from "@/components/shared/brand-mark";
import { useEnquiry } from "@/components/shared/enquiry-dialog";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";

const FOCUSABLE =
  'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { open } = useEnquiry();
  const menuRef = useRef<HTMLDivElement | null>(null);
  const burgerRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const burger = burgerRef.current;
    if (menuOpen) {
      const sw = window.innerWidth - root.clientWidth;
      root.style.overflow = "hidden";
      if (sw > 0) root.style.paddingRight = `${sw}px`;
      track("nav_open");
      menuRef.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus();

      const onKey = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          setMenuOpen(false);
          return;
        }
        if (e.key === "Tab" && menuRef.current) {
          const items = Array.from(menuRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
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
  }, [menuOpen]);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-500 ease-[var(--ease-out-expo)]",
        scrolled || menuOpen
          ? "border-b border-border bg-[color-mix(in_oklab,var(--background)_84%,transparent)] backdrop-blur-md"
          : "border-b border-transparent",
      )}
    >
      <div className="shell flex h-[var(--nav-h)] items-center justify-between gap-6">
        <Link
          href="/"
          aria-label="SAVO Technologies — home"
          className="shrink-0"
          onClick={() => setMenuOpen(false)}
        >
          <BrandMark className="text-foreground" />
        </Link>

        {/* Desktop navigation */}
        <nav aria-label="Primary" className="hidden items-center gap-8 lg:flex">
          {NAV_ITEMS.map((item) =>
            item.ready ? (
              <Link
                key={item.label}
                href={item.href}
                className="link-underline t-sm font-medium text-foreground/80 hover:text-foreground"
                onClick={() => track("nav_link_click", { label: item.label })}
              >
                {item.label}
              </Link>
            ) : (
              <span
                key={item.label}
                aria-disabled="true"
                title="Coming soon"
                className="t-sm cursor-default font-medium text-muted/60"
              >
                {item.label}
              </span>
            ),
          )}
        </nav>

        <div className="flex items-center gap-3">
          <button
            onClick={() => open("header")}
            className="group/btn hidden h-10 items-center gap-2 rounded-[2px] bg-foreground px-5 text-sm font-semibold text-background transition-colors duration-300 ease-[var(--ease-out-expo)] hover:bg-accent hover:text-on-accent sm:inline-flex"
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
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen((v) => !v)}
          >
            <span className="relative block h-3 w-4" aria-hidden="true">
              <span
                className={cn(
                  "absolute left-0 top-0 h-px w-full bg-current transition-transform duration-300 ease-[var(--ease-out-expo)]",
                  menuOpen && "translate-y-[5.5px] rotate-45",
                )}
              />
              <span
                className={cn(
                  "absolute bottom-0 left-0 h-px w-full bg-current transition-transform duration-300 ease-[var(--ease-out-expo)]",
                  menuOpen && "-translate-y-[5.5px] -rotate-45",
                )}
              />
            </span>
          </button>
        </div>
      </div>

      {/* Mobile full-screen navigation */}
      <div
        id="mobile-menu"
        ref={menuRef}
        inert={!menuOpen}
        className={cn(
          "chapter-ink fixed inset-0 top-0 z-[-1] flex flex-col bg-background transition-[opacity,clip-path] duration-500 ease-[var(--ease-out-expo)] lg:hidden",
          menuOpen
            ? "pointer-events-auto opacity-100 [clip-path:inset(0_0_0%_0)]"
            : "pointer-events-none opacity-0 [clip-path:inset(0_0_100%_0)]",
        )}
      >
        <div className="shell flex h-[var(--nav-h)] items-center justify-between">
          <span className="t-label text-muted">Menu</span>
        </div>
        <nav aria-label="Mobile" className="shell flex flex-1 flex-col justify-center pb-16">
          <ul className="space-y-1">
            {NAV_ITEMS.map((item, i) => (
              <li
                key={item.label}
                style={{ transitionDelay: `${80 + i * 55}ms` }}
                className={cn(
                  "border-b border-border transition-[transform,opacity] duration-500 ease-[var(--ease-out-expo)]",
                  menuOpen ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
                )}
              >
                {item.ready ? (
                  <Link
                    href={item.href}
                    onClick={() => {
                      setMenuOpen(false);
                      track("nav_link_click", { label: item.label, mobile: true });
                    }}
                    className="group flex items-baseline gap-5 py-4"
                  >
                    <span className="t-label tnum text-accent">{String(i + 1).padStart(2, "0")}</span>
                    <span className="t-h2 transition-colors group-hover:text-accent">{item.label}</span>
                  </Link>
                ) : (
                  <span className="group flex items-baseline gap-5 py-4 opacity-50">
                    <span className="t-label tnum text-accent">{String(i + 1).padStart(2, "0")}</span>
                    <span className="t-h2">{item.label}</span>
                    <span className="t-caption ml-auto self-center text-muted">soon</span>
                  </span>
                )}
              </li>
            ))}
          </ul>
          <div
            style={{ transitionDelay: "440ms" }}
            className={cn(
              "mt-10 transition-[transform,opacity] duration-500 ease-[var(--ease-out-expo)]",
              menuOpen ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
            )}
          >
            <button
              onClick={() => {
                setMenuOpen(false);
                open("mobile-menu");
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
