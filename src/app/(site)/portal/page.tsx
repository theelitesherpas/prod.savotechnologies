import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { absoluteUrl } from "@/lib/env";
import { getClientUser } from "@/lib/client-auth";
import { PortalLoginCard } from "./login-card";
import { openGraphFor } from "@/lib/seo";
import { PortalEntrance } from "@/components/portal/entrance";

const DESCRIPTION =
  "Sign in to the Savo Technologies client portal to follow your projects, milestones, delivery updates and invoices.";
export const metadata: Metadata = {
  title: "Client Portal",
  description: DESCRIPTION,
  alternates: { canonical: "/portal" },
  openGraph: openGraphFor({
    title: "Client Portal | Savo Technologies",
    description: DESCRIPTION,
    url: "/portal",
  }),
};
export default async function PortalPage({
  searchParams,
}: {
  searchParams: Promise<{ e?: string }>;
}) {
  if (await getClientUser()) redirect("/portal/dashboard");
  const { e: error } = await searchParams;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": absoluteUrl("/portal/#webpage"),
        url: absoluteUrl("/portal"),
        name: "Client Portal | Savo Technologies",
        description: DESCRIPTION,
        isPartOf: { "@id": absoluteUrl("/#website") },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: absoluteUrl("/"),
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Client Portal",
            item: absoluteUrl("/portal"),
          },
        ],
      },
    ],
  };
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PortalEntrance kind="client">
        <PortalLoginCard
          error={typeof error === "string" ? error : undefined}
        />
      </PortalEntrance>
    </>
  );
}
