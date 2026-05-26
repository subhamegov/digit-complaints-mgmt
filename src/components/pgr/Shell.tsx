import { Link, useRouterState } from "@tanstack/react-router";
import { useState, useEffect } from "react";
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
  Menu,
  X,
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

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
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
            onClick={onNavigate}
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
    <>
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
    </>
  );
}

export function Sidebar() {
  return (
    <aside className="hidden lg:flex w-[232px] shrink-0 flex-col bg-chrome text-chrome-foreground">
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
      <aside className="absolute left-0 top-0 bottom-0 flex w-[260px] flex-col bg-chrome text-chrome-foreground shadow-xl">
        <SidebarContent onNavigate={onClose} />
      </aside>
    </div>
  );
}

export function TopBar({ onMenuClick }: { onMenuClick?: () => void }) {
  const { role, setRole, tenant, setTenant, jurisdiction, setJurisdiction, userName } = useRbac();
  const [contextOpen, setContextOpen] = useState(false);

  return (
    <>
      <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border bg-surface px-3 lg:px-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden flex h-8 w-8 items-center justify-center rounded-sm border border-border text-muted-foreground hover:bg-muted"
          aria-label="Open menu"
        >
          <Menu className="h-4 w-4" />
        </button>

        <div className="relative flex-1 max-w-md min-w-0">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            placeholder="Search…"
            aria-label={t("COMMON_SEARCH")}
            className="h-8 w-full rounded-sm border border-border bg-background pl-8 pr-3 text-[13px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
          />
        </div>

        {/* Desktop context */}
        <div className="ml-auto hidden md:flex items-center gap-2">
          <ContextSelect
            icon={Building2}
            label={t("COMMON_TENANT")}
            value={tenant.name}
            options={TENANTS.map((t) => ({ label: t.name, value: t.code }))}
            onChange={(v) => setTenant(TENANTS.find((t) => t.code === v)!)}
          />
          <ContextSelect
            icon={MapPin}
            label={t("COMMON_JURISDICTION")}
            value={jurisdiction.name}
            options={JURISDICTIONS.map((j) => ({ label: j.name, value: j.code }))}
            onChange={(v) => setJurisdiction(JURISDICTIONS.find((j) => j.code === v)!)}
          />
          <label className="flex items-center gap-1.5 rounded-sm border border-border bg-background px-2 py-1">
            <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{t("COMMON_ROLE")}</span>
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
          </label>
        </div>

        {/* Mobile context trigger */}
        <button
          onClick={() => setContextOpen(true)}
          className="md:hidden flex h-8 items-center gap-1 rounded-sm border border-border bg-background px-2 text-[11px] text-muted-foreground hover:bg-muted"
          aria-label="Context"
        >
          <ShieldCheck className="h-3.5 w-3.5" />
          <span className="font-medium text-foreground max-w-[70px] truncate">{ROLE_LABEL[role]}</span>
        </button>

        <button className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-sm border border-border text-muted-foreground hover:bg-muted" aria-label="Notifications">
          <Bell className="h-4 w-4" />
          <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-status-breach" />
        </button>

        <div className="hidden sm:flex items-center gap-2 border-l border-border pl-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-chrome text-[11px] font-semibold text-chrome-foreground">
            {userName.split(" ").map((n) => n[0]).slice(0, 2).join("")}
          </div>
          <div className="leading-tight">
            <div className="text-[12px] font-medium text-foreground">{userName}</div>
            <div className="text-[10px] text-muted-foreground">{ROLE_LABEL[role]}</div>
          </div>
        </div>
      </header>

      {/* Mobile context sheet */}
      {contextOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setContextOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 rounded-t-lg bg-surface p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-[14px] font-semibold">Working context</h3>
              <button onClick={() => setContextOpen(false)} aria-label="Close"><X className="h-4 w-4" /></button>
            </div>
            <MobileField label={t("COMMON_TENANT")} icon={Building2}>
              <select
                value={tenant.code}
                onChange={(e) => setTenant(TENANTS.find((t) => t.code === e.target.value)!)}
                className="w-full bg-transparent text-[13px] outline-none"
              >
                {TENANTS.map((t) => <option key={t.code} value={t.code}>{t.name}</option>)}
              </select>
            </MobileField>
            <MobileField label={t("COMMON_JURISDICTION")} icon={MapPin}>
              <select
                value={jurisdiction.code}
                onChange={(e) => setJurisdiction(JURISDICTIONS.find((j) => j.code === e.target.value)!)}
                className="w-full bg-transparent text-[13px] outline-none"
              >
                {JURISDICTIONS.map((j) => <option key={j.code} value={j.code}>{j.name}</option>)}
              </select>
            </MobileField>
            <MobileField label={t("COMMON_ROLE")} icon={ShieldCheck}>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                className="w-full bg-transparent text-[13px] outline-none"
              >
                {(Object.keys(ROLE_LABEL) as Role[]).map((r) => (
                  <option key={r} value={r}>{ROLE_LABEL[r]}</option>
                ))}
              </select>
            </MobileField>
            <div className="border-t border-border pt-3 text-[12px] text-muted-foreground">
              Signed in as <span className="font-medium text-foreground">{userName}</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function MobileField({ label, icon: Icon, children }: { label: string; icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <label className="flex items-center gap-2 rounded-sm border border-border bg-background px-2.5 py-2">
      <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
      <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground shrink-0">{label}</span>
      <div className="flex-1 min-w-0">{children}</div>
    </label>
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

export { Plus, LogOut };
