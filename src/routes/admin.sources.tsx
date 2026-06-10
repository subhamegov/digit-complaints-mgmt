import { createFileRoute } from "@tanstack/react-router";
import { BlankAdminPage } from "@/components/admin/AdminLayout";

export const Route = createFileRoute("/admin/sources")({
  component: () => (
    <BlankAdminPage
      title="Sources"
      subtitle="Configure where complaints originate. Sample sources: Citizen Portal, Mobile App, Call Centre, Walk-In Centre, Ward Office, Email Intake, API, Social Media."
    />
  ),
});
