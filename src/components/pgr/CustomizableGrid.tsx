/**
 * CustomizableGrid — reusable dashboard shell with drag-to-reorder, snap-resize,
 * and an Add-KPI picker. Extracted from the test-user dashboard so other roles
 * (e.g. Department Head) can share the exact same behavior.
 *
 * Pass a `registry` of KPI definitions and the initial `defaultIds`. Stats are
 * rendered in a 6-col strip on top; panels in a 3-col grid below.
 */
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Plus } from "lucide-react";
import { StatCard, Panel, type StatTrend } from "@/components/pgr/primitives";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { cn } from "@/lib/utils";

export type GridKpiKind = "stat" | "panel";

export type GridKpiDef = {
  id: string;
  label: string;
  description: string;
  kind: GridKpiKind;
  icon: React.ComponentType<{ className?: string }>;
  // stat
  intent?: "positive" | "negative" | "warning" | "neutral";
  getValue?: () => string;
  getDelta?: () => string;
  getTrend?: () => StatTrend | undefined;
  // panel
  colSpan?: 1 | 2 | 3;
  defaultRowSpan?: 1 | 2 | 3;
  padded?: boolean;
  title?: string;
  action?: ReactNode;
  render?: () => ReactNode;
};

const ROW_STEP = 280;

export function CustomizableGrid({
  registry,
  defaultIds,
  pickerLabel = "Add KPI",
  toolbarRight,
  bannerLeft,
}: {
  registry: GridKpiDef[];
  defaultIds: string[];
  pickerLabel?: string;
  toolbarRight?: ReactNode;
  bannerLeft?: ReactNode;
}) {

  const kpiById = useMemo(() => {
    const m = new Map<string, GridKpiDef>();
    registry.forEach((k) => m.set(k.id, k));
    return m;
  }, [registry]);

  const [visibleIds, setVisibleIds] = useState<string[]>(defaultIds);
  useEffect(() => { setVisibleIds(defaultIds); }, [defaultIds]);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [hoveredKpiId, setHoveredKpiId] = useState<string | null>(null);

  const [dragId, setDragId] = useState<string | null>(null);
  const removeKpi = (id: string) => setVisibleIds((p) => p.filter((x) => x !== id));
  const addKpi = (id: string) => {
    setVisibleIds((p) => (p.includes(id) ? p : [...p, id]));
    setPickerOpen(false);
  };
  const handleDrop = (targetId: string) => {
    if (!dragId || dragId === targetId) return;
    setVisibleIds((prev) => {
      const next = [...prev];
      const from = next.indexOf(dragId);
      const to = next.indexOf(targetId);
      if (from === -1 || to === -1) return prev;
      next.splice(from, 1);
      next.splice(to, 0, dragId);
      return next;
    });
    setDragId(null);
  };

  const gridRef = useRef<HTMLDivElement>(null);
  const [sizes, setSizes] = useState<Record<string, { colSpan?: 1 | 2 | 3; rowSpan?: 1 | 2 | 3 }>>({});
  const [resizingId, setResizingId] = useState<string | null>(null);
  const [resizingAxis, setResizingAxis] = useState<"x" | "y" | "xy" | null>(null);
  const [handleHoverId, setHandleHoverId] = useState<string | null>(null);

  const startResize = (id: string, axis: "x" | "y" | "xy", e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault(); e.stopPropagation();
    const handleEl = e.currentTarget;
    handleEl.setPointerCapture(e.pointerId);
    setResizingId(id); setResizingAxis(axis);
    const tile = document.querySelector(`[data-kpi-id="${id}"]`) as HTMLElement | null;
    const parentGrid = tile?.parentElement as HTMLElement | null;
    if (!tile || !parentGrid) return;
    const gridRect = parentGrid.getBoundingClientRect();
    const tileRect = tile.getBoundingClientRect();
    const gap = 12;
    const styles = window.getComputedStyle(parentGrid);
    const cols = styles.gridTemplateColumns.split(" ").filter(Boolean).length || 3;
    const maxSpan = Math.min(cols, 3) as 1 | 2 | 3;
    const colWidth = (gridRect.width + gap) / cols;

    const onMove = (ev: PointerEvent) => {
      setSizes((p) => {
        const cur = p[id] ?? {};
        const next = { ...cur };
        if (axis === "x" || axis === "xy") {
          const w = ev.clientX - tileRect.left;
          next.colSpan = Math.max(1, Math.min(maxSpan, Math.round(w / colWidth))) as 1 | 2 | 3;
        }
        if (axis === "y" || axis === "xy") {
          const h = ev.clientY - tileRect.top;
          next.rowSpan = Math.max(1, Math.min(3, Math.round(h / ROW_STEP))) as 1 | 2 | 3;
        }
        return { ...p, [id]: next };
      });
    };
    const onUp = (ev: PointerEvent) => {
      handleEl.releasePointerCapture?.(ev.pointerId);
      setResizingId(null); setResizingAxis(null);
      handleEl.removeEventListener("pointermove", onMove);
      handleEl.removeEventListener("pointerup", onUp);
      handleEl.removeEventListener("pointercancel", onUp);
    };
    handleEl.addEventListener("pointermove", onMove);
    handleEl.addEventListener("pointerup", onUp);
    handleEl.addEventListener("pointercancel", onUp);
  };
  const resetSize = (id: string) => setSizes((p) => { const n = { ...p }; delete n[id]; return n; });

  const availableToAdd = registry.filter((k) => !visibleIds.includes(k.id));
  const colSpanClass = (n: 1 | 2 | 3) =>
    n === 3 ? "md:col-span-2 lg:col-span-3" : n === 2 ? "md:col-span-2" : "";

  const visibleStats = visibleIds.filter((id) => kpiById.get(id)?.kind === "stat");
  const visiblePanels = visibleIds.filter((id) => kpiById.get(id)?.kind === "panel");

  const renderTile = (id: string, gridCols: 3 | 6) => {
    const k = kpiById.get(id);
    if (!k) return null;
    const userSize = sizes[id];
    const defaultSpan: 1 | 2 | 3 = k.kind === "panel" ? (k.colSpan ?? 1) : 1;
    const effectiveSpan: 1 | 2 | 3 = userSize?.colSpan ?? defaultSpan;
    const effectiveRowSpan: 1 | 2 | 3 = userSize?.rowSpan ?? (k.kind === "panel" ? (k.defaultRowSpan ?? 1) : 1);
    const spanClass =
      gridCols === 6
        ? effectiveSpan === 3 ? "col-span-2 md:col-span-3 xl:col-span-3"
        : effectiveSpan === 2 ? "col-span-2 md:col-span-2" : ""
        : colSpanClass(effectiveSpan);
    const isResizing = resizingId === id;
    const panelContentHeight = ROW_STEP * effectiveRowSpan;
    return (
      <div
        key={id}
        data-kpi-id={id}
        draggable={!isResizing && handleHoverId !== id}
        onDragStart={(e) => { if (handleHoverId === id || isResizing) { e.preventDefault(); return; } setDragId(id); }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={() => handleDrop(id)}
        onDragEnd={() => setDragId(null)}
        className={cn(
          spanClass, "relative group transition-all",
          handleHoverId !== id && "cursor-move",
          dragId === id && "opacity-40",
          isResizing && "ring-2 ring-primary outline-none rounded",
        )}
      >
        {k.kind === "stat" ? (
          <StatCard
            label={k.label}
            value={k.getValue?.() ?? ""}
            intent={k.intent}
            delta={k.getDelta?.() ?? ""}
            trend={k.getTrend?.()}
            onRemove={() => removeKpi(id)}
          />
        ) : (
          <Panel title={k.title} action={k.action} padded={k.padded} onRemove={() => removeKpi(id)}>
            <div style={{ height: panelContentHeight }} className="overflow-auto">
              {k.render?.()}
            </div>
          </Panel>
        )}
        {isResizing && (
          <div className="pointer-events-none absolute top-1 left-1 z-20 rounded-sm bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground shadow">
            {effectiveSpan}/{gridCols === 6 ? 6 : 3}
            {k.kind === "panel" && resizingAxis !== "x" && ` · ${effectiveRowSpan}/3`}
          </div>
        )}
        <div
          onPointerDown={(e) => startResize(id, "x", e)}
          onPointerEnter={() => setHandleHoverId(id)}
          onPointerLeave={() => { if (resizingId !== id) setHandleHoverId(null); }}
          onDoubleClick={(e) => { e.stopPropagation(); resetSize(id); }}
          title="Drag to resize width · double-click to reset"
          className={cn("absolute top-2 bottom-4 -right-0.5 w-2 z-20 cursor-ew-resize opacity-0 group-hover:opacity-60 hover:opacity-100 hover:bg-primary/10 transition-opacity", isResizing && resizingAxis === "x" && "opacity-100 bg-primary/10")}
        />
        {k.kind === "panel" && (
          <div
            onPointerDown={(e) => startResize(id, "y", e)}
            onPointerEnter={() => setHandleHoverId(id)}
            onPointerLeave={() => { if (resizingId !== id) setHandleHoverId(null); }}
            onDoubleClick={(e) => { e.stopPropagation(); resetSize(id); }}
            title="Drag to resize height · double-click to reset"
            className={cn("absolute left-2 right-4 -bottom-0.5 h-2 z-20 cursor-ns-resize opacity-0 group-hover:opacity-60 hover:opacity-100 hover:bg-primary/10 transition-opacity", isResizing && resizingAxis === "y" && "opacity-100 bg-primary/10")}
          />
        )}
        <div
          onPointerDown={(e) => startResize(id, k.kind === "panel" ? "xy" : "x", e)}
          onPointerEnter={() => setHandleHoverId(id)}
          onPointerLeave={() => { if (resizingId !== id) setHandleHoverId(null); }}
          onDoubleClick={(e) => { e.stopPropagation(); resetSize(id); }}
          title="Drag to resize · double-click to reset"
          className={cn("absolute -bottom-0.5 -right-0.5 h-5 w-5 z-30 flex items-end justify-end p-0.5 rounded-bl-sm", k.kind === "panel" ? "cursor-nwse-resize" : "cursor-ew-resize", "opacity-60 hover:opacity-100 hover:bg-primary/10 transition-opacity", isResizing && "opacity-100")}
        >
          <svg viewBox="0 0 10 10" className="h-3.5 w-3.5 text-muted-foreground">
            <path d="M9 1 L1 9 M9 5 L5 9" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" fill="none" />
          </svg>
        </div>
      </div>
    );
  };

  const toolbar = (
    <>
      <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
        <PopoverTrigger asChild>
          <button className="inline-flex h-8 items-center gap-1.5 rounded-sm border border-dashed border-border bg-surface px-2.5 text-[12px] font-medium text-foreground hover:border-primary hover:text-primary">
            <Plus className="h-3.5 w-3.5" /> {pickerLabel}
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-80 p-1">
          <div className="px-2 py-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">Available KPIs</div>
          <ul
            className="max-h-96 overflow-auto"
            onMouseLeave={() => setHoveredKpiId(null)}
          >
            {availableToAdd.map((k) => {
              const Icon = k.icon;
              const isHovered = hoveredKpiId === k.id;
              return (
                <li key={k.id}>
                  <HoverCard open={isHovered} openDelay={0} closeDelay={0}>
                    <HoverCardTrigger asChild>
                      <button
                        onClick={() => addKpi(k.id)}
                        onPointerEnter={() => setHoveredKpiId(k.id)}
                        onFocus={() => setHoveredKpiId(k.id)}
                        className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-[13px] hover:bg-muted"
                      >
                        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="flex-1 truncate">{k.label}</span>
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{k.kind === "stat" ? "Stat" : "Chart"}</span>
                        <Plus className="h-3 w-3 text-muted-foreground" />
                      </button>
                    </HoverCardTrigger>
                    {isHovered && (
                      <HoverCardContent side="left" align="start" className="w-72 p-3">
                        <p className="text-[12px] leading-snug text-muted-foreground">{k.description}</p>
                      </HoverCardContent>
                    )}
                  </HoverCard>
                </li>
              );
            })}
            {availableToAdd.length === 0 && (
              <li className="px-2 py-3 text-center text-[12px] text-muted-foreground">All KPIs added</li>
            )}
          </ul>
        </PopoverContent>

      </Popover>
      {toolbarRight}
    </>
  );

  return (
    <div className="space-y-4 lg:space-y-5">
      {bannerLeft ? (
        <div className="-mx-4 lg:-mx-6 -mt-4 lg:-mt-6 mb-1 border-b border-border bg-surface px-4 lg:px-6 py-2.5 flex flex-wrap items-center gap-x-3 gap-y-2">
          {bannerLeft}
          <div className="flex items-center gap-2 ml-auto">{toolbar}</div>
        </div>
      ) : (
        <div className="flex items-center gap-2">{toolbar}</div>
      )}


      {visibleStats.length > 0 && (
        <div ref={gridRef} className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-3 items-start">
          {visibleStats.map((id) => renderTile(id, 6))}
        </div>
      )}
      {visiblePanels.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
          {visiblePanels.map((id) => renderTile(id, 3))}
        </div>
      )}
      {visibleIds.length === 0 && (
        <div className="text-center text-[12px] text-muted-foreground py-8">
          No KPIs visible. Use "{pickerLabel}" to add one.
        </div>
      )}
    </div>
  );
}
