import type { Metadata, Viewport } from "next";
import { Manrope, Source_Serif_4, Fragment_Mono } from "next/font/google";
import Script from "next/script";
import { SITE } from "@/constants/site";
import { openGraphFor } from "@/lib/seo";
import { canonicalOrigin, INDEXABLE, env } from "@/lib/env";
import { IS_DEMO } from "@/lib/content-mode";
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

const HOME_TITLE = "Savo Technologies | Web, Mobile, AI & Software Development Company";
const HOME_DESCRIPTION =
  "Savo Technologies is an Indore based software development company in India providing website development, web applications, mobile app development, AI development, SaaS and custom software solutions for clients across India and worldwide.";

/**
 * Root metadata. Route groups (site)/ and admin/ extend or override this
 * (admin pages are noindex). Canonical URLs always target the production
 * domain; non-production deployments are noindex via the INDEXABLE gate.
 */
export const metadata: Metadata = {
  metadataBase: new URL(canonicalOrigin),
  title: {
    default: HOME_TITLE,
    template: "%s | Savo Technologies",
  },
  description: HOME_DESCRIPTION,
  applicationName: SITE.name,
  alternates: { canonical: "/" },
  openGraph: openGraphFor({
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    url: "/",
  }),
  twitter: {
    card: "summary_large_image",
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
  },
  robots: INDEXABLE && !IS_DEMO
    ? {
        index: true,
        follow: true,
        googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
      }
    : {
        index: false,
        follow: false,
        googleBot: { index: false, follow: false },
      },
};

export const viewport: Viewport = {
  themeColor: "#f5f4f0",
  width: "device-width",
  initialScale: 1,
};

/** Marks JS availability so entrance motion only hides content when it can reveal it. */
const jsMarker = "document.documentElement.dataset.js='true'";

const designContract = `<!--
  SAVO TECHNOLOGIES: HOMEPAGE DESIGN CONTRACT (v2)
  THESIS: One partner from idea to scale, presented as a precision-authored
  engineering dossier bound in leather, a technology partner's document,
  not an agency pitch.
  OWN-WORLD: Warm paper and sand bands, blue-black ink chapters, one vermilion
  signal; hairline rules, blueprint grids, square-node motif; Source Serif 4
  display voice over Manrope UI voice, Fragment Mono for measurement; true-color
  photography inside the document's ink.
  STORY: Visitor learns what SAVO builds (web, mobile, software, AI, design,
  growth), why it differs from an agency, that AI is serious engineering, and
  how to start a project, then acts via Start a Project.
  FIRST VIEWPORT: Paper field; left, mono positioning label, serif headline
  "We design and engineer what's next." closing on a vermilion period,
  two-line support, ink CTA pair; right, live orbiting square-node system
  (WEB·MOBILE·AI·SOFTWARE·DESIGN·GROWTH) around a SAVO core with pointer-
  reactive hairlines. Primary action: ink "Start a Project" button.
  FORM: Brief-pinned world (premium·minimal·editorial·technical), refined by
  user direction toward professional richness: serif type, real photography,
  drawn vector infographics; chapter rhythm and index rail carry the narrative.
  FINISH: unreviewed and undocumented is unfinished; this build ends with the
  finish review, the verdict, DESIGN.md, and every shipping raster carrying
  its provenance
-->`;

/**
 * Root shell: fonts, global styles, analytics, design contract.
 * Public chrome (header/footer/dialog) lives in app/(site)/layout.tsx;
 * the admin panel composes its own chrome.
 */
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const gaId = env.NEXT_PUBLIC_GA_ID;

  return (
    <html lang="en" suppressHydrationWarning className={`${manrope.variable} ${sourceSerif.variable} ${fragment.variable}`}>
      <body className="bg-background font-sans text-foreground antialiased">
        {/* Design contract, survives the production build; see DESIGN.md */}
        <div hidden dangerouslySetInnerHTML={{ __html: designContract }} />
        <script dangerouslySetInnerHTML={{ __html: jsMarker }} />

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

        {children}
      </body>
    </html>
  );
}
