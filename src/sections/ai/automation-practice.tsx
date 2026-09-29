import Link from "next/link";
import { Section } from "@/components/ui/section";
import { SectionHeader } from "@/components/ui/section-header";
import { Reveal } from "@/components/ui/reveal";
import { Faq } from "@/components/shared/faq";
import { DetailCta } from "@/components/shared/detail-cta";
import type { AiService } from "@/constants/ai-services";

/**
 * Business Automation: the expanded /ai/automation practice page.
 * Same design language as the generic AI practice template (hero,
 * practice, workbench, process spine, FAQ, CTA) plus the automation-
 * specific chapters: the two kinds of automation, an animated visual
 * workflow (Trigger → Process → Intelligence → Decision → Action),
 * use cases across departments, the platform stack, governance, and
 * cross-links into Software & SaaS and Growth.
 */

/* ──────────────────────────────────────────────────────────────── */
/* Content                                                        */
/* ──────────────────────────────────────────────────────────────── */

const TWO_KINDS = [
  {
    label: "Workflow Automation",
    kind: "Rule-based",
    text: "Deterministic workflows that connect the business applications you already use. When this happens, do that: data moves, records update, notifications fire, reports assemble. No AI required, nothing unpredictable.",
    flow: ["Lead form", "CRM", "Lead assignment", "Email", "Slack notification", "Follow-up", "Reporting"],
  },
  {
    label: "AI-Powered Automation",
    kind: "Intelligent steps",
    text: "Workflows where AI performs the steps that need understanding: classification, extraction, generation, summarization, reasoning and decision support, bounded by confidence thresholds with human approval where it matters.",
    flow: ["Incoming email", "AI classification", "Data extraction", "CRM lookup", "AI response draft", "Human approval", "Customer response"],
  },
];

const USE_CASES = [
  { cat: "Sales", flow: ["Lead capture", "Lead enrichment", "CRM", "Qualification", "Sales assignment", "Follow-up"] },
  { cat: "Marketing", flow: ["Campaign trigger", "Audience segmentation", "Content & email", "CRM update", "Analytics"] },
  { cat: "Customer Support", flow: ["Customer request", "AI classification", "Knowledge retrieval", "Suggested response", "Human escalation", "Ticket update"] },
  { cat: "Finance", flow: ["Invoice", "Document extraction", "Validation", "Approval", "Accounting system", "Notification"] },
  { cat: "HR", flow: ["Application", "Resume processing", "Candidate classification", "ATS", "Interview scheduling", "Notification"] },
  { cat: "Operations", flow: ["Business event", "Validation", "Data processing", "System update", "Approval", "Reporting"] },
  { cat: "E-commerce", flow: ["Order", "Payment verification", "Inventory", "Fulfilment", "Customer notification", "CRM & analytics"] },
];

const PLATFORMS = {
  "Automation platforms": ["n8n", "Make", "Zapier", "Microsoft Power Automate"],
  "Integration fabric": ["Webhooks", "REST APIs", "GraphQL APIs", "Custom APIs"],
  "Data layer": ["PostgreSQL", "Supabase"],
  "Business systems": ["Google Workspace", "Microsoft 365", "Slack", "CRMs", "ERPs", "E-commerce platforms", "Payment systems"],
  "Intelligence": ["OpenAI", "Anthropic", "Gemini"],
};

const PROCESS = [
  { name: "Discover", text: "Identify repetitive processes, bottlenecks, manual handoffs and duplicated work across the business." },
  { name: "Map", text: "Map triggers, systems, users, data, decisions and exceptions, with the people who run the process today." },
  { name: "Design", text: "Design the automation architecture and decide where rules, APIs, no-code tools, custom software or AI should be used." },
  { name: "Connect", text: "Integrate applications, APIs, databases and business systems. Nothing gets replaced, everything gets connected." },
  { name: "Automate", text: "Build and test the workflows against real data and real edge cases before anything runs unsupervised." },
  { name: "Govern", text: "Add permissions, approval gates, error handling, logging and human escalation for the steps that need judgment." },
  { name: "Monitor", text: "Track workflow execution, failures, performance and business outcomes from day one, with alerting on anomalies." },
  { name: "Optimize", text: "Continuously improve the automation as processes evolve, widening automation as trust earns." },
];

const GOVERNANCE = [
  {
    title: "Security & governance",
    text: "Access follows your existing permissions and infrastructure choices. Every workflow runs under explicit scopes: what it may read, what it may write, what it may never touch.",
  },
  {
    title: "Human approval & exceptions",
    text: "Approval gates and confidence thresholds are designed in, not bolted on. When a step is uncertain or high-stakes, the workflow pauses and hands a human the full context, then resumes.",
  },
  {
    title: "Monitoring & audit trails",
    text: "Every execution is logged step by step: what was read, what was decided, on what basis, who approved what. Failures alert immediately; the trail answers any auditor's question.",
  },
];

const WF_STAGES = [
  { label: "New Lead", note: "Trigger", kind: "trigger" },
  { label: "Validate Data", note: "Process", kind: "process" },
  { label: "AI Qualification", note: "Intelligence", kind: "intelligence" },
  { label: "CRM Update", note: "Action", kind: "process" },
] as const;

/* ──────────────────────────────────────────────────────────────── */
/* Visual workflow (HTML/CSS, responsive, reduced-motion safe)     */
/* ──────────────────────────────────────────────────────────────── */

function VisualWorkflow() {
  return (
    <figure
      aria-label="How a Savo automation runs: a new lead triggers the workflow, data is validated, AI qualifies the lead, the CRM updates, a decision routes qualified leads to sales with follow-up and unqualified leads to a nurture sequence."
      className="relative mx-auto max-w-md border border-border bg-surface p-8 sm:p-10"
    >
      <figcaption className="t-label mb-8 flex items-center justify-between text-muted">
        <span>Specimen workflow: inbound lead</span>
        <span aria-hidden="true" className="flex gap-1.5">
          <span className="h-1.5 w-1.5 bg-accent schem-pulse" />
          <span className="h-1.5 w-1.5 bg-border" />
        </span>
      </figcaption>

      <div aria-hidden="true" className="wf">
        {/* Trigger → Process → Intelligence → Action */}
        {WF_STAGES.map((s, i) => (
          <div key={s.label}>
            <div className={`wf-node ${s.kind === "intelligence" ? "wf-node-accent" : ""}`} style={{ animationDelay: `${i * 0.9}s` }}>
              <span className="t-sm font-semibold text-foreground">{s.label}</span>
              <span className="t-caption text-muted">{s.note}{s.kind === "intelligence" ? ", AI step" : ""}</span>
            </div>
            {i < WF_STAGES.length ? <div className="wf-link" style={{ animationDelay: `${i * 0.9 + 0.45}s` }} /> : null}
          </div>
        ))}

        {/* Decision */}
        <div className="wf-node wf-node-decision" style={{ animationDelay: "3.6s" }}>
          <span className="t-sm font-semibold text-foreground">Qualified?</span>
          <span className="t-caption text-muted">Decision</span>
        </div>

        {/* Branches */}
        <div className="wf-branch">
          <div className="wf-branch-arm" style={{ animationDelay: "4.5s" }}>
            <span className="t-label wf-branch-tag">Yes</span>
            <div className="wf-node">
              <span className="t-sm font-semibold text-foreground">Sales Rep</span>
              <span className="t-caption text-muted">Assignment & follow-up</span>
            </div>
          </div>
          <div className="wf-branch-arm" style={{ animationDelay: "4.5s" }}>
            <span className="t-label wf-branch-tag">No</span>
            <div className="wf-node">
              <span className="t-sm font-semibold text-foreground">Nurture</span>
              <span className="t-caption text-muted">Drip sequence</span>
            </div>
          </div>
        </div>

        <div className="wf-link" style={{ animationDelay: "5.4s" }} />
        <div className="wf-node" style={{ animationDelay: "6.3s" }}>
          <span className="t-sm font-semibold text-foreground">Analytics</span>
          <span className="t-caption text-muted">Every step logged & measured</span>
        </div>
      </div>

      {/* Accessible reading of the same flow */}
      <ol className="sr-only">
        <li>New lead arrives (trigger)</li>
        <li>Data validated (process)</li>
        <li>AI qualification scores the lead (intelligence)</li>
        <li>CRM updated (action)</li>
        <li>Decision: qualified leads routed to a sales rep with follow-up; unqualified leads enter a nurture sequence</li>
        <li>Analytics: every step logged and measured</li>
      </ol>
    </figure>
  );
}

/* ──────────────────────────────────────────────────────────────── */
/* Page                                                           */
/* ──────────────────────────────────────────────────────────────── */

export function AutomationPractice({ svc }: { svc: AiService }) {
  return (
    <>
      {/* 01: The practice */}
      <Section index="The Practice" labelledBy="auto-practice-heading">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-7">
            <Reveal>
              <h2 id="auto-practice-heading" className="t-dl max-w-[14ch]">The practice.</h2>
            </Reveal>
            <Reveal delay={120}>
              <div className="mt-8 max-w-[40rem] space-y-6 border-l border-border pl-8 text-muted">
                <p className="t-body-lg">{svc.overview[0]}</p>
                <p className="t-body">{svc.overview[1]}</p>
              </div>
            </Reveal>
          </div>
          <div className="lg:col-span-5">
            <Reveal delay={200} className="lg:sticky lg:top-28">
              <div className="border border-border bg-surface p-7">
                <p className="t-label text-muted">The principle</p>
                <p className="t-h4 mt-4">No-code where it is sufficient.</p>
                <p className="t-h4 mt-1">Custom engineering where it is necessary.</p>
                <p className="t-sm mt-4 text-muted">
                  Both when that creates the best system. That is automation engineering, not tool setup.
                </p>
                <p className="t-label mt-6 text-muted">Also in the practice</p>
                <ul className="mt-4 space-y-3">
                  <li>
                    <Link href="/ai-agents" className="group flex items-center gap-3.5">
                      <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 scale-0 bg-accent transition-transform duration-300 ease-[var(--ease-out-expo)] group-hover:scale-100" />
                      <span className="t-sm font-medium text-foreground/85 group-hover:text-foreground">The agent fleet</span>
                      <span className="t-caption ml-auto text-muted">six production personas</span>
                    </Link>
                  </li>
                  {["generative-ai", "consulting", "machine-learning"].map((slug) => (
                    <li key={slug}>
                      <Link href={`/ai/${slug}`} className="group flex items-center gap-3.5">
                        <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 scale-0 bg-accent transition-transform duration-300 ease-[var(--ease-out-expo)] group-hover:scale-100" />
                        <span className="t-sm font-medium text-foreground/85 group-hover:text-foreground capitalize">{slug.replace("-", " ")}</span>
                        <span className="t-caption ml-auto text-muted">/ai/{slug}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
        </div>
      </Section>

      {/* 02: Two kinds of automation */}
      <Section index="Two Kinds" labelledBy="auto-kinds-heading" className="bg-surface-2/60">
        <SectionHeader
          id="auto-kinds-heading"
          heading="Two kinds of automation."
          lead={<>Not every automation needs AI, and some should never run without it. Knowing which is which is the engineering.</>}
        />
        <div className="mt-12 grid gap-px border border-border bg-border lg:grid-cols-2">
          {TWO_KINDS.map((k, i) => (
            <Reveal key={k.label} delay={i * 120} className="bg-background p-8 sm:p-10">
              <p className="t-label text-accent">{k.kind}</p>
              <h3 className="t-h3 mt-3">{k.label}</h3>
              <p className="t-body mt-4 text-muted">{k.text}</p>
              <p className="t-label mt-8 text-muted">Example flow</p>
              <ol className="mt-3 space-y-0 border-l border-border">
                {k.flow.map((step, j) => (
                  <li key={step} className="flex items-center gap-3 py-1.5">
                    <span aria-hidden="true" className="t-label tnum w-5 shrink-0 text-muted">{String(j + 1).padStart(2, "0")}</span>
                    <span className="t-sm text-foreground/85">{step}</span>
                  </li>
                ))}
              </ol>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* 03: Visual workflow (ink) */}
      <Section index="The Workflow" chapter="ink" labelledBy="auto-wf-heading">
        <SectionHeader
          id="auto-wf-heading"
          heading="One workflow, end to end."
          lead={<>Trigger, process, intelligence, decision, action. This is the shape of most automation we ship: an original Savo view of a lead workflow, animated as it runs.</>}
        />
        <Reveal className="mt-14" delay={160}>
          <VisualWorkflow />
        </Reveal>
      </Section>

      {/* 04: Use cases */}
      <Section index="Use Cases" labelledBy="auto-use-heading">
        <SectionHeader
          id="auto-use-heading"
          heading="Where it pays first."
          lead={<>Seven departments, seven flows business owners recognise instantly. If a process looks like any of these, it can run itself.</>}
        />
        <div className="mt-12 grid gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {USE_CASES.map((u, i) => (
            <Reveal key={u.cat} delay={(i % 3) * 100} className="bg-background p-7">
              <h3 className="t-h4">{u.cat}</h3>
              <ol className="mt-4 space-y-1">
                {u.flow.map((step, j) => (
                  <li key={step} className="t-caption flex items-center gap-2 text-muted">
                    <span aria-hidden="true" className="text-accent/70">{j === 0 ? "◆" : "→"}</span>
                    {step}
                  </li>
                ))}
              </ol>
            </Reveal>
          ))}
          <Reveal delay={200} className="flex flex-col justify-between bg-background p-7">
            <div>
              <h3 className="t-h4">Your process here</h3>
              <p className="t-sm mt-4 text-muted">
                Every business has one flow everyone tolerates and nobody enjoys. That is usually the first one we automate.
              </p>
            </div>
            <Link href="/start" className="group/btn t-sm mt-6 inline-flex items-center gap-2 font-semibold text-foreground transition-colors hover:text-accent">
              Map yours
              <svg aria-hidden="true" viewBox="0 0 14 14" className="h-3 w-3 transition-transform duration-300 group-hover/btn:translate-x-[3px]" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M1 7h11M7.5 2.5 12 7l-4.5 4.5" />
              </svg>
            </Link>
          </Reveal>
        </div>
      </Section>

      {/* 05: Platforms & technologies */}
      <Section index="The Stack" labelledBy="auto-stack-heading" className="bg-surface-2/60">
        <SectionHeader
          id="auto-stack-heading"
          heading="Technology-agnostic, honestly."
          lead={<>n8n is an important tool in our stack, one of several. The platform follows your systems, team and governance needs, never our preferences.</>}
        />
        <div className="mt-12 space-y-6">
          {Object.entries(PLATFORMS).map(([group, items], i) => (
            <Reveal key={group} delay={i * 80}>
              <div className="grid gap-4 sm:grid-cols-[10rem_1fr] sm:gap-8">
                <p className="t-label pt-2.5 text-muted">{group}</p>
                <ul className="flex flex-wrap gap-2">
                  {items.map((item) => (
                    <li key={item} className="t-caption rounded-[2px] border border-border bg-background px-3 py-1.5 text-foreground/80">{item}</li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* 06: Process (ink spine) */}
      <Section index="How It Runs" chapter="ink" labelledBy="auto-proc-heading">
        <SectionHeader
          id="auto-proc-heading"
          heading="How the work runs."
          lead={<>Eight steps, the same every time. Automation earns trust through governance, not cleverness.</>}
        />
        <Reveal>
          <ol className="relative space-y-10 sm:space-y-12">
            <div aria-hidden="true" className="absolute bottom-2 left-[5px] top-2 w-px bg-border" />
            {PROCESS.map((step, i) => (
              <li key={step.name} className={i % 2 === 1 ? "lg:ml-16" : ""}>
                <div className="relative pl-8 sm:pl-10">
                  <span aria-hidden="true" className="absolute left-0 top-[0.45rem] h-[11px] w-[11px] border border-border bg-surface" />
                  <div className="max-w-lg">
                    <h3 className="t-h3"><span className="tnum text-accent">{String(i + 1).padStart(2, "0")}</span> · {step.name}</h3>
                    <p className="t-body mt-3 text-muted">{step.text}</p>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </Reveal>
      </Section>

      {/* 07: Governance */}
      <Section index="Governance" labelledBy="auto-gov-heading" className="bg-surface-2/60">
        <SectionHeader
          id="auto-gov-heading"
          heading="Built to be trusted."
          lead={<>The difference between a script and a system is what happens when nobody is watching.</>}
        />
        <div className="mt-12 grid gap-px border border-border bg-border lg:grid-cols-3">
          {GOVERNANCE.map((g, i) => (
            <Reveal key={g.title} delay={i * 100} className="bg-background p-8">
              <span aria-hidden="true" className="mb-6 block h-2 w-2 bg-accent" />
              <h3 className="t-h4">{g.title}</h3>
              <p className="t-sm mt-4 leading-relaxed text-muted">{g.text}</p>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* 08: FAQ */}
      <Section index="Questions" labelledBy="auto-faq-heading">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-28">
              <Reveal>
                <h2 id="auto-faq-heading" className="t-dl max-w-[12ch]">Asked about automation.</h2>
                <p className="t-body mt-6 max-w-xs text-muted">The questions buyers raise, answered plainly.</p>
              </Reveal>
            </div>
          </div>
          <div className="lg:col-span-8">
            <Faq items={svc.faqs} label="Business automation, frequently asked questions" />
          </div>
        </div>
      </Section>

      {/* 09: Related + CTA */}
      <Section index="Related" labelledBy="auto-rel-heading" className="bg-surface-2/60">
        <SectionHeader
          id="auto-rel-heading"
          heading="Automation is never alone."
          lead={<>It lands next to the disciplines it serves: the software it extends, the agents it routes through, the growth it feeds.</>}
        />
        <div className="mt-12 grid gap-px border border-border bg-border sm:grid-cols-3">
          {[
            { title: "Software & SaaS", body: "When workflows outgrow no-code, the custom systems underneath are our home ground.", href: "/services/custom-software-development" },
            { title: "AI agent fleet", body: "Agentic systems that reason over your data and tools, with automation as their hands.", href: "/ai-agents" },
            { title: "Growth & SEO", body: "Automation feeds growth: pipelines of content, data and measurement that never sleep.", href: "/services" },
          ].map((r, i) => (
            <Reveal key={r.title} delay={i * 100}>
              <Link href={r.href} className="group flex h-full flex-col gap-3 bg-background p-7 transition-colors duration-300 hover:bg-foreground hover:text-background">
                <h3 className="t-h3">{r.title}</h3>
                <p className="t-body text-muted group-hover:text-background/80">{r.body}</p>
              </Link>
            </Reveal>
          ))}
        </div>
      </Section>

      <DetailCta
        headingId="auto-cta-heading"
        heading="Automate the work between the work."
        lead="Tell us the process and the systems it touches. We will say honestly whether it needs rules, AI, or both, and map the first workflow if it pays."
        location="ai-automation-cta"
        secondaryLabel="Meet the Fleet"
        secondaryHref="/ai-agents"
      />
    </>
  );
}
