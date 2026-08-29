/**
 * Platform Administrator - Domains page.
 *
 * Manages platform and account domain URLs with summary KPIs, filters,
 * a dense admin table, a view drawer, and an add-domain drawer. All
 * actions are prototype-only (toast feedback). RBAC- and i18n-ready.
 */

import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  Plus,
  RefreshCw,
  Search,
  Eye,
  Globe2,
  ShieldCheck,
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

export const Route = createFileRoute("/admin/domains")({
  head: () => ({ meta: [{ title: "Domains - Platform Administration" }] }),
  component: DomainsPage,
});

/* ------------------------------------------------------------------ */
/* Types & sample data                                                */
/* ------------------------------------------------------------------ */

type DomainScope = "Platform" | "Admin Console" | "API Gateway" | "Account" | "Demo";
type DomainEnv = "Sandbox" | "UAT" | "Production";
type DomainStatus = "Not configured" | "Pending" | "Active" | "Failed";
type DnsStatus = "Not checked" | "Pending" | "Verified" | "Failed";
type SslStatus = "Not checked" | "Pending" | "Valid" | "Expired";
type ManagedBy =
  | "Platform Operator"
  | "Implementation Partner"
  | "Government IT Team"
  | "External DNS Provider";
type CertOwner =
  | "Platform Operator"
  | "Implementation Partner"
  | "Government IT Team"
  | "External Cloud Provider";

export type Domain = {
  id: string;
  url: string;
  scope: DomainScope;
  account: string;
  environment: DomainEnv;
  status: DomainStatus;
  dns: DnsStatus;
  ssl: SslStatus;
  lastChecked: string;
  managedBy: ManagedBy;
  certificateOwner: CertOwner;
  notes?: string;
};

const SAMPLE_DOMAINS: Domain[] = [
  {
    id: "d1",
    url: "https://cms.example.org",
    scope: "Platform",
    account: "All accounts",
    environment: "Production",
    status: "Active",
    dns: "Verified",
    ssl: "Valid",
    lastChecked: "2 hours ago",
    managedBy: "Platform Operator",
    certificateOwner: "Platform Operator",
    notes: "Primary public access URL.",
  },
  {
    id: "d2",
    url: "https://admin.cms.example.org",
    scope: "Admin Console",
    account: "Platform",
    environment: "Production",
    status: "Active",
    dns: "Verified",
    ssl: "Valid",
    lastChecked: "2 hours ago",
    managedBy: "Platform Operator",
    certificateOwner: "Platform Operator",
  },
  {
    id: "d3",
    url: "https://api.cms.example.org",
    scope: "API Gateway",
    account: "Platform",
    environment: "Production",
    status: "Pending",
    dns: "Pending",
    ssl: "Not checked",
    lastChecked: "Never",
    managedBy: "Platform Operator",
    certificateOwner: "External Cloud Provider",
  },
  {
    id: "d4",
    url: "https://nairobi.cms.example.org",
    scope: "Account",
    account: "Nairobi City County",
    environment: "Production",
    status: "Active",
    dns: "Verified",
    ssl: "Valid",
    lastChecked: "1 day ago",
    managedBy: "Government IT Team",
    certificateOwner: "Government IT Team",
  },
  {
    id: "d5",
    url: "https://demo.cms.example.org",
    scope: "Demo",
    account: "Demo Workspace",
    environment: "Sandbox",
    status: "Failed",
    dns: "Failed",
    ssl: "Pending",
    lastChecked: "3 hours ago",
    managedBy: "Implementation Partner",
    certificateOwner: "Implementation Partner",
    notes: "DNS record mismatch detected.",
  },
];

const SCOPE_OPTIONS: ("All" | DomainScope)[] = [
  "All",
  "Platform",
  "Admin Console",
  "API Gateway",
  "Account",
  "Demo",
];
const ENV_OPTIONS: ("All" | DomainEnv)[] = ["All", "Sandbox", "UAT", "Production"];
const STATUS_OPTIONS: ("All" | DomainStatus)[] = [
  "All",
  "Not configured",
  "Pending",
  "Active",
  "Failed",
];

const MANAGED_BY_OPTIONS: ManagedBy[] = [
  "Platform Operator",
  "Implementation Partner",
  "Government IT Team",
  "External DNS Provider",
];
const CERT_OWNER_OPTIONS: CertOwner[] = [
  "Platform Operator",
  "Implementation Partner",
  "Government IT Team",
  "External Cloud Provider",
];

/* ------------------------------------------------------------------ */
/* Toast helper                                                       */
/* ------------------------------------------------------------------ */

const noopAction = () =>
  toast(t("ADMIN_ACTION_NOT_CONFIGURED", "Action not configured in prototype"));

/* ------------------------------------------------------------------ */
/* Badges                                                             */
/* ------------------------------------------------------------------ */

const BADGE_BASE =
  "inline-flex items-center rounded-sm border px-1.5 py-0.5 text-[10.5px] font-medium uppercase tracking-wide";

const NEUTRAL = "border-border bg-muted text-muted-foreground";
const OK = "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
const WARN = "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300";
const BAD = "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300";

export function DomainStatusBadge({ status }: { status: DomainStatus }) {
  const cls: Record<DomainStatus, string> = {
    Active: OK,
    Pending: WARN,
    Failed: BAD,
    "Not configured": NEUTRAL,
  };
  const codes: Record<DomainStatus, string> = {
    Active: "ADMIN_DOMAIN_STATUS_ACTIVE",
    Pending: "ADMIN_DOMAIN_STATUS_PENDING",
    Failed: "ADMIN_DOMAIN_STATUS_FAILED",
    "Not configured": "ADMIN_DOMAIN_STATUS_NOT_CONFIGURED",
  };
  return <span className={cn(BADGE_BASE, cls[status])}>{t(codes[status], status)}</span>;
}

export function DnsStatusBadge({ value }: { value: DnsStatus }) {
  const cls: Record<DnsStatus, string> = {
    Verified: OK,
    Pending: WARN,
    Failed: BAD,
    "Not checked": NEUTRAL,
  };
  const codes: Record<DnsStatus, string> = {
    Verified: "ADMIN_DNS_VERIFIED",
    Pending: "ADMIN_DNS_PENDING",
    Failed: "ADMIN_DNS_FAILED",
    "Not checked": "ADMIN_DNS_NOT_CHECKED",
  };
  return <span className={cn(BADGE_BASE, cls[value])}>{t(codes[value], value)}</span>;
}

export function SslStatusBadge({ value }: { value: SslStatus }) {
  const cls: Record<SslStatus, string> = {
    Valid: OK,
    Pending: WARN,
    Expired: BAD,
    "Not checked": NEUTRAL,
  };
  const codes: Record<SslStatus, string> = {
    Valid: "ADMIN_SSL_VALID",
    Pending: "ADMIN_SSL_PENDING",
    Expired: "ADMIN_SSL_EXPIRED",
    "Not checked": "ADMIN_SSL_NOT_CHECKED",
  };
  return <span className={cn(BADGE_BASE, cls[value])}>{t(codes[value], value)}</span>;
}

function EnvBadge({ env }: { env: DomainEnv }) {
  const cls: Record<DomainEnv, string> = {
    Production: "border-primary/30 bg-primary/10 text-primary",
    UAT: "border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300",
    Sandbox: NEUTRAL,
  };
  return <span className={cn(BADGE_BASE, cls[env])}>{t(`ADMIN_ENV_${env.toUpperCase()}`, env)}</span>;
}

/* ------------------------------------------------------------------ */
/* Summary cards                                                      */
/* ------------------------------------------------------------------ */

export function DomainSummaryCards({ domains }: { domains: Domain[] }) {
  const stats = useMemo(
    () => ({
      total: domains.length,
      active: domains.filter((d) => d.status === "Active").length,
      pending: domains.filter((d) => d.status === "Pending").length,
      failed: domains.filter((d) => d.status === "Failed").length,
    }),
    [domains],
  );
  const cards = [
    { code: "ADMIN_DOMAIN_TOTAL", label: "Total domains", value: stats.total },
    { code: "ADMIN_DOMAIN_ACTIVE", label: "Active", value: stats.active },
    { code: "ADMIN_DOMAIN_PENDING", label: "Pending verification", value: stats.pending },
    { code: "ADMIN_DOMAIN_FAILED", label: "Failed checks", value: stats.failed },
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

export type DomainFilters = {
  q: string;
  scope: "All" | DomainScope;
  env: "All" | DomainEnv;
  status: "All" | DomainStatus;
  account: string;
};

function FilterSelect<T extends string>({
  value,
  onChange,
  options,
  placeholder,
  width = "md:w-[160px]",
}: {
  value: T;
  onChange: (v: T) => void;
  options: readonly T[];
  placeholder: string;
  width?: string;
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as T)}>
      <SelectTrigger className={cn("h-9 w-full text-[12.5px]", width)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt} value={opt} className="text-[12.5px]">
            {opt}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function DomainFilterBar({
  filters,
  accounts,
  onChange,
}: {
  filters: DomainFilters;
  accounts: string[];
  onChange: (next: DomainFilters) => void;
}) {
  const accountOptions = ["All", ...accounts];
  return (
    <div className="flex flex-col gap-2 rounded border border-border bg-surface p-3 md:flex-row md:flex-wrap md:items-center">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={filters.q}
          onChange={(e) => onChange({ ...filters, q: e.target.value })}
          placeholder={t("ADMIN_DOMAIN_SEARCH", "Search domains")}
          className="h-9 pl-8 text-[12.5px]"
        />
      </div>
      <FilterSelect
        value={filters.scope}
        onChange={(v) => onChange({ ...filters, scope: v })}
        options={SCOPE_OPTIONS}
        placeholder={t("ADMIN_FILTER_SCOPE", "Scope")}
      />
      <FilterSelect
        value={filters.env}
        onChange={(v) => onChange({ ...filters, env: v })}
        options={ENV_OPTIONS}
        placeholder={t("ADMIN_FILTER_ENV", "Environment")}
      />
      <FilterSelect
        value={filters.status}
        onChange={(v) => onChange({ ...filters, status: v })}
        options={STATUS_OPTIONS}
        placeholder={t("ADMIN_FILTER_STATUS", "Status")}
      />
      <FilterSelect
        value={filters.account}
        onChange={(v) => onChange({ ...filters, account: v })}
        options={accountOptions}
        placeholder={t("ADMIN_FILTER_ACCOUNT", "Account")}
        width="md:w-[200px]"
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Table                                                              */
/* ------------------------------------------------------------------ */

export function DomainsTable({
  domains,
  onView,
  onAdd,
}: {
  domains: Domain[];
  onView: (d: Domain) => void;
  onAdd: () => void;
}) {
  if (domains.length === 0) {
    return (
      <EmptyStateCard
        title={t("ADMIN_DOMAIN_EMPTY_TITLE", "No domains configured")}
        body={t(
          "ADMIN_DOMAIN_EMPTY_BODY",
          "Add a base URL to make this installation accessible.",
        )}
        icon={Globe2}
        action={
          <Can perm="DOMAIN_CREATE">
            <Button size="sm" onClick={onAdd}>
              <Plus className="mr-1 h-3.5 w-3.5" />
              {t("ADMIN_DOMAIN_ADD", "Add domain")}
            </Button>
          </Can>
        }
      />
    );
  }
  const headers: { code: string; label: string; className?: string }[] = [
    { code: "ADMIN_COL_DOMAIN_URL", label: "Domain URL" },
    { code: "ADMIN_COL_SCOPE", label: "Scope" },
    { code: "ADMIN_COL_ACCOUNT", label: "Account" },
    { code: "ADMIN_COL_ENV", label: "Environment" },
    { code: "ADMIN_COL_STATUS", label: "Status" },
    { code: "ADMIN_COL_DNS", label: "DNS" },
    { code: "ADMIN_COL_SSL", label: "SSL/TLS" },
    { code: "ADMIN_COL_LAST_CHECKED", label: "Last checked" },
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
            {domains.map((d) => (
              <tr
                key={d.id}
                className="border-b border-border last:border-b-0 hover:bg-muted/30"
              >
                <td className="px-3 py-2.5 align-top">
                  <div className="font-mono text-[12px] text-foreground">{d.url}</div>
                </td>
                <td className="px-3 py-2.5 align-top text-foreground">{d.scope}</td>
                <td className="px-3 py-2.5 align-top text-foreground">{d.account}</td>
                <td className="px-3 py-2.5 align-top"><EnvBadge env={d.environment} /></td>
                <td className="px-3 py-2.5 align-top"><DomainStatusBadge status={d.status} /></td>
                <td className="px-3 py-2.5 align-top"><DnsStatusBadge value={d.dns} /></td>
                <td className="px-3 py-2.5 align-top"><SslStatusBadge value={d.ssl} /></td>
                <td className="px-3 py-2.5 align-top text-muted-foreground">{d.lastChecked}</td>
                <td className="px-3 py-2.5 align-top text-right">
                  <div className="flex justify-end gap-1">
                    <Can perm="DOMAIN_VIEW">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-[12px]"
                        onClick={() => onView(d)}
                      >
                        <Eye className="mr-1 h-3.5 w-3.5" />
                        {t("ADMIN_ACTION_VIEW", "View")}
                      </Button>
                    </Can>
                    <Can perm="DOMAIN_VERIFY">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-[12px]"
                        onClick={noopAction}
                      >
                        {t("ADMIN_ACTION_VERIFY", "Verify")}
                      </Button>
                    </Can>
                    <Can perm="DOMAIN_EDIT">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-[12px]"
                        onClick={noopAction}
                      >
                        {t("ADMIN_ACTION_EDIT", "Edit")}
                      </Button>
                    </Can>
                  </div>
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
/* Drawer primitives                                                  */
/* ------------------------------------------------------------------ */

function DrawerField({
  label,
  code,
  value,
}: {
  label: string;
  code: string;
  value: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-3 gap-3 py-1.5">
      <div className="col-span-1 text-[11.5px] uppercase tracking-wider text-muted-foreground">
        {t(code, label)}
      </div>
      <div className="col-span-2 text-[12.5px] text-foreground break-all">{value}</div>
    </div>
  );
}

function DrawerSection({
  title,
  code,
  children,
}: {
  title: string;
  code: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-border px-5 py-4 first:border-t-0">
      <h3 className="mb-2 text-[11.5px] font-semibold uppercase tracking-wider text-muted-foreground">
        {t(code, title)}
      </h3>
      <div className="divide-y divide-border/60">{children}</div>
    </section>
  );
}

export function DomainDetailsDrawer({
  domain,
  open,
  onOpenChange,
}: {
  domain: Domain | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full p-0 sm:max-w-[480px]">
        <SheetHeader className="border-b border-border bg-surface px-5 py-3.5 text-left">
          <SheetTitle className="text-[15px] font-semibold">
            {t("ADMIN_DOMAIN_DRAWER_TITLE", "Domain details")}
          </SheetTitle>
          {domain && (
            <SheetDescription className="text-[12px] font-mono break-all">
              {domain.url}
            </SheetDescription>
          )}
        </SheetHeader>

        {domain && (
          <div className="flex h-[calc(100%-56px)] flex-col">
            <div className="flex-1 overflow-y-auto">
              <Can perm="DOMAIN_VIEW">
                <DrawerSection title="Identity" code="ADMIN_DOMAIN_SEC_IDENTITY">
                  <DrawerField label="Domain URL" code="ADMIN_F_DOMAIN_URL" value={<span className="font-mono">{domain.url}</span>} />
                  <DrawerField label="Scope" code="ADMIN_F_SCOPE" value={domain.scope} />
                  <DrawerField label="Account" code="ADMIN_F_ACCOUNT" value={domain.account} />
                  <DrawerField label="Environment" code="ADMIN_F_ENV" value={<EnvBadge env={domain.environment} />} />
                </DrawerSection>
              </Can>
              <Can perm="DOMAIN_VIEW">
                <DrawerSection title="Readiness" code="ADMIN_DOMAIN_SEC_READINESS">
                  <DrawerField label="Status" code="ADMIN_F_STATUS" value={<DomainStatusBadge status={domain.status} />} />
                  <DrawerField label="DNS" code="ADMIN_F_DNS" value={<DnsStatusBadge value={domain.dns} />} />
                  <DrawerField label="SSL/TLS" code="ADMIN_F_SSL" value={<SslStatusBadge value={domain.ssl} />} />
                  <DrawerField label="Last checked" code="ADMIN_F_LAST_CHECKED" value={domain.lastChecked} />
                </DrawerSection>
              </Can>
              <Can perm="DOMAIN_VIEW">
                <DrawerSection title="Configuration" code="ADMIN_DOMAIN_SEC_CONFIG">
                  <DrawerField label="Managed by" code="ADMIN_F_MANAGED_BY" value={domain.managedBy} />
                  <DrawerField label="Certificate owner" code="ADMIN_F_CERT_OWNER" value={domain.certificateOwner} />
                  <DrawerField label="Notes" code="ADMIN_F_NOTES" value={domain.notes ?? "-"} />
                </DrawerSection>
              </Can>
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-border bg-surface px-5 py-3">
              <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
                {t("ADMIN_CLOSE", "Close")}
              </Button>
              <Can perm="DOMAIN_VERIFY">
                <Button variant="outline" size="sm" onClick={noopAction}>
                  <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
                  {t("ADMIN_DOMAIN_VERIFY", "Verify domain")}
                </Button>
              </Can>
              <Can perm="DOMAIN_EDIT">
                <Button size="sm" onClick={noopAction}>
                  {t("ADMIN_DOMAIN_EDIT", "Edit domain")}
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
/* Add domain drawer                                                  */
/* ------------------------------------------------------------------ */

type AddDomainForm = {
  url: string;
  scope: DomainScope;
  account: string;
  environment: DomainEnv;
  managedBy: ManagedBy;
  certificateOwner: CertOwner;
};

const EMPTY_FORM: AddDomainForm = {
  url: "",
  scope: "Platform",
  account: "",
  environment: "Production",
  managedBy: "Platform Operator",
  certificateOwner: "Platform Operator",
};

export function AddDomainDrawer({
  open,
  onOpenChange,
  accounts,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accounts: string[];
}) {
  const [form, setForm] = useState<AddDomainForm>(EMPTY_FORM);

  const handleSave = () => {
    toast(t("ADMIN_DOMAIN_SAVED", "Domain saved in prototype"));
    setForm(EMPTY_FORM);
    onOpenChange(false);
  };
  const handleCancel = () => {
    setForm(EMPTY_FORM);
    onOpenChange(false);
  };

  const accountOptions = accounts.length > 0 ? accounts : ["Platform"];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full p-0 sm:max-w-[480px]">
        <SheetHeader className="border-b border-border bg-surface px-5 py-3.5 text-left">
          <SheetTitle className="text-[15px] font-semibold">
            {t("ADMIN_DOMAIN_ADD", "Add domain")}
          </SheetTitle>
          <SheetDescription className="text-[12px]">
            {t("ADMIN_DOMAIN_ADD_DESC", "Register a new platform or account URL.")}
          </SheetDescription>
        </SheetHeader>

        <div className="flex h-[calc(100%-56px)] flex-col">
          <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
            <FormField label={t("ADMIN_F_DOMAIN_URL", "Domain URL")}>
              <Input
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
                placeholder="https://cms.example.org"
                className="h-9 text-[12.5px]"
              />
            </FormField>
            <FormField label={t("ADMIN_F_SCOPE", "Scope")}>
              <FormSelect
                value={form.scope}
                onChange={(v) => setForm({ ...form, scope: v as DomainScope })}
                options={["Platform", "Admin Console", "API Gateway", "Account", "Demo"]}
              />
            </FormField>
            <FormField label={t("ADMIN_F_ACCOUNT", "Account")}>
              <FormSelect
                value={form.account || accountOptions[0]}
                onChange={(v) => setForm({ ...form, account: v })}
                options={accountOptions}
              />
            </FormField>
            <FormField label={t("ADMIN_F_ENV", "Environment")}>
              <FormSelect
                value={form.environment}
                onChange={(v) => setForm({ ...form, environment: v as DomainEnv })}
                options={["Sandbox", "UAT", "Production"]}
              />
            </FormField>
            <FormField label={t("ADMIN_F_MANAGED_BY", "Managed by")}>
              <FormSelect
                value={form.managedBy}
                onChange={(v) => setForm({ ...form, managedBy: v as ManagedBy })}
                options={MANAGED_BY_OPTIONS}
              />
            </FormField>
            <FormField label={t("ADMIN_F_CERT_OWNER", "Certificate owner")}>
              <FormSelect
                value={form.certificateOwner}
                onChange={(v) => setForm({ ...form, certificateOwner: v as CertOwner })}
                options={CERT_OWNER_OPTIONS}
              />
            </FormField>
          </div>
          <div className="flex items-center justify-end gap-2 border-t border-border bg-surface px-5 py-3">
            <Button variant="ghost" size="sm" onClick={handleCancel}>
              {t("ADMIN_CANCEL", "Cancel")}
            </Button>
            <Button size="sm" onClick={handleSave}>
              {t("ADMIN_SAVE", "Save")}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[12px] font-medium text-foreground">{label}</label>
      {children}
    </div>
  );
}

function FormSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-9 text-[12.5px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o} value={o} className="text-[12.5px]">
            {o}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                               */
/* ------------------------------------------------------------------ */

function DomainsPage() {
  const [domains] = useState<Domain[]>(SAMPLE_DOMAINS);
  const [filters, setFilters] = useState<DomainFilters>({
    q: "",
    scope: "All",
    env: "All",
    status: "All",
    account: "All",
  });
  const [selected, setSelected] = useState<Domain | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  const accounts = useMemo(
    () => Array.from(new Set(domains.map((d) => d.account))),
    [domains],
  );

  const filtered = useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    return domains.filter((d) => {
      if (q && !d.url.toLowerCase().includes(q) && !d.account.toLowerCase().includes(q)) return false;
      if (filters.scope !== "All" && d.scope !== filters.scope) return false;
      if (filters.env !== "All" && d.environment !== filters.env) return false;
      if (filters.status !== "All" && d.status !== filters.status) return false;
      if (filters.account !== "All" && d.account !== filters.account) return false;
      return true;
    });
  }, [domains, filters]);

  const onView = (d: Domain) => {
    setSelected(d);
    setViewOpen(true);
  };

  const verifyAll = () =>
    toast(t("ADMIN_DOMAIN_VERIFY_ALL_NOOP", "Verification not configured in prototype"));

  return (
    <div className="flex h-full flex-col">
      <AdminPageHeader
        title={t("ADMIN_DOMAINS_TITLE", "Domains")}
        subtitle={t(
          "ADMIN_DOMAINS_SUBTITLE",
          "Manage platform URLs, account URLs, DNS status, and SSL readiness.",
        )}
        actions={
          <div className="flex gap-2">
            <Can perm="DOMAIN_VERIFY">
              <Button variant="outline" size="sm" onClick={verifyAll}>
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                {t("ADMIN_DOMAIN_VERIFY_ALL", "Verify all")}
              </Button>
            </Can>
            <Can perm="DOMAIN_CREATE">
              <Button size="sm" onClick={() => setAddOpen(true)}>
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                {t("ADMIN_DOMAIN_ADD", "Add domain")}
              </Button>
            </Can>
          </div>
        }
      />
      <div className="flex-1 space-y-4 p-4 lg:p-6">
        <DomainSummaryCards domains={domains} />
        <DomainFilterBar
          filters={filters}
          accounts={accounts}
          onChange={setFilters}
        />
        <DomainsTable
          domains={filtered}
          onView={onView}
          onAdd={() => setAddOpen(true)}
        />
      </div>
      <DomainDetailsDrawer
        domain={selected}
        open={viewOpen}
        onOpenChange={setViewOpen}
      />
      <AddDomainDrawer
        open={addOpen}
        onOpenChange={setAddOpen}
        accounts={accounts}
      />
    </div>
  );
}
