import { z } from "zod";
import { EXPERIENCE_OPTIONS, NOTICE_OPTIONS } from "@/constants/careers";
import { MAX_CAREER_SKILLS, MAX_CAREER_SKILL_LENGTH } from "@/constants/career-skills";

const optionalText = (max: number) => z.string().trim().max(max).optional();
const optionalLink = z.string().trim().max(500).refine(value => {
  if (!value) return true;
  try { const url = new URL(value); return ["http:", "https:"].includes(url.protocol) && !url.username && !url.password; } catch { return false; }
}, "Enter a full http or https link.").optional();
export const careerPhoneSchema = z.string().trim().min(1, "Enter your mobile number.").refine(value => /^\+?[0-9 ()-]+$/.test(value) && value.replace(/\D/g, "").length >= 7 && value.replace(/\D/g, "").length <= 15, "Enter a valid mobile number with country code.");

/** Career-only requirements. Never applied to project/contact/callback enquiries. */
export const careerApplicationSchema = z.object({
  form: z.literal("careers"),
  role: z.string({ error: "Choose a role." }).trim().min(1, "Choose a role.").max(120),
  city: z.string({ error: "Enter your current city." }).trim().min(1, "Enter your current city.").max(500),
  // Optional at the API boundary for already-open older form versions; new UI requires hometown.
  hometown: optionalText(150), currentCtc: optionalText(120), currentCompany: optionalText(120), currentDesignation: optionalText(120),
  workPreference: z.enum(["On-site", "Hybrid", "Remote", "Open to discussion", ""]).optional(),
  linkedin: optionalLink, links: optionalLink, resume: optionalLink, expectedCtc: optionalText(120),
  skills: z.array(z.string().trim().min(1).max(MAX_CAREER_SKILL_LENGTH), { error: "Choose at least one key skill or add your own." })
    .min(1, "Choose at least one key skill or add your own.")
    .max(MAX_CAREER_SKILLS, `Choose up to ${MAX_CAREER_SKILLS} key skills.`)
    .refine(list => new Set(list.map(skill => skill.toLowerCase())).size === list.length, "Choose each skill only once."),
  experience: z.enum(EXPERIENCE_OPTIONS, { message: "Choose your experience level, including Fresher." }),
  notice: z.enum(NOTICE_OPTIONS, { message: "Choose when you could start. You can select To be discussed." }),
  consent: z.literal(true, { error: "Please confirm we may process your application." }),
});
export type CareerApplicationErrors = Partial<Record<keyof z.infer<typeof careerApplicationSchema> | "consent", string>>;
export function careerApplicationErrors(error: z.ZodError): CareerApplicationErrors {
  const result: CareerApplicationErrors = {};
  for (const issue of error.issues) {
    const key = issue.path[0] as keyof CareerApplicationErrors;
    if (key && !result[key]) result[key] = issue.message;
  }
  return result;
}
