import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { EnquiryProvider } from "@/components/shared/enquiry-dialog";
import { AskSavoBar } from "@/components/shared/ask-savo-bar";
import { HEADER_NAV, type NavItem } from "@/constants/navigation";
import { SITE, SOCIAL_LINKS } from "@/constants/site";
import { absoluteUrl } from "@/lib/env";
import { getSettings } from "@/lib/settings";
import { IS_DEMO } from "@/lib/content-mode";
import {
  getManagedServices,
  getManagedIndustries,
  toNavChildren,
} from "@/lib/collections";

/**
 * Public site chrome: skip link, header with admin-managed nav collections,
 * main landmark, footer with admin-managed contact settings, and the
 * Organization/WebSite structured data.
 *
 * Data is fetched at build time; admin mutations call
 * revalidateManagedContent() to regenerate affected pages on demand.
 */
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [settings, services, industries] = await Promise.all([
    getSettings(),
    getManagedServices(),
    getManagedIndustries(),
  ]);

  // Admin-managed collections drive the Services/Industries panels.
  const nav: NavItem[] = HEADER_NAV.map((item) => {
    if (item.label === "Services") return { ...item, children: toNavChildren(services) };
    if (item.label === "Industries") return { ...item, children: toNavChildren(industries) };
    return item;
  });

  // One canonical entity graph: Organization (Savo Technologies = Savo =
  // Savo Technologies Private Limited = Savo Technologies Pvt Ltd) and the
  // WebSite it publishes. Every page references these @ids — no duplicate
  // entities. Structured data stays factual in BOTH modes: areaServed is
  // restricted to the verified home market (demo market-presence cards are
  // visual staging content and never enter machine-readable claims; the
  // verified multi-market list is restored when Savo confirms it).
  const AREA_SERVED_COUNTRIES = ["India"];

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": absoluteUrl("/#organization"),
        name: SITE.name,
        alternateName: [SITE.shortName, SITE.legalNameShort],
        legalName: SITE.legalName,
        url: absoluteUrl("/"),
        logo: absoluteUrl("/images/savo-technologies-logo.svg"),
        description: SITE.description,
        slogan: SITE.tagline,
        email: settings.contactEmail,
        telephone: SITE.phoneE164,
        foundingDate: SITE.registration.foundedYear,
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "sales",
          email: settings.contactEmail,
          telephone: SITE.phoneE164,
          availableLanguage: ["en"],
        },
        address: {
          "@type": "PostalAddress",
          addressLocality: SITE.hq.city,
          addressRegion: SITE.hq.region,
          addressCountry: SITE.hq.countryCode,
          ...(SITE.hq.street ? { streetAddress: SITE.hq.street } : {}),
          ...(SITE.hq.postalCode ? { postalCode: SITE.hq.postalCode } : {}),
        },
        areaServed: AREA_SERVED_COUNTRIES,
        // Verified, Savo-controlled profiles only (SOCIAL_LINKS) —
        // placeholder platform links never go here.
        sameAs: SOCIAL_LINKS.map((s) => s.href),
        knowsAbout: [
          "Website Design & Development",
          "Web Application Development",
          "Mobile Application Development",
          "Custom Software Development",
          "SaaS Product Development",
          "Artificial Intelligence Development",
          "AI Agent Development",
          "Generative AI",
          "Business Process Automation",
          "UI/UX Design",
          "eCommerce Development",
          "SEO",
          "Cloud & Backend Engineering",
        ],
        // Offer catalog mirrors the services visible in the header panel.
        hasOfferCatalog: {
          "@type": "OfferCatalog",
          name: "Services",
          itemListElement: services.map((s) => ({
            "@type": "Offer",
            itemOffered: { "@type": "Service", name: s.label, url: absoluteUrl(s.href) },
          })),
        },
      },
      {
        "@type": "WebSite",
        "@id": absoluteUrl("/#website"),
        url: absoluteUrl("/"),
        name: SITE.name,
        alternateName: [SITE.shortName, SITE.legalName, SITE.legalNameShort, "savotechnologies.com"],
        description: SITE.description,
        publisher: { "@id": absoluteUrl("/#organization") },
        inLanguage: "en",
      },
    ],
  };

  return (
    <EnquiryProvider>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:bg-foreground focus:px-4 focus:py-2 focus:text-background"
      >
        Skip to content
      </a>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Admin-managed announcement line (Settings) — hidden when unset */}
      {settings.announcement ? (
        <div className="chapter-ink bg-background">
          <p className="shell flex items-center gap-3 py-2.5 text-[0.8125rem] text-foreground">
            <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 bg-accent" />
            <span className="min-w-0 flex-1 truncate">{settings.announcement}</span>
          </p>
        </div>
      ) : null}

      {/* Staging identifier — demo builds only, never in production.
          Marks the environment to reviewers so demo content cannot be
          mistaken for approved corporate information. */}
      {IS_DEMO ? (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed bottom-4 left-4 z-[150] flex items-center gap-2 border border-border bg-[rgb(16_19_25/0.92)] px-3 py-1.5 text-white/90 backdrop-blur-[2px]"
        >
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
          <span className="t-label">Development Preview</span>
        </div>
      ) : null}

      <SiteHeader nav={nav} />
      <main id="main">{children}</main>
      <SiteFooter
        contact={{ email: settings.contactEmail, phone: settings.contactPhone, phoneE164: SITE.phoneE164 }}
      />
      <AskSavoBar />
    </EnquiryProvider>
  );
}
