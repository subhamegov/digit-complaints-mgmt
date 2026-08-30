import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import {
  Home,
  Inbox,
  BarChart3,
  Settings,
  Users,
  ScrollText,
  Search,
  Bell,
  Building2,
  MapPin,
  LogOut,
  ShieldCheck,
  Menu,
  X,
  GitBranch,
  Globe2,
  FormInput,
  Plug,
  BookOpen,
  HelpCircle,
  Plus,
} from "lucide-react";
import { useRbac, ROLE_LABEL, type Role, type Permission, TENANTS, JURISDICTIONS } from "@/lib/rbac";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { ContextCombobox } from "@/components/pgr/ContextCombobox";


interface NavItem {
  to: string;
  labelCode: string;
  icon: React.ComponentType<{ className?: string }>;
  requires?: Permission[];
}

const PRIMARY_NAV: NavItem[] = [
  { to: "/admin/home",              labelCode: "Home",                   icon: Home },
  { to: "/admin/users",             labelCode: "Users",                  icon: Users },
  { to: "/admin/roles",             labelCode: "Roles & Permissions",    icon: ShieldCheck },
  { to: "/admin/complaints-config", labelCode: "Complaints",             icon: Inbox },
  { to: "/admin/workflow-config",   labelCode: "Workflow Configuration", icon: GitBranch },
  { to: "/admin/sources",           labelCode: "Sources",                icon: Globe2 },
  { to: "/admin/channels",          labelCode: "Channels",               icon: Bell },
  { to: "/admin/communications",    labelCode: "Communications",         icon: FormInput },
  { to: "/admin/integrations",      labelCode: "Integrations",           icon: Plug },
  { to: "/admin/knowledge-base",    labelCode: "Knowledge Base",         icon: BookOpen },
  { to: "/operations/health",       labelCode: "Health",                icon: BarChart3, requires: ["SYSTEM_HEALTH_VIEW"] },
  { to: "/admin/audit-log",         labelCode: "Audit",                  icon: ScrollText },
  { to: "/admin/settings",          labelCode: "Settings",               icon: Settings },
];

const ADMIN_NAV: NavItem[] = [];

/** Personas that use the simplified operational navigation. */
const OPERATIONAL_ROLES: Role[] = ["LME", "GRO", "DEPT_HEAD"];

/** Simplified nav for field/operational personas. Routes are existing destinations. */
const OPERATIONAL_NAV: NavItem[] = [
  { to: "/dashboard", labelCode: "Dashboard",         icon: Home },
  { to: "/tasks",     labelCode: "My Complaints",     icon: Inbox },
  { to: "/inbox",     labelCode: "Search Complaints", icon: Search },
  { to: "/reports",   labelCode: "Reports",           icon: BarChart3 },
];

const OPERATIONAL_FOOTER_NAV: NavItem[] = [
  { to: "/admin/help", labelCode: "Help", icon: HelpCircle },
];

function SidebarContextSwitchers() {
  const { role, setRole, tenant, setTenant, jurisdiction, setJurisdiction } = useRbac();
  return (
    <div className="space-y-2 border-b border-white/10 px-3 py-3">
      <div className="px-1 pb-0.5 text-[10px] font-medium uppercase tracking-wider text-[#93A4BC]">
        Working context
      </div>
      <ContextCombobox
        icon={Building2}
        label={t("COMMON_TENANT")}
        value={tenant.code}
        options={TENANTS.map((tn) => ({ value: tn.code, label: tn.name, hint: tn.code }))}
        onChange={(v) => setTenant(TENANTS.find((tn) => tn.code === v)!)}
      />
      <ContextCombobox
        icon={MapPin}
        label={t("COMMON_JURISDICTION")}
        value={jurisdiction.code}
        options={JURISDICTIONS.map((j) => ({ value: j.code, label: j.name, hint: j.code }))}
        onChange={(v) => setJurisdiction(JURISDICTIONS.find((j) => j.code === v)!)}
      />
      <ContextCombobox
        icon={ShieldCheck}
        label={t("COMMON_ROLE")}
        value={role}
        options={(Object.keys(ROLE_LABEL) as Role[]).map((r) => ({ value: r, label: ROLE_LABEL[r] }))}
        onChange={(v) => setRole(v as Role)}
      />
    </div>
  );
}


function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { hasAnyPermission, userName, role } = useRbac();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const renderItems = (items: NavItem[]) =>
    items
      .filter((i) => !i.requires || hasAnyPermission(i.requires))
      .map((item) => {
        const active = pathname === item.to || pathname.startsWith(item.to + "/");
        const Icon = item.icon;
        return (
          <Link
            key={item.to}
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
            <span className="truncate">{t(item.labelCode)}</span>
          </Link>
        );
      });

  const isOperational = OPERATIONAL_ROLES.includes(role);
  const primary = renderItems(isOperational ? OPERATIONAL_NAV : PRIMARY_NAV);
  const admin = renderItems(ADMIN_NAV);
  const footerNav = isOperational ? renderItems(OPERATIONAL_FOOTER_NAV) : null;

  return (
    <>
      <div className="flex items-center gap-2 px-4 py-3.5 border-b border-white/10">
        <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-primary text-primary-foreground font-bold">
          P
        </div>
        <div className="leading-tight">
          <div className="text-[13px] font-semibold tracking-wide">DIGIT PGR</div>
          <div className="text-[10px] uppercase tracking-wider text-[#93A4BC]">Grievance Redressal</div>
        </div>
      </div>

      <SidebarContextSwitchers />

      <nav className="flex-1 overflow-y-auto px-2 py-3">
        <div className="space-y-0.5">{primary}</div>
      </nav>

      {footerNav && (
        <nav className="border-t border-white/10 px-2 py-2">
          <div className="space-y-0.5">{footerNav}</div>
        </nav>
      )}




      <div className="border-t border-white/10 px-3 py-2.5 text-[11px]">
        <div className="truncate font-medium text-chrome-foreground">{userName}</div>
        <div className="truncate text-chrome-muted">{ROLE_LABEL[role]}</div>
        <div className="mt-1 text-chrome-muted/70">Build 2.4.1 · Sandbox</div>
      </div>
    </>
  );
}

export function Sidebar() {
  return (
    <aside className="hidden lg:flex w-[232px] shrink-0 flex-col bg-[#0B1F3A] text-chrome-foreground">
      <SidebarContent />
    </aside>
  );
}

export function MobileSidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <aside className="absolute left-0 top-0 bottom-0 flex w-[260px] flex-col bg-[#0B1F3A] text-chrome-foreground shadow-xl">
        <SidebarContent onNavigate={onClose} />
      </aside>
    </div>
  );
}

export function TopBar({
  onMenuClick,
  showSearch = true,
  showMenu = true,
}: {
  onMenuClick?: () => void;
  showSearch?: boolean;
  showMenu?: boolean;
}) {
  const navigate = useNavigate();

  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border bg-surface px-3 lg:px-4">
      {showMenu && (
        <button
          onClick={onMenuClick}
          className="lg:hidden flex h-8 w-8 items-center justify-center rounded-sm border border-border text-muted-foreground hover:bg-muted"
          aria-label="Open menu"
        >
          <Menu className="h-4 w-4" />
        </button>
      )}

      {showSearch ? (
        <div className="relative flex-1 max-w-md min-w-0">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            placeholder="Search…"
            aria-label={t("COMMON_SEARCH")}
            className="h-8 w-full rounded-sm border border-border bg-background pl-8 pr-3 text-[13px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
          />
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-sm bg-primary text-[12px] font-bold text-primary-foreground">P</div>
          <div className="leading-tight">
            <div className="text-[12px] font-semibold">DIGIT Complaint Management</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Admin Console</div>
          </div>
        </div>
      )}

      <button className="ml-auto relative flex h-8 w-8 shrink-0 items-center justify-center rounded-sm border border-border text-muted-foreground hover:bg-muted" aria-label="Notifications">
        <Bell className="h-4 w-4" />
        <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-status-breach" />
      </button>

      <button
        onClick={() => navigate({ to: "/login" })}
        className="flex h-8 items-center gap-1.5 rounded-sm border border-border bg-background px-2 text-[12px] font-medium text-foreground hover:bg-muted"
        aria-label={t("COMMON_SIGN_OUT")}
        title={t("COMMON_SIGN_OUT")}
      >
        <LogOut className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">{t("COMMON_SIGN_OUT")}</span>
      </button>

      {/* X kept for potential future use */}
      <span className="hidden"><X /></span>
    </header>
  );
}


export { Plus, LogOut };
