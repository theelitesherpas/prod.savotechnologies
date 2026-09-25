import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

/**
 * Content Security Policy.
 * - Fonts are self-hosted via next/font, so no external font hosts are needed.
 * - googletagmanager / google-analytics are only used when NEXT_PUBLIC_GA_ID is set.
 * - 'unsafe-inline' for scripts is required by Next.js's inline hydration bootstrap.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${
    isProd ? "" : " 'unsafe-eval'"
  } https://www.googletagmanager.com https://www.google-analytics.com`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self' https://www.google-analytics.com https://www.googletagmanager.com https://region1.google-analytics.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isProd ? ["upgrade-insecure-requests"] : []),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  ...(isProd
    ? [
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
      ]
    : []),
];

const nextConfig: NextConfig = {
  // Sub-path hosting (e.g. https://savotech.vercel.app/savo.v6) — set via
  // NEXT_PUBLIC_BASE_PATH at build time; undefined locally.
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || undefined,
  poweredByHeader: false,
  reactStrictMode: true,
  // Case-study records carry cropped hero images (data URLs up to ~4 MB)
  // through server actions — the 1 MB default would reject them.
  experimental: {
    serverActions: {
      bodySizeLimit: "8mb",
    },
  },
  async redirects() {
    // Permanent (308) redirects for URLs renamed before production launch.
    // Direct one-hop mappings only — no chains. Internal links already point
    // at the final destinations; these preserve any equity the test
    // environment accumulated.
    return [
      // /resources → /insights (route renamed pre-launch)
      { source: "/resources", destination: "/insights", permanent: true },
      { source: "/resources/:slug", destination: "/insights/:slug", permanent: true },
      // Service slugs normalized to full descriptive forms
      {
        source: "/services/mobile-apps",
        destination: "/services/mobile-app-development",
        permanent: true,
      },
      { source: "/services/ui-ux", destination: "/services/ui-ux-design", permanent: true },
      {
        source: "/services/custom-software",
        destination: "/services/custom-software-development",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
