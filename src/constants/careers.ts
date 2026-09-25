/**
 * Careers content — roles and hiring facts carried from version 1
 * (/newdesign/careers), structured for the v6 document language.
 *
 * Team-size / retention / eNPS figures from v1 were placeholder numbers;
 * per the v6 honesty rule they are not published — only verifiable
 * facts (roles, process, bands, remote policy) appear on the page.
 */

export const CAREERS_EMAIL = "hr@savotechnologies.com";

/** Date the current role list was published (bump when roles change — feeds JobPosting schema). */
export const ROLES_POSTED = "2026-09-24";

export type RoleCategory = "eng" | "design" | "ops";

/** Literal title tuple — Role.title is typed against it so data can never drift
 *  from the values the enquiry schema accepts. */
export const ROLE_TITLES = [
  "Senior Frontend Engineer",
  "Backend Engineer",
  "AI / ML Engineer",
  "Mobile Engineer",
  "DevOps Engineer",
  "UI/UX Designer",
] as const;

export type RoleTitle = (typeof ROLE_TITLES)[number];

export type Role = {
  /** Free-form — managed roles come from the admin panel; ROLE_TITLES is the coded baseline. */
  title: string;
  /** Short tech/craft track, e.g. "React · Next.js". */
  track: string;
  cat: RoleCategory;
  exp: string;
  band: string;
  /** CTC range in ₹ lakh per annum — feeds the JobPosting baseSalary. */
  ctc: [number, number];
  blurb: string;
  duties: string[];
  brings: string[];
};

export function roleSlug(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

/** Open positions — single source for the careers page, the apply form and JobPosting JSON-LD. */
export const ROLES: Role[] = [
  {
    title: "Senior Frontend Engineer",
    track: "React · Next.js",
    cat: "eng",
    exp: "3 to 6 years",
    band: "₹18L to ₹30L",
    ctc: [18, 30],
    blurb:
      "Own interfaces that ship to millions: design systems, performance budgets and accessibility as first class citizens.",
    duties: [
      "Lead feature builds across React and Next.js codebases with real performance budgets",
      "Grow the design system reused across healthcare and fintech products",
      "Pair with designers weekly and mentor two junior engineers",
    ],
    brings: [
      "Deep React and TypeScript plus an accessibility story you can defend",
      "Core Web Vitals wins you can show with numbers",
      "Comfort owning a product surface end to end",
    ],
  },
  {
    title: "Backend Engineer",
    track: "Node.js · PostgreSQL",
    cat: "eng",
    exp: "2 to 5 years",
    band: "₹12L to ₹24L",
    ctc: [12, 24],
    blurb:
      "Design APIs and data models behind healthcare, fintech and logistics products with real uptime stakes.",
    duties: [
      "Design REST and event driven services for regulated industries",
      "Own schema design, migrations and query performance in PostgreSQL",
      "Write the integration tests you refuse to live without",
    ],
    brings: [
      "Production Node.js and SQL you have tuned under load",
      "A security mindset: least privilege, audit trails, sane auth",
      "Clear written technical decisions",
    ],
  },
  {
    title: "AI / ML Engineer",
    track: "Agents · RAG · LLMs",
    cat: "eng",
    exp: "2 to 5 years",
    band: "₹15L to ₹28L",
    ctc: [15, 28],
    blurb:
      "Build the agent fleet clients actually deploy: retrieval, tooling, evaluation and guardrails in production.",
    duties: [
      "Ship retrieval pipelines and tool using agents to client environments",
      "Build evaluation harnesses that catch regressions before clients do",
      "Keep inference costs honest with caching and routing",
    ],
    brings: [
      "Hands on LLM application experience, not just notebooks",
      "Python plus one production backend ecosystem",
      "Opinions on guardrails and how to test them",
    ],
  },
  {
    title: "Mobile Engineer",
    track: "React Native · Flutter",
    cat: "eng",
    exp: "2 to 5 years",
    band: "₹10L to ₹20L",
    ctc: [10, 20],
    blurb:
      "Ship store releases weekly for GCC and Indian consumers on codebases you would be proud to show.",
    duties: [
      "Own release trains for iOS and Android from branch to store review",
      "Keep crash free sessions above 99.5 across the fleet",
      "Work shoulder to shoulder with backend on offline first flows",
    ],
    brings: [
      "Shipped apps you can point to on the stores",
      "Native debugging skills on at least one platform",
      "Care for accessibility on small screens",
    ],
  },
  {
    title: "DevOps Engineer",
    track: "AWS · Kubernetes · Terraform",
    cat: "ops",
    exp: "3 to 6 years",
    band: "₹16L to ₹28L",
    ctc: [16, 28],
    blurb:
      "Run zero drama infrastructure: pipelines, observability and cost discipline across client environments.",
    duties: [
      "Own CI/CD pipelines from commit to production across client projects",
      "Keep clusters boring: autoscaling, backups, restores rehearsed",
      "Cut cloud spend without cutting reliability",
    ],
    brings: [
      "Terraform managed multi environment AWS",
      "Kubernetes in production with the scars to prove it",
      "Observability habit: dashboards before incidents",
    ],
  },
  {
    title: "UI/UX Designer",
    track: "Product · Brand",
    cat: "design",
    exp: "2 to 5 years",
    band: "₹8L to ₹16L",
    ctc: [8, 16],
    blurb:
      "Turn fuzzy briefs into systems: research, flows and interfaces that developers can build without guessing.",
    duties: [
      "Run discovery: interviews, flows and prototypes that survive contact with engineers",
      "Extend the design system across web and mobile surfaces",
      "Validate with users, not opinions",
    ],
    brings: [
      "A portfolio of shipped product work with your reasoning",
      "Figma fluency including variables and component libraries",
      "Writing that clarifies instead of decorates",
    ],
  },
];

/** Chip shown in the apply form when no open role fits. */
export const GENERAL_APPLICATION = "General application" as const;

/** Literal tuple — accepted for the projectType column when source is "careers". */
export const CAREERS_TYPES = [...ROLE_TITLES, GENERAL_APPLICATION] as const;

export const ROLE_FILTERS: ReadonlyArray<{ key: "all" | RoleCategory; label: string }> = [
  { key: "all", label: "All roles" },
  { key: "eng", label: "Engineering" },
  { key: "design", label: "Design" },
  { key: "ops", label: "Operations" },
];

/** The four-step hiring promise (version-1 apply page, verbatim intent). */
export const HIRING_STEPS = [
  {
    step: "01",
    title: "Two business days",
    text: "An engineer, not a recruiter, reads every application and replies personally. Yes or no, you hear back.",
  },
  {
    step: "02",
    title: "Technical conversation",
    text: "Sixty minutes on real problems from our products, not trick puzzles or whiteboard trivia.",
  },
  {
    step: "03",
    title: "Paid pairing session",
    text: "Two hours on a small real task with the team you would join, compensated, because your time is work.",
  },
  {
    step: "04",
    title: "Written offer",
    text: "Within a week of the final round: role, band, start date and reviewer, in writing.",
  },
] as const;

/** What working here is actually like — every claim is anchored to published site content. */
export const LIFE_POINTS = [
  {
    title: "Real products, real stakes",
    text: "Hospital systems, payment rails, AI agents in production. Your code ships to users who depend on it, often in regulated industries where correctness is the product.",
  },
  {
    title: "Small senior teams",
    text: "Six disciplines, one connected team. No layer-cake hierarchy: you talk to the people making the decisions, from first week to final release.",
  },
  {
    title: "Design × engineering, one room",
    text: "Designers and engineers decide together, daily. The best interface is the one you stop noticing, and everyone here can argue both halves of that sentence.",
  },
  {
    title: "Remote first, India",
    text: "Indore · remote across India, with clients across five regions. Async by default, honest in writing, meetings only when they earn their slot.",
  },
  {
    title: "Learn in production",
    text: "Agent fleets with guardrails, healthcare compliance, fintech rails. The hard problems arrive on day one, and you are trusted with them early.",
  },
] as const;

/* ------------------------- Apply-form options ------------------------ */

export const SKILLS = [
  "React", "Next.js", "TypeScript", "Node.js", "Python", "PostgreSQL",
  "AI / ML", "Flutter", "React Native", "AWS", "Docker", "Kubernetes",
  "CI / CD", "Testing", "UI / UX", "Figma",
] as const;

export const EXPERIENCE_OPTIONS = ["0 to 1 year", "1 to 3 years", "3 to 5 years", "5 to 8 years", "8+ years"] as const;

export const NOTICE_OPTIONS = ["Immediate", "15 days", "30 days", "60 days", "90 days"] as const;

export const CTC_OPTIONS = ["Under ₹10L", "₹10L to ₹20L", "₹20L to ₹35L", "₹35L+", "Open to discussion"] as const;
