/**
 * Read-only presentation pieces for the Account Administrator dashboard
 * catalogue. Nothing here is interactive beyond navigation: no drag handles,
 * no resize, no KPI configuration.
 */

import { CheckCircle2, CircleSlash, BarChart3, Table2, MapPin, Gauge } from "lucide-react";
import type { DashboardStatus, PreviewBlock } from "@/lib/dashboard-catalogue";

export function StatusPill({ status }: { status: DashboardStatus }) {
  const active = status === "ACTIVE";
  const Icon = active ? CheckCircle2 : CircleSlash;
  return (
    <span
      className={
        "inline-flex items-center gap-1.5 rounded-sm border px-1.5 py-0.5 text-[11.5px] font-medium " +
        (active
          ? "border-success/30 bg-success/10 text-success"
          : "border-border bg-muted text-muted-foreground")
      }
    >
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {active ? "Active" : "Inactive"}
    </span>
  );
}

const BLOCK_ICON = {
  stat: Gauge,
  chart: BarChart3,
  table: Table2,
  map: MapPin,
} as const;

const BLOCK_HEIGHT = {
  stat: "h-[68px]",
  chart: "h-[150px]",
  table: "h-[150px]",
  map: "h-[150px]",
} as const;

/**
 * Renders the dashboard's published arrangement from the same layout
 * definition the dashboard itself is composed from, so the preview
 * cannot drift from the live experience.
 */
export function DashboardPreviewGrid({ layout }: { layout: PreviewBlock[] }) {
  return (
    <div
      className="grid grid-cols-12 gap-3"
      role="img"
      aria-label="Read-only preview of the dashboard layout"
    >
      {layout.map((b, i) => {
        const Icon = BLOCK_ICON[b.kind];
        return (
          <div
            key={`${b.label}-${i}`}
            style={{ gridColumn: `span ${b.span} / span ${b.span}` }}
            className={`flex flex-col rounded-sm border border-border bg-background p-2.5 ${BLOCK_HEIGHT[b.kind]}`}
          >
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <span className="truncate text-[11.5px] font-medium text-foreground">
                {b.label}
              </span>
            </div>
            <PreviewBody kind={b.kind} />
          </div>
        );
      })}
    </div>
  );
}

function PreviewBody({ kind }: { kind: PreviewBlock["kind"] }) {
  if (kind === "stat") {
    return (
      <div className="mt-auto flex items-end gap-2">
        <div className="h-4 w-14 rounded-sm bg-muted" />
        <div className="h-2 w-10 rounded-sm bg-muted/70" />
      </div>
    );
  }
  if (kind === "table") {
    return (
      <div className="mt-2 flex-1 space-y-1.5">
        {[0, 1, 2, 3, 4].map((r) => (
          <div key={r} className="flex gap-2">
            <div className="h-2 flex-[3] rounded-sm bg-muted" />
            <div className="h-2 flex-1 rounded-sm bg-muted/70" />
            <div className="h-2 flex-1 rounded-sm bg-muted/70" />
          </div>
        ))}
      </div>
    );
  }
  if (kind === "map") {
    return (
      <div className="mt-2 flex-1 rounded-sm bg-muted/60">
        <div className="flex h-full items-center justify-center text-[11px] text-muted-foreground">
          Map region
        </div>
      </div>
    );
  }
  return (
    <div className="mt-2 flex flex-1 items-end gap-1.5">
      {[40, 65, 30, 80, 55, 70, 45, 90].map((h, i) => (
        <div
          key={i}
          className="flex-1 rounded-t-sm bg-primary/25"
          style={{ height: `${h}%` }}
        />
      ))}
    </div>
  );
}
