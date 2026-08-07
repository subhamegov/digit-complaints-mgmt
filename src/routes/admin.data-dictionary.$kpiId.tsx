import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { z } from "zod";
import { ArrowLeft } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminLayout";
import { getKpi, type KpiDefinition } from "@/lib/kpi-dictionary";
import { getDashboard } from "@/lib/dashboard-catalogue";

const searchSchema = z.object({
  /** Dashboard the reader came from, so we can return them to its KPIs tab. */
  from: z.string().optional(),
});

export const Route = createFileRoute("/admin/data-dictionary/$kpiId")({
  validateSearch: searchSchema,
  loader: ({ params }) => {
    const kpi = getKpi(params.kpiId);
    return { kpi: kpi ?? null, kpiId: params.kpiId };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "Unavailable — Data dictionary" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const name = loaderData.kpi?.name ?? "Definition not available";
    return {
      meta: [
        { title: `${name} — Data dictionary` },
        {
          name: "description",
          content:
            loaderData.kpi?.businessDefinition ??
            "KPI definition in the complaint management data dictionary.",
        },
        { property: "og:title", content: `${name} — Data dictionary` },
        {
          property: "og:description",
          content:
            loaderData.kpi?.measures ?? "Definition not available for this measure.",
        },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
  component: KpiDefinitionPage,
});

function KpiDefinitionPage() {
  const { kpi, kpiId } = Route.useLoaderData();
  const { from } = Route.useSearch();
  const source = from ? getDashboard(from) : undefined;

  return (
    <div className="flex h-full flex-col">
      <AdminPageHeader
        title={kpi?.name ?? "Definition not available"}
        subtitle={kpi?.measures ?? "This measure has no data dictionary record yet."}
      />
      <div className="flex-1 space-y-4 p-4 lg:space-y-5 lg:p-6">
        {source ? (
          <Link
            to="/admin/dashboards/$dashboardId"
            params={{ dashboardId: source.id }}
            search={{ tab: "kpis" as const }}
            className="inline-flex h-8 items-center gap-1.5 rounded-sm border border-border bg-background px-2.5 text-[12px] font-medium text-foreground hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
            Back to {source.name}
          </Link>
        ) : (
          <Link
            to="/admin/data-dictionary"
            className="inline-flex h-8 items-center gap-1.5 rounded-sm border border-border bg-background px-2.5 text-[12px] font-medium text-foreground hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
            Back to Data dictionary
          </Link>
        )}

        {!kpi ? (
          <section className="rounded-sm border border-border bg-surface p-4">
            <h2 className="text-[13px] font-semibold text-foreground">
              Definition not available
            </h2>
            <p className="mt-1 text-[12.5px] text-muted-foreground">
              No data dictionary record is mapped to <code>{kpiId}</code> yet. Ask the
              data owner to publish a definition before this measure is documented.
            </p>
          </section>
        ) : (
          <Definition kpi={kpi} />
        )}
      </div>
    </div>
  );
}

function Definition({ kpi }: { kpi: KpiDefinition }) {
  return (
    <div className="space-y-4">
      <section className="rounded-sm border border-border bg-surface">
        <div className="border-b border-border px-4 py-2.5">
          <h2 className="text-[13px] font-semibold text-foreground">Definition</h2>
        </div>
        <dl className="divide-y divide-border">
          <Row label="KPI name" value={kpi.name} />
          <Row label="Business definition" value={kpi.businessDefinition} />
          <Row label="Calculation" value={kpi.calculation} mono />
          <Row label="Numerator" value={kpi.numerator} />
          <Row label="Denominator" value={kpi.denominator} />
          <Row label="Unit" value={kpi.unit} />
        </dl>
      </section>

      <section className="rounded-sm border border-border bg-surface">
        <div className="border-b border-border px-4 py-2.5">
          <h2 className="text-[13px] font-semibold text-foreground">Source and governance</h2>
        </div>
        <dl className="divide-y divide-border">
          <Row label="Source service or module" value={kpi.source} />
          <Row label="Source fields" value={kpi.sourceFields?.join(", ")} mono />
          <Row label="Dimensions" value={kpi.dimensions?.join(", ")} />
          <Row label="Supported filters" value={kpi.filters?.join(", ")} />
          <Row label="Refresh frequency" value={kpi.refresh} />
          <Row label="Data owner" value={kpi.owner} />
          <Row label="Last updated" value={kpi.lastUpdated} />
        </dl>
      </section>
    </div>
  );
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value?: string;
  mono?: boolean;
}) {
  return (
    <div className="grid grid-cols-1 gap-1 px-4 py-2.5 sm:grid-cols-[220px_1fr] sm:gap-3">
      <dt className="text-[11.5px] uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
      <dd
        className={
          value
            ? mono
              ? "text-[12.5px] font-mono text-foreground"
              : "text-[12.5px] text-foreground"
            : "text-[12.5px] text-muted-foreground"
        }
      >
        {value ?? "Not specified"}
      </dd>
    </div>
  );
}
