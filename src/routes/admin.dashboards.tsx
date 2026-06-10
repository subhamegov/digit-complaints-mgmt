import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/dashboards")({
  head: () => ({ meta: [{ title: "Dashboards — Account Administrator" }] }),
  component: () => <Outlet />,
});
