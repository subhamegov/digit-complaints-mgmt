import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo, useRef, useEffect, Fragment } from "react";
import { Plus, Download, ArrowRight, TrendingUp, Clock, Users, AlertTriangle, ThumbsUp, Repeat, Building2, Filter, BarChart3, LineChart as LineChartIcon, MapPin, ListChecks, Activity, X, Search } from "lucide-react";
import { COMPLAINT_TYPES } from "@/lib/mock-data";
import {
  StatCard, Panel, StatusBadge, SlaBadge,
  ActionButton, OwnerCell, DataTable, nextActionFor,
} from "@/components/pgr/primitives";
import { ComplaintMap } from "@/components/pgr/ComplaintMap";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { useRbac } from "@/lib/rbac";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";
import {
  trend7d, COMPLAINTS, complaintTypeOf, OFFICERS, officerOf,
  type Complaint,
} from "@/lib/mock-data";
import { TEST_USER_COMPLAINTS, TEST_USER_WARDS, median, type TestComplaint } from "@/lib/test-user-seed";

import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar,
  PieChart, Pie, Cell, Legend,
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

export function DashboardPage() {
  const { jurisdiction, role } = useRbac();
  const canCustomize = role === "TEST_USER";

  // Filter state (TEST_USER only)
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [geoFilter, setGeoFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Test User reads from its own coherent 60-row seed so every widget
  // reconciles against ONE dataset. Other roles keep the legacy COMPLAINTS.
  const sourceComplaints: Complaint[] = canCustomize ? TEST_USER_COMPLAINTS : COMPLAINTS;

  // Apply filters to the complaint dataset. Non-TEST_USER roles see the
  // unfiltered numbers (their filter bar is hidden).
  const filteredComplaints = useMemo(() => {
    if (!canCustomize) return COMPLAINTS;
    const fromTs = fromDate ? new Date(fromDate + "T00:00:00").getTime() : null;
    const toTs = toDate ? new Date(toDate + "T23:59:59").getTime() : null;
    const q = searchQuery.trim().toLowerCase();
    return sourceComplaints.filter((c) => {
      const filedTs = new Date(c.filedOn).getTime();
      if (fromTs !== null && filedTs < fromTs) return false;
      if (toTs !== null && filedTs > toTs) return false;
      if (geoFilter && c.ward !== geoFilter) return false;
      if (typeFilter && c.typeCode !== typeFilter) return false;
      if (q) {
        const hay = `${c.id} ${c.description ?? ""} ${c.ward ?? ""} ${c.typeCode ?? ""} ${(c as TestComplaint).citizen?.name ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [canCustomize, sourceComplaints, fromDate, toDate, geoFilter, typeFilter, searchQuery]);

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
    const map = new Map<string, { total: number; open: number; resolvedOnTime: number; resolved: number }>();
    for (const c of filteredComplaints) {
      const m = map.get(c.ward) ?? { total: 0, open: 0, resolvedOnTime: 0, resolved: 0 };
      m.total++;
      const isResolved = c.status === "RESOLVED" || c.status === "CLOSED";
      if (isResolved) {
        m.resolved++;
        if (c.slaState !== "BREACHED") m.resolvedOnTime++;
      } else if (["OPEN","ASSIGNED","IN_PROGRESS","REOPENED"].includes(c.status)) {
        m.open++;
      }
      map.set(c.ward, m);
    }
    return Array.from(map, ([ward, v]) => ({
      ward,
      total: v.total,
      open: v.open,
      onTimePct: v.resolved ? Math.round((v.resolvedOnTime / v.resolved) * 1000) / 10 : 0,
    }));
  }, [filteredComplaints]);

  // Full ward list for the geography selector so options don't disappear
  // after filtering by ward.
  const allWards = useMemo(() => {
    if (canCustomize) return [...TEST_USER_WARDS];
    const set = new Set<string>();
    for (const c of COMPLAINTS) set.add(c.ward);
    return Array.from(set).sort();
  }, [canCustomize]);

  const trend = trend7d();
  const recent = filteredComplaints.slice(0, 6);
  const wardsMax = Math.max(...wards.map((w) => w.total), 1);

  // --- Derived datasets for additional KPIs ---
  const fmtHHMM = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  const resolutionRate = s.total ? Math.round((s.resolved / s.total) * 1000) / 10 : 0;

  // Pseudo-derived avg resolution/first-response per complaint based on filed age,
  // so values stay stable but look realistic.
  const avgResolutionHrs = s.avgResolutionHrs; // 42
  const firstResponseHrs = 2.4;

  const STATUS_ORDER: Complaint["status"][] = ["OPEN", "ASSIGNED", "IN_PROGRESS", "REOPENED", "RESOLVED", "CLOSED", "REJECTED"];
  const STATUS_LABEL: Record<Complaint["status"], string> = {
    OPEN: "Pending Assignment",
    ASSIGNED: "Assigned",
    IN_PROGRESS: "Pending Reassignment",
    REOPENED: "Pending Reassignment",
    RESOLVED: "Resolved",
    CLOSED: "Closed",
    REJECTED: "Rejected",
  };
  const statusBuckets = useMemo(() => {
    const m = new Map<string, number>();
    STATUS_ORDER.forEach((st) => m.set(st, 0));
    for (const c of filteredComplaints) m.set(c.status, (m.get(c.status) ?? 0) + 1);
    return STATUS_ORDER.map((st) => ({ key: st, label: STATUS_LABEL[st], value: m.get(st) ?? 0 }));
  }, [filteredComplaints]);

  const typeBuckets = useMemo(() => {
    const byDept = new Map<string, { dept: string; total: number; types: { code: string; name: string; count: number }[] }>();
    for (const c of filteredComplaints) {
      const ct = complaintTypeOf(c.typeCode);
      if (!ct) continue;
      const g = byDept.get(ct.department) ?? { dept: ct.department, total: 0, types: [] };
      g.total++;
      const existing = g.types.find((x) => x.code === ct.code);
      if (existing) existing.count++;
      else g.types.push({ code: ct.code, name: ct.name, count: 1 });
      byDept.set(ct.department, g);
    }
    return Array.from(byDept.values()).sort((a, b) => b.total - a.total);
  }, [filteredComplaints]);

  const slaBuckets = useMemo(() => {
    let within = 0, nearing = 0, breached = 0;
    for (const c of filteredComplaints) {
      if (c.slaState === "WITHIN") within++;
      else if (c.slaState === "NEARING") nearing++;
      else breached++;
    }
    return [
      { key: "within", label: "Within SLA", value: within, color: "var(--color-chart-3)" },
      { key: "nearing", label: "Breaching SLA", value: nearing, color: "var(--color-chart-2)" },
      { key: "breached", label: "Breached SLA", value: breached, color: "var(--color-chart-4)" },
    ];
  }, [filteredComplaints]);

  const CHANNEL_LABEL: Record<string, string> = {
    MOBILE_APP: "Mobile App", WEB: "Web", CALL_CENTER: "Call", COUNTER: "Counter", WHATSAPP: "WhatsApp",
  };
  const channelBuckets = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of filteredComplaints) m.set(c.channel, (m.get(c.channel) ?? 0) + 1);
    const total = filteredComplaints.length || 1;
    return Array.from(m, ([k, v]) => ({ name: CHANNEL_LABEL[k] ?? k, value: v, pct: Math.round((v / total) * 1000) / 10 }));
  }, [filteredComplaints]);

  const openBreakdown = useMemo(() => {
    const openSet = filteredComplaints.filter((c) => ["OPEN", "ASSIGNED", "IN_PROGRESS", "REOPENED"].includes(c.status));
    const reopened = openSet.filter((c) => c.reopenCount > 0 || c.status === "REOPENED").length;
    const fresh = openSet.length - reopened;
    return [
      { name: "New", value: fresh },
      { name: "Reopened", value: reopened },
    ];
  }, [filteredComplaints]);

  const hourBuckets = useMemo(() => {
    const arr = Array.from({ length: 24 }, (_, h) => ({ hour: `${String(h).padStart(2, "0")}h`, value: 0 }));
    for (const c of filteredComplaints) {
      const h = new Date(c.filedOn).getHours();
      arr[h].value++;
    }
    return arr;
  }, [filteredComplaints]);

  const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dowBuckets = useMemo(() => {
    const arr = DOW.map((d) => ({ day: d, value: 0 }));
    for (const c of filteredComplaints) {
      const d = new Date(c.filedOn).getDay();
      arr[d].value++;
    }
    return arr;
  }, [filteredComplaints]);

  const trendingTypes = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of filteredComplaints) {
      const ct = complaintTypeOf(c.typeCode);
      const sub = (c as TestComplaint).subtype ?? ct?.name ?? c.typeCode;
      m.set(sub, (m.get(sub) ?? 0) + 1);
    }
    const ranked = Array.from(m, ([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 5);
    return ranked.map((r, i) => {
      const seed = (r.name.length * 7) % 50;
      const wow = ((seed - 20) + (i * 1.7));
      return {
        rank: i + 1,
        name: r.name,
        volume: r.count,
        wow: Math.round(wow * 10) / 10,
      };
    });
  }, [filteredComplaints]);

  const trendingLocations = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of filteredComplaints) m.set(c.ward, (m.get(c.ward) ?? 0) + 1);
    const arr = Array.from(m, ([ward, count]) => {
      const spike = 1 + ((ward.charCodeAt(ward.length - 1) % 10) * 0.3);
      return { ward, count, spike: Math.round(spike * 10) / 10 };
    }).sort((a, b) => b.spike - a.spike);
    return arr;
  }, [filteredComplaints]);

  const openByEmployee = useMemo(() => {
    const m = new Map<string, { open: number; totalRespHrs: number; respCount: number; assignedCount: number }>();
    for (const c of filteredComplaints) {
      const id = c.assignedOfficerId;
      if (!id) continue;
      const e = m.get(id) ?? { open: 0, totalRespHrs: 0, respCount: 0, assignedCount: 0 };
      e.assignedCount++;
      if (["OPEN", "ASSIGNED", "IN_PROGRESS", "REOPENED"].includes(c.status)) e.open++;
      const pa = (c as TestComplaint).stageHours?.pendingAssignment;
      if (typeof pa === "number" && pa > 0) {
        e.respCount++;
        e.totalRespHrs += pa;
      }
      m.set(id, e);
    }
    const totalOpen = Array.from(m.values()).reduce((a, b) => a + b.open, 0) || 1;
    return Array.from(m, ([id, v]) => ({
      id,
      name: officerOf(id)?.name ?? id,
      open: v.open,
      pct: Math.round((v.open / totalOpen) * 1000) / 10,
      avgHrs: v.respCount ? Math.round((v.totalRespHrs / v.respCount) * 10) / 10 : 0,
    })).sort((a, b) => b.open - a.open);
  }, [filteredComplaints]);

  const teamLoadBySla = useMemo(() => {
    type Row = { id: string; name: string; resolved: number; onTrack: number; nearing: number; breached: number; total: number };
    const m = new Map<string, Row>();
    for (const c of filteredComplaints) {
      const id = c.assignedOfficerId;
      if (!id) continue;
      const e: Row = m.get(id) ?? { id, name: officerOf(id)?.name ?? id, resolved: 0, onTrack: 0, nearing: 0, breached: 0, total: 0 };
      const isResolved = c.status === "RESOLVED" || c.status === "CLOSED";
      const isOpen = ["OPEN","ASSIGNED","IN_PROGRESS","REOPENED"].includes(c.status);
      if (isResolved) e.resolved++;
      else if (isOpen) {
        if (c.slaState === "BREACHED") e.breached++;
        else if (c.slaState === "NEARING") e.nearing++;
        else e.onTrack++;
      }
      e.total++;
      m.set(id, e);
    }
    const rows = Array.from(m.values()).sort((a, b) => b.breached - a.breached || b.total - a.total);
    const max = Math.max(...rows.map((r) => r.total), 1);
    const mean = rows.length ? rows.reduce((a, r) => a + r.total, 0) / rows.length : 0;
    // Nice axis upper bound and step
    const raw = max / 6;
    const pow = Math.pow(10, Math.floor(Math.log10(Math.max(raw, 1))));
    const norm = raw / pow;
    const step = (norm < 1.5 ? 1 : norm < 3 ? 2 : norm < 7 ? 5 : 10) * pow;
    const upper = Math.max(step, Math.ceil(max / step) * step);
    const ticks: number[] = [];
    for (let v = 0; v <= upper + 0.0001; v += step) ticks.push(Math.round(v));
    return { rows, max, mean, upper, ticks };
  }, [filteredComplaints]);



  const resolutionByType = useMemo(() => {
    const m = new Map<string, { total: number; resolved: number; resolvedOnTime: number; hrs: number }>();
    for (const c of filteredComplaints) {
      const ct = complaintTypeOf(c.typeCode);
      const sub = (c as TestComplaint).subtype ?? ct?.name ?? c.typeCode;
      const e = m.get(sub) ?? { total: 0, resolved: 0, resolvedOnTime: 0, hrs: 0 };
      e.total++;
      if (c.status === "RESOLVED" || c.status === "CLOSED") {
        e.resolved++;
        if (c.slaState !== "BREACHED") e.resolvedOnTime++;
        e.hrs += c.slaHours - c.slaRemainingHrs;
      }
      m.set(sub, e);
    }
    return Array.from(m, ([name, v]) => ({
      name,
      closure: v.total ? Math.round((v.resolved / v.total) * 1000) / 10 : 0,
      onTime: v.resolved ? Math.round((v.resolvedOnTime / v.resolved) * 1000) / 10 : 0,
      avgHrs: v.resolved ? Math.round((v.hrs / v.resolved) * 10) / 10 : 0,
    })).sort((a, b) => a.closure - b.closure);
  }, [filteredComplaints]);

  // Time-series with daily/weekly/monthly synthesis from trend7d.
  const overTimeDaily = trend;
  const overTimeWeekly = useMemo(() => {
    const sumF = trend.reduce((a, b) => a + b.filed, 0);
    const sumR = trend.reduce((a, b) => a + b.resolved, 0);
    return [
      { day: "W-3", filed: Math.round(sumF * 0.78), resolved: Math.round(sumR * 0.74) },
      { day: "W-2", filed: Math.round(sumF * 0.9), resolved: Math.round(sumR * 0.88) },
      { day: "W-1", filed: Math.round(sumF * 0.95), resolved: Math.round(sumR * 0.93) },
      { day: "This wk", filed: sumF, resolved: sumR },
    ];
  }, [trend]);

  // --- Test-User-only derived metrics (reconcile against filteredComplaints) ---
  const tu = useMemo(() => {
    const rows = filteredComplaints as TestComplaint[];
    const isOpen = (c: Complaint) => ["OPEN","ASSIGNED","IN_PROGRESS","REOPENED"].includes(c.status);
    const isResolved = (c: Complaint) => c.status === "RESOLVED" || c.status === "CLOSED";
    const resolved = rows.filter(isResolved);
    const resolvedOnTime = resolved.filter((c) => c.slaState !== "BREACHED").length;
    const openPastSla = rows.filter((c) => isOpen(c) && c.slaState === "BREACHED").length;
    const atRisk = rows.filter((c) => isOpen(c) && c.slaRemainingHrs >= 0 && c.slaRemainingHrs <= 48).length;
    const onTimeDenom = resolved.length + openPastSla;
    const onTimeRate = onTimeDenom ? Math.round((resolvedOnTime / onTimeDenom) * 1000) / 10 : 0;

    const resolutionTimes = resolved.map((c) => c.slaHours - c.slaRemainingHrs);
    const avgResolution = resolutionTimes.length
      ? Math.round((resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length) * 10) / 10
      : 0;
    const medianResolution = Math.round(median(resolutionTimes) * 10) / 10;

    const escalated = rows.filter((c) => (c as TestComplaint).escalated).length;
    const escalationRate = rows.length ? Math.round((escalated / rows.length) * 1000) / 10 : 0;

    const reopened = rows.filter((c) => c.reopenCount > 0 || c.status === "REOPENED").length;
    const reopenRate = resolved.length ? Math.round((reopened / resolved.length) * 1000) / 10 : 0;

    const csatScores = resolved.map((c) => c.csat).filter((v): v is number => typeof v === "number");
    const csat = csatScores.length
      ? Math.round((csatScores.reduce((a, b) => a + b, 0) / csatScores.length) * 10) / 10
      : 0;

    // Period span in days: from earliest filed to now (capped at filter range when set).
    const now = Date.now();
    const earliest = rows.reduce((min, c) => Math.min(min, new Date(c.filedOn).getTime()), now);
    const days = Math.max(1, Math.round((now - earliest) / 86400_000));
    const resolvedPerDay = Math.round((resolved.length / days) * 10) / 10;

    const openRows = rows.filter(isOpen);
    const oldestOpenHrs = openRows.reduce((max, c) => {
      const age = (now - new Date(c.filedOn).getTime()) / 3600_000;
      return age > max ? age : max;
    }, 0);
    const oldestOpenLabel = (() => {
      const d = Math.floor(oldestOpenHrs / 24);
      const h = Math.round(oldestOpenHrs % 24);
      return d > 0 ? `${d}d ${h}h` : `${h}h`;
    })();

    // Per-stage timings (avg + median + sample size).
    const stages = [
      { key: "pendingAssignment", label: "Pending Assignment" },
      { key: "assigned",          label: "Assigned" },
      { key: "pendingResolution", label: "Pending Reassignment" },
    ] as const;
    const stageTimings: { key: string; label: string; avg: number; median: number; n: number }[] = stages.map((st) => {
      const samples = rows
        .map((c) => (c as TestComplaint).stageHours?.[st.key])
        .filter((v): v is number => typeof v === "number" && v > 0);
      const avg = samples.length ? samples.reduce((a, b) => a + b, 0) / samples.length : 0;
      return {
        key: st.key,
        label: st.label,
        avg: Math.round(avg * 10) / 10,
        median: Math.round(median(samples) * 10) / 10,
        n: samples.length,
      };
    });
    // Add a Resolved (end-to-end) row so all four PGR states are represented.
    stageTimings.push({
      key: "resolved",
      label: "Resolved (end-to-end)",
      avg: avgResolution,
      median: medianResolution,
      n: resolved.length,
    });
    const bottleneckKey = stageTimings.slice(0, 3).reduce((acc, s) => s.avg > acc.avg ? s : acc, stageTimings[0]).key;

    // Age buckets.
    const ageBuckets = [
      { key: "<1d",  label: "< 1 day",   value: 0 },
      { key: "1-3d", label: "1–3 days",  value: 0 },
      { key: "3-7d", label: "3–7 days",  value: 0 },
      { key: ">7d",  label: "> 7 days",  value: 0 },
    ];
    for (const c of rows) {
      const ageH = (now - new Date(c.filedOn).getTime()) / 3600_000;
      if (ageH < 24) ageBuckets[0].value++;
      else if (ageH < 72) ageBuckets[1].value++;
      else if (ageH < 168) ageBuckets[2].value++;
      else ageBuckets[3].value++;
    }

    // Type/subtype × status crosstab.
    const statusCols: Complaint["status"][] = ["OPEN","ASSIGNED","IN_PROGRESS","REOPENED","RESOLVED","CLOSED","REJECTED"];
    const xtMap = new Map<string, { type: string; subtype: string; counts: Record<string, number>; total: number }>();
    for (const c of rows) {
      const ct = complaintTypeOf(c.typeCode);
      if (!ct) continue;
      const sub = (c as TestComplaint).subtype ?? ct.name;
      const key = `${ct.name}::${sub}`;
      const row = xtMap.get(key) ?? {
        type: ct.name, subtype: sub,
        counts: Object.fromEntries(statusCols.map((s) => [s, 0])),
        total: 0,
      };
      row.counts[c.status] = (row.counts[c.status] ?? 0) + 1;
      row.total++;
      xtMap.set(key, row);
    }
    const typeStatusCrosstab = {
      cols: statusCols,
      rows: Array.from(xtMap.values()).sort((a, b) => b.total - a.total),
    };

    // Avg time to first assignment: pendingAssignment hours across rows that
    // have moved past OPEN (i.e., have actually been assigned at least once).
    const firstAssignSamples = rows
      .filter((c) => c.status !== "OPEN" && c.status !== "REJECTED")
      .map((c) => (c as TestComplaint).stageHours?.pendingAssignment)
      .filter((v): v is number => typeof v === "number" && v > 0);
    const firstAssignmentHrs = firstAssignSamples.length
      ? Math.round((firstAssignSamples.reduce((a, b) => a + b, 0) / firstAssignSamples.length) * 10) / 10
      : 0;

    return {
      onTimeRate, openPastSla, atRisk,
      avgResolution, medianResolution,
      escalationRate, reopenRate, csat,
      resolvedPerDay, oldestOpenLabel,
      firstAssignmentHrs,
      stageTimings, bottleneckKey, ageBuckets, typeStatusCrosstab,
    };
  }, [filteredComplaints]);

  const overTimeMonthly = useMemo(() => {
    const sumF = trend.reduce((a, b) => a + b.filed, 0) * 4;
    const sumR = trend.reduce((a, b) => a + b.resolved, 0) * 4;
    return [
      { day: "Feb", filed: Math.round(sumF * 0.7), resolved: Math.round(sumR * 0.68) },
      { day: "Mar", filed: Math.round(sumF * 0.82), resolved: Math.round(sumR * 0.8) },
      { day: "Apr", filed: Math.round(sumF * 0.95), resolved: Math.round(sumR * 0.92) },
      { day: "May", filed: sumF, resolved: sumR },
    ];
  }, [trend]);


  // View toggles for new widgets
  const [geoView, setGeoView] = useState<"logged" | "open" | "resolved">("logged");
  const [statusView, setStatusView] = useState<"table" | "bar">("table");
  const [typeView, setTypeView] = useState<"table" | "bar">("table");
  const [slaView, setSlaView] = useState<"table" | "bar">("table");
  const [overTimeGran, setOverTimeGran] = useState<"daily" | "weekly" | "monthly">("daily");
  const [typeExpanded, setTypeExpanded] = useState<Record<string, boolean>>({});

  const geoData = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of filteredComplaints) {
      const isOpen = ["OPEN", "ASSIGNED", "IN_PROGRESS", "REOPENED"].includes(c.status);
      const isResolved = c.status === "RESOLVED" || c.status === "CLOSED";
      if (geoView === "open" && !isOpen) continue;
      if (geoView === "resolved" && !isResolved) continue;
      m.set(c.ward, (m.get(c.ward) ?? 0) + 1);
    }
    const arr = Array.from(m, ([ward, count]) => ({ ward, count }));
    const max = Math.max(...arr.map((x) => x.count), 1);
    return { arr: arr.sort((a, b) => b.count - a.count), max };
  }, [filteredComplaints, geoView]);

  const overTimeData =
    overTimeGran === "daily" ? overTimeDaily : overTimeGran === "weekly" ? overTimeWeekly : overTimeMonthly;

  // Unified KPI registry: every box (stat card or chart panel) is a KPI.
  const KPI_REGISTRY: KpiDef[] = useMemo(() => [

    // Stat KPIs
    { id: "total", kind: "stat", label: t("CS_TOTAL_COMPLAINTS"), description: "Total complaints registered in the selected period.", icon: TrendingUp, intent: "neutral", getValue: () => String(s.total), getDelta: () => "+12 vs last week" },
    { id: "open", kind: "stat", label: t("CS_OPEN_COMPLAINTS"), description: "Complaints currently open and awaiting resolution.", icon: AlertTriangle, intent: "warning", getValue: () => String(s.open), getDelta: () => canCustomize ? `${tu.atRisk} at risk · ${tu.openPastSla} breached` : "4 nearing breach" },
    { id: "resolved", kind: "stat", label: t("CS_RESOLVED_COMPLAINTS"), description: "Complaints resolved in the selected period.", icon: ThumbsUp, intent: "positive", getValue: () => String(s.resolved), getDelta: () => canCustomize ? `Out of ${s.total} complaints` : "87% within SLA" },
    { id: "breached", kind: "stat", label: t("CS_SLA_BREACHED"), description: "Complaints where SLA has been breached.", icon: AlertTriangle, intent: "negative", getValue: () => String(s.breached), getDelta: () => "Escalation L2 active" },
    { id: "avg-resolution", kind: "stat", label: t("CS_AVG_RESOLUTION"), description: "Average time taken to resolve a complaint (hours).", icon: Clock, intent: "neutral", getValue: () => fmtHHMM(canCustomize ? tu.avgResolution : avgResolutionHrs), getDelta: () => "Target: 36h" },
    { id: "reopen", kind: "stat", label: t("CS_REOPEN_RATE"), description: "Reopened ÷ resolved, as a percentage.", icon: Repeat, intent: "neutral", getValue: () => `${canCustomize ? tu.reopenRate : s.reopenRate}%`, getDelta: () => canCustomize ? `CSAT ${tu.csat}/5` : `CSAT ${s.satisfaction}/5` },
    { id: "first-response", kind: "stat", label: "Avg. first response", description: "Mean time from registration to first officer acknowledgement (hours).", icon: Clock, intent: "positive", getValue: () => fmtHHMM(firstResponseHrs), getDelta: () => "−18% WoW" },
    {
      id: "resolution-rate", kind: "stat",
      label: canCustomize ? "On-time resolution rate" : "Resolution rate",
      description: canCustomize
        ? "Resolved-within-SLA ÷ (resolved-within-SLA + open-past-SLA). Counts open-past-SLA complaints as failures-in-progress."
        : "Resolved ÷ logged complaints, as a percentage.",
      icon: ThumbsUp, intent: "positive",
      getValue: () => canCustomize ? `${tu.onTimeRate}%` : `${resolutionRate}%`,
      getDelta: () => canCustomize
        ? `Breached open: ${tu.openPastSla}`
        : `${s.resolved}/${s.total} resolved`,
    },
    { id: "at-risk-open", kind: "stat", label: "At risk (open)", description: "Open complaints nearing SLA breach (≤ 25% of SLA window remaining).", icon: AlertTriangle, intent: "warning", getValue: () => canCustomize ? String(tu.atRisk) : "—", getDelta: () => "Nearing breach" },
    { id: "breached-sla", kind: "stat", label: "Breached SLA (open)", description: "Open complaints that have crossed their SLA deadline.", icon: AlertTriangle, intent: "negative", getValue: () => canCustomize ? String(tu.openPastSla) : "—", getDelta: () => "Out of 42 Open Complaints" },
    { id: "first-assignment", kind: "stat", label: "Time to first assignment", description: "Average time from registration to first officer assignment.", icon: Clock, intent: "neutral", getValue: () => canCustomize ? fmtHHMM(tu.firstAssignmentHrs) : "—", getDelta: () => "" },

    { id: "escalation-rate", kind: "stat", label: "Escalation rate", description: "Share of complaints escalated to L2/L3.", icon: TrendingUp, intent: "warning", getValue: () => canCustomize ? `${tu.escalationRate}%` : "9.2%", getDelta: () => canCustomize ? "Escalated ÷ total" : "+1.1 pts" },
    { id: "median-resolution", kind: "stat", label: "Median resolution", description: "Median time from filing to resolution.", icon: Clock, intent: "neutral", getValue: () => canCustomize ? fmtHHMM(tu.medianResolution) : fmtHHMM(36), getDelta: () => `Avg ${fmtHHMM(canCustomize ? tu.avgResolution : avgResolutionHrs)}` },
    { id: "csat", kind: "stat", label: "Citizen satisfaction", description: "Mean citizen satisfaction (1–5) across resolved complaints.", icon: ThumbsUp, intent: "positive", getValue: () => canCustomize ? `${tu.csat}/5` : `${s.satisfaction}/5`, getDelta: () => "Across resolved" },
    { id: "resolved-per-day", kind: "stat", label: "Resolved per day", description: "Resolved complaints ÷ days in the selected period.", icon: TrendingUp, intent: "neutral", getValue: () => canCustomize ? String(tu.resolvedPerDay) : "11", getDelta: () => "Rolling rate" },
    { id: "oldest-open", kind: "stat", label: "Oldest open age", description: "Age of the oldest currently-open complaint.", icon: AlertTriangle, intent: "warning", getValue: () => canCustomize ? tu.oldestOpenLabel : "9d 4h", getDelta: () => "Action required" },
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
        <div className="h-[260px]">
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
      id: "wards", kind: "panel", label: "By locality", description: "Complaint volume and on-time % by ward.",
      icon: MapPin, colSpan: 1, title: "By locality",
      render: () => canCustomize ? (
        <table className="w-full text-[12px]">
          <thead><tr className="text-left text-muted-foreground">
            <th className="py-1 font-medium">Ward</th>
            <th className="py-1 font-medium text-right">Logged</th>
            <th className="py-1 font-medium text-right">Open</th>
            <th className="py-1 font-medium text-right">On-time %</th>
          </tr></thead>
          <tbody>
            {wards.map((w) => (
              <tr key={w.ward} className="border-t border-border">
                <td className="py-1.5 truncate">{w.ward}</td>
                <td className="py-1.5 text-right tabular-nums">{w.total}</td>
                <td className="py-1.5 text-right tabular-nums">{w.open}</td>
                <td className="py-1.5 text-right tabular-nums">{w.onTimePct.toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
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
        <div className="h-[260px]">
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
      render: () => {
        const rows = canCustomize
          ? [...filteredComplaints].filter(c => c.status !== "RESOLVED" && c.status !== "CLOSED" && c.status !== "REJECTED").sort((a, b) => a.slaRemainingHrs - b.slaRemainingHrs).slice(0, 8)
          : filteredComplaints.filter(c => c.slaState !== "WITHIN" && c.status !== "RESOLVED" && c.status !== "REJECTED").slice(0, 6);
        return (
        <DataTable<Complaint>
          emptyMessage={t("EMPTY_INBOX")}
          rows={rows}
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
        );
      },
    },

    // --- New panels (KPIs 7-19) ---
    {
      id: "geo-map", kind: "panel", label: "Complaints by geography", description: "Ward heat-map with logged/open/resolved toggle.",
      icon: MapPin, colSpan: 2, title: "Complaints by geography",
      action: (
        <div className="inline-flex rounded-sm border border-border overflow-hidden text-[11px]">
          {(["logged", "open", "resolved"] as const).map((v) => (
            <button key={v} onClick={() => setGeoView(v)}
              className={cn("px-2 py-1 capitalize", geoView === v ? "bg-primary text-primary-foreground" : "bg-surface text-muted-foreground hover:text-foreground")}>
              {v}
            </button>
          ))}
        </div>
      ),
      render: () => (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
          {geoData.arr.map((w) => {
            const intensity = w.count / geoData.max;
            return (
              <div key={w.ward}
                className="rounded-sm border border-border p-2 text-center"
                style={{ backgroundColor: `color-mix(in oklab, var(--primary) ${Math.round(intensity * 70)}%, var(--surface))` }}>
                <div className="text-[11px] font-semibold text-foreground">{w.ward}</div>
                <div className="text-[14px] font-bold tabular-nums text-foreground">{w.count}</div>
              </div>
            );
          })}
        </div>
      ),
    },
    {
      id: "complaint-map", kind: "panel", label: "Complaint map", description: "Bangalore boundary hierarchy with zoom-driven LOD; WoW or SLA breach coloring.",
      icon: MapPin, colSpan: 2, title: "Complaint map · Bangalore",
      render: () => <ComplaintMap complaints={filteredComplaints} />,
    },
    {
      id: "by-status", kind: "panel", label: "Complaints by status", description: "Status distribution as table or bar chart.",
      icon: ListChecks, colSpan: 1, title: "Complaints by status",
      action: (
        <ViewToggle value={statusView} onChange={setStatusView} />
      ),
      render: () => statusView === "table" ? (
        <table className="w-full text-[12px]">
          <thead><tr className="text-left text-muted-foreground"><th className="py-1 font-medium">Status</th><th className="py-1 font-medium text-right">Count</th></tr></thead>
          <tbody>
            {statusBuckets.map((b) => (
              <tr key={b.key} className="border-t border-border">
                <td className="py-1.5">{b.label}</td>
                <td className="py-1.5 text-right tabular-nums">{b.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={statusBuckets} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} interval={0} angle={-20} textAnchor="end" height={50} />
              <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
              <Tooltip contentStyle={{ fontSize: 12 }} />
              <Bar dataKey="value" fill="var(--color-chart-1)" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ),
    },
    {
      id: "by-type", kind: "panel", label: "Complaints by type / sub-type", description: "Department → complaint type drill-down.",
      icon: BarChart3, colSpan: 2, title: "Complaints by type / sub-type",
      action: <ViewToggle value={typeView} onChange={setTypeView} />,
      render: () => typeView === "table" ? (
        <table className="w-full text-[12px]">
          <thead><tr className="text-left text-muted-foreground"><th className="py-1 font-medium">Department / Type</th><th className="py-1 font-medium text-right">Count</th></tr></thead>
          <tbody>
            {typeBuckets.map((g) => (
              <Fragment key={g.dept}>
                <tr className="border-t border-border bg-muted/30">
                  <td className="py-1.5">
                    <button onClick={() => setTypeExpanded((p) => ({ ...p, [g.dept]: !p[g.dept] }))} className="font-semibold text-foreground hover:underline">
                      {typeExpanded[g.dept] ? "▾" : "▸"} {g.dept}
                    </button>
                  </td>
                  <td className="py-1.5 text-right tabular-nums font-semibold">{g.total}</td>
                </tr>
                {typeExpanded[g.dept] && g.types.map((t2) => (
                  <tr key={t2.code} className="border-t border-border">
                    <td className="py-1.5 pl-6 text-muted-foreground">{t2.name}</td>
                    <td className="py-1.5 text-right tabular-nums">{t2.count}</td>
                  </tr>
                ))}
              </Fragment>
            ))}

          </tbody>
        </table>
      ) : (
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={typeBuckets.map((g) => ({ name: g.dept, value: g.total }))} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} interval={0} angle={-15} textAnchor="end" height={50} />
              <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
              <Tooltip contentStyle={{ fontSize: 12 }} />
              <Bar dataKey="value" fill="var(--color-chart-2)" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ),
    },
    {
      id: "by-sla", kind: "panel", label: "Complaints by SLA", description: "Within / breaching / breached SLA distribution.",
      icon: AlertTriangle, colSpan: 1, title: "Complaints by SLA",
      action: <ViewToggle value={slaView} onChange={setSlaView} />,
      render: () => slaView === "table" ? (
        <table className="w-full text-[12px]">
          <thead><tr className="text-left text-muted-foreground"><th className="py-1 font-medium">Bucket</th><th className="py-1 font-medium text-right">Count</th></tr></thead>
          <tbody>
            {slaBuckets.map((b) => (
              <tr key={b.key} className="border-t border-border">
                <td className="py-1.5">
                  <span className="inline-block h-2 w-2 rounded-full mr-2" style={{ backgroundColor: b.color }} />
                  {b.label}
                </td>
                <td className="py-1.5 text-right tabular-nums font-semibold" style={{ color: b.color }}>{b.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={slaBuckets} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
              <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
              <Tooltip contentStyle={{ fontSize: 12 }} />
              <Bar dataKey="value" radius={[2, 2, 0, 0]}>
                {slaBuckets.map((b) => <Cell key={b.key} fill={b.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      ),
    },
    {
      id: "by-channel", kind: "panel", label: "Complaints by channel", description: "Channel mix as a percentage pie.",
      icon: Activity, colSpan: 1, title: "Complaints by channel",
      render: () => (
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={channelBuckets} dataKey="value" nameKey="name" innerRadius={40} outerRadius={75} label={(d: any) => `${d.pct}%`}>
                {channelBuckets.map((_, i) => (
                  <Cell key={i} fill={`var(--color-chart-${(i % 5) + 1})`} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: any, n: any, p: any) => [`${v} (${p.payload.pct}%)`, n]} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      ),
    },
    {
      id: "open-breakdown", kind: "panel", label: "Open complaints breakdown", description: "New vs reopened open complaints.",
      icon: Repeat, colSpan: 1, title: "Open complaints — new vs reopened",
      render: () => (
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={openBreakdown} dataKey="value" nameKey="name" innerRadius={40} outerRadius={75} label={(d: any) => `${d.value}`}>
                <Cell fill="var(--color-chart-1)" />
                <Cell fill="var(--color-chart-4)" />
              </Pie>
              <Tooltip contentStyle={{ fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      ),
    },
    {
      id: "time-of-day", kind: "panel", label: "Time-of-day pattern", description: "Complaints logged by hour of day.",
      icon: Clock, colSpan: 2, title: "Time-of-day pattern",
      render: () => (
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={hourBuckets} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="hour" tick={{ fontSize: 9, fill: "var(--muted-foreground)" }} interval={1} />
              <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
              <Tooltip contentStyle={{ fontSize: 12 }} />
              <Bar dataKey="value" fill="var(--color-chart-1)" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ),
    },
    {
      id: "day-of-week", kind: "panel", label: "Day-of-week pattern", description: "Complaints logged by day of week.",
      icon: BarChart3, colSpan: 1, title: "Day-of-week pattern",
      render: () => (
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dowBuckets} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
              <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
              <Tooltip contentStyle={{ fontSize: 12 }} />
              <Bar dataKey="value" fill="var(--color-chart-3)" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ),
    },
    {
      id: "trending-complaints", kind: "panel", label: "Trending complaints", description: "Top 5 categories this week with WoW change.",
      icon: TrendingUp, colSpan: 1, title: "Trending complaints (top 5)",
      render: () => (
        <table className="w-full text-[12px]">
          <thead><tr className="text-left text-muted-foreground">
            <th className="py-1 font-medium w-6">#</th>
            <th className="py-1 font-medium">Sub-type</th>
            <th className="py-1 font-medium text-right">Volume</th>
            <th className="py-1 font-medium text-right">WoW</th>
          </tr></thead>
          <tbody>
            {trendingTypes.map((r) => {
              const up = r.wow >= 0;
              return (
                <tr key={r.rank} className="border-t border-border">
                  <td className="py-1.5 tabular-nums">{r.rank}</td>
                  <td className="py-1.5 truncate">{r.name}</td>
                  <td className="py-1.5 text-right tabular-nums">{r.volume}</td>
                  <td className={cn("py-1.5 text-right tabular-nums font-semibold", up ? "text-emerald-600" : "text-red-600")}>
                    {up ? "↑" : "↓"} {Math.abs(r.wow).toFixed(1)}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ),
    },
    {
      id: "trending-locations", kind: "panel", label: "Trending locations", description: "Ward spikes week-over-week with top callout.",
      icon: MapPin, colSpan: 2, title: "Trending locations",
      render: () => {
        const top = trendingLocations[0];
        return (
          <div className="space-y-3">
            {top && (
              <div className="rounded-sm border border-primary/40 bg-primary/5 p-3 flex items-center justify-between">
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Top spike</div>
                  <div className="text-[14px] font-semibold text-foreground">{top.ward}</div>
                  <div className="text-[12px] text-muted-foreground">{top.count} complaints</div>
                </div>
                <div className="text-[20px] font-bold text-primary">{top.spike.toFixed(1)}×</div>
              </div>
            )}
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {trendingLocations.map((l) => {
                const intensity = Math.min(1, (l.spike - 1) / 2);
                return (
                  <div key={l.ward} className="rounded-sm border border-border p-2 text-center"
                    style={{ backgroundColor: `color-mix(in oklab, var(--color-chart-4) ${Math.round(intensity * 65)}%, var(--surface))` }}>
                    <div className="text-[11px] font-semibold">{l.ward}</div>
                    <div className="text-[11px] text-muted-foreground">{l.spike.toFixed(1)}×</div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      },
    },
    {
      id: "open-by-employee", kind: "panel", label: "Open complaints by employee", description: "Per-employee open share and avg. response time.",
      icon: Users, colSpan: 2, title: "Open complaints by employee",
      render: () => (
        <table className="w-full text-[12px]">
          <thead><tr className="text-left text-muted-foreground">
            <th className="py-1 font-medium">Employee</th>
            <th className="py-1 font-medium text-right">Open</th>
            <th className="py-1 font-medium text-right">% of total</th>
            <th className="py-1 font-medium text-right">Avg. response time</th>
          </tr></thead>
          <tbody>
            {openByEmployee.map((e) => (
              <tr key={e.id} className="border-t border-border">
                <td className="py-1.5">{e.name}</td>
                <td className="py-1.5 text-right tabular-nums">{e.open}</td>
                <td className="py-1.5 text-right tabular-nums">{e.pct.toFixed(1)}%</td>
                <td className="py-1.5 text-right tabular-nums">{e.avgHrs ? `${e.avgHrs}h` : "0h"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ),
    },
    {
      id: "team-load-sla", kind: "panel", label: "Team load by SLA", description: "All complaints by SLA state — per-person totals on a shared scale.",
      icon: Users, colSpan: 2, title: "Team load by SLA",
      render: () => {
        const { rows, mean, upper, ticks } = teamLoadBySla;
        const pct = (v: number) => `${(v / upper) * 100}%`;
        const segs = [
          { key: "resolved", label: "Resolved", color: "var(--color-chart-3)", recede: true },
          { key: "onTrack", label: "On track", color: "var(--color-chart-1)", recede: true },
          { key: "nearing", label: "Nearing breach", color: "var(--color-chart-2)", recede: false },
          { key: "breached", label: "Breached", color: "var(--color-chart-4)", recede: false },
        ] as const;
        return (
          <div className="flex flex-col gap-3">
            <div className="text-[11px] text-muted-foreground -mt-1">All complaints by SLA state</div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
              {segs.map((s2) => (
                <span key={s2.key} className="inline-flex items-center gap-1.5">
                  <span className="inline-block h-2.5 w-2.5 rounded-[2px]" style={{ background: s2.color, opacity: s2.recede ? 0.55 : 1 }} />
                  {s2.label}
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
                  {ticks.map((t2) => (
                    <div key={t2} className="absolute top-0 bottom-0 border-l border-border/60" style={{ left: pct(t2) }} />
                  ))}
                  {mean > 0 && (
                    <div className="absolute top-0 bottom-0" style={{ left: pct(mean) }}>
                      <div className="h-full border-l border-dashed border-foreground/50" />
                      <div className="absolute -top-0.5 left-1 text-[10px] text-muted-foreground bg-surface px-1 rounded-sm whitespace-nowrap">
                        team avg
                      </div>
                    </div>
                  )}
                </div>
                <div className="relative flex flex-col gap-3 py-1">
                  {rows.map((r) => {
                    const tip = `Resolved: ${r.resolved} · On track: ${r.onTrack} · Nearing breach: ${r.nearing} · Breached: ${r.breached}`;
                    return (
                      <div key={r.id} className="h-6 relative" title={tip}>
                        <div className="absolute inset-y-0 left-0 flex overflow-hidden rounded-sm" style={{ width: pct(r.total) }}>
                          {segs.map((s2) => {
                            const v = (r as unknown as Record<string, number>)[s2.key];
                            if (!v) return null;
                            return (
                              <div
                                key={s2.key}
                                style={{
                                  width: `${(v / r.total) * 100}%`,
                                  background: s2.color,
                                  opacity: s2.recede ? 0.55 : 1,
                                }}
                              />
                            );
                          })}
                        </div>
                        <div
                          className="absolute top-1/2 -translate-y-1/2 text-[11px] font-semibold tabular-nums text-foreground"
                          style={{ left: `calc(${pct(r.total)} + 6px)` }}
                        >
                          {r.total}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="relative h-5 mt-1">
                  {ticks.map((t2) => (
                    <div key={t2} className="absolute -translate-x-1/2 text-[10px] text-muted-foreground tabular-nums" style={{ left: pct(t2) }}>
                      {t2}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      },
    },
    {
      id: "resolution-by-type", kind: "panel", label: "Resolution rate by complaint type", description: "Closure, on-time % and avg. resolution per type.",
      icon: ThumbsUp, colSpan: 2, title: "Resolution rate by complaint type",
      render: () => (
        <table className="w-full text-[12px]">
          <thead><tr className="text-left text-muted-foreground">
            <th className="py-1 font-medium">Complaint sub-type</th>
            <th className="py-1 font-medium text-right">Closure</th>
            {canCustomize && <th className="py-1 font-medium text-right">On-time</th>}
            <th className="py-1 font-medium text-right">Avg. resolution</th>
          </tr></thead>
          <tbody>
            {resolutionByType.map((r) => (
              <tr key={r.name} className="border-t border-border">
                <td className="py-1.5">{r.name}</td>
                <td className="py-1.5 text-right tabular-nums">{r.closure.toFixed(1)}%</td>
                {canCustomize && <td className="py-1.5 text-right tabular-nums">{r.onTime.toFixed(1)}%</td>}
                <td className="py-1.5 text-right tabular-nums">{r.avgHrs ? `${r.avgHrs}h` : "0h"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ),
    },
    {
      id: "stage-timings", kind: "panel", label: "Average time per workflow stage", description: "Mean dwell time per PGR state — exposes bottleneck stage.",
      icon: Clock, colSpan: 2, title: "Average time per workflow stage",
      render: () => (
        <table className="w-full text-[12px]">
          <thead><tr className="text-left text-muted-foreground">
            <th className="py-1 font-medium">Stage</th>
            <th className="py-1 font-medium text-right">Avg dwell</th>
            <th className="py-1 font-medium text-right">Median dwell</th>
            <th className="py-1 font-medium text-right">Samples</th>
          </tr></thead>
          <tbody>
            {tu.stageTimings.map((st) => (
              <tr key={st.key} className={cn("border-t border-border", st.key === tu.bottleneckKey && "bg-status-breach-bg/40")}>
                <td className="py-1.5">{st.label}{st.key === tu.bottleneckKey && <span className="ml-2 text-[10px] uppercase text-status-breach">Bottleneck</span>}</td>
                <td className="py-1.5 text-right tabular-nums">{st.avg}h</td>
                <td className="py-1.5 text-right tabular-nums">{st.median}h</td>
                <td className="py-1.5 text-right tabular-nums">{st.n}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ),
    },
    {
      id: "type-status-crosstab", kind: "panel", label: "Type & sub-type by status", description: "Cross-tab of complaint type/sub-type rows × status columns.",
      icon: BarChart3, colSpan: 3, title: "Type & sub-type by status",
      render: () => {
        const STATUS_SHORT: Record<string, string> = {
          OPEN: "Pending Assignment", ASSIGNED: "Assigned", IN_PROGRESS: "Pending Reassign",
          REOPENED: "Pending Reassign", RESOLVED: "Resolved", CLOSED: "Closed", REJECTED: "Rejected",
        };
        return (
          <table className="w-full text-[12px]">
            <thead><tr className="text-left text-muted-foreground">
              <th className="py-1 font-medium">Type / Sub-type</th>
              {tu.typeStatusCrosstab.cols.map((c) => (
                <th key={c} className="py-1 font-medium text-right">{STATUS_SHORT[c]}</th>
              ))}
              <th className="py-1 font-medium text-right">Total</th>
            </tr></thead>
            <tbody>
              {tu.typeStatusCrosstab.rows.map((row) => (
                <tr key={`${row.type}-${row.subtype}`} className="border-t border-border">
                  <td className="py-1.5">
                    <div className="font-medium text-foreground">{row.type}</div>
                    <div className="text-[11px] text-muted-foreground">{row.subtype}</div>
                  </td>
                  {tu.typeStatusCrosstab.cols.map((c) => (
                    <td key={c} className="py-1.5 text-right tabular-nums">{row.counts[c] ?? 0}</td>
                  ))}
                  <td className="py-1.5 text-right tabular-nums font-semibold">{row.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        );
      },
    },
    {
      id: "by-age", kind: "panel", label: "Complaints by age", description: "Distribution of complaints by age buckets.",
      icon: Clock, colSpan: 1, title: "Complaints by age",
      render: () => (
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={tu.ageBuckets} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
              <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
              <Tooltip contentStyle={{ fontSize: 12 }} />
              <Bar dataKey="value" fill="var(--color-chart-2)" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ),
    },
    {
      id: "over-time", kind: "panel", label: "Complaints logged over time", description: "Time-series with daily / weekly / monthly toggle.",
      icon: LineChartIcon, colSpan: 3, title: "Complaints logged over time",
      action: (
        <div className="inline-flex rounded-sm border border-border overflow-hidden text-[11px]">
          {(["daily", "weekly", "monthly"] as const).map((g) => (
            <button key={g} onClick={() => setOverTimeGran(g)}
              className={cn("px-2 py-1 capitalize", overTimeGran === g ? "bg-primary text-primary-foreground" : "bg-surface text-muted-foreground hover:text-foreground")}>
              {g}
            </button>
          ))}
        </div>
      ),
      render: () => (
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={overTimeData} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
              <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
              <Tooltip contentStyle={{ fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="filed" stroke="var(--color-chart-1)" strokeWidth={2} dot={{ r: 3 }} name="Logged" />
              <Line type="monotone" dataKey="resolved" stroke="var(--color-chart-3)" strokeWidth={2} dot={{ r: 3 }} name="Resolved" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ),
    },
  ], [s, dept, wards, trend, recent, wardsMax, geoView, geoData, filteredComplaints, statusView, statusBuckets, typeView, typeBuckets, typeExpanded, slaView, slaBuckets, channelBuckets, openBreakdown, hourBuckets, dowBuckets, trendingTypes, trendingLocations, openByEmployee, resolutionByType, overTimeGran, overTimeData, avgResolutionHrs, firstResponseHrs, resolutionRate, canCustomize, tu]);

  const kpiById = useMemo(() => {
    const m = new Map<string, KpiDef>();
    KPI_REGISTRY.forEach((k) => m.set(k.id, k));
    return m;
  }, [KPI_REGISTRY]);

  // Default visible set: stats first, then key charts. Resets each mount.
  const defaultIds = useMemo(
    () => canCustomize
      ? [
        "resolution-rate", "breached-sla", "resolved",
        "reopen", "csat",
        "trending-complaints", "resolution-by-type", "wards", "stage-timings",
        "open-by-employee", "team-load-sla", "trending-locations",
        "by-age", "by-channel", "by-sla",
        "time-of-day", "day-of-week", "over-time", "sla",
      ]
      : [
        "total", "open", "resolved", "resolution-rate", "avg-resolution", "first-response",
        "trend", "wards", "dept", "geo-map", "complaint-map", "by-status", "by-type", "by-sla",
        "by-channel", "open-breakdown", "time-of-day", "day-of-week",
        "trending-complaints", "trending-locations", "open-by-employee", "resolution-by-type",
        "over-time", "recent", "sla",
      ],
    [canCustomize],
  );

  const [visibleIds, setVisibleIds] = useState<string[]>(defaultIds);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);

  // Role is hydrated from storage AFTER first render, so re-sync the visible
  // widget set whenever the role-specific defaults change.
  useEffect(() => {
    setVisibleIds(defaultIds);
  }, [defaultIds]);

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

  // Per-tile resize. Width snaps to grid columns (1..3). Height snaps to row steps (1..3).
  const gridRef = useRef<HTMLDivElement>(null);
  const [sizes, setSizes] = useState<Record<string, { colSpan?: 1 | 2 | 3; rowSpan?: 1 | 2 | 3 }>>({});
  const [resizingId, setResizingId] = useState<string | null>(null);
  const [resizingAxis, setResizingAxis] = useState<"x" | "y" | "xy" | null>(null);
  // Disable native drag while pointer is on a resize handle.
  const [handleHoverId, setHandleHoverId] = useState<string | null>(null);

  const ROW_STEP = 280; // px per rowSpan unit

  const startResize = (
    id: string,
    _kind: KpiKind,
    axis: "x" | "y" | "xy",
    e: React.PointerEvent<HTMLDivElement>,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    const handleEl = e.currentTarget;
    handleEl.setPointerCapture(e.pointerId);
    setResizingId(id);
    setResizingAxis(axis);

    const grid = gridRef.current;
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
          const widthFromLeft = ev.clientX - tileRect.left;
          next.colSpan = Math.max(1, Math.min(maxSpan, Math.round(widthFromLeft / colWidth))) as 1 | 2 | 3;
        }
        if (axis === "y" || axis === "xy") {
          const heightFromTop = ev.clientY - tileRect.top;
          next.rowSpan = Math.max(1, Math.min(3, Math.round(heightFromTop / ROW_STEP))) as 1 | 2 | 3;
        }
        return { ...p, [id]: next };
      });
    };
    void grid;

    const onUp = (ev: PointerEvent) => {
      handleEl.releasePointerCapture?.(ev.pointerId);
      setResizingId(null);
      setResizingAxis(null);
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
      <div className="border-b border-border bg-surface px-4 lg:px-6 py-2.5 flex flex-wrap items-center gap-x-3 gap-y-2">
        <div className="min-w-0 flex items-baseline gap-2">
          <h1 className="text-[15px] font-semibold leading-tight text-foreground truncate">{t("CS_DASHBOARD_TITLE")}</h1>
          <span className="hidden sm:inline text-[11px] text-muted-foreground truncate">{jurisdiction.name} · Last 7 days</span>
        </div>
        <div className="relative ml-auto w-full sm:w-56 md:w-64 order-3 sm:order-none">
          <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search complaints, wards, citizens…"
            aria-label="Search dashboard"
            className="h-8 w-full rounded-sm border border-border bg-background pl-7 pr-7 text-[12px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              aria-label="Clear search"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 inline-flex h-5 w-5 items-center justify-center rounded-sm text-muted-foreground hover:bg-muted"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          {canCustomize && (
            <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
              <PopoverTrigger asChild>
                <button className="inline-flex h-8 items-center gap-1.5 rounded-sm border border-dashed border-border bg-surface px-2.5 text-[12px] font-medium text-foreground hover:border-primary hover:text-primary">
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
          <ActionButton variant="secondary" icon={<Download className="h-3.5 w-3.5" />}>{t("COMMON_EXPORT")}</ActionButton>
          <Link to="/complaints/new">
            <ActionButton permission="PGR_COMPLAINT_CREATE" variant="primary" icon={<Plus className="h-3.5 w-3.5" />}>
              {t("ACTION_REGISTER")}
            </ActionButton>
          </Link>
        </div>
      </div>

      <div className="p-4 lg:p-6 space-y-4 lg:space-y-5">
        <DemoSetupBanner />
        <TestUserPrompt />
        {canCustomize && (
          <div className="rounded border border-border bg-surface px-3 py-2 flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground">
              <Filter className="h-3.5 w-3.5" /> Filters
            </div>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              aria-label="From date"
              className="h-7 rounded-sm border border-border bg-background px-2 text-[12px] text-foreground"
            />
            <span className="text-[11px] text-muted-foreground">→</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              aria-label="To date"
              className="h-7 rounded-sm border border-border bg-background px-2 text-[12px] text-foreground"
            />
            <select
              value={geoFilter}
              onChange={(e) => setGeoFilter(e.target.value)}
              aria-label="Ward"
              className="h-7 rounded-sm border border-border bg-background px-2 text-[12px] text-foreground min-w-[120px]"
            >
              <option value="">All wards</option>
              {allWards.map((w) => <option key={w} value={w}>{w}</option>)}
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              aria-label="Complaint type"
              className="h-7 rounded-sm border border-border bg-background px-2 text-[12px] text-foreground min-w-[150px]"
            >
              <option value="">All types</option>
              {COMPLAINT_TYPES.filter((c) => c.active).map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
            </select>
            {(fromDate || toDate || geoFilter || typeFilter) && (
              <button
                onClick={() => { setFromDate(""); setToDate(""); setGeoFilter(""); setTypeFilter(""); }}
                className="h-7 rounded-sm border border-border bg-surface px-2.5 text-[12px] font-medium text-muted-foreground hover:text-foreground"
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
            const effectiveRowSpan: 1 | 2 | 3 = userSize?.rowSpan ?? 1;
            const spanClass =
              gridCols === 6
                ? effectiveSpan === 3
                  ? "col-span-2 md:col-span-3 xl:col-span-3"
                  : effectiveSpan === 2
                    ? "col-span-2 md:col-span-2"
                    : ""
                : colSpanClass(effectiveSpan);
            const isResizing = resizingId === id;
            const panelContentHeight = ROW_STEP * effectiveRowSpan;
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

                {/* Right edge — horizontal resize */}
                <div
                  onPointerDown={(e) => startResize(id, k.kind, "x", e)}
                  onPointerEnter={() => setHandleHoverId(id)}
                  onPointerLeave={() => { if (resizingId !== id) setHandleHoverId(null); }}
                  onDoubleClick={(e) => { e.stopPropagation(); resetSize(id); }}
                  title="Drag to resize width · double-click to reset"
                  className={cn(
                    "absolute top-2 bottom-4 -right-0.5 w-2 z-20 cursor-ew-resize",
                    "opacity-0 group-hover:opacity-60 hover:opacity-100 hover:bg-primary/10 transition-opacity",
                    isResizing && resizingAxis === "x" && "opacity-100 bg-primary/10",
                  )}
                />

                {/* Bottom edge — vertical resize (panels only) */}
                {k.kind === "panel" && (
                  <div
                    onPointerDown={(e) => startResize(id, k.kind, "y", e)}
                    onPointerEnter={() => setHandleHoverId(id)}
                    onPointerLeave={() => { if (resizingId !== id) setHandleHoverId(null); }}
                    onDoubleClick={(e) => { e.stopPropagation(); resetSize(id); }}
                    title="Drag to resize height · double-click to reset"
                    className={cn(
                      "absolute left-2 right-4 -bottom-0.5 h-2 z-20 cursor-ns-resize",
                      "opacity-0 group-hover:opacity-60 hover:opacity-100 hover:bg-primary/10 transition-opacity",
                      isResizing && resizingAxis === "y" && "opacity-100 bg-primary/10",
                    )}
                  />
                )}

                {/* Bottom-right corner — both axes */}
                <div
                  onPointerDown={(e) => startResize(id, k.kind, k.kind === "panel" ? "xy" : "x", e)}
                  onPointerEnter={() => setHandleHoverId(id)}
                  onPointerLeave={() => { if (resizingId !== id) setHandleHoverId(null); }}
                  onDoubleClick={(e) => { e.stopPropagation(); resetSize(id); }}
                  title="Drag to resize · double-click to reset"
                  className={cn(
                    "absolute -bottom-0.5 -right-0.5 h-5 w-5 z-30 flex items-end justify-end p-0.5 rounded-bl-sm",
                    k.kind === "panel" ? "cursor-nwse-resize" : "cursor-ew-resize",
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

function ViewToggle({ value, onChange }: { value: "table" | "bar"; onChange: (v: "table" | "bar") => void }) {
  return (
    <div className="inline-flex rounded-sm border border-border overflow-hidden text-[11px]">
      {(["table", "bar"] as const).map((v) => (
        <button key={v} onClick={() => onChange(v)}
          className={cn("px-2 py-1 capitalize", value === v ? "bg-primary text-primary-foreground" : "bg-surface text-muted-foreground hover:text-foreground")}>
          {v}
        </button>
      ))}
    </div>
  );
}

function DemoSetupBanner() {

  const active =
    typeof window !== "undefined" &&
    window.localStorage.getItem("demoSetupActive") === "1";
  if (!active) return null;
  return (
    <div className="flex items-center gap-2 rounded-sm border border-amber-300/60 bg-amber-50 px-3 py-2 text-[12.5px] text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-100">
      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
      <span>Demo setup active. Complete setup before production use.</span>
    </div>
  );
}

const TEST_USER_PROMPT_KEY = "pgr.dashboard.testUserPromptDismissed";

function TestUserPrompt() {
  const { role, setRole } = useRbac();
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(TEST_USER_PROMPT_KEY) === "1";
  });

  if (role === "TEST_USER" || dismissed) return null;

  const onSwitch = () => {
    setRole("TEST_USER");
  };

  const onDismiss = () => {
    setDismissed(true);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(TEST_USER_PROMPT_KEY, "1");
    }
  };

  return (
    <div className="flex items-start gap-3 rounded-sm border border-primary/20 bg-primary/5 px-3 py-2.5 text-[12.5px]">
      <div className="mt-0.5 shrink-0">
        <Filter className="h-3.5 w-3.5 text-primary" />
      </div>
      <div className="flex-1">
        <p className="text-foreground">
          Want to explore the full dashboard experience? Switch to{" "}
          <span className="font-semibold">Test User</span> to unlock filters, drag-and-drop layout, resize widgets, and add custom KPIs.
        </p>
        <div className="mt-2 flex items-center gap-2">
          <button
            onClick={onSwitch}
            className="inline-flex items-center gap-1.5 rounded-sm bg-primary px-2.5 py-1 text-[11px] font-medium text-primary-foreground hover:bg-primary/90"
          >
            Switch to Test User
          </button>
          <button
            onClick={onDismiss}
            className="inline-flex items-center gap-1 rounded-sm border border-border bg-background px-2.5 py-1 text-[11px] font-medium text-muted-foreground hover:text-foreground"
          >
            Dismiss
          </button>
        </div>
      </div>
      <button
        onClick={onDismiss}
        className="shrink-0 rounded-sm p-1 text-muted-foreground hover:text-foreground"
        aria-label="Dismiss"
        title="Dismiss"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
