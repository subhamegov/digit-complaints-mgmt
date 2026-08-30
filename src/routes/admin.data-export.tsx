import { createFileRoute } from "@tanstack/react-router";
import { BlankAdminPage } from "@/components/admin/AdminLayout";

export const Route = createFileRoute("/admin/data-export")({
  head: () => ({ meta: [{ title: "Data & Export - Account Administration" }] }),
  component: BlankAdminPage,
});
