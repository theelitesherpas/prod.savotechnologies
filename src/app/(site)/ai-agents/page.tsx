import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/env";
import { DetailCta } from "@/components/shared/detail-cta";
import { AGENTS, AGENT_FAQS } from "@/constants/agents";
import { AgentsHero, AgentChapters, AgentDeploy, AgentsFaqs } from "@/sections/agents/agents-page";
import { openGraphFor } from "@/lib/seo";

/**
 * The agent fleet — /ai-agents/. Six production personas, the
 * deployment path, and the honest engineering behind them.
 */

const DESCRIPTION = `Deploy production AI agents with Savo Technologies: sales, support, recruiting, analytics, content and operations personas trained on your data, guarded by enterprise security, live in 2 to 4 weeks.`;

export const metadata: Metadata = {
  title: "AI Agents",
  description: DESCRIPTION,
  alternates: { canonical: "/ai-agents" },
  openGraph: openGraphFor({ title: "AI Agents | Savo Technologies", description: DESCRIPTION, url: "/ai-agents" }),
};

export default function AgentsPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": absoluteUrl("/ai-agents/#webpage"),
        url: absoluteUrl("/ai-agents"),
        name: "AI Agents | Savo Technologies",
        description: DESCRIPTION,
        isPartOf: { "@id": absoluteUrl("/#website") },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
          { "@type": "ListItem", position: 2, name: "AI Agents", item: absoluteUrl("/ai-agents") },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: AGENT_FAQS.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
      {
        "@type": "ItemList",
        name: "The agent fleet",
        itemListElement: AGENTS.map((a, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: a.name,
        })),
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <AgentsHero />
      <AgentChapters />
      <AgentDeploy />
      <AgentsFaqs />

      <DetailCta
        headingId="agents-cta-heading"
        heading="Deploy your first agent."
        lead="Two to four weeks from scope to supervised live — on your data, inside your infrastructure, with the guardrails already in place."
        location="ai-agents-cta"
        secondaryLabel="Start a Project"
        secondaryHref="/start"
      />
    </>
  );
}
