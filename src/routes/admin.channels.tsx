import { createFileRoute } from "@tanstack/react-router";
import { BlankAdminPage } from "@/components/admin/AdminLayout";

export const Route = createFileRoute("/admin/channels")({
  component: () => (
    <BlankAdminPage
      title="Channels"
      subtitle="Configure outbound communication methods. Sample channels: SMS, Email, WhatsApp, Push Notification, IVR, Voice Call."
    />
  ),
});
