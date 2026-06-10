import { createFileRoute } from "@tanstack/react-router";
import { BlankAdminPage } from "@/components/admin/AdminLayout";

export const Route = createFileRoute("/admin/roles")({
  component: () => (
    <BlankAdminPage
      title="Roles & Permissions"
      subtitle="Create, clone, archive, and configure permission matrices. Sample roles: Super Administrator, Platform Administrator, Complaint Manager, Resolution Officer, Analyst."
    />
  ),
});
