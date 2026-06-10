import { createFileRoute } from "@tanstack/react-router";
import { DashboardPage } from "./dashboard";

export const Route = createFileRoute("/admin/dashboards/live")({
  head: () => ({ meta: [{ title: "Live Dashboard — Account Administrator" }] }),
  component: DashboardPage,
});
