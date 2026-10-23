"use client";

import { useId, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { ROLE_FILTERS, roleSlug, type PublicRole, type RoleCategory } from "@/constants/careers";
import { ClosingArrow } from "@/components/shared/closing-cta";
import { track } from "@/lib/analytics";
import s from "./careers.module.css";

const subscribe = () => () => {};
/** Each published job owns its details and a direct link to the separate application page. */
export function OpenRoles({ roles }: { roles: PublicRole[] }) {
  const id = useId(), enhanced = useSyncExternalStore(subscribe, () => true, () => false);
  const [filter, setFilter] = useState<"all" | RoleCategory>("all");
  const visible = roles.filter(role => filter === "all" || role.cat === filter);
  return <section id="openings" className={s.section} aria-labelledby="openings-heading"><div className={s.rail}>
    <div className={s.sectionHead}><h2 id="openings-heading">Find your place.</h2><p>{roles.length ? `Explore ${roles.length} current ${roles.length === 1 ? "opening" : "openings"}. Choose Apply now to open a separate application page.` : "No vacancies are listed here right now. You can still send a general application."}</p></div>
    {roles.length ? <>
      <div className={s.filters} hidden={!enhanced} role="group" aria-label="Filter roles by team">{ROLE_FILTERS.map(item => <button key={item.key} type="button" aria-pressed={filter === item.key} onClick={() => { setFilter(item.key); track("role_filter_click", { filter: item.key }); }}>{item.label}</button>)}</div>
      <ul className={s.roleList}>{visible.map(role => <li key={role.title}><article className={s.roleItem} aria-labelledby={`${id}-${roleSlug(role.title)}`}>
        <header className={s.roleHeader}><div className={s.roleIdentity}><h3 id={`${id}-${roleSlug(role.title)}`}>{role.title}</h3>{role.track ? <p className={s.roleTrack}>{role.track}</p> : null}</div>
          <Link href={`/careers/apply?role=${roleSlug(role.title)}`} className={s.primary} aria-label={`Apply now for ${role.title}`} onClick={() => track("apply_click", { role: role.title })}>Apply now <ClosingArrow /></Link>
        </header>
        <p className={s.roleSummary}>{role.blurb}</p>
        {(role.exp || role.datePosted) ? <dl className={s.roleFacts}>{role.exp ? <div><dt>Experience</dt><dd>{role.exp}</dd></div> : null}{role.datePosted ? <div><dt>Posted</dt><dd><time dateTime={role.datePosted}>{role.datePosted}</time></dd></div> : null}</dl> : null}
        {(role.duties.length || role.brings.length) ? <details className={s.jobDetails} onToggle={event => { if (event.currentTarget.open) track("role_open", { role: role.title }); }}><summary>Role details <Plus /></summary>
          <div className={s.jobDetailContent}>{role.duties.length ? <><h4>What you will do</h4><ul>{role.duties.map(text => <li key={text}>{text}</li>)}</ul></> : null}{role.brings.length ? <><h4>What you bring</h4><ul>{role.brings.map(text => <li key={text}>{text}</li>)}</ul></> : null}</div>
        </details> : null}
      </article></li>)}</ul>
      {!visible.length ? <p className={s.filterEmpty} role="status">No openings in this team right now. Try All roles or send a general application.</p> : null}
      <div className={s.generalNote}><p>Don’t see your role?</p><Link href="/careers/apply?role=general-application" onClick={() => track("apply_click", { role: "General application" })}>Send a general application <ClosingArrow /></Link></div>
    </> : <div className={s.emptyWorkspace}><div className={s.emptyArt} aria-hidden="true"><svg viewBox="0 0 160 128" fill="none"><path d="M22 30V16h48l12 14h56v82H22V30Z" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" /><rect x="48" y="49" width="70" height="46" rx="4" fill="#fff" /><path d="M83 60v24M71 72h24" stroke="#b82222" strokeWidth="3" strokeLinecap="round" /></svg></div><div><h3>Your skills can start the conversation.</h3><p>Tell us about your experience and the kind of work you’re looking for.</p><Link href="/careers/apply?role=general-application" className={s.primary} onClick={() => track("apply_click", { role: "General application" })}>Send a general application <ClosingArrow /></Link></div></div>}
  </div></section>;
}
function Plus() { return <svg aria-hidden="true" width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 10h12" /><path data-plus-vertical d="M10 4v12" /></svg>; }
