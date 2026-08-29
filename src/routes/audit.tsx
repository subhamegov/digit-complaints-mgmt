import { createFileRoute } from "@tanstack/react-router";
import { Download } from "lucide-react";
import { PageHeader, Panel } from "@/components/pgr/primitives";
import { AUDIT_LOG } from "@/lib/mock-data";
import { ROLE_LABEL, type Role } from "@/lib/rbac";
import { t } from "@/lib/i18n";

export const Route = createFileRoute("/audit")({
  head: () => ({ meta: [{ title: "Audit Log - DIGIT PGR" }] }),
  component: AuditPage,
});

function AuditPage() {
  return (
    <div>
      <PageHeader
        title={t("COMMON_AUDIT_LOG")}
        subtitle="Append-only ledger of every state-changing action"
        primaryAction={
          <button className="inline-flex h-8 items-center gap-1.5 rounded-sm border border-border bg-surface px-3 text-[12px] hover:bg-muted">
            <Download className="h-3.5 w-3.5" /> Export
          </button>
        }
      >
        <div className="flex flex-wrap items-center gap-2">
          <input placeholder="Search actor, entity, ID…" className="h-8 w-[260px] rounded-sm border border-border bg-background px-2.5 text-[12px] outline-none focus:border-primary" />
          <select className="h-8 rounded-sm border border-border bg-background px-2 text-[12px]">
            <option>All actions</option><option>ASSIGNED</option><option>RESOLVED</option><option>REJECTED</option><option>CONFIG_UPDATED</option>
          </select>
          <select className="h-8 rounded-sm border border-border bg-background px-2 text-[12px]">
            <option>All roles</option>
            {(Object.keys(ROLE_LABEL) as Role[]).map((r) => <option key={r}>{ROLE_LABEL[r]}</option>)}
          </select>
          <input type="date" className="h-8 rounded-sm border border-border bg-background px-2 text-[12px]" />
        </div>
      </PageHeader>

      <div className="p-4 lg:p-6">
        <Panel padded={false}>
          <table className="w-full text-[13px]">
            <thead className="bg-surface-2 text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-2 text-left font-medium">Timestamp</th>
                <th className="px-4 py-2 text-left font-medium">Actor</th>
                <th className="px-4 py-2 text-left font-medium">{t("COMMON_ROLE")}</th>
                <th className="px-4 py-2 text-left font-medium">Action</th>
                <th className="px-4 py-2 text-left font-medium">Entity</th>
                <th className="px-4 py-2 text-left font-medium">ID</th>
                <th className="px-4 py-2 text-left font-medium">Meta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {AUDIT_LOG.map((e, i) => (
                <tr key={i} className="hover:bg-muted/40">
                  <td className="px-4 py-2 tabular-nums text-[12px]">{new Date(e.at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</td>
                  <td className="px-4 py-2 font-medium">{e.actor}</td>
                  <td className="px-4 py-2 text-[12px]">{e.role}</td>
                  <td className="px-4 py-2">
                    <span className="rounded-sm bg-muted px-1.5 py-0.5 text-[11px] font-medium">{e.action}</span>
                  </td>
                  <td className="px-4 py-2">{e.entity}</td>
                  <td className="px-4 py-2 font-mono text-[12px] text-primary">{e.entityId}</td>
                  <td className="px-4 py-2 text-[12px] text-muted-foreground">{e.meta ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>
    </div>
  );
}
