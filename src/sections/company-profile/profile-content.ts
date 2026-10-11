import { COMPANY_FACTS, verifiedValue, type CompanyFact } from "@/constants/company-facts";

/** Public registry values only. Private governance/source notes never enter the profile. */
export function publicProfileValue(fact: CompanyFact<unknown>): unknown {
  return fact.visibility === "public" ? verifiedValue(fact) : null;
}
export function profileFactText(fact: CompanyFact<unknown>, fallback = "To be confirmed"): string {
  const value = publicProfileValue(fact);
  return typeof value === "string" && value.trim() ? value : fallback;
}
export type ProfileFactRow = { label: string; value: string; pending: boolean; href?: string };
export type ProfileFacts = { [Key in keyof typeof COMPANY_FACTS]: CompanyFact<unknown> };
function row(label: string, fact: CompanyFact<unknown>, registration = false): ProfileFactRow {
  const value = profileFactText(fact, registration ? "Available on request" : "To be confirmed");
  const pending = typeof publicProfileValue(fact) !== "string" || !(publicProfileValue(fact) as string).trim();
  const href = !pending && label === "Email" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? `mailto:${value}`
    : !pending && ["Phone", "HR phone"].includes(label) && /^\+?[\d ()-]+$/.test(value) ? `tel:${value.replace(/[ ()-]/g, "")}` : undefined;
  return { label, value, pending, ...(href ? { href } : {}) };
}
export function buildProfileModel(facts: ProfileFacts = COMPANY_FACTS, now = new Date()) {
  const foundedYear = profileFactText(facts.foundedYear);
  const elapsed = /^\d{4}$/.test(foundedYear) ? now.getFullYear() - Number(foundedYear) : null;
  const operatingSince = elapsed !== null && elapsed >= 0 ? `${foundedYear} (${elapsed} years)` : foundedYear;
  const socialValue = publicProfileValue(facts.socialProfiles);
  const socials: { label: string; href: string }[] = Array.isArray(socialValue) ? socialValue.filter((item): item is {label:string;href:string} => {
    if (!item || typeof item.label !== "string" || !item.label.trim() || typeof item.href !== "string") return false;
    try { return ["https:", "http:"].includes(new URL(item.href).protocol); } catch { return false; }
  }).map(({ label, href }) => ({ label, href })) : [];
  return {
    brand: profileFactText(facts.brandName), legalName: profileFactText(facts.legalName), foundedYear, operatingSince,
    overview: `${profileFactText(facts.brandName)} (${profileFactText(facts.legalName)}) is an independent digital product and technology company, ${elapsed !== null && elapsed >= 0 ? `operating since ${foundedYear} - ${elapsed} years` : "with founding details awaiting confirmation"}. Strategy, design, engineering, AI and growth operate as one connected capability, delivered globally from the engineering headquarters listed in the company record.`,
    identity: [row("Legal name", facts.legalName), row("Brand", facts.brandName), { ...row("Operating since", facts.foundedYear), value: operatingSince }, row("Headquarters", facts.headquarters), row("Offices", facts.operationalOffices), row("CIN", facts.cin, true), row("GST", facts.gst, true), row("Email", facts.email), row("Phone", facts.phone)],
    summary: [row("Operating since", facts.foundedYear), row("Offices", facts.operationalOffices)],
    contacts: [row("Email", facts.email), row("Phone", facts.phone), row("HR phone", facts.hrPhone)], socials,
  };
}
export type ProfileModel = ReturnType<typeof buildProfileModel>;

export const PROFILE_TECHNOLOGY = "TypeScript-first engineering: Next.js and React for web, Flutter and React Native for mobile, PostgreSQL and Prisma for data, Node.js services, cloud infrastructure with CI/CD, and applied AI (LLM integration, RAG, agents) with evaluation and guardrails. Full stack detail on the website's technology pages.";
export const PROFILE_WORK = "Verified case studies publish on the website as client approvals complete. For named references and engagement details, ask what can be shared under NDA.";
export const PROFILE_PROCESS = [
  { title: "Discover", detail: "Goals, users, systems, constraints" },
  { title: "Define", detail: "Requirements, architecture, roadmap" },
  { title: "Design", detail: "Research, flows, prototypes, design systems" },
  { title: "Build", detail: "Engineering, integration, testing, security" },
  { title: "Grow", detail: "Analytics, monitoring, search visibility, iteration" },
] as const;
export const PROFILE_PROCESS_NOTE = "Each phase ships defined deliverables; progress is visible in the client portal throughout.";
export const PROFILE_ENGAGEMENTS = ["Fixed scope", "Dedicated product team", "Discovery engagement", "Support & optimisation"] as const;
export const PROFILE_TRUST = "NDA before engagement details. Contracted work product and source code belong to the client. Repository access from day one. Documented handover. No compliance framework is claimed that Savo has not obtained. Details on the trust & security page.";
export const PROFILE_FAQS = [
  { q: "How current are the facts in this profile?", a: "Every figure renders from the company's canonical facts record and is reviewed on a governance cadence. Registration identifiers publish as verified values are supplied." },
  { q: "Can we get this profile as a PDF?", a: "Yes. Print this page (Ctrl or Cmd + P) for a clean PDF copy; it is formatted for print deliberately." },
  { q: "Why are some figures marked as available on request?", a: "Because we publish only what we can verify. Identification numbers and scale figures appear here the moment verified values are confirmed, never before." },
] as const;
