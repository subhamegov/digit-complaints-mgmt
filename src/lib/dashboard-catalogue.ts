/**
 * Dashboard catalogue — single source of truth for the Account Administrator
 * "Dashboards" section. Both the catalogue table, the read-only KPI list and
 * the read-only layout preview are derived from this configuration so the
 * preview cannot drift from the published dashboard definition.
 *
 * This module is descriptive only: it contains no editing affordances.
 */

export type DashboardStatus = "ACTIVE" | "INACTIVE";

export type PreviewBlockKind = "stat" | "chart" | "table" | "map";

export type PreviewBlock = {
  /** Label shown inside the read-only preview region. */
  label: string;
  kind: PreviewBlockKind;
  /** Column span within a 12-column preview grid. */
  span: number;
};

export type DashboardDefinition = {
  id: string;
  name: string;
  purpose: string;
  /** Human-readable audience for the dashboard. */
  role: string;
  status: DashboardStatus;
  lastPublished: string;
  /** Read-only KPI composition. */
  kpis: string[];
  /** Read-only representation of how the KPIs are arranged. */
  layout: PreviewBlock[];
  /** Only the Citizen Dashboard is publicly reachable. */
  publicAccess?: { url: string };
};

export const PUBLIC_DASHBOARD_URL =
  "https://digit-complaints-mgmt.lovable.app/public/dashboard";

export const DASHBOARD_CATALOGUE: DashboardDefinition[] = [
  {
    id: "resolver",
    name: "Resolver Dashboard",
    purpose:
      "Operational view of complaints assigned to an individual resolver",
    role: "Field Employee",
    status: "ACTIVE",
    lastPublished: "5 Aug 2026",
    kpis: [
      "Complaints assigned",
      "Complaints resolved",
      "Due today",
      "SLA breached",
      "Average resolution time",
    ],
    layout: [
      { label: "Assigned complaints", kind: "stat", span: 3 },
      { label: "Due today", kind: "stat", span: 3 },
      { label: "SLA breached", kind: "stat", span: 3 },
      { label: "Resolved", kind: "stat", span: 3 },
      { label: "My workload by status", kind: "chart", span: 6 },
      { label: "Complaints approaching SLA", kind: "table", span: 6 },
      { label: "Recent complaint activity", kind: "table", span: 12 },
    ],
  },
  {
    id: "resolver-supervisor",
    name: "Resolver Supervisor Dashboard",
    purpose:
      "Team workload, SLA performance and complaints requiring intervention",
    role: "Department Head",
    status: "ACTIVE",
    lastPublished: "5 Aug 2026",
    kpis: [
      "Active complaints",
      "Complaints resolved within SLA",
      "SLA breached",
      "Escalated complaints",
      "Unassigned complaints",
      "Average resolution time",
      "Workload by resolver",
    ],
    layout: [
      { label: "Active complaints", kind: "stat", span: 3 },
      { label: "Resolved within SLA", kind: "stat", span: 3 },
      { label: "SLA breached", kind: "stat", span: 3 },
      { label: "Escalated complaints", kind: "stat", span: 3 },
      { label: "Unassigned complaints", kind: "stat", span: 3 },
      { label: "Average resolution time", kind: "stat", span: 3 },
      { label: "Workload by resolver", kind: "chart", span: 6 },
      { label: "Complaints requiring intervention", kind: "table", span: 12 },
    ],
  },
  {
    id: "planner",
    name: "Planner Dashboard",
    purpose:
      "Service trends, complaint volumes and geographic patterns for planning",
    role: "Planner",
    status: "ACTIVE",
    lastPublished: "2 Aug 2026",
    kpis: [
      "Complaint volume",
      "Complaint trend",
      "Complaints by service",
      "Complaints by locality",
      "SLA performance",
      "Recurring complaint categories",
      "Geographic hotspots",
    ],
    layout: [
      { label: "Complaint volume", kind: "stat", span: 4 },
      { label: "SLA performance", kind: "stat", span: 4 },
      { label: "Recurring complaint categories", kind: "stat", span: 4 },
      { label: "Complaint trend", kind: "chart", span: 8 },
      { label: "Complaints by service", kind: "chart", span: 4 },
      { label: "Geographic hotspots", kind: "map", span: 7 },
      { label: "Complaints by locality", kind: "table", span: 5 },
    ],
  },
  {
    id: "citizen",
    name: "Citizen Dashboard",
    purpose:
      "Public view of complaint volumes and government response performance",
    role: "Public",
    status: "ACTIVE",
    lastPublished: "1 Aug 2026",
    kpis: [
      "Complaints received",
      "Complaints resolved",
      "Resolution rate",
      "SLA compliance",
      "Average resolution time",
      "Complaints by service",
      "Complaint trends",
    ],
    layout: [
      { label: "Complaints received", kind: "stat", span: 3 },
      { label: "Complaints resolved", kind: "stat", span: 3 },
      { label: "Resolution rate", kind: "stat", span: 3 },
      { label: "SLA compliance", kind: "stat", span: 3 },
      { label: "Average resolution time", kind: "stat", span: 4 },
      { label: "Complaints by service", kind: "chart", span: 8 },
      { label: "Complaint trends", kind: "chart", span: 12 },
    ],
    publicAccess: { url: PUBLIC_DASHBOARD_URL },
  },
];

export function getDashboard(id: string): DashboardDefinition | undefined {
  return DASHBOARD_CATALOGUE.find((d) => d.id === id);
}

/* ------------------------------------------------------------------ */
/* Citizen dashboard publication state (prototype persistence)         */
/* ------------------------------------------------------------------ */

const PUBLIC_STATE_KEY = "pgr.citizenDashboard.publicAccess.v1";

export function readPublicAccess(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const raw = window.sessionStorage.getItem(PUBLIC_STATE_KEY);
    return raw === null ? true : raw === "true";
  } catch {
    return true;
  }
}

export function writePublicAccess(enabled: boolean) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(PUBLIC_STATE_KEY, String(enabled));
  } catch {
    /* ignore */
  }
}
