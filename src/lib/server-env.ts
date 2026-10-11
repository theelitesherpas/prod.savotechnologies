import "server-only";
import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.preprocess(v => typeof v === "string" && !v.trim() ? undefined : v,
    z.string().url().refine(v => /^postgres(?:ql)?:\/\//.test(v), "PostgreSQL URL required").optional()),
  // Keep the old fallback for local compatibility. Release preflight requires a real salt.
  ENQUIRY_IP_SALT: z.string().default("savo-dev-salt"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});
const parsed = schema.safeParse({
  DATABASE_URL: process.env.DATABASE_URL,
  ENQUIRY_IP_SALT: process.env.ENQUIRY_IP_SALT,
  NODE_ENV: process.env.NODE_ENV,
});
// Do not print Zod error objects or database URL values (may contain credentials).
if (!parsed.success) throw new Error(`Invalid server configuration: ${parsed.error.issues.map(i => i.path.join(".")).join(", ")}`);
export const serverEnv = parsed.data;
