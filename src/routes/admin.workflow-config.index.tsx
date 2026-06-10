import { createFileRoute, Link } from "@tanstack/react-router";
import { AdminPageHeader } from "@/components/admin/AdminLayout";
import { GitBranch, Gauge, ShieldCheck, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/admin/workflow-config/")({
  head: () => ({
    meta: [{ title: "Workflow Configuration — Account Administrator" }],
  }),
  component: WorkflowConfigIndex,
});

const TILES = [
  {
    to: "/admin/workflow-config/visualization",
    label: "Workflow Visualization",
    body: "Inspect the complaint state machine, transitions, and the role responsible for each step.",
    icon: GitBranch,
  },
  {
    to: "/admin/workflow-config/sla-maps",
    label: "SLA Maps",
    body: "Acknowledgement, resolution, and escalation targets per category and priority.",
    icon: Gauge,
  },
  {
    to: "/admin/workflow-config/role-hierarchy",
    label: "Role Hierarchy",
    body: "Reporting chain across console roles that drives approvals and escalations.",
    icon: ShieldCheck,
  },
] as const;

function WorkflowConfigIndex() {
  return (
    <div className="flex h-full flex-col">
      <AdminPageHeader
        title="Workflow Configuration"
        subtitle="Workflow definitions, SLA policies, and the role hierarchy that governs escalations."
      />
      <div className="flex-1 p-4 lg:p-6">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {TILES.map((t) => {
            const Icon = t.icon;
            return (
              <Link
                key={t.to}
                to={t.to}
                className="group flex flex-col rounded border border-border bg-surface p-4 transition-colors hover:border-muted-foreground/40"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-sm border border-border bg-background text-muted-foreground">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="mt-3 text-[14px] font-semibold text-foreground">
                  {t.label}
                </div>
                <p className="mt-1 flex-1 text-[12.5px] leading-relaxed text-muted-foreground">
                  {t.body}
                </p>
                <div className="mt-3 inline-flex items-center gap-1 text-[12px] font-medium text-primary">
                  Open
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
