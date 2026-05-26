import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel, StatCard, SlaBadge } from "@/components/pgr/primitives";
import { COMPLAINTS, byDepartment, complaintTypeOf } from "@/lib/mock-data";
import { t } from "@/lib/i18n";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export const Route = createFileRoute("/sla")({
  head: () => ({ meta: [{ title: "SLA Monitor — DIGIT PGR" }] }),
  component: SlaPage,
});

function SlaPage() {
  const within  = COMPLAINTS.filter((c) => c.slaState === "WITHIN").length;
  const nearing = COMPLAINTS.filter((c) => c.slaState === "NEARING").length;
  const breach  = COMPLAINTS.filter((c) => c.slaState === "BREACHED").length;
  const compliance = Math.round((within / COMPLAINTS.length) * 100);

  const slaByDept = byDepartment().map((d) => ({
    department: d.department,
    compliance: Math.max(40, 95 - d.breached * 12),
  }));

  const watch = COMPLAINTS.filter((c) => c.slaState !== "WITHIN" && c.status !== "RESOLVED" && c.status !== "REJECTED")
    .sort((a, b) => a.slaRemainingHrs - b.slaRemainingHrs);

  return (
    <div>
      <PageHeader title={t("CS_SLA_STATUS")} subtitle="Service-level adherence across active complaints" />

      <div className="p-4 lg:p-6 space-y-4 lg:space-y-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Overall compliance" value={`${compliance}%`} intent="positive" delta="Target ≥ 90%" />
          <StatCard label={t("SLA_WITHIN")} value={within} intent="positive" />
          <StatCard label={t("SLA_NEARING")} value={nearing} intent="warning" />
          <StatCard label={t("SLA_BREACHED")} value={breach} intent="negative" />
        </div>

        <Panel title="SLA compliance by department">
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={slaByDept} layout="vertical" margin={{ top: 5, right: 20, bottom: 5, left: 30 }}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="department" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} width={120} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 4, border: "1px solid var(--border)" }} />
                <Bar dataKey="compliance" fill="var(--color-chart-3)" radius={[0, 2, 2, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="SLA watchlist" padded={false}>
          <table className="w-full text-[13px]">
            <thead className="bg-surface-2 text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-2 text-left font-medium">{t("CS_COMPLAINT_NO")}</th>
                <th className="px-4 py-2 text-left font-medium">{t("CS_COMPLAINT_TYPE")}</th>
                <th className="px-4 py-2 text-left font-medium">{t("CS_DEPARTMENT")}</th>
                <th className="px-4 py-2 text-left font-medium">{t("COMMON_WARD")}</th>
                <th className="px-4 py-2 text-left font-medium">{t("CS_SLA_REMAINING")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {watch.map((c) => (
                <tr key={c.id} className="hover:bg-muted/40">
                  <td className="px-4 py-2 font-mono text-[12px] text-primary">{c.id}</td>
                  <td className="px-4 py-2">{complaintTypeOf(c.typeCode)?.name}</td>
                  <td className="px-4 py-2">{c.department}</td>
                  <td className="px-4 py-2">{c.ward}</td>
                  <td className="px-4 py-2"><SlaBadge state={c.slaState} remainingHrs={c.slaRemainingHrs} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>
    </div>
  );
}
