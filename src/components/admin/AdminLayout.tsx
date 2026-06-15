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

import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import {
  Home,
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
  Activity,
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
} from "lucide-react";
import { useRbac, type Permission } from "@/lib/rbac";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Navigation registry                                                */
/* ------------------------------------------------------------------ */

export type AdminNavItem = {
  to: string;
  labelCode: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  requires?: Permission[];
};

export type AdminNavSection = {
  titleCode: string;
  title: string;
  items: AdminNavItem[];
};

export const ADMIN_NAV: AdminNavSection[] = [
  {
    titleCode: "ADMIN_SECTION_CONSOLE",
    title: "Console",
    items: [
      { to: "/admin/home",               labelCode: "ADMIN_NAV_HOME",                label: "Home",                    icon: Home },
      { to: "/admin/dashboards",         labelCode: "ADMIN_NAV_DASHBOARDS",          label: "Dashboards",              icon: LayoutDashboard },
      { to: "/admin/dashboards/live",    labelCode: "ADMIN_NAV_DASHBOARDS_LIVE",     label: "  └  Live Dashboard",     icon: Activity },
      { to: "/admin/users",              labelCode: "ADMIN_NAV_USERS",               label: "Users",                   icon: Users },
      { to: "/admin/roles",              labelCode: "ADMIN_NAV_ROLES",               label: "Roles & Permissions",     icon: ShieldCheck },
      { to: "/admin/complaints-config",  labelCode: "ADMIN_NAV_COMPLAINTS",          label: "Complaints",              icon: Inbox },
      { to: "/admin/workflow-config",                labelCode: "ADMIN_NAV_WORKFLOW",           label: "Workflow Configuration",       icon: GitBranch },
      { to: "/admin/workflow-config/visualization",  labelCode: "ADMIN_NAV_WORKFLOW_VIS",       label: "  └  Workflow Visualization",  icon: GitBranch },
      { to: "/admin/workflow-config/sla-maps",       labelCode: "ADMIN_NAV_WORKFLOW_SLA",       label: "  └  SLA Maps",                icon: Gauge },
      { to: "/admin/workflow-config/role-hierarchy", labelCode: "ADMIN_NAV_WORKFLOW_HIERARCHY", label: "  └  Role Hierarchy",          icon: ShieldCheck },
    ],
  },
  {
    titleCode: "ADMIN_SECTION_CHANNELS",
    title: "Channels & Communications",
    items: [
      { to: "/admin/sources",            labelCode: "ADMIN_NAV_SOURCES",             label: "Sources",                 icon: Globe2 },
      { to: "/admin/channels",           labelCode: "ADMIN_NAV_CHANNELS",            label: "Channels",                icon: Bell },
      { to: "/admin/communications",     labelCode: "ADMIN_NAV_COMMUNICATIONS",      label: "Communications",          icon: FormInput },
      { to: "/admin/integrations",       labelCode: "ADMIN_NAV_INTEGRATIONS",        label: "Integrations",            icon: Plug },
    ],
  },
  {
    titleCode: "ADMIN_SECTION_OPERATIONS",
    title: "Operations",
    items: [
      { to: "/admin/knowledge-base",     labelCode: "ADMIN_NAV_KB",                  label: "Knowledge Base",          icon: BookOpen },
      { to: "/admin/monitoring",         labelCode: "ADMIN_NAV_MONITORING",          label: "Monitoring & Analytics",  icon: BarChart3 },
      { to: "/admin/audit-log",          labelCode: "ADMIN_NAV_AUDIT",               label: "Audit",                   icon: ScrollText },
      { to: "/admin/settings",           labelCode: "ADMIN_NAV_SETTINGS",            label: "Settings",                icon: Settings },
    ],
  },
];

/* Lookup helpers used by BlankAdminPage to derive a title from the route. */
export function findAdminNavItem(pathname: string): AdminNavItem | undefined {
  for (const section of ADMIN_NAV) {
    for (const item of section.items) {
      if (item.to === pathname) return item;
    }
  }
  return undefined;
}

/* ------------------------------------------------------------------ */
/* Sidebar primitives                                                 */
/* ------------------------------------------------------------------ */

export function SidebarItem({
  item,
  active,
  onNavigate,
}: {
  item: AdminNavItem;
  active: boolean;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;
  return (
    <Link
      to={item.to}
      onClick={onNavigate}
      className={cn(
        "group flex items-center gap-2.5 border-l-2 px-2.5 py-1.5 text-[13px] transition-colors",
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
  onNavigate,
}: {
  section: AdminNavSection;
  pathname: string;
  onNavigate?: () => void;
}) {
  const { hasAnyPermission } = useRbac();
  const items = section.items.filter(
    (i) => !i.requires || hasAnyPermission(i.requires),
  );
  if (items.length === 0) return null;
  return (
    <div className="mb-3">
      <div className="px-2.5 pb-1.5 text-[10px] font-medium uppercase tracking-wider text-[#93A4BC]">
        {t(section.titleCode, section.title)}
      </div>
      <div className="space-y-0.5">
        {items.map((item) => (
          <SidebarItem
            key={item.to}
            item={item}
            active={pathname === item.to}
            onNavigate={onNavigate}
          />
        ))}
      </div>
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
  return (
    <nav className="flex-1 overflow-y-auto px-2 py-3">
      {ADMIN_NAV.map((section) => (
        <SidebarSection
          key={section.titleCode}
          section={section}
          pathname={pathname}
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
  const { userName } = useRbac();
  return (
    <>
      <div className="flex items-center gap-2 px-4 py-3.5 border-b border-white/10">
        <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-primary text-primary-foreground font-bold">
          P
        </div>
        <div className="leading-tight">
          <div className="text-[13px] font-semibold tracking-wide">DIGIT Complaint Management</div>
          <div className="text-[10px] uppercase tracking-wider text-[#93A4BC]">
            {t("ADMIN_CONSOLE", "Admin Console")}
          </div>
        </div>
      </div>
      <SidebarNavigation pathname={pathname} onNavigate={onNavigate} />
      <div className="border-t border-white/10 px-3 py-2.5 text-[11px]">
        <div className="truncate font-medium text-chrome-foreground">{userName}</div>
        <div className="truncate text-chrome-muted">
          {t("ROLE_PLATFORM_ADMIN", "Platform Administrator")}
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
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function AdminTopBar({ onMenuClick }: { onMenuClick: () => void }) {
  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border bg-surface px-3 lg:px-4">
      <button
        onClick={onMenuClick}
        className="lg:hidden flex h-8 w-8 items-center justify-center rounded-sm border border-border text-muted-foreground hover:bg-muted"
        aria-label={t("COMMON_OPEN_MENU", "Open menu")}
      >
        <Menu className="h-4 w-4" />
      </button>
      <div className="flex items-center gap-2">
        <div className="leading-tight">
          <div className="text-[12px] font-semibold text-foreground">
            {t("ADMIN_HEADER_TITLE", "Platform Administration")}
          </div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
            {t("ADMIN_HEADER_SUBTITLE", "Admin Console")}
          </div>
        </div>
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
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border bg-surface px-4 py-4 lg:px-6">
      <div className="min-w-0">
        <h1 className="text-[18px] font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-0.5 text-[12.5px] text-muted-foreground">{subtitle}</p>
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
 * BlankAdminPage — uniform placeholder used by every navigation item
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
