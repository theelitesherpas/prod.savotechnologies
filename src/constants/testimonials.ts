/**
 * Lead-modal testimonial content.
 *
 * HARD CONTENT RULE (PRODUCT.md / master spec Part 117): no fabricated
 * endorsements. These entries are an explicit STAGING PREVIEW used only
 * when the managed "testimonials" collection is empty and the site runs
 * in demo mode - portraits are synthetic design-mockup assets
 * (randomuser.me), not real people, and the modal labels the card as a
 * design preview. Production renders only admin-managed, approved
 * client quotes (Admin → Content → Testimonials).
 */

import type { LeadTestimonialItem } from "@/components/shared/project-lead-modal";

/** The homepage testimonial media frame is 16:9; crop posters to this exact size. */
export const TESTIMONIAL_VIDEO_POSTER_SIZE = { width: 1600, height: 900 } as const;

export const DEMO_LEAD_TESTIMONIALS: LeadTestimonialItem[] = [
  {
    quote:
      "They understood the business problem before writing a line of code. The scope was clear, the process was transparent, and the delivery held its promises.",
    name: "Client Name",
    role: "Founder · SaaS",
    country: "United Kingdom",
    photo: "https://randomuser.me/api/portraits/men/46.jpg",
  },
  {
    quote:
      "Weekly demos, honest timelines and a team that pushed back when something would not work. That is exactly what we needed.",
    name: "Client Name",
    role: "CTO · Logistics",
    country: "United Arab Emirates",
    photo: "https://randomuser.me/api/portraits/women/65.jpg",
  },
];
