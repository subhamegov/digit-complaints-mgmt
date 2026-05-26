import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader, Panel } from "@/components/pgr/primitives";
import { ESCALATIONS, complaintTypeOf, officerOf } from "@/lib/mock-data";
import { Can } from "@/lib/rbac";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/escalations")({
  head: () => ({ meta: [{ title: "Escalations — DIGIT PGR" }] }),
  component: EscalationPage,
});

const LEVEL_TOK = {
  L1: { bg: "bg-status-progress-bg", fg: "text-status-progress", label: "L1 — Supervisor" },
  L2: { bg: "bg-status-overdue-bg", fg: "text-status-overdue", label: "L2 — Department Head" },
  L3: { bg: "bg-status-breach-bg", fg: "text-status-breach", label: "L3 — Commissioner" },
} as const;

function EscalationPage() {
  const byLevel = {
    L1: ESCALATIONS.filter((e) => e.level === "L1"),
    L2: ESCALATIONS.filter((e) => e.level === "L2"),
    L3: ESCALATIONS.filter((e) => e.level === "L3"),
  };

  return (
    <div>
      <PageHeader title={t("CS_ESCALATIONS")} subtitle="Complaints breaching SLA — routed by escalation matrix" />

      <div className="p-4 lg:p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {(Object.keys(byLevel) as Array<keyof typeof byLevel>).map((lvl) => {
            const tok = LEVEL_TOK[lvl];
            return (
              <div key={lvl} className="rounded border border-border bg-surface p-4">
                <div className="flex items-center justify-between">
                  <span className={cn("rounded-sm px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide", tok.bg, tok.fg)}>{tok.label}</span>
                  <span className="text-[22px] font-semibold tabular-nums">{byLevel[lvl].length}</span>
                </div>
                <div className="mt-2 text-[12px] text-muted-foreground">Active complaints at this level</div>
              </div>
            );
          })}
        </div>

        <Panel title="Active escalations" padded={false}>
          <table className="w-full text-[13px]">
            <thead className="bg-surface-2 text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-2 text-left font-medium">Level</th>
                <th className="px-4 py-2 text-left font-medium">{t("CS_COMPLAINT_NO")}</th>
                <th className="px-4 py-2 text-left font-medium">{t("CS_COMPLAINT_TYPE")}</th>
                <th className="px-4 py-2 text-left font-medium">{t("CS_DEPARTMENT")}</th>
                <th className="px-4 py-2 text-left font-medium">{t("CS_ASSIGNED_OFFICER")}</th>
                <th className="px-4 py-2 text-left font-medium">Breached by</th>
                <th className="px-4 py-2 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {ESCALATIONS.map((e) => {
                const tok = LEVEL_TOK[e.level as keyof typeof LEVEL_TOK];
                const officer = officerOf(e.assignedOfficerId);
                return (
                  <tr key={e.id} className="hover:bg-muted/40">
                    <td className="px-4 py-2"><span className={cn("rounded-sm px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide", tok.bg, tok.fg)}>{e.level}</span></td>
                    <td className="px-4 py-2 font-mono text-[12px]"><Link to="/inbox/$id" params={{ id: e.id }} className="text-primary hover:underline">{e.id}</Link></td>
                    <td className="px-4 py-2">{complaintTypeOf(e.typeCode)?.name}</td>
                    <td className="px-4 py-2">{e.department}</td>
                    <td className="px-4 py-2 text-[12px]">{officer?.name ?? <span className="italic text-muted-foreground">Unassigned</span>}</td>
                    <td className="px-4 py-2 tabular-nums text-status-breach">{e.breachedBy}h</td>
                    <td className="px-4 py-2 text-right">
                      <Can perm="PGR_COMPLAINT_REASSIGN">
                        <button className="h-7 rounded-sm border border-border bg-surface px-2 text-[11px] hover:bg-muted">{t("ACTION_REASSIGN")}</button>
                      </Can>{" "}
                      <Can perm="PGR_COMPLAINT_ESCALATE">
                        <button className="h-7 rounded-sm bg-status-breach px-2 text-[11px] font-medium text-destructive-foreground hover:opacity-90">{t("ACTION_ESCALATE")}</button>
                      </Can>
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
