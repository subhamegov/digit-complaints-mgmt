import { createFileRoute } from "@tanstack/react-router";
import { BlankAdminPage } from "@/components/admin/AdminLayout";

export const Route = createFileRoute("/admin/advanced-settings")({
  head: () => ({ meta: [{ title: "Advanced Settings - Account Administration" }] }),
  component: BlankAdminPage,
});
