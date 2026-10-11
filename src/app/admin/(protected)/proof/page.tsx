import { requireAdminPage } from "@/lib/permissions";
import type { Metadata } from "next";
import { PageHeader, Chip, EmptyState } from "@/components/admin/ui";
import { getCaseStudies } from "@/lib/case-studies";
import { blockedClaims } from "@/constants/claims";
import { pendingFacts } from "@/constants/company-facts";

/**
 * PROOF DASHBOARD (master spec Part 98).
 *
 * Internal view of proof-readiness: case studies by level, gaps in
 * testimonials/outcomes/technology/verification, and the blocked claims
 * and pending company facts awaiting verified input. Read-only - fixes
 * happen in the content modules, facts arrive from Savo.
 */

export const metadata: Metadata = { title: "Proof dashboard" };

type Finding = { label: string; detail: string; tone: "warn" | "ok" | "info" };

export default async function ProofDashboardPage() {
  await requireAdminPage("/admin/proof");
  const studies = await getCaseStudies();

  const findings: Finding[] = [];

  /* Case-study readiness */
  const byLevel = { flagship: 0, standard: 0, "verified-entry": 0 } as Record<string, number>;
  let verified = 0;
  for (const s of studies) {
    byLevel[s.level ?? "standard"] = (byLevel[s.level ?? "standard"] ?? 0) + 1;
    if (s.status === "verified") verified += 1;
    const name = s.displayClientName || s.title;
    if (!s.testimonial) findings.push({ label: `No testimonial · ${name}`, detail: "Approved quote missing - the accent testimonial band will not render.", tone: "warn" });
    if (!(s.results ?? []).some((r) => r.verified)) findings.push({ label: `No verified metrics · ${name}`, detail: "All outcome figures are unverified; production renders them as pending.", tone: "warn" });
    if ((s.technologies ?? []).length === 0) findings.push({ label: `No technology recorded · ${name}`, detail: "Technology chips and explorer filters need the stack.", tone: "warn" });
    if ((s.dossier?.verificationLinks?.length ?? 0) === 0 && !s.liveUrl) findings.push({ label: `No external verification · ${name}`, detail: "Add live URL, store listing or public reference when approved.", tone: "info" });
  }

  const blocked = blockedClaims();
  const pending = pendingFacts();

  const stats = [
    { k: "Case studies (visible here)", v: String(studies.length) },
    { k: "Verified for production", v: String(verified) },
    { k: "Flagship dossiers", v: String(byLevel.flagship ?? 0) },
    { k: "Blocked claims", v: String(blocked.length) },
    { k: "Company facts pending", v: String(pending.length) },
  ];

  return (
    <>
      <PageHeader title="Proof dashboard" description="What can be published, what still needs evidence." />

      <dl className="mb-8 grid grid-cols-2 gap-px border border-border bg-border sm:grid-cols-5">
        {stats.map((s) => (
          <div key={s.k} className="bg-background p-4">
            <dt className="t-label text-muted">{s.k}</dt>
            <dd className="t-h3 mt-1 font-serif">{s.v}</dd>
          </div>
        ))}
      </dl>

      {/* Case-study gaps */}
      <section aria-labelledby="cs-gaps" className="mb-10">
        <h2 id="cs-gaps" className="t-h4 mb-4">Case study gaps</h2>
        {findings.length === 0 ? (
          <EmptyState title="No gaps" message="Every visible case study carries a testimonial, verified metrics, technology and verification." />
        ) : (
          <ul className="divide-y divide-border border border-border">
            {findings.map((f, i) => (
              <li key={i} className="flex items-start gap-3 p-4">
                <Chip tone={f.tone === "warn" ? "warning" : "muted"}>{f.tone === "warn" ? "Gap" : "Info"}</Chip>
                <div>
                  <p className="t-sm font-medium">{f.label}</p>
                  <p className="t-caption mt-1 text-muted">{f.detail}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Blocked claims */}
      <section aria-labelledby="blocked-claims" className="mb-10">
        <h2 id="blocked-claims" className="t-h4 mb-4">Claims awaiting evidence or approval</h2>
        {blocked.length === 0 ? (
          <EmptyState title="None blocked" message="Every registered claim carries evidence." />
        ) : (
          <ul className="divide-y divide-border border border-border">
            {blocked.map((c) => (
              <li key={c.id} className="p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="t-sm font-medium">{c.claim}</p>
                  <Chip tone={c.status === "awaiting-client-approval" ? "warning" : "muted"}>
                    {c.status.replace(/-/g, " ")}
                  </Chip>
                </div>
                <p className="t-caption mt-1 text-muted">Owner: {c.owner} · Evidence needed: {c.evidencePrivate ?? " - "}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Pending company facts */}
      <section aria-labelledby="pending-facts">
        <h2 id="pending-facts" className="t-h4 mb-4">Company facts pending verified input</h2>
        {pending.length === 0 ? (
          <EmptyState title="All facts verified" message="The canonical company record is complete." />
        ) : (
          <ul className="divide-y divide-border border border-border">
            {pending.map((p) => (
              <li key={p.key} className="p-4">
                <p className="t-sm font-medium">{p.key}</p>
                <p className="t-caption mt-1 text-muted">Source required: {p.source}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
