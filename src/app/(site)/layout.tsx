import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { EnquiryProvider } from "@/components/shared/enquiry-dialog";
import { AskSavoBar } from "@/components/shared/ask-savo-bar";
import { HEADER_NAV, type NavItem } from "@/constants/navigation";
import { SITE, SOCIAL_LINKS, OFFICES } from "@/constants/site";
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

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": absoluteUrl("/#organization"),
        name: SITE.name,
        alternateName: "SAVO",
        url: absoluteUrl("/"),
        logo: absoluteUrl("/icon.svg"),
        description: SITE.description,
        slogan: SITE.tagline,
        email: settings.contactEmail,
        telephone: SITE.phoneE164,
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "sales",
          email: settings.contactEmail,
          telephone: SITE.phoneE164,
          availableLanguage: ["en"],
        },
        address: { "@type": "PostalAddress", addressCountry: "IN" },
        areaServed: OFFICES.map((o) => o.region),
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
