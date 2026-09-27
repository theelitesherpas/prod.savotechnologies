import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { absoluteUrl } from "@/lib/env";
import { Section } from "@/components/ui/section";
import { SectionHeader } from "@/components/ui/section-header";
import { Reveal } from "@/components/ui/reveal";
import { DetailCta } from "@/components/shared/detail-cta";
import { SalesbotDemo } from "@/components/agents/salesbot-demo";
import { getManagedAgents } from "@/lib/content-items";
import { openGraphFor } from "@/lib/seo";

/**
 * Agent detail - /ai-agents/[slug]. Deep chapter for the fleet's
 * personas: capabilities, the working pipeline, industry-standard
 * terminology, and (for demo-enabled agents) the live interactive demo.
 */

const DEMO_SLUGS = new Set(["salesbot"]);

const PIPELINE = [
  { step: "01", title: "Engage", text: "Greets every visitor on arrival, states what it is and what it can do. No pretending to be human, no dark patterns." },
  { step: "02", title: "Discover", text: "Open-ended need discovery first, then structured qualification: budget band, timeline, urgency - slot by slot." },
  { step: "03", title: "Classify", text: "Every message passes intent classification and entity extraction. Service keywords map against the real catalogue; nothing is guessed." },
  { step: "04", title: "Recommend", text: "Matched services with the reason for each match, drawn from approved product content - not generated improvisation." },
  { step: "05", title: "Hand off", text: "A CRM-ready structured brief (need, services, budget band, timeline, lead score) plus the full transcript, routed to the right rep." },
];

const GLOSSARY = [
  { term: "Intent classification", def: "Determining what a message is asking for - a question, a budget answer, a need statement, an objection - before responding. Misread intent is how bots embarrass their owners; SalesBot classifies every turn and shows you the result live in the demo telemetry." },
  { term: "Entity / slot extraction", def: "Pulling structured values out of free text: \"$10k\" becomes a budget band, \"before Diwali\" becomes urgency, \"Flutter app\" becomes a matched service. The demo's slot panel fills as you type." },
  { term: "Slot filling", def: "The qualification technique of collecting required fields conversationally - need, budget, timeline - instead of one giant form. Each slot confirmed before the next question." },
  { term: "Lead scoring", def: "A transparent 0-100 score from the extracted slots: stated need, matched services, budget band and urgency. SalesBot shows its score and reasoning; you can audit every point." },
  { term: "Guardrails", def: "Hard boundaries on agent behaviour. SalesBot answers only from approved knowledge, never invents pricing or claims, and says so openly when something is outside its scope." },
  { term: "Human-in-the-loop (HITL)", def: "Designed escalation, not failure: anything outside approved knowledge, or any hot lead, routes to a human with full context attached. The agent narrows the funnel; people close it." },
  { term: "Structured handoff", def: "The end-of-conversation payload a CRM or rep receives: a normalized brief plus the complete transcript. Machine-readable where systems need it, human-readable where reps do." },
  { term: "Deterministic engine", def: "This demo runs on explicit logic - state machines, pattern extraction, curated answers - so the same input always yields the same behaviour. Auditable by design. On live deployments the same skeleton wraps an LLM for open-domain answers, still behind the same guardrails." },
];

const CAPABILITIES = [
  { title: "Visitor engagement", text: "First-response within seconds, 24/7, with an honest self-introduction. Traffic that would bounce gets a conversation." },
  { title: "Product Q&A", text: "Answers on services, process, pricing approach, tech and company - drawn from approved content, with links to the matching site pages." },
  { title: "Lead qualification", text: "BANT-style qualification (need, budget, timeline) conversationally, with slot confirmation and graceful 'not sure yet' handling." },
  { title: "Service matching", text: "Stated needs map to the real service catalogue with reasons, so recommendations stay grounded and explainable." },
  { title: "Lead scoring & routing", text: "Transparent 0-100 scoring; hot leads flagged for same-day contact, everything else nurtured or handed over politely." },
  { title: "CRM sync", text: "Transcripts and structured briefs flow into your CRM; meetings book into the right rep's calendar." },
];

export const metadata: Metadata = {
  title: "Savo SalesBot",
  description:
    "Savo SalesBot: the AI sales agent that engages every visitor, answers product questions from approved knowledge, qualifies leads with budget and timeline, scores them transparently and hands a structured brief to your CRM. Try the live demo.",
  alternates: { canonical: "/ai-agents/salesbot" },
  openGraph: openGraphFor({
    title: "Savo SalesBot · AI Agents | Savo Technologies",
    description: "The AI sales agent: engage, qualify, score, hand off. Live interactive demo.",
    url: "/ai-agents/salesbot",
  }),
};

export function generateStaticParams() {
  return [...DEMO_SLUGS].map((slug) => ({ slug }));
}

export default async function AgentDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!DEMO_SLUGS.has(slug)) notFound();
  const agent = (await getManagedAgents()).find((a) => a.slug === slug);
  if (!agent) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        name: agent.name,
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        description: agent.detail,
        url: absoluteUrl(`/ai-agents/${slug}`),
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD", description: "Live interactive demo" },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
          { "@type": "ListItem", position: 2, name: "AI Agents", item: absoluteUrl("/ai-agents") },
          { "@type": "ListItem", position: 3, name: agent.name, item: absoluteUrl(`/ai-agents/${slug}`) },
        ],
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Hero */}
      <section aria-labelledby="agent-heading" className="chapter-ink relative overflow-hidden">
        <div className="shell pb-16 pt-[calc(var(--nav-h)+4.5rem)] sm:pb-20">
          <div aria-hidden="true" className="mb-12 flex items-center gap-4">
            <span className="h-2 w-2 shrink-0 bg-accent" />
            <span className="t-label text-muted">
              <Link href="/ai-agents" className="transition-colors hover:text-foreground">AI Agents</Link>
              <span className="mx-2.5 text-muted/60">·</span>
              {agent.name}
            </span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <div className="grid items-end gap-10 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <Reveal>
                <h1 id="agent-heading" className="t-statement max-w-[14ch]">
                  {agent.name}
                  <span aria-hidden="true" className="text-accent">.</span>
                </h1>
              </Reveal>
              <Reveal delay={120}>
                <p className="t-body-lg mt-8 max-w-xl text-muted">{agent.detail}</p>
              </Reveal>
              <Reveal delay={200}>
                <div className="mt-8 flex flex-wrap gap-2">
                  {agent.tags.map((t) => (
                    <span key={t} className="t-caption rounded-[2px] border border-border px-2.5 py-1 text-muted">{t}</span>
                  ))}
                </div>
              </Reveal>
              <Reveal delay={260}>
                <div className="mt-9 flex flex-wrap items-center gap-4">
                  <a
                    href="#demo"
                    className="inline-flex h-12 items-center gap-2.5 rounded-[2px] bg-accent px-6 text-[0.9375rem] font-bold text-on-accent transition-colors duration-300 ease-[var(--ease-out-expo)] hover:bg-accent-hover"
                  >
                    Try the live demo
                    <svg viewBox="0 0 14 14" aria-hidden="true" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.7">
                      <path d="M1 7h11M7.5 2.5 12 7l-4.5 4.5" />
                    </svg>
                  </a>
                  <p className="t-caption text-muted">No signup. The engine runs on this page, right now.</p>
                </div>
              </Reveal>
            </div>

            {/* Fleet card */}
            <div className="lg:col-span-5">
              <Reveal delay={240}>
                <div className="border border-border bg-surface p-7">
                  <p className="t-label text-muted">What ships with SalesBot</p>
                  <ul className="mt-5 space-y-3.5 border-t border-border pt-5">
                    {agent.deliverables.map((d) => (
                      <li key={d} className="flex items-start gap-3.5">
                        <span aria-hidden="true" className="mt-[0.55em] h-1.5 w-1.5 shrink-0 bg-accent" />
                        <span className="t-sm font-medium text-foreground/85">{d}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* Pipeline */}
      <Section index="How It Works" labelledBy="pipeline-heading">
        <SectionHeader
          id="pipeline-heading"
          heading="How the agent runs."
          lead="Engage, discover, qualify, recommend, hand off. The same pipeline whether the brain is the deterministic demo engine or a guarded LLM on your data."
        />
        <Reveal>
          <ol className="grid gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-5">
            {PIPELINE.map((p) => (
              <li key={p.step} className="flex flex-col gap-3 bg-background p-6">
                <span className="tnum font-mono text-[0.6875rem] tracking-widest text-accent">{p.step}</span>
                <h3 className="t-h4">{p.title}</h3>
                <p className="t-sm text-muted">{p.text}</p>
              </li>
            ))}
          </ol>
        </Reveal>
      </Section>

      {/* Live demo */}
      <Section id="demo" index="Live Demo" labelledBy="demo-heading" className="bg-surface-2/60 scroll-mt-[calc(var(--nav-h)+2rem)]">
        <SectionHeader
          id="demo-heading"
          heading="Run the agent, live."
          lead="This is not a video or a scripted mock. Talk to SalesBot and watch the telemetry: intent classification, slot extraction and lead scoring update with every message, ending in a CRM-ready handoff brief."
        />
        <Reveal delay={120}>
          <SalesbotDemo />
        </Reveal>
      </Section>

      {/* Capabilities */}
      <Section index="Capabilities" labelledBy="cap-heading">
        <SectionHeader
          id="cap-heading"
          heading="What it does in production."
          lead="The demo shows the qualification brain. On a live deployment, the same agent carries these capabilities on your data."
        />
        <Reveal>
          <ul className="grid gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
            {CAPABILITIES.map((c) => (
              <li key={c.title} className="flex flex-col gap-3 bg-background p-7">
                <span aria-hidden="true" className="h-2 w-2 shrink-0 bg-accent" />
                <h3 className="t-h4 pt-1">{c.title}</h3>
                <p className="t-sm text-muted">{c.text}</p>
              </li>
            ))}
          </ul>
        </Reveal>
      </Section>

      {/* Terminology */}
      <Section index="Terminology" chapter="ink" labelledBy="terms-heading">
        <SectionHeader
          id="terms-heading"
          heading="The vocabulary, precisely."
          lead="Sales agents are engineering, and the terms have exact meanings. These are the ones that matter when you evaluate any conversational agent, ours included."
        />
        <Reveal>
          <dl className="grid gap-px border border-border bg-border sm:grid-cols-2">
            {GLOSSARY.map((g) => (
              <div key={g.term} className="bg-background p-7">
                <dt className="t-h4">{g.term}</dt>
                <dd className="t-sm mt-3 text-muted">{g.def}</dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </Section>

      <DetailCta
        headingId="agent-cta-heading"
        heading="Put SalesBot on your pipeline."
        lead="Two to four weeks from scope to supervised live: trained on your product content, integrated with your CRM and calendar, guarded from day one. Bring the funnel - we'll bring the agent."
        location="agent-detail-cta"
        secondaryLabel="Explore the fleet"
        secondaryHref="/ai-agents"
      />
    </>
  );
}
