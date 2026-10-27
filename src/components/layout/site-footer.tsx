import Link from "next/link";
import { BADGES, LEGAL_LINKS, OFFICES, PRESENCE_LABEL, SITE, SOCIAL_LINKS } from "@/constants/site";
import { FOOTER_NAV } from "@/constants/navigation";
import { SavoLogo } from "@/components/shared/savo-logo";
import { RegionArt } from "@/components/shared/region-art";
import { CallbackForm } from "@/components/shared/callback-form";
import { FooterColumn } from "./footer-nav";
import styles from "./site-footer.module.css";

/**
 * Footer direction: a cinematic closing chapter in the homepage's existing
 * black / warm-red world. Brand + callback lead, then a five-column directory,
 * distinct office / market details, and an understated official Savo signature.
 * All navigation, managed contact details, badges and callback behavior remain.
 */
export function SiteFooter({
  contact,
}: {
  contact: { email: string; phone: string; phoneE164: string };
}) {
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer} aria-labelledby="footer-heading">
      <h2 id="footer-heading" className="sr-only">Site footer</h2>
      <div className={`shell ${styles.content}`}>
        <div className={styles.opening}>
          <div className={styles.brand}>
            <Link href="/" aria-label="Savo Technologies, home" className={styles.brandLink}>
              <SavoLogo className="h-12 w-auto" />
            </Link>
            <p className={styles.tagline}>{SITE.tagline}</p>
            <p className={styles.statement}>Savo Technologies brings product strategy, design and engineering together. From websites and mobile apps to AI and internal tools, we focus on the people using the product and the business behind it.</p>
            <ul className={styles.socials} aria-label="Social media">
              {SOCIAL_LINKS.map((s) => (
                <li key={s.label}>
                  <a href={s.href} target="_blank" rel="noopener noreferrer" className={styles.socialLink} aria-label={s.label}>
                    <SocialGlyph label={s.label} />
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <section className={styles.callbackPanel} aria-labelledby="footer-callback-heading">
            <h3 id="footer-callback-heading">Prefer a call about your project?</h3>
            <p className={styles.callbackCopy}>
              Leave your number and country, and we’ll call to discuss your project.
            </p>
            <p className={styles.callbackNote}>
              For careers, visit our <Link href="/careers" className={styles.callbackNoteLink}>Careers page</Link>.
            </p>
            <CallbackForm />
          </section>
        </div>

        <section className={styles.contactRibbon} aria-labelledby="footer-contact-heading">
          <h3 id="footer-contact-heading">Talk to us</h3>
          <a href={`mailto:${contact.email}`} className={styles.directContact}>
            <MailGlyph /><span>{contact.email}</span>
          </a>
          <a href={`tel:${contact.phoneE164}`} className={styles.directContact}>
            <PhoneGlyph /><span className="tnum">{contact.phone}</span>
          </a>
          <Link href="/portal" className={styles.portalLink}>
            <LockGlyph />Client Login
            <svg aria-hidden="true" viewBox="0 0 14 14" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M1 7h11M7.5 2.5 12 7l-4.5 4.5" />
            </svg>
          </Link>
        </section>

        <div className={styles.directory}>
          <FooterColumn heading="Services" links={FOOTER_NAV.services} label="Footer services" />
          <FooterColumn heading="Industries" links={FOOTER_NAV.industries} label="Footer industries" />
          <FooterColumn heading="Company" links={FOOTER_NAV.company} label="Footer company" />
          <FooterColumn heading="Enterprise" links={FOOTER_NAV.enterprise} label="Footer enterprise" />
          <FooterColumn heading="Quick Links" links={FOOTER_NAV.quick} label="Footer quick links" />
        </div>

        <section className={styles.presence} aria-labelledby="footer-presence-heading">
          <h3 id="footer-presence-heading" className={styles.sectionHeading}>Our global presence</h3>
          <div className={styles.officeGrid}>
            {OFFICES.map((office) => (
              <div key={office.id} className={styles.office}>
                <div className={styles.officeIdentity}>
                  <RegionArt id={office.id} className={styles.regionArt} />
                  <div>
                    <h4 className={styles.regionName}>{office.region}</h4>
                    <p className={styles.presenceKind}>{PRESENCE_LABEL[office.kind]}</p>
                  </div>
                </div>
                <p className={styles.officeDetail}>{office.addressLine || office.description}</p>
                {office.phones && office.phones.length > 0 ? (
                  <div className={styles.officePhones}>
                    {office.phones.map((phone) => (
                      <a key={phone.e164} href={`tel:${phone.e164}`}>
                        <PhoneGlyph /><span className="tnum">{phone.display}</span>
                        {phone.label ? <span className={styles.phoneLabel}>({phone.label})</span> : null}
                      </a>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </section>

        <ul className={styles.practices} aria-label="Engineering practices">
          {BADGES.map((badge) => (
            <li key={badge}>
              <svg aria-hidden="true" viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.4">
                <path d="M10 2.2 17 5v5.2c0 4.2-2.9 6.8-7 8.3-4.1-1.5-7-4.1-7-8.3V5l7-2.8Z" />
                <path d="m7 10 2.1 2.1L13.4 7.7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>{badge}</span>
            </li>
          ))}
        </ul>
        <div className={styles.legal}>
          <p>© {year} {SITE.legalName}. All Rights Reserved.</p>
          <ul>
            {LEGAL_LINKS.map((l) => (
              <li key={l.label}><Link href={l.href}>{l.label}</Link></li>
            ))}
          </ul>
          <a
            href="https://www.dmca.com/Protection/Status.aspx?id=2223fed3-a5cc-497c-82bb-c20de7ce5720&refurl=https%3a%2f%2fsavotechnologies.com%2f&rlo=true"
            title="DMCA.com Protection Status"
            className={`dmca-badge ${styles.dmcaBadge}`}
            target="_blank"
            rel="noopener noreferrer"
            referrerPolicy="no-referrer"
          >
            {/* Official remotely served badge; preserve the provider URL without image optimization. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.dmca.com/Badges/dmca-badge-w150-5x1-06.png?ID=2223fed3-a5cc-497c-82bb-c20de7ce5720"
              alt="DMCA.com Protection Status"
              width={150}
              height={30}
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
            />
          </a>
        </div>
        <div className={styles.signature} aria-hidden="true">
          <SavoLogo compact />
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
    case "Facebook":
      return (
        <svg {...common} fill="currentColor">
          <path d="M13.6 2.2h-1.9c-2 0-3.3 1.3-3.3 3.4v1.7H6.7v2.6h1.7v7.7h2.7v-7.7h2.3l.4-2.6h-2.7V5.9c0-.6.2-1 .9-1h1.6V2.2Z" />
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
    case "X":
      return (
        <svg width={15} height={15} viewBox="0 0 1200 1227" aria-hidden="true" fill="currentColor">
          <path d="M718.1 519.7 1168.7 0h-106.8L770.9 450.9 431.5 0H14.9l472.5 683.2L14.9 1226.4h106.8l310.3-470.7 357.2 470.7h416.6L718.1 519.7Zm-146.6 176-47.9-67.4-380.3-534.6h164l306.9 430.4 47.9 67.4 399.5 561.5h-164l-345.6-485.3Z" />
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
