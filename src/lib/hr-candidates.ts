import { z } from "zod";
import { CONTACT_OUTCOMES, type ContactOutcome } from "./hr-contact";

export const CANDIDATE_STAGES = ["all", "active", "new", "shortlisted", "interview_scheduled", "hired", "rejected", "archived"] as const;
export type CandidateStage = typeof CANDIDATE_STAGES[number];
export const STAGE_LABELS: Record<CandidateStage, string> = { all: "All candidates", active: "Active pipeline", new: "New applications", shortlisted: "Shortlisted", interview_scheduled: "Interview scheduled", hired: "Hired", rejected: "Rejected", archived: "Archived" };
export const EXPERIENCE_FILTERS = [
  ["fresher", "Fresher"], ["under-1", "Under 1 year / 0–1 reported"], ["1-3", "1–3 years"], ["3-5", "3–5 years"], ["5-8", "5–8 years"], ["8-plus", "8+ years"], ["missing", "Not provided / unrecognized"],
] as const;
export const CANDIDATE_READ_STATES = ["all", "not_viewed", "viewed"] as const;
export type CandidateReadState = typeof CANDIDATE_READ_STATES[number];
export const READ_LABELS: Record<CandidateReadState, string> = { all: "All applications", not_viewed: "Not viewed", viewed: "Viewed" };
export type CandidateSearch = { read?: string; unread?: string; contact?: string; q?: string; city?: string | string[]; hometown?: string | string[]; skills?: string | string[]; skillMatch?: string; role?: string; experience?: string; stage?: string; tab?: string; status?: string; page?: string; pageSize?: string; sort?: string; e?: string; deleted?: string; type?: string };
export type CandidateFilters = { read: CandidateReadState; contact: ContactOutcome | ""; q: string; city: string[]; hometown: string[]; skills: string[]; skillMatch: "any" | "all"; role: string; experience: string; stage: CandidateStage; page: number; pageSize: number; sort: "newest" | "oldest" | "name" | "interview" };
const text = (value: unknown, max = 100) => typeof value === "string" ? value.trim().slice(0, max) : "";
export const CANDIDATE_FILTER_SELECTION_LIMIT = 20;
function selections(value: string | string[] | undefined, max: number) {
  const values = Array.isArray(value) ? value : value ? [value] : [];
  const unique = new Map<string, string>();
  for (const item of values) { const clean = text(item, max); if (clean && !unique.has(clean.toLowerCase())) unique.set(clean.toLowerCase(), clean); if (unique.size >= CANDIDATE_FILTER_SELECTION_LIMIT) break; }
  return [...unique.values()];
}
export function parseCandidateFilters(search: CandidateSearch, pipeline = false): CandidateFilters {
  const legacy = search.tab === "scheduled" ? "interview_scheduled" : search.tab === "pipeline" ? "active" : search.tab;
  const requested = search.stage ?? legacy ?? (search.status === "archived" ? "archived" : undefined);
  const stage = CANDIDATE_STAGES.includes(requested as CandidateStage) ? requested as CandidateStage : pipeline ? "active" : "all";
  return { read: CANDIDATE_READ_STATES.includes(search.read as CandidateReadState) ? search.read as CandidateReadState : "all", contact: CONTACT_OUTCOMES.includes(search.contact as ContactOutcome) ? search.contact as ContactOutcome : "", q: text(search.q), city: selections(search.city, 150), hometown: selections(search.hometown, 150), skills: selections(search.skills, 120), skillMatch: search.skillMatch === "all" ? "all" : "any", role: text(search.role, 120), experience: EXPERIENCE_FILTERS.some(([key]) => key === search.experience) ? search.experience! : "", stage,
    page: Math.max(1, Math.min(100000, Number.parseInt(search.page ?? "1", 10) || 1)), pageSize: [10, 25, 50, 100].includes(Number(search.pageSize)) ? Number(search.pageSize) : 25,
    sort: ["oldest", "name", "interview"].includes(search.sort ?? "") ? search.sort as CandidateFilters["sort"] : stage === "interview_scheduled" ? "interview" : "newest" };
}
export function candidateListUrl(base: string, filters: CandidateFilters, overrides: Partial<CandidateFilters> = {}) {
  const current = { ...filters, ...overrides };
  const params = new URLSearchParams();
  for (const key of ["q", "role", "experience", "stage", "contact", "read", "sort"] as const) if (current[key]) params.set(key, current[key]);
  for (const key of ["city", "hometown", "skills"] as const) for (const value of current[key]) params.append(key, value);
  if (current.skills.length && current.skillMatch === "all") params.set("skillMatch", "all");
  if (current.page > 1) params.set("page", String(current.page));
  if (current.pageSize !== 25) params.set("pageSize", String(current.pageSize));
  return `${base}${params.size ? `?${params}` : ""}`;
}
/** A detail page may return only to a known HR list, never a supplied external URL. */
export function candidateReturnPath(value: unknown): string {
  if (typeof value !== "string" || value.length > 16000 || !value.startsWith("/admin/")) return "/admin/hr-portal/applications";
  try {
    const url = new URL(value, "https://admin.invalid");
    if (url.origin !== "https://admin.invalid" || !["/admin/hr-portal", "/admin/hr-portal/applications"].includes(url.pathname)) return "/admin/hr-portal/applications";
    return candidateListUrl(url.pathname, parseCandidateFilters({ ...Object.fromEntries(url.searchParams), city: url.searchParams.getAll("city"), hometown: url.searchParams.getAll("hometown"), skills: url.searchParams.getAll("skills") }));
  } catch { return "/admin/hr-portal/applications"; }
}
function object(value: unknown): Record<string, unknown> { return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {}; }
function first(data: Record<string, unknown>, keys: string[]) { for (const key of keys) if (typeof data[key] === "string" && data[key].trim()) return data[key].trim(); return ""; }
export function candidateProfile(data: unknown, projectType = "") {
  const original = object(data), reviewed = object(original.hrProfile);
  const months = typeof reviewed.totalExperienceMonths === "number" && Number.isInteger(reviewed.totalExperienceMonths) && reviewed.totalExperienceMonths >= 0 && reviewed.totalExperienceMonths <= 731 ? reviewed.totalExperienceMonths : null;
  return {
    role: first(reviewed, ["role"]) || first(original, ["role"]) || projectType,
    city: first(reviewed, ["city"]) || first(original, ["city", "currentCity", "current_city"]),
    hometown: first(reviewed, ["hometown"]) || first(original, ["hometown", "homeTown", "home_town", "nativePlace"]),
    experience: months === null ? first(original, ["experience", "totalExperience"]) : formatExperience(months), months,
    notice: first(original, ["notice"]), expectedCtc: first(original, ["expectedCtc"]), resume: first(original, ["resume"]), links: first(original, ["links"]),
    skills: Array.isArray(original.skills) ? original.skills.filter((s): s is string => typeof s === "string").slice(0, 30) : typeof original.skills === "string" ? original.skills.split(",").map(s => s.trim()).filter(Boolean) : [],
    reviewed, original,
  };
}
export function formatExperience(months: number) {
  if (months === 0) return "Fresher";
  const years = Math.floor(months / 12), rest = months % 12;
  return [years ? `${years} year${years === 1 ? "" : "s"}` : "", rest ? `${rest} month${rest === 1 ? "" : "s"}` : ""].filter(Boolean).join(" ");
}
export const candidateProfileSchema = z.object({
  id: z.string().min(10).max(40).regex(/^[a-zA-Z0-9_-]+$/), revision: z.iso.datetime(),
  city: z.string().trim().max(150), hometown: z.string().trim().max(150), role: z.string().trim().max(120),
  years: z.string().refine(v => !v || /^\d{1,2}$/.test(v) && Number(v) <= 60, "Enter 0 to 60 whole years."),
  months: z.string().refine(v => !v || /^\d{1,2}$/.test(v) && Number(v) <= 11, "Enter 0 to 11 months."),
});
export function safeCandidateUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try { const url = new URL(value); return ["http:", "https:"].includes(url.protocol) && !url.username && !url.password ? url.href : null; } catch { return null; }
}
