import { COMPANY_FACTS, verifiedValue, type CompanyFact } from "@/constants/company-facts";

export type IndoreFacts = { [Key in keyof Pick<typeof COMPANY_FACTS, "brandName" | "legalName" | "headquarters" | "operationalOffices" | "supportedMarkets" | "foundedYear" | "email" | "phone">]: CompanyFact };
/** Populated does not mean approved, and approved does not mean public. */
export function indorePublicValue(fact: CompanyFact): string | null {
  const value = fact.visibility === "public" ? verifiedValue(fact) : null;
  return typeof value === "string" && value.trim() ? value.trim() : null;
}
export function indoreMapHref(address: string | null): string | null {
  return address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}` : null;
}
export function buildIndoreModel(facts: IndoreFacts = COMPANY_FACTS) {
  const approvedAddress = indorePublicValue(facts.headquarters);
  const address = approvedAddress && /\bIndore\b/i.test(approvedAddress) ? approvedAddress : null;
  const brand = indorePublicValue(facts.brandName);
  const legalName = indorePublicValue(facts.legalName);
  const emailValue = indorePublicValue(facts.email);
  const email = emailValue && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue) ? emailValue : null;
  const phone = indorePublicValue(facts.phone);
  const digits = phone?.replace(/[ ()-]/g, "");
  const phoneHref = digits && /^\+[1-9]\d{6,14}$/.test(digits) ? `tel:${digits}` : null;
  const yearValue = indorePublicValue(facts.foundedYear);
  const foundedYear = yearValue && /^\d{4}$/.test(yearValue) ? yearValue : null;
  return { brand, legalName, address, mapHref: indoreMapHref(address), email, emailHref: email ? `mailto:${email}` : null, phone: phoneHref ? phone : null, phoneHref, foundedYear, markets: indorePublicValue(facts.supportedMarkets), offices: indorePublicValue(facts.operationalOffices) };
}
export type IndoreModel = ReturnType<typeof buildIndoreModel>;

/** The original four service titles, descriptions and destinations are unchanged. */
export const INDORE_SERVICES = [
  { title: "Website development in Indore", body: "Corporate websites, marketing sites and storefronts built with Next.js and React, engineered for speed and search from the first commit.", href: "/services/web-development", kind: "web" },
  { title: "Mobile app development in Indore", body: "iOS, Android and Flutter applications, from product discovery through store launch and post-release iteration.", href: "/services/mobile-app-development", kind: "mobile" },
  { title: "Custom software development in Indore", body: "Internal tools, portals, integrations and line-of-business systems shaped around the way your company actually works.", href: "/services/custom-software-development", kind: "software" },
  { title: "AI development in Indore", body: "AI agents, generative AI integrations and automation built on the same engineering discipline as the rest of our work.", href: "/ai-agents", kind: "ai" },
] as const;

export const INDORE_WORKING = [
  { title: "Engineering talent. Scope-led pricing.", body: "Look at the skills, scope and delivery plan together. Compare the work involved, the review process and the ongoing cost of running the product - not just the city on the proposal." },
  { title: "One timezone. Direct conversation.", body: "For clients in India, Indore shares your timezone. Agree a communication rhythm, review points and who will answer technical questions before the engagement begins." },
] as const;

/** Original seven questions plus two evidence-led local web/app selection guides. */
export function buildIndoreFaqs(model: IndoreModel) {
  return [
    { q: "Where is Savo Technologies located?", a: model.address ? `${model.brand ?? "The company"} is headquartered in Indore, Madhya Pradesh, India.${model.legalName ? ` The incorporated company operates as ${model.legalName}.` : ""} The headquarters address is ${model.address}.` : "Our headquarters address is awaiting public confirmation. Contact the team to confirm location details before planning a visit." },
    { q: "Does Savo Technologies work with clients outside Indore?", a: model.markets ? `Yes. Our supported markets are ${model.markets}. Remote engagements need an agreed communication rhythm. If you would like to meet in Indore, arrange the visit with the team first.` : "Ask the team about the locations and remote arrangements supported for your project. Confirm any in-person meeting before travelling." },
    { q: "What services does Savo Technologies offer from Indore?", a: "Website and web application development, mobile app development for iOS and Android, custom software development, AI agents and AI automation, SaaS product development and UI/UX design." },
    { q: "How do I compare website development companies in Indore or across India?", a: "Searching for the best website development company or best website developers in Indore or India? Compare relevant work you can verify, a performance and accessibility plan, a careful SEO migration approach where relevant, clear code and account ownership, milestones and post-launch support. “Best” depends on evidence and fit; we do not claim a universal ranking." },
    { q: "What should I look for in a mobile app development company in Indore or India?", a: "Compare the proposed iOS and Android approach, security, accessibility, testing on real devices, app-store release responsibilities, code and account ownership, and ongoing maintenance. The best mobile app development company for your project is the one whose relevant experience and written delivery plan fit your needs; confirm the actual team, scope and support before deciding." },
    { q: "How do I start a project with Savo Technologies?",  a: "Send a message through the contact page or start a project brief. Share your goals, constraints and what success looks like. Confirm response timing and the discovery arrangements with the team; the brief is not a commitment." },
    { q: "Which is the best IT company in Indore for software development?", a: `Best depends on your criteria, so judge on evidence: verifiable work, a transparent review process, clear code ownership, and what references may be shared under NDA.${model.foundedYear ? ` ${model.brand ?? "The business"} has operated since ${model.foundedYear}.` : ""} Review published practices and ask for evidence relevant to your project rather than relying on a ranking claim.` },
    { q: "Why do businesses choose software development companies in India?", a: "India offers a broad engineering market and timezone overlap with Europe and Asia-Pacific. Evaluate the actual team's skills, process discipline and communication rhythm. Location alone does not guarantee quality, savings or a good fit." },
    { q: "How much does website or mobile app development cost in India?", a: "Cost follows scope, not geography alone: a marketing site, a customer portal and a full product are different budgets everywhere. Share a brief and discuss discovery, milestones and ongoing costs. Pricing and the proposal schedule should be agreed for your specific requirements." },
  ];
}
