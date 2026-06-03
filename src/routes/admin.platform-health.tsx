/**
 * Platform Administrator — Platform Health page.
 *
 * Surfaces Gatus-based health monitoring and lets administrators
 * configure SMTP email alerts. All actions are prototype-only (toast
 * feedback). RBAC- and i18n-ready.
 */

import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  ExternalLink,
  Send,
  Activity,
  AlertTriangle,
  Save,
  Mail,
  Eye,
  EyeOff,
} from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminLayout";
import { Can } from "@/lib/rbac";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/admin/platform-health")({
  head: () => ({ meta: [{ title: "Platform Health — Platform Administration" }] }),
  component: PlatformHealthPage,
});

/* ------------------------------------------------------------------ */
/* Types & sample data                                                */
/* ------------------------------------------------------------------ */

type EndpointStatus = "Healthy" | "Degraded" | "Failing" | "Unknown";
type CheckType = "HTTP" | "DNS" | "TLS" | "TCP";

type MonitoredEndpoint = {
  id: string;
  name: string;
  url: string;
  group: string;
  checkType: CheckType;
  status: EndpointStatus;
  interval: string;
  responseTime: string;
  lastChecked: string;
  alertsOn: boolean;
};

const SAMPLE_ENDPOINTS: MonitoredEndpoint[] = [
  {
    id: "admin",
    name: "Admin Console",
    url: "https://admin.cms.example.org/health",
    group: "core",
    checkType: "HTTP",
    status: "Healthy",
    interval: "1m",
    responseTime: "120 ms",
    lastChecked: "2 min ago",
    alertsOn: true,
  },
  {
    id: "api",
    name: "API Gateway",
    url: "https://api.cms.example.org/health",
    group: "core",
    checkType: "HTTP",
    status: "Failing",
    interval: "1m",
    responseTime: "Timeout",
    lastChecked: "2 min ago",
    alertsOn: true,
  },
  {
    id: "web",
    name: "Citizen Web",
    url: "https://cms.example.org",
    group: "frontend",
    checkType: "HTTP",
    status: "Healthy",
    interval: "5m",
    responseTime: "210 ms",
    lastChecked: "4 min ago",
    alertsOn: true,
  },
  {
    id: "dns",
    name: "DNS Check",
    url: "cms.example.org",
    group: "network",
    checkType: "DNS",
    status: "Healthy",
    interval: "10m",
    responseTime: "42 ms",
    lastChecked: "6 min ago",
    alertsOn: false,
  },
  {
    id: "cert",
    name: "Certificate Expiry",
    url: "https://cms.example.org",
    group: "security",
    checkType: "TLS",
    status: "Healthy",
    interval: "24h",
    responseTime: "43 days left",
    lastChecked: "1 hour ago",
    alertsOn: true,
  },
];

/* ------------------------------------------------------------------ */
/* Validation                                                         */
/* ------------------------------------------------------------------ */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const isEmail = (v: string) => EMAIL_RE.test(v.trim());
const parseRecipients = (v: string) =>
  v
    .split(/[,;\n]/)
    .map((s) => s.trim())
    .filter(Boolean);

/* ------------------------------------------------------------------ */
/* Badges                                                             */
/* ------------------------------------------------------------------ */

const BADGE_BASE =
  "inline-flex items-center rounded-sm border px-1.5 py-0.5 text-[10.5px] font-medium uppercase tracking-wide";

export function EndpointStatusBadge({ status }: { status: EndpointStatus }) {
  const cls: Record<EndpointStatus, string> = {
    Healthy:
      "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    Degraded:
      "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    Failing: "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300",
    Unknown: "border-border bg-muted text-muted-foreground",
  };
  const codes: Record<EndpointStatus, string> = {
    Healthy: "ADMIN_HEALTH_STATUS_HEALTHY",
    Degraded: "ADMIN_HEALTH_STATUS_DEGRADED",
    Failing: "ADMIN_HEALTH_STATUS_FAILING",
    Unknown: "ADMIN_HEALTH_STATUS_UNKNOWN",
  };
  return <span className={cn(BADGE_BASE, cls[status])}>{t(codes[status], status)}</span>;
}

/* ------------------------------------------------------------------ */
/* Section primitives                                                 */
/* ------------------------------------------------------------------ */

function SectionHeader({ title, code, subtitle }: { title: string; code: string; subtitle?: string }) {
  return (
    <div>
      <h2 className="text-[13.5px] font-semibold tracking-tight text-foreground">
        {t(code, title)}
      </h2>
      {subtitle && (
        <p className="mt-0.5 text-[12px] text-muted-foreground">{subtitle}</p>
      )}
    </div>
  );
}

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded border border-border bg-surface", className)}>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Warning                                                            */
/* ------------------------------------------------------------------ */

export function PlatformHealthWarning({
  title,
  body,
  actionLabel,
  onAction,
}: {
  title: string;
  body: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div className="flex items-start gap-2 rounded border border-amber-300/70 bg-amber-50/70 p-3 dark:border-amber-500/30 dark:bg-amber-500/[0.06]">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700 dark:text-amber-300" />
      <div className="min-w-0 flex-1">
        <div className="text-[12.5px] font-semibold text-foreground">{title}</div>
        <p className="mt-0.5 text-[12px] leading-snug text-muted-foreground">{body}</p>
      </div>
      <Button size="sm" variant="outline" className="h-7 text-[12px]" onClick={onAction}>
        {actionLabel}
      </Button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Section 1: Health Overview                                         */
/* ------------------------------------------------------------------ */

export function HealthSummaryCards({
  endpoints,
  lastChecked,
}: {
  endpoints: MonitoredEndpoint[];
  lastChecked: string;
}) {
  const healthy = endpoints.filter((e) => e.status === "Healthy").length;
  const failing = endpoints.filter(
    (e) => e.status === "Failing" || e.status === "Degraded",
  ).length;
  const overall: EndpointStatus =
    endpoints.some((e) => e.status === "Failing")
      ? "Degraded"
      : endpoints.some((e) => e.status === "Degraded")
        ? "Degraded"
        : endpoints.length === 0
          ? "Unknown"
          : "Healthy";

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <div className="rounded border border-border bg-surface px-3.5 py-3">
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
          {t("ADMIN_HEALTH_OVERALL", "Overall status")}
        </div>
        <div className="mt-1.5">
          <EndpointStatusBadge status={overall} />
        </div>
      </div>
      <div className="rounded border border-border bg-surface px-3.5 py-3">
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
          {t("ADMIN_HEALTH_HEALTHY", "Healthy endpoints")}
        </div>
        <div className="mt-1 text-[22px] font-semibold tabular-nums text-foreground">
          {healthy}
        </div>
      </div>
      <div className="rounded border border-border bg-surface px-3.5 py-3">
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
          {t("ADMIN_HEALTH_FAILING", "Failing endpoints")}
        </div>
        <div className="mt-1 text-[22px] font-semibold tabular-nums text-foreground">
          {failing}
        </div>
      </div>
      <div className="rounded border border-border bg-surface px-3.5 py-3">
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
          {t("ADMIN_HEALTH_LAST_CHECKED", "Last checked")}
        </div>
        <div className="mt-1 text-[13px] font-medium text-foreground">{lastChecked}</div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Gatus dashboard card                                               */
/* ------------------------------------------------------------------ */

export function GatusDashboardCard({
  url,
  onChange,
  onSave,
  onOpen,
}: {
  url: string;
  onChange: (v: string) => void;
  onSave: () => void;
  onOpen: () => void;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-[13px] font-semibold text-foreground">
            {t("ADMIN_HEALTH_GATUS_TITLE", "Gatus Dashboard")}
          </h3>
          <p className="mt-0.5 text-[12px] text-muted-foreground">
            {t(
              "ADMIN_HEALTH_GATUS_BODY",
              "Embed or preview the Gatus status page here.",
            )}
          </p>
        </div>
      </div>
      <div className="mt-3 space-y-1.5">
        <Label htmlFor="gatus-url" className="text-[12px]">
          {t("ADMIN_HEALTH_GATUS_URL", "Gatus Dashboard URL")}
        </Label>
        <Input
          id="gatus-url"
          value={url}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://status.cms.example.org"
          className="h-9 text-[12.5px]"
        />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Can perm="HEALTH_CONFIGURE">
          <Button size="sm" onClick={onSave} className="h-8 text-[12px]">
            <Save className="mr-1.5 h-3.5 w-3.5" />
            {t("ADMIN_HEALTH_SAVE_GATUS_URL", "Save dashboard URL")}
          </Button>
        </Can>
        <Button
          size="sm"
          variant="outline"
          onClick={onOpen}
          className="h-8 text-[12px]"
        >
          <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
          {t("ADMIN_HEALTH_OPEN_DASHBOARD", "Open dashboard")}
        </Button>
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Section 2: Monitored Endpoints table                               */
/* ------------------------------------------------------------------ */

export function MonitoredEndpointsTable({
  endpoints,
}: {
  endpoints: MonitoredEndpoint[];
}) {
  const headers: { code: string; label: string; className?: string }[] = [
    { code: "ADMIN_COL_ENDPOINT", label: "Endpoint" },
    { code: "ADMIN_COL_URL", label: "URL" },
    { code: "ADMIN_COL_GROUP", label: "Group" },
    { code: "ADMIN_COL_CHECK_TYPE", label: "Check type" },
    { code: "ADMIN_COL_STATUS", label: "Status" },
    { code: "ADMIN_COL_INTERVAL", label: "Interval" },
    { code: "ADMIN_COL_RESPONSE_TIME", label: "Response time" },
    { code: "ADMIN_COL_LAST_CHECKED", label: "Last checked" },
    { code: "ADMIN_COL_ALERTS", label: "Alerts" },
  ];
  return (
    <Card>
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
            {endpoints.map((e) => (
              <tr
                key={e.id}
                className="border-b border-border last:border-b-0 hover:bg-muted/30"
              >
                <td className="px-3 py-2.5 align-top font-medium text-foreground">
                  {e.name}
                </td>
                <td className="px-3 py-2.5 align-top font-mono text-[12px] text-foreground break-all">
                  {e.url}
                </td>
                <td className="px-3 py-2.5 align-top text-muted-foreground">{e.group}</td>
                <td className="px-3 py-2.5 align-top text-foreground">{e.checkType}</td>
                <td className="px-3 py-2.5 align-top">
                  <EndpointStatusBadge status={e.status} />
                </td>
                <td className="px-3 py-2.5 align-top tabular-nums text-foreground">
                  {e.interval}
                </td>
                <td className="px-3 py-2.5 align-top tabular-nums text-foreground">
                  {e.responseTime}
                </td>
                <td className="px-3 py-2.5 align-top text-muted-foreground">
                  {e.lastChecked}
                </td>
                <td className="px-3 py-2.5 align-top">
                  <span
                    className={cn(
                      BADGE_BASE,
                      e.alertsOn
                        ? "border-primary/30 bg-primary/10 text-primary"
                        : "border-border bg-muted text-muted-foreground",
                    )}
                  >
                    {e.alertsOn
                      ? t("ADMIN_ALERTS_ON", "On")
                      : t("ADMIN_ALERTS_OFF", "Off")}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Section 3: Email Alerts                                            */
/* ------------------------------------------------------------------ */

type EmailAlertsForm = {
  recipients: string;
  sender: string;
  host: string;
  port: string;
  username: string;
  password: string;
  useTls: boolean;
};

const EMPTY_ALERTS: EmailAlertsForm = {
  recipients: "",
  sender: "",
  host: "",
  port: "",
  username: "",
  password: "",
  useTls: true,
};

function validateAlerts(form: EmailAlertsForm) {
  const errors: Partial<Record<keyof EmailAlertsForm, string>> = {};
  const recipients = parseRecipients(form.recipients);
  if (recipients.length === 0)
    errors.recipients = t("ADMIN_HEALTH_ERR_RECIPIENTS", "At least one recipient is required.");
  else if (!recipients.every(isEmail))
    errors.recipients = t("ADMIN_HEALTH_ERR_RECIPIENTS_INVALID", "One or more recipients are invalid.");
  if (!form.sender.trim() || !isEmail(form.sender))
    errors.sender = t("ADMIN_HEALTH_ERR_SENDER", "Valid sender email is required.");
  if (!form.host.trim()) errors.host = t("ADMIN_HEALTH_ERR_HOST", "SMTP host is required.");
  if (!form.port.trim() || !/^\d+$/.test(form.port.trim()))
    errors.port = t("ADMIN_HEALTH_ERR_PORT", "SMTP port must be numeric.");
  return errors;
}

export function EmailAlertsConfigCard({
  form,
  onChange,
  onSave,
  onTest,
}: {
  form: EmailAlertsForm;
  onChange: (next: EmailAlertsForm) => void;
  onSave: () => void;
  onTest: () => void;
}) {
  const [showPw, setShowPw] = useState(false);
  const errors = validateAlerts(form);
  const isValid = Object.keys(errors).length === 0;

  const set = <K extends keyof EmailAlertsForm>(k: K, v: EmailAlertsForm[K]) =>
    onChange({ ...form, [k]: v });

  return (
    <Card className="p-4">
      <div className="flex items-start gap-2">
        <Mail className="mt-0.5 h-4 w-4 text-muted-foreground" />
        <div className="min-w-0">
          <h3 className="text-[13px] font-semibold text-foreground">
            {t("ADMIN_HEALTH_EMAIL_TITLE", "Email Alerts")}
          </h3>
          <p className="mt-0.5 text-[12px] text-muted-foreground">
            {t(
              "ADMIN_HEALTH_EMAIL_SUBTITLE",
              "Configure SMTP email alerts for health check failures.",
            )}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
        <Field
          label={t("ADMIN_HEALTH_F_RECIPIENTS", "Alert recipients")}
          helper={t(
            "ADMIN_HEALTH_F_RECIPIENTS_HELP",
            "Comma-separated list of email addresses.",
          )}
          error={errors.recipients}
          className="md:col-span-2"
        >
          <Input
            value={form.recipients}
            onChange={(e) => set("recipients", e.target.value)}
            placeholder="ops@example.org, admin@example.org"
            className="h-9 text-[12.5px]"
          />
        </Field>
        <Field label={t("ADMIN_HEALTH_F_SENDER", "Sender email")} error={errors.sender}>
          <Input
            value={form.sender}
            onChange={(e) => set("sender", e.target.value)}
            placeholder="alerts@example.org"
            className="h-9 text-[12.5px]"
          />
        </Field>
        <Field label={t("ADMIN_HEALTH_F_HOST", "SMTP host")} error={errors.host}>
          <Input
            value={form.host}
            onChange={(e) => set("host", e.target.value)}
            placeholder="smtp.example.org"
            className="h-9 text-[12.5px]"
          />
        </Field>
        <Field label={t("ADMIN_HEALTH_F_PORT", "SMTP port")} error={errors.port}>
          <Input
            value={form.port}
            onChange={(e) => set("port", e.target.value)}
            placeholder="587"
            inputMode="numeric"
            className="h-9 text-[12.5px]"
          />
        </Field>
        <Field label={t("ADMIN_HEALTH_F_USERNAME", "SMTP username")}>
          <Input
            value={form.username}
            onChange={(e) => set("username", e.target.value)}
            placeholder="alerts@example.org"
            className="h-9 text-[12.5px]"
          />
        </Field>
        <Field
          label={t("ADMIN_HEALTH_F_PASSWORD", "SMTP password")}
          helper={t("ADMIN_HEALTH_F_PASSWORD_HELP", "Password is masked.")}
        >
          <div className="relative">
            <Input
              type={showPw ? "text" : "password"}
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
              placeholder="••••••••"
              className="h-9 pr-9 text-[12.5px]"
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={showPw ? "Hide" : "Show"}
            >
              {showPw ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </button>
          </div>
        </Field>
        <div className="flex items-center justify-between gap-3 rounded border border-border bg-background px-3 py-2 md:col-span-2">
          <div>
            <div className="text-[12.5px] font-medium text-foreground">
              {t("ADMIN_HEALTH_F_USE_TLS", "Use TLS")}
            </div>
            <p className="text-[11.5px] text-muted-foreground">
              {t(
                "ADMIN_HEALTH_F_USE_TLS_HELP",
                "Encrypt SMTP connection. Recommended for production.",
              )}
            </p>
          </div>
          <Switch
            checked={form.useTls}
            onCheckedChange={(v) => set("useTls", v)}
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap justify-end gap-2">
        <Can perm="HEALTH_ALERT_TEST">
          <Button size="sm" variant="outline" onClick={onTest} className="h-8 text-[12px]">
            <Send className="mr-1.5 h-3.5 w-3.5" />
            {t("ADMIN_HEALTH_SEND_TEST", "Send test alert")}
          </Button>
        </Can>
        <Can perm="HEALTH_CONFIGURE">
          <Button size="sm" onClick={onSave} disabled={!isValid} className="h-8 text-[12px]">
            <Save className="mr-1.5 h-3.5 w-3.5" />
            {t("ADMIN_HEALTH_SAVE_EMAIL", "Save email alerts")}
          </Button>
        </Can>
      </div>
    </Card>
  );
}

function Field({
  label,
  helper,
  error,
  className,
  children,
}: {
  label: string;
  helper?: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label className="text-[12px]">{label}</Label>
      {children}
      {error ? (
        <p className="text-[11.5px] text-rose-600">{error}</p>
      ) : helper ? (
        <p className="text-[11.5px] text-muted-foreground">{helper}</p>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                               */
/* ------------------------------------------------------------------ */

function PlatformHealthPage() {
  const [endpoints] = useState<MonitoredEndpoint[]>(SAMPLE_ENDPOINTS);
  const [gatusUrl, setGatusUrl] = useState("");
  const [alerts, setAlerts] = useState<EmailAlertsForm>(EMPTY_ALERTS);

  const lastChecked = "2 minutes ago";
  const alertsConfigured = useMemo(
    () => Object.keys(validateAlerts(alerts)).length === 0,
    [alerts],
  );

  const openDashboard = () => {
    const url = gatusUrl.trim();
    if (!url) {
      toast(t("ADMIN_HEALTH_ADD_URL_FIRST", "Add dashboard URL first"));
      return;
    }
    if (typeof window !== "undefined") {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  const saveGatusUrl = () =>
    toast(t("ADMIN_HEALTH_GATUS_SAVED", "Dashboard URL saved in prototype"));
  const saveAlerts = () =>
    toast(t("ADMIN_HEALTH_EMAIL_SAVED", "Email alert settings saved in prototype"));
  const testAlert = () =>
    toast(t("ADMIN_HEALTH_TEST_SENT", "Test alert sent in prototype"));

  return (
    <div className="flex h-full flex-col">
      <AdminPageHeader
        title={t("ADMIN_HEALTH_TITLE", "Platform Health")}
        subtitle={t(
          "ADMIN_HEALTH_SUBTITLE",
          "Monitor platform endpoints and configure health alerts.",
        )}
        actions={
          <div className="flex gap-2">
            <Can perm="HEALTH_VIEW">
              <Button
                variant="outline"
                size="sm"
                onClick={openDashboard}
                className="h-8 text-[12px]"
              >
                <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                {t("ADMIN_HEALTH_OPEN_GATUS", "Open Gatus Dashboard")}
              </Button>
            </Can>
            <Can perm="HEALTH_ALERT_TEST">
              <Button size="sm" onClick={testAlert} className="h-8 text-[12px]">
                <Send className="mr-1.5 h-3.5 w-3.5" />
                {t("ADMIN_HEALTH_TEST_EMAIL", "Test email alert")}
              </Button>
            </Can>
          </div>
        }
      />
      <div className="flex-1 space-y-6 p-4 lg:p-6">
        <Can perm="HEALTH_VIEW">
          {!gatusUrl.trim() && (
            <PlatformHealthWarning
              title={t("ADMIN_HEALTH_WARN_GATUS_TITLE", "Gatus dashboard URL not configured.")}
              body={t(
                "ADMIN_HEALTH_WARN_GATUS_BODY",
                "Add a Gatus URL to surface the live status page here.",
              )}
              actionLabel={t("ADMIN_HEALTH_ADD_DASHBOARD_URL", "Add dashboard URL")}
              onAction={() => {
                const el = document.getElementById("gatus-url");
                el?.focus();
                el?.scrollIntoView({ behavior: "smooth", block: "center" });
              }}
            />
          )}
          {!alertsConfigured && (
            <PlatformHealthWarning
              title={t("ADMIN_HEALTH_WARN_EMAIL_TITLE", "Email alerts not configured.")}
              body={t(
                "ADMIN_HEALTH_WARN_EMAIL_BODY",
                "Configure SMTP recipients and credentials to receive failure alerts.",
              )}
              actionLabel={t("ADMIN_HEALTH_CONFIGURE_EMAIL", "Configure email alerts")}
              onAction={() => {
                const el = document.getElementById("email-alerts-section");
                el?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
            />
          )}

          <section className="space-y-3">
            <SectionHeader
              title="Health Overview"
              code="ADMIN_HEALTH_SEC_OVERVIEW"
              subtitle={t(
                "ADMIN_HEALTH_SEC_OVERVIEW_SUB",
                "Live summary of monitored endpoints.",
              )}
            />
            <HealthSummaryCards endpoints={endpoints} lastChecked={lastChecked} />
            <GatusDashboardCard
              url={gatusUrl}
              onChange={setGatusUrl}
              onSave={saveGatusUrl}
              onOpen={openDashboard}
            />
          </section>

          <section className="space-y-3">
            <SectionHeader
              title="Monitored Endpoints"
              code="ADMIN_HEALTH_SEC_ENDPOINTS"
              subtitle={t(
                "ADMIN_HEALTH_SEC_ENDPOINTS_SUB",
                "Endpoints checked by Gatus.",
              )}
            />
            {endpoints.length === 0 ? (
              <Card className="px-4 py-6 text-center text-[12.5px] text-muted-foreground">
                <Activity className="mx-auto mb-2 h-5 w-5" />
                {t("ADMIN_HEALTH_NO_ENDPOINTS", "No endpoints monitored yet.")}
              </Card>
            ) : (
              <MonitoredEndpointsTable endpoints={endpoints} />
            )}
          </section>

          <section id="email-alerts-section" className="space-y-3">
            <SectionHeader title="Email Alerts" code="ADMIN_HEALTH_SEC_EMAIL" />
            <EmailAlertsConfigCard
              form={alerts}
              onChange={setAlerts}
              onSave={saveAlerts}
              onTest={testAlert}
            />
          </section>
        </Can>
      </div>
    </div>
  );
}
