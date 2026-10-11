import Link from "next/link";
import { SavoLogo } from "@/components/shared/savo-logo";
import { NOT_FOUND_COPY, NOT_FOUND_DESTINATIONS } from "@/sections/not-found/not-found-content";
import { NotFoundReport } from "@/sections/not-found/not-found-report";
import s from "@/sections/not-found/not-found.module.css";

/**
 * THESIS: explain the missing page, then offer a chosen recovery - not a redirect.
 * OWN-WORLD: approved Outfit/Inter, white-grey field, black directory, red action.
 * STORY: missing address, homepage/project action, all nine original destinations.
 * FIRST VIEWPORT: genuine brand/home link; grey recovery copy beside a black link directory.
 * FORM: user-delegated existing Savo world, native destinations, no invented relocation story.
 * FINISH: unreviewed and undocumented is unfinished; this build ends with the
 * finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.
 * A named section works standalone or inside a retained (site) main after streaming.
 * Next controls HTTP/noindex semantics; streamed responses may be 200, not 404.
 */
function RecoveryArrow({ back = false }: { back?: boolean }) {
  return <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={back ? s.backArrow : undefined}><path d="M4 12h16m-6-6 6 6-6 6" /></svg>;
}

export default function NotFound() {
  return <div className={s.page} data-not-found-page="clear-native-recovery" data-design-contract="not-found-v7:THESIS=chosen-recovery-no-redirect;OWN-WORLD=Outfit-Inter-white-black-red-grey;STORY=missing-address-home-project-nine-destinations;FIRST-VIEWPORT=brand-grey-recovery-black-directory;FORM=user-delegated-established-world;FINISH=review-verdict-documentation-provenance">
    <NotFoundReport />
    <a href="#not-found-main" className={s.skip}>Skip to recovery options</a>
    <header className={s.header}><div className={s.rail}><Link href="/" className={s.brand} aria-label="Savo Technologies homepage"><SavoLogo /></Link></div></header>
    <section id="not-found-main" className={s.main} tabIndex={-1} aria-labelledby="not-found-heading"><div className={`${s.rail} ${s.layout}`}>
      <div className={s.copy}><h1 id="not-found-heading">We can’t find<br /> <span>this page.</span></h1><p>{NOT_FOUND_COPY.description}</p><div className={s.actions}><Link href="/" className={s.primary}><RecoveryArrow back />Go to the homepage</Link><Link href="/#start" className={s.secondary}>Start a Project<RecoveryArrow /></Link></div><p className={s.note}>{NOT_FOUND_COPY.recovery}</p></div>
      <nav className={s.directory} aria-labelledby="not-found-destinations"><h2 id="not-found-destinations">Explore Savo.</h2><ul>{NOT_FOUND_DESTINATIONS.map(([label, href]) => <li key={href}><Link href={href} data-not-found-destination>{label}<RecoveryArrow /></Link></li>)}</ul></nav>
    </div></section>
  </div>;
}
