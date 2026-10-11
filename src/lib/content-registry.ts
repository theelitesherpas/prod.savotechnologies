/**
 * Content collection registry - the contract between the admin panel's
 * generic collection engine and each website collection it manages.
 *
 * Every managed collection (insights articles, careers roles, case-study
 * entries, hire roles, AI services, agent personas) declares:
 *   - presentation metadata (label, icon, description, public note)
 *   - a field schema that drives both the admin form (client) and the
 *     server-side FormData parser (see content/actions.ts)
 *   - seed items imported from src/constants, used by the "Import
 *     defaults" action and as the guaranteed fallback when the table
 *     is empty (mirrors the services/industries pattern)
 *
 * This module must stay importable from client components: plain data
 * and constants only - no server-only imports.
 */

import { ARTICLES } from "@/constants/insights";
import { ROLES, roleSlug } from "@/constants/careers";
import { CASE_DISCIPLINES } from "@/constants/case-studies";
import { HIRE_ROLES } from "@/constants/hire";
import { AI_SERVICES } from "@/constants/ai-services";
import { AGENTS } from "@/constants/agents";
import { INDUSTRY_DOSSIERS } from "@/content/industries/dossiers";
import { INDUSTRY_LAYOUTS } from "@/content/industries/schema";
import { ABOUT_TEAM_PHOTO_SIZE } from "@/constants/about-team";
import { TESTIMONIAL_VIDEO_POSTER_SIZE } from "@/constants/testimonials";

// ───────────────────────── Field vocabulary ─────────────────────────

export type ObjectListSubField = {
  name: string;
  label: string;
  type: "text" | "textarea";
};

export type FieldDef = {
  /** Key inside the item's `data` JSON payload. */
  name: string;
  label: string;
  type:
    | "text"
    | "textarea"
    | "image"
    | "number"
    | "boolean"
    | "select"
    | "slug"
    | "list"
    | "object-list"
    | "blocks";
  required?: boolean;
  help?: string;
  placeholder?: string;
  rows?: number;
  /** Half-width fields pair up on the form grid. */
  width?: "full" | "half";
  /** select */
  options?: { value: string; label: string }[];
  /** object-list */
  fields?: ObjectListSubField[];
  /** blocks */
  editor?: "rich-text";
  /** image */
  altFieldName?: string;
  altFieldRequired?: boolean;
  targetWidth?: number;
  targetHeight?: number;
  /** list / object-list row noun, e.g. "FAQ", "step". */
  itemLabel?: string;
  defaultValue?: string | number | boolean;
  /** Retain legacy values in the item payload without presenting obsolete controls. */
  legacy?: boolean;
};

export type SeedItem = {
  slug: string;
  title: string;
  order: number;
  active?: boolean;
  data: Record<string, unknown>;
};

export type CollectionKey =
  | "insights"
  | "careers"
  | "case-studies"
  | "testimonials"
  | "team"
  | "hire"
  | "ai-services"
  | "agents"
  | "industry-dossiers";

export type CollectionDef = {
  key: CollectionKey;
  /** Sidebar label (plural). */
  label: string;
  /** Single item noun, used in buttons ("New article"). */
  singular: string;
  /** Where this collection renders on the public site. */
  publicNote: string;
  /** Field whose value becomes the row title ("title" or "name"). */
  titleField: string;
  icon:
    | "pen"
    | "briefcase"
    | "folder"
    | "crew"
    | "chip"
    | "bot";
  fields: FieldDef[];
  newDefaults: () => Record<string, unknown>;
  seeds: () => SeedItem[];
};

// ─────────────────────────── Collections ────────────────────────────

const insights: CollectionDef = {
  key: "insights",
  label: "Insights articles",
  singular: "article",
  publicNote: "The /insights/ reading library and article pages. Only active Published articles appear publicly; no sample fallback.",
  titleField: "title",
  icon: "pen",
  fields: [
    { name: "title", label: "Title", type: "text", required: true, width: "half" },
    { name: "slug", label: "Slug (/insights/…/)", type: "slug", required: true, width: "half" },
    {
      name: "cat",
      label: "Category",
      type: "select",
      required: true,
      width: "half",
      options: [
        { value: "AI", label: "AI" },
        { value: "Engineering", label: "Engineering" },
        { value: "Design", label: "Design" },
        { value: "Delivery", label: "Delivery" },
      ],
    },
    { name: "industrySlugs", label: "Related industries", type: "list", required: true, itemLabel: "industry", options: INDUSTRY_DOSSIERS.map((industry) => ({ value: industry.slug, label: industry.title })), help: "Choose one or more industries. Published articles appear in each selected industry’s reading list." },
    { name: "image", label: "Cover image", type: "image", required: true, width: "full", altFieldName: "imageAlt", altFieldRequired: true, help: "Crop to 1600 × 900. Large uploads are resized and compressed for fast loading." },
    { name: "excerpt", label: "Excerpt", type: "textarea", rows: 3, required: true },
    {
      name: "body",
      label: "Body",
      type: "blocks",
      editor: "rich-text",
      required: true,
      itemLabel: "block",
      help: "Format as you write: choose heading levels and text sizes, emphasize text, add links or build lists. Unsafe markup is removed when saved.",
    },
  ],
  newDefaults: () => ({
    cat: "Engineering",
    image: "",
    excerpt: "",
    body: [{ p: "" }],
  }),
  seeds: () =>
    ARTICLES.map((a, i) => ({
      slug: a.slug,
      title: a.title,
      order: i,
      data: {
        cat: a.cat,
        image: a.image,
        excerpt: a.excerpt,
        body: a.body as unknown,
      },
    })),
};

const careers: CollectionDef = {
  key: "careers",
  label: "Careers roles",
  singular: "role",
  publicNote: "Open roles on /careers/ (accordion, apply form and JobPosting schema).",
  titleField: "title",
  icon: "briefcase",
  fields: [
    { name: "title", label: "Role title", type: "text", required: true, width: "half" },
    { name: "slug", label: "Slug (apply deep-link)", type: "slug", required: true, width: "half", help: "Derived from the title by default." },
    { name: "track", label: "Track", type: "text", width: "half", placeholder: "React · Next.js" },
    {
      name: "cat",
      label: "Team",
      type: "select",
      width: "half",
      options: [
        { value: "eng", label: "Engineering" },
        { value: "design", label: "Design" },
        { value: "ops", label: "Operations" },
      ],
    },
    { name: "exp", label: "Experience", type: "text", width: "half", placeholder: "3 to 6 years" },
    { name: "band", label: "Band (display)", type: "text", width: "half", placeholder: "₹18L to ₹30L" },
    { name: "ctcMin", label: "CTC min (₹ lakh/yr)", type: "number", width: "half", help: "Feeds the JobPosting salary range." },
    { name: "ctcMax", label: "CTC max (₹ lakh/yr)", type: "number", width: "half" },
    { name: "blurb", label: "Blurb", type: "textarea", rows: 3, required: true },
    { name: "duties", label: "What you will do", type: "list", itemLabel: "duty" },
    { name: "brings", label: "What you bring", type: "list", itemLabel: "point" },
  ],
  newDefaults: () => ({
    track: "",
    cat: "eng",
    exp: "2 to 5 years",
    band: "",
    ctcMin: 12,
    ctcMax: 24,
    blurb: "",
    duties: [""],
    brings: [""],
  }),
  seeds: () =>
    ROLES.map((r, i) => ({
      slug: roleSlug(r.title),
      title: r.title,
      order: i,
      data: {
        track: r.track,
        cat: r.cat,
        exp: r.exp,
        band: r.band,
        ctcMin: r.ctc[0],
        ctcMax: r.ctc[1],
        blurb: r.blurb,
        duties: r.duties as unknown,
        brings: r.brings as unknown,
      },
    })),
};

const caseStudies: CollectionDef = {
  key: "case-studies",
  label: "Case studies",
  singular: "case study",
  publicNote: "Entries filed by discipline on /case-studies/ (discipline structure stays code-defined).",
  titleField: "name",
  icon: "folder",
  fields: [
    {
      name: "discipline",
      label: "Discipline",
      type: "select",
      required: true,
      width: "half",
      options: CASE_DISCIPLINES.map((d) => ({ value: d.id, label: d.title })),
    },
    { name: "featured", label: "Featured in discipline", type: "boolean", width: "half", help: "One entry per discipline leads its section." },
    { name: "name", label: "Client / project name", type: "text", required: true, width: "half", placeholder: "[Project Name]" },
    { name: "sector", label: "Sector", type: "text", width: "half", placeholder: "Professional Services" },
    { name: "services", label: "Services", type: "text", width: "half", placeholder: "Corporate platform · Customer portal" },
    { name: "stack", label: "Stack", type: "text", width: "half", placeholder: "Next.js · Node.js · PostgreSQL" },
    { name: "outcome", label: "Verified outcome", type: "textarea", rows: 3, placeholder: "[Verified project result required]", help: "Publish only client-approved figures - placeholders stay honest." },
  ],
  newDefaults: () => ({
    discipline: "web",
    featured: false,
    name: "[Project Name]",
    sector: "",
    services: "",
    stack: "",
    outcome: "[Verified project result required]",
  }),
  seeds: () =>
    CASE_DISCIPLINES.flatMap((d) =>
      d.entries.map((e, i) => ({
        slug: `${d.id}-${e.sector.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "entry"}-${i + 1}`,
        title: e.name,
        order: i,
        data: {
          discipline: d.id as unknown as string,
          featured: e.featured,
          name: e.name,
          sector: e.sector,
          services: e.services,
          stack: e.stack,
          outcome: e.outcome,
        },
      })),
    ),
};

const hire: CollectionDef = {
  key: "hire",
  label: "Hire roles",
  singular: "hire role",
  publicNote: "Dedicated-hiring catalogue on /hire/ - index and per-role pages.",
  titleField: "title",
  icon: "crew",
  fields: [
    { name: "title", label: "Title", type: "text", required: true, width: "half" },
    { name: "slug", label: "Slug (/hire/…/)", type: "slug", required: true, width: "half" },
    { name: "short", label: "Short label", type: "text", width: "half", placeholder: "AI & ML" },
    { name: "tagline", label: "Tagline", type: "text", width: "half" },
    { name: "heroLead", label: "Hero lead", type: "textarea", rows: 3 },
    { name: "metaDescription", label: "Meta description", type: "textarea", rows: 2, help: "SEO description for the role page." },
    { name: "intro1", label: "Intro · first paragraph", type: "textarea", rows: 4 },
    { name: "intro2", label: "Intro · second paragraph", type: "textarea", rows: 4 },
    { name: "monthly", label: "Monthly rate (INR)", type: "number", width: "half", help: "Published dedicated-senior rate." },
    { name: "iconSlug", label: "Icon slug", type: "text", width: "half", placeholder: "ai-ml-engineers", help: "Service-icon slug used as the role mark." },
    { name: "stack", label: "Stack chips", type: "list", itemLabel: "chip" },
    {
      name: "engagements",
      label: "Workbench engagements",
      type: "object-list",
      itemLabel: "engagement",
      fields: [
        { name: "title", label: "Title", type: "text" },
        { name: "text", label: "Text", type: "textarea" },
      ],
    },
    {
      name: "skills",
      label: "Skills",
      type: "object-list",
      itemLabel: "skill",
      fields: [
        { name: "title", label: "Title", type: "text" },
        { name: "text", label: "Text", type: "textarea" },
      ],
    },
    {
      name: "process",
      label: "Process",
      type: "object-list",
      itemLabel: "step",
      fields: [
        { name: "name", label: "Name", type: "text" },
        { name: "text", label: "Text", type: "textarea" },
      ],
    },
    {
      name: "why",
      label: "Why this role",
      type: "object-list",
      itemLabel: "point",
      fields: [
        { name: "title", label: "Title", type: "text" },
        { name: "text", label: "Text", type: "textarea" },
      ],
    },
    {
      name: "faqs",
      label: "FAQs",
      type: "object-list",
      itemLabel: "FAQ",
      fields: [
        { name: "q", label: "Question", type: "text" },
        { name: "a", label: "Answer", type: "textarea" },
      ],
    },
    { name: "related", label: "Related role slugs", type: "list", itemLabel: "slug" },
  ],
  newDefaults: () => ({
    short: "",
    tagline: "",
    heroLead: "",
    metaDescription: "",
    intro1: "",
    intro2: "",
    monthly: 240000,
    iconSlug: "",
    stack: [""],
    engagements: [{ title: "", text: "" }],
    skills: [],
    process: [],
    why: [],
    faqs: [],
    related: [],
  }),
  seeds: () =>
    HIRE_ROLES.map((r, i) => ({
      slug: r.slug,
      title: r.title,
      order: i,
      data: {
        short: r.short,
        tagline: r.tagline,
        heroLead: r.heroLead,
        metaDescription: r.metaDescription,
        intro1: r.intro[0],
        intro2: r.intro[1],
        monthly: r.monthly,
        iconSlug: r.iconSlug,
        stack: r.stack as unknown,
        engagements: r.engagements as unknown,
        skills: r.skills as unknown,
        process: r.process as unknown,
        why: r.why as unknown,
        faqs: r.faqs as unknown,
        related: r.related as unknown,
      },
    })),
};

const aiServices: CollectionDef = {
  key: "ai-services",
  label: "AI services",
  singular: "AI service",
  publicNote: "AI practice chapters on /ai/[slug]/ (GenAI, consulting, ML).",
  titleField: "title",
  icon: "chip",
  fields: [
    { name: "title", label: "Title", type: "text", required: true, width: "half" },
    { name: "slug", label: "Slug (/ai/…/)", type: "slug", required: true, width: "half" },
    { name: "short", label: "Short label", type: "text", width: "half", placeholder: "GenAI" },
    { name: "tagline", label: "Tagline", type: "text", width: "half" },
    { name: "heroLead", label: "Hero lead", type: "textarea", rows: 3 },
    { name: "metaDescription", label: "Meta description", type: "textarea", rows: 2 },
    { name: "overview1", label: "Overview · first paragraph", type: "textarea", rows: 4 },
    { name: "overview2", label: "Overview · second paragraph", type: "textarea", rows: 4 },
    {
      name: "engagements",
      label: "Engagements",
      type: "object-list",
      itemLabel: "engagement",
      fields: [
        { name: "title", label: "Title", type: "text" },
        { name: "text", label: "Text", type: "textarea" },
      ],
    },
    {
      name: "process",
      label: "Process",
      type: "object-list",
      itemLabel: "step",
      fields: [
        { name: "name", label: "Name", type: "text" },
        { name: "text", label: "Text", type: "textarea" },
      ],
    },
    { name: "stack", label: "Stack chips", type: "list", itemLabel: "chip" },
    {
      name: "faqs",
      label: "FAQs",
      type: "object-list",
      itemLabel: "FAQ",
      fields: [
        { name: "q", label: "Question", type: "text" },
        { name: "a", label: "Answer", type: "textarea" },
      ],
    },
  ],
  newDefaults: () => ({
    short: "",
    tagline: "",
    heroLead: "",
    metaDescription: "",
    overview1: "",
    overview2: "",
    stack: [""],
    engagements: [{ title: "", text: "" }],
    process: [],
    faqs: [],
  }),
  seeds: () =>
    AI_SERVICES.map((s, i) => ({
      slug: s.slug,
      title: s.title,
      order: i,
      data: {
        short: s.short,
        tagline: s.tagline,
        heroLead: s.heroLead,
        metaDescription: s.metaDescription,
        overview1: s.overview[0],
        overview2: s.overview[1],
        engagements: s.engagements as unknown,
        process: s.process as unknown,
        stack: s.stack as unknown,
        faqs: s.faqs as unknown,
      },
    })),
};

const agents: CollectionDef = {
  key: "agents",
  label: "AI agents",
  singular: "agent",
  publicNote: "The agent fleet on /ai-agents/ - personas, deliverables and tags.",
  titleField: "name",
  icon: "bot",
  fields: [
    { name: "name", label: "Agent name", type: "text", required: true, width: "half" },
    { name: "slug", label: "Slug", type: "slug", required: true, width: "half" },
    { name: "short", label: "Short label", type: "text", width: "half", placeholder: "Sales" },
    { name: "tags", label: "Tags", type: "list", itemLabel: "tag" },
    { name: "desc", label: "Card description", type: "textarea", rows: 3 },
    { name: "detail", label: "Detail", type: "textarea", rows: 4 },
    { name: "deliverables", label: "Deliverables", type: "list", itemLabel: "deliverable" },
  ],
  newDefaults: () => ({
    short: "",
    tags: [""],
    desc: "",
    detail: "",
    deliverables: [""],
  }),
  seeds: () =>
    AGENTS.map((a, i) => ({
      slug: a.slug,
      title: a.name,
      order: i,
      data: {
        name: a.name,
        short: a.short,
        desc: a.desc,
        detail: a.detail,
        deliverables: a.deliverables as unknown,
        tags: a.tags as unknown,
      },
    })),
};

// ──────────────────────────── Registry ──────────────────────────────

const testimonials: CollectionDef = {
  key: "testimonials",
  label: "Testimonial videos",
  singular: "testimonial video",
  publicNote:
    "Approved client stories shown in the homepage video section and project lead popup. The player uses a 16:9 frame; crop an optional poster to 1600 × 900. Only active Published records appear publicly.",
  titleField: "name",
  icon: "pen",
  fields: [
    { name: "name", label: "Client name", type: "text", required: true, width: "half", help: "As approved for public display." },
    { name: "companyName", label: "Company name", type: "text", required: true, width: "half", help: "Use the client-approved public company name." },
    { name: "location", label: "Location (optional)", type: "text", width: "half", placeholder: "City, country" },
    {
      name: "videoUrl",
      label: "Video URL (optional)",
      type: "text",
      width: "full",
      placeholder: "https://…/testimonial.mp4",
      help: "Use a direct, same-origin MP4 or WebM URL, for example /uploads/testimonials/client-name.mp4. The homepage player displays it in a 16:9 frame."
    },
    {
      name: "posterImage",
      label: "Video poster image (optional)",
      type: "image",
      width: "full",
      targetWidth: TESTIMONIAL_VIDEO_POSTER_SIZE.width,
      targetHeight: TESTIMONIAL_VIDEO_POSTER_SIZE.height,
      help: "Crop to 1600 × 900 px (16:9), matching the homepage video frame. This image appears while the video loads and when no video URL is supplied.",
    },
    { name: "quote", label: "Approved quote", type: "textarea", rows: 4, required: true, help: "Keep the approved written quote for the project enquiry popup." },
    { name: "role", label: "Legacy role / company", type: "text", legacy: true },
    { name: "country", label: "Legacy country", type: "text", legacy: true },
    { name: "photoUrl", label: "Legacy portrait URL", type: "text", legacy: true },
  ],
  newDefaults: () => ({ name: "", companyName: "", location: "", videoUrl: "", posterImage: "", quote: "", role: "", country: "", photoUrl: "" }),
  seeds: () => [], // never seed: demo preview lives in code; real quotes arrive via admin only
};

const team: CollectionDef = {
  key: "team",
  label: "About team",
  singular: "team member",
  publicNote: "Published team profiles and cropped portraits shared by the About team and Contact Key people sections. Only approved, active profiles are public.",
  titleField: "name",
  icon: "crew",
  fields: [
    { name: "name", label: "Name", type: "text", required: true, width: "half" },
    { name: "role", label: "Role", type: "text", required: true, width: "half" },
    { name: "photo", label: "Portrait photo", type: "image", required: true, altFieldName: "photoAlt", altFieldRequired: true, targetWidth: ABOUT_TEAM_PHOTO_SIZE.width, targetHeight: ABOUT_TEAM_PHOTO_SIZE.height, help: "Crop to the existing team portrait dimensions (560 × 840 px, 2:3). The crop tool compresses the image before saving; frontend display sizing is unchanged." },
    { name: "linkedinUrl", label: "LinkedIn profile (optional)", type: "text", width: "half", placeholder: "https://www.linkedin.com/in/…" },
    { name: "email", label: "Public email (optional)", type: "text", width: "half", placeholder: "name@example.com", help: "Only add an address approved for public display." },
  ],
  newDefaults: () => ({ name: "", role: "", photo: "", photoAlt: "", linkedinUrl: "", email: "" }),
  seeds: () => [],
};

const industryDossiers: CollectionDef = {
  key: "industry-dossiers", label: "Industry dossiers", singular: "industry dossier", icon: "folder", titleField: "title",
  publicNote: "Full /industries chapters. Published + active records power the index, navigation and sitemap once imported. Drafts never resurrect coded pages. Case-study associations are edited in /admin/case-studies; article associations in Insights.",
  fields: [
    { name: "title", label: "Industry title", type: "text", required: true, width: "half" },
    { name: "slug", label: "Canonical industry slug", type: "slug", required: true, width: "half", help: "Changing a canonical slug requires a redirect plan. Existing links use healthcare, fintech, ecommerce, logistics, real-estate, education, travel, manufacturing, government and energy." },
    { name: "summary", label: "Index summary", type: "textarea", rows: 2 },
    { name: "headline", label: "Hero headline", type: "textarea", rows: 2 },
    { name: "lead", label: "Hero explanation", type: "textarea", rows: 3 },
    { name: "overview", label: "Business context", type: "textarea", rows: 4 },
    { name: "metaTitle", label: "SEO title", type: "text", width: "half" },
    { name: "metaDescription", label: "SEO description", type: "textarea", rows: 2 },
    { name: "image", label: "Editorial image path", type: "text", width: "half", help: "Optional approved local image under /images/. This is editorial sector imagery, not proof of a delivered project." },
    { name: "imageAlt", label: "Image description", type: "text", width: "half" },
    { name: "layout", label: "Ecosystem topology", type: "select", options: INDUSTRY_LAYOUTS.map(value => ({ value, label: value })), help: "Topology changes the connecting paths, not the factual content." },
    { name: "ecosystemCore", label: "Shared system label", type: "text", width: "half" },
    { name: "ecosystemTitle", label: "Ecosystem heading", type: "text", width: "half" },
    { name: "ecosystemNodes", label: "Ecosystem actors (4–6 to publish)", type: "object-list", itemLabel: "actor", fields: [{ name: "title", label: "Actor", type: "text" }, { name: "role", label: "Stakeholders", type: "text" }, { name: "text", label: "Responsibility", type: "textarea" }] },
    { name: "challenges", label: "Business challenges (3–6)", type: "object-list", itemLabel: "challenge", fields: [{ name: "title", label: "Challenge", type: "text" }, { name: "text", label: "Why it matters", type: "textarea" }] },
    { name: "solutions", label: "Solution explorer (3–8)", type: "object-list", itemLabel: "solution", fields: [{ name: "title", label: "Solution", type: "text" }, { name: "text", label: "Description", type: "textarea" }, { name: "audience", label: "Who uses it", type: "text" }, { name: "workflow", label: "Workflow (steps separated with →)", type: "text" }, { name: "objective", label: "Business objective, not an achieved result", type: "textarea" }, { name: "service", label: "Canonical service slug", type: "text" }] },
    { name: "aiOpportunities", label: "AI opportunities (2–6)", type: "object-list", itemLabel: "opportunity", fields: [{ name: "title", label: "Opportunity", type: "text" }, { name: "text", label: "Permitted assistance", type: "textarea" }, { name: "review", label: "Human review / decision boundary", type: "textarea" }] },
    { name: "integrations", label: "Integration categories (2–12)", type: "list", itemLabel: "integration", help: "Categories to assess, not claims of certification or partner access." },
    { name: "technologies", label: "Engineering considerations (2–12)", type: "list", itemLabel: "consideration" },
    { name: "safeguards", label: "Security and engineering standards (3–8)", type: "object-list", itemLabel: "standard", fields: [{ name: "title", label: "Consideration", type: "text" }, { name: "text", label: "Requirements and responsible review", type: "textarea" }] },
    { name: "outcomes", label: "Outcome objectives (2–6)", type: "object-list", itemLabel: "objective", fields: [{ name: "title", label: "Objective", type: "text" }, { name: "text", label: "Intended improvement", type: "textarea" }, { name: "measure", label: "How it could be evaluated (no fabricated results)", type: "textarea" }] },
    { name: "relatedServices", label: "Related canonical service slugs (2–8)", type: "list", itemLabel: "service" },
    { name: "relatedIndustries", label: "Related industry slugs (0–6)", type: "list", itemLabel: "industry" },
    { name: "insightSlugs", label: "Curated insight slugs (0–8)", type: "list", itemLabel: "insight", help: "Only existing active, published managed articles are included. Missing records stay absent." },
    { name: "faqs", label: "Sector questions (4–10)", type: "object-list", itemLabel: "question", fields: [{ name: "q", label: "Question", type: "text" }, { name: "a", label: "Answer", type: "textarea" }] },
    { name: "ctaHeading", label: "Closing heading", type: "textarea", rows: 2 },
    { name: "ctaText", label: "Closing explanation", type: "textarea", rows: 3 },
    { name: "featured", label: "Feature in hub opening", type: "boolean" },
    { name: "schemaEnabled", label: "Enable visible-content structured data", type: "boolean", defaultValue: true },
  ],
  newDefaults: () => ({ title: "", summary: "", headline: "", lead: "", overview: "", metaTitle: "", metaDescription: "", image: "", imageAlt: "", layout: "care", ecosystemCore: "", ecosystemTitle: "", ecosystemNodes: [], challenges: [], solutions: [], aiOpportunities: [], integrations: [], technologies: [], safeguards: [], outcomes: [], relatedServices: [], relatedIndustries: [], insightSlugs: [], faqs: [], ctaHeading: "", ctaText: "", featured: false, schemaEnabled: true }),
  seeds: () => INDUSTRY_DOSSIERS.map((d, order) => ({ slug: d.slug, title: d.title, order, data: { ...d } })),
};

export const CONTENT_COLLECTIONS: Record<CollectionKey, CollectionDef> = {
  insights,
  careers,
  "case-studies": caseStudies,
  testimonials,
  team,
  hire,
  "ai-services": aiServices,
  agents,
  "industry-dossiers": industryDossiers,
};

export const COLLECTION_KEYS = Object.keys(CONTENT_COLLECTIONS) as CollectionKey[];

/** Serializable subset handed to client form components (no functions). */
export type CollectionFormDef = Omit<CollectionDef, "newDefaults" | "seeds"> & {
  defaults: Record<string, unknown>;
};

/** Strip function props and inline the new-item template for the client. */
export function toFormDef(def: CollectionDef): CollectionFormDef {
  return {
    key: def.key,
    label: def.label,
    singular: def.singular,
    publicNote: def.publicNote,
    titleField: def.titleField,
    icon: def.icon,
    fields: def.fields,
    defaults: def.newDefaults(),
  };
}

export function isCollectionKey(v: string): v is CollectionKey {
  return Object.prototype.hasOwnProperty.call(CONTENT_COLLECTIONS, v);
}

export function getCollection(key: CollectionKey): CollectionDef {
  return CONTENT_COLLECTIONS[key];
}
