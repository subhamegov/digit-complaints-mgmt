import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminLayout";
import { StatusPill } from "@/components/admin/dashboards/DashboardPreview";
import { DASHBOARD_CATALOGUE, readPublicAccess } from "@/lib/dashboard-catalogue";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/admin/dashboards/")({
  head: () => ({
    meta: [
      { title: "Dashboards - Account Administrator" },
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
        <div className="overflow-x-auto rounded-md border border-border bg-surface shadow-[0_1px_2px_0_color-mix(in_oklab,var(--foreground)_6%,transparent)]">
          <table className="w-full border-collapse text-[13px] leading-5">
            <caption className="sr-only">
              Published dashboards, their audience, status and last publication date
            </caption>
            <thead className="border-b border-border bg-surface-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-3 text-left font-semibold">Dashboard</th>
                <th scope="col" className="px-4 py-3 text-left font-semibold">Purpose</th>
                <th scope="col" className="px-4 py-3 text-left font-semibold">Assigned role</th>
                <th scope="col" className="px-4 py-3 text-left font-semibold">Status</th>
                <th scope="col" className="px-4 py-3 text-left font-semibold">Last published</th>
                <th scope="col" className="px-4 py-3 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {DASHBOARD_CATALOGUE.map((d) => {
                const status =
                  d.publicAccess && !publicOn ? "INACTIVE" : d.status;
                return (
                  <tr
                    key={d.id}
                    className="align-middle transition-colors hover:bg-primary/[0.04]"
                  >
                    <th
                      scope="row"
                      className="border-l-2 border-transparent px-4 py-3.5 text-left text-[13.5px] font-semibold text-foreground"
                    >
                      {d.name}
                    </th>
                    <td className="max-w-[360px] px-4 py-3.5 text-muted-foreground">
                      {d.purpose}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-foreground">
                      {d.role}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5">
                      <StatusPill status={status} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 tabular-nums text-muted-foreground">
                      {d.lastPublished}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-right">
                      <Link
                        to="/admin/dashboards/$dashboardId"
                        params={{ dashboardId: d.id }}
                        aria-label={`View ${d.name}`}
                        className="inline-flex h-8 items-center gap-1.5 rounded-sm border border-primary/30 bg-primary/[0.06] px-2.5 text-[12px] font-semibold text-primary transition-colors hover:bg-primary/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
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
