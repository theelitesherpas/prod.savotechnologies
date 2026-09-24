import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { EnquiryProvider } from "@/components/shared/enquiry-dialog";
import { AskSavoBar } from "@/components/shared/ask-savo-bar";
import { HEADER_NAV, type NavItem } from "@/constants/navigation";
import { SITE } from "@/constants/site";
import { absoluteUrl } from "@/lib/env";
import { getSettings } from "@/lib/settings";
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
  // entities. Countries the company genuinely serves per the v1 office map.
  const AREA_SERVED_COUNTRIES = [
    "India",
    "Switzerland",
    "Saudi Arabia",
    "United Arab Emirates",
    "Bahrain",
    "Australia",
    "United Kingdom",
    "United States",
  ];

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
        // sameAs deliberately omitted: it will list only verified
        // Savo-controlled profiles (LinkedIn, GBP, GitHub…) once the
        // company supplies the URLs. Placeholder platform links never go here.
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

      <SiteHeader nav={nav} />
      <main id="main">{children}</main>
      <SiteFooter
        contact={{ email: settings.contactEmail, phone: settings.contactPhone, phoneE164: SITE.phoneE164 }}
      />
      <AskSavoBar />
    </EnquiryProvider>
  );
}
