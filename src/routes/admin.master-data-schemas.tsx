import { createFileRoute } from "@tanstack/react-router";
import { BlankAdminPage } from "@/components/admin/AdminLayout";

export const Route = createFileRoute("/admin/master-data-schemas")({
  component: BlankAdminPage,
});
