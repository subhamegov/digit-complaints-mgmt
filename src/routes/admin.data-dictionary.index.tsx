import { createFileRoute, Link } from "@tanstack/react-router";
import { AdminPageHeader } from "@/components/admin/AdminLayout";
import { KPI_DICTIONARY } from "@/lib/kpi-dictionary";

export const Route = createFileRoute("/admin/data-dictionary/")({
  head: () => ({
    meta: [
      { title: "Data dictionary - Account Administrator" },
      {
        name: "description",
        content:
          "Formal definitions for the KPIs used across published complaint management dashboards.",
      },
      { property: "og:title", content: "Data dictionary - Account Administrator" },
      {
        property: "og:description",
        content: "Business definitions, calculations and sources for complaint KPIs.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DataDictionaryIndex,
});

function DataDictionaryIndex() {
  return (
    <div className="flex h-full flex-col">
      <AdminPageHeader
        title="Data dictionary"
        subtitle="Formal definitions for the measures used across published dashboards."
      />
      <div className="flex-1 p-4 lg:p-6">
        <div className="overflow-x-auto rounded-sm border border-border bg-surface">
          <table className="w-full text-[13px]">
            <caption className="sr-only">KPI definitions</caption>
            <thead className="bg-surface-2 text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-2 text-left font-medium">KPI</th>
                <th scope="col" className="px-4 py-2 text-left font-medium">What it measures</th>
                <th scope="col" className="px-4 py-2 text-left font-medium">Source</th>
                <th scope="col" className="px-4 py-2 text-left font-medium">Refresh</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {KPI_DICTIONARY.map((k) => (
                <tr key={k.id} className="align-top hover:bg-muted/40">
                  <th scope="row" className="px-4 py-3 text-left font-medium text-foreground">
                    <Link
                      to="/admin/data-dictionary/$kpiId"
                      params={{ kpiId: k.id }}
                      className="underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                    >
                      {k.name}
                    </Link>
                  </th>
                  <td className="max-w-[420px] px-4 py-3 text-muted-foreground">{k.measures}</td>
                  <td className="whitespace-nowrap px-4 py-3">{k.source}</td>
                  <td className="whitespace-nowrap px-4 py-3">{k.refresh}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
