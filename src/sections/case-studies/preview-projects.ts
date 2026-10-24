import "server-only";
import { casePreviewHref, type PortfolioCard, type PortfolioVisual } from "./portfolio-content";

export type PreviewProject = {
  slug: string; name: string; discipline: string; industry: string; summary: string; brief: string;
  challenge: string; solution: string; services: string[]; technologies: string[];
  decisions: { title: string; text: string }[]; boundaries: string;
  visuals: PortfolioVisual[]; related: string[];
  layoutFacts?: [string, string][];
  features?: { title: string; text: string }[];
  palette?: { name: string; hex: string }[];
};
const visual = (slug: string, key: string, title: string, description: string): PortfolioVisual => ({
  src: `/images/case-previews/${slug}-${key}.svg`, width: 1440, height: 900,
  alt: `${title} - original conceptual interface, not a delivered product screenshot`, title, description,
});
export const PREVIEW_PROJECTS: PreviewProject[] = [
  {
    slug: "meridian-commerce", name: "Meridian Commerce", discipline: "web", industry: "Commerce · Web experience",
    summary: "From finding the right product to a clear, considered checkout.",
    brief: "A fictional outdoor-goods storefront exploring how product discovery, useful detail and purchasing could feel like one coherent experience.",
    challenge: "In this design scenario, a shopper needs to compare everyday essentials without navigating an overwhelming catalogue. Product information, availability and the next step need to stay clear on both a wide screen and a phone.",
    solution: "The concept separates browsing from deciding. A generous catalogue introduces the collection; product detail brings materials, colour and fit together; a compact order review gives the shopper one place to check their choices before payment.",
    services: ["Commerce experience", "Product design", "Responsive interfaces"], technologies: ["Next.js", "TypeScript", "PostgreSQL"],
    decisions: [
      { title: "Give the product room.", text: "An understated interface lets the product illustration and useful information lead. Category and colour choices stay adjacent to the items they affect, rather than becoming another layer of navigation." },
      { title: "Keep decisions reversible.", text: "Quantity, colour and cart contents remain editable. A production implementation would need explicit stock checks, price validation, payment recovery and accessible confirmation states." },
      { title: "Make content structured.", text: "A proposed typed catalogue would separate editorial descriptions, product variants and inventory. The content model should support real catalogue changes without hard-coding each page." },
    ],
    boundaries: "This is a design study, not a Savo client engagement. Product illustrations, prices and cart contents are synthetic UI data. No store, payments, conversion result or production architecture has been delivered or tested here.",
    visuals: [
      visual("meridian-commerce", "overview", "The collection, at a glance.", "A wide catalogue balances product imagery with category wayfinding and a phone-sized browsing view."),
      visual("meridian-commerce", "detail", "Enough detail to choose.", "The product page groups colour, materials and the purchasing decision while keeping the illustration visible."),
      visual("meridian-commerce", "flow", "A quieter order review.", "A cart and checkout concept makes the selected items, editable quantities and next step explicit. It is not a working payment form."),
    ], related: ["aster-health", "northstar-logistics"],
  },
  {
    slug: "novaflow", name: "NovaFlow", discipline: "ai", industry: "AI · Workflow design",
    summary: "A workspace that makes automation visible - and human decisions explicit.",
    brief: "An illustrative operations workspace exploring the relationship between workflow status, assisted analysis and human approval.",
    challenge: "In this fictional scenario, an operations team needs to understand where work is waiting, why an automated step has stopped and which decisions still belong to a person. A conversational interface alone would hide too much of that context.",
    solution: "The concept keeps the work queue as the main surface. A workflow view makes dependencies readable, and a review panel pairs an AI-assisted suggestion with its supporting material and a visible approval boundary.",
    services: ["Workflow design", "AI interaction design", "Web application concept"], technologies: ["TypeScript", "PostgreSQL", "Retrieval & evaluation"],
    decisions: [
      { title: "Show the state, not just a chat.", text: "People can inspect queued, waiting and completed work without reconstructing it from a conversation. The workflow illustration provides another view of the same synthetic scenario." },
      { title: "Keep approval human.", text: "A proposed assistant should distinguish a suggestion from an authorised action. Supporting sources, uncertainty, rejection and a manual recovery path would need to be designed and evaluated before implementation." },
      { title: "Design for exceptions.", text: "Retries, stale source material and permission changes are part of the product, not edge decorations. A production system would require scoped tools, audit events and representative evaluations." },
    ],
    boundaries: "NovaFlow is a fictional design study. The tasks, workflow states and assistant suggestions are synthetic. No live model is running, and no automation accuracy, operational saving or availability is claimed.",
    visuals: [
      visual("novaflow", "overview", "One place to see the work.", "A synthetic work queue connects status, ownership and the next decision without relying on performance charts."),
      visual("novaflow", "detail", "Follow the workflow.", "A readable workflow illustration separates deterministic processing from a human review step."),
      visual("novaflow", "flow", "Review before acting.", "An illustrative approval workspace places the suggested response alongside source context. Nothing is executed."),
    ], related: ["northstar-logistics", "meridian-commerce"],
  },
  {
    slug: "aster-health", name: "Aster Health", discipline: "mobile", industry: "Healthcare · Mobile experience",
    summary: "A calmer path from finding an appointment to knowing what comes next.",
    brief: "A fictional patient-facing mobile concept focused on appointment wayfinding, clear choices and useful preparation information.",
    challenge: "A patient should not have to decode a complicated interface while arranging care. In this design scenario, the next appointment, available options and preparation guidance need to be understandable without implying clinical advice.",
    solution: "The concept uses three focused mobile views: a home with a visible next appointment, a booking flow with a clear selection and an appointment summary with practical preparation guidance.",
    services: ["Mobile experience", "Interaction design", "Healthcare wayfinding"], technologies: ["Flutter", "PostgreSQL", "API integration", "Cloud infrastructure"],
    layoutFacts: [["Client", "The Fresh Art Club"], ["Industry", "Contemporary Art · Arts & Culture · Digital Platform"], ["Location", "France"], ["Business Model", "E-commerce"], ["Platforms", "Web"], ["Year", "2026"], ["Duration", "18 weeks"], ["Team", "5 specialists"]],
    features: [
      { title: "Patient home", text: "The next appointment and primary action, together in one focused view." },
      { title: "Appointment discovery", text: "A clear starting point for choosing a service and finding a time." },
      { title: "Date & time selection", text: "A readable day picker with an explicit selected appointment slot." },
      { title: "Visit overview", text: "Service, time and location gathered into one practical summary." },
      { title: "Preparation guidance", text: "Administrative information that helps people know what comes next." },
      { title: "Focused mobile layouts", text: "One primary task per screen, with concise supporting information." },
    ],
    palette: [{ name: "Aster green", hex: "#27614B" }, { name: "Deep forest", hex: "#233E33" }, { name: "Soft sage", hex: "#E8EEE2" }, { name: "Canvas", hex: "#FBFCF9" }],
    decisions: [
      { title: "One primary task per screen.", text: "The mobile layout prioritises the appointment journey. Secondary information is readable without competing with the next step, and a selected time is explicit rather than communicated by colour alone." },
      { title: "Use reassuring precision.", text: "Preparation guidance and booking status need direct language. Real implementations must distinguish a requested appointment from a confirmed one and provide a recovery route when availability changes." },
      { title: "Keep clinical responsibility outside the interface.", text: "The concept provides administrative wayfinding only. Any real care workflow would require specialist clinical, accessibility, privacy and regulatory review appropriate to its context." },
    ],
    boundaries: "Aster Health is not a real clinic or a Savo client. All appointment details and provider identities are illustrative. No clinical service, secure messaging, accessibility certification or privacy compliance is claimed.",
    visuals: [
      visual("aster-health", "overview", "A connected mobile journey.", "Three original phone-sized interface illustrations show home, appointment selection and confirmation together."),
      visual("aster-health", "detail", "Choose an appointment clearly.", "The booking view uses a readable date selection, service context and explicit selected time."),
      visual("aster-health", "flow", "Know what comes next.", "The appointment summary gathers location and preparation guidance into a single practical view."),
    ], related: ["meridian-commerce", "novaflow"],
  },
  {
    slug: "northstar-logistics", name: "Northstar Logistics", discipline: "software", industry: "Logistics · Operations software",
    summary: "Shipment context, exceptions and hand-offs in one readable workspace.",
    brief: "A fictional logistics operations concept exploring how teams could move between a fleet-level view and the detail of one shipment.",
    challenge: "In this scenario, a dispatcher needs to find a delayed shipment, understand its last known state and decide who should handle the exception. A map without a queue - or a table without context - would leave that task unfinished.",
    solution: "The concept pairs a shipment list with an illustrative route map. Shipment detail collects the event trail and hand-off context, while a dedicated exception view makes the responsible next action explicit.",
    services: ["Operations experience", "Software design", "Integration planning"], technologies: ["Next.js", "Node.js", "PostgreSQL"],
    decisions: [
      { title: "Pair geography with responsibility.", text: "A route is useful only when it connects to an actionable record. The interface keeps shipment identifiers, state and responsible team visible alongside the illustrated map." },
      { title: "Make freshness visible.", text: "Real tracking data can be delayed or missing. A production design would need to show the source and time of each event, rather than presenting an old location as a live vehicle position." },
      { title: "Treat integrations as a boundary.", text: "A proposed service layer would normalise carrier events while preserving their provenance. Retries, duplicates, out-of-order messages and manual corrections would require explicit handling." },
    ],
    boundaries: "Northstar Logistics is an original fictional design scenario, not completed client work. Routes, shipments and event histories are synthetic. No real tracking, carrier integration, delivery performance or uptime is asserted.",
    visuals: [
      visual("northstar-logistics", "overview", "See the network. Find the work.", "A synthetic shipment queue sits beside an original illustrated route map, with no live location data."),
      visual("northstar-logistics", "detail", "The story of one shipment.", "An event timeline shows how location, shipment state and hand-off context could come together."),
      visual("northstar-logistics", "flow", "Give exceptions a next step.", "A review queue groups the reason for an exception and the proposed owner. Actions shown are illustrative."),
    ], related: ["novaflow", "aster-health"],
  },
];
export function findPreviewProject(slug: string, environment = process.env.NODE_ENV) { return environment === "development" ? PREVIEW_PROJECTS.find(p => p.slug === slug) ?? null : null; }
export function previewProjectCard(project: PreviewProject): PortfolioCard {
  return { slug: project.slug, name: project.name, discipline: project.discipline, disciplines: [project.discipline], industry: project.industry, summary: project.summary, href: casePreviewHref(project.slug), preview: true, visual: project.visuals[0] };
}
