import Link from "next/link";
import type { ReactNode } from "react";
import { StartProjectButton } from "@/components/shared/start-project-button";
import type { PortfolioVisual } from "./portfolio-content";
import { PortfolioArrow } from "./portfolio-sections";
import portfolio from "./portfolio.module.css";
import styles from "./project-hero.module.css";

// Owner-pinned reference: Kunal Chhajer's Case Study & Portfolio Page (Dribbble
// 23670874). Adapt its unified information-left / artwork-right showcase, not
// its serif identity, device mockup, decorative circle or unverified results.
// Savo's existing type/red, project identity and original 16:9 cover lead.
// Owner refinement: no separate project logo or service-scope row in the hero.
// Small screens read identity → artwork → introduction/actions. Everything
// below this hero retains its existing composition and managed content.
export function CaseStudyHero({ name, industry, introduction, liveUrl, visual, children }: {
  name: string;
  industry: string;
  introduction: string;
  liveUrl: string | null;
  visual?: PortfolioVisual;
  children?: ReactNode;
}) {
  return <header className={styles.hero} data-case-study-hero>
    <div className={portfolio.rail}>
      <Link href="/case-studies#work" className={styles.backLink} aria-label="Back to all case studies"><PortfolioArrow />All case studies</Link>
      <div className={styles.layout} data-with-cover={!!visual}>
        <div className={styles.identity}>
          <h1>{name}</h1>
          {industry ? <p className={styles.industry}>{industry}</p> : null}
          {children ? <div className={styles.notice}>{children}</div> : null}
        </div>
        {visual ? <div className={styles.visual}><CaseStudyCover visual={visual} /></div> : null}
        <div className={styles.copy}>
          {introduction ? <p className={styles.summary}>{introduction}</p> : null}
          <div className={styles.actions}>
            {liveUrl ? <a className={styles.liveLink} href={liveUrl} target="_blank" rel="noopener noreferrer">Explore Live Website<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M5 19 19 5M5 5h14v14" /></svg></a> : null}
            <StartProjectButton label="Discuss a Similar Project" source="case-study-hero" />
          </div>
        </div>
      </div>
    </div>
  </header>;
}

export function CaseStudyCover({ visual }: { visual: PortfolioVisual }) {
  return <figure className={styles.coverFrame} data-case-study-cover>
    {/* Stored covers are already compressed and served through the cacheable
        image endpoint. No alternate sizes exist to advertise in a srcset. */}
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={visual.src} alt={visual.alt} width={visual.width} height={visual.height} loading="eager" fetchPriority="high" decoding="async" className={styles.coverImage} />
  </figure>;
}
