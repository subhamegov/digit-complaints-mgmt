import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/dashboards/")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/dashboards/live" });
  },
});
