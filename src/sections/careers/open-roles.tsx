"use client";

import { useId, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { ROLE_FILTERS, roleSlug, type PublicRole, type RoleCategory } from "@/constants/careers";
import { ClosingArrow } from "@/components/shared/closing-cta";
import { track } from "@/lib/analytics";
import s from "./careers.module.css";

const subscribe = () => () => {};
/** Only published managed vacancies enter this directory. No coded role backfill. */
export function OpenRoles({ roles }: { roles: PublicRole[] }) {
  const id = useId();
  const enhanced = useSyncExternalStore(subscribe, () => true, () => false);
  const [filter, setFilter] = useState<"all" | RoleCategory>("all");
  const [selected, setSelected] = useState(roles[0]?.title ?? "");
  const visible = roles.filter(role => filter === "all" || role.cat === filter);
  const active = visible.find(role => role.title === selected)?.title ?? visible[0]?.title;
  return <section id="openings" className={s.section} aria-labelledby="openings-heading"><div className={s.rail}>
    <div className={s.sectionHead}><h2 id="openings-heading">Find your place.</h2><p>{roles.length ? `Explore ${roles.length} current ${roles.length === 1 ? "opening" : "openings"}. Choose a role to see the details.` : "No vacancies are listed here right now. You can still send a general application."}</p></div>
    {roles.length ? <>
      <div className={s.filters} hidden={!enhanced} role="group" aria-label="Filter roles by team">{ROLE_FILTERS.map(f => <button key={f.key} type="button" aria-pressed={filter === f.key} onClick={() => { setFilter(f.key); track("role_filter_click", { filter: f.key }); }}>{f.label}</button>)}</div>
      <div className={s.roleWorkspace} data-enhanced={enhanced}>
        <fieldset className={s.roleFiles} hidden={!enhanced}><legend className="sr-only">Choose an open role</legend>{visible.map(role => <label key={role.title}><input type="radio" name={`${id}-role`} checked={active === role.title} onChange={() => { setSelected(role.title); track("role_open", { role: role.title }); }} aria-controls={`${id}-${roleSlug(role.title)}`} /><span><b>{role.title}</b><small>{role.track}</small><ClosingArrow /></span></label>)}</fieldset>
        <div className={s.roleContent}>{roles.map(role => <article key={role.title} id={`${id}-${roleSlug(role.title)}`} hidden={active !== role.title}>
          <div className={s.rolePath}>/careers/apply?role={roleSlug(role.title)}</div><h3>{role.title}</h3><p>{role.blurb}</p><dl className={s.roleFacts}>{role.track && <div><dt>Focus</dt><dd>{role.track}</dd></div>}{role.exp && <div><dt>Experience</dt><dd>{role.exp}</dd></div>}{role.datePosted && <div><dt>Posted</dt><dd><time dateTime={role.datePosted}>{role.datePosted}</time></dd></div>}</dl>
          {role.duties.length > 0 && <details><summary>What you will do <Plus /></summary><ul>{role.duties.map(d => <li key={d}>{d}</li>)}</ul></details>}
          {role.brings.length > 0 && <details><summary>What you bring <Plus /></summary><ul>{role.brings.map(b => <li key={b}>{b}</li>)}</ul></details>}
          <Link href={`/careers/apply?role=${roleSlug(role.title)}`} className={s.primary} onClick={() => track("apply_click", { role: role.title })}>Apply for this role <ClosingArrow /></Link>
        </article>)}{!visible.length && <p className={s.filterEmpty} role="status">No openings in this team right now. Try All roles or send a general application.</p>}</div>
      </div>
      <noscript><div className={s.nativeRoleFallback}>{roles.slice(1).map(role => <details key={role.title}><summary>{role.title}<Plus /></summary><p>{role.blurb}</p><p>{[role.track, role.exp].filter(Boolean).join(" · ")}</p>{role.duties.length > 0 && <><h3>What you will do</h3><ul>{role.duties.map(text => <li key={text}>{text}</li>)}</ul></>}{role.brings.length > 0 && <><h3>What you bring</h3><ul>{role.brings.map(text => <li key={text}>{text}</li>)}</ul></>}<Link href={`/careers/apply?role=${roleSlug(role.title)}`} className={s.primary}>Apply for this role <ClosingArrow /></Link></details>)}</div></noscript>
      <div className={s.generalNote}><p>Don’t see your role?</p><Link href="/careers/apply?role=general-application" onClick={() => track("apply_click", { role: "General application" })}>Send a general application <ClosingArrow /></Link></div>
    </> : <div className={s.emptyWorkspace}><div className={s.emptyArt} aria-hidden="true"><svg viewBox="0 0 160 128" fill="none"><path d="M22 30V16h48l12 14h56v82H22V30Z" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" /><rect x="48" y="49" width="70" height="46" rx="4" fill="#fff" /><path d="M83 60v24M71 72h24" stroke="#b82222" strokeWidth="3" strokeLinecap="round" /></svg></div><div><h3>Your skills can start the conversation.</h3><p>Tell us about your experience and the kind of work you’re looking for.</p><Link href="/careers/apply?role=general-application" className={s.primary} onClick={() => track("apply_click", { role: "General application" })}>Send a general application <ClosingArrow /></Link></div></div>}
  </div></section>;
}
function Plus() { return <svg aria-hidden="true" width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 10h12" /><path data-plus-vertical d="M10 4v12" /></svg>; }
