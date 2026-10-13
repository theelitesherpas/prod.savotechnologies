import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { absoluteUrl } from "@/lib/env";
import { getClientUser } from "@/lib/client-auth";
import { PortalLoginCard } from "./login-card";
import { openGraphFor } from "@/lib/seo";
import { PortalIcon } from "@/components/portal/workspace-ui";
import styles from "@/components/portal/portal.module.css";

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
    <div className={styles.loginPage}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className={styles.loginRail}>
        <div className={styles.loginGrid}>
          <section
            className={styles.loginIntro}
            aria-labelledby="portal-heading"
          >
            <h1 id="portal-heading">
              Your project.
              <br />A clearer view.
            </h1>
            <p>
              One place to follow the work we’re building together. Pick up
              where you left off, without searching through email threads.
            </p>
            <ul className={styles.loginFeatures}>
              <li>
                <PortalIcon name="projects" />
                <div>
                  <h2>Projects & milestones</h2>
                  <p>
                    See your project’s current status, progress and planned
                    milestones.
                  </p>
                </div>
              </li>
              <li>
                <PortalIcon name="message" />
                <div>
                  <h2>Delivery updates</h2>
                  <p>
                    Read the latest notes and updates shared by your delivery
                    team.
                  </p>
                </div>
              </li>
              <li>
                <PortalIcon name="invoice" />
                <div>
                  <h2>Invoices & payment history</h2>
                  <p>
                    Review issued invoices, due dates and payment status in
                    their original currency.
                  </p>
                </div>
              </li>
            </ul>
            <div className={styles.loginIntroFoot}>
              <Link href="/trust">
                Our approach to trust & security
                <PortalIcon name="arrow" />
              </Link>
            </div>
          </section>
          <PortalLoginCard
            error={typeof error === "string" ? error : undefined}
          />
        </div>
        <div className={styles.loginBelow}>
          <p>Not a client yet? Let’s talk about what you want to build.</p>
          <Link href="/start-a-project">
            Start a project
            <PortalIcon name="arrow" />
          </Link>
        </div>
      </div>
    </div>
  );
}
