import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, Download, ArrowRight } from "lucide-react";
import {
  PageHeader, StatCard, Panel, StatusBadge, SlaBadge,
  ActionButton, OwnerCell, DataTable, nextActionFor, type Column,
} from "@/components/pgr/primitives";
import { useRbac } from "@/lib/rbac";
import { t } from "@/lib/i18n";
import {
  dashboardSummary, byDepartment, byWard, trend7d, COMPLAINTS, complaintTypeOf,
  type Complaint,
} from "@/lib/mock-data";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar,
} from "recharts";


export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — DIGIT PGR" }] }),
  component: DashboardPage,
});

function DashboardPage() {
  const s = dashboardSummary();
  const dept = byDepartment();
  const wards = byWard();
  const trend = trend7d();
  const { jurisdiction } = useRbac();

  const recent = COMPLAINTS.slice(0, 6);

  return (
    <div>
      <PageHeader
        title={t("CS_DASHBOARD_TITLE")}
        subtitle={`Operational view · ${jurisdiction.name} · Last 7 days`}
        primaryAction={
          <div className="flex gap-2">
            <ActionButton variant="secondary" icon={<Download className="h-3.5 w-3.5" />}>{t("COMMON_EXPORT")}</ActionButton>
            <Link to="/complaints/new">
              <ActionButton permission="PGR_COMPLAINT_CREATE" variant="primary" icon={<Plus className="h-3.5 w-3.5" />}>
                {t("ACTION_REGISTER")}
              </ActionButton>
            </Link>
          </div>
        }
      />

      <div className="p-6 space-y-5">
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-3">
          <StatCard label={t("CS_TOTAL_COMPLAINTS")} value={s.total} delta="+12 vs last week" />
          <StatCard label={t("CS_OPEN_COMPLAINTS")} value={s.open} intent="warning" delta="4 nearing breach" />
          <StatCard label={t("CS_RESOLVED_COMPLAINTS")} value={s.resolved} intent="positive" delta="87% within SLA" />
          <StatCard label={t("CS_SLA_BREACHED")} value={s.breached} intent="negative" delta="Escalation L2 active" />
          <StatCard label={t("CS_AVG_RESOLUTION")} value={`${s.avgResolutionHrs}h`} delta="Target: 36h" />
          <StatCard label={t("CS_REOPEN_RATE")} value={`${s.reopenRate}%`} delta={`CSAT ${s.satisfaction}/5`} />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <Panel title="Complaints filed vs resolved — last 7 days" className="xl:col-span-2">
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={{ stroke: "var(--border)" }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 4, border: "1px solid var(--border)" }} />
                  <Line type="monotone" dataKey="filed" stroke="var(--color-chart-1)" strokeWidth={2} dot={{ r: 3 }} name="Filed" />
                  <Line type="monotone" dataKey="resolved" stroke="var(--color-chart-3)" strokeWidth={2} dot={{ r: 3 }} name="Resolved" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title="Complaints by locality">
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={wards} dataKey="total" nameKey="ward" innerRadius={50} outerRadius={85} paddingAngle={2}>
                    {wards.map((_, i) => (
                      <Cell key={i} fill={`var(--color-chart-${(i % 5) + 1})`} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 4, border: "1px solid var(--border)" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="mt-2 space-y-1 text-[12px]">
              {wards.map((w, i) => (
                <li key={w.ward} className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-sm" style={{ background: `var(--color-chart-${(i % 5) + 1})` }} />
                    {w.ward}
                  </span>
                  <span className="tabular-nums text-muted-foreground">{w.total}</span>
                </li>
              ))}
            </ul>
          </Panel>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <Panel title="By department — open vs resolved" className="xl:col-span-2">
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dept} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="department" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={{ stroke: "var(--border)" }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 4, border: "1px solid var(--border)" }} />
                  <Bar dataKey="open" fill="var(--color-chart-1)" name="Open" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="resolved" fill="var(--color-chart-3)" name="Resolved" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="breached" fill="var(--color-chart-4)" name="Breached" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title="Recent activity" action={<Link to="/inbox" className="text-[12px] text-primary hover:underline inline-flex items-center gap-1">View inbox <ArrowRight className="h-3 w-3" /></Link>} padded={false}>
            <ul className="divide-y divide-border">
              {recent.map((c) => (
                <li key={c.id}>
                  <Link to="/inbox/$id" params={{ id: c.id }} className="flex items-start gap-3 px-4 py-2.5 hover:bg-muted/50">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
                        <span className="font-mono">{c.id}</span>
                        <span>·</span>
                        <span>{c.ward}</span>
                      </div>
                      <div className="mt-0.5 truncate text-[13px] font-medium text-foreground">
                        {complaintTypeOf(c.typeCode)?.name}
                      </div>
                    </div>
                    <StatusBadge status={c.status} />
                  </Link>
                </li>
              ))}
            </ul>
          </Panel>
        </div>

        <Panel title="SLA at risk — next 24 hours" padded={false}>
          <table className="w-full text-[13px]">
            <thead className="bg-surface-2 text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-2 text-left font-medium">{t("CS_COMPLAINT_NO")}</th>
                <th className="px-4 py-2 text-left font-medium">{t("CS_COMPLAINT_TYPE")}</th>
                <th className="px-4 py-2 text-left font-medium">{t("COMMON_WARD")}</th>
                <th className="px-4 py-2 text-left font-medium">{t("CS_DEPARTMENT")}</th>
                <th className="px-4 py-2 text-left font-medium">{t("CS_SLA_STATUS")}</th>
                <th className="px-4 py-2 text-left font-medium">{t("CS_COMPLAINT_STATUS")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {COMPLAINTS.filter(c => c.slaState !== "WITHIN" && c.status !== "RESOLVED" && c.status !== "REJECTED").slice(0, 5).map((c) => (
                <tr key={c.id} className="hover:bg-muted/40">
                  <td className="px-4 py-2 font-mono text-[12px]"><Link to="/inbox/$id" params={{ id: c.id }} className="text-primary hover:underline">{c.id}</Link></td>
                  <td className="px-4 py-2">{complaintTypeOf(c.typeCode)?.name}</td>
                  <td className="px-4 py-2">{c.ward}</td>
                  <td className="px-4 py-2">{c.department}</td>
                  <td className="px-4 py-2"><SlaBadge state={c.slaState} remainingHrs={c.slaRemainingHrs} /></td>
                  <td className="px-4 py-2"><StatusBadge status={c.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>
    </div>
  );
}
