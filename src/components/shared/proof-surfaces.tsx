import Link from "next/link";
import { Section } from "@/components/ui/section";
import { SectionHeader } from "@/components/ui/section-header";
import { Reveal } from "@/components/ui/reveal";
import {
  VERIFIED_CLIENTS,
  THIRD_PARTY_RATINGS,
  CERTIFICATIONS,
  AWARDS,
  HAS_CLIENT_PROOF,
  HAS_RATINGS,
} from "@/constants/recognition";

/**
 * CLIENT PROOF / THIRD-PARTY TRUST / RECOGNITION (master spec Parts
 * 16, 19, 20).
 *
 * Renders ONLY when the underlying registry carries verified entries.
 * While empty, these components return null - the site shows honest
 * absence instead of decorative trust signals. This is the component
 * architecture the spec asks for; publication waits for real data.
 */

export function ClientProof() {
  if (!HAS_CLIENT_PROOF) return null;
  return (
    <Section index="Clients" labelledBy="client-proof-heading">
      <SectionHeader
        id="client-proof-heading"
        heading={<>Built with real companies.</>}
        lead={<>Organizations that permitted their names on this page.</>}
      />
      <Reveal>
        <ul className="grid grid-cols-2 gap-px border border-border bg-border sm:grid-cols-3 lg:grid-cols-4">
          {VERIFIED_CLIENTS.map((c) => (
            <li key={c.name} className="bg-background p-8">
              {c.linksTo ? (
                <Link href={c.linksTo.href} className="t-h4 font-serif hover:text-accent-strong">
                  {c.name}
                </Link>
              ) : (
                <span className="t-h4 font-serif">{c.name}</span>
              )}
              {c.linksTo ? <p className="t-label mt-2 text-muted">{c.linksTo.label}</p> : null}
            </li>
          ))}
        </ul>
      </Reveal>
    </Section>
  );
}

export function IndependentlyVerified() {
  if (!HAS_RATINGS) return null;
  return (
    <section aria-labelledby="ratings-heading" className="border-y border-border bg-surface">
      <div className="shell py-14">
        <h2 id="ratings-heading" className="t-h3 mb-8">
          Independently verified.
        </h2>
        <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {THIRD_PARTY_RATINGS.map((r) => (
            <li key={r.platform}>
              <a href={r.href} target="_blank" rel="noopener noreferrer" className="group block">
                <p className="t-dl">{r.rating}</p>
                <p className="t-sm mt-1 font-medium group-hover:text-accent-strong">
                  {r.platform} · {r.reviewCount} reviews
                </p>
                <p className="t-label mt-1 text-muted">Checked {r.checkedOn}</p>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function Recognition() {
  /* Expired certifications never render publicly (spec Parts 20, 98). */
  const today = new Date().toISOString().slice(0, 10);
  const certs = CERTIFICATIONS.filter((c) => !c.validUntil || c.validUntil >= today);
  if (certs.length === 0 && AWARDS.length === 0) return null;
  return (
    <Section index="Recognition" labelledBy="recognition-heading">
      <SectionHeader
        id="recognition-heading"
        heading={<>Recognition.</>}
        lead={<>Only what can be evidenced. Nothing decorative.</>}
      />
      <Reveal>
        <div className="grid gap-px border border-border bg-border md:grid-cols-2">
          {certs.map((c) => (
            <div key={c.name} className="bg-background p-6">
              <p className="t-h4 font-serif">{c.name}</p>
              <p className="t-label mt-2 text-muted">
                {c.issuer}
                {c.validUntil ? ` · valid until ${c.validUntil}` : ""}
              </p>
            </div>
          ))}
          {AWARDS.map((a) => (
            <div key={a.name} className="bg-background p-6">
              <p className="t-h4 font-serif">{a.name}</p>
              <p className="t-label mt-2 text-muted">
                {a.issuer} · {a.year}
              </p>
            </div>
          ))}
        </div>
      </Reveal>
    </Section>
  );
}
