import { COMPANY_FACTS, type CompanyFact } from "@/constants/company-facts";
import { OFFICES, type Presence } from "@/constants/site";
import { SWITZERLAND_FAQS } from "@/constants/faqs";

export type SwissFacts = { [Key in "brandName" | "legalName" | "headquarters" | "operationalOffices" | "foundedYear" | "email"]: CompanyFact };
/** Presence records are public by schema; an explicit private extension still fails closed. */
export type SwissOfficeRecord = Presence & { visibility?: "public" | "internal" };

export function swissPublicValue(fact: CompanyFact): string | null {
  if (fact.visibility !== "public" || !["verified", "computed"].includes(fact.status)) return null;
  return typeof fact.value === "string" && fact.value.trim() ? fact.value.trim() : null;
}

export function buildSwissModel(facts: SwissFacts = COMPANY_FACTS, offices: readonly SwissOfficeRecord[] = OFFICES) {
  const approvedOffices = swissPublicValue(facts.operationalOffices);
  const office = approvedOffices && /Granges-Marnand/i.test(approvedOffices) && /Switzerland/i.test(approvedOffices)
    ? offices.find(item => item.id === "switzerland" && item.kind === "office" && item.status === "verified" && item.visibility !== "internal" && item.region === "Switzerland" && /Granges-Marnand/i.test(item.cityLine))
    : undefined;
  const rawAddress = office?.addressLine?.trim();
  const address = rawAddress && /\bGranges-Marnand\b/i.test(rawAddress)
    ? /\bSwitzerland\b/i.test(rawAddress) ? rawAddress : `${rawAddress}, Switzerland`
    : null;
  const phones = address ? (office?.phones ?? []).flatMap(phone => {
    const display = phone.display.trim();
    const normalized = display.replace(/[ ()-]/g, "");
    return /^\+41\d{9}$/.test(phone.e164) && normalized === phone.e164
      ? [{ display, href: `tel:${phone.e164}` }]
      : [];
  }) : [];
  const headquarters = swissPublicValue(facts.headquarters);
  const indoreAddress = headquarters && /\bIndore\b/i.test(headquarters) ? headquarters : null;
  const rawEmail = swissPublicValue(facts.email);
  const email = rawEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail) ? rawEmail : null;
  const year = swissPublicValue(facts.foundedYear);
  return {
    brand: swissPublicValue(facts.brandName),
    legalName: swissPublicValue(facts.legalName),
    address,
    mapHref: address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}` : null,
    phones,
    indoreAddress,
    email,
    emailHref: email ? `mailto:${email}` : null,
    foundedYear: year && /^\d{4}$/.test(year) ? year : null,
  };
}
export type SwissModel = ReturnType<typeof buildSwissModel>;

export const SWISS_ORIGINAL_DESCRIPTION = "Savo Technologies' head office is in Granges-Marnand, Switzerland. Web development, mobile apps, custom software, AI agents and SEO/AEO/GEO services for Swiss and European clients, delivered with our Indore engineering headquarters.";
export function swissDescription(model: SwissModel) {
  return model.address && model.indoreAddress ? SWISS_ORIGINAL_DESCRIPTION : "Explore web development, mobile apps, custom software, AI agents and search services with Savo Technologies. Contact the team to confirm current Swiss office and engineering arrangements.";
}

/** All six original service titles, descriptions and destinations remain verbatim. */
export const SWISS_SERVICES = [
  { title: "Web development", body: "Corporate websites, web applications and platforms on Next.js and React: fast, accessible and engineered for European buyers and search engines.", href: "/services/web-development" },
  { title: "Mobile app development", body: "iOS and Android apps with Flutter and React Native, from first release to store-scale operation.", href: "/services/mobile-app-development" },
  { title: "AI agents & agentic systems", body: "Agents with tool use, retrieval, evaluation and guardrails: automation that holds up in production, not slideware.", href: "/ai-agents" },
  { title: "Custom software & SaaS", body: "Operational software, portals and SaaS platforms on PostgreSQL-grade architecture, built for the long run.", href: "/services/custom-software-development" },
  { title: "UI/UX design", body: "Product design that European users find obvious and beautiful: research, prototypes, design systems.", href: "/services/ui-ux-design" },
  { title: "SEO, AEO & GEO", body: "Classic search plus answer engines and generative engines: being found however your clients ask.", href: "/services" },
] as const;

export function buildSwissWorking(model: SwissModel) {
  return [
    { title: "Conversations in European hours.", body: "Arrange calls and decisions around Europe/Zurich - CET in winter and CEST in summer. Confirm availability, your point of contact and who will own communication for the engagement." },
    { title: model.indoreAddress ? "Engineering from Indore." : "An agreed engineering arrangement.", body: model.indoreAddress ? "Indore runs on India Standard Time (UTC+5:30). Agree review points, handoffs and response expectations. A time difference is not a next-morning delivery promise." : "Confirm the engineering location, review points, handoffs and response expectations. Availability and delivery timing belong in the engagement plan." },
  ];
}

/** Original ten questions; location facts and engagement commitments are guarded/qualified. */
export function buildSwissFaqs(model: SwissModel) {
  const answers = [
    model.address ? `Yes. Our head office is at ${model.address}.${model.phones[0] ? ` The direct line is ${model.phones[0].display}.` : " Contact the team to confirm the direct line."}${model.indoreAddress ? " Our engineering headquarters is in Indore, India." : " Confirm current engineering arrangements with the team."}` : "The Swiss head-office details are awaiting public confirmation. Contact the team before planning a visit or relying on a direct office number.",
    "Corporate websites and web applications, mobile apps, custom software and SaaS platforms, AI agents and automation, UI/UX design, and SEO, AEO and GEO services. Discuss your scope and the delivery arrangement with the team.",
    model.address && model.indoreAddress ? "The Granges-Marnand head office and Indore engineering headquarters provide two bases for the engagement. Agree European-hours conversations, engineering reviews and handoffs around your project. The locations alone do not establish team seniority, available capacity or a shorter timeline." : "Discuss the current office and engineering arrangements, communication rhythm and review process. Confirm the team and availability rather than inferring capacity from locations.",
    "Swiss local time follows Europe/Zurich: CET (UTC+1) in winter and CEST (UTC+2) in summer. India uses IST (UTC+5:30), so the difference is 4½ hours in winter and 3½ hours in summer. Agree call times and response expectations; next-morning progress or replies are not guaranteed.",
    model.address ? "Ask the team to arrange a meeting or working session at the Granges-Marnand office before travelling. Remote calls are another way to begin. Confirm the location, format, participants and availability for your enquiry." : "Contact the team to confirm the current Swiss location and whether an in-person meeting or working session can be arranged. A remote call is another option to discuss.",
    "Send a message through the contact page or start a project brief. Share your goals and constraints. Confirm response timing, discovery, proposal scope and any NDA arrangements with the team before sharing sensitive details; the brief is not a commitment.",
    `Best depends on evidence, not slogans: verifiable work, a transparent review process, clear code ownership and what references may be shared.${model.foundedYear ? ` ${model.brand ?? "The business"} has operated since ${model.foundedYear}.` : ""} Review published practices and ask for evidence relevant to your project. A location is not a ranking or a verified outcome.`,
    "For enquiries from Zurich, Geneva, Basel, Bern, Lausanne or elsewhere in Switzerland and Europe, contact the team to discuss remote delivery, working hours and any visit requirements. These cities are enquiry locations, not additional Savo offices or an assertion of existing clients.",
    "Cost follows scope, the proposed team and delivery model, not geography alone. Discuss discovery, milestones and ongoing costs for your requirements. Confirm currency, pricing, proposal timing and the contracting entity. A two-office setup does not guarantee savings or a fixed-scope contract.",
    `${model.legalName ? `The legal entity is ${model.legalName}.` : "The legal-entity details are awaiting public confirmation."}${model.indoreAddress ? " Its engineering headquarters is in Indore, India." : " Confirm current engineering arrangements with the team."}${model.address ? " The head office is in Granges-Marnand, Switzerland." : " Swiss office details are awaiting public confirmation."} A physical office does not establish a separately incorporated Swiss entity. Confirm the contracting entity and jurisdiction for your engagement.`,
  ];
  return SWITZERLAND_FAQS.map((item, index) => ({ q: item.q, a: answers[index] }));
}
