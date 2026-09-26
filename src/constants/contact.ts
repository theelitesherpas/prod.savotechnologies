/** Contact page content - carried from version 1 (/newdesign/contact). */

import type { ContentStatus } from "@/lib/content-mode";
import { IS_DEMO } from "@/lib/content-mode";

/**
 * DEMO TEAM ROSTER - NOT VERIFIED.
 * The six members below are version-1 placeholder identities: invented
 * names, roles, bios, placeholder portraits and LinkedIn slugs that are
 * NOT confirmed Savo-controlled profiles. Rendered in demo mode only
 * (see sections/contact/team.tsx); production suppresses the section
 * until the real roster is supplied. DEMO - REPLACE BEFORE PRODUCTION.
 */
const CONTACT_TEAM_SEED = [
  {
    name: "Aarav Mehta",
    role: "Founder & CEO",
    bio: "Ex fintech architect. Still reviews every proposal personally.",
    image: "/team/aarav.jpg",
    linkedin: "aarav-mehta",
  },
  {
    name: "Priya Nair",
    role: "Head of Engineering",
    bio: "Shipped patient systems for three hospital networks.",
    image: "/team/priya.jpg",
    linkedin: "priya-nair",
  },
  {
    name: "Rohan Desai",
    role: "Principal Architect, AI",
    bio: "Built the agent framework behind the Savo Intelligence desk.",
    image: "/team/rohan.jpg",
    linkedin: "rohan-desai",
  },
  {
    name: "Sara Khan",
    role: "Head of Design",
    bio: "Believes the best interface is the one you stop noticing.",
    image: "/team/sara.jpg",
    linkedin: "sara-khan",
  },
  {
    name: "Vikram Rao",
    role: "Delivery Lead",
    bio: "Keeps twelve client sprints honest, calmly.",
    image: "/team/vikram.jpg",
    linkedin: "vikram-rao",
  },
  {
    name: "Ananya Iyer",
    role: "Client Success Lead",
    bio: "The voice on your onboarding calls and your escalation line.",
    image: "/team/ananya.jpg",
    linkedin: "ananya-iyer",
  },
] as const;

/** Typed demo view of the roster - empty in production (the gate in
 * sections/contact/team.tsx suppresses the section entirely). */
export const CONTACT_TEAM: ({ status: ContentStatus } & (typeof CONTACT_TEAM_SEED)[number])[] = IS_DEMO
  ? CONTACT_TEAM_SEED.map((m) => ({ ...m, status: "demo" as const }))
  : [];

/** What happens after the message is sent - sets expectations honestly. */
export const WHAT_HAPPENS_NEXT = [
  {
    step: "01",
    title: "Message received",
    text: "A senior consultant, not a bot and not a junior, reads every message and replies within one business day.",
  },
  {
    step: "02",
    title: "Discovery call",
    text: "A focused conversation about scope, constraints and what success looks like. No fee, no pressure.",
  },
  {
    step: "03",
    title: "Proposal & kickoff",
    text: "A fixed-scope proposal with honest estimates. NDA on request, then the team gets to work.",
  },
] as const;
