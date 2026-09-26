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
  /** list / object-list row noun, e.g. "FAQ", "step". */
  itemLabel?: string;
  defaultValue?: string | number | boolean;
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
  | "hire"
  | "ai-services"
  | "agents";

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
  publicNote: "The /insights/ journal - index grid and reading pages.",
  titleField: "title",
  icon: "pen",
  fields: [
    { name: "title", label: "Title", type: "text", required: true, width: "half" },
    { name: "slug", label: "Slug (/insights/…/)", type: "slug", required: true, width: "half" },
    {
      name: "cat",
      label: "Category",
      type: "select",
      width: "half",
      options: [
        { value: "AI", label: "AI" },
        { value: "Engineering", label: "Engineering" },
        { value: "Design", label: "Design" },
        { value: "Delivery", label: "Delivery" },
      ],
    },
    { name: "date", label: "Date shown", type: "text", width: "half", placeholder: "Feb 2026", help: "Free-form, as displayed on the card." },
    { name: "time", label: "Reading time", type: "text", width: "half", placeholder: "9 min read" },
    { name: "image", label: "Image path", type: "text", width: "half", placeholder: "/images/architecture.webp", help: "File under public/images/." },
    { name: "excerpt", label: "Excerpt", type: "textarea", rows: 3, required: true },
    {
      name: "body",
      label: "Body",
      type: "blocks",
      itemLabel: "block",
      help: "Reading-order blocks: paragraphs, headings and bullet lists.",
    },
  ],
  newDefaults: () => ({
    cat: "Engineering",
    time: "5 min read",
    date: new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" }),
    image: "/images/architecture.webp",
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
        time: a.time,
        date: a.date,
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
    { name: "blurb", label: "Blurb", type: "textarea", rows: 3 },
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

export const CONTENT_COLLECTIONS: Record<CollectionKey, CollectionDef> = {
  insights,
  careers,
  "case-studies": caseStudies,
  hire,
  "ai-services": aiServices,
  agents,
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
