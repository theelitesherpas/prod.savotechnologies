import Link from "next/link";
import { PORTALS, RECORD_MODULES, recordPath, visiblePortalLinks, type PortalKey } from "@/lib/admin-portals";
import { canAccess, type PermittedUser } from "@/lib/permissions";
import { AdminIcon } from "./icons";

export function PortalDirectory({ portal, user, expanded = false }: { portal: PortalKey; user: PermittedUser; expanded?: boolean }) {
  const links = visiblePortalLinks(portal, user);
  return <details className="adm-card mb-7" open={expanded}>
    <summary className="cursor-pointer px-5 py-4 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-accent">Manage {PORTALS[portal].label} · {links.length} sections</summary>
    <ul className="grid gap-x-6 border-t border-border px-5 py-2 sm:grid-cols-2">
      {links.map(link => <li key={link.href} className="border-b border-border last:border-0"><Link href={link.href} className="flex min-h-12 items-center gap-3 py-3 text-sm font-medium hover:text-accent"><AdminIcon name={link.icon} className="h-4 w-4 shrink-0 text-muted" /><span>{link.label}</span><AdminIcon name="chevron" className="ml-auto h-3 w-3 shrink-0 -rotate-90 text-muted" /></Link></li>)}
    </ul>
  </details>;
}

export function SubjectRegisters({ portal, user, subjectId }: { portal: PortalKey; user: PermittedUser; subjectId: string }) {
  if (!canAccess(user, PORTALS[portal].section)) return null;
  return <details className="adm-card mb-6"><summary className="cursor-pointer px-5 py-4 text-sm font-semibold">Related {PORTALS[portal].label} records</summary><ul className="flex flex-wrap gap-2 border-t border-border p-4">{RECORD_MODULES.filter(m => m.portal === portal).map(m => <li key={m.key}><Link className="adm-btn-ghost" href={`${recordPath(portal, m.key)}?subject=${encodeURIComponent(subjectId)}`}>{m.label}</Link></li>)}</ul></details>;
}

export function PortalLaunchpad({ user }: { user: PermittedUser }) {
  return <section aria-label="Department portals" className="adm-card mb-7 divide-y divide-border">
    {(["hr", "client", "employee"] as const).map(portal => {
      const links = visiblePortalLinks(portal, user);
      if (!links.length) return null;
      const root = links.find(l => l.href === PORTALS[portal].href)?.href ?? links[0].href;
      return <Link key={portal} href={root} className="flex min-h-20 items-center gap-4 px-5 py-4 transition-colors hover:bg-foreground/[0.03]"><AdminIcon name={PORTALS[portal].icon} className="h-5 w-5 shrink-0 text-muted" /><span className="min-w-0 flex-1"><span className="block font-semibold">{PORTALS[portal].label}</span><span className="mt-1 block text-sm text-muted">{PORTALS[portal].description}</span></span><span className="text-xs text-muted">Open</span></Link>;
    })}
  </section>;
}
