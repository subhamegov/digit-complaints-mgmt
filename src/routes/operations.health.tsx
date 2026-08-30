import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Activity,
  CheckCircle2,
  Database,
  ExternalLink,
  Gauge,
  HardDrive,
  MessageSquare,
  RefreshCw,
  Server,
  ShieldAlert,
} from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getAccountHealth } from "@/lib/health.functions";
import { useRbac } from "@/lib/rbac";

export const Route = createFileRoute("/operations/health")({
  head: () => ({
    meta: [
      { title: "Health - Account Administration" },
      { name: "description", content: "View the operational health of your Complaint Management service, connected services and supporting infrastructure." },
      { property: "og:title", content: "Health - Account Administration" },
      { property: "og:description", content: "View the operational health of your Complaint Management service, connected services and supporting infrastructure." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HealthPage,
});

const categoryIcon = {
  APPLICATION: Activity,
  INFRASTRUCTURE: Server,
  DATABASE: Database,
  INTEGRATION: Gauge,
  COMMUNICATION: MessageSquare,
  OTHER: HardDrive,
};

function HealthPage() {
  const { role, tenant, hasPermission } = useRbac();
  const [health, setHealth] = useState<Awaited<ReturnType<typeof getAccountHealth>> | null>(null);
  const [checkedAt, setCheckedAt] = useState("");

  const checkHealth = async () => {
    const result = await getAccountHealth({ data: { accountId: tenant.code, role } });
    setHealth(result);
    if (result.authorized) setCheckedAt(result.checkedAt);
  };

  useEffect(() => {
    if (hasPermission("SYSTEM_HEALTH_VIEW")) void checkHealth();
  }, [tenant.code, role, hasPermission]);

  if (health === null && hasPermission("SYSTEM_HEALTH_VIEW")) {
    return (
      <div className="p-4 lg:p-6">
        <AdminPageHeader title="Health" subtitle="View the operational health of your Complaint Management service, connected services and supporting infrastructure." />
        <div className="mt-5 border border-border bg-surface p-6 text-sm text-muted-foreground">Checking service health...</div>
      </div>
    );
  }

  if (!hasPermission("SYSTEM_HEALTH_VIEW") || health?.authorized === false) {
    return (
      <div className="p-4 lg:p-6">
        <AdminPageHeader title="Health" subtitle="View the operational health of your Complaint Management service, connected services and supporting infrastructure." />
        <div className="mt-5 border border-border bg-surface p-6 text-sm text-muted-foreground">You do not have permission to view system health.</div>
      </div>
    );
  }

  const statusUrl = health?.authorized ? health.statusDashboardUrl : null;
  const dashboards = health?.authorized ? health.grafanaDashboards : [];

  return (
    <div>
      <AdminPageHeader title="Health" subtitle="View the operational health of your Complaint Management service, connected services and supporting infrastructure." />
      <div className="space-y-6 p-4 lg:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Health summary</p>
            <p className="mt-1 text-[12px] text-muted-foreground">Account-wide operational destinations for {tenant.name}.</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => void checkHealth()} disabled={!health}>
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Refresh
          </Button>
        </div>

        <section className="border border-border bg-surface p-5" aria-labelledby="service-status-title">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm border border-primary/20 bg-primary/10 text-primary"><CheckCircle2 className="h-5 w-5" /></div>
              <div>
                <h2 id="service-status-title" className="text-[15px] font-semibold text-foreground">Service Status</h2>
                <p className="mt-1 max-w-xl text-[12.5px] text-muted-foreground">View the current availability and operational status of the Complaint Management service and its major components.</p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="gap-1.5 border-primary/30 text-primary"><CheckCircle2 className="h-3 w-3" /> Available</Badge>
                  {checkedAt && <span className="text-[11px] text-muted-foreground">Last checked {formatCheckedAt(checkedAt)}</span>}
                </div>
              </div>
            </div>
            {statusUrl && <Button asChild size="sm"><a href={statusUrl} target="_blank" rel="noopener noreferrer">View status dashboard <ExternalLink className="ml-1.5 h-3.5 w-3.5" /></a></Button>}
          </div>
          <p className="mt-4 border-t border-border pt-3 text-[11px] text-muted-foreground">Opens an external operational dashboard in a new browser tab.</p>
        </section>

        <section aria-labelledby="dashboards-title">
          <div className="mb-3 flex items-end justify-between gap-3">
            <div><h2 id="dashboards-title" className="text-[15px] font-semibold text-foreground">Operational dashboards</h2><p className="mt-1 text-[12.5px] text-muted-foreground">Detailed operational metrics, application performance and service telemetry.</p></div>
            <span className="text-[11px] text-muted-foreground">{dashboards.length} available</span>
          </div>
          {dashboards.length === 0 ? <div className="border border-dashed border-border bg-surface px-5 py-10 text-center"><ShieldAlert className="mx-auto h-5 w-5 text-muted-foreground" /><h3 className="mt-3 text-[14px] font-semibold text-foreground">No Grafana dashboards configured</h3><p className="mx-auto mt-1 max-w-md text-[12.5px] text-muted-foreground">Operational dashboards will appear here when they are available for this account.</p></div> : <div className="grid gap-3 md:grid-cols-2">{dashboards.map((dashboard) => { const Icon = categoryIcon[dashboard.category]; return <div key={dashboard.id} className="flex min-h-[160px] flex-col justify-between border border-border bg-surface p-4"><div className="flex items-start gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border border-border bg-background text-muted-foreground"><Icon className="h-4 w-4" /></div><div><h3 className="text-[13px] font-semibold text-foreground">{dashboard.name}</h3><p className="mt-1 text-[12px] leading-5 text-muted-foreground">{dashboard.description}</p></div></div><div className="mt-5 flex items-center justify-between gap-3 border-t border-border pt-3"><span className="text-[10px] uppercase tracking-wide text-muted-foreground">Grafana dashboard</span><Button asChild variant="outline" size="sm"><a href={dashboard.url} target="_blank" rel="noopener noreferrer">Open Grafana <ExternalLink className="ml-1.5 h-3.5 w-3.5" /></a></Button></div></div>; })}</div>}
        </section>
      </div>
    </div>
  );
}

function formatCheckedAt(value: string) {
  try { return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)); } catch { return value; }
}
