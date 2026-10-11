/**
 * RECOGNITION & CLIENT PROOF REGISTRY (master spec Parts 16, 19, 20).
 *
 * Component architecture for client proof, third-party ratings and
 * recognition. Every array ships EMPTY by design: entries are added only
 * when Savo supplies verifiable data and permission. The UI components
 * that consume these registries render NOTHING while an array is empty,
 * so the site never shows placeholder trust signals.
 *
 * Population rules (Part 117 - zero fabrication):
 *   clients:      real organizations + written logo permission (A1/A2)
 *   ratings:      real profile URLs + real rating values (C1/C2)
 *   certifications/awards/partnerships: evidence on file (C3/C4)
 *   testimonials are NOT here - they live on case studies (A7)
 */

export type VerifiedClient = {
  name: string;
  /** Permission to display the logo on file. */
  logoPermission: true;
  /** Optional: where the proof lands (case study slug or industry). */
  linksTo?: { label: string; href: string };
  /** Static asset path for the logo (added with permission). */
  logoSrc?: string;
};

export type ThirdPartyRating = {
  platform: "Clutch" | "GoodFirms" | "Google Business" | "DesignRush" | "Upwork" | "LinkedIn" | (string & {});
  rating: string;
  reviewCount: number;
  href: string;
  /** When the value was last checked against the live profile. */
  checkedOn: string;
};

export type Certification = {
  name: string;
  issuer: string;
  /** ISO date of validity; expired entries never render publicly. */
  validUntil?: string;
  evidenceRef: string;
};

export type Award = {
  name: string;
  year: string;
  issuer: string;
  evidenceRef: string;
};

/* ── Registries (empty until verified input arrives) ────────────────── */

export const VERIFIED_CLIENTS: VerifiedClient[] = [];

export const THIRD_PARTY_RATINGS: ThirdPartyRating[] = [];

export const CERTIFICATIONS: Certification[] = [];

export const AWARDS: Award[] = [];

/** Whether any client proof can legally/ethically render today. */
export const HAS_CLIENT_PROOF = VERIFIED_CLIENTS.length > 0;
export const HAS_RATINGS = THIRD_PARTY_RATINGS.length > 0;
export const HAS_RECOGNITION = CERTIFICATIONS.length > 0 || AWARDS.length > 0;
