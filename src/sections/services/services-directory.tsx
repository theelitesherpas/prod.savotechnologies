import Link from "next/link";
import { ServiceIcon } from "@/components/shared/service-icon";
import { StartProjectButton } from "@/components/shared/start-project-button";
import { SERVICE_DETAILS } from "@/constants/services-detail";
import { CrewScene, crewCopy } from "@/sections/hire/crew-scene";
import { ServicesShowcase } from "./services-showcase";
import styles from "./services-directory.module.css";

/**
 * THESIS: Show the range of a connected product team, then make each service easy to find.
 * OWN-WORLD: Homepage Outfit/Inter, white/black/light-grey, Savo red; no legacy dossier skin.
 * STORY: Product scope → three real service pathways → complete ten-service catalogue → enquiry.
 * FIRST VIEWPORT: Moderate headline and actions left, a manual interface showcase right.
 * Preserve canonical service order, descriptions, stack labels and original crew illustration.
 */
const CATALOGUE_ROWS = [
  { label: "Web platforms to AI agents", note: "the full span" },
  { label: "One connected team", note: "strategy to run" },
  { label: "Ten services, one standard", note: "one connected approach" },
];

function Arrow() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14m-6-6 6 6-6 6" /></svg>;
}

export function ServicesDirectory() {
  const crew = crewCopy("svc-index");
  return (
    <>
      <section aria-labelledby="services-heading" className={styles.hero}>
        <div className={styles.rail}>
          <div className={styles.heroGrid}>
            <div className={styles.intro}>
              <h1 id="services-heading">Everything a product needs.<br />End to end<span className={styles.red}>.</span></h1>
              <p>Ten services under one engineering standard, from the first website to the AI agent answering your support queue. Each opens into its own chapter below.</p>
              <div className={styles.actions}>
                <Link href="#directory" className={styles.primary}>Explore services<Arrow /></Link>
                <StartProjectButton label="Discuss a project" source="services-directory-hero" />
              </div>
            </div>
            <ServicesShowcase />
          </div>
          <div className={styles.catalogue}>
            <h2>The catalogue</h2>
            <ul>{CATALOGUE_ROWS.map(row => <li key={row.label}><p>{row.label}</p><span>{row.note}</span></li>)}</ul>
            <p className={styles.catalogueNote}>Scoped in stages. Shipped in slices.</p>
          </div>
        </div>
      </section>

      <section id="directory" aria-labelledby="directory-heading" className={styles.directory}>
        <div className={styles.rail}>
          <div className={styles.sectionHead}>
            <h2 id="directory-heading">The directory.</h2>
            <p>Every service we sell, one row each, what it is, what it includes, how it runs. Start where the pain is.</p>
          </div>
          <ul className={styles.serviceGrid}>
            {SERVICE_DETAILS.map(service => (
              <li key={service.slug}>
                <Link href={`/services/${service.slug}`} aria-label={`Explore ${service.title}`} className={styles.service}>
                  <div className={styles.serviceHead}>
                    <ServiceIcon slug={service.slug} className={styles.serviceIcon} />
                    <h3>{service.title}</h3>
                    <Arrow />
                  </div>
                  <p className={styles.serviceLead}>{service.heroLead}</p>
                  <ul aria-label={`${service.title} stack`} className={styles.stack}>{service.stack.slice(0, 5).map(item => <li key={item}>{item}</li>)}</ul>
                  <span className={styles.readMore}>Explore service<Arrow /></span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="crew-svc-index-heading" className={styles.crew}>
        <div className={`${styles.rail} ${styles.crewGrid}`}>
          <figure aria-label={crew.title}><CrewScene variant="svc-index" /></figure>
          <div>
            <h2 id="crew-svc-index-heading">{crew.title}</h2>
            <p>{crew.note}.</p>
            <p className={styles.crewNote}>Doodles from the studio, drawn the way we build, by hand</p>
          </div>
        </div>
      </section>
    </>
  );
}
