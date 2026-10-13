import { SiteHeader } from "@/components/layout/site-header";
import { PortalSiteHeader, PortalSiteFooter, PortalMarketingBoundary, SiteInteractionProviders } from "@/components/portal/site-chrome";
import { SmoothScroll } from "@/components/ui/smooth-scroll";
import { SiteFooter } from "@/components/layout/site-footer";
import { AskSavoBar } from "@/components/shared/ask-savo-bar";
import { AnalyticsBeacon } from "@/components/shared/analytics-beacon";
import { SiteImageGuard } from "@/components/shared/image-guard";
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
import { getManagedTestimonials } from "@/lib/content-items";
import type { LeadMetric } from "@/components/shared/project-lead-modal";



/**
 * Public site chrome: skip link, header with admin-managed nav collections,
 * main landmark, footer with admin-managed contact settings, and the
 * Organization/WebSite structured data.
 *
 * Public CMS/site-chrome reads use a bounded tagged Data Cache; managed
 * mutations expire it immediately through revalidateManagedContent().
 */
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [settings, services, industries, managedTestimonials] = await Promise.all([
    getSettings(),
    getManagedServices(),
    getManagedIndustries(),
    getManagedTestimonials(),
  ]);

  /* Conversion forms show published managed testimonials only. The homepage
   * retains its explicitly labelled media previews; forms do not imply that
   * unapproved demo quotes are genuine client reviews. */
  const leadTestimonials = managedTestimonials;

  /* Admin-managed verified metrics (Settings → Company impact metrics).
   * Empty values are omitted honestly - never invented. */
  const leadMetrics: LeadMetric[] = (
    [
      [settings.metrics.projectsDelivered, "Projects delivered"],
      [settings.metrics.clientsSupported, "Clients supported"],
      [settings.metrics.industriesServed, "Industries"],
      [settings.metrics.marketsReached, "Markets"],
    ] as [string, string][]
  ).filter(([v]) => v.trim().length > 0).map(([value, label]) => ({ value, label }));

  // Admin-managed collections drive the Services/Industries panels.
  const nav: NavItem[] = HEADER_NAV.map((item) => {
    if (item.label === "Services") return { ...item, children: toNavChildren(services) };
    if (item.label === "Industries") return { ...item, children: toNavChildren(industries) };
    return item;
  });

  // One canonical entity graph: Organization (Savo Technologies = Savo =
  // Savo Technologies Private Limited = Savo Technologies Pvt Ltd) and the
  // WebSite it publishes. Every page references these @ids - no duplicate
  // entities. Structured data stays factual in BOTH modes: areaServed uses
  // only verified presence records; demo-only market cards never add claims.
  const AREA_SERVED_COUNTRIES = [
    "India",
    "Switzerland",
    "Dubai & GCC",
    "Australia",
    "United Kingdom",
    "United States",
    /* Cities honestly served: Swiss/EU coverage from the Granges-Marnand
       head office; the rest from the verified market presence model. */
    "Zurich",
    "Geneva",
    "Basel",
    "Lausanne",
    "Bern",
    "Indore",
    "Mumbai",
    "Delhi",
    "Dubai",
    "London",
    "Sydney",
    "New York",
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": absoluteUrl("/#organization"),
        name: SITE.name,
        alternateName: [SITE.shortName, SITE.legalName, SITE.legalNameShort],
        disambiguatingDescription: "The official Savo Technologies: an IT and digital product engineering company headquartered in Indore, India, with its official website at savotechnologies.com.",
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
        // Verified, Savo-controlled profiles only (SOCIAL_LINKS) -
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
          "Answer Engine Optimization (AEO)",
          "Generative Engine Optimization (GEO)",
          "Data Analytics & Business Intelligence",
          "Quality Assurance & Software Testing",
          "Flutter & React Native App Development",
          "RAG (Retrieval-Augmented Generation) Systems",
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
        alternateName: SITE.shortName,
        description: SITE.description,
        publisher: { "@id": absoluteUrl("/#organization") },
        inLanguage: "en",
      },
    ],
  };

  return (
    <SiteInteractionProviders testimonials={leadTestimonials} metrics={leadMetrics} enabled={settings.leadModalEnabled}>
      <AnalyticsBeacon />
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

      {/* Admin-managed announcement line (Settings) - hidden when unset */}
      {settings.announcement ? (
        <div className="chapter-ink bg-background">
          <p className="shell flex items-center gap-3 py-2.5 text-[0.8125rem] text-foreground">
            <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 bg-accent" />
            <span className="min-w-0 flex-1 truncate">{settings.announcement}</span>
          </p>
        </div>
      ) : null}

      {/* Staging identifier - demo builds only, never in production.
          Marks the environment to reviewers so demo content cannot be
          mistaken for approved corporate information. */}
      {IS_DEMO ? (
        <div
          aria-hidden="true"
          data-development-preview
          className="pointer-events-none fixed bottom-4 left-4 z-[150] flex items-center gap-2 border border-border bg-[rgb(16_19_25/0.92)] px-3 py-1.5 text-white/90 backdrop-blur-[2px]"
        >
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
          <span className="t-label"><span className="hidden sm:inline">Development </span>Preview</span>
        </div>
      ) : null}

      <SmoothScroll>
        <PortalSiteHeader><SiteHeader nav={nav} /></PortalSiteHeader>
      <main id="main">{children}</main>
      <PortalSiteFooter>
        <SiteFooter contact={{ email: settings.contactEmail, phone: settings.contactPhone, phoneE164: SITE.phoneE164 }} />
      </PortalSiteFooter>
      <PortalMarketingBoundary><AskSavoBar /></PortalMarketingBoundary>
      <SiteImageGuard />
      </SmoothScroll>
    </SiteInteractionProviders>
  );
}
