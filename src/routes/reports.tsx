import { createFileRoute } from "@tanstack/react-router";
import { Download } from "lucide-react";
import { PageHeader, Panel, StatCard } from "@/components/pgr/primitives";
import { COMPLAINT_TYPES, byDepartment, byWard, dashboardSummary, trend7d, COMPLAINTS } from "@/lib/mock-data";
import { t } from "@/lib/i18n";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, Legend } from "recharts";

export const Route = createFileRoute("/reports")({
  head: () => ({ meta: [{ title: "Reports - DIGIT PGR" }] }),
  component: ReportsPage,
});

function ReportsPage() {
  const s = dashboardSummary();
  const trend = trend7d();
  const dept = byDepartment();
  const wards = byWard();

  const byType = COMPLAINT_TYPES.map((tp) => ({
    name: tp.name,
    count: COMPLAINTS.filter((c) => c.typeCode === tp.code).length,
  })).filter((r) => r.count > 0).sort((a, b) => b.count - a.count);

  return (
    <div>
      <PageHeader
        title={t("COMMON_REPORTS")}
        subtitle="Operational MIS · 7-day window · Drill-down by department, locality, type"
        primaryAction={
          <div className="flex items-center gap-2">
            <select className="h-8 rounded-sm border border-border bg-surface px-2 text-[12px]">
              <option>Last 7 days</option><option>Last 30 days</option><option>Last quarter</option>
            </select>
            <button className="inline-flex h-8 items-center gap-1.5 rounded-sm bg-primary px-3 text-[12px] font-medium text-primary-foreground hover:opacity-90">
              <Download className="h-3.5 w-3.5" /> Export CSV
            </button>
          </div>
        }
      />

      <div className="p-4 lg:p-6 space-y-4 lg:space-y-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Filed" value="293" delta="+8.4% vs previous" intent="neutral" />
          <StatCard label="Resolved" value="261" delta="89% within SLA" intent="positive" />
          <StatCard label="Avg. resolution" value={`${s.avgResolutionHrs}h`} />
          <StatCard label="CSAT" value={`${s.satisfaction}/5`} delta={`Reopen ${s.reopenRate}%`} />
        </div>

        <Panel title="Volume trend">
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-chart-3)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="var(--color-chart-3)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={{ stroke: "var(--border)" }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 4, border: "1px solid var(--border)" }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area dataKey="filed" stroke="var(--color-chart-1)" fill="url(#g1)" name="Filed" />
                <Area dataKey="resolved" stroke="var(--color-chart-3)" fill="url(#g2)" name="Resolved" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <Panel title="By department">
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dept} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="department" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={{ stroke: "var(--border)" }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 4, border: "1px solid var(--border)" }} />
                  <Bar dataKey="open" stackId="a" fill="var(--color-chart-1)" name="Open" />
                  <Bar dataKey="resolved" stackId="a" fill="var(--color-chart-3)" name="Resolved" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title="By locality">
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={wards} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="ward" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={{ stroke: "var(--border)" }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 4, border: "1px solid var(--border)" }} />
                  <Bar dataKey="total" fill="var(--color-chart-2)" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <Panel title="Top complaint types" padded={false}>
          <table className="w-full text-[13px]">
            <thead className="bg-surface-2 text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-2 text-left font-medium">{t("CS_COMPLAINT_TYPE")}</th>
                <th className="px-4 py-2 text-right font-medium">Volume</th>
                <th className="px-4 py-2 text-left font-medium pl-6">Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {byType.map((r) => {
                const pct = Math.round((r.count / COMPLAINTS.length) * 100);
                return (
                  <tr key={r.name}>
                    <td className="px-4 py-2">{r.name}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{r.count}</td>
                    <td className="px-4 py-2 pl-6">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-40 rounded-full bg-muted overflow-hidden">
                          <div className="h-full bg-primary" style={{ width: `${pct * 4}%` }} />
                        </div>
                        <span className="text-[11px] tabular-nums text-muted-foreground">{pct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Panel>
      </div>
    </div>
  );
}
