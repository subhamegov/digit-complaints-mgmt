import { createFileRoute } from "@tanstack/react-router";
import { BlankAdminPage } from "@/components/admin/AdminLayout";

export const Route = createFileRoute("/admin/complaints-config")({
  component: () => (
    <BlankAdminPage
      title="Complaints"
      subtitle="Manage categories, subcategories, priorities, statuses, resolution codes, and custom complaint attributes. All labels editable and multilingual."
    />
  ),
});
