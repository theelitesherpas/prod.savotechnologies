import Image from "next/image";
import { StartProjectButton } from "@/components/shared/start-project-button";
import type { CaseStudy } from "@/lib/case-study-schema";
import styles from "./project-details.module.css";

type Feature = { title: string; text: string };
type Swatch = { name: string; hex: string };
export function DetailIcon({ kind = 0 }: { kind?: number }) {
  const paths = [
    <><rect x="5" y="3" width="14" height="18" rx="3" /><path d="M9 7h6M9 11h6M10 17h4" /></>,
    <><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M7 3v4m10-4v4M3 11h18m-13 4h3m3 0h2" /></>,
    <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    <><path d="M8 3h8l3 3v15H5V3h3Zm0 6h8m-8 4h8m-8 4h5M16 3v4h3" /></>,
    <><path d="M4 6h16v14H4zM8 6V3h8v3M8 13l3 3 5-6" /></>,
    <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M8 10h8m-8 4h5m-1 5v3m-4 0h8" /></>,
  ];
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">{paths[kind % paths.length]}</svg>;
}
export function SimilarProjectCard({ source }: { source: string }) {
  return <aside className={styles.similarCard} aria-labelledby="similar-project-heading" data-similar-project>
    <svg aria-hidden="true" className={styles.similarArt} viewBox="0 0 180 110" fill="none"><rect x="6" y="6" width="111" height="75" rx="7" stroke="currentColor" strokeWidth="2" /><path d="M6 25h111M21 16h1m7 0h1m7 0h1M21 40h36m-36 11h65m-65 11h47" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /><rect x="125" y="31" width="47" height="73" rx="7" stroke="currentColor" strokeWidth="2" /><path d="M139 42h18m-18 11h18m-18 11h11m-4 28h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
    <h2 id="similar-project-heading">Your idea.<br />Our next build.</h2><p>Let’s create something like this - shaped around your business.</p>
    <StartProjectButton label="Start a Similar Project" source={source} />
  </aside>;
}
export function ProjectFacts({ facts, example = false }: { facts: [string, string][]; example?: boolean }) {
  if (!facts.length) return null;
  return <section className={styles.information} aria-labelledby="project-information-heading"><div className={styles.informationHeading}><h2 id="project-information-heading">Project information.</h2>{example ? <p>Layout example · Not Aster Health project facts</p> : null}</div><dl className={styles.factGrid}>{facts.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></section>;
}
export function NotableFeatures({ features, preview = false }: { features: Feature[]; preview?: boolean }) {
  if (!features.length) return null;
  return <section id="features" className={styles.featureSection} aria-labelledby="features-heading"><div className={styles.sectionHeading}><h2 id="features-heading">Notable features.</h2>{preview ? <p>Capabilities explored in this design concept.</p> : null}</div><div className={styles.featureGrid}>{features.slice(0, 6).map((feature, index) => <article key={`${feature.title}-${index}`} className={styles.featureCard}><DetailIcon kind={index} /><h3>{feature.title}</h3><p>{feature.text}</p></article>)}</div></section>;
}
const TECHNOLOGY_IMAGES: Record<string, string> = { flutter: "flutter", postgresql: "postgresql", "next.js": "nextdotjs", typescript: "typescript", "node.js": "nodedotjs", react: "react", python: "python", firebase: "firebase", docker: "docker", figma: "figma", redis: "redis" };
export function TechnologyAndPalette({ technologies, palette, preview = false }: { technologies: string[]; palette: Swatch[]; preview?: boolean }) {
  if (!technologies.length && !palette.length) return null;
  return <section id="technology" className={styles.designSystem} aria-label="Project technology and visual system">
    {technologies.length ? <div className={styles.technology}><div className={styles.sectionHeading}><h2>{preview ? "Technology direction." : "Technologies chosen."}</h2></div><ul className={styles.techGrid}>{technologies.map((technology, index) => {
      const icon = TECHNOLOGY_IMAGES[technology.toLowerCase()];
      return <li key={technology}>{icon ? <Image src={`/images/technology/${icon}.svg`} alt="" width={30} height={30} /> : <DetailIcon kind={index + 3} />}<span>{technology}</span></li>;
    })}</ul>{preview ? <p className={styles.quietNote}>Possible technology direction - not a delivered stack.</p> : null}</div> : null}
    {palette.length ? <div id="palette" className={styles.paletteSection}><div className={styles.sectionHeading}><h2>Project palette.</h2></div><ul className={styles.paletteGrid}>{palette.slice(0, 8).map((color, index) => <li key={`${color.hex}-${index}`}><span className={styles.color} style={{ backgroundColor: color.hex }} aria-hidden="true" /><strong>{color.name}</strong><span>{color.hex.toUpperCase()}</span></li>)}</ul></div> : null}
  </section>;
}
export function ClientPerspective({ testimonial, preview = false }: { testimonial?: CaseStudy["testimonial"]; preview?: boolean }) {
  if (!testimonial && !preview) return null;
  return <section id="client-review" className={styles.review} aria-labelledby="client-review-heading"><div className={styles.reviewIntro}><h2 id="client-review-heading">The client’s<br />perspective.</h2><p>{testimonial ? "In their own words." : "Awaiting approved client feedback."}</p></div><div className={styles.reviewBody}>
    <svg aria-hidden="true" viewBox="0 0 48 40" fill="none"><path d="M6 34V20C6 10 10 6 18 6v6c-4 0-6 2-6 6h8v16H6Zm23 0V20c0-10 4-14 12-14v6c-4 0-6 2-6 6h8v16H29Z" fill="currentColor" /></svg>
    {testimonial ? <blockquote><p>{testimonial.quote}</p><footer><strong>{testimonial.name}</strong><span>{testimonial.role}</span></footer></blockquote> : <div className={styles.reviewPending}><h3>A place for the client’s voice.</h3><p>The approved quote, name and role will appear here. No sample endorsement is being presented as real feedback.</p></div>}
  </div></section>;
}
