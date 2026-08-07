import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Copy, ExternalLink, Check, Globe2, AlertTriangle } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminLayout";
import {
  StatusPill,
  DashboardPreviewGrid,
} from "@/components/admin/dashboards/DashboardPreview";
import {
  getDashboard,
  readPublicAccess,
  writePublicAccess,
  type DashboardDefinition,
} from "@/lib/dashboard-catalogue";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/admin/dashboards/$dashboardId")({
  loader: ({ params }) => {
    const dashboard = getDashboard(params.dashboardId);
    if (!dashboard) throw notFound();
    return { dashboard };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "Unavailable — Account Administrator" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    return {
      meta: [
        { title: `${loaderData.dashboard.name} — Account Administrator` },
        { name: "description", content: loaderData.dashboard.purpose },
      ],
    };
  },
  component: DashboardDetailPage,
});

function DashboardDetailPage() {
  const { dashboard } = Route.useLoaderData();
  const isPublic = Boolean(dashboard.publicAccess);

  const [publicOn, setPublicOn] = useState(true);
  useEffect(() => setPublicOn(readPublicAccess()), []);

  const status = isPublic && !publicOn ? "INACTIVE" : dashboard.status;

  return (
    <div className="flex h-full flex-col">
      <AdminPageHeader title={dashboard.name} subtitle={dashboard.purpose} />

      <div className="flex-1 space-y-4 p-4 lg:space-y-5 lg:p-6">
        <Link
          to="/admin/dashboards"
          className="inline-flex h-8 items-center gap-1.5 rounded-sm border border-border bg-background px-2.5 text-[12px] font-medium text-foreground hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          Back to Dashboards
        </Link>

        {/* Metadata */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <MetaCard label="Available to" value={dashboard.role} emphasis />
          <div className="rounded-sm border border-border bg-surface p-3">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Status
            </div>
            <div className="mt-1.5">
              <StatusPill status={status} />
            </div>
          </div>
          <MetaCard label="Last published" value={dashboard.lastPublished} />
        </div>

        {/* KPIs */}
        <section
          aria-labelledby="kpis-heading"
          className="rounded-sm border border-border bg-surface"
        >
          <div className="border-b border-border px-4 py-2.5">
            <h2 id="kpis-heading" className="text-[13px] font-semibold text-foreground">
              KPIs included
            </h2>
            <p className="text-[12px] text-muted-foreground">
              Read-only. KPI composition is managed outside this console.
            </p>
          </div>
          <ul className="grid grid-cols-1 gap-2 p-4 sm:grid-cols-2 lg:grid-cols-3">
            {dashboard.kpis.map((k) => (
              <li
                key={k}
                className="rounded-sm border border-border bg-background px-3 py-2 text-[12.5px] text-foreground"
              >
                {k}
              </li>
            ))}
          </ul>
        </section>

        {/* Preview */}
        <section
          aria-labelledby="preview-heading"
          className="rounded-sm border border-border bg-surface"
        >
          <div className="border-b border-border px-4 py-2.5">
            <h2 id="preview-heading" className="text-[13px] font-semibold text-foreground">
              Preview
            </h2>
            <p className="text-[12px] text-muted-foreground">
              This is how the dashboard appears to its users.
            </p>
          </div>
          <div className="p-4">
            <DashboardPreviewGrid layout={dashboard.layout} />
          </div>
        </section>

        {isPublic && (
          <PublicAccessSection
            dashboard={dashboard}
            enabled={publicOn}
            onChange={(next) => {
              setPublicOn(next);
              writePublicAccess(next);
            }}
          />
        )}
      </div>
    </div>
  );
}

function MetaCard({
  label,
  value,
  emphasis,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div className="rounded-sm border border-border bg-surface p-3">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div
        className={
          emphasis
            ? "mt-1 text-[14px] font-semibold text-foreground"
            : "mt-1 text-[13px] text-foreground"
        }
      >
        {value}
      </div>
    </div>
  );
}

function PublicAccessSection({
  dashboard,
  enabled,
  onChange,
}: {
  dashboard: DashboardDefinition;
  enabled: boolean;
  onChange: (next: boolean) => void;
}) {
  const url = dashboard.publicAccess!.url;
  const [copied, setCopied] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  };

  return (
    <section
      aria-labelledby="public-access-heading"
      className="rounded-sm border border-border bg-surface/60 p-4"
    >
      <h2
        id="public-access-heading"
        className="flex items-center gap-1.5 text-[12.5px] font-semibold text-muted-foreground"
      >
        <Globe2 className="h-3.5 w-3.5" aria-hidden />
        Public access
      </h2>
      <p className="mt-1 text-[12.5px] text-muted-foreground">
        {enabled
          ? "This dashboard is publicly available."
          : "Public access is turned off."}
      </p>

      <div className="mt-3">
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
          Public URL
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <code className="rounded-sm border border-border bg-background px-2 py-1 text-[12px] text-foreground">
            {url}
          </code>
          <button
            type="button"
            onClick={copy}
            className="inline-flex h-8 items-center gap-1.5 rounded-sm border border-border bg-background px-2.5 text-[12px] font-medium text-foreground hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5" aria-hidden />
            ) : (
              <Copy className="h-3.5 w-3.5" aria-hidden />
            )}
            {copied ? "Link copied" : "Copy link"}
          </button>
          {enabled && (
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-8 items-center gap-1.5 rounded-sm border border-border bg-background px-2.5 text-[12px] font-medium text-foreground hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
              Open public dashboard
            </a>
          )}
        </div>
        {!enabled && (
          <p className="mt-2 inline-flex items-center gap-1.5 text-[12px] font-medium text-foreground">
            <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
            Not currently accessible to the public
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={() => setManageOpen(true)}
        className="mt-3 rounded-sm text-[12px] font-medium text-muted-foreground underline underline-offset-2 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        Manage public access
      </button>

      {/* Manage drawer/modal */}
      <Dialog open={manageOpen} onOpenChange={setManageOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Public dashboard status</DialogTitle>
            <DialogDescription>
              {enabled
                ? "Anyone with the public link can currently view this dashboard. No sign-in is required."
                : "The public link is currently disabled. Enabling it makes the dashboard viewable by anyone with the link."}
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center gap-2">
            <StatusPill status={enabled ? "ACTIVE" : "INACTIVE"} />
          </div>

          <DialogFooter>
            {enabled ? (
              <button
                type="button"
                onClick={() => {
                  setManageOpen(false);
                  setConfirmOpen(true);
                }}
                className="inline-flex h-9 items-center rounded-sm border border-destructive/40 bg-background px-3 text-[12.5px] font-medium text-destructive hover:bg-destructive/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                Disable public dashboard
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  onChange(true);
                  setManageOpen(false);
                }}
                className="inline-flex h-9 items-center rounded-sm bg-primary px-3 text-[12.5px] font-medium text-primary-foreground hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                Enable public dashboard
              </button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Destructive confirmation */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Turn off public dashboard?</DialogTitle>
            <DialogDescription>
              The Citizen Dashboard will no longer be accessible through its public
              URL. Existing links to the dashboard will stop working until public
              access is enabled again.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              type="button"
              autoFocus
              onClick={() => setConfirmOpen(false)}
              className="inline-flex h-9 items-center rounded-sm bg-primary px-3 text-[12.5px] font-medium text-primary-foreground hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              Keep dashboard active
            </button>
            <button
              type="button"
              onClick={() => {
                onChange(false);
                setConfirmOpen(false);
              }}
              className="inline-flex h-9 items-center rounded-sm border border-destructive/40 bg-background px-3 text-[12.5px] font-medium text-destructive hover:bg-destructive/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              Turn off public dashboard
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
