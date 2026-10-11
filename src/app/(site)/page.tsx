import { getManagedArticles, getManagedTestimonials } from "@/lib/content-items";
import { articlePreview } from "@/sections/insights/insights-content";
import { getCaseStudies } from "@/lib/case-studies";
import { buildHomePortfolioFeatures } from "@/sections/home-v2/portfolio-content";
import { DEMO_LEAD_TESTIMONIALS } from "@/constants/testimonials";
import { IS_DEMO } from "@/lib/content-mode";
import { HeroV2 } from "@/sections/home-v2/hero";
import {
  ServicesV2,
  AIBandV2,
  TechnologiesGridV2,
  WorkV2,
  ProcessV2,
  TestimonialsVideoV2,
  InsightsV2,
} from "@/sections/home-v2/sections";
import { BrandStatement } from "@/sections/home/brand-statement";
import { FinalCTA } from "@/sections/home/final-cta";
import { HomeFaq } from "@/sections/home/home-faq";
import { IndustryFan } from "@/sections/home-v2/industry-fan";
import styles from "@/sections/home-v2/homepage.module.css";

/**
 * Savo Technologies - homepage (v2: modern IT-services look).
 *
 * Composition: hero + logos → services → portfolio → consolidated AI →
 * industries → process → client proof → technology → insights → FAQ →
 * belief → final CTA. The shared footer closes the page.
 *
 */

export const revalidate = 0; // always fresh: managed content

export default async function HomePage() {
  const [managedTestimonials, articles, caseStudies] = await Promise.all([getManagedTestimonials(), getManagedArticles(), getCaseStudies()]);
  const videoTestimonials =
    managedTestimonials.length > 0 ? managedTestimonials : IS_DEMO ? DEMO_LEAD_TESTIMONIALS.map((t) => ({ ...t, video: undefined })) : [];

  return (
    <div className={styles.page}>
      <HeroV2 />
      <ServicesV2 />
      <WorkV2 features={buildHomePortfolioFeatures(caseStudies)} />
      <AIBandV2 />
      <IndustryFan />
      <ProcessV2 />
      <TestimonialsVideoV2 items={videoTestimonials} demo={IS_DEMO && managedTestimonials.length === 0} />
      <TechnologiesGridV2 />
      <InsightsV2 articles={articles.slice(0, 3).map(articlePreview)} />
      <HomeFaq />
      <BrandStatement />
      <FinalCTA />
    </div>
  );
}
