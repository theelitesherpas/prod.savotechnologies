"use client";

import { useId, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { ROLE_FILTERS, roleSlug, type PublicRole, type RoleCategory } from "@/constants/careers";
import { ClosingArrow } from "@/components/shared/closing-cta";
import { track } from "@/lib/analytics";
import s from "./careers.module.css";

const subscribe = () => () => {};
/** A compact directory: scan roles first, open details deliberately, apply directly. */
export function OpenRoles({ roles }: { roles: PublicRole[] }) {
  const id = useId(), enhanced = useSyncExternalStore(subscribe, () => true, () => false);
  const [filter, setFilter] = useState<"all" | RoleCategory>("all");
  const visible = roles.filter(role => filter === "all" || role.cat === filter);
  return <section id="openings" className={`${s.section} ${s.openingsSection}`} aria-labelledby="openings-heading"><div className={`${s.rail} ${s.openingsLayout}`}>
    <aside className={s.openingsSidebar} aria-label="Browse openings">
      <h2 id="openings-heading">Find your place.</h2>
      <p>{roles.length ? `${roles.length} current ${roles.length === 1 ? "opening" : "openings"}. Browse the details or apply directly.` : "No vacancies are listed here right now. You can still send a general application."}</p>
      {roles.length ? <div className={s.teamFilters} hidden={!enhanced} role="group" aria-label="Filter roles by team">{ROLE_FILTERS.map(item => <button key={item.key} type="button" aria-label={item.label} aria-pressed={filter === item.key} onClick={() => { setFilter(item.key); track("role_filter_click", { filter: item.key }); }}><span>{item.label}</span><span aria-hidden="true">{roles.filter(role => item.key === "all" || role.cat === item.key).length}</span></button>)}</div> : null}
    </aside>
    <div className={s.openingsResults}>
      {roles.length ? <>
        <div className={s.boardHeading}><p role="status">{visible.length} {visible.length === 1 ? "open role" : "open roles"}</p><span>Find your next chapter.</span></div>
        {visible.length ? <ul className={s.roleList}>{visible.map(role => <li key={role.title}><article className={s.roleItem} aria-labelledby={`${id}-${roleSlug(role.title)}`}>
          <header className={s.roleHeader}>
            <div className={s.roleIdentity}><h3 id={`${id}-${roleSlug(role.title)}`}>{role.title}</h3><p className={s.roleMeta}>{role.track ? <span>{role.track}</span> : null}<span className={s.mobileExperience}>{role.exp || "Experience not specified"}</span></p></div>
            <span className={s.roleExperience}><span className="sr-only">Experience: </span>{role.exp || "Not specified"}</span>
            <Link href={`/careers/apply?role=${roleSlug(role.title)}`} className={s.roleApply} aria-label={`Apply now for ${role.title}`} onClick={() => track("apply_click", { role: role.title })}>Apply now <ClosingArrow /></Link>
          </header>
          <details name={`${id}-role-details`} className={s.jobDetails} onToggle={event => { if (event.currentTarget.open) track("role_open", { role: role.title }); }}>
            <summary className={s.detailsToggle} aria-label={`Role details for ${role.title}`}><span>Details</span><svg aria-hidden="true" viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m5 7 5 5 5-5" /></svg></summary>
            <div className={s.jobDetailContent}>
              {role.blurb ? <p className={s.roleDescription}>{role.blurb}</p> : null}
              {role.duties.length ? <div><h4>What you will do</h4><ul>{role.duties.map(text => <li key={text}>{text}</li>)}</ul></div> : null}
              {role.brings.length ? <div><h4>What you bring</h4><ul>{role.brings.map(text => <li key={text}>{text}</li>)}</ul></div> : null}
              {role.datePosted ? <p className={s.jobPosted}>Posted <time dateTime={role.datePosted}>{role.datePosted}</time></p> : null}
            </div>
          </details>
        </article></li>)}</ul> : <div className={s.filterEmpty} role="status"><h3>No openings in this team right now.</h3><p>Try All roles or send a general application.</p></div>}
        <div className={s.generalNote}><p>Don’t see your role?</p><Link href="/careers/apply?role=general-application" onClick={() => track("apply_click", { role: "General application" })}>General application <ClosingArrow /></Link></div>
      </> : <div className={s.emptyWorkspace}><div className={s.emptyArt} aria-hidden="true"><svg viewBox="0 0 160 128" fill="none"><path d="M22 30V16h48l12 14h56v82H22V30Z" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" /><rect x="48" y="49" width="70" height="46" rx="4" fill="#fff" /><path d="M83 60v24M71 72h24" stroke="#b82222" strokeWidth="3" strokeLinecap="round" /></svg></div><div><h3>Your skills can start the conversation.</h3><p>Tell us about your experience and the kind of work you’re looking for.</p><Link href="/careers/apply?role=general-application" className={s.primary} onClick={() => track("apply_click", { role: "General application" })}>Send a general application <ClosingArrow /></Link></div></div>}
    </div>
  </div></section>;
}
