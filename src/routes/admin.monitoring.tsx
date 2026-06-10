import { createFileRoute } from "@tanstack/react-router";
import { BlankAdminPage } from "@/components/admin/AdminLayout";

export const Route = createFileRoute("/admin/monitoring")({
  component: () => (
    <BlankAdminPage
      title="Monitoring & Analytics"
      subtitle="Dashboards for complaint, SLA, source, channel, user, and resolution analytics. Populated with realistic sample data."
    />
  ),
});
