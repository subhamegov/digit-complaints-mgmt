import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Plus, Download, ArrowRight, TrendingUp, Clock, Users, AlertTriangle, ThumbsUp, Repeat, Building2, Filter, LayoutGrid } from "lucide-react";
import { COMPLAINT_TYPES } from "@/lib/mock-data";
import {
  PageHeader, StatCard, Panel, StatusBadge, SlaBadge,
  ActionButton, OwnerCell, DataTable, nextActionFor, type Column,
} from "@/components/pgr/primitives";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { useRbac } from "@/lib/rbac";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";
import {
  dashboardSummary, byDepartment, byWard, trend7d, COMPLAINTS, complaintTypeOf,
  type Complaint,
} from "@/lib/mock-data";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar,
} from "recharts";

type KpiOption = {
  id: string;
  label: string;
  value: string;
  intent?: "positive" | "negative" | "warning" | "neutral";
  delta: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
};

const DEFAULT_KPIS: KpiOption[] = [
  { id: "total", label: t("CS_TOTAL_COMPLAINTS"), value: "", intent: "neutral", delta: "+12 vs last week", description: "Total complaints registered in the selected period.", icon: TrendingUp },
  { id: "open", label: t("CS_OPEN_COMPLAINTS"), value: "", intent: "warning", delta: "4 nearing breach", description: "Complaints currently open and awaiting resolution.", icon: AlertTriangle },
  { id: "resolved", label: t("CS_RESOLVED_COMPLAINTS"), value: "", intent: "positive", delta: "87% within SLA", description: "Complaints resolved in the selected period.", icon: ThumbsUp },
  { id: "breached", label: t("CS_SLA_BREACHED"), value: "", intent: "negative", delta: "Escalation L2 active", description: "Complaints where SLA has been breached.", icon: AlertTriangle },
  { id: "avg-resolution", label: t("CS_AVG_RESOLUTION"), value: "", intent: "neutral", delta: "Target: 36h", description: "Average time taken to resolve a complaint.", icon: Clock },
  { id: "reopen", label: t("CS_REOPEN_RATE"), value: "", intent: "neutral", delta: "", description: "Percentage of complaints reopened after resolution.", icon: Repeat },
];

const ADDITIONAL_KPIS: KpiOption[] = [
  { id: "first-response", label: "Avg. first response", value: "2.4h", intent: "positive", delta: "−18% WoW", description: "Mean time from complaint registration to first officer acknowledgement.", icon: Clock },
  { id: "escalation-rate", label: "Escalation rate", value: "9.2%", intent: "warning", delta: "+1.1 pts", description: "Share of complaints escalated to L2/L3 within the SLA window.", icon: TrendingUp },
  { id: "active-officers", label: "Active field officers", value: "142", intent: "neutral", delta: "12 on leave", description: "Officers with at least one assignment touched in the last 24 hours.", icon: Users },
  { id: "repeat-citizens", label: "Repeat complainants", value: "63", intent: "warning", delta: "+8 vs last week", description: "Unique citizens filing more than one complaint in the last 30 days.", icon: Repeat },
  { id: "ageing", label: "Ageing > 7 days", value: "37", intent: "negative", delta: "5 cross-dept", description: "Open complaints with age greater than 7 days, awaiting closure.", icon: AlertTriangle },
  { id: "csat-trend", label: "CSAT trend (7d)", value: "+0.3", intent: "positive", delta: "vs 4.1 baseline", description: "Rolling change in citizen satisfaction score over the last 7 days.", icon: ThumbsUp },
  { id: "dept-load", label: "Dept. load index", value: "1.18", intent: "neutral", delta: "PWD highest", description: "Open-complaint to officer ratio across departments; 1.0 = balanced.", icon: Building2 },
];


const PANEL_LABELS: Record<string, string> = {
  overview: "Overview (KPIs)",
  trend: "Complaints filed vs resolved",
  wards: "By locality",
  dept: "By department",
  recent: "Recent activity",
  sla: "SLA at risk",
};

const ALL_PANEL_IDS = ["overview", "trend", "wards", "dept", "recent", "sla"];

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — DIGIT PGR" }] }),
  component: DashboardPage,
});

function DashboardPage() {
  const s = dashboardSummary();
  const dept = byDepartment();
  const wards = byWard();
  const trend = trend7d();
  const { jurisdiction, role } = useRbac();
  const canCustomize = role === "TEST_USER";

  const recent = COMPLAINTS.slice(0, 6);

  // Default KPIs are always visible on first mount; added ones start empty.
  // This naturally resets every time the dashboard is opened.
  const defaultIds = useMemo(() => DEFAULT_KPIS.map((k) => k.id), []);
  const [visibleKpiIds, setVisibleKpiIds] = useState<string[]>(defaultIds);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);

  const DEFAULT_PANEL_IDS = canCustomize
    ? ["overview", "trend", "wards", "dept", "recent", "sla"]
    : ["trend", "wards", "dept", "recent", "sla"];
  const [visiblePanelIds, setVisiblePanelIds] = useState<string[]>(DEFAULT_PANEL_IDS);
  const [panelDragId, setPanelDragId] = useState<string | null>(null);
  const [panelPickerOpen, setPanelPickerOpen] = useState(false);

  // Filter state (TEST_USER only)
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [geoFilter, setGeoFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const removePanel = (id: string) => setVisiblePanelIds((prev) => prev.filter((x) => x !== id));
  const addPanel = (id: string) => {
    setVisiblePanelIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    setPanelPickerOpen(false);
  };
  const handlePanelDrop = (targetId: string) => {
    if (!panelDragId || panelDragId === targetId) return;
    setVisiblePanelIds((prev) => {
      const next = [...prev];
      const from = next.indexOf(panelDragId);
      const to = next.indexOf(targetId);
      if (from === -1 || to === -1) return prev;
      next.splice(from, 1);
      next.splice(to, 0, panelDragId);
      return next;
    });
    setPanelDragId(null);
  };

  const allKpis: KpiOption[] = useMemo(() => {
    const dynamicDefaults = DEFAULT_KPIS.map((k) => {
      let value = k.value;
      if (k.id === "total") value = String(s.total);
      if (k.id === "open") value = String(s.open);
      if (k.id === "resolved") value = String(s.resolved);
      if (k.id === "breached") value = String(s.breached);
      if (k.id === "avg-resolution") value = `${s.avgResolutionHrs}h`;
      if (k.id === "reopen") value = `${s.reopenRate}%`;
      let delta = k.delta;
      if (k.id === "reopen") delta = `CSAT ${s.satisfaction}/5`;
      return { ...k, value, delta };
    });
    return [...dynamicDefaults, ...ADDITIONAL_KPIS];
  }, [s]);

  const removeKpi = (id: string) => {
    setVisibleKpiIds((prev) => prev.filter((x) => x !== id));
  };

  const addKpi = (id: string) => {
    setVisibleKpiIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    setPickerOpen(false);
  };

  const handleDrop = (targetId: string) => {
    if (!dragId || dragId === targetId) return;
    setVisibleKpiIds((prev) => {
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

  const availableToAdd = allKpis.filter((k) => !visibleKpiIds.includes(k.id));
  const availablePanelsToAdd: string[] = ALL_PANEL_IDS.filter((pid) => !visiblePanelIds.includes(pid));




  return (
    <div>
      <PageHeader
        title={t("CS_DASHBOARD_TITLE")}
        subtitle={`Operational view · ${jurisdiction.name} · Last 7 days`}
        primaryAction={
          <div className="flex flex-col items-end gap-2">
            {canCustomize && (
              <div className="flex flex-wrap items-center gap-2">
                <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
                  <PopoverTrigger asChild>
                    <button className="inline-flex h-8 items-center gap-1.5 rounded-sm border border-dashed border-border bg-surface px-3 text-[12px] font-medium text-foreground hover:border-primary hover:text-primary">
                      <Plus className="h-3.5 w-3.5" /> Add KPI
                    </button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-72 p-1">
                    <div className="px-2 py-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">Available KPIs</div>
                    <ul className="max-h-80 overflow-auto">
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
                                  <Plus className="h-3 w-3 text-muted-foreground" />
                                </button>
                              </HoverCardTrigger>
                              <HoverCardContent side="left" align="start" className="w-64 p-3">
                                <div className="mb-2 w-fit">
                                  <StatCard label={k.label} value={k.value} intent={k.intent} delta={k.delta} />
                                </div>
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

                <Popover open={panelPickerOpen} onOpenChange={setPanelPickerOpen}>
                  <PopoverTrigger asChild>
                    <button className="inline-flex h-8 items-center gap-1.5 rounded-sm border border-dashed border-border bg-surface px-3 text-[12px] font-medium text-foreground hover:border-primary hover:text-primary">
                      <LayoutGrid className="h-3.5 w-3.5" /> Add panel
                    </button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-64 p-1">
                    <div className="px-2 py-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">Available panels</div>
                    <ul className="max-h-80 overflow-auto">
                      {availablePanelsToAdd.map((pid) => (
                        <li key={pid}>
                          <button
                            onClick={() => addPanel(pid)}
                            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-[13px] hover:bg-muted"
                          >
                            <LayoutGrid className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="flex-1 truncate">{PANEL_LABELS[pid] ?? pid}</span>
                            <Plus className="h-3 w-3 text-muted-foreground" />
                          </button>
                        </li>
                      ))}
                      {availablePanelsToAdd.length === 0 && (
                        <li className="px-2 py-3 text-center text-[12px] text-muted-foreground">All panels added</li>
                      )}
                    </ul>
                  </PopoverContent>
                </Popover>
              </div>
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
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-3">
          {visibleKpiIds.map((id) => {
            const k = allKpis.find((x) => x.id === id);
            if (!k) return null;
            return (
              <div
                key={id}
                draggable={canCustomize}
                onDragStart={canCustomize ? () => setDragId(id) : undefined}
                onDragOver={canCustomize ? (e) => e.preventDefault() : undefined}
                onDrop={canCustomize ? () => handleDrop(id) : undefined}
                onDragEnd={canCustomize ? () => setDragId(null) : undefined}
                className={canCustomize ? `cursor-move transition-opacity ${dragId === id ? "opacity-40" : ""}` : ""}
              >
                <StatCard
                  label={k.label}
                  value={k.value}
                  intent={k.intent}
                  delta={k.delta}
                  onRemove={canCustomize ? () => removeKpi(id) : undefined}
                />
              </div>
            );
          })}
        </div>


        {(() => {
          const wardsMax = Math.max(...wards.map((w) => w.total), 1);
          const panelDefs: Record<string, { title?: string; colSpan: 1 | 2 | 3; padded?: boolean; action?: React.ReactNode; render: () => React.ReactNode }> = {
            "trend": {
              title: "Complaints filed vs resolved — last 7 days",
              colSpan: 2,
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
            "wards": {
              title: "By locality",
              colSpan: 1,
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
            "dept": {
              title: "By department — open vs resolved",
              colSpan: 2,
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
            "recent": {
              title: "Recent activity",
              colSpan: 1,
              padded: false,
              action: <Link to="/inbox" className="text-[12px] text-primary hover:underline inline-flex items-center gap-1">View inbox <ArrowRight className="h-3 w-3" /></Link>,
              render: () => (
                <ul className="divide-y divide-border">
                  {recent.map((c) => (
                    <li key={c.id}>
                      <Link to="/inbox/$id" params={{ id: c.id }} className="flex items-start gap-3 px-4 py-2.5 hover:bg-muted/50">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
                            <span className="font-mono">{c.id}</span>
                            <span>·</span>
                            <span>{c.ward}</span>
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
            "sla": {
              title: "SLA at risk — next 24 hours",
              colSpan: 3,
              padded: false,
              render: () => (
                <DataTable<Complaint>
                  emptyMessage={t("EMPTY_INBOX")}
                  rows={COMPLAINTS.filter(c => c.slaState !== "WITHIN" && c.status !== "RESOLVED" && c.status !== "REJECTED").slice(0, 6)}
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
          };

          const colSpanClass = { 1: "", 2: "xl:col-span-2", 3: "xl:col-span-3" } as const;

          return (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
              {visiblePanelIds.map((id) => {
                const p = panelDefs[id];
                if (!p) return null;
                return (
                  <div
                    key={id}
                    draggable={canCustomize}
                    onDragStart={canCustomize ? () => setPanelDragId(id) : undefined}
                    onDragOver={canCustomize ? (e) => e.preventDefault() : undefined}
                    onDrop={canCustomize ? () => handlePanelDrop(id) : undefined}
                    onDragEnd={canCustomize ? () => setPanelDragId(null) : undefined}
                    className={cn(
                      colSpanClass[p.colSpan],
                      canCustomize && "cursor-move transition-opacity",
                      canCustomize && panelDragId === id && "opacity-40",
                    )}
                  >
                    <Panel
                      title={p.title}
                      action={p.action}
                      padded={p.padded}
                      onRemove={canCustomize ? () => removePanel(id) : undefined}
                    >
                      {p.render()}
                    </Panel>
                  </div>
                );
              })}
            </div>
          );
        })()}

      </div>
    </div>
  );
}
