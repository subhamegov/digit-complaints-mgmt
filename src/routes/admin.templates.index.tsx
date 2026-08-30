import { createFileRoute } from "@tanstack/react-router";
import { useAccountFeatures, setFeature } from "@/lib/account-features";
import { AdminPageHeader } from "@/components/admin/AdminLayout";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { FileText, Layers3, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/admin/templates/")({
  head: () => ({
    meta: [
      { title: "Templates - Account Administration" },
      { name: "description", content: "Review the complaint management template and optional account capabilities." },
      { property: "og:title", content: "Templates - Account Administration" },
      { property: "og:description", content: "Review the complaint management template and optional account capabilities." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TemplatesPage,
});

function TemplatesPage() {
  const { projects_enabled } = useAccountFeatures();
  return (
    <div className="flex h-full flex-col">
      <AdminPageHeader
        title="Templates"
        subtitle="Understand the complaint management template configured for this account."
      />
      <div className="flex-1 space-y-5 p-4 lg:p-6">
        <section>
          <div className="mb-2 flex items-center gap-2 text-[13px] font-semibold text-foreground">
            <FileText className="h-4 w-4 text-muted-foreground" />
            Template overview
          </div>
          <div className="rounded border border-border bg-surface p-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="text-[14px] font-semibold text-foreground">DIGIT Public Grievance Redressal</div>
                <p className="mt-1 max-w-2xl text-[12.5px] text-muted-foreground">
                  The shared complaint management template for registering, routing, resolving, and reporting citizen grievances.
                </p>
              </div>
              <Badge variant="secondary">Active template</Badge>
            </div>
            <div className="mt-4 grid gap-3 border-t border-border pt-4 sm:grid-cols-3">
              <div><div className="text-[11px] uppercase tracking-wide text-muted-foreground">Version</div><div className="mt-1 text-[13px] font-medium text-foreground">PGR.STANDARD.V2</div></div>
              <div><div className="text-[11px] uppercase tracking-wide text-muted-foreground">Status</div><div className="mt-1 text-[13px] font-medium text-foreground">Published</div></div>
              <div><div className="text-[11px] uppercase tracking-wide text-muted-foreground">Last updated</div><div className="mt-1 text-[13px] font-medium text-foreground">12 Aug 2026</div></div>
            </div>
          </div>
        </section>

        <section>
          <div className="mb-2 flex items-center gap-2 text-[13px] font-semibold text-foreground">
            <Layers3 className="h-4 w-4 text-muted-foreground" />
            Enabled capabilities
          </div>
          <div className="rounded border border-border bg-surface divide-y divide-border">
            <Capability label="Complaint intake and tracking" />
            <Capability label="Workflow, SLA and escalation management" />
            <Capability label="Dashboards and operational reporting" />
            <Capability label="Channels and citizen communications" />
          </div>
        </section>

        <section>
          <div className="mb-2 flex items-center gap-2 text-[13px] font-semibold text-foreground">
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
            Optional capabilities
          </div>
          <div className="rounded border border-border bg-surface p-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="text-[13px] font-medium text-foreground">Enable Projects</div>
                <p className="mt-1 max-w-xl text-[12px] text-muted-foreground">Allow this account to organise complaints and related configuration around projects.</p>
              </div>
              <Switch
                checked={projects_enabled}
                onCheckedChange={(checked) => setFeature("projects_enabled", checked)}
                aria-label="Enable Projects"
              />
            </div>
            <p className="mt-3 text-[11.5px] text-muted-foreground">Project configuration and historical data are retained when this capability is turned off.</p>
          </div>
        </section>
      </div>
    </div>
  );
}

function Capability({ label }: { label: string }) {
  return <div className="flex items-center justify-between px-4 py-3"><span className="text-[12.5px] text-foreground">{label}</span><Badge variant="outline">Enabled</Badge></div>;
}
