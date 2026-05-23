import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel } from "@/components/pgr/primitives";
import { Can } from "@/lib/rbac";
import { t } from "@/lib/i18n";
import { ArrowRight } from "lucide-react";

export const Route = createFileRoute("/config/workflow")({
  head: () => ({ meta: [{ title: "Workflow & SLA — DIGIT PGR" }] }),
  component: WorkflowConfigPage,
});

const STATES = ["OPEN", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "CLOSED", "REJECTED", "REOPENED"];

const TRANSITIONS = [
  { from: "OPEN", action: "ASSIGN", to: "ASSIGNED", role: "GRO", sla: "2h" },
  { from: "OPEN", action: "REJECT", to: "REJECTED", role: "GRO", sla: "2h" },
  { from: "ASSIGNED", action: "PICKUP", to: "IN_PROGRESS", role: "LME", sla: "4h" },
  { from: "ASSIGNED", action: "REASSIGN", to: "ASSIGNED", role: "GRO / DEPT_HEAD", sla: "—" },
  { from: "IN_PROGRESS", action: "RESOLVE", to: "RESOLVED", role: "LME", sla: "Per type" },
  { from: "RESOLVED", action: "REOPEN", to: "REOPENED", role: "CITIZEN", sla: "Within 7d" },
  { from: "RESOLVED", action: "CLOSE", to: "CLOSED", role: "Auto (7d)", sla: "—" },
];

const ESCALATION_MATRIX = [
  { trigger: "SLA breached", level: "L1", route: "Supervisor", actionWindow: "0–24h after breach" },
  { trigger: "L1 unresolved 24h", level: "L2", route: "Department Head", actionWindow: "24–48h" },
  { trigger: "L2 unresolved 48h", level: "L3", route: "Commissioner", actionWindow: "48h+" },
];

function WorkflowConfigPage() {
  return (
    <div>
      <PageHeader
        breadcrumbs={[{ label: t("COMMON_CONFIGURATION") }, { label: "Workflow & SLA" }]}
        title="Workflow Definition"
        subtitle="State machine, role-permitted transitions, and SLA escalation matrix"
      />

      <div className="p-6 space-y-4">
        <Panel title="States">
          <div className="flex flex-wrap items-center gap-2">
            {STATES.map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <span className="rounded-sm border border-border bg-surface-2 px-2.5 py-1 text-[12px] font-medium">{s}</span>
                {i < STATES.length - 1 && <ArrowRight className="h-3 w-3 text-muted-foreground" />}
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Transitions" padded={false}>
          <table className="w-full text-[13px]">
            <thead className="bg-surface-2 text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-2 text-left font-medium">From</th>
                <th className="px-4 py-2 text-left font-medium">Action</th>
                <th className="px-4 py-2 text-left font-medium">To</th>
                <th className="px-4 py-2 text-left font-medium">Permitted role</th>
                <th className="px-4 py-2 text-left font-medium">SLA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {TRANSITIONS.map((tr, i) => (
                <tr key={i} className="hover:bg-muted/40">
                  <td className="px-4 py-2 font-mono text-[12px]">{tr.from}</td>
                  <td className="px-4 py-2">{tr.action}</td>
                  <td className="px-4 py-2 font-mono text-[12px]">{tr.to}</td>
                  <td className="px-4 py-2">{tr.role}</td>
                  <td className="px-4 py-2 tabular-nums">{tr.sla}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <Panel title="Escalation matrix" action={
          <Can perm="MDMS_WORKFLOW_MANAGE">
            <button className="h-7 rounded-sm border border-border bg-surface px-2.5 text-[11px] hover:bg-muted">{t("COMMON_EDIT")}</button>
          </Can>
        } padded={false}>
          <table className="w-full text-[13px]">
            <thead className="bg-surface-2 text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-2 text-left font-medium">Trigger</th>
                <th className="px-4 py-2 text-left font-medium">Level</th>
                <th className="px-4 py-2 text-left font-medium">Routes to</th>
                <th className="px-4 py-2 text-left font-medium">Action window</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {ESCALATION_MATRIX.map((row) => (
                <tr key={row.level}>
                  <td className="px-4 py-2">{row.trigger}</td>
                  <td className="px-4 py-2"><span className="rounded-sm bg-status-progress-bg px-2 py-0.5 text-[11px] font-medium text-status-progress">{row.level}</span></td>
                  <td className="px-4 py-2">{row.route}</td>
                  <td className="px-4 py-2 text-muted-foreground">{row.actionWindow}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>
    </div>
  );
}
