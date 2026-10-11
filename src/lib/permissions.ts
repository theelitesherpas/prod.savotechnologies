import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getAdminUser, type AdminSessionUser } from "@/lib/auth";

/**
 * Section-based access control for the admin panel.
 *
 * Roles:
 *   admin  - full access, bypasses permissions, manages panel users
 *   editor - access is exactly the sections granted in `permissions`
 *
 * Pages/data readers must authorize before queries; a layout cannot guard
 * independently executing RSC children. The layout's forwarded-path check
 * and navigation are additional defenses, not the data-access boundary.
 */

export type SectionKey =
  | "live-chat"
  | "enquiries"
  | "analytics"
  | "employees"
  | "clients"
  | "content"
  | "email-templates"
  | "settings"
  | "audit"
  | "bug-reports"
  | "hr-portal"
  | "emails";

export const SECTIONS: { key: SectionKey; label: string; hint: string }[] = [
  { key: "live-chat", label: "Live Chat", hint: "Real-time visitor chat inbox" },
  { key: "enquiries", label: "Enquiries", hint: "Lead inbox + detail" },
  { key: "analytics", label: "Analytics", hint: "Traffic, funnels, GA note" },
  { key: "employees", label: "Employee portal", hint: "Records, leaves, HR email (hr@)" },
  { key: "clients", label: "Client portal", hint: "Clients, projects, payments, client email (hello@)" },
  { key: "content", label: "Content", hint: "Services, industries, case studies, articles" },
  { key: "email-templates", label: "Email templates", hint: "Customise the template library" },
  { key: "settings", label: "Site settings", hint: "Contact overrides, announcements" },
  { key: "audit", label: "Audit log", hint: "Action history" },
  { key: "bug-reports", label: "Bug reports", hint: "Captured errors and user reports" },
  { key: "hr-portal", label: "HR portal", hint: "Shortlisted candidates, recruitment pipeline" },
  { key: "emails", label: "Emails", hint: "Inbound reply inbox" },
];

export type PermittedUser = {
  role: string;
  permissions?: unknown;
};

function permissionList(user: PermittedUser): string[] {
  const p = user.permissions;
  return Array.isArray(p) ? p.filter((x): x is string => typeof x === "string") : [];
}

export function canAccess(user: PermittedUser, section: string): boolean {
  if (user.role === "admin") return true;
  return user.role === "editor" && permissionList(user).includes(section);
}

/** Map an admin path to its section (null = unmapped or self-profile). */
export function pathToSection(path: string): SectionKey | "dashboard" | "users" | "compose" | null {
  const p = path.split(/[?#]/, 1)[0].replace(/\/+$/, "");
  if (p === "/admin" || p === "/admin/login") return "dashboard";
  const under = (segment: string) => p === `/admin/${segment}` || p.startsWith(`/admin/${segment}/`);
  if (under("content-inventory")) return "audit";
  if (under("live-chat")) return "live-chat";
  if (under("enquiries")) return "enquiries";
  if (under("analytics")) return "analytics";
  if (under("employees")) return "employees";
  if (["clients", "projects", "invoices", "meetings"].some(under)) return "clients";
  if (["services", "industries", "case-studies", "content"].some(under)) return "content";
  if (under("email-templates")) return "email-templates";
  if (under("email-compose")) return "compose";
  if (under("settings")) return "settings";
  if (under("users")) return "users";
  if (under("audit") || under("proof")) return "audit";
  if (under("bug-reports")) return "bug-reports";
  if (under("hr-portal")) return "hr-portal";
  if (under("emails")) return "emails";
  return null;
}

/**
 * Central guard - call from the admin layout with the forwarded path.
 * Redirects unauthorized access to the dashboard with a notice.
 */
export async function enforcePathAccess(path: string): Promise<void> {
  const user = await getAdminUser();
  if (!user || !path) return;
  assertPathAccess(user, path);
}

/** Fixed page-owned path, never the client/forwarded request pathname. */
export async function requireAdminPage(path: string): Promise<AdminSessionUser> {
  const user = await getAdminUser();
  if (!user || !["admin", "editor"].includes(user.role)) redirect("/admin/login");
  if (pathToSection(path) === null && path !== "/admin/my-profile") {
    redirect("/admin?denied=Unmapped%20section");
  }
  assertPathAccess(user, path);
  return user;
}

function assertPathAccess(user: AdminSessionUser, path: string): void {
  const section = pathToSection(path);
  if (section === null || section === "dashboard") return;
  if (section === "users" && user.role !== "admin") {
    redirect("/admin?denied=Panel%20users");
  }
  // Compose is special: allowed dept scope depends on portal grants.
  if (section === "compose") {
    const dept = new URL(path, "https://x").searchParams.get("dept");
    if (user.role === "admin") return;
    const has = permissionList(user);
    if (dept === "hr" && has.includes("employees")) return;
    if (dept === "hello" && has.includes("clients")) return;
    if (!dept && has.includes("employees") && has.includes("clients")) return;
    redirect("/admin?denied=Email%20compose");
  }
  const sectionKeys: string[] = SECTIONS.map((sec) => sec.key);
  if (section !== "users" && sectionKeys.includes(section) && !canAccess(user, section)) {
    const label = SECTIONS.find((sec) => sec.key === section)?.label ?? section;
    redirect(`/admin?denied=${encodeURIComponent(label)}`);
  }
}

/** Read the forwarded path (set by middleware) for the current request. */
export async function currentAdminPath(): Promise<string> {
  const h = await headers();
  return h.get("x-pathname") ?? "";
}

/**
 * Action-level section guard - defense in depth for server actions.
 *
 * The admin layout blocks editors from restricted PAGES, but a server
 * action is its own POST endpoint; this guard makes the same section
 * check inside the action so an editor can never invoke a restricted
 * mutation directly, regardless of how the request was crafted.
 * Redirects (works in actions) with the same denial notice as the layout.
 */
export async function requireSection(section: SectionKey): Promise<void> {
  const user = await getAdminUser();
  if (!user) redirect("/admin/login");
  if (canAccess(user, section)) return;
  const label = SECTIONS.find((sec) => sec.key === section)?.label ?? section;
  redirect(`/admin?denied=${encodeURIComponent(label)}`);
}

/** Which compose scopes this user may open. */
export function allowedComposeDepts(user: PermittedUser): ("hr" | "hello")[] {
  if (user.role === "admin") return ["hr", "hello"];
  if (user.role !== "editor") return [];
  const has = permissionList(user);
  const out: ("hr" | "hello")[] = [];
  if (has.includes("employees")) out.push("hr");
  if (has.includes("clients")) out.push("hello");
  return out;
}

/** Validate + normalize a permissions payload from a form. */
export function sanitizePermissions(input: unknown): string[] {
  const valid = new Set<string>(SECTIONS.map((s) => s.key));
  if (!Array.isArray(input)) return [];
  return [...new Set(input.filter((x): x is string => typeof x === "string" && valid.has(x)))];
}
