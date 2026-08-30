import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/branding")({
  head: () => ({
    meta: [
      { title: "Branding - Account Administration" },
      {
        name: "description",
        content: "Personalise the complaint management experience for this account.",
      },
      { property: "og:title", content: "Branding - Account Administration" },
      {
        property: "og:description",
        content: "Personalise the complaint management experience for this account.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <Outlet />,
});
