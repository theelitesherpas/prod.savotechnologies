import type { Metadata } from "next";
import Link from "next/link";
import s from "@/sections/legal/legal-document.module.css";
import { withBasePath } from "@/lib/utils";

export const metadata: Metadata = { title: "Data sources & credits", description: "Source and license information for the India city directory used by Savo Technologies.", robots: { index: false, follow: true } };

export default function DataSourcesPage() {
  return <article className={s.page}><div className={s.rail}><div className={s.reading}>
    <header className={s.intro}><h1>Data sources & credits</h1><p>Information about the location suggestions in our application form.</p></header>
    <section id="india-cities" className={s.chapter} aria-labelledby="cities-heading">
      <h2 id="cities-heading">India cities and towns</h2>
      <p>Contains information from the <a href="https://github.com/dr5hn/countries-states-cities-database" target="_blank" rel="noopener noreferrer">Countries States Cities Database</a>, made available under the <a href={withBasePath("/data/licenses/india-cities-ODbL.txt")}>Open Database License (ODbL 1.0)</a>.</p>
      <p>Our locally hosted extract includes 4,328 distinct city/town and state pairs across 36 Indian states and territories. Duplicate pairs were removed. The source is pinned to commit 7795d77d6a801543b9bb90d97a182c885f44c458.</p>
      <p>Suggested cities are ordered for convenience, with Indore first. This is not an official population ranking, and the directory does not claim to list every settlement. You can enter a missing or overseas location manually.</p>
      <p><a href={withBasePath("/data/india-cities.json")} download>Download the extracted directory</a> · <a href={withBasePath("/data/licenses/india-cities-ODbL.txt")}>Read the license</a></p>
      <p>Applicant information is not included in this directory.</p>
    </section>
    <nav className={s.documentFooter} aria-label="Continue"><Link href="/careers/apply?role=general-application">Back to application</Link></nav>
  </div></div></article>;
}
