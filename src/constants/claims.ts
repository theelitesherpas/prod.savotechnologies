/**
 * CLAIM REGISTRY - internal verification ledger for every significant
 * public claim. (Master specification Part 8.)
 *
 * Statuses:
 *   verified - public evidence exists (link, document)
 *   verified-private - evidence exists but is confidential
 *   awaiting-verification - claimed, evidence being gathered
 *   awaiting-client-approval - evidence exists, client sign-off pending
 *   insufficient-evidence - must NOT be published
 *   archived - no longer used
 *
 * HARD RULE (Parts 8 & 117): a claim may render publicly only in status
 * "verified" or "verified-private" (private evidence claims must still be
 * factually defensible). Everything else stays internal.
 */

export type ClaimStatus =
  | "verified"
  | "verified-private"
  | "awaiting-verification"
  | "awaiting-client-approval"
  | "insufficient-evidence"
  | "archived";

export type Claim = {
  id: string;
  claim: string;
  category:
    | "company"
    | "capability"
    | "process"
    | "project"
    | "metric"
    | "security"
    | "recognition"
    | "testimonial";
  status: ClaimStatus;
  evidencePublic?: string;
  evidencePrivate?: string;
  owner: string;
  verifiedDate?: string;
  reviewDate?: string;
};

export const CLAIMS: Claim[] = [
  /* - Company facts already carrying proof - */
  {
    id: "hq-indore",
    claim: "Savo Technologies is headquartered in Indore, Madhya Pradesh, India.",
    category: "company",
    status: "verified",
    evidencePublic: "Address published on savotechnologies.com contact page; supplied by Savo 2026-09-25.",
    owner: "Savo leadership",
    verifiedDate: "2026-09-25",
  },
  {
    id: "founded-2015",
    claim: "Savo has been building digital products since 2015.",
    category: "company",
    status: "verified",
    evidencePublic: "Long-standing company statement; consistent across site versions.",
    owner: "Savo leadership",
    verifiedDate: "2026-09-25",
  },
  {
    id: "global-delivery",
    claim: "Savo works with clients internationally, delivered remotely from India.",
    category: "company",
    status: "verified",
    evidencePublic: "Existing verified positioning; no physical office outside India is claimed anywhere.",
    owner: "Savo leadership",
    verifiedDate: "2026-09-25",
  },

  /* - Process claims - the practices below are how the delivery system
       already operates (admin panel, portal, meeting workflow exist in
       production code); wording kept to what the system demonstrably does. */
  {
    id: "process-five-phases",
    claim: "Projects run through Discover, Define, Design, Build and Grow phases.",
    category: "process",
    status: "verified",
    evidencePublic: "Published methodology; delivery tooling mirrors the phases.",
    owner: "Delivery team",
    verifiedDate: "2026-10-02",
  },
  {
    id: "portal-transparency",
    claim: "Clients can follow project milestones, updates, approvals, invoices and meetings in a dedicated client portal.",
    category: "process",
    status: "verified",
    evidencePrivate: "Client portal is live functionality in the platform (client login, milestones, invoices, meetings).",
    owner: "Engineering",
    verifiedDate: "2026-10-02",
  },
  {
    id: "meeting-workflow",
    claim: "Meetings are scheduled with timezone handling, confirmation and complete history.",
    category: "process",
    status: "verified",
    evidencePrivate: "Meeting lifecycle (invite → availability → confirm → reschedule → notes) ships in the platform.",
    owner: "Engineering",
    verifiedDate: "2026-10-02",
  },

  /* - Awaiting verified input (Part 116) - these must stay unpublished
       as assertions until Savo supplies evidence. */
  {
    id: "projects-count",
    claim: "[N] projects delivered.",
    category: "metric",
    status: "awaiting-verification",
    evidencePrivate: "Savo project ledger required.",
    owner: "Savo leadership",
  },
  {
    id: "clients-count",
    claim: "[N] clients supported.",
    category: "metric",
    status: "awaiting-verification",
    evidencePrivate: "Savo accounts list required.",
    owner: "Savo leadership",
  },
  {
    id: "testimonials",
    claim: "Client testimonials.",
    category: "testimonial",
    status: "awaiting-client-approval",
    evidencePrivate: "Written quotes + display permission required per client.",
    owner: "Savo leadership",
  },
  {
    id: "client-logos",
    claim: "Client logo wall.",
    category: "project",
    status: "awaiting-client-approval",
    evidencePrivate: "Logo usage permission required per client.",
    owner: "Savo leadership",
  },
  {
    id: "certifications",
    claim: "Company/technology certifications and partnerships.",
    category: "recognition",
    status: "awaiting-verification",
    evidencePrivate: "Certificates and partner-program evidence required.",
    owner: "Savo leadership",
  },
  {
    id: "third-party-ratings",
    claim: "Ratings on Clutch / GoodFirms / Google Business.",
    category: "recognition",
    status: "awaiting-verification",
    evidencePrivate: "Profile URLs and real rating values required.",
    owner: "Savo leadership",
  },

  /* - Security & ownership (Part 21/22) - phrased as commitments Savo's
     standard working practice can stand behind; escalate to contract-level
     wording review before publishing anything stronger. */
  {
    id: "nda-standard",
    claim: "Savo signs NDAs before engagement details are shared.",
    category: "security",
    status: "verified-private",
    evidencePrivate: "Standard practice; NDA template available on request.",
    owner: "Savo leadership",
    verifiedDate: "2026-10-02",
  },
  {
    id: "ip-ownership",
    claim: "Contracted work product and source code belong to the client.",
    category: "security",
    status: "verified-private",
    evidencePrivate: "Standard contract terms; must match each engagement's signed agreement.",
    owner: "Savo leadership",
    verifiedDate: "2026-10-02",
  },
];

/** Claims publishable as assertions (drive public "trust" surfaces). */
export function publishableClaims(category?: Claim["category"]): Claim[] {
  return CLAIMS.filter(
    (c) => (c.status === "verified" || c.status === "verified-private") && (!category || c.category === category),
  );
}

/** Claims blocked pending input - powers the proof dashboard (Part 98). */
export function blockedClaims(): Claim[] {
  return CLAIMS.filter(
    (c) => c.status === "awaiting-verification" || c.status === "awaiting-client-approval" || c.status === "insufficient-evidence",
  );
}
