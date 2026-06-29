/**
 * Department Head dashboard.
 *
 * Reads exclusively from `TEST_USER_COMPLAINTS` filtered through
 * `userScope` — the single source of truth for what data the signed-in
 * department head is allowed to see. When the RBAC backend lands, only
 * `useUserScope` changes; this file does not.
 *
 * Reuses the existing test-user widgets (StatCard, Panel, ComplaintMap,
 * recharts line/bar) so visual styling stays identical.
 */
import { useMemo, useState, Fragment } from "react";
import { Link } from "@tanstack/react-router";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  AreaChart, Area, ScatterChart, Scatter, ZAxis,
} from "recharts";
import {
  ArrowUp, ArrowDown, ChevronsUpDown, MapPin, BarChart3, LineChart as LineChartIcon,
  Users, Activity, Repeat, TrendingUp, Layers, AlertTriangle, ThumbsUp, Clock,
} from "lucide-react";
import { StatCard, Panel, type StatTrend } from "@/components/pgr/primitives";
import { CustomizableGrid, type GridKpiDef } from "@/components/pgr/CustomizableGrid";
import { ComplaintMap } from "@/components/pgr/ComplaintMap";
import { complaintTypeOf, officerOf, type Complaint } from "@/lib/mock-data";
import { TEST_USER_COMPLAINTS, type TestComplaint } from "@/lib/test-user-seed";
import { useUserScope, filterByScope, SCOPE_PRESETS } from "@/lib/user-scope";
import { cn } from "@/lib/utils";

const MONTHS = ["Jun","Jul","Aug","Sep","Oct","Nov","Dec","Jan","Feb","Mar","Apr","May"];

/** Stable hash → 0..n-1 bucket. Used to spread complaints across 12 months. */
function hashBucket(s: string, n: number): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h) % n;
}

const isOpen = (c: Complaint) =>
  c.status === "OPEN" || c.status === "ASSIGNED" ||
  c.status === "IN_PROGRESS" || c.status === "REOPENED";
const isResolved = (c: Complaint) => c.status === "RESOLVED" || c.status === "CLOSED";

function fmtHrs(h: number): string {
  if (!isFinite(h) || h <= 0) return "—";
  if (h < 24) return `${Math.round(h * 10) / 10}h`;
  const d = h / 24;
  return `${Math.round(d * 10) / 10}d`;
}

function pct(num: number, den: number): number {
  return den > 0 ? Math.round((num / den) * 1000) / 10 : 0;
}

/** Synthesise a 12-month series for any metric by bucketing rows via hash. */
function monthlySeries<T>(rows: T[], get: (r: T) => string, value: (bucket: T[]) => number) {
  const buckets: T[][] = Array.from({ length: 12 }, () => []);
  for (const r of rows) buckets[hashBucket(get(r), 12)].push(r);
  return buckets.map((b, i) => ({ month: MONTHS[i], value: value(b), bucket: b }));
}

export function DeptHeadDashboard() {
  const { scope, presetIndex, setPreset } = useUserScope();

  // SINGLE source of truth: every aggregation below derives from `rows`.
  const rows = useMemo(
    () => filterByScope(TEST_USER_COMPLAINTS, scope),
    [scope],
  );

  // --- Row 1 metrics ---------------------------------------------------------
  const metrics = useMemo(() => {
    const resolved = rows.filter(isResolved);
    const openRows = rows.filter(isOpen);
    const reached = resolved.length + openRows.filter((c) => c.slaState === "BREACHED").length;
    const onTime = resolved.filter((c) => c.slaState !== "BREACHED").length;
    const onTimeRate = pct(onTime, reached);

    const csatVals = resolved.map((c) => c.csat).filter((v): v is number => typeof v === "number");
    const csat = csatVals.length ? Math.round((csatVals.reduce((a, b) => a + b, 0) / csatVals.length) * 10) / 10 : 0;
    const csatResp = csatVals.length;
    const csatRate = pct(csatResp, resolved.length);

    const flowRatio = rows.length ? Math.round((resolved.length / rows.length) * 100) / 100 : 0;

    const now = Date.now();
    const oldestHrs = openRows.reduce((m, c) => Math.max(m, (now - new Date(c.filedOn).getTime()) / 3600_000), 0);

    // "Today" anchored to the most recent filedOn in the dataset so demo
    // numbers don't go stale relative to wall-clock time.
    const latest = rows.reduce((m, c) => Math.max(m, new Date(c.filedOn).getTime()), 0);
    const dayMs = 24 * 3600_000;
    const createdToday = latest
      ? rows.filter((c) => latest - new Date(c.filedOn).getTime() < dayMs).length
      : 0;

    return {
      onTimeRate, csat, csatResp, csatRate,
      resolved: resolved.length, open: openRows.length,
      total: rows.length,
      openPct: pct(openRows.length, rows.length),
      resolvedPct: pct(resolved.length, rows.length),
      createdToday,
      flowRatio, oldestHrs,
    };
  }, [rows]);

  // Sparklines: monthly bucket of the same metric over the rows in scope.
  const sparks = useMemo(() => {
    const byMonth = Array.from({ length: 12 }, () => ({ total: 0, resolved: 0, onTime: 0, reached: 0, csatSum: 0, csatN: 0, open: 0, oldest: 0 }));
    for (const c of rows) {
      const b = byMonth[hashBucket(c.id, 12)];
      b.total++;
      if (isResolved(c)) {
        b.resolved++;
        if (c.slaState !== "BREACHED") b.onTime++;
        b.reached++;
        if (typeof c.csat === "number") { b.csatSum += c.csat; b.csatN++; }
      }
      if (isOpen(c)) {
        b.open++;
        if (c.slaState === "BREACHED") b.reached++;
        const age = (Date.now() - new Date(c.filedOn).getTime()) / 3600_000;
        if (age > b.oldest) b.oldest = age;
      }
    }
    return {
      onTime: byMonth.map((b) => b.reached ? (b.onTime / b.reached) * 100 : 0),
      csat:   byMonth.map((b) => b.csatN ? b.csatSum / b.csatN : 0),
      resolved: byMonth.map((b) => b.resolved),
      open:   byMonth.map((b) => b.open),
      flow:   byMonth.map((b) => b.total ? b.resolved / b.total : 0),
      oldest: byMonth.map((b) => b.oldest),
    };
  }, [rows]);

  // --- Row 2A: ward performance ---------------------------------------------
  const wardRows = useMemo(() => {
    type W = { ward: string; total: number; open: number; reached: number; breached: number; resolved: number; csatSum: number; csatN: number };
    const m = new Map<string, W>();
    for (const c of rows) {
      const w = m.get(c.ward) ?? { ward: c.ward, total: 0, open: 0, reached: 0, breached: 0, resolved: 0, csatSum: 0, csatN: 0 };
      w.total++;
      if (isOpen(c)) {
        w.open++;
        if (c.slaState === "BREACHED") { w.reached++; w.breached++; }
      }
      if (isResolved(c)) {
        w.resolved++;
        w.reached++;
        if (c.slaState === "BREACHED") w.breached++;
        if (typeof c.csat === "number") { w.csatSum += c.csat; w.csatN++; }
      }
      m.set(c.ward, w);
    }
    const totalAll = rows.length;
    return Array.from(m.values()).map((w) => ({
      ward: w.ward,
      open: w.open,
      breachPct: pct(w.breached, w.reached),
      resolutionRate: pct(w.resolved, w.total),
      csat: w.csatN ? Math.round((w.csatSum / w.csatN) * 10) / 10 : null,
      pctOfTotal: pct(w.total, totalAll),
    }));
  }, [rows]);

  // --- Row 2B: subtype performance ------------------------------------------
  const subtypeRows = useMemo(() => {
    type S = {
      subtype: string; typeName: string; slaHours: number;
      total: number; resolved: number; reopened: number; onTime: number;
      resolveHrsSum: number; resolveHrsN: number;
      oldestOpenHrs: number;
      csatSum: number; csatN: number;
    };
    const m = new Map<string, S>();
    for (const c of rows) {
      const ct = complaintTypeOf(c.typeCode);
      const sub = (c as TestComplaint).subtype ?? ct?.name ?? c.typeCode;
      const e = m.get(sub) ?? {
        subtype: sub, typeName: ct?.name ?? c.typeCode, slaHours: c.slaHours,
        total: 0, resolved: 0, reopened: 0, onTime: 0,
        resolveHrsSum: 0, resolveHrsN: 0, oldestOpenHrs: 0,
        csatSum: 0, csatN: 0,
      };
      e.total++;
      if (isResolved(c)) {
        e.resolved++;
        const hrs = c.slaHours - c.slaRemainingHrs;
        e.resolveHrsSum += hrs;
        e.resolveHrsN++;
        if (c.slaState !== "BREACHED") e.onTime++;
        if (typeof c.csat === "number") { e.csatSum += c.csat; e.csatN++; }
      }
      if (c.reopenCount > 0 || c.status === "REOPENED") e.reopened++;
      if (isOpen(c)) {
        const age = (Date.now() - new Date(c.filedOn).getTime()) / 3600_000;
        if (age > e.oldestOpenHrs) e.oldestOpenHrs = age;
      }
      m.set(sub, e);
    }
    const totalAll = rows.length;
    return Array.from(m.values()).map((e) => {
      const avgHrs = e.resolveHrsN ? e.resolveHrsSum / e.resolveHrsN : 0;
      return {
        subtype: e.subtype,
        typeName: e.typeName,
        avgResolveHrs: avgHrs,
        slaHours: e.slaHours,
        overSla: avgHrs > 0 && avgHrs > e.slaHours,
        reopenRate: pct(e.reopened, e.resolved),
        oldestOpenHrs: e.oldestOpenHrs,
        onTimeRate: pct(e.onTime, e.resolved),
        csat: e.csatN ? Math.round((e.csatSum / e.csatN) * 10) / 10 : null,
        pctOfTotal: pct(e.total, totalAll),
      };
    });
  }, [rows]);

  // --- Row 3A: complaints over time (12 months) -----------------------------
  const overTime = useMemo(() => {
    const buckets = Array.from({ length: 12 }, () => ({ created: 0, resolved: 0, onTime: 0, reached: 0 }));
    for (const c of rows) {
      const i = hashBucket(c.id, 12);
      buckets[i].created++;
      if (isResolved(c)) {
        buckets[i].resolved++;
        buckets[i].reached++;
        if (c.slaState !== "BREACHED") buckets[i].onTime++;
      }
      if (isOpen(c) && c.slaState === "BREACHED") buckets[i].reached++;
    }
    return buckets.map((b, i) => ({
      month: MONTHS[i],
      created: b.created,
      resolved: b.resolved,
      sla: b.reached ? Math.round((b.onTime / b.reached) * 1000) / 10 : 0,
    }));
  }, [rows]);

  // --- Row 3B: inflow by subtype over time ----------------------------------
  const inflowBySubtype = useMemo(() => {
    const totals = new Map<string, number>();
    for (const c of rows) {
      const sub = (c as TestComplaint).subtype ?? complaintTypeOf(c.typeCode)?.name ?? c.typeCode;
      totals.set(sub, (totals.get(sub) ?? 0) + 1);
    }
    const ranked = Array.from(totals.entries()).sort((a, b) => b[1] - a[1]);
    const top = ranked.slice(0, 6).map((r) => r[0]);
    const topSet = new Set(top);
    const series = [...top, ...(ranked.length > 6 ? ["Other"] : [])];
    const data = MONTHS.map((m) => {
      const row: Record<string, number | string> = { month: m };
      for (const s of series) row[s] = 0;
      return row;
    });
    for (const c of rows) {
      const sub = (c as TestComplaint).subtype ?? complaintTypeOf(c.typeCode)?.name ?? c.typeCode;
      const key = topSet.has(sub) ? sub : "Other";
      const i = hashBucket(c.id, 12);
      data[i][key] = ((data[i][key] as number) ?? 0) + 1;
    }
    return { data, series };
  }, [rows]);

  // --- Row 4A: recurring complaints (ward + subtype) ------------------------
  const recurring = useMemo(() => {
    type R = { ward: string; subtype: string; total: number; recent: number; prior: number };
    const m = new Map<string, R>();
    for (const c of rows) {
      const sub = (c as TestComplaint).subtype ?? complaintTypeOf(c.typeCode)?.name ?? c.typeCode;
      const key = `${c.ward}__${sub}`;
      const r = m.get(key) ?? { ward: c.ward, subtype: sub, total: 0, recent: 0, prior: 0 };
      r.total++;
      // Use the same hashed month bucket; treat bucket >=6 as "recent".
      const i = hashBucket(c.id, 12);
      if (i >= 6) r.recent++; else r.prior++;
      m.set(key, r);
    }
    const computed = Array.from(m.values())
      .filter((r) => r.total >= 2)
      .map((r) => ({
        ...r,
        trendPct: r.prior > 0 ? Math.round(((r.recent - r.prior) / r.prior) * 100) : (r.recent > 0 ? 100 : 0),
      }));
    // Demo seed so the panel always has sample data even on narrow scopes.
    const wardPool = scope.wards.length ? scope.wards : ["Heritage City", "Financial District", "Town Square", "East Village"];
    const seeds: { ward: string; subtype: string; total: number; recent: number; prior: number; trendPct: number }[] = [
      { ward: wardPool[0], subtype: "Door-to-door collection skipped", total: 7, recent: 5, prior: 2, trendPct: 150 },
      { ward: wardPool[1 % wardPool.length], subtype: "Carriageway pothole", total: 6, recent: 4, prior: 2, trendPct: 100 },
      { ward: wardPool[2 % wardPool.length], subtype: "Pole non-functional", total: 5, recent: 2, prior: 3, trendPct: -33 },
      { ward: wardPool[0], subtype: "Mainline leakage", total: 4, recent: 3, prior: 1, trendPct: 200 },
      { ward: wardPool[3 % wardPool.length], subtype: "Manhole overflow", total: 4, recent: 1, prior: 3, trendPct: -67 },
      { ward: wardPool[1 % wardPool.length], subtype: "Footpath encroachment", total: 3, recent: 2, prior: 1, trendPct: 100 },
    ];
    const seen = new Set(computed.map((r) => `${r.ward}__${r.subtype}`));
    for (const s of seeds) if (!seen.has(`${s.ward}__${s.subtype}`)) computed.push(s);
    return computed.sort((a, b) => b.total - a.total);
  }, [rows, scope]);

  // --- Row 4B: channel equity -----------------------------------------------
  const channelRows = useMemo(() => {
    const labels: Record<string, string> = {
      MOBILE_APP: "Mobile App", WEB: "Web", CALL_CENTER: "Call Center",
      COUNTER: "Walk-in", WHATSAPP: "WhatsApp",
    };
    type C = { channel: string; total: number; resolved: number; csatSum: number; csatN: number };
    const m = new Map<string, C>();
    for (const c of rows) {
      const e = m.get(c.channel) ?? { channel: c.channel, total: 0, resolved: 0, csatSum: 0, csatN: 0 };
      e.total++;
      if (isResolved(c)) e.resolved++;
      if (typeof c.csat === "number") { e.csatSum += c.csat; e.csatN++; }
      m.set(c.channel, e);
    }
    return Array.from(m.values()).map((e) => ({
      channel: labels[e.channel] ?? e.channel,
      total: e.total,
      resolutionRate: pct(e.resolved, e.total),
      csat: e.csatN ? Math.round((e.csatSum / e.csatN) * 10) / 10 : null,
    })).sort((a, b) => b.total - a.total);
  }, [rows]);

  // --- Complaints by type (horizontal bar) ----------------------------------
  const complaintsByType = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of rows) {
      const name = complaintTypeOf(c.typeCode)?.name ?? c.typeCode;
      m.set(name, (m.get(name) ?? 0) + 1);
    }
    return Array.from(m.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [rows]);

  // --- Row 5: caseload --------------------------------------------------------
  const caseload = useMemo(() => {
    type O = { id: string; name: string; total: number; reached: number; breached: number };
    const m = new Map<string, O>();
    for (const c of rows) {
      const id = c.assignedOfficerId;
      if (!id) continue;
      const o = m.get(id) ?? { id, name: officerOf(id)?.name ?? id, total: 0, reached: 0, breached: 0 };
      o.total++;
      if (isResolved(c)) {
        o.reached++;
        if (c.slaState === "BREACHED") o.breached++;
      } else if (isOpen(c) && c.slaState === "BREACHED") {
        o.reached++;
        o.breached++;
      }
      m.set(id, o);
    }
    const officers = Array.from(m.values()).map((o) => ({
      ...o,
      breachPct: pct(o.breached, o.reached),
    })).sort((a, b) => b.total - a.total);
    const loads = officers.map((o) => o.total);
    const avg = loads.length ? Math.round((loads.reduce((a, b) => a + b, 0) / loads.length) * 10) / 10 : 0;
    const sorted = [...loads].sort((a, b) => a - b);
    const median = sorted.length ? (sorted.length % 2 ? sorted[(sorted.length - 1) / 2] : (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2) : 0;
    return { officers, avg, median, max: loads[0] ?? 0, count: officers.length };
  }, [rows]);

  const empty = rows.length === 0;

  const registry: GridKpiDef[] = useMemo(() => [
    // ----- Stats (Row 1) -----
    {
      id: "dh-ontime-rate", kind: "stat", label: "On-time resolution rate",
      description: "Resolved within SLA ÷ all complaints that reached an SLA outcome.",
      icon: Activity, intent: "positive",
      getValue: () => `${metrics.onTimeRate}%`,
      getTrend: () => makeTrend(sparks.onTime, "up"),
    },
    {
      id: "dh-csat", kind: "stat", label: "Citizen satisfaction",
      description: "Average CSAT from resolved complaints in scope.",
      icon: ThumbsUp, intent: "positive",
      getValue: () => metrics.csat ? `${metrics.csat} / 5` : "—",
      getDelta: () => `${metrics.csatResp} responses · ${metrics.csatRate}% rate`,
      getTrend: () => makeTrend(sparks.csat, "up"),
    },
    {
      id: "dh-resolved", kind: "stat", label: "Resolved (this period)",
      description: "Resolved + closed complaints in scope.",
      icon: TrendingUp, intent: "positive",
      getValue: () => String(metrics.resolved),
      getTrend: () => makeTrend(sparks.resolved, "up"),
    },
    {
      id: "dh-open", kind: "stat", label: "Open",
      description: "Complaints not yet resolved or closed.",
      icon: AlertTriangle, intent: "warning",
      getValue: () => String(metrics.open),
      getTrend: () => makeTrend(sparks.open, "down"),
    },
    {
      id: "dh-flow-ratio", kind: "stat", label: "Flow ratio",
      description: "Resolved ÷ created. > 1 means backlog is shrinking.",
      icon: Repeat, intent: metrics.flowRatio >= 1 ? "positive" : "negative",
      getValue: () => metrics.flowRatio.toFixed(2),
      getDelta: () => "Resolved ÷ created",
      getTrend: () => makeTrend(sparks.flow, "up"),
    },
    {
      id: "dh-oldest", kind: "stat", label: "Oldest open complaint",
      description: "Age of the longest-open complaint in scope.",
      icon: Clock, intent: "warning",
      getValue: () => fmtHrs(metrics.oldestHrs),
      getDelta: () => "Awaiting closure",
      getTrend: () => makeTrend(sparks.oldest, "down"),
    },
    {
      id: "dh-total", kind: "stat", label: "Total complaints",
      description: "All complaints in scope.",
      icon: BarChart3, intent: "neutral",
      getValue: () => String(metrics.total),
      getTrend: () => makeTrend(sparks.resolved.map((_, i) => sparks.resolved[i] + sparks.open[i]), "up"),
    },
    {
      id: "dh-pct-open", kind: "stat", label: "% Open",
      description: "Open complaints as a share of total in scope.",
      icon: AlertTriangle, intent: "warning",
      getValue: () => `${metrics.openPct}%`,
      getDelta: () => `${metrics.open} of ${metrics.total} complaints`,
      getTrend: () => makeTrend(sparks.open, "down"),
    },
    {
      id: "dh-pct-resolved", kind: "stat", label: "% Resolved",
      description: "Resolved + closed as a share of total in scope.",
      icon: TrendingUp, intent: "positive",
      getValue: () => `${metrics.resolvedPct}%`,
      getDelta: () => `${metrics.resolved} of ${metrics.total} complaints`,
      getTrend: () => makeTrend(sparks.resolved, "up"),
    },
    {
      id: "dh-created-today", kind: "stat", label: "Created today",
      description: "Complaints filed in the last 24 hours.",
      icon: Activity, intent: "neutral",
      getValue: () => String(metrics.createdToday),
      getDelta: () => "Last 24 hours",
    },

    // ----- Panels (Row 2+) -----
    {
      id: "dh-ward-perf", kind: "panel", label: "Ward performance",
      description: "Per-ward open count, breach %, resolution rate and CSAT.",
      icon: BarChart3, title: "Ward performance", colSpan: 1, defaultRowSpan: 1,
      render: () => <WardPerformanceTable rows={wardRows} />,
    },
    {
      id: "dh-subtype-perf", kind: "panel", label: "Sub-type performance",
      description: "Per sub-type avg resolution vs SLA, reopen %, on-time %, CSAT.",
      icon: BarChart3, title: "Complaint sub-type performance", colSpan: 2, defaultRowSpan: 1,
      render: () => <SubtypePerformanceTable rows={subtypeRows} />,
    },
    {
      id: "dh-by-type", kind: "panel", label: "Complaints by type",
      description: "Complaint types, descending by complaints filed.",
      icon: BarChart3, title: "Complaints by type", colSpan: 2, defaultRowSpan: 2,
      render: () => <ComplaintsByTypeBars rows={complaintsByType} />,
    },
    {
      id: "dh-map", kind: "panel", label: "Complaints map",
      description: "Geographic view of complaints across wards in scope.",
      icon: MapPin, title: "Complaints map", colSpan: 3, defaultRowSpan: 2, padded: false,
      render: () => <div className="h-full"><ComplaintMap complaints={rows} /></div>,
    },
    {
      id: "dh-over-time", kind: "panel", label: "Complaints over time",
      description: "Created vs resolved over 12 months, with on-time % overlay.",
      icon: LineChartIcon, title: "Complaints over time — last 12 months", colSpan: 2,
      render: () => <ComplaintsOverTimeChart data={overTime} />,
    },
    {
      id: "dh-inflow", kind: "panel", label: "Inflow by sub-type",
      description: "Stacked monthly inflow for the top 6 sub-types.",
      icon: Layers, title: "Inflow by sub-type — last 12 months", colSpan: 2,
      render: () => <InflowBySubtypeChart data={inflowBySubtype.data} series={inflowBySubtype.series} />,
    },
    {
      id: "dh-recurring", kind: "panel", label: "Recurring complaints",
      description: "Same problem, same locality (≥ 3 reports).",
      icon: Repeat, title: "Recurring complaints by ward & sub-type", colSpan: 2,
      render: () => (
        <>
          <p className="mb-2 text-[12px] text-muted-foreground">Same problem, same locality — recurring (≥ 3 reports).</p>
          <RecurringTable rows={recurring} />
        </>
      ),
    },
    {
      id: "dh-channel", kind: "panel", label: "Service quality by channel",
      description: "Volume, resolution rate, and CSAT per intake channel.",
      icon: BarChart3, title: "Service quality by channel", colSpan: 1,
      render: () => <ChannelEquityTable rows={channelRows} />,
    },
    {
      id: "dh-breach-scatter", kind: "panel", label: "Breach rate vs caseload",
      description: "Scatter of officer caseload (x) vs breach % (y).",
      icon: Activity, title: "Breach rate vs caseload", colSpan: 1,
      render: () => <BreachVsCaseload officers={caseload.officers} />,
    },
  ], [metrics, sparks, wardRows, subtypeRows, rows, overTime, inflowBySubtype, recurring, channelRows, caseload, complaintsByType]);

  const defaultIds = useMemo(() => [
    "dh-ontime-rate", "dh-csat", "dh-resolved", "dh-open", "dh-flow-ratio", "dh-oldest",
    "dh-total", "dh-pct-open", "dh-pct-resolved", "dh-created-today",
    "dh-ward-perf", "dh-subtype-perf", "dh-by-type", "dh-map",
    "dh-over-time", "dh-inflow",
    "dh-recurring", "dh-channel",
    "dh-breach-scatter",
  ], []);

  const bannerLeft = (
    <>
      <div className="min-w-0 flex items-baseline gap-2">
        <h1 className="text-[15px] font-semibold leading-tight text-foreground truncate">PGR Operations</h1>
        <span className="hidden sm:inline text-[11px] text-muted-foreground truncate">All Localities · Last 7 days</span>
      </div>
      <div className="relative w-full sm:w-56 md:w-64 order-3 sm:order-none">
        <svg className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
        <input
          placeholder="Search complaints, wards, citizens…"
          aria-label="Search dashboard"
          className="h-8 w-full rounded-sm border border-border bg-background pl-7 pr-2 text-[12px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
        />
      </div>
    </>
  );

  const toolbarRight = (
    <>
      <select
        value={presetIndex}
        onChange={(e) => setPreset(parseInt(e.target.value, 10))}
        aria-label="Demo scope"
        className="h-8 rounded-sm border border-border bg-background px-2 text-[12px]"
      >
        {SCOPE_PRESETS.map((s, i) => (
          <option key={i} value={i}>{s.label}</option>
        ))}
      </select>
      <button className="inline-flex h-8 items-center gap-1.5 rounded-sm border border-border bg-surface px-2.5 text-[12px] font-medium text-foreground hover:bg-muted">
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
        Export
      </button>
    </>
  );

  return (
    <div className="p-4 lg:p-6 space-y-4 lg:space-y-5">
      {empty ? (
        <>
          <div className="-mx-4 lg:-mx-6 -mt-4 lg:-mt-6 mb-1 border-b border-border bg-surface px-4 lg:px-6 py-2.5 flex flex-wrap items-center gap-x-3 gap-y-2">
            {bannerLeft}
            <div className="flex items-center gap-2 ml-auto">{toolbarRight}</div>
          </div>
          <Panel title="No data in scope">
            <p className="text-[13px] text-muted-foreground">
              The current scope ({scope.label}) contains no complaints. Pick a different scope above to see the dashboard.
            </p>
          </Panel>
        </>
      ) : (
        <CustomizableGrid
          registry={registry}
          defaultIds={defaultIds}
          bannerLeft={bannerLeft}
          toolbarRight={toolbarRight}
        />
      )}
    </div>
  );
}


// ===========================================================================
// Sub-components
// ===========================================================================

function ScopeBanner({
  presetIndex, setPreset, scopeLabel, rowCount,
}: { presetIndex: number; setPreset: (n: number) => void; scopeLabel: string; rowCount: number }) {
  return (
    <div className="rounded border border-border bg-surface px-3 py-2.5 flex flex-wrap items-center gap-3">
      <div className="flex items-baseline gap-2">
        <h1 className="text-[15px] font-semibold leading-tight text-foreground">Department dashboard</h1>
        <span className="text-[11px] text-muted-foreground">Scope: <span className="font-medium text-foreground">{scopeLabel}</span> · {rowCount} complaints</span>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Demo scope</label>
        <select
          value={presetIndex}
          onChange={(e) => setPreset(parseInt(e.target.value, 10))}
          className="h-7 rounded-sm border border-border bg-background px-2 text-[12px]"
        >
          {SCOPE_PRESETS.map((s, i) => (
            <option key={i} value={i}>{s.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

function makeTrend(values: number[], improveDirection: "up" | "down"): StatTrend | undefined {
  const trimmed = values.slice(-8);
  if (trimmed.length < 2) return undefined;
  const first = trimmed[0] || 0;
  const last = trimmed[trimmed.length - 1] || 0;
  const change = first === 0 ? (last > 0 ? 100 : 0) : Math.round(((last - first) / Math.abs(first)) * 1000) / 10;
  return {
    change,
    display: `${Math.abs(change).toFixed(1)}%`,
    improveDirection,
    sparkline: trimmed,
  };
}

// ---------- Sortable table primitive ---------------------------------------

type SortDir = "asc" | "desc";
function useSort<R, K extends string>(rows: R[], initial: K, dir: SortDir, get: (r: R, k: K) => string | number | null) {
  const [sortKey, setKey] = useState<K>(initial);
  const [sortDir, setDir] = useState<SortDir>(dir);
  const sorted = useMemo(() => {
    const arr = [...rows];
    const d = sortDir === "asc" ? 1 : -1;
    arr.sort((a, b) => {
      const av = get(a, sortKey); const bv = get(b, sortKey);
      const ax = av === null ? -Infinity : av;
      const bx = bv === null ? -Infinity : bv;
      if (ax < bx) return -1 * d;
      if (ax > bx) return 1 * d;
      return 0;
    });
    return arr;
  }, [rows, sortKey, sortDir, get]);
  const toggle = (k: K) => {
    if (sortKey === k) setDir((d) => d === "asc" ? "desc" : "asc");
    else { setKey(k); setDir("asc"); }
  };
  return { sorted, sortKey, sortDir, toggle };
}

function SortHeader<K extends string>({ label, k, sortKey, sortDir, onSort, align = "left" }:
  { label: string; k: K; sortKey: K; sortDir: SortDir; onSort: (k: K) => void; align?: "left" | "right" }) {
  const active = sortKey === k;
  const Icon = !active ? ChevronsUpDown : sortDir === "asc" ? ArrowUp : ArrowDown;
  return (
    <th className={cn("px-3 py-2 font-medium whitespace-nowrap", align === "right" ? "text-right" : "text-left")}>
      <button onClick={() => onSort(k)} className={cn("inline-flex items-center gap-1 hover:text-foreground", active && "text-foreground")}>
        {label} <Icon className="h-3 w-3 opacity-70" />
      </button>
    </th>
  );
}

// ---------- Row 2A — Ward performance --------------------------------------

type WardRow = { ward: string; open: number; breachPct: number; resolutionRate: number; csat: number | null; pctOfTotal: number };
type WardKey = "ward" | "open" | "breach" | "resolution" | "csat" | "pct";

function WardPerformanceTable({ rows }: { rows: WardRow[] }) {
  const { sorted, sortKey, sortDir, toggle } = useSort<WardRow, WardKey>(
    rows, "breach", "desc",
    (r, k) => k === "ward" ? r.ward : k === "open" ? r.open : k === "breach" ? r.breachPct
      : k === "resolution" ? r.resolutionRate : k === "pct" ? r.pctOfTotal : (r.csat ?? -1),
  );
  if (rows.length === 0) return <Empty />;
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-[12px]">
        <thead className="bg-surface-2 text-[11px] uppercase tracking-wider text-muted-foreground">
          <tr>
            <SortHeader label="Ward" k="ward" sortKey={sortKey} sortDir={sortDir} onSort={toggle} />
            <SortHeader label="Open" k="open" sortKey={sortKey} sortDir={sortDir} onSort={toggle} align="right" />
            <SortHeader label="% of complaints" k="pct" sortKey={sortKey} sortDir={sortDir} onSort={toggle} align="right" />
            <SortHeader label="SLA breach %" k="breach" sortKey={sortKey} sortDir={sortDir} onSort={toggle} align="right" />
            <SortHeader label="Resolution rate" k="resolution" sortKey={sortKey} sortDir={sortDir} onSort={toggle} align="right" />
            <SortHeader label="CSAT" k="csat" sortKey={sortKey} sortDir={sortDir} onSort={toggle} align="right" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {sorted.map((r) => (
            <tr key={r.ward} className="hover:bg-muted/40 cursor-pointer" title="Click to drill down (per-ward view coming soon)">
              <td className="px-3 py-1.5">{r.ward}</td>
              <td className="px-3 py-1.5 text-right tabular-nums">{r.open}</td>
              <td className="px-3 py-1.5 text-right tabular-nums">{r.pctOfTotal.toFixed(1)}%</td>
              <td className={cn("px-3 py-1.5 text-right tabular-nums font-medium", r.breachPct > 50 && "bg-status-breach-bg text-status-breach")}>{r.breachPct.toFixed(1)}%</td>
              <td className="px-3 py-1.5 text-right tabular-nums">{r.resolutionRate.toFixed(1)}%</td>
              <td className="px-3 py-1.5 text-right tabular-nums">{r.csat !== null ? `${r.csat.toFixed(1)}` : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------- Row 2B — Subtype performance -----------------------------------

type SubtypeRow = {
  subtype: string; typeName: string; avgResolveHrs: number; slaHours: number; overSla: boolean;
  reopenRate: number; oldestOpenHrs: number; onTimeRate: number; csat: number | null; pctOfTotal: number;
};
type SubKey = "subtype" | "type" | "avg" | "sla" | "reopen" | "oldest" | "ontime" | "csat" | "pct";

function SubtypePerformanceTable({ rows }: { rows: SubtypeRow[] }) {
  const { sorted, sortKey, sortDir, toggle } = useSort<SubtypeRow, SubKey>(
    rows, "avg", "desc",
    (r, k) => k === "subtype" ? r.subtype : k === "type" ? r.typeName
      : k === "avg" ? r.avgResolveHrs : k === "sla" ? r.slaHours
      : k === "reopen" ? r.reopenRate : k === "oldest" ? r.oldestOpenHrs
      : k === "ontime" ? r.onTimeRate : k === "pct" ? r.pctOfTotal : (r.csat ?? -1),
  );
  if (rows.length === 0) return <Empty />;
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-[12px]">
        <thead className="bg-surface-2 text-[11px] uppercase tracking-wider text-muted-foreground">
          <tr>
            <SortHeader label="Subtype" k="subtype" sortKey={sortKey} sortDir={sortDir} onSort={toggle} />
            <SortHeader label="Type" k="type" sortKey={sortKey} sortDir={sortDir} onSort={toggle} />
            <SortHeader label="% of complaints" k="pct" sortKey={sortKey} sortDir={sortDir} onSort={toggle} align="right" />
            <SortHeader label="Avg resolution" k="avg" sortKey={sortKey} sortDir={sortDir} onSort={toggle} align="right" />
            <SortHeader label="SLA" k="sla" sortKey={sortKey} sortDir={sortDir} onSort={toggle} align="right" />
            <SortHeader label="Reopen %" k="reopen" sortKey={sortKey} sortDir={sortDir} onSort={toggle} align="right" />
            <SortHeader label="Oldest open" k="oldest" sortKey={sortKey} sortDir={sortDir} onSort={toggle} align="right" />
            <SortHeader label="On-time %" k="ontime" sortKey={sortKey} sortDir={sortDir} onSort={toggle} align="right" />
            <SortHeader label="CSAT" k="csat" sortKey={sortKey} sortDir={sortDir} onSort={toggle} align="right" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {sorted.map((r) => (
            <tr key={r.subtype} className="hover:bg-muted/40">
              <td className="px-3 py-1.5">
                <div>{r.subtype}</div>
                {r.overSla && <span className="inline-block mt-0.5 rounded-sm bg-status-breach-bg px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-status-breach">Over SLA</span>}
              </td>
              <td className="px-3 py-1.5 text-muted-foreground">{r.typeName}</td>
              <td className="px-3 py-1.5 text-right tabular-nums">{r.pctOfTotal.toFixed(1)}%</td>
              <td className="px-3 py-1.5 text-right tabular-nums">{r.avgResolveHrs ? fmtHrs(r.avgResolveHrs) : "—"}</td>
              <td className="px-3 py-1.5 text-right tabular-nums text-muted-foreground">{fmtHrs(r.slaHours)}</td>
              <td className="px-3 py-1.5 text-right tabular-nums">{r.reopenRate.toFixed(1)}%</td>
              <td className="px-3 py-1.5 text-right tabular-nums">{r.oldestOpenHrs ? fmtHrs(r.oldestOpenHrs) : "—"}</td>
              <td className="px-3 py-1.5 text-right tabular-nums">{r.onTimeRate.toFixed(1)}%</td>
              <td className="px-3 py-1.5 text-right tabular-nums">{r.csat !== null ? `${r.csat.toFixed(1)}` : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------- Row 3A — over time ---------------------------------------------

function ComplaintsOverTimeChart({ data }: { data: { month: string; created: number; resolved: number; sla: number }[] }) {
  return (
    <div className="h-[260px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={{ stroke: "var(--border)" }} tickLine={false} />
          <YAxis yAxisId="left" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
          <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} unit="%" />
          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 4, border: "1px solid var(--border)" }} />
          <Line yAxisId="left" type="monotone" dataKey="created" stroke="var(--color-chart-1)" strokeWidth={2} dot={{ r: 2.5 }} name="Created" />
          <Line yAxisId="left" type="monotone" dataKey="resolved" stroke="var(--color-chart-3)" strokeWidth={2} dot={{ r: 2.5 }} name="Resolved" />
          <Line yAxisId="right" type="monotone" dataKey="sla" stroke="var(--color-chart-2)" strokeWidth={2} strokeDasharray="4 3" dot={false} name="On-time %" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ---------- Row 3B — inflow by subtype -------------------------------------

const SERIES_COLORS = [
  "var(--color-chart-1)", "var(--color-chart-2)", "var(--color-chart-3)",
  "var(--color-chart-4)", "var(--color-chart-5)", "var(--color-chart-1)",
  "var(--color-chart-2)",
];

function InflowBySubtypeChart({ data, series }: { data: Record<string, number | string>[]; series: string[] }) {
  return (
    <div className="h-[260px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={{ stroke: "var(--border)" }} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 4, border: "1px solid var(--border)" }} />
          {series.map((s, i) => (
            <Area key={s} type="monotone" dataKey={s} stackId="1" stroke={SERIES_COLORS[i % SERIES_COLORS.length]} fill={SERIES_COLORS[i % SERIES_COLORS.length]} fillOpacity={0.55} />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ---------- Row 4A — recurring ---------------------------------------------

function RecurringTable({ rows }: { rows: { ward: string; subtype: string; total: number; trendPct: number }[] }) {
  if (rows.length === 0) return <Empty message="No ward/sub-type pair has 3+ complaints in scope." />;
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-[12px]">
        <thead className="bg-surface-2 text-[11px] uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="px-3 py-2 text-left font-medium">Ward</th>
            <th className="px-3 py-2 text-left font-medium">Sub-type</th>
            <th className="px-3 py-2 text-right font-medium">Total</th>
            <th className="px-3 py-2 text-right font-medium">Trend</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((r, i) => (
            <tr key={i} className="hover:bg-muted/40">
              <td className="px-3 py-1.5">{r.ward}</td>
              <td className="px-3 py-1.5">{r.subtype}</td>
              <td className="px-3 py-1.5 text-right tabular-nums">{r.total}</td>
              <td className={cn("px-3 py-1.5 text-right tabular-nums", r.trendPct >= 0 ? "text-status-breach" : "text-status-resolved")}>
                {r.trendPct >= 0 ? "↑" : "↓"} {Math.abs(r.trendPct)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------- Row 4B — channel equity ----------------------------------------

function ChannelEquityTable({ rows }: { rows: { channel: string; total: number; resolutionRate: number; csat: number | null }[] }) {
  if (rows.length === 0) return <Empty />;
  return (
    <table className="w-full text-[12px]">
      <thead className="bg-surface-2 text-[11px] uppercase tracking-wider text-muted-foreground">
        <tr>
          <th className="px-3 py-2 text-left font-medium">Channel</th>
          <th className="px-3 py-2 text-right font-medium">Volume</th>
          <th className="px-3 py-2 text-right font-medium">Resolution</th>
          <th className="px-3 py-2 text-right font-medium">CSAT</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-border">
        {rows.map((r) => (
          <tr key={r.channel} className="hover:bg-muted/40">
            <td className="px-3 py-1.5">{r.channel}</td>
            <td className="px-3 py-1.5 text-right tabular-nums">{r.total}</td>
            <td className="px-3 py-1.5 text-right tabular-nums">{r.resolutionRate.toFixed(1)}%</td>
            <td className="px-3 py-1.5 text-right tabular-nums">{r.csat !== null ? r.csat.toFixed(1) : "—"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ---------- Row 5A — caseload per officer ----------------------------------

function CaseloadPanel({ data }: { data: { officers: { id: string; name: string; total: number; breachPct: number }[]; avg: number; median: number; max: number; count: number } }) {
  if (data.officers.length === 0) return <Empty message="No assigned officers in scope." />;
  const max = data.max || 1;
  return (
    <div>
      <div className="grid grid-cols-4 gap-2 mb-3">
        <Stat label="Officers" value={String(data.count)} />
        <Stat label="Avg load" value={data.avg.toFixed(1)} />
        <Stat label="Median" value={String(data.median)} />
        <Stat label="Max" value={String(data.max)} />
      </div>
      <ul className="space-y-1.5">
        {data.officers.map((o) => (
          <li key={o.id} className="grid grid-cols-[1fr_auto] gap-2 items-center">
            <div className="min-w-0">
              <div className="truncate text-[12px] text-foreground">{o.name}</div>
              <div className="h-1.5 mt-0.5 rounded-sm bg-muted">
                <div className="h-full rounded-sm bg-primary" style={{ width: `${(o.total / max) * 100}%` }} />
              </div>
            </div>
            <div className="text-[12px] tabular-nums text-muted-foreground">{o.total}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-border bg-surface-2 px-2 py-1.5">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-[15px] font-semibold tabular-nums text-foreground">{value}</div>
    </div>
  );
}

// ---------- Complaints by type — horizontal bar ----------------------------

function ComplaintsByTypeBars({ rows }: { rows: { name: string; count: number }[] }) {
  if (rows.length === 0) return <Empty />;
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <div className="w-full">
      <p className="mb-3 text-[12px] text-muted-foreground">Complaint types, descending by complaints filed</p>
      <div className="space-y-2.5">
        {rows.map((r) => {
          const widthPct = (r.count / max) * 100;
          const inside = widthPct > 14;
          return (
            <div key={r.name} className="grid grid-cols-[160px_1fr_auto] items-center gap-3">
              <div className="text-[12px] leading-tight text-foreground">{r.name}</div>
              <div className="relative h-7">
                <div
                  className="absolute inset-y-0 left-0 rounded-sm bg-[var(--color-chart-3)] flex items-center justify-end pr-2"
                  style={{ width: `${widthPct}%` }}
                >
                  {inside && <span className="text-[11px] font-semibold text-white tabular-nums">{r.count}</span>}
                </div>
              </div>
              <div className="text-[12px] font-semibold tabular-nums text-foreground w-8 text-right">{r.count}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------- Row 5B — breach vs caseload scatter ----------------------------



function BreachVsCaseload({ officers }: { officers: { id: string; name: string; total: number; breachPct: number }[] }) {
  if (officers.length === 0) return <Empty message="No assigned officers in scope." />;
  const data = officers.map((o) => ({ x: o.total, y: o.breachPct, name: o.name }));
  return (
    <div className="h-[260px]">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 10, right: 10, bottom: 5, left: -10 }}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
          <XAxis type="number" dataKey="x" name="Caseload" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={{ stroke: "var(--border)" }} tickLine={false} label={{ value: "Caseload", position: "insideBottom", offset: -2, fontSize: 11, fill: "var(--muted-foreground)" }} />
          <YAxis type="number" dataKey="y" name="Breach %" unit="%" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
          <ZAxis range={[60, 60]} />
          <Tooltip
            cursor={{ strokeDasharray: "3 3" }}
            contentStyle={{ fontSize: 12, borderRadius: 4, border: "1px solid var(--border)" }}
            formatter={(value: number | string, key: string) => [`${value}${key === "y" ? "%" : ""}`, key === "x" ? "Caseload" : "Breach %"]}
            labelFormatter={(_: unknown, payload: ReadonlyArray<{ payload?: { name?: string } }>) => payload?.[0]?.payload?.name ?? ""}
          />
          <Scatter data={data} fill="var(--color-chart-1)" />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}

// ---------- Empty state ----------------------------------------------------

function Empty({ message = "No data in scope." }: { message?: string }) {
  return <div className="py-6 text-center text-[12px] text-muted-foreground">{message}</div>;
}

// Avoid unused-import flags for icons reserved for future drill-down.
void MapPin; void BarChart3; void LineChartIcon; void Users; void Activity; void Repeat;
void TrendingUp; void Layers; void AlertTriangle; void ThumbsUp; void Clock;
void Link; void Fragment;
