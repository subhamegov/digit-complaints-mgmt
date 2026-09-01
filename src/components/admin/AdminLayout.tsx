/**
 * Platform Administrator console layout.
 *
 * Provides the persistent left navigation, page chrome, and shared
 * blank-page / empty-state primitives used by every admin route.
 *
 * Components are RBAC-ready (each nav item can declare a `requires`
 * permission list) and localization-ready (labels resolved through
 * the i18n shim with safe fallbacks).
 */

import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import digitLogo from "@/assets/digit-logo.png.asset.json";
import {
  Home,
  Activity,
  Building2,
  Users,
  Server,
  ShieldCheck,
  Globe2,
  LayoutTemplate,
  GitBranch,
  FormInput,
  KeyRound,
  Gauge,
  Lock,
  Plug,
  Bell,
  Languages,
  CheckCircle2,
  MapPinned,
  Database,
  BookOpen,
  BarChart3,
  ScrollText,
  HelpCircle,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  Inbox,
  HeartPulse,
  LayoutDashboard,
  MapPin,
  ChevronDown,
} from "lucide-react";
import {
  useRbac,
  ROLE_LABEL,
  ASSIGNED_ROLE_MEMBERSHIPS,
  TENANTS,
  JURISDICTIONS,
  type Permission,
  type Role,
} from "@/lib/rbac";
import { ContextCombobox } from "@/components/pgr/ContextCombobox";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useAccountFeatures } from "@/lib/account-features";

/* ------------------------------------------------------------------ */
/* Navigation registry                                                */
/* ------------------------------------------------------------------ */

export type AdminNavItem = {
  to: string;
  labelCode: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  requires?: Permission[];
  /** Extra route prefixes that should mark this item active. */
  matches?: string[];
  /** Optional account capability flag gating visibility. */
  feature?: "projects_enabled";
};

export type AdminNavSection = {
  titleCode: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  items: AdminNavItem[];
};

/** Level 1 direct link (no children). */
export const ADMIN_NAV_HOME: AdminNavItem = {
  to: "/admin/home",
  labelCode: "ADMIN_NAV_HOME",
  label: "Home",
  icon: Home,
};

export const ADMIN_NAV: AdminNavSection[] = [
  {
    titleCode: "ADMIN_SECTION_PEOPLE",
    title: "People & Access",
    icon: Users,
    items: [
      { to: "/admin/users",             labelCode: "ADMIN_NAV_USERS",          label: "Users",               icon: Users },
      { to: "/admin/roles",             labelCode: "ADMIN_NAV_ROLES",          label: "Roles & Permissions", icon: ShieldCheck, matches: ["/admin/workflow-config/role-hierarchy"] },
      { to: "/admin/authentication",    labelCode: "ADMIN_NAV_AUTHENTICATION", label: "Authentication",      icon: KeyRound },
    ],
  },
  {
    titleCode: "ADMIN_SECTION_TEMPLATE_CONFIG",
    title: "Template Configuration",
    icon: LayoutTemplate,
    items: [
      { to: "/admin/dashboards",        labelCode: "ADMIN_NAV_DASHBOARDS",     label: "Dashboards",                icon: LayoutDashboard },
      { to: "/admin/templates",         labelCode: "ADMIN_NAV_TEMPLATES",      label: "Templates",                 icon: LayoutTemplate },
      { to: "/admin/complaints-config", labelCode: "ADMIN_NAV_COMPLAINTS",     label: "Complaints",                icon: Inbox },
      { to: "/admin/workflow-config",   labelCode: "ADMIN_NAV_WORKFLOW",       label: "Workflows",                 icon: GitBranch, matches: ["/admin/workflow-config/visualization"] },
      { to: "/admin/workflow-config/sla-maps", labelCode: "ADMIN_NAV_SLA",     label: "SLA & Escalation",          icon: Gauge },
      { to: "/admin/geographies",       labelCode: "ADMIN_NAV_GEOGRAPHIES",    label: "Geography",                 icon: MapPinned },
      { to: "/admin/projects",          labelCode: "ADMIN_NAV_PROJECTS",       label: "Projects",                  icon: FileText, feature: "projects_enabled" },
    ],
  },
  {
    titleCode: "ADMIN_SECTION_CHANNELS",
    title: "Communications",
    icon: Bell,
    items: [
      { to: "/admin/sources",           labelCode: "ADMIN_NAV_SOURCES",        label: "Sources",       icon: Globe2 },
      { to: "/admin/channels",          labelCode: "ADMIN_NAV_CHANNELS",       label: "Channels",      icon: Bell },
      { to: "/admin/communications",    labelCode: "ADMIN_NAV_NOTIFICATIONS",  label: "Notifications", icon: FormInput },
      { to: "/admin/integrations",      labelCode: "ADMIN_NAV_INTEGRATIONS",   label: "Integrations",  icon: Plug },
    ],
  },
  {
    titleCode: "ADMIN_SECTION_OPERATIONS",
    title: "Operations",
    icon: BarChart3,
    items: [
      { to: "/admin/knowledge-base",    labelCode: "ADMIN_NAV_KB",             label: "Knowledge Base", icon: BookOpen },
      { to: "/admin/localization",      labelCode: "ADMIN_NAV_LOCALISATION",   label: "Localisation",   icon: Languages },
      { to: "/operations/health",        labelCode: "ADMIN_NAV_HEALTH",         label: "Health",         icon: Activity, requires: ["SYSTEM_HEALTH_VIEW"] },
      { to: "/admin/audit-log",         labelCode: "ADMIN_NAV_AUDIT",          label: "Audit Log",      icon: ScrollText },
    ],
  },
  {
    titleCode: "ADMIN_SECTION_ACCOUNT",
    title: "Account",
    icon: Settings,
    items: [
      { to: "/admin/settings",          labelCode: "ADMIN_NAV_ACCOUNT_SETTINGS", label: "Account Settings",       icon: Settings },
      { to: "/admin/branding",          labelCode: "ADMIN_NAV_BRANDING",         label: "Branding",                icon: LayoutTemplate },
      { to: "/admin/data-export",       labelCode: "ADMIN_NAV_DATA_EXPORT",      label: "Data & Export",           icon: Database },
      { to: "/admin/data-export",       labelCode: "ADMIN_NAV_DATA_EXPORT",      label: "Data & Export",           icon: Database },
      { to: "/admin/advanced-settings", labelCode: "ADMIN_NAV_ADVANCED",         label: "Advanced Settings",       icon: Lock },
    ],
  },
];

/* Lookup helpers used by BlankAdminPage to derive a title from the route. */
export function findAdminNavItem(pathname: string): AdminNavItem | undefined {
  if (pathname === ADMIN_NAV_HOME.to) return ADMIN_NAV_HOME;
  for (const section of ADMIN_NAV) {
    for (const item of section.items) {
      if (item.to === pathname || isItemActive(item, pathname)) return item;
    }
  }
  return undefined;
}

function isItemActive(item: AdminNavItem, pathname: string): boolean {
  if (pathname === item.to) return true;
  if (item.matches?.some((m) => pathname === m || pathname.startsWith(m + "/"))) return true;
  // Nested index/detail routes (e.g. /admin/dashboards/xyz) keep the parent active,
  // except where a sibling nav item owns a deeper path.
  if (pathname.startsWith(item.to + "/")) {
    const owned = ADMIN_NAV.flatMap((s) => s.items).some(
      (other) =>
        other.to !== item.to &&
        other.to.startsWith(item.to + "/") &&
        (pathname === other.to || pathname.startsWith(other.to + "/")),
    );
    const claimed = ADMIN_NAV.flatMap((s) => s.items).some((other) =>
      other.matches?.some((m) => pathname === m || pathname.startsWith(m + "/")),
    );
    return !owned && !claimed;
  }
  return false;
}


/* ------------------------------------------------------------------ */
/* Sidebar primitives                                                 */
/* ------------------------------------------------------------------ */

export function SidebarItem({
  item,
  active,
  onNavigate,
  indented = false,
}: {
  item: AdminNavItem;
  active: boolean;
  onNavigate?: () => void;
  indented?: boolean;
}) {
  const Icon = item.icon;
  return (
    <Link
      to={item.to}
      onClick={onNavigate}
      className={cn(
        "group flex items-center gap-2.5 border-l-2 py-1.5 text-[13px] transition-colors",
        indented ? "pl-8 pr-2.5" : "px-2.5",
        active
          ? "border-transparent bg-[#2563EB] font-medium text-white [&_svg]:text-white"
          : "border-transparent text-[#CBD5E1] [&_svg]:text-[#94A3B8] hover:bg-[#2563EB]/[0.12] hover:text-white",
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="truncate">{t(item.labelCode, item.label)}</span>
    </Link>
  );
}

export function SidebarSection({
  section,
  pathname,
  expanded,
  onToggle,
  onNavigate,
}: {
  section: AdminNavSection;
  pathname: string;
  expanded: boolean;
  onToggle: () => void;
  onNavigate?: () => void;
}) {
  const { hasAnyPermission } = useRbac();
  const { projects_enabled } = useAccountFeatures();
  const items = section.items.filter(
    (i) => (!i.requires || hasAnyPermission(i.requires)) &&
      (!i.feature || (i.feature === "projects_enabled" && projects_enabled)),
  );
  if (items.length === 0) return null;
  const active = items.some((item) => isItemActive(item, pathname));
  return (
    <div className="mb-1">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className={cn(
          "group flex w-full items-center gap-2.5 border-l-2 px-2.5 py-2 text-left text-[13px] font-medium transition-colors",
          active
            ? "border-transparent bg-[#2563EB]/[0.16] text-white [&_svg]:text-white"
            : "border-transparent text-[#CBD5E1] hover:bg-[#2563EB]/[0.12] hover:text-white",
        )}
      >
        <section.icon className="h-4 w-4 shrink-0 text-[#94A3B8]" />
        <span className="min-w-0 flex-1 truncate">{t(section.titleCode, section.title)}</span>
        <ChevronDown className={cn("h-3.5 w-3.5 shrink-0 text-[#94A3B8] transition-transform", expanded && "rotate-180")} />
      </button>
      {expanded && (
        <div className="mt-0.5 space-y-0.5">
          {items.map((item) => (
            <SidebarItem
              key={item.to}
              item={item}
              active={isItemActive(item, pathname)}
              indented
              onNavigate={onNavigate}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function SidebarNavigation({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  const activeSection = ADMIN_NAV.findIndex((section) =>
    section.items.some((item) => isItemActive(item, pathname)),
  );
  const [expandedIndex, setExpandedIndex] = useState(activeSection >= 0 ? activeSection : 0);
  const visibleSections = ADMIN_NAV;

  useEffect(() => {
    if (activeSection >= 0) setExpandedIndex(activeSection);
  }, [activeSection]);

  return (
    <nav className="flex-1 overflow-y-auto px-2 py-3">
      <div className="mb-1">
        <SidebarItem item={ADMIN_NAV_HOME} active={isItemActive(ADMIN_NAV_HOME, pathname)} onNavigate={onNavigate} />
      </div>
      {visibleSections.map((section, index) => (
        <SidebarSection
          key={section.titleCode}
          section={section}
          pathname={pathname}
          expanded={expandedIndex === index}
          onToggle={() => setExpandedIndex(expandedIndex === index ? -1 : index)}
          onNavigate={onNavigate}
        />
      ))}
    </nav>
  );
}

function SidebarShell({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  const navigate = useNavigate();
  const { userName, role, setRole, tenant, setTenant, jurisdiction, setJurisdiction } = useRbac();
  const assignedRoles = ASSIGNED_ROLE_MEMBERSHIPS[role];
  const allLocalities = JURISDICTIONS.find((j) => j.code === "ALL") ?? JURISDICTIONS[0];
  const isAccountAdmin = role === "ACCOUNT_ADMIN";
  const displayedJurisdiction = isAccountAdmin ? allLocalities : jurisdiction;
  const jurisdictionOptions = isAccountAdmin ? [allLocalities] : JURISDICTIONS;

  const handleRoleChange = (value: string) => {
    const nextRole = assignedRoles.find((assignedRole) => assignedRole === value);
    if (!nextRole) return;
    setRole(nextRole);
    onNavigate?.();
    if (nextRole === "PLATFORM_ADMIN") {
      navigate({ to: "/platform" });
    } else if (nextRole === "ACCOUNT_ADMIN") {
      navigate({ to: "/admin/home" });
    } else {
      navigate({ to: "/dashboard" });
    }
  };

  return (
    <>
      <div className="flex h-14 shrink-0 items-center gap-2.5 border-b border-white/10 px-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-primary text-[15px] font-bold text-primary-foreground">
          P
        </div>
        <div className="min-w-0 leading-tight">
          <div className="truncate text-[12.5px] font-semibold">DIGIT Complaint Management</div>
          <div className="truncate text-[10.5px] text-[#93A4BC]">
            {t("ADMIN_CONSOLE", "Admin Console")}
          </div>
        </div>
      </div>
      <div className="space-y-2 border-b border-white/10 px-3 py-3">
        <div className="px-1 pb-0.5 text-[10px] font-medium uppercase tracking-wider text-[#93A4BC]">
          Working context
        </div>
        <ContextCombobox
          icon={Building2}
          label={t("COMMON_TENANT")}
          value={tenant.code}
          options={TENANTS.map((tn) => ({ value: tn.code, label: tn.name, hint: tn.code }))}
          onChange={(v) => {
            const nextTenant = TENANTS.find((tn) => tn.code === v);
            if (nextTenant) setTenant(nextTenant);
          }}
        />
        <ContextCombobox
          icon={MapPin}
          label={t("COMMON_JURISDICTION")}
          value={displayedJurisdiction.code}
          options={jurisdictionOptions.map((j) => ({ value: j.code, label: j.name, hint: j.code }))}
          disabled={isAccountAdmin}
          helperText="Account Administration applies across all localities. Locality selection is available in operational workspaces where applicable."
          onChange={(v) => {
            const nextJurisdiction = jurisdictionOptions.find((j) => j.code === v);
            if (nextJurisdiction) setJurisdiction(nextJurisdiction);
          }}
        />
        <ContextCombobox
          icon={ShieldCheck}
          label={t("COMMON_ROLE")}
          value={role}
          options={assignedRoles.map((assignedRole) => ({ value: assignedRole, label: ROLE_LABEL[assignedRole] }))}
          onChange={handleRoleChange}
        />
      </div>
      <SidebarNavigation pathname={pathname} onNavigate={onNavigate} />

      <div className="border-t border-white/10 px-3 py-2.5 text-[11px]">
        <div className="truncate font-medium text-chrome-foreground">{userName}</div>
        <div className="truncate text-chrome-muted">
          {ROLE_LABEL[role] ?? t("ROLE_PLATFORM_ADMIN", "Platform Administrator")}
        </div>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Layout                                                             */
/* ------------------------------------------------------------------ */

export function AdminLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <aside className="hidden lg:flex w-[232px] shrink-0 flex-col bg-[#0B1F3A] text-chrome-foreground">
        <SidebarShell pathname={pathname} />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 flex w-[260px] flex-col bg-[#0B1F3A] text-chrome-foreground shadow-xl">
            <SidebarShell pathname={pathname} onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopBar onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto">
          <div className="flex min-h-full flex-col">
            <div className="flex-1">
              <Outlet />
            </div>
            <AdminAttributionFooter />
          </div>
        </main>
      </div>
    </div>
  );
}

/** Persistent "Powered by DIGIT" attribution shown on every admin page. */
function AdminAttributionFooter() {
  return (
    <footer className="mt-6 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 border-t border-border px-4 py-4 text-[12px] text-muted-foreground">
      <span>Powered by</span>
      <img
        src={digitLogo.url}
        alt="DIGIT"
        className="h-[20px] w-auto max-w-full shrink-0"
        loading="lazy"
      />
    </footer>
  );
}

function AdminTopBar({ onMenuClick }: { onMenuClick: () => void }) {
  const { role } = useRbac();
  const headerTitle =
    role === "ACCOUNT_ADMIN" ? "Account Administration" : "Platform Administration";
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-surface px-3 lg:px-6">
      <button
        onClick={onMenuClick}
        className="lg:hidden flex h-8 w-8 items-center justify-center rounded-sm border border-border text-muted-foreground hover:bg-muted"
        aria-label={t("COMMON_OPEN_MENU", "Open menu")}
      >
        <Menu className="h-4 w-4" />
      </button>
      <div className="min-w-0 truncate text-[13px] font-medium text-foreground">
        {t("ADMIN_HEADER_TITLE", headerTitle)}
      </div>
      <Link
        to="/login"
        className="ml-auto flex h-8 items-center gap-1.5 rounded-sm border border-border bg-background px-2 text-[12px] font-medium text-foreground hover:bg-muted"
        aria-label={t("COMMON_SIGN_OUT", "Sign out")}
      >
        <LogOut className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">{t("COMMON_SIGN_OUT", "Sign out")}</span>
      </Link>
      <span className="hidden"><X /><Inbox /></span>
    </header>
  );
}

/* ------------------------------------------------------------------ */
/* Page primitives                                                    */
/* ------------------------------------------------------------------ */

export function AdminPageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border bg-surface px-4 pb-4 pt-3 lg:px-6">
      <div className="min-w-0">
        <h1 className="text-[24px] font-semibold leading-tight tracking-tight text-foreground">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 max-w-[700px] text-[13px] text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}

export function EmptyStateCard({
  title,
  body,
  icon: Icon = Inbox,
  action,
}: {
  title?: string;
  body?: string;
  icon?: React.ComponentType<{ className?: string }>;
  action?: ReactNode;
}) {
  return (
    <div className="rounded border border-dashed border-border bg-surface px-5 py-10 text-center">
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background text-muted-foreground">
        <Icon className="h-5 w-5" />
      </div>
      <h2 className="mt-3 text-[14px] font-semibold text-foreground">
        {title ?? t("ADMIN_EMPTY_TITLE", "No data yet")}
      </h2>
      <p className="mt-1 text-[12.5px] text-muted-foreground">
        {body ?? t("ADMIN_EMPTY_BODY", "Configuration for this section will appear here.")}
      </p>
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

/**
 * BlankAdminPage - uniform placeholder used by every navigation item
 * until its real surface is built. Title is derived from the active
 * nav item; subtitle is the standard ready-for-configuration line.
 */
export function BlankAdminPage({
  title,
  subtitle,
}: {
  title?: string;
  subtitle?: string;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const item = findAdminNavItem(pathname);
  const resolvedTitle = title ?? (item ? t(item.labelCode, item.label) : "");
  const resolvedSubtitle =
    subtitle ?? t("ADMIN_PAGE_READY", "This page is ready for configuration.");
  return (
    <div className="flex h-full flex-col">
      <AdminPageHeader title={resolvedTitle} subtitle={resolvedSubtitle} />
      <div className="flex-1 p-4 lg:p-6">
        <EmptyStateCard />
      </div>
    </div>
  );
}
