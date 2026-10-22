import Link from "next/link";
import { requireAdminPage } from "@/lib/permissions";
import { getCandidatePage, type CandidateRow } from "@/lib/hr-candidate-data";
import { CANDIDATE_STAGES, EXPERIENCE_FILTERS, STAGE_LABELS, candidateListUrl, formatExperience, parseCandidateFilters, type CandidateSearch } from "@/lib/hr-candidates";
import { PageHeader, Notice, Chip, EmptyState } from "@/components/admin/ui";
import { PortalDirectory } from "@/components/admin/portal-directory";
import { Pagination } from "@/components/admin/pagination";
import { fmtIST } from "@/lib/datetime";
import { CONTACT_LABELS, CONTACT_OUTCOMES } from "@/lib/hr-contact";

export function CandidateStageChip({ stage }: { stage: string }) {
  const label = stage === "new" ? "New application" : STAGE_LABELS[stage as keyof typeof STAGE_LABELS] ?? stage.replaceAll("_", " ");
  return <Chip tone={stage === "hired" ? "success" : stage === "shortlisted" ? "accent" : stage === "interview_scheduled" ? "warning" : stage === "new" ? "default" : "muted"}>{label}</Chip>;
}
function Skills({ value }: { value: unknown }) {
  const skills = Array.isArray(value) ? value.filter((s): s is string => typeof s === "string") : typeof value === "string" ? value.split(",").map(s => s.trim()) : [];
  return skills.length ? <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted">{skills.slice(0, 3).join(" · ")}{skills.length > 3 ? ` +${skills.length - 3}` : ""}</p> : null;
}
const experience = (row: CandidateRow) => row.experienceMonths === null ? row.experience || "Not provided" : formatExperience(row.experienceMonths);
const date = (value: Date) => value.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });
function ContactSummary({ row }: { row: CandidateRow }) {
  return <div className="mt-3 text-xs leading-5 text-muted"><p>Contact: <span className="font-medium text-foreground">{CONTACT_LABELS[row.contactOutcome] ?? "Not recorded"}</span></p>{row.contactOutcome === "callback_requested" && row.callbackAt && Number.isFinite(Date.parse(row.callbackAt)) ? <p>Callback: {fmtIST(new Date(row.callbackAt))}</p> : null}</div>;
}
function Interview({ row }: { row: CandidateRow }) {
  return row.stage === "interview_scheduled" && row.interviewDate ? <p className="mt-2 text-xs leading-5 text-muted">{fmtIST(row.interviewDate)}{row.interviewer ? <span className="block">With {row.interviewer}</span> : null}</p> : null;
}

/** Both recruitment and applications use one query/filter vocabulary and one presentation. */
export async function CandidateWorkspace({ search, pipeline = false, legacy = false }: { search: CandidateSearch; pipeline?: boolean; legacy?: boolean }) {
  const path = legacy ? "/admin/enquiries" : pipeline ? "/admin/hr-portal" : "/admin/hr-portal/applications";
  const user = await requireAdminPage(path);
  const filters = parseCandidateFilters(search, pipeline);
  let result;
  try { result = await getCandidatePage(filters, path); } catch {
    return <><PageHeader title={pipeline ? "HR Portal" : "Applications & candidates"} /><Notice kind="alert">Candidate information could not be loaded. Check the database connection and reload; your filters remain in the address bar.</Notice></>;
  }
  if (!result) return <><PageHeader title="Applications & candidates" /><Notice kind="alert">Database unavailable.</Notice></>;
  filters.page = result.page;
  const url = (overrides: Parameters<typeof candidateListUrl>[2] = {}) => {
    const href = candidateListUrl(path, filters, overrides);
    return legacy ? `${href}${href.includes("?") ? "&" : "?"}type=Careers` : href;
  };
  const returnTo = candidateListUrl(pipeline ? "/admin/hr-portal" : "/admin/hr-portal/applications", filters);
  const detail = (id: string) => legacy ? `/admin/enquiries/${id}` : `/admin/hr-portal/applications/${id}?returnTo=${encodeURIComponent(returnTo)}`;
  const facetCount = (stage: string) => result.counts.find(row => row.stage === stage)?.count ?? 0;
  const allCount = result.counts.filter(row => row.stage !== "archived").reduce((sum, row) => sum + row.count, 0);
  const hasFilters = Boolean(filters.q || filters.city || filters.hometown || filters.role || filters.experience || filters.contact);
  const filteredBy = [["Search", filters.q], ["Total experience", EXPERIENCE_FILTERS.find(([key]) => key === filters.experience)?.[1] ?? ""], ["Current city", filters.city], ["Hometown", filters.hometown], ["Role", filters.role], ["Contact", filters.contact ? CONTACT_LABELS[filters.contact] : ""]].filter(([, value]) => value);
  return <>
    <PageHeader title={pipeline ? "HR Portal" : "Applications & candidates"} description="Review qualifications, locations and recruitment progress together. Filter first, then open a candidate to make a decision." actions={!legacy ? <Link className="adm-btn-ghost" href={pipeline ? "/admin/hr-portal/applications" : "/admin/hr-portal"}>{pipeline ? "All applications" : "Recruitment overview"}</Link> : undefined} />
    {search.e ? <Notice kind="alert">{search.e}</Notice> : null}
    {search.deleted ? <Notice>Application deleted.</Notice> : null}
    {pipeline ? <PortalDirectory portal="hr" user={user} /> : null}
    <section aria-labelledby="candidate-filters" className="adm-card mb-5 p-4 sm:p-5">
      <h2 id="candidate-filters" className="mb-4 text-base font-semibold">Find candidates</h2>
      <form action={path} method="get" className="space-y-4">
        {legacy ? <input type="hidden" name="type" value="Careers" /> : null}
        <input type="hidden" name="pageSize" value={filters.pageSize} />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <label className="block min-w-0"><span className="adm-label mb-1.5">Search candidates</span><input name="q" type="search" className="adm-input" maxLength={100} placeholder="Name, email, phone or reference" defaultValue={filters.q} /></label>
          <label className="block min-w-0"><span className="adm-label mb-1.5">Role</span><input name="role" className="adm-input" list="candidate-roles" maxLength={120} placeholder="Any role" defaultValue={filters.role} /><datalist id="candidate-roles">{result.options.filter(o => o.kind === "role").map(o => <option key={o.value} value={o.value} />)}</datalist></label>
          <label className="block min-w-0"><span className="adm-label mb-1.5">Recruitment status</span><select name="stage" className="adm-input" defaultValue={filters.stage}>{CANDIDATE_STAGES.map(stage => <option key={stage} value={stage}>{STAGE_LABELS[stage]}</option>)}</select></label>
          <label className="block min-w-0"><span className="adm-label mb-1.5">Total experience</span><select name="experience" className="adm-input" defaultValue={filters.experience}><option value="">Any experience</option>{EXPERIENCE_FILTERS.map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
          {(["city", "hometown"] as const).map(key => <label key={key} className="block min-w-0"><span className="adm-label mb-1.5">{key === "city" ? "Current city" : "Hometown"}</span><input name={key} className="adm-input" list={`candidate-${key}`} maxLength={100} placeholder={key === "city" ? "Any city" : "Any hometown"} defaultValue={filters[key]} /><datalist id={`candidate-${key}`}><option value="Not provided" />{result.options.filter(o => o.kind === key).map(o => <option key={o.value} value={o.value} />)}</datalist></label>)}
        </div>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <p className="max-w-xl text-xs leading-5 text-muted">Location and role filters match part of the text. Choose “Not provided” to find missing locations. Reported experience bands are not exact totals.</p>
          <div className="flex flex-wrap items-end gap-2"><label className="block"><span className="adm-label mb-1">Contact outcome</span><select name="contact" className="adm-input" defaultValue={filters.contact}><option value="">Any outcome</option>{CONTACT_OUTCOMES.map(key => <option key={key} value={key}>{CONTACT_LABELS[key]}</option>)}</select></label><label className="block"><span className="adm-label mb-1">Sort by</span><select name="sort" className="adm-input" defaultValue={filters.sort}><option value="newest">Newest applications</option><option value="oldest">Oldest applications</option><option value="name">Candidate name</option><option value="interview">Interview date</option></select></label><button type="submit" className="adm-btn-primary">Apply filters</button><Link className="adm-btn-ghost" href={legacy ? "/admin/enquiries?type=Careers" : `${path}?stage=all`}>Clear all</Link></div>
        </div>
      </form>
    </section>
    <nav aria-label="Recruitment stage shortcuts" className="mb-5 flex flex-wrap gap-2">
      {(["all", "new", "shortlisted", "interview_scheduled", "hired", "rejected", "archived"] as const).map(stage => <Link key={stage} href={url({ stage, page: 1 })} aria-current={filters.stage === stage ? "page" : undefined} className={`inline-flex min-h-10 items-center gap-2 rounded-lg border px-3 text-xs font-semibold ${filters.stage === stage ? "border-foreground bg-foreground text-background" : "border-border bg-surface text-muted hover:border-accent hover:text-accent"}`}><span>{STAGE_LABELS[stage]}</span><span className="tabular-nums">{(stage === "all" ? allCount : facetCount(stage)).toLocaleString("en-IN")}</span></Link>)}
    </nav>
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h2 className="text-base font-semibold">{result.total.toLocaleString("en-IN")} matching application{result.total === 1 ? "" : "s"} <span className="text-sm font-normal text-muted">· {STAGE_LABELS[filters.stage]}</span></h2><p className="text-xs text-muted">{hasFilters ? "Stage counts reflect your current filters" : "Open a profile to review or update recruitment"}</p></div>
    {filteredBy.length ? <ul aria-label="Applied candidate filters" className="mb-4 flex flex-wrap gap-2">{filteredBy.map(([label, value]) => <li key={label}><Chip>{label}: {value}</Chip></li>)}</ul> : null}
    {!result.rows.length ? <EmptyState title="No candidates match these filters" message="Try a broader role, another experience band or clear the filters. Missing hometowns are not inferred from current city." actions={<Link className="adm-btn-ghost" href={`${path}?stage=all${legacy ? "&type=Careers" : ""}`}>Show all candidates</Link>} /> : <>
      <div className="adm-card hidden overflow-x-auto xl:block"><table className="adm-hairline-table w-full min-w-[54rem] text-sm"><caption className="sr-only">Candidate qualifications, location and recruitment status</caption><thead><tr>{["Candidate", "Role & skills", "Total experience", "Location", "Recruitment", "Review"].map(title => <th scope="col" key={title} className="px-4 py-3">{title}</th>)}</tr></thead><tbody className="divide-y divide-border">{result.rows.map(row => <tr key={row.id} className="align-top"><td className="max-w-56 px-4 py-4"><Link href={detail(row.id)} className="font-semibold hover:text-accent">{row.name}</Link><p className="mt-1 break-all text-xs text-muted">{row.email || row.phone || "No contact provided"}</p><p className="mt-2 text-xs text-muted">Applied {date(row.createdAt)}</p>{row.reference ? <p className="mt-1 text-xs text-muted">{row.reference}</p> : null}</td><td className="max-w-48 px-4 py-4"><p className="font-medium">{row.role || "Not provided"}</p><Skills value={row.skills} /></td><td className="px-4 py-4"><p className="font-medium">{experience(row)}</p><p className="mt-1 text-xs text-muted">{row.experienceMonths === null ? "Applicant-reported band" : "HR-confirmed total"}</p>{row.notice ? <p className="mt-2 text-xs text-muted">Notice: {row.notice}</p> : null}</td><td className="max-w-44 px-4 py-4"><p className="text-xs text-muted">Current city</p><p className="mt-1 break-words">{row.city || "Not provided"}</p><p className="mt-2 text-xs text-muted">Hometown</p><p className="mt-1 break-words">{row.hometown || "Not provided"}</p></td><td className="px-4 py-4"><CandidateStageChip stage={row.stage} /><Interview row={row} /><ContactSummary row={row} /></td><td className="px-4 py-4"><Link href={detail(row.id)} className="adm-btn-ghost">Review</Link></td></tr>)}</tbody></table></div>
      <div className="space-y-3 xl:hidden">{result.rows.map(row => <article key={row.id} className="adm-card p-4"><header className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><h3><Link href={detail(row.id)} className="font-semibold hover:text-accent">{row.name}</Link></h3><p className="mt-1 break-all text-xs text-muted">{row.email || row.phone || "No contact provided"}</p></div><CandidateStageChip stage={row.stage} /></header><p className="mb-3 mt-4 text-sm font-medium">{row.role || "Role not provided"}</p><dl className="grid grid-cols-2 gap-4 text-sm">{[["Total experience", experience(row)], ["Notice period", row.notice || "Not provided"], ["Current city", row.city || "Not provided"], ["Hometown", row.hometown || "Not provided"]].map(([label, value]) => <div key={label} className="min-w-0"><dt className="text-xs text-muted">{label}</dt><dd className="mt-1 break-words">{value}</dd></div>)}</dl><Skills value={row.skills} /><Interview row={row} /><ContactSummary row={row} /><footer className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3"><span className="text-xs text-muted">Applied {date(row.createdAt)}</span><Link className="adm-btn-ghost" href={detail(row.id)}>Review application</Link></footer></article>)}</div>
    </>}
    <Pagination page={result.page} total={result.total} pageSize={filters.pageSize} href={(page, pageSize) => url({ page, pageSize })} label="candidates" />
    <p className="mt-5 text-xs leading-5 text-muted">Older applications may not include hometown. New applications collect both locations. HR can add confirmed hometown and precise total experience without changing the original application.</p>
  </>;
}
