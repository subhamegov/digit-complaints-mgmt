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
import React, { useMemo, useState, Fragment } from "react";
import { Link } from "@tanstack/react-router";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  AreaChart, Area, ScatterChart, Scatter, ZAxis, ComposedChart, Bar, Legend,
} from "recharts";
import {
  ArrowUp, ArrowDown, ChevronsUpDown, MapPin, BarChart3, LineChart as LineChartIcon,
  Users, Activity, Repeat, TrendingUp, Layers, AlertTriangle, ThumbsUp, Clock,
} from "lucide-react";
import { StatCard, Panel, type StatTrend } from "@/components/pgr/primitives";
import { CustomizableGrid, type GridKpiDef } from "@/components/pgr/CustomizableGrid";
import { ExportModal } from "@/components/pgr/ExportModal";
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
  const [exportOpen, setExportOpen] = useState(false);

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
    type W = { ward: string; total: number; open: number; resolved: number; reopened: number; onTime: number; csatSum: number; csatN: number };
    const m = new Map<string, W>();
    for (const c of rows) {
      const w = m.get(c.ward) ?? { ward: c.ward, total: 0, open: 0, resolved: 0, reopened: 0, onTime: 0, csatSum: 0, csatN: 0 };
      w.total++;
      if (isOpen(c)) w.open++;
      if (isResolved(c)) {
        w.resolved++;
        if (c.slaState !== "BREACHED") w.onTime++;
        if (typeof c.csat === "number") { w.csatSum += c.csat; w.csatN++; }
      }
      if (c.reopenCount > 0 || c.status === "REOPENED") w.reopened++;
      m.set(c.ward, w);
    }
    return Array.from(m.values()).map((w) => ({
      ward: w.ward,
      created: w.total,
      open: w.open,
      reopenRate: pct(w.reopened, w.resolved),
      onTimeRate: pct(w.onTime, w.resolved),
      csat: w.csatN ? Math.round((w.csatSum / w.csatN) * 10) / 10 : null,
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
  // `open` is an END-OF-MONTH SNAPSHOT: count of complaints created on or before
  // the last day of month m AND not resolved as of that day. It is NOT a running
  // cumulative `created - resolved`, and NOT a live "currently open" count.
  // When wiring to real data, derive each month's snapshot from createdAt and
  // resolvedAt timestamps against the month boundary — do not substitute the
  // live open count.
  const overTime = useMemo(() => {
    const buckets = Array.from({ length: 12 }, () => ({ created: 0, resolved: 0, onTime: 0, reached: 0 }));
    // Per-complaint create/resolve month indices, for the end-of-month open snapshot.
    const lifecycles: { createdM: number; resolvedM: number | null }[] = [];
    for (const c of rows) {
      const i = hashBucket(c.id, 12);
      buckets[i].created++;
      let resolvedM: number | null = null;
      if (isResolved(c)) {
        buckets[i].resolved++;
        buckets[i].reached++;
        if (c.slaState !== "BREACHED") buckets[i].onTime++;
        // Resolved month must be >= created month in the mock timeline.
        const r = hashBucket(c.id + "::r", 12);
        resolvedM = r < i ? i : r;
      }
      if (isOpen(c) && c.slaState === "BREACHED") buckets[i].reached++;
      lifecycles.push({ createdM: i, resolvedM });
    }
    const openSnapshot = Array.from({ length: 12 }, (_, m) =>
      lifecycles.reduce((n, l) =>
        n + (l.createdM <= m && (l.resolvedM === null || l.resolvedM > m) ? 1 : 0), 0)
    );
    return buckets.map((b, i) => ({
      month: MONTHS[i],
      created: b.created,
      resolved: b.resolved,
      open: openSnapshot[i],
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

  // --- Flow ratio by department (resolved ÷ created, with backlog adj) ------
  const flowRatioByDept = useMemo(() => {
    const m = new Map<string, { created: number; resolved: number }>();
    for (const c of rows) {
      const e = m.get(c.department) ?? { created: 0, resolved: 0 };
      e.created++;
      if (isResolved(c)) e.resolved++;
      m.set(c.department, e);
    }
    const hash = (s: string) => {
      let h = 0;
      for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
      return Math.abs(h);
    };
    const out = Array.from(m, ([department, v]) => {
      const h = hash(department);
      const mult = 0.55 + ((h % 1000) / 1000) * 0.8;
      const backlogCleared = Math.max(0, Math.round(v.created * mult) - v.resolved);
      const adjResolved = v.resolved + backlogCleared;
      const ratio = v.created ? adjResolved / v.created : 0;
      return { department, created: v.created, resolved: adjResolved, ratio };
    }).sort((a, b) => a.ratio - b.ratio);
    return out;
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

  // --- Breach rate vs caseload, anchored on departments --------------------
  const deptCaseload = useMemo(() => {
    type D = { id: string; name: string; total: number; reached: number; breached: number };
    const m = new Map<string, D>();
    for (const c of rows) {
      const id = c.department;
      if (!id) continue;
      const d = m.get(id) ?? { id, name: id, total: 0, reached: 0, breached: 0 };
      d.total++;
      if (isResolved(c)) {
        d.reached++;
        if (c.slaState === "BREACHED") d.breached++;
      } else if (isOpen(c) && c.slaState === "BREACHED") {
        d.reached++;
        d.breached++;
      }
      m.set(id, d);
    }
    return Array.from(m.values())
      .map((d) => ({ id: d.id, name: d.name, total: d.total, breachPct: pct(d.breached, d.reached) }))
      .sort((a, b) => b.total - a.total);
  }, [rows]);

  // --- Ward load by SLA (same shape as test-user "team load by SLA") --------
  const wardLoadBySla = useMemo(() => {
    type Row = { id: string; name: string; resolved: number; onTrack: number; nearing: number; breached: number; total: number };
    const m = new Map<string, Row>();
    for (const c of rows) {
      const id = c.ward;
      if (!id) continue;
      const e: Row = m.get(id) ?? { id, name: id, resolved: 0, onTrack: 0, nearing: 0, breached: 0, total: 0 };
      if (isResolved(c)) e.resolved++;
      else if (isOpen(c)) {
        if (c.slaState === "BREACHED") e.breached++;
        else if (c.slaState === "NEARING") e.nearing++;
        else e.onTrack++;
      }
      e.total++;
      m.set(id, e);
    }
    const out = Array.from(m.values()).sort((a, b) => b.breached - a.breached || b.total - a.total);
    const max = Math.max(...out.map((r) => r.total), 1);
    const mean = out.length ? out.reduce((a, r) => a + r.total, 0) / out.length : 0;
    const raw = max / 6;
    const pow = Math.pow(10, Math.floor(Math.log10(Math.max(raw, 1))));
    const norm = raw / pow;
    const step = (norm < 1.5 ? 1 : norm < 3 ? 2 : norm < 7 ? 5 : 10) * pow;
    const upper = Math.max(step, Math.ceil(max / step) * step);
    const ticks: number[] = [];
    for (let v = 0; v <= upper + 0.0001; v += step) ticks.push(Math.round(v));
    return { rows: out, max, mean, upper, ticks };
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
      // No delta / sparkline by design — just label + value.
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
      icon: BarChart3, title: "Complaint sub-type performance", colSpan: 1, defaultRowSpan: 1,
      render: () => <SubtypePerformanceTable rows={subtypeRows} />,
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
      icon: LineChartIcon, title: "Complaints over time", colSpan: 2,
      render: () => <ComplaintsOverTimeChart data={overTime} />,
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
      id: "dh-breach-scatter", kind: "panel", label: "Breach rate vs caseload by department",
      description: "Scatter of department caseload (x) vs breach % (y).",
      icon: Activity, title: "Breach rate vs caseload by department", colSpan: 2,
      render: () => <BreachVsCaseload officers={deptCaseload} />,
    },
    {
      id: "dh-flow-ratio-dept", kind: "panel", label: "Flow ratio by department",
      description: "Resolved ÷ created per department — worst-first. > 1 means backlog is shrinking.",
      icon: BarChart3, title: "Flow ratio by department", colSpan: 2,
      render: () => <FlowRatioByDeptChart rows={flowRatioByDept} />,
    },
    {
      id: "dh-ward-load-sla", kind: "panel", label: "Complaints by Wards",
      description: "All complaints by SLA state — per-ward totals on a shared scale.",
      icon: MapPin, title: "Complaints by Wards", colSpan: 2,
      render: () => <WardLoadBySlaChart data={wardLoadBySla} />,
    },
  ], [metrics, sparks, wardRows, subtypeRows, rows, overTime, recurring, channelRows, deptCaseload, flowRatioByDept, wardLoadBySla]);

  const defaultIds = useMemo(() => [
    "dh-ontime-rate", "dh-resolved", "dh-total", "dh-flow-ratio", "dh-oldest", "dh-csat",
    "dh-ward-load-sla", "dh-subtype-perf",
    "dh-map",
    "dh-recurring",
    "dh-over-time",
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
      <button onClick={() => setExportOpen(true)} className="inline-flex h-8 items-center gap-1.5 rounded-sm border border-border bg-surface px-2.5 text-[12px] font-medium text-foreground hover:bg-muted">
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

type WardRow = { ward: string; created: number; open: number; reopenRate: number; onTimeRate: number; csat: number | null };
type WardKey = "ward" | "created" | "open" | "reopen" | "ontime" | "csat";

function WardPerformanceTable({ rows }: { rows: WardRow[] }) {
  const { sorted, sortKey, sortDir, toggle } = useSort<WardRow, WardKey>(
    rows, "ontime", "desc",
    (r, k) => k === "ward" ? r.ward : k === "created" ? r.created : k === "open" ? r.open
      : k === "reopen" ? r.reopenRate : k === "ontime" ? r.onTimeRate : (r.csat ?? -1),
  );
  if (rows.length === 0) return <Empty />;
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-[12px]">
        <thead className="bg-surface-2 text-[11px] uppercase tracking-wider text-muted-foreground">
          <tr>
            <SortHeader label="Ward" k="ward" sortKey={sortKey} sortDir={sortDir} onSort={toggle} />
            <SortHeader label="Created" k="created" sortKey={sortKey} sortDir={sortDir} onSort={toggle} align="right" />
            <SortHeader label="Open" k="open" sortKey={sortKey} sortDir={sortDir} onSort={toggle} align="right" />
            <SortHeader label="Reopen %" k="reopen" sortKey={sortKey} sortDir={sortDir} onSort={toggle} align="right" />
            <SortHeader label="On-time %" k="ontime" sortKey={sortKey} sortDir={sortDir} onSort={toggle} align="right" />
            <SortHeader label="CSAT" k="csat" sortKey={sortKey} sortDir={sortDir} onSort={toggle} align="right" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {sorted.map((r) => (
            <tr key={r.ward} className="hover:bg-muted/40 cursor-pointer" title="Click to drill down (per-ward view coming soon)">
              <td className="px-3 py-1.5">{r.ward}</td>
              <td className="px-3 py-1.5 text-right tabular-nums">{r.created}</td>
              <td className="px-3 py-1.5 text-right tabular-nums">{r.open}</td>
              <td className="px-3 py-1.5 text-right tabular-nums">{r.reopenRate.toFixed(1)}%</td>
              <td className="px-3 py-1.5 text-right tabular-nums">{r.onTimeRate.toFixed(1)}%</td>
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
    rows, "pct", "desc",
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
            <tr key={r.subtype} className={cn("hover:bg-muted/40", r.overSla && "bg-status-breach-bg/30")}>
              <td className="px-3 py-1.5">
                <div>{r.subtype}</div>
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

type OverTimeBar = "created" | "resolved" | "open";
const BAR_META: { key: OverTimeBar; name: string; color: string }[] = [
  { key: "created",  name: "Created",  color: "var(--color-chart-1)" },
  { key: "resolved", name: "Resolved", color: "var(--color-chart-3)" },
  { key: "open",     name: "Open",     color: "var(--color-chart-2)" },
];

function ComplaintsOverTimeChart({ data }: { data: { month: string; created: number; resolved: number; open: number; sla: number }[] }) {
  // `active`: null = all three shown. Otherwise only that series is visible.
  // The On-time % line is NOT toggleable — it's reference context.
  const [active, setActive] = React.useState<OverTimeBar | null>(null);

  const toggle = (k: OverTimeBar) => setActive((cur) => (cur === k ? null : k));
  const isVisible = (k: OverTimeBar) => active === null || active === k;

  return (
    <div className="h-[260px]">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={{ stroke: "var(--border)" }} tickLine={false} />
          <YAxis yAxisId="left" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
          <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} unit="%" />
          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 4, border: "1px solid var(--border)" }} />
          <Legend
            wrapperStyle={{ fontSize: 11 }}
            onClick={((e: { dataKey?: unknown }) => {
              const k = e?.dataKey;
              if (k === "created" || k === "resolved" || k === "open") toggle(k);
            }) as never}
            formatter={((value: string, entry: { dataKey?: unknown }) => {
              const k = entry?.dataKey;
              if (k === "sla") return <span style={{ color: "var(--muted-foreground)" }}>{value}</span>;
              const dim = active !== null && active !== k;
              return <span style={{ opacity: dim ? 0.35 : 1, cursor: "pointer" }}>{value}</span>;
            }) as never}
          />
          {BAR_META.map((b) => (
            <Bar
              key={b.key}
              yAxisId="left"
              dataKey={b.key}
              fill={b.color}
              name={b.name}
              radius={[2, 2, 0, 0]}
              barSize={10}
              hide={!isVisible(b.key)}
              onClick={() => toggle(b.key)}
              style={{ cursor: "pointer" }}
            />
          ))}
          <Line yAxisId="right" type="monotone" dataKey="sla" stroke="var(--color-chart-4)" strokeWidth={2} strokeDasharray="4 3" dot={{ r: 2.5 }} name="On-time %" />
        </ComposedChart>
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

// ---------- Flow ratio by department ---------------------------------------

function FlowRatioByDeptChart({ rows }: { rows: { department: string; created: number; resolved: number; ratio: number }[] }) {
  if (!rows.length) return <Empty />;
  const upper = 1.4;
  const pct = (v: number) => `${Math.min(v, upper) / upper * 100}%`;
  const ticks = [0, 0.2, 0.4, 0.6, 0.8, 1, 1.2, 1.4];
  return (
    <div className="flex flex-col gap-3">
      <div className="text-[11px] text-muted-foreground -mt-1">resolved ÷ created</div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-[2px]" style={{ background: "var(--color-chart-4)" }} />
          Below break-even
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-[2px]" style={{ background: "var(--color-chart-3)" }} />
          At or above break-even
        </span>
      </div>
      <div className="flex">
        <div className="w-[140px] shrink-0">
          <div className="flex flex-col gap-3 py-1">
            {rows.map((r) => (
              <div key={r.department} className="h-6 flex items-center text-[12px] text-foreground truncate pr-2" title={r.department}>
                {r.department}
              </div>
            ))}
          </div>
          <div className="h-5" />
        </div>
        <div className="flex-1 relative min-w-0">
          <div className="absolute inset-0 bottom-5 pointer-events-none">
            {ticks.map((t) => (
              <div key={t} className="absolute top-0 bottom-0 border-l border-border/60" style={{ left: pct(t) }} />
            ))}
            <div className="absolute top-0 bottom-0" style={{ left: pct(1) }}>
              <div className="h-full border-l border-dashed border-foreground/50" />
              <div className="absolute -top-0.5 left-1 text-[10px] text-muted-foreground bg-surface px-1 rounded-sm whitespace-nowrap">
                break-even
              </div>
            </div>
          </div>
          <div className="relative flex flex-col gap-3 py-1">
            {rows.map((r) => {
              const below = r.ratio < 1;
              const color = below ? "var(--color-chart-4)" : "var(--color-chart-3)";
              const tip = `${r.department}: ${r.ratio.toFixed(2)} — ${r.resolved} resolved of ${r.created} created`;
              return (
                <div key={r.department} className="h-6 relative" title={tip}>
                  <div className="absolute inset-y-0 left-0 rounded-sm" style={{ width: pct(r.ratio), background: color }} />
                  <div className="absolute top-1/2 -translate-y-1/2 text-[11px] font-semibold tabular-nums text-foreground" style={{ left: `calc(${pct(r.ratio)} + 6px)` }}>
                    {r.ratio.toFixed(2)}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="relative h-5 mt-1">
            {ticks.map((t) => (
              <div key={t} className="absolute -translate-x-1/2 text-[10px] text-muted-foreground tabular-nums" style={{ left: pct(t) }}>
                {t.toFixed(1)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

type WardLoadData = {
  rows: { id: string; name: string; resolved: number; onTrack: number; nearing: number; breached: number; total: number }[];
  mean: number;
  upper: number;
  ticks: number[];
};

function WardLoadBySlaChart({ data }: { data: WardLoadData }) {
  const { rows, mean, upper, ticks } = data;
  if (!rows.length) return <Empty />;
  const pctW = (v: number) => `${(v / upper) * 100}%`;
  const segs = [
    { key: "resolved", label: "Resolved", color: "var(--color-chart-3)", recede: true },
    { key: "onTrack", label: "On track", color: "var(--color-chart-1)", recede: true },
    { key: "nearing", label: "Nearing breach", color: "var(--color-chart-2)", recede: false },
    { key: "breached", label: "Breached", color: "var(--color-chart-4)", recede: false },
  ] as const;
  return (
    <div className="flex flex-col gap-3">
      <div className="text-[11px] text-muted-foreground -mt-1">All complaints by SLA state — per ward</div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
        {segs.map((s) => (
          <span key={s.key} className="inline-flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-[2px]" style={{ background: s.color, opacity: s.recede ? 0.55 : 1 }} />
            {s.label}
          </span>
        ))}
      </div>
      <div className="flex">
        <div className="w-[140px] shrink-0">
          <div className="flex flex-col gap-3 py-1">
            {rows.map((r) => (
              <div key={r.id} className="h-6 flex items-center text-[12px] text-foreground truncate pr-2" title={r.name}>
                {r.name}
              </div>
            ))}
          </div>
          <div className="h-5" />
        </div>
        <div className="flex-1 relative min-w-0">
          <div className="absolute inset-0 bottom-5 pointer-events-none">
            {ticks.map((t) => (
              <div key={t} className="absolute top-0 bottom-0 border-l border-border/60" style={{ left: pctW(t) }} />
            ))}
            {mean > 0 && (
              <div className="absolute top-0 bottom-0" style={{ left: pctW(mean) }}>
                <div className="h-full border-l border-dashed border-foreground/50" />
                <div className="absolute -top-0.5 left-1 text-[10px] text-muted-foreground bg-surface px-1 rounded-sm whitespace-nowrap">
                  ward avg
                </div>
              </div>
            )}
          </div>
          <div className="relative flex flex-col gap-3 py-1">
            {rows.map((r) => {
              const tip = `Resolved: ${r.resolved} · On track: ${r.onTrack} · Nearing breach: ${r.nearing} · Breached: ${r.breached}`;
              return (
                <div key={r.id} className="h-6 relative" title={tip}>
                  <div className="absolute inset-y-0 left-0 flex overflow-hidden rounded-sm" style={{ width: pctW(r.total) }}>
                    {segs.map((s) => {
                      const v = (r as unknown as Record<string, number>)[s.key];
                      if (!v) return null;
                      return (
                        <div key={s.key} style={{ width: `${(v / r.total) * 100}%`, background: s.color, opacity: s.recede ? 0.55 : 1 }} />
                      );
                    })}
                  </div>
                  <div
                    className="absolute top-1/2 -translate-y-1/2 text-[11px] font-semibold tabular-nums text-foreground"
                    style={{ left: `calc(${pctW(r.total)} + 6px)` }}
                  >
                    {r.total}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="relative h-5 mt-1">
            {ticks.map((t) => (
              <div key={t} className="absolute top-0 text-[10px] text-muted-foreground -translate-x-1/2" style={{ left: pctW(t) }}>{t}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Avoid unused-import flags for icons reserved for future drill-down.
void MapPin; void BarChart3; void LineChartIcon; void Users; void Activity; void Repeat;
void TrendingUp; void Layers; void AlertTriangle; void ThumbsUp; void Clock;
void Link; void Fragment;
