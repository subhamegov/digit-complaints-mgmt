import { createFileRoute } from "@tanstack/react-router";
import { BlankAdminPage } from "@/components/admin/AdminLayout";

export const Route = createFileRoute("/admin/validation-rules")({
  component: BlankAdminPage,
});
