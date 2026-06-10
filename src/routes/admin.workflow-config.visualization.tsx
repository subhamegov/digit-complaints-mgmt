import { createFileRoute } from "@tanstack/react-router";
import { AdminPageHeader } from "@/components/admin/AdminLayout";
import { GitBranch, ArrowRight, Circle, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/admin/workflow-config/visualization")({
  head: () => ({
    meta: [{ title: "Workflow Visualization — Account Administrator" }],
  }),
  component: WorkflowVisualizationPage,
});

const STATES = [
  { key: "FILED", label: "Filed", role: "Citizen / Call Centre Agent" },
  { key: "TRIAGED", label: "Triaged", role: "Supervisor" },
  { key: "ASSIGNED", label: "Assigned", role: "Supervisor" },
  { key: "IN_PROGRESS", label: "In Progress", role: "Complaint Officer" },
  { key: "AWAITING_INFO", label: "Awaiting Info", role: "Complaint Officer" },
  { key: "RESOLVED", label: "Resolved", role: "Complaint Officer" },
  { key: "CLOSED", label: "Closed", role: "System" },
];

function WorkflowVisualizationPage() {
  return (
    <div className="flex h-full flex-col">
      <AdminPageHeader
        title="Workflow Visualization"
        subtitle="State machine for the complaint lifecycle, including the responsible role for each transition."
      />
      <div className="flex-1 space-y-4 p-4 lg:p-6">
        <div className="rounded border border-border bg-surface p-4">
          <div className="mb-3 flex items-center gap-2 text-[12.5px] font-semibold text-foreground">
            <GitBranch className="h-4 w-4 text-muted-foreground" />
            Complaint state flow
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {STATES.map((s, i) => (
              <div key={s.key} className="flex items-center gap-2">
                <div className="rounded border border-border bg-background px-3 py-2">
                  <div className="flex items-center gap-1.5 text-[12.5px] font-medium text-foreground">
                    {i === STATES.length - 1 ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    ) : (
                      <Circle className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                    {s.label}
                  </div>
                  <div className="mt-0.5 text-[11px] text-muted-foreground">
                    {s.role}
                  </div>
                </div>
                {i < STATES.length - 1 && (
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
