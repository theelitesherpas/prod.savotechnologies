import type { Metadata, Viewport } from "next";
import { Manrope, Source_Serif_4, Fragment_Mono } from "next/font/google";
import Script from "next/script";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { EnquiryProvider } from "@/components/shared/enquiry-dialog";
import { SITE, SOCIAL_LINKS } from "@/constants/site";
import { absoluteUrl, env } from "@/lib/env";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-source-serif",
  style: ["normal", "italic"],
  axes: ["opsz"],
  display: "swap",
});

const fragment = Fragment_Mono({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-fragment",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(env.NEXT_PUBLIC_SITE_URL),
  title: {
    default: "SAVO Technologies | Web, Mobile, AI & Digital Product Development",
    template: "%s | SAVO Technologies",
  },
  description: SITE.description,
  applicationName: SITE.name,
  keywords: [
    "web development company",
    "mobile app development",
    "AI development",
    "AI agents",
    "custom software development",
    "SaaS development",
    "UI/UX design",
    "digital product company",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: SITE.name,
    title: "SAVO Technologies | Web, Mobile, AI & Digital Product Development",
    description: SITE.description,
    url: "/",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "SAVO Technologies | Web, Mobile, AI & Digital Product Development",
    description: SITE.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
};

export const viewport: Viewport = {
  themeColor: "#f5f4f0",
  width: "device-width",
  initialScale: 1,
};

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
      email: SITE.email,
      telephone: SITE.phoneE164,
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "sales",
        email: SITE.email,
        telephone: SITE.phoneE164,
        availableLanguage: ["en"],
      },
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

/** Marks JS availability so entrance motion only hides content when it can reveal it. */
const jsMarker = "document.documentElement.dataset.js='true'";

const designContract = `<!--
  SAVO TECHNOLOGIES — HOMEPAGE DESIGN CONTRACT (v2)
  THESIS: One partner from idea to scale, presented as a precision-authored
  engineering dossier bound in leather — a technology partner's document,
  not an agency pitch.
  OWN-WORLD: Warm paper and sand bands, blue-black ink chapters, one vermilion
  signal; hairline rules, blueprint grids, square-node motif; Source Serif 4
  display voice over Manrope UI voice, Fragment Mono for measurement; duotone
  photography held inside the document's ink.
  STORY: Visitor learns what SAVO builds (web, mobile, software, AI, design,
  growth), why it differs from an agency, that AI is serious engineering, and
  how to start a project — then acts via Start a Project.
  FIRST VIEWPORT: Paper field; left — mono positioning label, serif headline
  "We design and engineer what's next." closing on a vermilion period,
  two-line support, ink CTA pair; right — live orbiting square-node system
  (WEB·MOBILE·AI·SOFTWARE·DESIGN·GROWTH) around a SAVO core with pointer-
  reactive hairlines. Primary action: ink "Start a Project" button.
  FORM: Brief-pinned world (premium·minimal·editorial·technical), refined by
  user direction toward professional richness: serif type, real photography,
  drawn vector infographics; chapter rhythm and index rail carry the narrative.
  FINISH: unreviewed and undocumented is unfinished; this build ends with the
  finish review, the verdict, DESIGN.md, and every shipping raster carrying
  its provenance
-->`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const gaId = env.NEXT_PUBLIC_GA_ID;

  return (
    <html lang="en" className={`${manrope.variable} ${sourceSerif.variable} ${fragment.variable}`}>
      <body className="bg-background font-sans text-foreground antialiased">
        {/* Design contract — survives the production build; see docs/DESIGN.md */}
        <div hidden dangerouslySetInnerHTML={{ __html: designContract }} />
        <script dangerouslySetInnerHTML={{ __html: jsMarker }} />

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

        <EnquiryProvider>
          <SiteHeader />
          <main id="main">{children}</main>
          <SiteFooter />
        </EnquiryProvider>

        {gaId ? (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="afterInteractive"
            />
            <Script id="ga4" strategy="afterInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gaId}');`}
            </Script>
          </>
        ) : null}
      </body>
    </html>
  );
}
