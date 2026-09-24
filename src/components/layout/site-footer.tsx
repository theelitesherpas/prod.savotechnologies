import Link from "next/link";
import { BADGES, LEGAL_LINKS, OFFICES, SITE, SOCIAL_LINKS } from "@/constants/site";
import { FOOTER_NAV } from "@/constants/navigation";
import { SavoLogo } from "@/components/shared/savo-logo";
import { CallbackForm } from "@/components/shared/callback-form";
import { DialogLink } from "./dialog-link";

type FooterLink = { label: string; href: string; pro?: boolean; action?: "dialog" };

function FooterColumn({ heading, links, label }: { heading: string; links: readonly FooterLink[]; label: string }) {
  return (
    <nav aria-label={label}>
      <p className="t-label mb-5 text-muted">{heading}</p>
      <ul className="space-y-2.5">
        {links.map((link) => (
          <li key={link.label}>
            {"action" in link && link.action === "dialog" ? (
              <DialogLink label={link.label} />
            ) : (
              <Link href={link.href} className="link-underline text-[0.875rem] text-foreground/75 transition-colors hover:text-foreground">
                {link.label}
                {link.pro ? (
                  <span className="t-caption ml-1.5 rounded-[2px] border border-accent/40 px-1 py-px text-accent">PRO</span>
                ) : null}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="chapter-ink bg-background text-foreground" aria-labelledby="footer-heading">
      <h2 id="footer-heading" className="sr-only">
        Site footer
      </h2>

      {/* Row 1 — brand + navigation columns */}
      <div className="shell grid gap-12 border-b border-border py-16 sm:py-20 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-4 lg:pr-8">
          <Link href="/" aria-label="SAVO Technologies — home" className="inline-block text-foreground">
            <SavoLogo className="h-12 w-auto" />
          </Link>
          <p className="t-sm mt-6 max-w-sm leading-relaxed text-muted">{SITE.statement}</p>
          <p className="t-serif-italic mt-5 inline-flex items-center gap-3 text-lg text-foreground">
            <span aria-hidden="true" className="h-2 w-2 bg-accent" />
            {SITE.tagline}
          </p>
          <ul className="mt-8 flex flex-wrap gap-2" aria-label="Social media">
            {SOCIAL_LINKS.map((s) => (
              <li key={s.label}>
                <a
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="t-label flex h-10 w-10 items-center justify-center border border-border text-muted transition-colors hover:border-accent hover:text-accent"
                  aria-label={s.label}
                >
                  <SocialGlyph label={s.label} />
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="grid gap-10 sm:grid-cols-2 lg:col-span-8 lg:grid-cols-4">
          <FooterColumn heading="Services" links={FOOTER_NAV.services} label="Footer services" />
          <FooterColumn heading="Industries" links={FOOTER_NAV.industries} label="Footer industries" />
          <FooterColumn heading="Company" links={FOOTER_NAV.company} label="Footer company" />
          <FooterColumn heading="Quick Links" links={FOOTER_NAV.quick} label="Footer quick links" />
        </div>
      </div>

      {/* Row 2 — global presence + direct contact */}
      <div className="shell grid gap-px border-b border-border bg-border sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {OFFICES.map((office) => (
          <div key={office.region} className="bg-background p-5">
            <p className="t-label text-accent">{office.region}</p>
            <p className="t-caption mt-2.5 leading-relaxed text-muted">
              {office.lines[0]}
              <br />
              {office.lines[1]}
            </p>
          </div>
        ))}
        <div className="bg-background p-5">
          <p className="t-label text-accent">Talk to us</p>
          <div className="mt-2.5 space-y-1.5">
            <a href={`mailto:${SITE.email}`} className="flex items-center gap-2 text-[0.875rem] font-medium text-foreground/85 transition-colors hover:text-accent">
              <MailGlyph />
              {SITE.email}
            </a>
            <a href={`tel:${SITE.phoneE164}`} className="flex items-center gap-2 text-[0.875rem] font-medium tnum text-foreground/85 transition-colors hover:text-accent">
              <PhoneGlyph />
              {SITE.phone}
            </a>
            <Link href="/portal/" className="flex items-center gap-2 text-[0.875rem] font-medium text-foreground/85 transition-colors hover:text-accent">
              <LockGlyph />
              Client Login
            </Link>
          </div>
        </div>
      </div>

      {/* Row 3 — call back */}
      <div className="shell grid gap-10 border-b border-border py-14 lg:grid-cols-12 lg:items-center">
        <div className="lg:col-span-4">
          <p className="t-h3">Prefer a call back?</p>
          <p className="t-sm mt-3 max-w-xs text-muted">
            Pick your country, leave your number and a senior consultant calls
            within two business hours.
          </p>
        </div>
        <div className="lg:col-span-8">
          <CallbackForm />
        </div>
      </div>

      {/* Row 4 — badges + legal */}
      <div className="shell flex flex-col gap-6 py-8 lg:flex-row lg:items-center lg:justify-between">
        <ul className="flex flex-wrap gap-x-7 gap-y-3" aria-label="Compliance and security">
          {BADGES.map((badge) => (
            <li key={badge} className="flex items-center gap-2 text-muted">
              <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.4">
                <path d="M10 2.2 17 5v5.2c0 4.2-2.9 6.8-7 8.3-4.1-1.5-7-4.1-7-8.3V5l7-2.8Z" />
                <path d="m7 10 2.1 2.1L13.4 7.7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="t-caption">{badge}</span>
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <p className="t-caption tnum text-muted">
            © {year} {SITE.legalName}. All Rights Reserved.
          </p>
          <ul className="flex gap-5">
            {LEGAL_LINKS.map((l) => (
              <li key={l.label}>
                <Link href={l.href} className="t-caption link-underline text-muted hover:text-foreground">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}

/* Small authored glyphs (consistent 1.5 stroke) */

function SocialGlyph({ label }: { label: string }) {
  const common = { width: 15, height: 15, viewBox: "0 0 20 20", "aria-hidden": true as const };
  switch (label) {
    case "LinkedIn":
      return (
        <svg {...common} fill="currentColor">
          <path d="M4.2 7.2v9H1.4v-9h2.8ZM4.4 4.6a1.6 1.6 0 1 1-3.2 0 1.6 1.6 0 0 1 3.2 0ZM15 9.1c-.4-1.3-1.5-2.1-3-2.1-1.1 0-1.9.5-2.4 1.2V7.2H6.9v9h2.8v-4.8c0-1.1.6-1.9 1.6-1.9.9 0 1.4.6 1.4 1.9v4.8H15.5v-5.3c0-1-.3-2-.5-2.6Z" />
        </svg>
      );
    case "X (Twitter)":
      return (
        <svg {...common} fill="currentColor">
          <path d="M13.9 3h2.7l-6 6.8L17.8 17h-5.5l-4.3-5.4L3 17H.3l6.4-7.3L1 3h5.6l3.9 5 3.4-5Zm-1 12.4h1.5L5.7 4.5H4.1l8.8 10.9Z" />
        </svg>
      );
    case "GitHub":
      return (
        <svg {...common} fill="currentColor">
          <path d="M10 1.7a8.3 8.3 0 0 0-2.6 16.2c.4.1.6-.2.6-.4v-1.5c-2.3.5-2.8-1-2.8-1-.4-1-.9-1.2-.9-1.2-.8-.5 0-.5 0-.5.8 0 1.3.9 1.3.9.7 1.3 2 1 2.4.7.1-.6.3-1 .5-1.2-1.9-.2-3.8-.9-3.8-4.1 0-.9.3-1.7.9-2.2-.1-.2-.4-1.1.1-2.2 0 0 .7-.2 2.3.9a7.8 7.8 0 0 1 4.2 0c1.6-1 2.3-.9 2.3-.9.5 1.1.2 2 .1 2.2.6.6.9 1.3.9 2.2 0 3.2-2 3.9-3.8 4.1.3.3.6.8.6 1.6v2.3c0 .2.2.5.6.4A8.3 8.3 0 0 0 10 1.7Z" />
        </svg>
      );
    case "Instagram":
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth="1.6">
          <rect x="2.6" y="2.6" width="14.8" height="14.8" rx="4.2" />
          <circle cx="10" cy="10" r="3.6" />
          <circle cx="14.6" cy="5.4" r=".9" fill="currentColor" stroke="none" />
        </svg>
      );
    case "YouTube":
      return (
        <svg {...common} fill="currentColor">
          <path d="M18.6 6.2a2.3 2.3 0 0 0-1.6-1.6C15.6 4.2 10 4.2 10 4.2s-5.6 0-7 .4A2.3 2.3 0 0 0 1.4 6.2 24 24 0 0 0 1 10c0 1.3.1 2.6.4 3.8a2.3 2.3 0 0 0 1.6 1.6c1.4.4 7 .4 7 .4s5.6 0 7-.4a2.3 2.3 0 0 0 1.6-1.6c.3-1.2.4-2.5.4-3.8 0-1.3-.1-2.6-.4-3.8ZM8.1 12.8V7.2L13.2 10l-5.1 2.8Z" />
        </svg>
      );
    default:
      return null;
  }
}

function MailGlyph() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0 text-muted" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3.5" y="5.5" width="17" height="13" rx="2.2" />
      <path d="m4.5 7.5 7.5 5.5 7.5-5.5" />
    </svg>
  );
}

function PhoneGlyph() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0 text-muted" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6.8 3.8 9 3.2c.7-.2 1.4.2 1.7.9l1 2.4c.2.6.1 1.3-.4 1.7l-1.3 1.2a12.6 12.6 0 0 0 4.6 4.6l1.2-1.3c.4-.5 1.1-.6 1.7-.4l2.4 1c.7.3 1.1 1 .9 1.7l-.6 2.2c-.2.7-.8 1.2-1.5 1.2C11.6 18.4 5.6 12.4 5.6 5.3c0-.7.5-1.3 1.2-1.5Z" />
    </svg>
  );
}

function LockGlyph() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0 text-muted" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="10.5" width="14" height="9.5" rx="2" />
      <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" />
    </svg>
  );
}
