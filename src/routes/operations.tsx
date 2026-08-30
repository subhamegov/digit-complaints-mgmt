import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AdminLayout } from "@/components/admin/AdminLayout";

export const Route = createFileRoute("/operations")({
  component: () => <AdminLayout><Outlet /></AdminLayout>,
});
