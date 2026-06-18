import { createFileRoute } from "@tanstack/react-router";
import { ComplaintsConfigScreen } from "@/components/admin/complaints-config";

export const Route = createFileRoute("/admin/complaints-config")({
  validateSearch: (s: Record<string, unknown>) => ({
    tab: typeof s.tab === "string" ? s.tab : undefined,
  }),
  component: ComplaintsConfigScreen,
});
