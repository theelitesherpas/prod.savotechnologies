"use client";

import Link from "next/link";
import { ArrowIcon, ChevronDownIcon, LineIcon } from "./icons";
import styles from "./ai-capabilities.module.css";
import { HOME_COPY } from "./homepage-copy";

type EngineeringCapability = { title: string; body: string; tags: string[]; icon: string };

const CAPABILITIES = [
  { title: "Agents that take action", body: "Let an agent use approved tools to handle steps in a workflow, with people approving decisions that need judgement.", href: "/ai-agents", icon: "bot" },
  { title: "Answers from your own information", body: "Help your team search documents and ask questions, with retrieval, source citations and quality checks built into the design.", href: "/ai/generative-ai", icon: "layers" },
  { title: "Less repetitive work", body: "Connect everyday business systems and automate routine handovers, while keeping exceptions and approvals visible to the team.", href: "/ai/automation", icon: "spark" },
  { title: "A clear plan before you invest", body: "Work through feasibility, data readiness and delivery priorities before committing to an AI project.", href: "/ai/consulting", icon: "compass" },
] as const;

export function AICapabilities({ engineering }: { engineering: EngineeringCapability[] }) {
  return (
    <section id="ai" data-home-section="ai" aria-labelledby="home-ai-heading" className={styles.section}>
      <div className={styles.shell}>
        <div className={styles.main}>
          <div className={styles.intro}>
            <h2 id="home-ai-heading">{HOME_COPY.ai.title}</h2>
            <p>{HOME_COPY.ai.lead}</p>
            <Link href="/ai-agents" className={styles.action}>Explore AI capabilities <ArrowIcon size={16} /></Link>
          </div>
          <div className={styles.capabilities}>
            {CAPABILITIES.map((item) => (
              <Link key={item.title} href={item.href} className={styles.capability}>
                <span className={styles.icon}><LineIcon name={item.icon} className="h-[22px] w-[22px]" /></span>
                <div><h3>{item.title}</h3><p>{item.body}</p></div>
                <ArrowIcon size={16} />
              </Link>
            ))}
          </div>
        </div>
        <details className={styles.engineering}>
          <summary>More ways we can help with software and data <ChevronDownIcon size={18} /></summary>
          <div className={styles.engineeringList}>
            {engineering.map((item) => (
              <div key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
                <ul aria-label={`${item.title} technologies`}>{item.tags.map((tag) => <li key={tag}>{tag}</li>)}</ul>
              </div>
            ))}
          </div>
        </details>
      </div>
    </section>
  );
}
