import { createFileRoute } from "@tanstack/react-router";
import { AdminPageHeader } from "@/components/admin/AdminLayout";
import { dashboardSummary, trend7d, byDepartment, AUDIT_LOG } from "@/lib/mock-data";
import {
  Inbox,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Users,
  Globe2,
  Bell,
  Plug,
  TrendingUp,
} from "lucide-react";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";

export const Route = createFileRoute("/admin/dashboards/live")({
  head: () => ({ meta: [{ title: "Live Dashboard — Account Administrator" }] }),
  component: LiveDashboardPage,
});

function formatStableDateTime(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())} UTC`;
}

function LiveDashboardPage() {
  const s = dashboardSummary();
  const trend = trend7d();
  const depts = byDepartment();

  const stats = [
    { label: "Total Complaints", value: s.total.toLocaleString("en-US"), icon: Inbox, tone: "text-foreground" },
    { label: "Open Complaints", value: s.open.toLocaleString("en-US"), icon: AlertTriangle, tone: "text-amber-600" },
    { label: "Resolved Complaints", value: s.resolved.toLocaleString("en-US"), icon: CheckCircle2, tone: "text-emerald-600" },
    { label: "SLA Compliance", value: "92.4%", icon: TrendingUp, tone: "text-emerald-600" },
    { label: "Avg Resolution Time", value: `${s.avgResolutionHrs}h`, icon: Clock, tone: "text-foreground" },
    { label: "Active Users", value: "248", icon: Users, tone: "text-foreground" },
    { label: "Active Sources", value: "8", icon: Globe2, tone: "text-foreground" },
    { label: "Active Channels", value: "6", icon: Bell, tone: "text-foreground" },
    { label: "Integration Health", value: "All Green", icon: Plug, tone: "text-emerald-600" },
  ];

  return (
    <div className="flex h-full flex-col">
      <AdminPageHeader
        title="Live Dashboard"
        subtitle="Operational summary across complaints, users, channels, and integrations."
      />
      <div className="flex-1 space-y-6 p-4 lg:p-6">
        <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="rounded-sm border border-border bg-surface p-3.5">
                <div className="flex items-center justify-between">
                  <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    {stat.label}
                  </div>
                  <Icon className={`h-3.5 w-3.5 ${stat.tone}`} />
                </div>
                <div className={`mt-1.5 text-[20px] font-semibold ${stat.tone}`}>{stat.value}</div>
              </div>
            );
          })}
        </section>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-sm border border-border bg-surface p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-[13px] font-semibold text-foreground">
                Complaints — Filed vs Resolved (7 days)
              </h3>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend} margin={{ top: 6, right: 8, left: -16, bottom: 0 }}>
                  <defs>
                    <linearGradient id="filed" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="oklch(0.55 0.18 250)" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="oklch(0.55 0.18 250)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="resolved" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="oklch(0.65 0.16 150)" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="oklch(0.65 0.16 150)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="oklch(0.92 0.005 250)" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="oklch(0.6 0.01 250)" />
                  <YAxis tick={{ fontSize: 11 }} stroke="oklch(0.6 0.01 250)" />
                  <Tooltip />
                  <Area type="monotone" dataKey="filed" stroke="oklch(0.55 0.18 250)" fill="url(#filed)" strokeWidth={2} />
                  <Area type="monotone" dataKey="resolved" stroke="oklch(0.55 0.16 150)" fill="url(#resolved)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-sm border border-border bg-surface p-4">
            <h3 className="mb-3 text-[13px] font-semibold text-foreground">Load by Department</h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={depts} margin={{ top: 6, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid stroke="oklch(0.92 0.005 250)" vertical={false} />
                  <XAxis dataKey="department" tick={{ fontSize: 10 }} stroke="oklch(0.6 0.01 250)" />
                  <YAxis tick={{ fontSize: 11 }} stroke="oklch(0.6 0.01 250)" />
                  <Tooltip />
                  <Bar dataKey="open" stackId="a" fill="oklch(0.65 0.15 60)" />
                  <Bar dataKey="resolved" stackId="a" fill="oklch(0.65 0.16 150)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-sm border border-border bg-surface p-4">
            <h3 className="mb-3 text-[13px] font-semibold text-foreground">Recent Activity</h3>
            <ul className="divide-y divide-border">
              {AUDIT_LOG.slice(0, 6).map((a) => (
                <li key={`${a.entityId}-${a.at}`} className="py-2 text-[12.5px]">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-medium text-foreground">
                        {a.actor}{" "}
                        <span className="font-normal text-muted-foreground">
                          {a.action.replace(/_/g, " ").toLowerCase()} {a.entity.toLowerCase()} {a.entityId}
                        </span>
                      </div>
                      {a.meta && (
                        <div className="mt-0.5 text-[11.5px] text-muted-foreground">{a.meta}</div>
                      )}
                    </div>
                    <div className="shrink-0 text-[11px] text-muted-foreground">
                      {formatStableDateTime(a.at)}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-sm border border-border bg-surface p-4">
            <h3 className="mb-3 text-[13px] font-semibold text-foreground">Alerts</h3>
            <ul className="space-y-2">
              <AlertRow tone="amber" title={`${s.breached} complaints breached SLA`} body="Review escalations under Monitoring & Analytics." />
              <AlertRow tone="emerald" title="Integration health: all systems operational" body="GIS, Identity Provider, Notification Gateway responding normally." />
              <AlertRow tone="slate" title={`Reopen rate at ${s.reopenRate}%`} body="Within target threshold of 15%." />
              <AlertRow tone="slate" title={`Citizen satisfaction: ${s.satisfaction} / 5`} body="Rolling 30-day average across resolved complaints." />
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}

function AlertRow({ tone, title, body }: { tone: "amber" | "emerald" | "slate"; title: string; body: string }) {
  const toneClass =
    tone === "amber"
      ? "border-amber-300/60 bg-amber-50/70"
      : tone === "emerald"
        ? "border-emerald-300/60 bg-emerald-50/70"
        : "border-border bg-background";
  return (
    <li className={`rounded-sm border px-3 py-2 ${toneClass}`}>
      <div className="text-[12.5px] font-medium text-foreground">{title}</div>
      <div className="mt-0.5 text-[11.5px] text-muted-foreground">{body}</div>
    </li>
  );
}
