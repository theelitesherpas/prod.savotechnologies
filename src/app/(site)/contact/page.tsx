import type { Metadata } from "next";
import { getSettings } from "@/lib/settings";
import { getManagedTeam } from "@/lib/content-items";
import { AboutTeam } from "@/sections/about/about-sections";
import teamStyles from "@/sections/about/about.module.css";
import { SITE } from "@/constants/site";
import { absoluteUrl } from "@/lib/env";
import { openGraphFor } from "@/lib/seo";
import { ClosingCta, ClosingArrow } from "@/components/shared/closing-cta";
import { ContactForm } from "@/sections/contact/contact-form";
import { ContactIntroduction, ContactChannels, ContactNextSteps, ContactQuestions } from "@/sections/contact/contact-sections";
import { CONTACT_QUESTIONS } from "@/sections/contact/contact-content";
import styles from "@/sections/contact/contact.module.css";

/**
 * THESIS: A conversation, not a deadline promise or fake team directory.
 * OWN-WORLD: Outfit/Inter, grey invitation, white composer, black/red signals.
 * STORY: Context → message/direct channel → possible next steps → questions → call/email.
 * FIRST VIEWPORT: Large left invitation/photo, right useful composer; phone copy then form.
 * FORM: Correspondence studio, candidate6, seed3e490bde; manual native choices.
 * FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review,
 * the verdict, DESIGN.md, and every shipping raster carrying its provenance.
 */
export const revalidate = 0;
const DESCRIPTION = "Contact Savo Technologies about a new project, team needs, support or a general question. Send a message, email, call or connect on WhatsApp.";
export const metadata: Metadata = { title: "Contact Us", description: DESCRIPTION, alternates: { canonical: "/contact" }, openGraph: openGraphFor({ title: "Contact Us | Savo Technologies", description: DESCRIPTION, url: "/contact" }) };

export default async function ContactPage() {
  const [settings, team] = await Promise.all([getSettings(), getManagedTeam()]);
  const graph = { "@context": "https://schema.org", "@graph": [
    { "@type": "ContactPage", name: "Contact Savo Technologies", url: absoluteUrl("/contact"), description: DESCRIPTION, mainEntity: { "@type": "Organization", "@id": absoluteUrl("/#organization"), name: SITE.name, email: settings.contactEmail, telephone: SITE.phoneE164, contactPoint: { "@type": "ContactPoint", contactType: "sales", email: settings.contactEmail, telephone: SITE.phoneE164, availableLanguage: ["en"], areaServed: ["India", "Worldwide"] } } },
    { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") }, { "@type": "ListItem", position: 2, name: "Contact", item: absoluteUrl("/contact") }] },
    { "@type": "FAQPage", "@id": absoluteUrl("/contact/#faq-schema"), mainEntity: CONTACT_QUESTIONS.map(item => ({ "@type": "Question", name: item.q, acceptedAnswer: { "@type": "Answer", text: item.a } })) },
  ] };
  return <div className={styles.page} data-contact-page="correspondence-studio">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(graph).replace(/</g, "\\u003c") }} />
    <section className={styles.opening} aria-labelledby="contact-heading"><div className={`${styles.rail} ${styles.openingGrid}`}><ContactIntroduction email={settings.contactEmail} heroImage={settings.contactHeroImage} heroAlt={settings.contactHeroAlt} /><div id="send" className={styles.composer}><ContactForm email={settings.contactEmail} /></div></div></section>
    <ContactChannels email={settings.contactEmail} phone={settings.contactPhone} phoneE164={SITE.phoneE164} />
    <div className={`${teamStyles.page} ${styles.people}`}><AboutTeam people={team} demo={false} heading="Key people" /></div>
    <ContactNextSteps />
    <ContactQuestions />
    <ClosingCta id="contact-close" headingId="contact-cta-heading" title="Rather talk it through?" description="Choose a direct conversation instead of a form.">
      <a className={styles.closePrimary} href={`tel:${SITE.phoneE164}`}>Call Savo<ClosingArrow /></a><a className={styles.closeSecondary} href={`mailto:${settings.contactEmail}`}>Email us<ClosingArrow /></a>
    </ClosingCta>
  </div>;
}
