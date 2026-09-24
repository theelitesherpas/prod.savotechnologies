import Link from "next/link";
import { FOOTER_COLUMNS, LEGAL_LINKS, SITE, SOCIAL_LINKS } from "@/constants/site";
import { FooterCta } from "./footer-cta";

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="chapter-ink relative bg-background text-foreground" aria-labelledby="footer-heading">
      <h2 id="footer-heading" className="sr-only">
        Site footer
      </h2>
      <div className="shell pb-10 pt-20 sm:pt-24">
        {/* Brand row */}
        <div className="grid gap-14 border-b border-border pb-16 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <Link href="/" aria-label="SAVO Technologies — home" className="inline-block">
              <span className="block text-[clamp(3.5rem,9vw,7rem)] font-extrabold leading-[0.9] tracking-[-0.03em]">
                SAVO
              </span>
            </Link>
            <p className="t-body-lg mt-6 max-w-md text-muted">
              Designing and engineering digital products for ambitious businesses.
            </p>
            <p className="t-serif-italic mt-6 inline-flex items-center gap-3 text-[clamp(1.2rem,2vw,1.5rem)] text-foreground">
              <span aria-hidden="true" className="h-2 w-2 bg-accent" />
              {SITE.tagline}
            </p>
          </div>

          <div className="grid gap-10 sm:grid-cols-3 lg:col-span-6">
            {FOOTER_COLUMNS.map((col) => (
              <nav key={col.heading} aria-label={col.heading}>
                <p className="t-label mb-5 text-muted">{col.heading}</p>
                <ul className="space-y-3">
                  {col.links.map((link) => {
                    const ready = "ready" in link ? link.ready : true;
                    return (
                      <li key={link.label}>
                        {"ready" in link && !ready ? (
                          <span aria-disabled="true" title="Coming soon" className="t-sm text-muted/60">
                            {link.label}
                          </span>
                        ) : (
                          <Link
                            href={link.href}
                            className="link-underline t-sm text-foreground/75 hover:text-foreground"
                          >
                            {link.label}
                          </Link>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </nav>
            ))}

            <div>
              <p className="t-label mb-5 text-muted">Connect</p>
              <ul className="space-y-3">
                {SOCIAL_LINKS.map((s) => (
                  <li key={s.label}>
                    <span aria-disabled="true" title="Profile link pending" className="t-sm text-muted/60">
                      {s.label}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <FooterCta />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom row */}
        <div className="flex flex-col gap-4 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="t-caption text-muted tnum">
            © {year} SAVO Technologies. All rights reserved.
          </p>
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {LEGAL_LINKS.map((l) => (
              <li key={l.label}>
                <span aria-disabled="true" title="Coming soon" className="t-caption text-muted/70">
                  {l.label}
                </span>
              </li>
            ))}
          </ul>
          <p className="t-caption text-muted/60">Next.js · TypeScript · PostgreSQL</p>
        </div>
      </div>
    </footer>
  );
}
