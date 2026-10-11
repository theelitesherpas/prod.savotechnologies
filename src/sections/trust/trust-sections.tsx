import Image from "next/image";
import Link from "next/link";
import { StartProjectButton } from "@/components/shared/start-project-button";
import { THIRD_PARTY_RATINGS, type ThirdPartyRating } from "@/constants/recognition";
import { CERTIFICATION_BOUNDARY, CONFIDENTIALITY_ROWS, HANDOVER_ROWS, OWNERSHIP_ROWS, SECURITY_ROWS, TRUST_FAQS } from "./trust-content";
import { OwnershipPacket, TrustArrow, TrustPlus, TrustSymbol, type TrustSymbolKind } from "./trust-art";
import s from "./trust.module.css";

export function TrustHero() {
  return <section className={`${s.section} ${s.hero}`} aria-labelledby="trust-heading"><div className={s.rail}>
    <div className={s.opening}><div className={s.heroCopy}><h1 id="trust-heading">Your product{" "}<br />remains <span>yours.</span></h1><p>Source code, design files, documentation, infrastructure, credentials: contracted work belongs to the client. Explore how confidentiality, ownership and security are handled - and what your engagement agreement needs to make clear.</p><div className={s.heroActions}><StartProjectButton source="trust-hero" label="Discuss your requirements" /><a href="#ownership" className={s.secondary}>Explore ownership<TrustArrow /></a></div><noscript><p className={s.note}>To discuss your requirements without JavaScript, <Link href="/contact#send">contact our team</Link>.</p></noscript></div><OwnershipPacket /></div>
    <nav className={s.journey} aria-label="Trust page contents"><a href="#ownership">Ownership &amp; access<TrustArrow /></a><a href="#security">Security practices<TrustArrow /></a><a href="#handover">Handover &amp; support<TrustArrow /></a></nav>
  </div></section>;
}

export function TrustOwnership() {
  return <section id="ownership" className={s.section} aria-labelledby="ownership-heading"><div className={`${s.rail} ${s.ownershipLayout}`}>
    <div className={s.ownershipIntro}><h2 id="ownership-heading">Ownership, in writing<br />and in practice.</h2><p>What you hold at every stage of the engagement - not only at the end.</p><aside className={s.agreementNote}><TrustSymbol kind="agreement" size={32} /><h3>Make the terms clear.</h3><p>Your engagement agreement governs work-product ownership, third-party licences and the handover scope. Review those terms before work begins.</p></aside><Link href="/company-profile" className={s.link}>Read the company profile<TrustArrow /></Link></div>
    <dl className={s.ownershipList} aria-labelledby="ownership-heading">{OWNERSHIP_ROWS.map(row => <div key={row.k}><dt>{row.k}</dt><dd>{row.v}</dd></div>)}</dl>
  </div></section>;
}

const CONFIDENTIALITY_SYMBOLS: TrustSymbolKind[] = ["agreement", "team", "private", "evidence"];
export function TrustConfidentiality() {
  return <section id="confidentiality" className={`${s.section} ${s.grey}`} aria-labelledby="confidentiality-heading"><div className={s.rail}>
    <div className={s.sectionHead}><h2 id="confidentiality-heading">Confidentiality<br />by default.</h2><p>NDAs before details, scoped access, and careful handling of sensitive work.</p></div>
    <dl className={s.confidentialityList}>{CONFIDENTIALITY_ROWS.map((row, i) => <div key={row.k}><TrustSymbol kind={CONFIDENTIALITY_SYMBOLS[i]} size={32} /><div><dt>{row.k}</dt><dd>{row.v}</dd></div></div>)}</dl>
    <Link href="/contact#send" className={`${s.link} ${s.confidentialityLink}`}>Discuss confidentiality<TrustArrow /></Link>
  </div></section>;
}

const SECURITY_SYMBOLS: TrustSymbolKind[] = ["access", "environments", "validation", "dependencies", "monitoring", "backup"];
export function TrustSecurity() {
  return <section id="security" className={`${s.section} ${s.dark}`} aria-labelledby="security-heading"><div className={s.rail}>
    <div className={s.sectionHead}><h2 id="security-heading">Security as<br />engineering practice.</h2><p>How access, environments and operating responsibilities are handled. Specific controls and service scope belong in your engagement agreement.</p></div>
    <dl className={s.securityList}>{SECURITY_ROWS.map((row, i) => <div key={row.k}><TrustSymbol kind={SECURITY_SYMBOLS[i]} size={30} /><div><dt>{row.k}</dt><dd>{row.v}</dd></div></div>)}</dl>
    <aside className={s.certificationBoundary} aria-labelledby="certification-heading"><div><TrustSymbol kind="document" size={32} /><h3 id="certification-heading">What we deliberately<br />do not claim.</h3></div><p>{CERTIFICATION_BOUNDARY}</p></aside>
  </div></section>;
}

/** Same verified-only registry as the original page; empty means no trust decoration. */
export function TrustRatings({ ratings = THIRD_PARTY_RATINGS }: { ratings?: readonly ThirdPartyRating[] }) {
  if (!ratings.length) return null;
  return <section className={`${s.section} ${s.ratings}`} aria-labelledby="ratings-heading"><div className={s.rail}><div className={s.sectionHead}><h2 id="ratings-heading">Independently verified.</h2><p>Third-party profiles and the date each rating was checked.</p></div><ul className={s.ratingList}>{ratings.map(rating => <li key={rating.platform}><a href={rating.href} target="_blank" rel="noopener noreferrer"><strong>{rating.rating}</strong><span>{rating.platform} · {rating.reviewCount} reviews<TrustArrow /></span><small>Checked <time dateTime={rating.checkedOn}>{rating.checkedOn}</time></small></a></li>)}</ul></div></section>;
}

const HANDOVER_SYMBOLS: TrustSymbolKind[] = ["document", "handover", "support"];
export function TrustHandover() {
  return <section id="handover" className={s.section} aria-labelledby="handover-heading"><div className={s.rail}>
    <div className={s.sectionHead}><h2 id="handover-heading">Documented.<br />Transferable. Operable.</h2><p>A project you can hand to another team tomorrow is a project built honestly today.</p></div>
    <div className={s.handoverLayout}><figure className={s.handoverFigure}><div className={s.handoverPhoto}><Image src="/images/studio.webp" alt="Editorial design workspace with a tablet, stylus and printed design references" fill sizes="(max-width: 899px) calc(100vw - 40px), (max-width: 1440px) 45vw, 608px" className={s.photo} /></div><figcaption>Editorial design workspace - not a client project or handover photograph.</figcaption></figure><div className={s.handoverSteps}>{HANDOVER_ROWS.map((row, i) => <article key={row.k}><TrustSymbol kind={HANDOVER_SYMBOLS[i]} size={28} /><div><h3>{row.k}</h3><p>{row.v}</p></div></article>)}</div></div>
  </div></section>;
}

export function TrustQuestions() {
  return <section id="questions" className={`${s.section} ${s.questions}`} aria-labelledby="page-faq-heading"><div className={`${s.rail} ${s.questionLayout}`}>
    <div className={s.questionIntro}><h2 id="page-faq-heading">Trust, asked<br />and answered.</h2><p>Practical answers about NDAs, ownership, access and what you receive at handover.</p><Link href="/contact#send" className={s.link}>Ask another question<TrustArrow /></Link><nav className={s.related} aria-label="Related buyer information"><Link href="/enterprise">Working with Savo<TrustArrow /></Link><Link href="/technology">Technology &amp; architecture<TrustArrow /></Link></nav></div>
    <div className={s.faqList} aria-label="Trust and security frequently asked questions">{TRUST_FAQS.map((item, i) => <details key={item.q} open={i === 0}><summary>{item.q}<TrustPlus /></summary><p>{item.a}</p></details>)}</div>
  </div></section>;
}
