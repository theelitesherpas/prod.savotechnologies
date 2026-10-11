"use client";

import Link from "next/link";
import Image from "next/image";
import { Reveal } from "@/components/ui/reveal";
import { useState, useCallback } from "react";
import { useProjectModal } from "@/components/shared/project-lead-modal";
import { ArrowIcon, IconChip, SERVICE_ICONS } from "@/sections/home-v2/icons";
import { SERVICES } from "@/constants/services";
import { INDUSTRIES_ATLAS } from "@/constants/industries";
import type { ArticlePreview } from "@/sections/insights/insights-content";
import { PortfolioShowcase } from "./portfolio";
import type { HomePortfolioFeatures } from "./portfolio-content";
import { AICapabilities } from "./ai-capabilities";
import { TestimonialMedia } from "./testimonial-media";
import styles from "./homepage.module.css";
import { HOME_COPY, HOME_SERVICE_COPY, HOME_PROCESS_STEPS } from "./homepage-copy";

/**
 * HOMEPAGE V2 - the modern IT-services sections: icon service cards,
 * dark AI band, tech marquee, image work cards, industry tiles,
 * process rail, proof points, testimonial, insights, CTA band.
 * (Reuses verified content constants; demo gating preserved.)
 */

/* ── shared bits ─────────────────────────────────────────────────── */

function SectionHead({
  eyebrow,
  title,
  lead,
  center = false,
}: {
  eyebrow?: string;
  title: string;
  lead?: string;
  center?: boolean;
}) {
  return (
    <div className={`${styles.sectionHead} ${center ? styles.centerHead : ""}`}>
      {eyebrow ? (
        <p className="t-label inline-flex items-center gap-2.5 font-semibold uppercase tracking-[0.14em] text-[#FF3333]">
          <span aria-hidden="true" className="h-1.5 w-1.5 bg-[#FF3333]" />
          {eyebrow}
        </p>
      ) : null}
      <h2>{title}</h2>
      {lead ? <p>{lead}</p> : null}
    </div>
  );
}

/* ── 01 · Services: icon card grid ───────────────────────────────── */

export function ServicesV2() {
  const hrefs: Record<string, string> = {
    web: "/services/web-development", mobile: "/services/mobile-app-development", ai: "/ai-agents",
    software: "/services/custom-software-development", design: "/services/ui-ux-design", growth: "/services/digital-marketing",
  };
  return (
    <section id="services" data-home-section="services" className={styles.services}>
      <div className="mx-auto px-5 sm:px-8">
        <SectionHead
          center
          title={HOME_COPY.services.title}
          lead={HOME_COPY.services.lead}
        />
        <div className={styles.serviceGrid}>
          {SERVICES.map((sv) => (
            <Link key={sv.id} href={hrefs[sv.id] ?? "/services"} className={styles.service}>
              <IconChip name={SERVICE_ICONS[sv.id] ?? "spark"} size="sm" />
              <div><h3>{HOME_SERVICE_COPY[sv.id]?.title ?? sv.title}<ArrowIcon size={14} /></h3><p>{HOME_SERVICE_COPY[sv.id]?.body ?? sv.positioning}</p></div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── 02 · AI band (dark) ─────────────────────────────────────────── */

export function AIBandV2() {
  return <AICapabilities engineering={SOLUTIONS} />;
}

/* ── Solutions: capability blocks with tech stacks ───────────────── */

const SOLUTIONS = [
  {
    icon: "bot" as const,
    title: "AI Agent Development",
    body: "Build agents that use approved tools to work through business tasks, with access controls, quality checks and human approval where it is needed.",
    tags: ["OpenAI", "Anthropic", "RAG", "Tool Calling"],
  },
  {
    icon: "chart" as const,
    title: "Machine Learning Development",
    body: "Plan and build forecasting and prediction models, including the data preparation, evaluation and monitoring needed to keep them useful.",
    tags: ["Python", "TensorFlow", "scikit-learn", "Pandas"],
  },
  {
    icon: "spark" as const,
    title: "Chatbot Development",
    body: "Help people find answers through a website, app or messaging service. Connect the assistant to your knowledge base and make it clear when the conversation needs a person.",
    tags: ["LLMs", "WhatsApp", "Web Chat", "Voice"],
  },
  {
    icon: "layers" as const,
    title: "Robotic Process Automation",
    body: "Automate repetitive steps such as transferring information between systems, processing documents and routing requests, with a way to review exceptions.",
    tags: ["n8n", "Power Automate", "Custom APIs"],
  },
  {
    icon: "compass" as const,
    title: "Data Science Consulting",
    body: "Work out which information your team needs, how to organise it and how to turn it into reports and dashboards that support decisions.",
    tags: ["SQL", "dbt", "Power BI", "Metabase"],
  },
  {
    icon: "code" as const,
    title: "Web & Software Development",
    body: "Develop web platforms and business software around your requirements, with attention to integrations, performance and how the product will be maintained.",
    tags: ["Next.js", "Node.js", ".NET", "PostgreSQL"],
  },
];

export function SolutionsV2() {
  return (
    <section className="bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
        <SectionHead
          center
          title="We create new solutions with technology that beat industry best timelines."
          lead="From AI agents to enterprise platforms, every capability below is work we deliver today with senior teams and proven stacks."
        />
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {SOLUTIONS.map((c, i) => (
            <Reveal key={c.title} delay={i * 50}>
              <div className="v2-card flex h-full flex-col border border-[#E8E8E8] bg-white p-7" style={{ borderRadius: 10 }}>
                <IconChip name={c.icon} />
                <h3 className="mt-5 font-serif text-[1.15rem] font-semibold leading-snug text-black">{c.title}</h3>
                <p className="mt-2.5 flex-1 text-[0.9375rem] leading-relaxed text-[#757575]">{c.body}</p>
                <div className="mt-5 flex flex-wrap gap-2 border-t border-[#ECECF0] pt-4">
                  {c.tags.map((t) => (
                    <span key={t} className="t-label border border-[#E8E8E8] bg-[#F7F7F7] px-2.5 py-1 font-medium text-[#757575]">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Technologies & Platforms: 16-per-page slider ─────────────────── */

const ALL_TECH = [
  { slug: "nextdotjs", name: "Next.js" },
  { slug: "react", name: "React" },
  { slug: "typescript", name: "TypeScript" },
  { slug: "nodedotjs", name: "Node.js" },
  { slug: "python", name: "Python" },
  { slug: "flutter", name: "Flutter" },
  { slug: "postgresql", name: "PostgreSQL" },
  { slug: "mongodb", name: "MongoDB" },
  { slug: "redis", name: "Redis" },
  { slug: "graphql", name: "GraphQL" },
  { slug: "prisma", name: "Prisma" },
  { slug: "tailwindcss", name: "Tailwind CSS" },
  { slug: "docker", name: "Docker" },
  { slug: "kubernetes", name: "Kubernetes" },
  { slug: "googlecloud", name: "Google Cloud" },
  { slug: "vercel", name: "Vercel" },
  { slug: "supabase", name: "Supabase" },
  { slug: "firebase", name: "Firebase" },
  { slug: "cloudflare", name: "Cloudflare" },
  { slug: "dotnet", name: ".NET" },
  { slug: "swift", name: "Swift" },
  { slug: "kotlin", name: "Kotlin" },
  { slug: "openai", name: "OpenAI" },
  { slug: "anthropic", name: "Anthropic" },
  { slug: "tensorflow", name: "TensorFlow" },
  { slug: "pytorch", name: "PyTorch" },
  { slug: "scikitlearn", name: "scikit-learn" },
  { slug: "pandas", name: "Pandas" },
  { slug: "figma", name: "Figma" },
  { slug: "gitlab", name: "GitLab" },
  { slug: "github", name: "GitHub" },
  { slug: "terraform", name: "Terraform" },
  { slug: "stripe", name: "Stripe" },
  { slug: "twilio", name: "Twilio" },
  { slug: "sendgrid", name: "SendGrid" },
  { slug: "jest", name: "Jest" },
  { slug: "cypress", name: "Cypress" },
  { slug: "playwright", name: "Playwright" },
  { slug: "sentry", name: "Sentry" },
  { slug: "datadog", name: "Datadog" },
  { slug: "laravel", name: "Laravel" },
  { slug: "fastapi", name: "FastAPI" },
  { slug: "nginx", name: "Nginx" },
  { slug: "webpack", name: "Webpack" },
  { slug: "vite", name: "Vite" },
  { slug: "jenkins", name: "Jenkins" },
  { slug: "raspberrypi", name: "Raspberry Pi" },
  { slug: "reactnative", name: "React Native" },
];

const PER_PAGE = 16;
const TECH_PAGES = Math.ceil(ALL_TECH.length / PER_PAGE);

export function TechnologiesGridV2() {
  const [page, setPage] = useState(0);

  const go = useCallback((dir: 1 | -1) => {
    setPage((p) => (p + dir + TECH_PAGES) % TECH_PAGES);
  }, []);

  const visible = ALL_TECH.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE);

  return (
    <section data-home-section="technology" className="bg-black text-white" aria-label="Technologies and platforms">
      <div className="mx-auto px-5 sm:px-8">
        <div className="mx-auto max-w-[46rem] text-center">
          <h2 className="font-serif text-[clamp(1.7rem,3.4vw,2.7rem)] font-semibold leading-[1.1] tracking-[-0.018em] text-white">
            {HOME_COPY.technology.title}
          </h2>
          <p className="mx-auto mt-4 max-w-[65ch] text-[1rem] leading-relaxed text-[#b0b0b0]">
            {HOME_COPY.technology.lead}
          </p>
        </div>

        {/* 16-per-page grid with slide animation */}
        <div className="relative mt-9" id="home-technology-grid">
          <div
            key={page}
            className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
            style={{ animation: "techPageIn 600ms cubic-bezier(0.22,1,0.36,1) both" }}
          >
            {visible.map((t) => (
              <div
                key={t.slug}
                className="group flex h-full flex-col items-center justify-center gap-3 border border-white/10 bg-white/[0.04] px-3 py-5 transition-colors duration-300 hover:border-[#FF3333] hover:bg-white/[0.08]"
                style={{ borderRadius: 10 }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- official brand marks via simple-icons CDN */}
                <img
                  src={`/images/technology/${t.slug}.svg`}
                  alt={`${t.name} logo`}
                  width={36}
                  height={36}
                  loading="lazy"
                  style={t.slug === "playwright" ? { filter: "grayscale(1) brightness(0) invert(1)" } : undefined}
                  className="h-9 w-9 object-contain opacity-75 transition-opacity duration-300 group-hover:opacity-100"
                />
                <span className="t-caption font-medium text-[#b0b0b0] transition-colors duration-300 group-hover:text-white">
                  {t.name}
                </span>
              </div>
            ))}
          </div>

        </div>

        {/* Navigation: arrows flank the dots in one centered row */}
        <div className={styles.techControls} aria-label="Technology pages">
          <button
            type="button"
            aria-label="Previous technologies"
            onClick={() => go(-1)}
            aria-controls="home-technology-grid"
          >
            <svg viewBox="0 0 14 14" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 7H2M7.5 12.5 2 7l5.5-5.5" />
            </svg>
          </button>

          <div className={styles.techDots}>
            {Array.from({ length: TECH_PAGES }).map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Technologies page ${i + 1}`}
                onClick={() => setPage(i)}
                aria-current={i === page ? "true" : undefined}
                aria-controls="home-technology-grid"
              ><span aria-hidden="true" /></button>
            ))}
          </div>

          <button
            type="button"
            aria-label="Next technologies"
            onClick={() => go(1)}
            aria-controls="home-technology-grid"
          >
            <svg viewBox="0 0 14 14" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 7h11M7.5 2.5 12 7l-4.5 4.5" />
            </svg>
          </button>

          <span role="status" aria-live="polite" aria-label={`Technology page ${page + 1} of ${TECH_PAGES}`}>{page + 1} / {TECH_PAGES}</span>
        </div>
      </div>
    </section>
  );
}

/* ── 04 · Selected work: interactive product exhibition ──────────── */

export function WorkV2({ features = {} }: { features?: HomePortfolioFeatures }) {
  return <PortfolioShowcase features={features} />;
}

/* ── 05 · Industries: photographic sector cards ──────────────────── */

export function IndustriesV2() {
  return (
    <section className="bg-[#F7F7F7] py-16 sm:py-24">
      <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
        <SectionHead
          title="Ten sectors, real operational depth."
          lead="We speak your industry&rsquo;s language. Deep workflow knowledge, the right integrations and AI that fits the way you already work."
        />

        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {INDUSTRIES_ATLAS.map((ind, i) => {
            const featured = i < 2; /* first two cards span wide on desktop */
            return (
              <Reveal key={ind.id} delay={i * 45} className={featured ? "sm:col-span-2" : ""}>
                <Link
                  href={`/industries/${ind.id}`}
                  className={`group relative block w-full overflow-hidden border border-[#E8E8E8] bg-black ${featured ? "aspect-[16/9] sm:aspect-[2/1] lg:aspect-[2.15/1]" : "aspect-[4/3]"}`}
                  style={{ borderRadius: 10 }}
                >
                  {/* The photograph */}
                  <Image
                    src={`/images/sectors/${ind.id}-hero.webp`}
                    alt={ind.title}
                    fill
                    sizes={featured ? "(max-width: 1024px) 100vw, 50vw" : "(max-width: 640px) 100vw, 25vw"}
                    className="object-cover brightness-[0.88] transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.06] group-hover:brightness-100"
                  />
                  {/* Scrim for text legibility */}
                  <span
                    aria-hidden="true"
                    className="absolute inset-0 bg-gradient-to-t from-[#000000d9] via-[#00000038] to-transparent transition-opacity duration-500"
                  />
                  {/* Red index mark */}
                  <span className="t-label absolute left-4 top-4 rounded bg-[#000000a6] px-2.5 py-1 font-semibold tabular-nums text-white backdrop-blur-sm">
                    {ind.index}
                  </span>
                  {/* Name + hint OVER the image */}
                  <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-5">
                    <span className="min-w-0">
                      <span className={`block font-serif font-semibold leading-tight text-white ${featured ? "text-[clamp(1.3rem,2.4vw,1.8rem]" : "text-[1.15rem]"}`}>
                        {ind.title}
                      </span>
                      <span className="t-caption mt-1 block truncate text-white/70 transition-colors duration-500 group-hover:text-white/95">
                        {ind.hint}
                      </span>
                    </span>
                    {/* Arrow chip animates in on hover */}
                    <span
                      aria-hidden="true"
                      className="flex h-9 w-9 shrink-0 translate-y-2 items-center justify-center rounded-full bg-[#FF3333] text-white opacity-0 shadow-[0_8px_20px_rgb(255_51_51/0.5)] transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-y-0 group-hover:opacity-100"
                    >
                      <svg viewBox="0 0 14 14" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 7h11M7.5 2.5 12 7l-4.5 4.5" />
                      </svg>
                    </span>
                  </span>
                  {/* Red base line draws on hover */}
                  <span
                    aria-hidden="true"
                    className="absolute bottom-0 left-0 right-0 h-[3px] origin-left scale-x-0 bg-[#FF3333] transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-x-100"
                  />
                </Link>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ── 06 · Process: the delivery spine ────────────────────────────── */

export function ProcessV2() {
  const { open } = useProjectModal();
  const STEPS = HOME_PROCESS_STEPS;
  return (
    <section data-home-section="process" className={styles.process}>
      <div className="mx-auto px-5 sm:px-8">
        <SectionHead
          center
          title={HOME_COPY.process.title}
          lead={HOME_COPY.process.lead}
        />
        <ol className={styles.processSteps} aria-label="Project delivery phases">
          {STEPS.map((st) => (
            <li key={st.name} className={styles.processStep}><h3>{st.name}</h3><p>{st.text}</p></li>
          ))}
        </ol>
        <div className={styles.processAction}>
          <button type="button" onClick={() => open({ source: "home-process" })} className={styles.primaryButton}>
            Start a Project <ArrowIcon size={16} />
          </button>
        </div>
      </div>
    </section>
  );
}

/* ── 07 · Video testimonials - highlighted-color showcase ────────── */

export type VideoTestimonial = {
  quote?: string;
  name: string;
  role: string;
  country?: string;
  photo?: string;
  video?: string;
};

export function TestimonialsVideoV2({ items, demo }: { items: VideoTestimonial[]; demo: boolean }) {
  return (
    <section data-home-section="proof" className={styles.proof}>
      <div className="mx-auto px-5 sm:px-8">
        <div className={styles.proofHeader}>
          <div><h2 className={styles.sectionTitle}>{HOME_COPY.proof.title}</h2>
            <p>{HOME_COPY.proof.lead}{demo ? " These are layout previews, not client endorsements." : ""}</p>
          </div>
          {demo ? <span className={styles.previewNotice}>Design preview</span> : null}
        </div>
        {items.length === 0 ? (
          <p className="mt-8 text-[#666]">No approved stories are published yet.</p>
        ) : (
          <div className={styles.proofGrid}>
            {items.slice(0, 4).map((t, i) => (
              <article key={t.name + i} className={styles.proofCard}>
                <TestimonialMedia photo={t.photo} video={t.video} preview={demo} name={t.name} />
                <div className={styles.proofIdentity}>
                  <p>{t.name}</p><p>{t.role}{t.country ? ` · ${t.country}` : ""}</p>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/* ── 08 · Insights cards ─────────────────────────────────────────── */

export function InsightsV2({ articles = [] }: { articles?: ArticlePreview[] }) {
  const latest = articles.slice(0, 3);
  const coverTopics: Record<string, string> = {
    "how-to-review-a-technical-proposal": "Read beyond the price.",
    "fixed-scope-vs-dedicated-team": "Choose the right engagement.",
    "source-code-ownership": "Keep ownership clear.",
  };
  return (
    <section data-home-section="insights" className="bg-[#F7F7F7]">
      <div className="mx-auto px-5 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHead
            title={HOME_COPY.insights.title}
            lead={HOME_COPY.insights.lead}
          />
          <Reveal delay={80}>
            <Link
              href="/insights"
              className="inline-flex min-h-12 items-center gap-3 rounded-[4px] border border-[#d8d8de] px-6 text-[0.875rem] font-semibold text-black transition-colors hover:border-black"
            >
              Explore Insights <ArrowIcon size={16} />
            </Link>
          </Reveal>
        </div>
        {latest.length === 0 ? <p className="mt-7 max-w-2xl text-[0.875rem] leading-relaxed text-[#626262]">Explore the topic guides in Insights. The article library has no published entries yet.</p> : <div className="mt-9 grid gap-6 md:grid-cols-3">
          {latest.map((a, i) => (
            <Reveal key={a.slug} delay={i * 60}>
              <Link
                href={`/insights/${a.slug}`}
                className="v2-card group flex h-full flex-col overflow-hidden border border-[#e8e8ec] bg-white" style={{ borderRadius: 10 }}
              >
                <div className="relative aspect-[16/9] overflow-hidden">
                  <Image src={a.image} alt="" fill sizes="(max-width: 768px) 100vw, 33vw" className="photo object-cover" />
                  <span aria-hidden="true" className={styles.articleCover}><span>{coverTopics[a.slug] ?? a.cat}</span></span>
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <p className="t-label font-semibold text-[#b82222]">{a.cat}</p>
                  <h3 className="mt-2.5 font-serif text-[1.08rem] font-semibold leading-snug text-black">{a.title}</h3>
                  <p className="mt-2.5 flex-1 text-[0.875rem] leading-relaxed text-[#757575]">{a.excerpt}</p>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>}
      </div>
    </section>
  );
}
