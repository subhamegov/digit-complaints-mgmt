import { createFileRoute } from "@tanstack/react-router";
import { AdminPageHeader } from "@/components/admin/AdminLayout";
import { Link } from "@tanstack/react-router";
import { LayoutDashboard, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/admin/home")({
  head: () => ({ meta: [{ title: "Home — Account Administrator" }] }),
  component: HomePage,
});

function HomePage() {
  return (
    <div className="flex h-full flex-col">
      <AdminPageHeader
        title="Welcome"
        subtitle="Account Administrator console for the DIGIT Platform."
      />
      <div className="flex-1 p-4 lg:p-6">
        <div className="rounded-sm border border-border bg-surface p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-sm border border-border bg-background text-muted-foreground">
              <LayoutDashboard className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-[14px] font-semibold text-foreground">
                Operational overview moved to Live Dashboard
              </h2>
              <p className="mt-1 max-w-2xl text-[12.5px] text-muted-foreground">
                KPIs, trends, departmental load, recent activity, and alerts are now grouped under
                Dashboards → Live Dashboard for a focused, real-time view.
              </p>
              <Link
                to="/admin/dashboards"
                className="mt-4 inline-flex h-8 items-center gap-1.5 rounded-sm border border-border bg-background px-2.5 text-[12px] font-medium text-foreground hover:bg-muted"
              >
                Open Live Dashboard
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
