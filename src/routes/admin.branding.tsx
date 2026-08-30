import { createFileRoute } from "@tanstack/react-router";
import { BlankAdminPage } from "@/components/admin/AdminLayout";

export const Route = createFileRoute("/admin/branding")({
  head: () => ({
    meta: [
      { title: "Branding - Account Administration" },
      { name: "description", content: "Configure logos, colours, and account branding for your workspace." },
      { property: "og:title", content: "Branding - Account Administration" },
      { property: "og:description", content: "Configure logos, colours, and account branding for your workspace." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <BlankAdminPage
      title="Branding"
      subtitle="Manage logos, colours, and other visual identity settings for this account."
    />
  ),
});
