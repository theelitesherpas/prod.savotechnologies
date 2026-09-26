"use client";

import Link from "next/link";
import { useEffect } from "react";
import { report404 } from "@/lib/report";
import { SiteHeader } from "@/components/layout/site-header";
import { HEADER_NAV } from "@/constants/navigation";
import { SavoLogo } from "@/components/shared/savo-logo";
import { SOCIAL_LINKS } from "@/constants/site";

/**
 * Designed 404 fallback - full site chrome (header + footer) so visitors
 * can navigate anywhere. Auto-reports the 404 path to the admin Bug
 * Reports panel.
 */
export default function NotFound() {
  useEffect(() => {
    report404();
  }, []);

  return (
    <>
      <SiteHeader nav={HEADER_NAV} />

      <section className="chapter-ink flex min-h-[70svh] items-center bg-background text-foreground">
        <div className="shell py-20">
          <div className="mb-10 flex items-center gap-4">
            <span className="t-label tnum text-muted">404</span>
            <span aria-hidden="true" className="h-px flex-1 bg-border" />
            <span className="t-caption text-muted">Reported to our team</span>
          </div>
          <h1 className="t-statement max-w-[16ch]">
            This page is still in production
            <span aria-hidden="true" className="text-accent">.</span>
          </h1>
          <p className="t-body-lg mt-8 max-w-lg text-muted">
            The page you requested doesn&apos;t exist or is on the roadmap.
            The navigation above and the links below will get you anywhere
            on the site.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/"
              className="group/btn inline-flex h-[3.25rem] items-center gap-2.5 rounded-[2px] bg-foreground px-7 text-base font-semibold text-background transition-colors duration-300 ease-[var(--ease-out-expo)] hover:bg-accent hover:text-on-accent"
            >
              Back to the homepage
              <svg aria-hidden="true" viewBox="0 0 14 14" className="h-3 w-3 transition-transform duration-300 group-hover/btn:-translate-x-[3px]" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M13 7H2M6.5 2.5 2 7l4.5 4.5" />
              </svg>
            </Link>
            <Link
              href="/#start"
              className="inline-flex h-[3.25rem] items-center rounded-[2px] border border-foreground/30 px-7 text-base font-semibold transition-colors duration-300 hover:border-foreground hover:bg-foreground/[0.05]"
            >
              Start a Project
            </Link>
          </div>

          {/* Quick links */}
          <div className="mt-14 border-t border-border pt-8">
            <p className="t-label mb-4 text-muted">Popular pages</p>
            <div className="flex flex-wrap gap-x-8 gap-y-3">
              {[
                ["Services", "/services"],
                ["Industries", "/industries"],
                ["Case Studies", "/case-studies"],
                ["Insights", "/insights"],
                ["About", "/about"],
                ["Careers", "/careers"],
                ["Contact", "/contact"],
                ["Hire Developers", "/hire"],
                ["AI Agents", "/ai-agents"],
              ].map(([label, href]) => (
                <Link
                  key={href}
                  href={href}
                  className="t-sm font-medium text-foreground/70 transition-colors hover:text-accent"
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-surface">
        <div className="shell py-12">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <SavoLogo className="h-8 w-auto text-foreground" />
              <p className="t-caption mt-3 max-w-[24ch] text-muted">
                Savo Technologies - web, mobile, AI and custom software.
              </p>
            </div>
            <div>
              <p className="t-label mb-3 text-muted">Contact</p>
              <ul className="space-y-2 text-[0.875rem]">
                <li>
                  <a href="mailto:hello@savotechnologies.com" className="text-foreground/75 transition-colors hover:text-accent">
                    hello@savotechnologies.com
                  </a>
                </li>
                <li>
                  <a href="tel:+917502901234" className="text-foreground/75 transition-colors hover:text-accent">
                    +91 75029 01234
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <p className="t-label mb-3 text-muted">Portals</p>
              <ul className="space-y-2 text-[0.875rem]">
                <li>
                  <Link href="/portal" className="text-foreground/75 transition-colors hover:text-accent">Client Login</Link>
                </li>
                <li>
                  <Link href="/employee-portal" className="text-foreground/75 transition-colors hover:text-accent">Employee Login</Link>
                </li>
              </ul>
            </div>
            <div>
              <p className="t-label mb-3 text-muted">Follow</p>
              <ul className="space-y-2 text-[0.875rem]">
                {SOCIAL_LINKS.map((s) => (
                  <li key={s.label}>
                    <a href={s.href} target="_blank" rel="noopener noreferrer" className="text-foreground/75 transition-colors hover:text-accent">
                      {s.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <p className="t-caption mt-8 border-t border-border pt-6 text-muted">
            Savo Technologies Private Limited - Indore, India - Zurich, Switzerland
          </p>
        </div>
      </footer>
    </>
  );
}
