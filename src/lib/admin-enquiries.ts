import type { Prisma } from "@prisma/client";
import { CAREERS_TYPES } from "@/constants/careers";

// Canonical intake categories determine department ownership, never a query-string flag.
// Legacy career sources are also excluded from sales, even if their category needs repair.
export const CAREER_PROJECT_TYPES = [...CAREERS_TYPES, "Full-time role", "Part-time role", "Internship"];
export const CAREER_ENQUIRY_WHERE: Prisma.ProjectEnquiryWhereInput = { projectType: { in: CAREER_PROJECT_TYPES } };
export const SALES_ENQUIRY_WHERE: Prisma.ProjectEnquiryWhereInput = {
  projectType: { notIn: CAREER_PROJECT_TYPES }, NOT: { source: { startsWith: "careers:" } },
};
export function isCareerEnquiry(enquiry: { projectType: string; source?: string | null }) {
  return CAREER_PROJECT_TYPES.includes(enquiry.projectType) || (enquiry.source ?? "").startsWith("careers:");
}
