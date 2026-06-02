import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo, useRef } from "react";
import { Plus, Download, ArrowRight, TrendingUp, Clock, Users, AlertTriangle, ThumbsUp, Repeat, Building2, Filter, BarChart3, LineChart as LineChartIcon, MapPin, ListChecks, Activity } from "lucide-react";
import { COMPLAINT_TYPES } from "@/lib/mock-data";
import {
  PageHeader, StatCard, Panel, StatusBadge, SlaBadge,
  ActionButton, OwnerCell, DataTable, nextActionFor,
} from "@/components/pgr/primitives";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { useRbac } from "@/lib/rbac";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";
import {
  trend7d, COMPLAINTS, complaintTypeOf,
  type Complaint,
} from "@/lib/mock-data";

import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar,
} from "recharts";

type KpiKind = "stat" | "panel";

type KpiDef = {
  id: string;
  label: string;
  description: string;
  kind: KpiKind;
  icon: React.ComponentType<{ className?: string }>;
  // stat-specific
  intent?: "positive" | "negative" | "warning" | "neutral";
  getValue?: () => string;
  getDelta?: () => string;
  // panel-specific
  colSpan?: 1 | 2 | 3;
  padded?: boolean;
  title?: string;
  action?: React.ReactNode;
  render?: () => React.ReactNode;
};

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — DIGIT PGR" }] }),
  component: DashboardPage,
});

function DashboardPage() {
  const { jurisdiction, role } = useRbac();
  const canCustomize = role === "TEST_USER";

  // Filter state (TEST_USER only)
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [geoFilter, setGeoFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  // Apply filters to the complaint dataset. Non-TEST_USER roles see the
  // unfiltered numbers (their filter bar is hidden).
  const filteredComplaints = useMemo(() => {
    if (!canCustomize) return COMPLAINTS;
    const fromTs = fromDate ? new Date(fromDate + "T00:00:00").getTime() : null;
    const toTs = toDate ? new Date(toDate + "T23:59:59").getTime() : null;
    return COMPLAINTS.filter((c) => {
      const filedTs = new Date(c.filedOn).getTime();
      if (fromTs !== null && filedTs < fromTs) return false;
      if (toTs !== null && filedTs > toTs) return false;
      if (geoFilter && c.ward !== geoFilter) return false;
      if (typeFilter && c.typeCode !== typeFilter) return false;
      return true;
    });
  }, [canCustomize, fromDate, toDate, geoFilter, typeFilter]);

  const s = useMemo(() => {
    const total = filteredComplaints.length;
    const open = filteredComplaints.filter((c) => ["OPEN", "ASSIGNED", "IN_PROGRESS", "REOPENED"].includes(c.status)).length;
    const resolved = filteredComplaints.filter((c) => c.status === "RESOLVED" || c.status === "CLOSED").length;
    const breached = filteredComplaints.filter((c) => c.slaState === "BREACHED").length;
    const reopens = filteredComplaints.filter((c) => c.reopenCount > 0).length;
    return {
      total, open, resolved, breached,
      avgResolutionHrs: 42,
      reopenRate: total ? Math.round((reopens / total) * 100) : 0,
      satisfaction: 4.1,
    };
  }, [filteredComplaints]);

  const dept = useMemo(() => {
    const map = new Map<string, { open: number; resolved: number; breached: number }>();
    for (const c of filteredComplaints) {
      const m = map.get(c.department) ?? { open: 0, resolved: 0, breached: 0 };
      if (c.status === "RESOLVED" || c.status === "CLOSED") m.resolved++;
      else m.open++;
      if (c.slaState === "BREACHED") m.breached++;
      map.set(c.department, m);
    }
    return Array.from(map, ([department, v]) => ({ department, ...v }));
  }, [filteredComplaints]);

  const wards = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of filteredComplaints) map.set(c.ward, (map.get(c.ward) ?? 0) + 1);
    return Array.from(map, ([ward, total]) => ({ ward, total }));
  }, [filteredComplaints]);

  // Full ward list for the geography selector so options don't disappear
  // after filtering by ward.
  const allWards = useMemo(() => {
    const set = new Set<string>();
    for (const c of COMPLAINTS) set.add(c.ward);
    return Array.from(set).sort();
  }, []);

  const trend = trend7d();
  const recent = filteredComplaints.slice(0, 6);
  const wardsMax = Math.max(...wards.map((w) => w.total), 1);


  // Unified KPI registry: every box (stat card or chart panel) is a KPI.
  const KPI_REGISTRY: KpiDef[] = useMemo(() => [
    // Stat KPIs
    { id: "total", kind: "stat", label: t("CS_TOTAL_COMPLAINTS"), description: "Total complaints registered in the selected period.", icon: TrendingUp, intent: "neutral", getValue: () => String(s.total), getDelta: () => "+12 vs last week" },
    { id: "open", kind: "stat", label: t("CS_OPEN_COMPLAINTS"), description: "Complaints currently open and awaiting resolution.", icon: AlertTriangle, intent: "warning", getValue: () => String(s.open), getDelta: () => "4 nearing breach" },
    { id: "resolved", kind: "stat", label: t("CS_RESOLVED_COMPLAINTS"), description: "Complaints resolved in the selected period.", icon: ThumbsUp, intent: "positive", getValue: () => String(s.resolved), getDelta: () => "87% within SLA" },
    { id: "breached", kind: "stat", label: t("CS_SLA_BREACHED"), description: "Complaints where SLA has been breached.", icon: AlertTriangle, intent: "negative", getValue: () => String(s.breached), getDelta: () => "Escalation L2 active" },
    { id: "avg-resolution", kind: "stat", label: t("CS_AVG_RESOLUTION"), description: "Average time taken to resolve a complaint.", icon: Clock, intent: "neutral", getValue: () => `${s.avgResolutionHrs}h`, getDelta: () => "Target: 36h" },
    { id: "reopen", kind: "stat", label: t("CS_REOPEN_RATE"), description: "Percentage of complaints reopened after resolution.", icon: Repeat, intent: "neutral", getValue: () => `${s.reopenRate}%`, getDelta: () => `CSAT ${s.satisfaction}/5` },
    { id: "first-response", kind: "stat", label: "Avg. first response", description: "Mean time from registration to first officer acknowledgement.", icon: Clock, intent: "positive", getValue: () => "2.4h", getDelta: () => "−18% WoW" },
    { id: "escalation-rate", kind: "stat", label: "Escalation rate", description: "Share of complaints escalated to L2/L3 within the SLA window.", icon: TrendingUp, intent: "warning", getValue: () => "9.2%", getDelta: () => "+1.1 pts" },
    { id: "active-officers", kind: "stat", label: "Active field officers", description: "Officers with at least one assignment in the last 24 hours.", icon: Users, intent: "neutral", getValue: () => "142", getDelta: () => "12 on leave" },
    { id: "repeat-citizens", kind: "stat", label: "Repeat complainants", description: "Citizens filing more than one complaint in 30 days.", icon: Repeat, intent: "warning", getValue: () => "63", getDelta: () => "+8 vs last week" },
    { id: "ageing", kind: "stat", label: "Ageing > 7 days", description: "Open complaints older than 7 days awaiting closure.", icon: AlertTriangle, intent: "negative", getValue: () => "37", getDelta: () => "5 cross-dept" },
    { id: "csat-trend", kind: "stat", label: "CSAT trend (7d)", description: "Rolling change in citizen satisfaction over 7 days.", icon: ThumbsUp, intent: "positive", getValue: () => "+0.3", getDelta: () => "vs 4.1 baseline" },
    { id: "dept-load", kind: "stat", label: "Dept. load index", description: "Open-complaint to officer ratio; 1.0 = balanced.", icon: Building2, intent: "neutral", getValue: () => "1.18", getDelta: () => "PWD highest" },

    // Chart / Panel KPIs
    {
      id: "trend", kind: "panel", label: "Complaints filed vs resolved", description: "7-day line chart of complaints filed vs resolved.",
      icon: LineChartIcon, colSpan: 2, title: "Complaints filed vs resolved — last 7 days",
      render: () => (
        <div className="h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trend} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={{ stroke: "var(--border)" }} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 4, border: "1px solid var(--border)" }} />
              <Line type="monotone" dataKey="filed" stroke="var(--color-chart-1)" strokeWidth={2} dot={{ r: 3 }} name="Filed" />
              <Line type="monotone" dataKey="resolved" stroke="var(--color-chart-3)" strokeWidth={2} dot={{ r: 3 }} name="Resolved" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ),
    },
    {
      id: "wards", kind: "panel", label: "By locality", description: "Complaint volume by ward.",
      icon: MapPin, colSpan: 1, title: "By locality",
      render: () => (
        <ul className="space-y-2 text-[12px]">
          {wards.map((w) => (
            <li key={w.ward} className="grid grid-cols-[80px_1fr_28px] items-center gap-2">
              <span className="truncate text-foreground">{w.ward}</span>
              <span className="h-2 rounded-sm bg-muted">
                <span className="block h-full rounded-sm bg-primary" style={{ width: `${(w.total / wardsMax) * 100}%` }} />
              </span>
              <span className="text-right tabular-nums text-muted-foreground">{w.total}</span>
            </li>
          ))}
        </ul>
      ),
    },
    {
      id: "dept", kind: "panel", label: "By department", description: "Open vs resolved vs breached by department.",
      icon: BarChart3, colSpan: 2, title: "By department — open vs resolved",
      render: () => (
        <div className="h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dept} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="department" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={{ stroke: "var(--border)" }} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 4, border: "1px solid var(--border)" }} />
              <Bar dataKey="open" fill="var(--color-chart-1)" name="Open" radius={[2, 2, 0, 0]} />
              <Bar dataKey="resolved" fill="var(--color-chart-3)" name="Resolved" radius={[2, 2, 0, 0]} />
              <Bar dataKey="breached" fill="var(--color-chart-4)" name="Breached" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ),
    },
    {
      id: "recent", kind: "panel", label: "Recent activity", description: "Latest complaint registrations.",
      icon: Activity, colSpan: 1, title: "Recent activity", padded: false,
      action: <Link to="/inbox" className="text-[12px] text-primary hover:underline inline-flex items-center gap-1">View inbox <ArrowRight className="h-3 w-3" /></Link>,
      render: () => (
        <ul className="divide-y divide-border">
          {recent.map((c) => (
            <li key={c.id}>
              <Link to="/inbox/$id" params={{ id: c.id }} className="flex items-start gap-3 px-4 py-2.5 hover:bg-muted/50">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
                    <span className="font-mono">{c.id}</span><span>·</span><span>{c.ward}</span>
                  </div>
                  <div className="mt-0.5 truncate text-[13px] font-medium text-foreground">
                    {complaintTypeOf(c.typeCode)?.name}
                  </div>
                </div>
                <StatusBadge status={c.status} />
              </Link>
            </li>
          ))}
        </ul>
      ),
    },
    {
      id: "sla", kind: "panel", label: "SLA at risk", description: "Complaints approaching or past SLA in next 24h.",
      icon: ListChecks, colSpan: 3, title: "SLA at risk — next 24 hours", padded: false,
      render: () => (
        <DataTable<Complaint>
          emptyMessage={t("EMPTY_INBOX")}
          rows={filteredComplaints.filter(c => c.slaState !== "WITHIN" && c.status !== "RESOLVED" && c.status !== "REJECTED").slice(0, 6)}
          columns={[
            { key: "id", header: t("CS_COMPLAINT_NO"), cell: (c) => <Link to="/inbox/$id" params={{ id: c.id }} className="font-mono text-[12px] text-primary hover:underline">{c.id}</Link> },
            { key: "type", header: t("CS_COMPLAINT_TYPE"), cell: (c) => <span>{complaintTypeOf(c.typeCode)?.name}</span> },
            { key: "loc", header: t("COMMON_LOCALITY"), cell: (c) => <span className="text-[12px]">{c.locality}</span> },
            { key: "owner", header: t("COMMON_OWNER"), cell: (c) => <OwnerCell id={c.assignedOfficerId} /> },
            { key: "sla", header: t("CS_SLA_STATUS"), cell: (c) => <SlaBadge state={c.slaState} remainingHrs={c.slaRemainingHrs} /> },
            { key: "status", header: t("CS_COMPLAINT_STATUS"), cell: (c) => <StatusBadge status={c.status} /> },
            { key: "next", header: t("CS_NEXT_ACTION"), cell: (c) => <span className="text-[12px] font-medium">{nextActionFor(c)}</span> },
          ]}
        />
      ),
    },
  ], [s, dept, wards, trend, recent, wardsMax]);

  const kpiById = useMemo(() => {
    const m = new Map<string, KpiDef>();
    KPI_REGISTRY.forEach((k) => m.set(k.id, k));
    return m;
  }, [KPI_REGISTRY]);

  // Default visible set: stats first, then key charts. Resets each mount.
  const defaultIds = useMemo(
    () => ["total", "open", "resolved", "breached", "avg-resolution", "reopen", "trend", "wards", "dept", "recent", "sla"],
    [],
  );
  const [visibleIds, setVisibleIds] = useState<string[]>(defaultIds);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);

  const removeKpi = (id: string) => setVisibleIds((prev) => prev.filter((x) => x !== id));
  const addKpi = (id: string) => {
    setVisibleIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
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

  // Per-tile resize. Width snaps to grid columns (1..3).
  const gridRef = useRef<HTMLDivElement>(null);
  const [sizes, setSizes] = useState<Record<string, { colSpan: 1 | 2 | 3 }>>({});
  const [resizingId, setResizingId] = useState<string | null>(null);
  // Disable native drag while pointer is on a resize handle so HTML5 drag doesn't
  // race with our pointer-based resize.
  const [handleHoverId, setHandleHoverId] = useState<string | null>(null);

  const startResize = (id: string, _kind: KpiKind, e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const handleEl = e.currentTarget;
    handleEl.setPointerCapture(e.pointerId);
    setResizingId(id);

    const grid = gridRef.current;
    const tile = document.querySelector(`[data-kpi-id="${id}"]`) as HTMLElement | null;
    const parentGrid = tile?.parentElement as HTMLElement | null;
    if (!tile || !parentGrid) return;
    const gridRect = parentGrid.getBoundingClientRect();
    const tileRect = tile.getBoundingClientRect();
    const gap = 12;
    // Detect column count from computed grid-template-columns
    const styles = window.getComputedStyle(parentGrid);
    const cols = styles.gridTemplateColumns.split(" ").filter(Boolean).length || 3;
    const maxSpan = Math.min(cols, 3) as 1 | 2 | 3;
    const colWidth = (gridRect.width + gap) / cols;

    const onMove = (ev: PointerEvent) => {
      const widthFromLeft = ev.clientX - tileRect.left;
      const span = Math.max(1, Math.min(maxSpan, Math.round(widthFromLeft / colWidth))) as 1 | 2 | 3;
      setSizes((p) => ({ ...p, [id]: { colSpan: span } }));
    };
    void grid;

    const onUp = (ev: PointerEvent) => {
      handleEl.releasePointerCapture?.(ev.pointerId);
      setResizingId(null);
      handleEl.removeEventListener("pointermove", onMove);
      handleEl.removeEventListener("pointerup", onUp);
      handleEl.removeEventListener("pointercancel", onUp);
    };
    handleEl.addEventListener("pointermove", onMove);
    handleEl.addEventListener("pointerup", onUp);
    handleEl.addEventListener("pointercancel", onUp);
  };

  const resetSize = (id: string) => {
    setSizes((p) => {
      const next = { ...p };
      delete next[id];
      return next;
    });
  };

  const availableToAdd = KPI_REGISTRY.filter((k) => !visibleIds.includes(k.id));

  const colSpanClass = (n: 1 | 2 | 3) =>
    n === 3 ? "md:col-span-2 lg:col-span-3" : n === 2 ? "md:col-span-2" : "";

  return (
    <div>
      <PageHeader
        title={t("CS_DASHBOARD_TITLE")}
        subtitle={`Operational view · ${jurisdiction.name} · Last 7 days`}
        primaryAction={
          <div className="flex flex-col items-end gap-2">
            {canCustomize && (
              <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
                <PopoverTrigger asChild>
                  <button className="inline-flex h-8 items-center gap-1.5 rounded-sm border border-dashed border-border bg-surface px-3 text-[12px] font-medium text-foreground hover:border-primary hover:text-primary">
                    <Plus className="h-3.5 w-3.5" /> Add KPI
                  </button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-80 p-1">
                  <div className="px-2 py-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">Available KPIs</div>
                  <ul className="max-h-96 overflow-auto">
                    {availableToAdd.map((k) => {
                      const Icon = k.icon;
                      return (
                        <li key={k.id}>
                          <HoverCard openDelay={120} closeDelay={60}>
                            <HoverCardTrigger asChild>
                              <button
                                onClick={() => addKpi(k.id)}
                                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-[13px] hover:bg-muted"
                              >
                                <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="flex-1 truncate">{k.label}</span>
                                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{k.kind === "stat" ? "Stat" : "Chart"}</span>
                                <Plus className="h-3 w-3 text-muted-foreground" />
                              </button>
                            </HoverCardTrigger>
                            <HoverCardContent side="left" align="start" className="w-72 p-3">
                              {k.kind === "stat" ? (
                                <div className="mb-2 w-fit">
                                  <StatCard label={k.label} value={k.getValue?.() ?? ""} intent={k.intent} delta={k.getDelta?.() ?? ""} />
                                </div>
                              ) : (
                                <div className="mb-2 rounded border border-border bg-muted/30 px-3 py-2 text-[12px] text-foreground inline-flex items-center gap-2">
                                  <Icon className="h-3.5 w-3.5 text-muted-foreground" /> {k.title ?? k.label}
                                </div>
                              )}
                              <p className="text-[12px] leading-snug text-muted-foreground">{k.description}</p>
                            </HoverCardContent>
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
            )}
            <div className="flex gap-2">
              <ActionButton variant="secondary" icon={<Download className="h-3.5 w-3.5" />}>{t("COMMON_EXPORT")}</ActionButton>
              <Link to="/complaints/new">
                <ActionButton permission="PGR_COMPLAINT_CREATE" variant="primary" icon={<Plus className="h-3.5 w-3.5" />}>
                  {t("ACTION_REGISTER")}
                </ActionButton>
              </Link>
            </div>
          </div>
        }
      />

      <div className="p-4 lg:p-6 space-y-4 lg:space-y-5">
        <DemoSetupBanner />
        {canCustomize && (
          <div className="rounded border border-border bg-surface p-3 flex flex-wrap items-end gap-3">
            <div className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-foreground">
              <Filter className="h-3.5 w-3.5 text-muted-foreground" /> Filters
            </div>
            <label className="flex flex-col gap-1 text-[11px] text-muted-foreground">
              From
              <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)}
                className="h-8 rounded-sm border border-border bg-background px-2 text-[12px] text-foreground" />
            </label>
            <label className="flex flex-col gap-1 text-[11px] text-muted-foreground">
              To
              <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)}
                className="h-8 rounded-sm border border-border bg-background px-2 text-[12px] text-foreground" />
            </label>
            <label className="flex flex-col gap-1 text-[11px] text-muted-foreground">
              Geography
              <select value={geoFilter} onChange={(e) => setGeoFilter(e.target.value)}
                className="h-8 rounded-sm border border-border bg-background px-2 text-[12px] text-foreground min-w-[140px]">
                <option value="">All wards</option>
                {allWards.map((w) => <option key={w} value={w}>{w}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-[11px] text-muted-foreground">
              Complaint type
              <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
                className="h-8 rounded-sm border border-border bg-background px-2 text-[12px] text-foreground min-w-[180px]">
                <option value="">All types</option>
                {COMPLAINT_TYPES.filter((c) => c.active).map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
              </select>
            </label>
            {(fromDate || toDate || geoFilter || typeFilter) && (
              <button
                onClick={() => { setFromDate(""); setToDate(""); setGeoFilter(""); setTypeFilter(""); }}
                className="h-8 rounded-sm border border-border bg-surface px-3 text-[12px] font-medium text-muted-foreground hover:text-foreground"
              >
                Clear
              </button>
            )}
          </div>
        )}

        {canCustomize ? (() => {
          const visibleStats = visibleIds.filter((id) => kpiById.get(id)?.kind === "stat");
          const visiblePanels = visibleIds.filter((id) => kpiById.get(id)?.kind === "panel");

          const renderTile = (id: string, gridCols: 3 | 6) => {
            const k = kpiById.get(id);
            if (!k) return null;
            const userSize = sizes[id];
            const defaultSpan: 1 | 2 | 3 = k.kind === "panel" ? (k.colSpan ?? 1) : 1;
            const effectiveSpan: 1 | 2 | 3 = userSize?.colSpan ?? defaultSpan;
            const spanClass =
              gridCols === 6
                ? effectiveSpan === 3
                  ? "col-span-2 md:col-span-3 xl:col-span-3"
                  : effectiveSpan === 2
                    ? "col-span-2 md:col-span-2"
                    : ""
                : colSpanClass(effectiveSpan);
            const isResizing = resizingId === id;
            return (
              <div
                key={id}
                data-kpi-id={id}
                draggable={!isResizing && handleHoverId !== id}
                onDragStart={(e) => {
                  if (handleHoverId === id || isResizing) { e.preventDefault(); return; }
                  setDragId(id);
                }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(id)}
                onDragEnd={() => setDragId(null)}
                className={cn(
                  spanClass,
                  "relative group transition-all",
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
                    onRemove={() => removeKpi(id)}
                  />
                ) : (
                  <Panel
                    title={k.title}
                    action={k.action}
                    padded={k.padded}
                    onRemove={() => removeKpi(id)}
                  >
                    {k.render?.()}
                  </Panel>
                )}

                {isResizing && (
                  <div className="pointer-events-none absolute top-1 left-1 z-20 rounded-sm bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground shadow">
                    {effectiveSpan}/{gridCols === 6 ? 6 : 3}
                  </div>
                )}

                <div
                  onPointerDown={(e) => startResize(id, k.kind, e)}
                  onPointerEnter={() => setHandleHoverId(id)}
                  onPointerLeave={() => { if (resizingId !== id) setHandleHoverId(null); }}
                  onDoubleClick={(e) => { e.stopPropagation(); resetSize(id); }}
                  title="Drag to resize width · double-click to reset"
                  className={cn(
                    "absolute -bottom-0.5 -right-0.5 h-5 w-5 z-20 flex items-end justify-end p-0.5 cursor-ew-resize rounded-bl-sm",
                    "opacity-60 hover:opacity-100 hover:bg-primary/10 transition-opacity",
                    isResizing && "opacity-100",
                  )}
                >
                  <svg viewBox="0 0 10 10" className="h-3.5 w-3.5 text-muted-foreground">
                    <path d="M9 1 L1 9 M9 5 L5 9" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" fill="none" />
                  </svg>
                </div>
              </div>
            );
          };

          return (
            <>
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
                  No KPIs visible. Use "Add KPI" to add one.
                </div>
              )}
            </>
          );
        })() : (

          <>
            <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-3">
              {KPI_REGISTRY.filter((k) => k.kind === "stat").slice(0, 6).map((k) => (
                <StatCard key={k.id} label={k.label} value={k.getValue?.() ?? ""} intent={k.intent} delta={k.getDelta?.() ?? ""} />
              ))}
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
              {KPI_REGISTRY.filter((k) => k.kind === "panel").map((k) => {
                const span = k.colSpan === 3 ? "xl:col-span-3" : k.colSpan === 2 ? "xl:col-span-2" : "";
                return (
                  <div key={k.id} className={span}>
                    <Panel title={k.title} action={k.action} padded={k.padded}>
                      {k.render?.()}
                    </Panel>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
