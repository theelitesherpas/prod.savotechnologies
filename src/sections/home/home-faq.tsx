import Link from "next/link";
import { Faq } from "@/components/shared/faq";
import { HOME_FAQS } from "@/constants/faqs";
import { absoluteUrl } from "@/lib/env";
import { ArrowIcon } from "@/sections/home-v2/icons";
import styles from "@/sections/home-v2/homepage.module.css";
import { HOME_COPY } from "@/sections/home-v2/homepage-copy";

/** Buyer answers remain complete in the DOM and FAQPage structured data. */
export function HomeFaq() {
  const headingId = "home-faq-heading";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": absoluteUrl("/#faq-schema"),
    mainEntity: HOME_FAQS.map((f) => ({
      "@type": "Question", name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
  return (
    <section id="faq" data-home-section="faq" aria-labelledby={headingId} className={`reftheme-light ${styles.faq}`}>
      <div className="shell">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <div className={styles.sectionHead}>
          <h2 id={headingId}>{HOME_COPY.faq.title}</h2>
          <p>{HOME_COPY.faq.lead}</p>
        </div>
        <div className={styles.faqBody}>
          <div className={styles.faqAside}>
            <p>{HOME_COPY.faq.aside}</p>
            <Link href="/contact">A question we missed? <ArrowIcon size={14} /></Link>
          </div>
          <Faq items={HOME_FAQS} label="Savo Technologies, frequently asked questions" initialVisible={6} />
        </div>
      </div>
    </section>
  );
}
