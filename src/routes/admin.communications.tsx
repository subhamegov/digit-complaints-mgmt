import { createFileRoute } from "@tanstack/react-router";
import { BlankAdminPage } from "@/components/admin/AdminLayout";

export const Route = createFileRoute("/admin/communications")({
  component: () => (
    <BlankAdminPage
      title="Communications"
      subtitle="Manage notification templates for SMS, Email, WhatsApp, and broadcast messages. All templates support multilingual content."
    />
  ),
});
