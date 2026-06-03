import { createFileRoute } from "@tanstack/react-router";
import { ComingSoonPage } from "@/components/admin/ComingSoonPage";

export const Route = createFileRoute("/admin/platform-health")({
  component: ComingSoonPage,
});
