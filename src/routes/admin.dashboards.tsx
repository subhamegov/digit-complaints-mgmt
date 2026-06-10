import { createFileRoute } from "@tanstack/react-router";
import { BlankAdminPage } from "@/components/admin/AdminLayout";

export const Route = createFileRoute("/admin/dashboards")({
  head: () => ({ meta: [{ title: "Dashboards — Account Administrator" }] }),
  component: () => <BlankAdminPage />,
});
