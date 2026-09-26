/**
 * Insights - article content for /resources/. Ported from version 1
 * with v6 rules: authors dropped (no invented people), client-specific
 * performance claims removed from excerpts; the editorial substance
 * carries over. Body blocks render in the dossier reading style.
 */

export type Article = {
  slug: string;
  title: string;
  cat: "Engineering" | "AI" | "Design" | "Delivery";
  /** Editorial image shown on the index grid and the reading page. */
  image: string;
  excerpt: string;
  time: string;
  date: string;
  body: { h?: string; p?: string; li?: string[] }[];
  authorName?: string;
};

export const ARTICLES: Article[] = [
  {
    slug: "ai-agents-in-production",
    image: "/images/architecture.webp",
    title: "What we learned shipping AI agents into production",
    cat: "AI",
    excerpt: "The patterns that survived contact with real users, and the ones we retired.",
    time: "9 min read",
    date: "Feb 2026",
    body: [
      { p: "Everyone can demo an AI agent. Keeping one in production, earning trust with real users every day, is a different discipline. After shipping production agents across healthcare, telecom and finance, here is what survived and what we quietly retired." },
      { h: "Guardrails are the product" },
      { p: "The single biggest lesson: users forgive a limited agent and abandon an unreliable one. Our best performing agent answers fewer question types than the version before it, but every answer it gives is one it can stand behind." },
      { li: [
        "Every agent action passes a confidence gate, and low confidence routes to a human with full context.",
        "The agent declares what it cannot do, in plain language, on the interface itself.",
        "Every conversation is logged for review, and the review loop ships improvements weekly.",
      ] },
      { h: "Retrieval beats fine tuning, still" },
      { p: "For enterprise knowledge, a well structured retrieval layer with fresh documents outperformed every fine tuning experiment we ran, at a fraction of the cost. Fine tuning earned its place for tone and format, not for facts." },
      { h: "The metric that matters is containment with satisfaction" },
      { p: "Deflection alone is a vanity metric. An agent that closes most tickets while satisfying users is a win; an agent that closes most tickets while enraging them is a slow motion brand failure. Measure both, publish both, improve both." },
      { p: "The teams winning with agents treat them like products with owners, roadmaps and support, not like features that shipped once. That is the entire secret." },
    ],
  },
  {
    slug: "core-web-vitals-budgets",
    image: "/images/code.webp",
    title: "Core Web Vitals: the budgets we ship with",
    cat: "Engineering",
    excerpt: "The exact performance numbers in every Savo web proposal, and how we enforce them in CI.",
    time: "6 min read",
    date: "Jan 2026",
    body: [
      { p: "Speed is a feature users can feel and search engines can measure. Rather than promising performance and hoping, we put numbers in the contract and gates in the pipeline. These are the budgets." },
      { h: "The budgets" },
      { li: [
        "Largest Contentful Paint under 2.5 seconds on a mid tier phone over 4G.",
        "Interaction to Next Paint under 200 milliseconds on the top ten pages.",
        "Cumulative Layout Shift under 0.1, enforced with element level annotations.",
        "Total JavaScript under 170KB compressed on first load for marketing routes.",
      ] },
      { h: "How CI keeps them honest" },
      { p: "Every pull request runs Lighthouse against the changed routes, and a regression beyond ten percent fails the build. Budgets are cheap when they are enforced by machines and expensive when they are enforced by arguments." },
      { p: "Fast is not a nice to have. It is the cheapest growth lever most teams never pull." },
    ],
  },
  {
    slug: "wcag-aa-in-practice",
    image: "/images/meeting.webp",
    title: "WCAG AA in practice: the testing loop behind every portal",
    cat: "Design",
    excerpt: "Accessibility as a build requirement, not a compliance scramble. Our exact checklist and test loop.",
    time: "8 min read",
    date: "Jan 2026",
    body: [
      { p: "Accessibility fails in the gap between the guidelines and the pull request. Closing that gap is a process problem, and after years of shipping portals that must pass audits, ours looks like this." },
      { h: "The loop" },
      { li: [
        "Design tokens encode contrast, focus and touch target rules, so compliance is the default path.",
        "Every component ships with keyboard only test notes in the PR description.",
        "Screen reader passes happen during the build, on the flows that matter, not the week before launch.",
        "Each release ends with a manual audit of the top journeys against a fixed checklist.",
      ] },
      { h: "What it buys" },
      { p: "Beyond the legal floor: interfaces that work for tired users, one handed users, small screens and slow connections. Accessibility work is usability work that pays everybody." },
      { p: "The portals that pass audits quietly are the ones where nobody had to think about passing audits. That is the goal: make the right path the paved path." },
    ],
  },
  {
    slug: "offshore-without-the-risk",
    image: "/images/team.webp",
    title: "How to hire an offshore team without the classic risks",
    cat: "Delivery",
    excerpt: "The questions to ask, the contracts to demand and the warning signs we would flag even about ourselves.",
    time: "7 min read",
    date: "Dec 2025",
    body: [
      { p: "Offshore hiring fails in predictable ways: mystery teams, bait and switch seniors, code nobody owns. It succeeds in predictable ways too. The difference is knowing which questions to ask before the contract." },
      { h: "Ask these before signing" },
      { li: [
        "Who exactly will work on my product, names, interviews, and the right to refuse a profile.",
        "What happens in the first two weeks if the fit is wrong, in writing, not in a call.",
        "Who owns the repository, infrastructure and credentials from day one.",
        "How senior is senior, ask for shipped work, not years.",
      ] },
      { h: "The warning signs" },
      { p: "Rates quoted before anyone understands the work. A trial that costs money with no escape. Team composition that changes after the contract. Any answer to the ownership question that is not an immediate yes." },
      { p: "We would flag all of these even about ourselves, that is the standard the questions set. The right partner answers them before you finish asking." },
    ],
  },
  {
    slug: "offline-first-field-apps",
    image: "/images/mobile.webp",
    title: "Offline first field apps that drivers actually keep using",
    cat: "Engineering",
    excerpt: "The sync patterns behind field tools that survive dead zones, bad mounts and long shifts.",
    time: "11 min read",
    date: "Dec 2025",
    body: [
      { p: "Field software dies in the dead zone. The truck leaves coverage, the app spins, the driver switches to paper and never comes back. Offline first is not a feature you add; it is an architecture you start with." },
      { h: "The three rules" },
      { li: [
        "The app is the source of truth on the device; sync is background, never blocking.",
        "Every mutation is idempotent and carries its intent, so retries are safe and duplicates impossible.",
        "Conflicts resolve by explicit rules the operator chose in advance, never by last write wins.",
      ] },
      { h: "Design for the cab" },
      { p: "Big targets, high contrast, glanceable state, designed for gloves, glare and a mount vibrating at 80 kilometers an hour. The best sync engine in the world fails behind a button a driver cannot hit." },
      { p: "The measure of a field app is what the driver does on day thirty, not what the demo showed on day one. Offline first is how day thirty survives." },
    ],
  },
  {
    slug: "estimating-software-honestly",
    image: "/images/studio.webp",
    title: "Why software estimates are always wrong, and how to plan anyway",
    cat: "Delivery",
    excerpt: "A calmer way to budget software: ranges, milestones and the conversations estimates should trigger.",
    time: "6 min read",
    date: "Nov 2025",
    body: [
      { p: "Every software estimate is wrong. The honest ones are wrong in a useful direction. The dishonest ones are single numbers delivered with confidence and defended until launch." },
      { h: "Estimate ranges, price milestones" },
      { p: "We quote ranges that narrow as learning arrives, and price fixed milestones inside them. You buy certainty per slice; we carry the uncertainty between slices. That is what the two week trial is for on both sides." },
      { li: [
        "A range with assumptions written down is a plan; a single number is a wish.",
        "Every milestone ends with working software you can stop at.",
        "When reality diverges from the range, the conversation happens that week, not at delivery.",
      ] },
      { p: "The purpose of an estimate is not prediction. It is deciding what to build first, and making the number honest enough to plan a business on." },
    ],
  },
];

export function getArticle(slug: string): Article | undefined {
  return ARTICLES.find((a) => a.slug === slug);
}
