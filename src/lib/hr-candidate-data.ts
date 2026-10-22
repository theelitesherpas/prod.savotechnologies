import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdminPage } from "@/lib/permissions";
import { CONTACT_OUTCOMES, type ContactOutcome } from "@/lib/hr-contact";
import { CAREER_PROJECT_TYPES } from "@/lib/admin-enquiries";
import type { CandidateFilters, CandidateStage } from "@/lib/hr-candidates";

export type CandidateRow = { contactOutcome: ContactOutcome; callbackAt: string | null; id: string; name: string; email: string | null; phone: string | null; reference: string | null; role: string; city: string; hometown: string; experience: string; experienceMonths: number | null; stage: CandidateStage; inboxStatus: string; createdAt: Date; interviewDate: Date | null; interviewer: string | null; meetingLink: string | null; notice: string; skills: unknown };
const clean = (expression: Prisma.Sql) => Prisma.sql`NULLIF(BTRIM(${expression}), '')`;
const city = Prisma.sql`COALESCE(${clean(Prisma.sql`form_data #>> '{hrProfile,city}'`)}, ${clean(Prisma.sql`form_data ->> 'city'`)}, ${clean(Prisma.sql`form_data ->> 'currentCity'`)}, ${clean(Prisma.sql`form_data ->> 'current_city'`)}, '')`;
const hometown = Prisma.sql`COALESCE(${clean(Prisma.sql`form_data #>> '{hrProfile,hometown}'`)}, ${clean(Prisma.sql`form_data ->> 'hometown'`)}, ${clean(Prisma.sql`form_data ->> 'homeTown'`)}, ${clean(Prisma.sql`form_data ->> 'home_town'`)}, ${clean(Prisma.sql`form_data ->> 'nativePlace'`)}, '')`;
const role = Prisma.sql`COALESCE(${clean(Prisma.sql`form_data #>> '{hrProfile,role}'`)}, ${clean(Prisma.sql`form_data ->> 'role'`)}, project_type)`;
/** All identifiers/expressions are static; user filters are parameter values only. */
export function candidateSqlBase() {
  return Prisma.sql`WITH normalized AS (
    SELECT id, name, email, phone, reference, status AS "inboxStatus", created_at AS "createdAt", interview_date AS "interviewDate", interviewer, meeting_link AS "meetingLink",
      ${city} AS city, ${hometown} AS hometown, ${role} AS role,
      COALESCE(form_data ->> 'experience', form_data ->> 'totalExperience', '') AS experience,
      COALESCE(form_data ->> 'notice', '') AS notice, form_data -> 'skills' AS skills,
      CASE WHEN (form_data #>> '{hrContact,outcome}') IN (${Prisma.join(CONTACT_OUTCOMES)}) THEN form_data #>> '{hrContact,outcome}' ELSE 'not_recorded' END AS "contactOutcome",
      form_data #>> '{hrContact,callbackAt}' AS "callbackAt",
      CASE WHEN (form_data #>> '{hrProfile,totalExperienceMonths}') ~ '^[0-9]{1,3}$'
        THEN CASE WHEN (form_data #>> '{hrProfile,totalExperienceMonths}')::int <= 731 THEN (form_data #>> '{hrProfile,totalExperienceMonths}')::int END END AS "experienceMonths",
      CASE WHEN status = 'archived' OR career_status = 'archived' THEN 'archived' WHEN career_status IS NULL OR career_status = '' OR career_status = 'new' THEN 'new' ELSE career_status END AS stage
    FROM project_enquiries WHERE project_type IN (${Prisma.join(CAREER_PROJECT_TYPES)})
  ), candidates AS (
    SELECT *, CASE WHEN "experienceMonths" IS NOT NULL THEN CASE
      WHEN "experienceMonths" = 0 THEN 'fresher' WHEN "experienceMonths" < 12 THEN 'under-1' WHEN "experienceMonths" < 36 THEN '1-3'
      WHEN "experienceMonths" < 60 THEN '3-5' WHEN "experienceMonths" < 96 THEN '5-8' ELSE '8-plus' END
    ELSE CASE regexp_replace(lower(experience), '[[:space:]–—-]+', '', 'g')
      WHEN 'fresher' THEN 'fresher' WHEN 'freshers' THEN 'fresher' WHEN '0' THEN 'fresher'
      WHEN 'lessthan1year' THEN 'under-1' WHEN '0to1year' THEN 'under-1' WHEN '0to1years' THEN 'under-1' WHEN '01year' THEN 'under-1'
      WHEN '1to3years' THEN '1-3' WHEN '13years' THEN '1-3' WHEN '3to5years' THEN '3-5' WHEN '35years' THEN '3-5'
      WHEN '5to8years' THEN '5-8' WHEN '58years' THEN '5-8' WHEN '8+years' THEN '8-plus' ELSE 'missing' END END AS "experienceBand"
    FROM normalized
  )`;
}
const contains = (value: string) => `%${value.replace(/[\\%_]/g, "\\$&")}%`;
export function candidateSqlFilter(filters: CandidateFilters, includeStage = true) {
  const conditions: Prisma.Sql[] = [Prisma.sql`TRUE`];
  if (filters.q) conditions.push(Prisma.sql`(name ILIKE ${contains(filters.q)} OR email ILIKE ${contains(filters.q)} OR phone ILIKE ${contains(filters.q)} OR reference ILIKE ${contains(filters.q)} OR role ILIKE ${contains(filters.q)})`);
  for (const key of ["city", "hometown"] as const) {
    const column = key === "city" ? Prisma.sql`city` : Prisma.sql`hometown`;
    if (filters[key]) conditions.push(filters[key].toLowerCase() === "not provided" ? Prisma.sql`${column} = ''` : Prisma.sql`${column} ILIKE ${contains(filters[key])}`);
  }
  if (filters.role) conditions.push(Prisma.sql`role ILIKE ${contains(filters.role)}`);
  if (filters.contact) conditions.push(Prisma.sql`"contactOutcome" = ${filters.contact}`);
  if (filters.experience) conditions.push(Prisma.sql`"experienceBand" = ${filters.experience}`);
  if (includeStage && filters.stage !== "all") conditions.push(filters.stage === "active" ? Prisma.sql`stage IN ('new', 'shortlisted', 'interview_scheduled')` : Prisma.sql`stage = ${filters.stage}`);
  else if (includeStage) conditions.push(Prisma.sql`stage <> 'archived'`);
  return Prisma.join(conditions, " AND ");
}

export async function getCandidatePage(filters: CandidateFilters, path: "/admin/hr-portal" | "/admin/hr-portal/applications" | "/admin/enquiries") {
  await requireAdminPage(path);
  if (!prisma) return null;
  const base = candidateSqlBase(), where = candidateSqlFilter(filters), facetWhere = candidateSqlFilter(filters, false);
  const [counts, totals, options] = await Promise.all([
    prisma.$queryRaw<{ stage: string; count: number }[]>(Prisma.sql`${base} SELECT stage, COUNT(*)::int AS count FROM candidates WHERE ${facetWhere} GROUP BY stage`),
    prisma.$queryRaw<{ count: number }[]>(Prisma.sql`${base} SELECT COUNT(*)::int AS count FROM candidates WHERE ${where}`),
    prisma.$queryRaw<{ kind: string; value: string }[]>(Prisma.sql`${base}, options AS (
      SELECT DISTINCT 'city' AS kind, city AS value FROM candidates WHERE city <> '' UNION ALL
      SELECT DISTINCT 'hometown' AS kind, hometown AS value FROM candidates WHERE hometown <> '' UNION ALL
      SELECT DISTINCT 'role' AS kind, role AS value FROM candidates WHERE role <> ''
    ), ranked AS (SELECT kind, value, row_number() OVER (PARTITION BY kind ORDER BY lower(value), value) AS position FROM options)
    SELECT kind, value FROM ranked WHERE position <= 250 ORDER BY kind, lower(value), value`),
  ]);
  const total = totals[0]?.count ?? 0, pages = Math.max(1, Math.ceil(total / filters.pageSize)), page = Math.min(filters.page, pages);
  const order = filters.sort === "oldest" ? Prisma.sql`"createdAt" ASC, id ASC` : filters.sort === "name" ? Prisma.sql`lower(name) ASC, id ASC` : filters.sort === "interview" ? Prisma.sql`"interviewDate" ASC NULLS LAST, "createdAt" DESC, id DESC` : Prisma.sql`"createdAt" DESC, id DESC`;
  const rows = await prisma.$queryRaw<CandidateRow[]>(Prisma.sql`${base} SELECT id, name, email, phone, reference, role, city, hometown, experience, "experienceMonths", stage, "inboxStatus", "createdAt", "interviewDate", interviewer, "meetingLink", notice, skills, "contactOutcome", "callbackAt"
    FROM candidates WHERE ${where} ORDER BY ${order} LIMIT ${filters.pageSize} OFFSET ${(page - 1) * filters.pageSize}`);
  return { rows, total, pages, page, counts, options };
}
