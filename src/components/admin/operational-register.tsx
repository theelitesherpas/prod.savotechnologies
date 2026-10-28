import Link from "next/link";
import { notFound } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { clientFullName, clientTitle } from "@/lib/client-name";
import { requireAdminPage } from "@/lib/permissions";
import { PORTALS, recordModule, recordPath, type PortalKey } from "@/lib/admin-portals";
import { recordId, statusLabel } from "@/lib/admin-records";
import { CAREER_ENQUIRY_WHERE } from "@/lib/admin-enquiries";
import { Pagination } from "./pagination";
import { parseAdminPage } from "@/lib/admin-pagination";
import { BackLink, PageHeader, Notice, EmptyState, Chip } from "./ui";
import { SubmitButton, ConfirmButton } from "./form";
import { FormGuard } from "./form-guard";
import { saveOperationalRecord, deleteOperationalRecord } from "@/app/admin/(protected)/operational-actions";

export type RegisterSearch = { q?: string; status?: string; page?: string; pageSize?: string; edit?: string; new?: string; e?: string; saved?: string; deleted?: string; subject?: string };
const formatDate = (value: Date | null) => value?.toISOString().slice(0, 10) ?? "";

/** Shared UI, but every department owns a fixed guarded route and filtered queries. */
export async function OperationalRegister({ portal, moduleKey, search }: { portal: PortalKey; moduleKey: string; search: RegisterSearch }) {
  const user = await requireAdminPage(`${PORTALS[portal].href}/records/[module]`);
  const definition = recordModule(portal, moduleKey);
  if (!definition) notFound();
  const path = recordPath(portal, definition.key);
  const size = parseAdminPage(search).pageSize;
  const q = (search.q ?? "").trim().slice(0, 100);
  const status = definition.statuses.includes(search.status ?? "") ? search.status : undefined;
  const subject = search.subject && recordId.safeParse(search.subject).success ? search.subject : undefined;
  const subjectKey = definition.subject === "candidate" ? "candidateId" : definition.subject === "client" ? "clientId" : "employeeId";
  if (!prisma) return <><PageHeader title={definition.label} /><Notice kind="alert">Database unavailable. Contact your administrator.</Notice></>;
  const where: Prisma.AdminOperationalRecordWhereInput = {
    portal, module: definition.key, ...(status ? { status } : {}), ...(subject ? { [subjectKey]: subject } : {}),
    ...(q ? { OR: [{ title: { contains: q, mode: "insensitive" } }, { owner: { contains: q, mode: "insensitive" } }, { subjectLabel: { contains: q, mode: "insensitive" } }] } : {}),
  };
  const editing = search.edit && recordId.safeParse(search.edit).success ? search.edit : undefined;
  let total: number;
  let rows;
  let record;
  let page: number;
  try {
    total = await prisma.adminOperationalRecord.count({ where });
    const requestedPage = Math.max(1, Math.min(100000, Number.parseInt(search.page ?? "1", 10) || 1));
    page = Math.min(requestedPage, Math.max(1, Math.ceil(total / size)));
    [rows, record] = await Promise.all([
      prisma.adminOperationalRecord.findMany({ where, include: { client: { select: { name: true, title: true } } }, orderBy: [{ updatedAt: "desc" }, { id: "desc" }], take: size, skip: (page - 1) * size }),
      editing ? prisma.adminOperationalRecord.findFirst({ where: { id: editing, portal, module: definition.key } }) : null,
    ]);
  } catch {
    return <><BackLink href={PORTALS[portal].href} label={`Back to ${PORTALS[portal].label}`} /><PageHeader title={definition.label} description={definition.description} /><Notice kind="alert">This register could not be loaded. Ask your administrator to verify the database connection and apply the admin-portals schema update, then reload. Existing portal records are unchanged.</Notice></>;
  }
  if (search.edit && !record) notFound();
  const showForm = Boolean(search.new || record);
  const linkedId = record?.[subjectKey] ?? subject ?? "";
  const pool: { id: string; label: string }[] = [];
  if (showForm) {
    // Restricted DTOs only. Cross-department masters and sensitive employee fields never enter the form.
    if (definition.subject === "employee") {
      const subjects = await prisma.employee.findMany({ where: { OR: [{ status: { not: "exited" } }, ...(linkedId ? [{ id: linkedId }] : [])] }, select: { id: true, employeeCode: true, name: true }, orderBy: { name: "asc" }, take: 250 });
      pool.push(...subjects.map(s => ({ id: s.id, label: `${s.employeeCode} · ${s.name}` })));
    } else if (definition.subject === "client") {
      const subjects = await prisma.clientUser.findMany({ select: { id: true, name: true, title: true, businessId: true }, orderBy: { name: "asc" }, take: 250 });
      pool.push(...subjects.map(s => ({ id: s.id, label: `${s.businessId ? `${s.businessId} · ` : ""}${clientFullName(s.name, s.title)}` })));
    } else {
      const subjects = await prisma.projectEnquiry.findMany({ where: CAREER_ENQUIRY_WHERE, select: { id: true, name: true, reference: true }, orderBy: { createdAt: "desc" }, take: 250 });
      pool.push(...subjects.map(s => ({ id: s.id, label: `${s.name}${s.reference ? ` · ${s.reference}` : ""}` })));
    }
    if (linkedId && !pool.some(s => s.id === linkedId)) {
      const extra = definition.subject === "employee" ? await prisma.employee.findUnique({ where: { id: linkedId }, select: { id: true, name: true } })
        : definition.subject === "client" ? await prisma.clientUser.findUnique({ where: { id: linkedId }, select: { id: true, name: true, title: true } })
          : await prisma.projectEnquiry.findFirst({ where: { AND: [CAREER_ENQUIRY_WHERE, { id: linkedId }] }, select: { id: true, name: true } });
      if (extra) pool.unshift({ id: extra.id, label: clientFullName(extra.name, "title" in extra ? clientTitle(extra.title) : undefined) });
    }
  }
  const data = (record?.data && typeof record.data === "object" && !Array.isArray(record.data) ? record.data : {}) as Record<string, unknown>;
  const href = (over: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries({ q, status, subject, pageSize: String(size), page: String(page), ...over })) if (value && value !== "1") params.set(key, value);
    return `${path}${params.size ? `?${params}` : ""}`;
  };
  return <>
    <BackLink href={PORTALS[portal].href} label={`Back to ${PORTALS[portal].label}`} />
    <PageHeader title={definition.label} description={definition.description} actions={!showForm ? <Link className="adm-btn-primary" href={`${path}?new=1${subject ? `&subject=${subject}` : ""}`}>Add {definition.singular.toLowerCase()}</Link> : undefined} />
    {search.saved ? <Notice>Record saved. No emails or payments were initiated.</Notice> : null}
    {search.deleted ? <Notice>Record deleted.</Notice> : null}
    {search.e ? <Notice kind="alert">{search.e}</Notice> : null}
    {showForm ? <section aria-labelledby="record-form-heading" className="adm-card mb-8 p-5 sm:p-6">
      <h2 id="record-form-heading" className="mb-5 text-lg font-bold">{record ? "Edit" : "New"} {definition.singular.toLowerCase()}</h2>
      <FormGuard action={saveOperationalRecord} className="space-y-5">
        <input type="hidden" name="portal" value={portal} /><input type="hidden" name="module" value={definition.key} />
        {record ? <><input type="hidden" name="id" value={record.id} /><input type="hidden" name="version" value={record.version} /></> : null}
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block sm:col-span-2"><span className="adm-label mb-1 block">Title *</span><input className="adm-input" name="title" required minLength={2} maxLength={180} defaultValue={record?.title ?? ""} /></label>
          <label className="block"><span className="adm-label mb-1 block">{statusLabel(definition.subject)}{definition.key !== "requisitions" ? " *" : " (optional)"}</span><select className="adm-input" name="subjectId" required={definition.key !== "requisitions"} defaultValue={linkedId}><option value="">Choose {definition.subject}</option>{pool.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}</select><span className="mt-1 block text-xs text-muted">Showing up to 250 records. Create the master record first; existing links are always retained.</span></label>
          <label className="block"><span className="adm-label mb-1 block">Status *</span><select className="adm-input" name="status" required defaultValue={record?.status ?? definition.statuses[0]}>{definition.statuses.map(s => <option key={s} value={s}>{statusLabel(s)}</option>)}</select></label>
          <label className="block"><span className="adm-label mb-1 block">Responsible owner</span><input className="adm-input" name="owner" maxLength={120} defaultValue={record?.owner ?? ""} /></label>
          <label className="block"><span className="adm-label mb-1 block">Start date / period start</span><input className="adm-input" name="startDate" type="date" min="1900-01-01" max="2200-12-31" defaultValue={formatDate(record?.startDate ?? null)} /></label>
          <label className="block"><span className="adm-label mb-1 block">Due date / period end</span><input className="adm-input" name="dueDate" type="date" min="1900-01-01" max="2200-12-31" defaultValue={formatDate(record?.dueDate ?? null)} /></label>
          {definition.fields.map(field => <label key={field.key} className={`block ${field.type === "textarea" ? "sm:col-span-2" : ""}`}>
            <span className="adm-label mb-1 block">{field.label}{field.required ? " *" : ""}</span>
            {field.type === "textarea" ? <textarea className="adm-input" name={`data.${field.key}`} required={field.required} rows={4} maxLength={6000} defaultValue={String(data[field.key] ?? "")} />
              : field.type === "select" ? <select className="adm-input" name={`data.${field.key}`} required={field.required} defaultValue={String(data[field.key] ?? "")}><option value="">Choose an option</option>{field.options?.map(o => <option key={o} value={o}>{statusLabel(o)}</option>)}</select>
                : <input className="adm-input" name={`data.${field.key}`} type={field.type ?? "text"} required={field.required} maxLength={field.type === "url" ? 1000 : 500} min={field.type === "number" ? "0" : field.type === "date" ? "1900-01-01" : undefined} max={field.type === "date" ? "2200-12-31" : undefined} step={field.type === "number" ? "0.01" : undefined} defaultValue={String(data[field.key] ?? "")} />}
            {field.hint ? <span className="mt-1 block text-xs text-muted">{field.hint}</span> : null}
          </label>)}
        </div>
        <label className="block"><span className="adm-label mb-1 block">Internal notes</span><textarea className="adm-input" name="notes" rows={4} maxLength={10000} defaultValue={record?.notes ?? ""} /></label>
        <p className="text-xs text-muted">Admin-only record. Do not store passwords, bank credentials or government identity numbers. Required fields are marked *.</p>
        <div className="flex flex-wrap gap-3"><SubmitButton label={record ? "Save changes" : "Create record"} /><Link className="adm-btn-ghost" href={path}>Cancel</Link></div>
      </FormGuard>
      {record && user.role === "admin" ? <form action={deleteOperationalRecord} className="mt-6 flex flex-wrap items-end gap-3 border-t border-border pt-5"><input type="hidden" name="portal" value={portal} /><input type="hidden" name="module" value={definition.key} /><input type="hidden" name="id" value={record.id} /><input type="hidden" name="version" value={record.version} /><label><span className="adm-label mb-1 block">Type DELETE to permanently remove</span><input className="adm-input" name="confirm" required pattern="DELETE" autoComplete="off" /></label><ConfirmButton label="Delete record" confirmLabel="Confirm deletion" /></form> : null}
    </section> : <>
      <form action={path} className="mb-5 flex flex-wrap gap-3">
        <input type="hidden" name="pageSize" value={size} />
        {subject ? <input type="hidden" name="subject" value={subject} /> : null}
        <input name="q" type="search" className="adm-input min-w-0 sm:max-w-xs" aria-label="Search records" placeholder="Search title, person or owner" maxLength={100} defaultValue={q} />
        <select name="status" aria-label="Filter by status" className="adm-input sm:max-w-48" defaultValue={status ?? ""}><option value="">All statuses</option>{definition.statuses.map(s => <option key={s} value={s}>{statusLabel(s)}</option>)}</select>
        <button className="adm-btn-ghost" type="submit">Filter</button>{q || status || subject ? <Link className="adm-btn-ghost" href={path}>Clear filters</Link> : null}
      </form>
      <p className="mb-3 text-sm text-muted">{total} record{total === 1 ? "" : "s"}</p>
      {rows.length ? <div className="adm-card overflow-x-auto"><table className="adm-hairline-table w-full min-w-[38rem]"><thead><tr>{["Record", statusLabel(definition.subject), "Status", "Owner", "Due date", "Updated"].map(label => <th key={label} className="px-4 py-3 text-left text-xs font-semibold text-muted">{label}</th>)}</tr></thead><tbody>{rows.map(row => <tr key={row.id}><td className="px-4 py-3"><Link className="font-semibold hover:text-accent" href={`${path}?edit=${row.id}`}>{row.title}</Link></td><td className="px-4 py-3 text-sm">{row.client ? clientFullName(row.client.name, row.client.title) : row.subjectLabel || "Not linked"}{!row[subjectKey] && row.subjectLabel ? " (master removed)" : ""}</td><td className="px-4 py-3"><Chip>{statusLabel(row.status)}</Chip></td><td className="px-4 py-3 text-sm">{row.owner || "Unassigned"}</td><td className="px-4 py-3 text-sm tabular-nums">{formatDate(row.dueDate) || "Not set"}</td><td className="px-4 py-3 text-xs tabular-nums text-muted">{formatDate(row.updatedAt)}</td></tr>)}</tbody></table></div>
        : <EmptyState title="No records found" message={q || status || subject ? "Try another search or clear the filters." : `Add the first ${definition.singular.toLowerCase()} to start this register. These records are managed in admin only.`} />}
      <Pagination page={page} total={total} pageSize={size} href={(target, pageSize) => href({ page: String(target), pageSize: String(pageSize) })} label="records" />
    </>}
  </>;
}
