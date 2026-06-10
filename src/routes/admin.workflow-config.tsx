import { createFileRoute } from "@tanstack/react-router";
import { BlankAdminPage } from "@/components/admin/AdminLayout";

export const Route = createFileRoute("/admin/workflow-config")({
  component: () => (
    <BlankAdminPage
      title="Workflow Configuration"
      subtitle="Workflow definitions, states, routing rules, escalation rules, assignment rules, and SLA policies. All workflow state names localizable."
    />
  ),
});
