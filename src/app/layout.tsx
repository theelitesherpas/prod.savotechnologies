import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Fragment_Mono } from "next/font/google";
import { SITE } from "@/constants/site";
import { openGraphFor } from "@/lib/seo";
import { absoluteUrl, canonicalOrigin, INDEXABLE, env } from "@/lib/env";
import { IS_DEMO } from "@/lib/content-mode";
import { RouteLoader } from "@/components/ui/route-loader";
import "./globals.css";

/* Fragment Mono stays a next/font instance: it backs only the hero
   orbit canvas and the growth diagram labels (direct --font-fragment
   references), loading on demand. The three system families (Inter,
   Outfit, Afacad Flux) are self-hosted WOFF2 via globals.css and
   preloaded below - see the type-system comment there. */
const fragment = Fragment_Mono({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-fragment",
  display: "swap",
});

/* Sub-path hosting (e.g. vercel demo) - preloads must respect it. */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

/** Above-the-fold brand faces, downloaded before CSS discovery so the
 *  first paint already uses them (no fallback-font flash). Inter italic
 *  and Afacad Flux (pull-quotes, below the fold) load on demand. */
const fontPreloads = [
  `${basePath}/fonts/inter/Inter-Variable.163f2f69.latin.woff2`,
  `${basePath}/fonts/outfit/Outfit-Variable.dc1f873e.latin.woff2`,
];

const HOME_TITLE = "Savo Technologies | Web, Mobile & AI Development Company";
const HOME_DESCRIPTION = SITE.description;

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
  alternates: { canonical: absoluteUrl("/") },
  openGraph: openGraphFor({
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    url: absoluteUrl("/"),
  }),
  // Page-specific Open Graph metadata supplies the title, description and
  // thumbnail. X/Twitter falls back to those OG values when absent here.
  twitter: { card: "summary_large_image" },
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
const jsMarker = "document.documentElement.classList.add('js');";

const designContract = `<!--
  SAVO TECHNOLOGIES: HOMEPAGE DESIGN CONTRACT (v2)
  THESIS: One partner from idea to scale, presented as a precision-authored
  engineering dossier bound in leather, a technology partner's document,
  not an agency pitch.
  OWN-WORLD: Warm paper and sand bands, blue-black ink chapters, one vermilion
  signal; hairline rules, blueprint grids, square-node motif; Outfit display
  voice over Inter UI voice, Fragment Mono for measurement; true-color
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
    <html lang="en" suppressHydrationWarning className={fragment.variable}>
      <body className="bg-background font-sans text-foreground antialiased">
        {/* Brand fonts enter the critical path ahead of stylesheet
            discovery; crossorigin is required for font preloads. */}
        {fontPreloads.map((href) => (
          <link
            key={href}
            rel="preload"
            href={href}
            as="font"
            type="font/woff2"
            crossOrigin="anonymous"
          />
        ))}
        {/* Design contract, survives the production build; see DESIGN.md */}
        <div hidden dangerouslySetInnerHTML={{ __html: designContract }} />
        <Script id="js-marker" strategy="afterInteractive">
          {jsMarker}
        </Script>

        {gaId ? (
          /* Analytics loads on the FIRST USER INTERACTION (scroll, tap,
             key, wheel) with a 10s idle fallback - completely outside the
             initial render path and PSI's measurement window, while every
             real engaged session still records its page_view. gtag()
             queues through dataLayer until the script arrives. */
          <Script
            id="ga4-interaction"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `(function(){var W=window,L="dataLayer",armed=false,t;function load(){if(armed)return;armed=true;clearTimeout(t);W[L]=W[L]||[];function g(){W[L].push(arguments)}g("js",new Date());g("config","${gaId}");var s=document.createElement("script");s.async=true;s.src="https://www.googletagmanager.com/gtag/js?id=${gaId}";document.head.appendChild(s);}["scroll","mousedown","keydown","touchstart","wheel"].forEach(function(e){W.addEventListener(e,load,{once:true,passive:true})});t=setTimeout(load,10000);})();`,
            }}
          />
        ) : null}

        {children}
        {/* Branded page-transition veil: arms on internal navigation,
            only appears when the route genuinely takes time. */}
        <RouteLoader />
      </body>
    </html>
  );
}
