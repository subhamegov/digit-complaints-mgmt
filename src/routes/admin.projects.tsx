import { createFileRoute } from "@tanstack/react-router";
import { BlankAdminPage } from "@/components/admin/AdminLayout";

export const Route = createFileRoute("/admin/projects")({
  head: () => ({
    meta: [
      { title: "Projects - Account Administration" },
      { name: "description", content: "Organise complaints and configuration around projects." },
      { property: "og:title", content: "Projects - Account Administration" },
      { property: "og:description", content: "Organise complaints and configuration around projects." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: BlankAdminPage,
});
