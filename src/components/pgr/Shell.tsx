import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Inbox,
  ListChecks,
  BarChart3,
  Timer,
  AlertTriangle,
  Settings,
  Users,
  ScrollText,
  Plus,
  Search,
  Bell,
  ChevronDown,
  Building2,
  MapPin,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import { useRbac, ROLE_LABEL, type Role, type Permission, TENANTS, JURISDICTIONS } from "@/lib/rbac";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface NavItem {
  to: string;
  labelCode: string;
  icon: React.ComponentType<{ className?: string }>;
  requires?: Permission[];
}

const PRIMARY_NAV: NavItem[] = [
  { to: "/dashboard", labelCode: "COMMON_DASHBOARD", icon: LayoutDashboard, requires: ["PGR_DASHBOARD_VIEW"] },
  { to: "/inbox", labelCode: "COMMON_INBOX", icon: Inbox, requires: ["PGR_INBOX_VIEW"] },
  { to: "/tasks", labelCode: "COMMON_MY_TASKS", icon: ListChecks, requires: ["PGR_TASKS_VIEW"] },
  { to: "/sla", labelCode: "CS_SLA_STATUS", icon: Timer, requires: ["PGR_SLA_VIEW"] },
  { to: "/escalations", labelCode: "CS_ESCALATIONS", icon: AlertTriangle, requires: ["PGR_ESCALATION_VIEW"] },
  { to: "/reports", labelCode: "COMMON_REPORTS", icon: BarChart3, requires: ["PGR_REPORTS_VIEW"] },
];

const ADMIN_NAV: NavItem[] = [
  { to: "/config/complaint-types", labelCode: "CS_COMPLAINT_TYPE", icon: Settings, requires: ["MDMS_COMPLAINT_TYPE_MANAGE"] },
  { to: "/config/workflow", labelCode: "Workflow & SLA", icon: ShieldCheck, requires: ["MDMS_WORKFLOW_MANAGE"] },
  { to: "/users", labelCode: "COMMON_USERS", icon: Users, requires: ["HRMS_USER_MANAGE"] },
  { to: "/audit", labelCode: "COMMON_AUDIT_LOG", icon: ScrollText, requires: ["AUDIT_LOG_VIEW"] },
];

export function Sidebar() {
  const { hasAnyPermission } = useRbac();
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
            className={cn(
              "group flex items-center gap-2.5 border-l-2 px-2.5 py-1.5 text-[13px] transition-colors",
              active
                ? "border-primary bg-white/[0.06] font-medium text-white"
                : "border-transparent text-chrome-foreground/75 hover:bg-white/[0.04] hover:text-chrome-foreground",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="truncate">{t(item.labelCode)}</span>
          </Link>
        );
      });

  const primary = renderItems(PRIMARY_NAV);
  const admin = renderItems(ADMIN_NAV);

  return (
    <aside className="flex w-[232px] shrink-0 flex-col bg-chrome text-chrome-foreground">
      <div className="flex items-center gap-2 px-4 py-3.5 border-b border-white/5">
        <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-primary text-primary-foreground font-bold">
          P
        </div>
        <div className="leading-tight">
          <div className="text-[13px] font-semibold tracking-wide">DIGIT PGR</div>
          <div className="text-[10px] uppercase tracking-wider text-chrome-muted">Grievance Redressal</div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3">
        <div className="px-2.5 pb-1.5 text-[10px] font-medium uppercase tracking-wider text-chrome-muted">
          Operations
        </div>
        <div className="space-y-0.5">{primary}</div>

        {admin.length > 0 && (
          <>
            <div className="mt-5 px-2.5 pb-1.5 text-[10px] font-medium uppercase tracking-wider text-chrome-muted">
              Administration
            </div>
            <div className="space-y-0.5">{admin}</div>
          </>
        )}
      </nav>

      <div className="border-t border-white/5 px-3 py-2.5 text-[11px] text-chrome-muted">
        Build 2.4.1 · Sandbox
      </div>
    </aside>
  );
}

export function TopBar() {
  const { role, setRole, tenant, setTenant, jurisdiction, setJurisdiction, userName } = useRbac();

  return (
    <header className="flex h-12 shrink-0 items-center gap-3 border-b border-border bg-surface px-4">
      <div className="relative flex-1 max-w-md">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          placeholder="Search complaint no., citizen, mobile…"
          aria-label={t("COMMON_SEARCH")}
          className="h-8 w-full rounded-sm border border-border bg-background pl-8 pr-3 text-[13px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
        {/* Tenant selector */}
        <ContextSelect
          icon={Building2}
          label={t("COMMON_TENANT")}
          value={tenant.name}
          options={TENANTS.map((t) => ({ label: t.name, value: t.code }))}
          onChange={(v) => setTenant(TENANTS.find((t) => t.code === v)!)}
        />

        {/* Jurisdiction */}
        <ContextSelect
          icon={MapPin}
          label={t("COMMON_JURISDICTION")}
          value={jurisdiction.name}
          options={JURISDICTIONS.map((j) => ({ label: j.name, value: j.code }))}
          onChange={(v) => setJurisdiction(JURISDICTIONS.find((j) => j.code === v)!)}
        />

        {/* Role switcher — prototype only */}
        <div className="flex items-center gap-1.5 rounded-sm border border-primary/30 bg-primary/5 px-2 py-1">
          <ShieldCheck className="h-3.5 w-3.5 text-primary" />
          <span className="text-[10px] font-medium uppercase tracking-wider text-primary">{t("COMMON_ROLE")}</span>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
            className="bg-transparent text-[12px] font-medium text-foreground outline-none"
            aria-label="Role switcher (demo)"
          >
            {(Object.keys(ROLE_LABEL) as Role[]).map((r) => (
              <option key={r} value={r}>{ROLE_LABEL[r]}</option>
            ))}
          </select>
        </div>

        <button className="relative flex h-8 w-8 items-center justify-center rounded-sm border border-border text-muted-foreground hover:bg-muted" aria-label="Notifications">
          <Bell className="h-4 w-4" />
          <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-primary" />
        </button>

        <div className="flex items-center gap-2 border-l border-border pl-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-chrome text-[11px] font-semibold text-chrome-foreground">
            {userName.split(" ").map((n) => n[0]).slice(0, 2).join("")}
          </div>
          <div className="leading-tight">
            <div className="text-[12px] font-medium text-foreground">{userName}</div>
            <div className="text-[10px] text-muted-foreground">{ROLE_LABEL[role]}</div>
          </div>
        </div>
      </div>
    </header>
  );
}

function ContextSelect({
  icon: Icon,
  label,
  value,
  options,
  onChange,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  options: { label: string; value: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex items-center gap-1.5 rounded-sm border border-border bg-background px-2 py-1">
      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      <span className="sr-only">{label}</span>
      <select
        value={options.find((o) => o.label === value)?.value ?? options[0].value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent text-[12px] text-foreground outline-none max-w-[140px] truncate"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <ChevronDown className="h-3 w-3 text-muted-foreground" />
    </label>
  );
}

// Re-exported icons for action buttons in pages
export { Plus, LogOut };
