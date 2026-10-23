import Link from "next/link";
import { requireAdminPage } from "@/lib/permissions";
import { getCandidatePage, type CandidateRow } from "@/lib/hr-candidate-data";
import { CANDIDATE_READ_STATES, READ_LABELS, CANDIDATE_STAGES, EXPERIENCE_FILTERS, STAGE_LABELS, candidateListUrl, formatExperience, parseCandidateFilters, type CandidateSearch } from "@/lib/hr-candidates";
import { PageHeader, Notice, Chip, EmptyState } from "@/components/admin/ui";
import { Pagination } from "@/components/admin/pagination";
import { fmtIST } from "@/lib/datetime";
import { CONTACT_LABELS, CONTACT_OUTCOMES } from "@/lib/hr-contact";
import { FilterCheckboxes } from "./filter-checkboxes";
import { CandidateListRefresh } from "./candidate-read-state";
import s from "./candidate-workspace.module.css";

function ViewStatus({ unread }: { unread: boolean }) {
  return <span className={`${s.viewLabel} ${unread ? s.notViewed : ""}`}>{unread ? <span className={s.dot} aria-hidden="true" /> : null}{unread ? "Not viewed" : "Viewed"}</span>;
}

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
  await requireAdminPage(path);
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
  const filteredBy = [["Search", filters.q], ["Total experience", EXPERIENCE_FILTERS.find(([key]) => key === filters.experience)?.[1] ?? ""], ["Current cities", filters.city.join(" · ")], ["Hometowns", filters.hometown.join(" · ")], ["Skills", filters.skills.length ? `${filters.skillMatch === "all" ? "All" : "Any"}: ${filters.skills.join(" · ")}` : ""], ["Role", filters.role], ["Contact", filters.contact ? CONTACT_LABELS[filters.contact] : ""]].filter(([, value]) => value);
  return <>
    <CandidateListRefresh />
    <PageHeader title={pipeline ? search.tab === "scheduled" ? "Interview schedule" : "Recruitment pipeline" : "Applications & candidates"} />
    {search.e ? <Notice kind="alert">{search.e}</Notice> : null}
    {search.deleted ? <Notice>Application deleted.</Notice> : null}
    {search.unread ? <Notice>Application marked not viewed. Opening it will mark it viewed for the team.</Notice> : null}
    <details key={url()} id="candidate-filter-panel" className="adm-card group mb-4">
      <summary className="flex min-h-12 cursor-pointer flex-wrap items-center gap-2 px-4 py-3 text-sm focus-visible:outline-2 focus-visible:outline-accent"><span className="font-semibold">Filters</span><span className="text-xs text-muted">{filteredBy.length ? `${filteredBy.length} applied` : "Search, role, location and more"}</span><svg aria-hidden="true" viewBox="0 0 20 20" className="ml-auto h-4 w-4 shrink-0 text-muted group-open:rotate-180" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="m5 7 5 5 5-5" /></svg></summary>
      <form action={path} method="get" className="space-y-4 border-t border-border p-4 sm:p-5">
        {legacy ? <input type="hidden" name="type" value="Careers" /> : null}
        <input type="hidden" name="pageSize" value={filters.pageSize} />
        <input type="hidden" name="read" value={filters.read} />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <label className="block min-w-0"><span className="adm-label mb-1.5">Search candidates</span><input name="q" type="search" className="adm-input" maxLength={100} placeholder="Name, email, phone or reference" defaultValue={filters.q} /></label>
          <label className="block min-w-0"><span className="adm-label mb-1.5">Role</span><input name="role" className="adm-input" list="candidate-roles" maxLength={120} placeholder="Any role" defaultValue={filters.role} /><datalist id="candidate-roles">{result.options.filter(o => o.kind === "role").map(o => <option key={o.value} value={o.value} />)}</datalist></label>
          <label className="block min-w-0"><span className="adm-label mb-1.5">Recruitment status</span><select name="stage" className="adm-input" defaultValue={filters.stage}>{CANDIDATE_STAGES.map(stage => <option key={stage} value={stage}>{STAGE_LABELS[stage]} ({stage === "all" ? allCount : stage === "active" ? result.counts.filter(row => ["new", "shortlisted", "interview_scheduled"].includes(row.stage)).reduce((sum, row) => sum + row.count, 0) : facetCount(stage)})</option>)}</select></label>
          <label className="block min-w-0"><span className="adm-label mb-1.5">Total experience</span><select name="experience" className="adm-input" defaultValue={filters.experience}><option value="">Any experience</option>{EXPERIENCE_FILTERS.map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
        </div>
        <div className="grid items-start gap-4 lg:grid-cols-3">
          <FilterCheckboxes name="city" label="Current cities" options={["Not provided", ...result.options.filter(option => option.kind === "city").map(option => option.value)]} selected={filters.city} hint="Matches any selected city. City text can match part of a recorded location." />
          <FilterCheckboxes name="hometown" label="Hometowns" options={["Not provided", ...result.options.filter(option => option.kind === "hometown").map(option => option.value)]} selected={filters.hometown} hint="Matches any selected hometown. Not provided finds missing information." />
          <div className="min-w-0"><FilterCheckboxes name="skills" label="Skills" options={result.options.filter(option => option.kind === "skill").map(option => option.value)} selected={filters.skills} hint="Choose skills actually recorded in applications." /><label className="mt-3 block"><span className="adm-label mb-1">Skill match</span><select name="skillMatch" className="adm-input" defaultValue={filters.skillMatch}><option value="any">Any selected skill</option><option value="all">All selected skills</option></select></label></div>
        </div>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <p className="max-w-xl text-xs leading-5 text-muted">Cities match any checked choice. Skills use the selected any/all rule. All filter groups combine; reported experience bands are not exact totals.</p>
          <div className="flex flex-wrap items-end gap-2"><label className="block"><span className="adm-label mb-1">Contact outcome</span><select name="contact" className="adm-input" defaultValue={filters.contact}><option value="">Any outcome</option>{CONTACT_OUTCOMES.map(key => <option key={key} value={key}>{CONTACT_LABELS[key]}</option>)}</select></label><label className="block"><span className="adm-label mb-1">Sort by</span><select name="sort" className="adm-input" defaultValue={filters.sort}><option value="newest">Newest applications</option><option value="oldest">Oldest applications</option><option value="name">Candidate name</option><option value="interview">Interview date</option></select></label><button type="submit" className="adm-btn-primary">Apply filters</button><Link className="adm-btn-ghost" href={url({ q: "", city: [], hometown: [], skills: [], skillMatch: "any", role: "", experience: "", contact: "", stage: "all", page: 1 })}>Clear filters</Link></div>
        </div>
      </form>
    </details>
    <nav aria-label="Application view status" className="mb-2 flex flex-wrap gap-2">{CANDIDATE_READ_STATES.map(read => <Link key={read} prefetch={false} href={url({ read, page: 1 })} aria-current={filters.read === read ? "page" : undefined} className={`inline-flex min-h-11 items-center gap-2 rounded-lg border px-3 text-sm font-semibold ${filters.read === read ? "border-foreground bg-foreground text-background" : "border-border bg-surface text-foreground hover:border-accent"}`}><span>{read === "all" ? "All" : READ_LABELS[read]}</span><span className="tabular-nums">{result.readCounts[read].toLocaleString("en-IN")}</span></Link>)}</nav>
    <p className="mb-4 text-xs leading-5 text-muted">Shared team view status; contact and hiring stay separate.</p>
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h2 className="text-base font-semibold">{result.total.toLocaleString("en-IN")} matching application{result.total === 1 ? "" : "s"} <span className="text-sm font-normal text-muted">· {STAGE_LABELS[filters.stage]}</span></h2></div>
    {filteredBy.length ? <ul aria-label="Applied candidate filters" className="mb-4 flex flex-wrap gap-2">{filteredBy.map(([label, value]) => <li key={label}><Chip>{label}: {value}</Chip></li>)}</ul> : null}
    {!result.rows.length ? <EmptyState title="No candidates match these filters" message="Try a broader role, another experience band or clear the filters. Missing hometowns are not inferred from current city." actions={<Link className="adm-btn-ghost" href={`${path}?stage=all${legacy ? "&type=Careers" : ""}`}>Show all candidates</Link>} /> : <>
      <div className={`${s.workspace} adm-card hidden overflow-x-auto xl:block`}><table className="adm-hairline-table w-full min-w-[54rem] text-sm"><caption className="sr-only">Candidate qualifications, location and recruitment status</caption><thead><tr>{["Candidate", "Role & skills", "Total experience", "Location", "Recruitment", "Review"].map(title => <th scope="col" key={title} className="px-4 py-3">{title}</th>)}</tr></thead><tbody className="divide-y divide-border">{result.rows.map(row => <tr key={row.id} data-view-state={row.inboxStatus === "new" ? "not_viewed" : "viewed"} className={`align-top ${row.inboxStatus === "new" ? s.unreadRow : ""}`}><td className="max-w-56 px-4 py-4"><Link prefetch={false} href={detail(row.id)} className={`${row.inboxStatus === "new" ? "font-bold" : "font-medium"} hover:text-accent`}>{row.name}</Link><div className="mt-1"><ViewStatus unread={row.inboxStatus === "new"} /></div><p className="mt-1 break-all text-xs text-muted">{row.email || row.phone || "No contact provided"}</p><p className="mt-2 text-xs text-muted">Applied {date(row.createdAt)}</p>{row.reference ? <p className="mt-1 text-xs text-muted">{row.reference}</p> : null}</td><td className="max-w-48 px-4 py-4"><p className="font-medium">{row.role || "Not provided"}</p><Skills value={row.skills} /></td><td className="px-4 py-4"><p className="font-medium">{experience(row)}</p><p className="mt-1 text-xs text-muted">{row.experienceMonths === null ? "Applicant-reported band" : "HR-confirmed total"}</p>{row.notice ? <p className="mt-2 text-xs text-muted">Notice: {row.notice}</p> : null}</td><td className="max-w-44 px-4 py-4"><p className="text-xs text-muted">Current city</p><p className="mt-1 break-words">{row.city || "Not provided"}</p><p className="mt-2 text-xs text-muted">Hometown</p><p className="mt-1 break-words">{row.hometown || "Not provided"}</p></td><td className="px-4 py-4"><CandidateStageChip stage={row.stage} /><Interview row={row} /><ContactSummary row={row} /></td><td className="px-4 py-4"><Link prefetch={false} href={detail(row.id)} className="adm-btn-ghost">Review</Link></td></tr>)}</tbody></table></div>
      <div className={`${s.workspace} space-y-3 xl:hidden`}>{result.rows.map(row => <article key={row.id} data-view-state={row.inboxStatus === "new" ? "not_viewed" : "viewed"} className={`adm-card p-4 ${row.inboxStatus === "new" ? s.unreadCard : ""}`}><header className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><h3><Link prefetch={false} href={detail(row.id)} className={`${row.inboxStatus === "new" ? "font-bold" : "font-medium"} hover:text-accent`}>{row.name}</Link></h3><div className="mt-1"><ViewStatus unread={row.inboxStatus === "new"} /></div><p className="mt-1 break-all text-xs text-muted">{row.email || row.phone || "No contact provided"}</p></div><CandidateStageChip stage={row.stage} /></header><p className="mb-3 mt-4 text-sm font-medium">{row.role || "Role not provided"}</p><dl className="grid grid-cols-2 gap-4 text-sm">{[["Total experience", experience(row)], ["Notice period", row.notice || "Not provided"], ["Current city", row.city || "Not provided"], ["Hometown", row.hometown || "Not provided"]].map(([label, value]) => <div key={label} className="min-w-0"><dt className="text-xs text-muted">{label}</dt><dd className="mt-1 break-words">{value}</dd></div>)}</dl><Skills value={row.skills} /><Interview row={row} /><ContactSummary row={row} /><footer className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3"><span className="text-xs text-muted">Applied {date(row.createdAt)}</span><Link prefetch={false} className="adm-btn-ghost" href={detail(row.id)}>Review application</Link></footer></article>)}</div>
    </>}
    <Pagination page={result.page} total={result.total} pageSize={filters.pageSize} href={(page, pageSize) => url({ page, pageSize })} label="candidates" />
    <p className="mt-5 text-xs leading-5 text-muted">Older applications may not include hometown. New applications collect both locations. HR can add confirmed hometown and precise total experience without changing the original application.</p>
  </>;
}
