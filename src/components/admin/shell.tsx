"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AdminIcon, type AdminIconName } from "./icons";
import { logoutAction } from "@/app/admin/(protected)/actions";
import { SearchPalette } from "./search-palette";
import { cn } from "@/lib/utils";

/**
 * Operations Console shell - NextAdmin-style operations chrome: light
 * sidebar with icon tiles and grouped expandable submenus (collapses to
 * an icon rail on desktop, drawer on mobile), top bar with breadcrumb,
 * new-enquiry bell and account card.
 */

export type AdminNavItem = {
  href: string;
  label: string;
  icon: AdminIconName;
  /** Item count rendered in a neutral chip at the row end. */
  count?: number;
  /** Attention count (e.g. new enquiries) rendered as an accent chip. */
  badge?: number;
};

export type AdminNavNode = {
  key: string;
  label: string;
  icon: AdminIconName;
  /** Leaf destination when the node is a direct link. */
  href?: string;
  badge?: number;
  /** Green pulsing dot - renders after the label (e.g. Live Chat is online). */
  online?: boolean;
  /** Submenu items - the node becomes an expandable group. */
  items?: AdminNavItem[];
};

export type AdminUserChip = { name: string; email: string; role: "admin" | "editor" };

/** The Savo "S" mark from the official wordmark, used as the account
 *  avatar in place of initials (owner preference: brand mark, like the
 *  public site's favicon). Fills with currentColor. */
function SavoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="160 326 130 200" aria-hidden="true" className={className} fill="currentColor">
      <path d="M189.22 510.839C176.656 500.762 167.643 487.145 163.819 471.622L163 468.627L172.559 464.814C176.11 463.18 180.207 462.635 184.031 462.635C193.863 462.635 202.876 467.265 208.885 475.163C209.977 476.524 211.07 477.614 212.162 478.703C217.352 483.605 224.18 486.328 231.554 486.328C237.563 486.601 243.299 484.694 248.215 481.426C252.312 478.431 254.77 473.529 254.497 468.627C254.77 463.452 252.312 458.278 248.488 454.737C240.84 449.018 232.374 444.661 223.36 441.665L212.709 437.58C201.511 433.495 191.405 426.959 182.938 418.245C174.471 409.257 169.828 397.275 170.101 384.747C169.828 365.139 181.026 346.893 198.779 338.178C208.066 333.276 218.717 331.097 229.096 331.097C243.025 330.28 256.955 334.638 268.153 343.352C277.166 350.705 283.994 360.509 287.818 371.403L288.91 374.398L277.712 379.301C273.889 380.935 269.792 381.752 265.695 381.752C258.047 381.752 250.4 379.028 244.664 373.854C240.567 370.586 235.105 368.679 229.916 368.952C224.453 368.679 218.991 370.313 214.621 373.309C211.07 375.76 209.158 379.573 209.158 383.93C209.158 388.288 211.07 392.373 214.621 395.096C220.629 399.726 227.731 402.994 234.832 405.445L245.484 409.257C259.14 413.615 271.157 421.24 281.263 431.317C290.003 441.393 294.646 454.465 294.1 467.81C294.373 478.975 291.095 490.141 284.814 499.4C278.805 507.843 270.611 514.651 261.052 518.736C251.765 522.821 241.66 525 231.554 525C215.986 525 201.237 520.098 189.22 510.839Z" />
    </svg>
  );
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}

function isActive(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function CountChip({ count }: { count: number }) {
  return (
    <span className="tnum shrink-0 rounded-full bg-foreground/[0.06] px-2 py-0.5 text-[0.6875rem] font-semibold text-muted">
      {count}
    </span>
  );
}

function BadgeChip({ count }: { count: number }) {
  return (
    <span className="tnum shrink-0 rounded-full bg-accent px-2 py-0.5 text-[0.6875rem] font-bold leading-[1.4] text-on-accent">
      {count}
    </span>
  );
}

function IconTile({
  icon,
  active,
  collapsed,
}: {
  icon: AdminIconName;
  active?: boolean;
  collapsed?: boolean;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors duration-200",
        active ? "bg-accent/10 text-accent" : "bg-foreground/[0.04] text-muted group-hover:text-foreground",
        collapsed && "mx-auto",
      )}
    >
      <AdminIcon name={icon} className="h-[17px] w-[17px]" />
    </span>
  );
}

function SidebarLink({
  href,
  label,
  icon,
  count,
  badge,
  online,
  active,
  onNavigate,
  collapsed,
  child,
}: {
  href: string;
  label: string;
  icon: AdminIconName;
  count?: number;
  badge?: number;
  online?: boolean;
  active: boolean;
  onNavigate?: () => void;
  collapsed?: boolean;
  child?: boolean;
}) {
  if (collapsed) {
    return (
      <Link
        href={href}
        onClick={onNavigate}
        title={label}
        aria-label={label}
        aria-current={active ? "page" : undefined}
        className={cn(
          "group relative flex h-11 items-center justify-center rounded-lg transition-colors duration-200",
          active ? "bg-accent/10 text-accent" : "text-muted hover:bg-foreground/[0.05] hover:text-foreground",
        )}
      >
        <IconTile icon={icon} active={active} collapsed />
        {typeof badge === "number" && badge > 0 ? (
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-accent" />
        ) : null}
      </Link>
    );
  }
  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group flex h-11 items-center gap-3 rounded-lg pr-3 transition-colors duration-200",
        child ? "pl-4" : "pl-2",
        active
          ? "bg-accent/10 text-accent"
          : "text-foreground/70 hover:bg-foreground/[0.05] hover:text-foreground",
      )}
    >
      {child ? (
        <span
          aria-hidden="true"
          className={cn(
            "h-1.5 w-1.5 shrink-0 rounded-full transition-colors",
            active ? "bg-accent" : "bg-foreground/25 group-hover:bg-foreground/50",
          )}
        />
      ) : (
        <IconTile icon={icon} active={active} />
      )}
      <span className={cn("min-w-0 flex-1 truncate text-[0.875rem]", active ? "font-semibold" : "font-medium")}>
        {label}
      </span>
      {online ? (
        <span className="mr-0.5 flex h-2 w-2 shrink-0 items-center justify-center" title="Online" aria-label="Live chat is online">
          <span className="absolute h-2 w-2 animate-ping rounded-full bg-emerald-400/60" />
          <span className="relative h-1.5 w-1.5 rounded-full bg-emerald-500" />
        </span>
      ) : null}
      {typeof badge === "number" && badge > 0 ? (
        <BadgeChip count={badge} />
      ) : typeof count === "number" && count > 0 ? (
        <CountChip count={count} />
      ) : null}
    </Link>
  );
}

function NavNode({
  node,
  pathname,
  open,
  onToggle,
  onNavigate,
  collapsed,
}: {
  node: AdminNavNode;
  pathname: string;
  open: boolean;
  onToggle: (key: string) => void;
  onNavigate: () => void;
  collapsed: boolean;
}) {
  const childActive = node.items?.some((it) => isActive(pathname, it.href)) ?? false;

  if (!node.items) {
    return (
      <SidebarLink
        href={node.href ?? "/admin"}
        label={node.label}
        icon={node.icon}
        badge={node.badge}
        online={node.online}
        active={isActive(pathname, node.href ?? "/admin")}
        onNavigate={onNavigate}
        collapsed={collapsed}
      />
    );
  }

  if (collapsed) {
    // Rail mode: the group icon expands the sidebar at this group.
    return (
      <button
        type="button"
        title={node.label}
        aria-label={`${node.label} - expand menu`}
        onClick={() => onToggle(node.key)}
        className={cn(
          "group flex h-11 w-full items-center justify-center rounded-lg transition-colors duration-200",
          childActive ? "bg-accent/10 text-accent" : "text-muted hover:bg-foreground/[0.05] hover:text-foreground",
        )}
      >
        <IconTile icon={node.icon} active={childActive} collapsed />
        {typeof node.badge === "number" && node.badge > 0 ? (
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-accent" />
        ) : null}
      </button>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => onToggle(node.key)}
        aria-expanded={open}
        className={cn(
          "group mb-0.5 flex h-8 w-full items-center gap-2 rounded-md px-2.5 transition-colors duration-200",
          childActive ? "text-accent" : "text-muted hover:bg-foreground/[0.05] hover:text-foreground",
        )}
      >
        <span className="min-w-0 flex-1 truncate text-left text-[0.6875rem] font-bold uppercase tracking-[0.08em]">
          {node.label}
        </span>
        {typeof node.badge === "number" && node.badge > 0 ? <BadgeChip count={node.badge} /> : null}
        <AdminIcon
          name="chevron"
          className={cn(
            "h-3 w-3 shrink-0 transition-transform duration-300 ease-[var(--ease-out-expo)]",
            open && "rotate-180",
          )}
        />
      </button>
      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-300 ease-[var(--ease-out-expo)]",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <ul className="overflow-hidden">
          <li className="ml-6 mt-0.5 border-l border-border">
            {node.items.map((it) => (
              <div key={it.href} className="p-0.5">
                <SidebarLink
                  {...it}
                  active={isActive(pathname, it.href)}
                  onNavigate={onNavigate}
                  child
                />
              </div>
            ))}
          </li>
        </ul>
      </div>
    </>
  );
}

function Brand({ collapsed }: { collapsed?: boolean }) {
  return (
    <Link
      href="/admin"
      className={cn("flex items-center gap-3 px-4 py-4", collapsed && "justify-center px-2")}
      title="SAVO Admin"
    >
      <span
        aria-hidden="true"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent font-sans text-[0.9375rem] font-extrabold text-on-accent"
      >
        S
      </span>
      {collapsed ? null : (
        <span className="flex min-w-0 flex-col">
          <span className="text-[0.9375rem] font-bold leading-tight tracking-[-0.01em] text-foreground">
            SAVO Admin
          </span>
          <span className="truncate text-[0.75rem] text-muted">Operations console</span>
        </span>
      )}
    </Link>
  );
}

function SidebarBody({
  nav,
  pathname,
  openGroups,
  onToggle,
  onNavigate,
  collapsed,
}: {
  nav: AdminNavNode[];
  pathname: string;
  openGroups: Set<string>;
  onToggle: (key: string) => void;
  onNavigate: () => void;
  collapsed: boolean;
}) {
  return (
    <nav aria-label="Admin sections" className="adm-rail flex-1 overflow-y-auto px-3 py-4">
      <ul className="space-y-1">
        {nav.map((node) => (
          <li key={node.key} className="list-none">
            <NavNode
              node={node}
              pathname={pathname}
              open={openGroups.has(node.key)}
              onToggle={onToggle}
              onNavigate={onNavigate}
              collapsed={collapsed}
            />
          </li>
        ))}
      </ul>
    </nav>
  );
}

function AccountCard({ user, collapsed }: { user: AdminUserChip; collapsed?: boolean }) {
  if (collapsed) {
    return (
      <div className="border-t border-border p-3" title={`${user.name} · ${user.role}`}>
        <form action={logoutAction}>
          <button
            type="submit"
            aria-label="Sign out"
            title="Sign out"
            className="flex h-10 w-full items-center justify-center rounded-lg bg-foreground/[0.04] text-muted transition-colors hover:bg-accent/10 hover:text-accent"
          >
            <AdminIcon name="external" className="h-4 w-4" />
          </button>
        </form>
      </div>
    );
  }
  return (
    <div className="border-t border-border p-3">
      <div className="flex items-center gap-3 rounded-lg px-2 py-1.5">
        <span
          aria-hidden="true"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent"
        >
          <SavoMark className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[0.8125rem] font-semibold leading-tight text-foreground">
            {user.name}
          </span>
          <span className="block truncate text-[0.6875rem] capitalize text-muted">{user.role}</span>
        </span>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <Link
          href="/"
          target="_blank"
          rel="noopener"
          className="flex h-9 flex-1 items-center justify-center gap-2 rounded-lg border border-border text-[0.75rem] font-semibold text-muted transition-colors hover:border-foreground/25 hover:text-foreground"
        >
          View site
          <AdminIcon name="external" className="h-3 w-3" />
        </Link>
        <form action={logoutAction} className="flex">
          <button
            type="submit"
            className="flex h-9 items-center justify-center gap-2 rounded-lg border border-border px-3 text-[0.75rem] font-semibold text-muted transition-colors hover:border-accent/50 hover:text-accent"
          >
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}

export function AdminShell({
  user,
  nav,
  crumbLabels,
  children,
}: {
  user: AdminUserChip;
  nav: AdminNavNode[];
  /** segment → label map for the top-bar breadcrumb. */
  crumbLabels: Record<string, string>;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [dark, setDark] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Set<string>>(
    () => new Set(nav.filter((n) => n.items).map((n) => n.key)),
  );

  // Restore the rail-collapse + theme preferences after first paint
  // (deferred so hydration matches the server render, then they settle).
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      if (window.localStorage.getItem("adm-rail") === "1") setCollapsed(true);
      if (window.localStorage.getItem("adm-theme") === "dark") setDark(true);
    });
    return () => cancelAnimationFrame(id);
  }, []);
  const toggleDark = () =>
    setDark((d) => {
      window.localStorage.setItem("adm-theme", d ? "light" : "dark");
      return !d;
    });

  // ⌘K / Ctrl+K toggles the global search palette.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  const toggleCollapsed = () =>
    setCollapsed((c) => {
      window.localStorage.setItem("adm-rail", c ? "0" : "1");
      return !c;
    });

  // Esc closes the mobile drawer.
  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDrawerOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawerOpen]);

  const toggleGroup = (key: string) => {
    // Expanding from the rail also un-collapses the sidebar.
    if (collapsed) setCollapsed(false);
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const newCount =
    nav.find((n) => n.key === "leads")?.badge ?? nav.find((n) => n.key === "leads")?.items?.[0]?.badge ?? 0;

  const crumbs = (() => {
    const segs = pathname.replace(/^\/admin\/?/, "").split("/").filter(Boolean);
    const out: { href: string; label: string }[] = [{ href: "/admin", label: "Home" }];
    let acc = "/admin";
    for (const seg of segs) {
      acc = `${acc}/${seg}`;
      const known = crumbLabels[seg];
      if (known) out.push({ href: acc, label: known });
      else if (/^[a-zA-Z0-9]{20,}$/.test(seg)) out.push({ href: acc, label: "Detail" });
      else out.push({ href: acc, label: seg.charAt(0).toUpperCase() + seg.slice(1) });
    }
    return out;
  })();

  return (
    <div
      className={`${dark ? "chapter-admin-dark" : "chapter-admin"} min-h-dvh bg-background`}
      style={{ "--rail-w": collapsed ? "76px" : "272px" } as React.CSSProperties}
    >
      {/* ── Spine (desktop) ─────────────────────────────── */}
      <aside
        className="fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-border bg-surface lg:flex"
        style={{ width: "var(--rail-w)", transition: "width 0.3s cubic-bezier(0.16,1,0.3,1)" }}
      >
        <Brand collapsed={collapsed} />
        <SidebarBody
          nav={nav}
          pathname={pathname}
          openGroups={openGroups}
          onToggle={toggleGroup}
          onNavigate={() => undefined}
          collapsed={collapsed}
        />
        <AccountCard user={user} collapsed={collapsed} />
      </aside>

      {/* ── Canvas ──────────────────────────────────────── */}
      <div className="flex min-h-dvh min-w-0 flex-col transition-[padding] duration-300 ease-[var(--ease-out-expo)] lg:pl-[var(--rail-w)]">
        <TopBar
          crumbs={crumbs}
          newCount={newCount}
          user={user}
          dark={dark}
          onToggleDark={toggleDark}
          onOpenSearch={() => setSearchOpen(true)}
          onToggleRail={toggleCollapsed}
          onOpenDrawer={() => setDrawerOpen(true)}
        />
        <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
        <footer className="border-t border-border px-4 py-4 sm:px-6 lg:px-8">
          <p className="text-[0.75rem] text-muted">
            Savo Technologies · Operations console · signed in as {user.email}
          </p>
        </footer>
      </div>

      <SearchPalette open={searchOpen} onOpenChange={setSearchOpen} />

      {/* ── Spine (mobile drawer) ──────────────────────────── */}
      {drawerOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Admin navigation">
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 h-full w-full cursor-default bg-foreground/40 backdrop-blur-sm"
          />
          <aside className="absolute inset-y-0 left-0 flex w-[288px] max-w-[86vw] flex-col border-r border-border bg-surface shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pr-3">
              <Brand />
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close navigation"
                className="rounded-lg p-2 text-muted transition-colors hover:bg-foreground/[0.06] hover:text-foreground"
              >
                <AdminIcon name="close" className="h-4 w-4" />
              </button>
            </div>
            <SidebarBody
              nav={nav}
              pathname={pathname}
              openGroups={openGroups}
              onToggle={toggleGroup}
              onNavigate={() => setDrawerOpen(false)}
              collapsed={false}
            />
            <AccountCard user={user} />
          </aside>
        </div>
      ) : null}
    </div>
  );
}

function ProfileMenu({ user }: { user: AdminUserChip }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      {open ? (
        <button
          type="button"
          aria-label="Close account menu"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 cursor-default"
        />
      ) : null}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="Account menu"
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-full transition-colors",
          open ? "bg-accent text-on-accent" : "bg-accent/10 text-accent hover:bg-accent/20",
        )}
      >
        <SavoMark className="h-5 w-5" />
      </button>
      {open ? (
        <div className="absolute right-0 top-11 z-50 w-60 overflow-hidden rounded-xl border border-border bg-surface shadow-xl">
          <div className="border-b border-border px-4 py-3">
            <p className="truncate text-[0.875rem] font-semibold text-foreground">{user.name}</p>
            <p className="truncate text-[0.75rem] text-muted">{user.email}</p>
            <p className="mt-1.5 inline-flex rounded-full bg-foreground/[0.06] px-2 py-0.5 text-[0.625rem] font-bold uppercase tracking-[0.06em] text-muted">
              {user.role}
            </p>
          </div>
          <div className="p-1.5">
            {user.role === "admin" ? (
              <Link
                href="/admin/users"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[0.8125rem] font-medium text-foreground/80 transition-colors hover:bg-foreground/[0.05] hover:text-foreground"
              >
                <AdminIcon name="userCog" className="h-4 w-4" />
                Panel users
              </Link>
            ) : null}
            <Link
              href="/admin/audit"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[0.8125rem] font-medium text-foreground/80 transition-colors hover:bg-foreground/[0.05] hover:text-foreground"
            >
              <AdminIcon name="trail" className="h-4 w-4" />
              Audit log
            </Link>
            <form action={logoutAction}>
              <button
                type="submit"
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[0.8125rem] font-medium text-error transition-colors hover:bg-error/10"
              >
                <AdminIcon name="external" className="h-4 w-4" />
                Sign out
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function TopBar({
  crumbs,
  newCount,
  user,
  dark,
  onToggleDark,
  onOpenSearch,
  onToggleRail,
  onOpenDrawer,
}: {
  crumbs: { href: string; label: string }[];
  newCount: number;
  user: AdminUserChip;
  dark: boolean;
  onToggleDark: () => void;
  onOpenSearch: () => void;
  onToggleRail?: () => void;
  onOpenDrawer: () => void;
}) {
  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-border bg-surface px-4 sm:px-6 lg:px-8">
      <button
        type="button"
        onClick={onOpenDrawer}
        aria-label="Open navigation"
        className="flex h-9 w-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-foreground/[0.06] hover:text-foreground lg:hidden"
      >
        <AdminIcon name="menu" className="h-[18px] w-[18px]" />
      </button>
      {onToggleRail ? (
        <button
          type="button"
          onClick={onToggleRail}
          aria-label="Toggle sidebar"
          title="Toggle sidebar"
          className="hidden h-9 w-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-foreground/[0.06] hover:text-foreground lg:flex"
        >
          <AdminIcon name="menu" className="h-[18px] w-[18px]" />
        </button>
      ) : null}
      <nav aria-label="Breadcrumb" className="min-w-0 flex-1">
        <ol className="flex items-center gap-1.5 text-[0.8125rem] text-muted">
          {crumbs.map((c, i) => (
            <li key={c.href} className="flex min-w-0 items-center gap-1.5">
              {i > 0 ? <span aria-hidden="true" className="text-border">/</span> : null}
              {i === crumbs.length - 1 ? (
                <span aria-current="page" className="truncate font-semibold text-foreground">
                  {c.label}
                </span>
              ) : (
                <Link href={c.href} className="truncate transition-colors hover:text-foreground">
                  {c.label}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>
      <button
        type="button"
        onClick={onOpenSearch}
        aria-label="Search (Command K)"
        className="hidden h-9 items-center gap-2.5 rounded-lg border border-border px-3 text-[0.8125rem] text-muted transition-colors hover:border-foreground/25 hover:text-foreground md:flex"
      >
        <AdminIcon name="search" className="h-4 w-4" />
        <span className="pr-6">Search…</span>
        <kbd className="rounded-md border border-border px-1.5 py-0.5 font-mono text-[0.625rem]">⌘K</kbd>
      </button>
      <button
        type="button"
        onClick={onOpenSearch}
        aria-label="Search"
        className="flex h-9 w-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-foreground/[0.06] hover:text-foreground md:hidden"
      >
        <AdminIcon name="search" className="h-[18px] w-[18px]" />
      </button>
      <Link
        href="/admin/enquiries?status=new"
        aria-label={newCount > 0 ? `${newCount} new enquiries` : "Enquiries"}
        title="New enquiries"
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-foreground/[0.06] hover:text-foreground"
      >
        <AdminIcon name="inbox" className="h-[18px] w-[18px]" />
        {newCount > 0 ? (
          <span className="tnum absolute -right-0.5 -top-0.5 rounded-full bg-accent px-1.5 py-px text-[0.625rem] font-bold leading-[1.3] text-on-accent">
            {newCount > 9 ? "9+" : newCount}
          </span>
        ) : null}
      </Link>
      <button
        type="button"
        onClick={onToggleDark}
        aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
        title={dark ? "Light theme" : "Dark theme"}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-foreground/[0.06] hover:text-foreground"
      >
        <AdminIcon name={dark ? "sun" : "moon"} className="h-[18px] w-[18px]" />
      </button>
      <Link
        href="/"
        target="_blank"
        rel="noopener"
        className="hidden items-center gap-2 rounded-lg border border-border px-3 py-2 text-[0.75rem] font-semibold text-muted transition-colors hover:border-foreground/25 hover:text-foreground sm:flex"
      >
        View site
        <AdminIcon name="external" className="h-3 w-3" />
      </Link>
      <ProfileMenu user={user} />
    </header>
  );
}
