import Link from "next/link";
import type { CaseStudy } from "@/lib/case-study-schema";
import { DetailCta } from "@/components/shared/detail-cta";
import { TrackView } from "@/components/ui/track-view";
import type { PreviewProject } from "./preview-projects";
import { PortfolioArrow, PortfolioCardView } from "./portfolio-sections";
import { publishedVisuals, projectGalleryVisuals, safeProjectLiveHref, type PortfolioCard } from "./portfolio-content";
import { ProjectGallery } from "./project-gallery";
import { CaseStudyHero } from "./project-hero";
import { ClientPerspective, NotableFeatures, ProjectFacts, SimilarProjectCard, TechnologyAndPalette } from "./project-detail-sections";
import styles from "./portfolio.module.css";
import details from "./project-details.module.css";

// User-pinned visual detail upgrade. Product → facts → focused story/enquiry →
// gallery → features → technology/palette → client perspective → supporting notes.
// Review material remains explicit; actual client records keep their own facts.
function Prose({ text }: { text: string | undefined }) { return text ? <div className={styles.prose}>{text.split(/\n\s*\n/).filter(Boolean).map((p, i) => <p key={i}>{p}</p>)}</div> : null; }
export function ProjectStory({ study, concept, related }: { study?: CaseStudy; concept?: PreviewProject; related: PortfolioCard[] }) {
  if (!study && !concept) return null;
  const preview = !!concept;
  const name = concept?.name ?? (study!.nda ? (study!.displayClientName || "Confidential project") : (study!.displayClientName || study!.title));
  const summary = concept?.summary ?? study!.summary;
  const introduction = concept?.summary ?? (study!.introduction?.trim() || study!.summary);
  const industry = concept?.industry ?? study!.industry;
  const visuals = concept?.visuals ?? publishedVisuals(study!);
  const gallery = concept?.visuals ?? projectGalleryVisuals(study!);
  const dossier = study?.dossier;
  const challenge = concept?.challenge ?? (dossier?.challenge || study?.challenge);
  const solution = concept?.solution ?? study?.solution;
  const features = concept?.features ?? study?.keyFeatures ?? [];
  const technologies = concept?.technologies ?? study!.technologies;
  const palette = concept?.palette ?? study?.palette ?? [];
  const liveUrl = safeProjectLiveHref(study?.liveUrl);
  const facts: [string, string][] = concept?.layoutFacts ?? (preview ? [["Format", "Original design study"], ["Focus", concept!.industry]] : [
    ["Client", name], ["Industry", study!.industry], ["Location", study!.clientLocation], ["Business Model", study!.businessModel], ["Platforms", study!.platforms], ["Year", study!.year], ["Duration", study!.duration], ["Team", study!.teamSize],
  ]).filter(([, value]) => value) as [string, string][];
  return <div className={`${styles.page} ${details.page}`} data-case-studies-page={preview ? "project-preview" : "project"}>
    {study ? <TrackView event="case_study_viewed" data={{ slug: study.slug, level: study.level }}><span /></TrackView> : null}
    <CaseStudyHero name={name} industry={industry} introduction={introduction} liveUrl={liveUrl} visual={visuals[0]}>
      {preview ? <details className={`${styles.previewNotice} ${styles.previewDisclosure}`}><summary>Design preview · Not client work.</summary><p>{concept!.boundaries}</p></details> : study?.nda ? <p className={styles.confidential}>Client identity withheld under the engagement’s confidentiality agreement.</p> : null}
    </CaseStudyHero>
    {facts.length ? <div className={details.informationBand} data-project-information-band><div className={styles.rail}><ProjectFacts facts={facts} example={!!concept?.layoutFacts} /></div></div> : null}
    <div className={styles.rail}>
      <section id="context" className={details.context} aria-labelledby="context-heading"><SimilarProjectCard source={preview ? `case-study-preview-${concept!.slug}-middle` : `case-study-${study!.slug}-middle`} /><div className={details.contextStory}><h2 id="context-heading">{preview ? "A clearer experience." : "The idea. The execution."}</h2>{challenge ? <div><h3>{preview ? "The design challenge" : "The challenge"}</h3><Prose text={challenge} /></div> : null}{solution ? <div><h3>{preview ? "The proposed experience" : "The solution"}</h3><Prose text={solution} /></div> : null}{!challenge && !solution ? <Prose text={concept?.brief || dossier?.aboutClient || summary} /> : null}</div></section>
    </div>
    {gallery.length ? <section id="interfaces" className={details.gallerySection} aria-labelledby="interfaces-heading"><div className={styles.rail}><div className={details.sectionHeading}><h2 id="interfaces-heading">Inside the experience.</h2><p>{preview ? "Original concept interfaces - not delivered screenshots." : "Explore the project’s screens and detail views."}</p></div><ProjectGallery images={gallery} name={name} /></div></section> : null}
    <div className={styles.rail}>
      <NotableFeatures features={features} preview={preview} />
      <TechnologyAndPalette technologies={technologies} palette={palette} preview={preview} />
      {study?.authorName ? <p className={details.authorCredit}>Case study by {study.authorName}</p> : null}
      <ClientPerspective testimonial={study?.testimonial} preview={preview} />
      <section id="project-next" className={details.next} aria-labelledby="project-next-heading"><div className={details.sectionHeading}><h2 id="project-next-heading">{preview ? "Keep exploring." : "More from the portfolio."}</h2><Link href="/case-studies#work" className={styles.textLink}>View all projects<PortfolioArrow /></Link></div>{related.length ? <div className={styles.related}>{related.slice(0, 2).map(entry => <PortfolioCardView key={entry.slug} entry={entry} />)}</div> : null}</section>
    </div>
    <DetailCta headingId="cs-cta-heading" heading="Have a product in mind?" lead="Share the idea, the people it needs to serve and the constraints that matter." location={preview ? `case-study-preview-${concept!.slug}-close` : "case-study-close"} secondaryLabel="Browse Services" secondaryHref="/services" />
  </div>;
}
