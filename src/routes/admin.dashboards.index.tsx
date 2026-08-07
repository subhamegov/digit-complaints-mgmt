import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminLayout";
import { StatusPill } from "@/components/admin/dashboards/DashboardPreview";
import { DASHBOARD_CATALOGUE, readPublicAccess } from "@/lib/dashboard-catalogue";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/admin/dashboards/")({
  head: () => ({
    meta: [
      { title: "Dashboards — Account Administrator" },
      {
        name: "description",
        content:
          "Catalogue of published dashboards, their audiences, status and KPI composition.",
      },
    ],
  }),
  component: DashboardCataloguePage,
});

function DashboardCataloguePage() {
  const [publicOn, setPublicOn] = useState(true);
  useEffect(() => setPublicOn(readPublicAccess()), []);

  return (
    <div className="flex h-full flex-col">
      <AdminPageHeader
        title="Dashboards"
        subtitle="View dashboards available to different users and manage their availability."
      />
      <div className="flex-1 p-4 lg:p-6">
        <div className="overflow-x-auto rounded-sm border border-border bg-surface">
          <table className="w-full text-[13px]">
            <caption className="sr-only">
              Published dashboards, their audience, status and last publication date
            </caption>
            <thead className="bg-surface-2 text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-2 text-left font-medium">Dashboard</th>
                <th scope="col" className="px-4 py-2 text-left font-medium">Purpose</th>
                <th scope="col" className="px-4 py-2 text-left font-medium">Assigned role</th>
                <th scope="col" className="px-4 py-2 text-left font-medium">Status</th>
                <th scope="col" className="px-4 py-2 text-left font-medium">Last published</th>
                <th scope="col" className="px-4 py-2 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {DASHBOARD_CATALOGUE.map((d) => {
                const status =
                  d.publicAccess && !publicOn ? "INACTIVE" : d.status;
                return (
                  <tr key={d.id} className="align-top hover:bg-muted/40">
                    <th scope="row" className="px-4 py-3 text-left font-medium text-foreground">
                      {d.name}
                    </th>
                    <td className="max-w-[360px] px-4 py-3 text-muted-foreground">
                      {d.purpose}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">{d.role}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <StatusPill status={status} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 tabular-nums text-muted-foreground">
                      {d.lastPublished}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <Link
                        to="/admin/dashboards/$dashboardId"
                        params={{ dashboardId: d.id }}
                        aria-label={`View ${d.name}`}
                        className="inline-flex h-8 items-center gap-1.5 rounded-sm border border-border bg-background px-2.5 text-[12px] font-medium text-foreground hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                      >
                        View dashboard
                        <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
