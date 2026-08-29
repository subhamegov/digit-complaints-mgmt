import { createFileRoute } from "@tanstack/react-router";
import { Plus, Edit3 } from "lucide-react";
import { PageHeader, Panel } from "@/components/pgr/primitives";
import { COMPLAINT_TYPES } from "@/lib/mock-data";
import { Can } from "@/lib/rbac";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/config/complaint-types")({
  head: () => ({ meta: [{ title: "Complaint Types - DIGIT PGR" }] }),
  component: ComplaintTypesPage,
});

function ComplaintTypesPage() {
  return (
    <div>
      <PageHeader
        breadcrumbs={[{ label: t("COMMON_CONFIGURATION") }, { label: "Complaint Types" }]}
        title="Complaint Type Catalogue"
        subtitle="Master data driving routing, SLA, and citizen-facing forms"
        primaryAction={
          <Can perm="MDMS_COMPLAINT_TYPE_MANAGE">
            <button className="inline-flex h-8 items-center gap-1.5 rounded-sm bg-primary px-3 text-[12px] font-medium text-primary-foreground hover:opacity-90">
              <Plus className="h-3.5 w-3.5" /> Add Complaint Type
            </button>
          </Can>
        }
      />

      <div className="p-4 lg:p-6">
        <Panel padded={false}>
          <table className="w-full text-[13px]">
            <thead className="bg-surface-2 text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-2 text-left font-medium">Code</th>
                <th className="px-4 py-2 text-left font-medium">Name</th>
                <th className="px-4 py-2 text-left font-medium">{t("CS_DEPARTMENT")}</th>
                <th className="px-4 py-2 text-right font-medium">SLA (hrs)</th>
                <th className="px-4 py-2 text-left font-medium pl-6">Status</th>
                <th className="px-4 py-2 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {COMPLAINT_TYPES.map((c) => (
                <tr key={c.code} className="hover:bg-muted/40">
                  <td className="px-4 py-2 font-mono text-[12px] text-muted-foreground">{c.code}</td>
                  <td className="px-4 py-2 font-medium">{c.name}</td>
                  <td className="px-4 py-2">{c.department}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{c.slaHours}</td>
                  <td className="px-4 py-2 pl-6">
                    <span className={cn("inline-flex items-center gap-1.5 rounded-sm px-2 py-0.5 text-[11px] font-medium",
                      c.active ? "bg-status-resolved-bg text-status-resolved" : "bg-status-rejected-bg text-status-rejected"
                    )}>
                      <span className={cn("h-1.5 w-1.5 rounded-full", c.active ? "bg-status-resolved" : "bg-status-rejected")} />
                      {c.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <Can perm="MDMS_COMPLAINT_TYPE_MANAGE" fallback={<span className="text-[11px] text-muted-foreground italic">Read-only</span>}>
                      <button className="inline-flex h-7 items-center gap-1 rounded-sm border border-border bg-surface px-2 text-[11px] hover:bg-muted">
                        <Edit3 className="h-3 w-3" /> {t("COMMON_EDIT")}
                      </button>
                    </Can>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>
    </div>
  );
}
