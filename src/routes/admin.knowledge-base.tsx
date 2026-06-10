import { createFileRoute } from "@tanstack/react-router";
import { BlankAdminPage } from "@/components/admin/AdminLayout";

export const Route = createFileRoute("/admin/knowledge-base")({
  component: () => (
    <BlankAdminPage
      title="Knowledge Base"
      subtitle="Manage articles, FAQs, SOPs, and resolution guides. All content supports localization."
    />
  ),
});
