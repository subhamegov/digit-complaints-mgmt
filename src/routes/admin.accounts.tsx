/**
 * Platform Administrator — Accounts page.
 *
 * Lists platform accounts with summary KPIs, filter bar, a dense admin
 * table, and a right-side detail drawer. All actions are no-op for the
 * prototype (toast feedback only). Table/drawer pattern is designed to
 * be reused later for Account Administration surfaces.
 *
 * All controls are RBAC-aware (gated through <Can />) and every visible
 * label flows through the i18n shim with a safe fallback.
 */

import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  Plus,
  Download,
  Search,
  Eye,
  Building2,
  X,
} from "lucide-react";
import { AdminPageHeader, EmptyStateCard } from "@/components/admin/AdminLayout";
import { Can } from "@/lib/rbac";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

/* ------------------------------------------------------------------ */
/* Types & sample data                                                */
/* ------------------------------------------------------------------ */

type AccountStatus = "Draft" | "Pending setup" | "Active" | "Suspended" | "Expired";
type Environment = "Sandbox" | "UAT" | "Production";
type OperatingMode = "Demo" | "SaaS" | "Own Deployment";
type AccountType = "Government" | "Partner" | "Sandbox" | "Demo";
type TenancyModel = "Shared" | "Dedicated";
type Isolation = "Verified" | "Pending" | "Not checked";

export type Account = {
  id: string;
  name: string;
  description: string;
  code: string;
  type: AccountType;
  status: AccountStatus;
  environments: Environment[];
  operatingMode: OperatingMode;
  isolation: Isolation;
  primaryAdmin: string;
  users: number;
  validForDays: number;
  lastActivity: string;
};

const SAMPLE_ACCOUNTS: Account[] = [
  {
    id: "nairobi",
    name: "Nairobi City County",
    description: "County government — service delivery",
    code: "nairobi",
    type: "Government",
    status: "Active",
    environments: ["Sandbox", "UAT", "Production"],
    operatingMode: "SaaS",
    isolation: "Verified",
    primaryAdmin: "admin@nairobi.go.ke",
    users: 128,
    validForDays: 365,
    lastActivity: "2 hours ago",
  },
  {
    id: "bomet",
    name: "Bomet County",
    description: "County onboarding in progress",
    code: "bomet",
    type: "Government",
    status: "Pending setup",
    environments: ["Sandbox", "UAT"],
    operatingMode: "SaaS",
    isolation: "Pending",
    primaryAdmin: "admin@bomet.go.ke",
    users: 12,
    validForDays: 180,
    lastActivity: "1 day ago",
  },
  {
    id: "demo",
    name: "Demo Workspace",
    description: "Sandbox tenant for evaluation",
    code: "demo",
    type: "Demo",
    status: "Active",
    environments: ["Sandbox"],
    operatingMode: "Demo",
    isolation: "Not checked",
    primaryAdmin: "demo@digit.org",
    users: 6,
    validForDays: 30,
    lastActivity: "4 hours ago",
  },
  {
    id: "state-dc",
    name: "State Data Center",
    description: "Own-deployment pilot, dedicated stack",
    code: "state-dc",
    type: "Government",
    status: "Draft",
    environments: ["UAT"],
    operatingMode: "Own Deployment",
    isolation: "Pending",
    primaryAdmin: "it@example.gov",
    users: 3,
    validForDays: 90,
    lastActivity: "3 days ago",
  },
];

const STATUS_OPTIONS: ("All" | AccountStatus)[] = [
  "All",
  "Draft",
  "Pending setup",
  "Active",
  "Suspended",
  "Expired",
];
const ENV_OPTIONS: ("All" | Environment)[] = ["All", "Sandbox", "UAT", "Production"];
const MODE_OPTIONS: ("All" | OperatingMode)[] = ["All", "Demo", "SaaS", "Own Deployment"];
const TYPE_OPTIONS: ("All" | AccountType)[] = ["All", "Government", "Partner", "Sandbox", "Demo"];

/* ------------------------------------------------------------------ */
/* Toast helper                                                       */
/* ------------------------------------------------------------------ */

const noop = () =>
  toast(t("ADMIN_ACTION_NOT_CONFIGURED", "Action not configured in prototype"));

/* ------------------------------------------------------------------ */
/* Badges                                                             */
/* ------------------------------------------------------------------ */

const BADGE_BASE =
  "inline-flex items-center rounded-sm border px-1.5 py-0.5 text-[10.5px] font-medium uppercase tracking-wide";

export function AccountStatusBadge({ status }: { status: AccountStatus }) {
  const cls: Record<AccountStatus, string> = {
    Active: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    "Pending setup": "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    Draft: "border-border bg-muted text-muted-foreground",
    Suspended: "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300",
    Expired: "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300",
  };
  const codes: Record<AccountStatus, string> = {
    Active: "ADMIN_STATUS_ACTIVE",
    "Pending setup": "ADMIN_STATUS_PENDING_SETUP",
    Draft: "ADMIN_STATUS_DRAFT",
    Suspended: "ADMIN_STATUS_SUSPENDED",
    Expired: "ADMIN_STATUS_EXPIRED",
  };
  return <span className={cn(BADGE_BASE, cls[status])}>{t(codes[status], status)}</span>;
}

export function EnvironmentBadge({ env }: { env: Environment }) {
  const cls: Record<Environment, string> = {
    Production: "border-primary/30 bg-primary/10 text-primary",
    UAT: "border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300",
    Sandbox: "border-border bg-muted text-muted-foreground",
  };
  const codes: Record<Environment, string> = {
    Production: "ADMIN_ENV_PRODUCTION",
    UAT: "ADMIN_ENV_UAT",
    Sandbox: "ADMIN_ENV_SANDBOX",
  };
  return <span className={cn(BADGE_BASE, cls[env])}>{t(codes[env], env)}</span>;
}

export function IsolationBadge({ value }: { value: Isolation }) {
  const cls: Record<Isolation, string> = {
    Verified: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    Pending: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    "Not checked": "border-border bg-muted text-muted-foreground",
  };
  const codes: Record<Isolation, string> = {
    Verified: "ADMIN_ISOLATION_VERIFIED",
    Pending: "ADMIN_ISOLATION_PENDING",
    "Not checked": "ADMIN_ISOLATION_NOT_CHECKED",
  };
  return <span className={cn(BADGE_BASE, cls[value])}>{t(codes[value], value)}</span>;
}

/* ------------------------------------------------------------------ */
/* Summary cards                                                      */
/* ------------------------------------------------------------------ */

export function AccountsSummaryCards({ accounts }: { accounts: Account[] }) {
  const stats = useMemo(
    () => ({
      total: accounts.length,
      active: accounts.filter((a) => a.status === "Active").length,
      pending: accounts.filter((a) => a.status === "Pending setup").length,
      suspended: accounts.filter((a) => a.status === "Suspended").length,
    }),
    [accounts],
  );
  const cards: { code: string; label: string; value: number }[] = [
    { code: "ADMIN_ACC_TOTAL", label: "Total accounts", value: stats.total },
    { code: "ADMIN_ACC_ACTIVE", label: "Active", value: stats.active },
    { code: "ADMIN_ACC_PENDING", label: "Pending setup", value: stats.pending },
    { code: "ADMIN_ACC_SUSPENDED", label: "Suspended", value: stats.suspended },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {cards.map((c) => (
        <div key={c.code} className="rounded border border-border bg-surface px-3.5 py-3">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
            {t(c.code, c.label)}
          </div>
          <div className="mt-1 text-[22px] font-semibold tabular-nums text-foreground">
            {c.value}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Filter bar                                                         */
/* ------------------------------------------------------------------ */

export type AccountFilters = {
  q: string;
  status: "All" | AccountStatus;
  env: "All" | Environment;
  mode: "All" | OperatingMode;
  type: "All" | AccountType;
};

function FilterSelect<T extends string>({
  value,
  onChange,
  options,
  placeholder,
  codePrefix,
}: {
  value: T;
  onChange: (v: T) => void;
  options: readonly T[];
  placeholder: string;
  codePrefix: string;
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as T)}>
      <SelectTrigger className="h-9 w-full text-[12.5px] md:w-[160px]">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt} value={opt} className="text-[12.5px]">
            {t(`${codePrefix}_${opt.replace(/\s+/g, "_").toUpperCase()}`, opt)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function AccountsFilterBar({
  filters,
  onChange,
}: {
  filters: AccountFilters;
  onChange: (next: AccountFilters) => void;
}) {
  return (
    <div className="flex flex-col gap-2 rounded border border-border bg-surface p-3 md:flex-row md:flex-wrap md:items-center">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={filters.q}
          onChange={(e) => onChange({ ...filters, q: e.target.value })}
          placeholder={t("ADMIN_ACC_SEARCH", "Search accounts")}
          className="h-9 pl-8 text-[12.5px]"
        />
      </div>
      <FilterSelect
        value={filters.status}
        onChange={(v) => onChange({ ...filters, status: v })}
        options={STATUS_OPTIONS}
        placeholder={t("ADMIN_FILTER_STATUS", "Status")}
        codePrefix="ADMIN_STATUS"
      />
      <FilterSelect
        value={filters.env}
        onChange={(v) => onChange({ ...filters, env: v })}
        options={ENV_OPTIONS}
        placeholder={t("ADMIN_FILTER_ENV", "Environment")}
        codePrefix="ADMIN_ENV"
      />
      <FilterSelect
        value={filters.mode}
        onChange={(v) => onChange({ ...filters, mode: v })}
        options={MODE_OPTIONS}
        placeholder={t("ADMIN_FILTER_MODE", "Operating mode")}
        codePrefix="ADMIN_MODE"
      />
      <FilterSelect
        value={filters.type}
        onChange={(v) => onChange({ ...filters, type: v })}
        options={TYPE_OPTIONS}
        placeholder={t("ADMIN_FILTER_TYPE", "Account type")}
        codePrefix="ADMIN_TYPE"
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Table                                                              */
/* ------------------------------------------------------------------ */

export function AccountsTable({
  accounts,
  onView,
}: {
  accounts: Account[];
  onView: (a: Account) => void;
}) {
  if (accounts.length === 0) {
    return (
      <EmptyStateCard
        title={t("ADMIN_ACC_EMPTY_TITLE", "No accounts yet")}
        body={t(
          "ADMIN_ACC_EMPTY_BODY",
          "Create an account to start onboarding an organization.",
        )}
        icon={Building2}
      />
    );
  }
  const headers: { code: string; label: string; className?: string }[] = [
    { code: "ADMIN_COL_ACCOUNT", label: "Account" },
    { code: "ADMIN_COL_CODE", label: "Account code" },
    { code: "ADMIN_COL_TYPE", label: "Type" },
    { code: "ADMIN_COL_STATUS", label: "Status" },
    { code: "ADMIN_COL_ENV", label: "Environments" },
    { code: "ADMIN_COL_MODE", label: "Operating mode" },
    { code: "ADMIN_COL_DATA_ISOLATION", label: "Data isolation" },
    { code: "ADMIN_COL_PRIMARY_ADMIN", label: "Primary admin" },
    { code: "ADMIN_COL_USERS", label: "Users", className: "text-right" },
    { code: "ADMIN_COL_VALID_FOR", label: "Valid for", className: "text-right" },
    { code: "ADMIN_COL_LAST_ACTIVITY", label: "Last activity" },
    { code: "ADMIN_COL_ACTIONS", label: "Actions", className: "text-right" },
  ];
  return (
    <div className="overflow-hidden rounded border border-border bg-surface">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[12.5px]">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
              {headers.map((h) => (
                <th
                  key={h.code}
                  className={cn("whitespace-nowrap px-3 py-2 font-medium", h.className)}
                >
                  {t(h.code, h.label)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {accounts.map((a) => (
              <tr
                key={a.id}
                className="border-b border-border last:border-b-0 hover:bg-muted/30"
              >
                <td className="px-3 py-2.5 align-top">
                  <div className="font-medium text-foreground">{a.name}</div>
                  <div className="text-[11.5px] text-muted-foreground">{a.description}</div>
                </td>
                <td className="px-3 py-2.5 align-top font-mono text-[12px] text-foreground">
                  {a.code}
                </td>
                <td className="px-3 py-2.5 align-top text-foreground">{a.type}</td>
                <td className="px-3 py-2.5 align-top"><AccountStatusBadge status={a.status} /></td>
                <td className="px-3 py-2.5 align-top">
                  <div className="flex flex-wrap gap-1">
                    {a.environments.map((e) => (
                      <EnvironmentBadge key={e} env={e} />
                    ))}
                  </div>
                </td>
                <td className="px-3 py-2.5 align-top text-foreground">{a.operatingMode}</td>
                <td className="px-3 py-2.5 align-top"><IsolationBadge value={a.isolation} /></td>
                <td className="px-3 py-2.5 align-top text-foreground">{a.primaryAdmin}</td>
                <td className="px-3 py-2.5 align-top text-right tabular-nums text-foreground">
                  {a.users}
                </td>
                <td className="px-3 py-2.5 align-top text-right tabular-nums text-foreground">
                  {a.validForDays} {t("ADMIN_UNIT_DAYS", "days")}
                </td>
                <td className="px-3 py-2.5 align-top text-muted-foreground">{a.lastActivity}</td>
                <td className="px-3 py-2.5 align-top text-right">
                  <Can perm="ACC_VIEW">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-[12px]"
                      onClick={() => onView(a)}
                    >
                      <Eye className="mr-1 h-3.5 w-3.5" />
                      {t("ADMIN_ACTION_VIEW", "View")}
                    </Button>
                  </Can>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Drawer                                                             */
/* ------------------------------------------------------------------ */

function DrawerField({ label, code, value }: { label: string; code: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-3 py-1.5">
      <div className="col-span-1 text-[11.5px] uppercase tracking-wider text-muted-foreground">
        {t(code, label)}
      </div>
      <div className="col-span-2 text-[12.5px] text-foreground">{value}</div>
    </div>
  );
}

function DrawerSection({ title, code, children }: { title: string; code: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-border px-5 py-4 first:border-t-0">
      <h3 className="mb-2 text-[11.5px] font-semibold uppercase tracking-wider text-muted-foreground">
        {t(code, title)}
      </h3>
      <div className="divide-y divide-border/60">{children}</div>
    </section>
  );
}

export function AccountDetailsDrawer({
  account,
  open,
  onOpenChange,
}: {
  account: Account | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full p-0 sm:max-w-[480px]">
        <SheetHeader className="border-b border-border bg-surface px-5 py-3.5 text-left">
          <SheetTitle className="text-[15px] font-semibold">
            {t("ADMIN_ACC_DRAWER_TITLE", "Account details")}
          </SheetTitle>
          {account && (
            <SheetDescription className="text-[12px]">
              {account.name} · <span className="font-mono">{account.code}</span>
            </SheetDescription>
          )}
        </SheetHeader>

        {account && (
          <div className="flex h-[calc(100%-56px)] flex-col">
            <div className="flex-1 overflow-y-auto">
              <Can perm="ACC_VIEW">
                <DrawerSection title="Identity" code="ADMIN_ACC_SEC_IDENTITY">
                  <DrawerField label="Account name" code="ADMIN_F_NAME" value={account.name} />
                  <DrawerField label="Account code" code="ADMIN_F_CODE" value={<span className="font-mono">{account.code}</span>} />
                  <DrawerField label="Type" code="ADMIN_F_TYPE" value={account.type} />
                  <DrawerField label="Description" code="ADMIN_F_DESCRIPTION" value={account.description} />
                </DrawerSection>
              </Can>
              <Can perm="ACC_VIEW">
                <DrawerSection title="Setup" code="ADMIN_ACC_SEC_SETUP">
                  <DrawerField label="Status" code="ADMIN_F_STATUS" value={<AccountStatusBadge status={account.status} />} />
                  <DrawerField label="Environment" code="ADMIN_F_ENV" value={<EnvironmentBadge env={account.environment} />} />
                  <DrawerField label="Operating mode" code="ADMIN_F_MODE" value={account.operatingMode} />
                  <DrawerField label="Tenancy model" code="ADMIN_F_TENANCY" value={account.tenancyModel} />
                  <DrawerField label="Isolation" code="ADMIN_F_ISOLATION" value={<IsolationBadge value={account.isolation} />} />
                </DrawerSection>
              </Can>
              <Can perm="ACC_VIEW">
                <DrawerSection title="Access" code="ADMIN_ACC_SEC_ACCESS">
                  <DrawerField label="Primary admin" code="ADMIN_F_PRIMARY_ADMIN" value={account.primaryAdmin} />
                  <DrawerField label="Users" code="ADMIN_F_USERS" value={account.users} />
                  <DrawerField label="Last activity" code="ADMIN_F_LAST_ACTIVITY" value={account.lastActivity} />
                </DrawerSection>
              </Can>
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-border bg-surface px-5 py-3">
              <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                <X className="mr-1 h-3.5 w-3.5" />
                {t("COMMON_CLOSE", "Close")}
              </Button>
              <Can perm="ACC_EDIT">
                <Button size="sm" onClick={noop}>
                  {t("ADMIN_ACC_EDIT", "Edit account")}
                </Button>
              </Can>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                               */
/* ------------------------------------------------------------------ */

export function AccountsPage() {
  const [filters, setFilters] = useState<AccountFilters>({
    q: "",
    status: "All",
    env: "All",
    mode: "All",
    type: "All",
  });
  const [selected, setSelected] = useState<Account | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const accounts = SAMPLE_ACCOUNTS;

  const filtered = useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    return accounts.filter((a) => {
      if (q && !`${a.name} ${a.code} ${a.primaryAdmin}`.toLowerCase().includes(q)) {
        return false;
      }
      if (filters.status !== "All" && a.status !== filters.status) return false;
      if (filters.env !== "All" && a.environment !== filters.env) return false;
      if (filters.mode !== "All" && a.operatingMode !== filters.mode) return false;
      if (filters.type !== "All" && a.type !== filters.type) return false;
      return true;
    });
  }, [accounts, filters]);

  const handleView = (a: Account) => {
    setSelected(a);
    setDrawerOpen(true);
  };

  return (
    <div className="flex h-full flex-col">
      <AdminPageHeader
        title={t("ADMIN_ACC_TITLE", "Accounts")}
        subtitle={t(
          "ADMIN_ACC_SUBTITLE",
          "View platform accounts, setup status, and tenancy readiness.",
        )}
        actions={
          <>
            <Can perm="ACC_EXPORT">
              <Button variant="outline" size="sm" onClick={noop}>
                <Download className="mr-1 h-3.5 w-3.5" />
                {t("ADMIN_ACTION_EXPORT", "Export")}
              </Button>
            </Can>
            <Can perm="ACC_CREATE">
              <Button size="sm" onClick={noop}>
                <Plus className="mr-1 h-3.5 w-3.5" />
                {t("ADMIN_ACC_CREATE", "Create account")}
              </Button>
            </Can>
          </>
        }
      />
      <div className="flex-1 space-y-4 p-4 lg:p-6">
        <AccountsSummaryCards accounts={accounts} />
        <AccountsFilterBar filters={filters} onChange={setFilters} />
        <AccountsTable accounts={filtered} onView={handleView} />
      </div>
      <AccountDetailsDrawer
        account={selected}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />
    </div>
  );
}

export { EmptyStateCard };

export const Route = createFileRoute("/admin/accounts")({
  component: AccountsPage,
});
