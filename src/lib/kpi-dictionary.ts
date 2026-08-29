/**
 * Data Dictionary - source of truth for KPI metadata.
 *
 * Dashboards reference these records by id; KPI metadata is never duplicated
 * inside a dashboard definition. Records are read-only in the console.
 */

export type KpiDefinition = {
  id: string;
  name: string;
  /** Short "what it measures" line reused by dashboard KPI tables. */
  measures: string;
  /** Source service / module shown in dashboard KPI tables. */
  source: string;
  refresh: string;
  businessDefinition?: string;
  calculation?: string;
  numerator?: string;
  denominator?: string;
  unit?: string;
  sourceFields?: string[];
  dimensions?: string[];
  filters?: string[];
  owner?: string;
  lastUpdated?: string;
};

export const KPI_DICTIONARY: KpiDefinition[] = [
  {
    id: "complaints-received",
    name: "Complaints received",
    measures: "Complaints registered during the selected period",
    source: "Complaints",
    refresh: "Near real time",
    businessDefinition:
      "Count of complaints created in the Public Grievance Redressal service within the selected period, across all channels.",
    calculation: "COUNT(complaint) WHERE created_at BETWEEN period_start AND period_end",
    unit: "Complaints",
    sourceFields: ["complaint.id", "complaint.created_at", "complaint.channel"],
    dimensions: ["Department", "Service", "Locality", "Channel"],
    filters: ["Date range", "Tenant", "Jurisdiction", "Service"],
    owner: "PGR Service Owner",
    lastUpdated: "1 Aug 2026",
  },
  {
    id: "complaints-resolved",
    name: "Complaints resolved",
    measures: "Complaints moved to Resolved or Closed in the period",
    source: "Complaints + Workflow",
    refresh: "Near real time",
    businessDefinition:
      "Count of complaints whose workflow state reached Resolved or Closed during the selected period.",
    calculation:
      "COUNT(complaint) WHERE status IN ('Resolved','Closed') AND resolved_at BETWEEN period_start AND period_end",
    unit: "Complaints",
    sourceFields: ["complaint.id", "complaint.status", "workflow.resolved_at"],
    dimensions: ["Department", "Service", "Resolver", "Locality"],
    filters: ["Date range", "Department", "Service"],
    owner: "PGR Service Owner",
    lastUpdated: "1 Aug 2026",
  },
  {
    id: "resolution-rate",
    name: "Resolution rate",
    measures: "Share of received complaints that were resolved",
    source: "Complaints",
    refresh: "Near real time",
    businessDefinition:
      "Proportion of complaints received in the period that reached a Resolved or Closed state.",
    calculation: "complaints_resolved / complaints_received",
    numerator: "Complaints resolved in period",
    denominator: "Complaints received in period",
    unit: "Percentage",
    sourceFields: ["complaint.status", "complaint.created_at", "workflow.resolved_at"],
    dimensions: ["Department", "Service", "Locality"],
    filters: ["Date range", "Department", "Service"],
    owner: "PGR Service Owner",
    lastUpdated: "1 Aug 2026",
  },
  {
    id: "sla-compliance",
    name: "SLA compliance",
    measures:
      "Share of resolved complaints completed within the agreed SLA",
    source: "Complaints + SLA",
    refresh: "Near real time",
    businessDefinition:
      "Proportion of resolved complaints whose resolution timestamp fell on or before the SLA due date configured for the complaint type.",
    calculation: "resolved_within_sla / total_resolved",
    numerator: "Complaints resolved on or before SLA due date",
    denominator: "Complaints resolved in period",
    unit: "Percentage",
    sourceFields: ["complaint.status", "workflow.resolved_at", "sla.due_at"],
    dimensions: ["Department", "Service", "Resolver", "Locality"],
    filters: ["Date range", "Department", "Service", "Resolver"],
    owner: "Service Performance Team",
    lastUpdated: "3 Aug 2026",
  },
  {
    id: "sla-breached",
    name: "SLA breached",
    measures: "Open or resolved complaints that passed their SLA due date",
    source: "Complaints + SLA",
    refresh: "Near real time",
    businessDefinition:
      "Complaints whose SLA due date has passed without resolution, or which were resolved after the SLA due date.",
    calculation:
      "COUNT(complaint) WHERE sla.due_at < NOW() AND (resolved_at IS NULL OR resolved_at > sla.due_at)",
    unit: "Complaints",
    sourceFields: ["sla.due_at", "workflow.resolved_at", "complaint.status"],
    dimensions: ["Department", "Resolver", "Service", "Locality"],
    filters: ["Department", "Resolver", "Service"],
    owner: "Service Performance Team",
    lastUpdated: "3 Aug 2026",
  },
  {
    id: "avg-resolution-time",
    name: "Average resolution time",
    measures:
      "Average time between complaint registration and resolution",
    source: "Complaints",
    refresh: "Near real time",
    businessDefinition:
      "Mean elapsed time from complaint creation to the first Resolved state, expressed in hours.",
    calculation: "SUM(resolved_at - created_at) / COUNT(resolved complaints)",
    numerator: "Total elapsed resolution time",
    denominator: "Complaints resolved in period",
    unit: "Hours",
    sourceFields: ["complaint.created_at", "workflow.resolved_at"],
    dimensions: ["Department", "Service", "Sub-type", "Resolver"],
    filters: ["Date range", "Department", "Service"],
    owner: "PGR Service Owner",
    lastUpdated: "1 Aug 2026",
  },
  {
    id: "assigned-complaints",
    name: "Assigned complaints",
    measures: "Open complaints currently assigned to the signed-in resolver",
    source: "Complaints + Workflow",
    refresh: "Near real time",
    businessDefinition:
      "Complaints in an open workflow state whose current assignee is the signed-in employee.",
    calculation:
      "COUNT(complaint) WHERE assignee = current_user AND status NOT IN ('Resolved','Closed','Rejected')",
    unit: "Complaints",
    sourceFields: ["workflow.assignee", "complaint.status"],
    dimensions: ["Service", "Locality", "Status"],
    filters: ["Status", "Service"],
    owner: "PGR Service Owner",
    lastUpdated: "5 Aug 2026",
  },
  {
    id: "due-today",
    name: "Due today",
    measures: "Assigned complaints whose SLA falls due within the day",
    source: "Complaints + SLA",
    refresh: "Near real time",
    businessDefinition:
      "Open complaints assigned to the signed-in resolver with an SLA due date on the current calendar day.",
    calculation: "COUNT(complaint) WHERE assignee = current_user AND DATE(sla.due_at) = CURRENT_DATE",
    unit: "Complaints",
    sourceFields: ["workflow.assignee", "sla.due_at"],
    dimensions: ["Service", "Locality"],
    filters: ["Service"],
    owner: "Service Performance Team",
    lastUpdated: "5 Aug 2026",
  },
  {
    id: "workload-by-status",
    name: "My workload by status",
    measures: "Distribution of assigned complaints across workflow statuses",
    source: "Workflow",
    refresh: "Near real time",
    businessDefinition:
      "Count of complaints assigned to the signed-in resolver grouped by current workflow status.",
    calculation: "COUNT(complaint) GROUP BY status WHERE assignee = current_user",
    unit: "Complaints",
    sourceFields: ["workflow.assignee", "complaint.status"],
    dimensions: ["Status"],
    filters: ["Date range"],
    owner: "PGR Service Owner",
    lastUpdated: "5 Aug 2026",
  },
  {
    id: "approaching-sla",
    name: "Complaints approaching SLA",
    measures: "Open complaints within 24 hours of their SLA due date",
    source: "Complaints + SLA",
    refresh: "Near real time",
    businessDefinition:
      "Open complaints whose SLA due date is in the future but within the next 24 hours.",
    calculation: "COUNT(complaint) WHERE sla.due_at BETWEEN NOW() AND NOW() + INTERVAL '24 hours'",
    unit: "Complaints",
    sourceFields: ["sla.due_at", "complaint.status"],
    dimensions: ["Department", "Resolver", "Service"],
    filters: ["Department", "Resolver"],
    owner: "Service Performance Team",
    lastUpdated: "3 Aug 2026",
  },
  {
    id: "recent-activity",
    name: "Recent complaint activity",
    measures: "Latest workflow actions on the resolver's complaints",
    source: "Workflow",
    refresh: "Near real time",
  },
  {
    id: "active-complaints",
    name: "Active complaints",
    measures: "Complaints currently open across the team",
    source: "Complaints",
    refresh: "Near real time",
    businessDefinition:
      "Complaints in any non-terminal workflow state within the selected department or jurisdiction.",
    calculation: "COUNT(complaint) WHERE status NOT IN ('Resolved','Closed','Rejected')",
    unit: "Complaints",
    sourceFields: ["complaint.status", "complaint.department"],
    dimensions: ["Department", "Resolver", "Status", "Locality"],
    filters: ["Department", "Jurisdiction"],
    owner: "PGR Service Owner",
    lastUpdated: "5 Aug 2026",
  },
  {
    id: "escalated-complaints",
    name: "Escalated complaints",
    measures: "Complaints escalated to a supervisory level",
    source: "Workflow",
    refresh: "Near real time",
    businessDefinition:
      "Complaints whose workflow escalated beyond the originally assigned resolver level.",
    calculation: "COUNT(complaint) WHERE escalation_level > 0 AND status NOT IN ('Resolved','Closed')",
    unit: "Complaints",
    sourceFields: ["workflow.escalation_level", "complaint.status"],
    dimensions: ["Department", "Resolver", "Service"],
    filters: ["Department", "Escalation level"],
    owner: "Service Performance Team",
    lastUpdated: "3 Aug 2026",
  },
  {
    id: "complaints-by-status",
    name: "Complaints by status",
    measures: "Complaint counts grouped by workflow status",
    source: "Workflow",
    refresh: "Near real time",
    businessDefinition:
      "Distribution of complaints across Pending Assignment, Assigned, Pending Reassignment, Resolved, Closed and Rejected.",
    calculation: "COUNT(complaint) GROUP BY status",
    unit: "Complaints",
    sourceFields: ["complaint.status"],
    dimensions: ["Status", "Department"],
    filters: ["Date range", "Department"],
    owner: "PGR Service Owner",
    lastUpdated: "5 Aug 2026",
  },
  {
    id: "workload-by-resolver",
    name: "Workload by resolver",
    measures: "Open complaints per resolver in the department",
    source: "Complaints + HRMS",
    refresh: "Near real time",
    businessDefinition:
      "Count of open complaints grouped by current assignee, used to compare load across the team.",
    calculation: "COUNT(open complaint) GROUP BY assignee",
    unit: "Complaints",
    sourceFields: ["workflow.assignee", "employee.name", "complaint.status"],
    dimensions: ["Resolver", "Department"],
    filters: ["Department", "Jurisdiction"],
    owner: "Department Head",
    lastUpdated: "5 Aug 2026",
  },
  {
    id: "intervention-required",
    name: "Complaints requiring intervention",
    measures: "Breached, escalated or repeatedly reassigned complaints",
    source: "Complaints + Workflow",
    refresh: "Near real time",
  },
  {
    id: "complaint-volume",
    name: "Complaint volume",
    measures: "Total complaints logged over the selected period",
    source: "Complaints",
    refresh: "Daily",
    businessDefinition:
      "Volume of complaints registered over the analysis period, used for demand planning.",
    calculation: "COUNT(complaint) GROUP BY period_bucket",
    unit: "Complaints",
    sourceFields: ["complaint.created_at"],
    dimensions: ["Month", "Service", "Locality"],
    filters: ["Date range", "Service", "Locality"],
    owner: "Planning Team",
    lastUpdated: "2 Aug 2026",
  },
  {
    id: "complaint-trend",
    name: "Complaint trend over time",
    measures: "Complaints created and resolved per month",
    source: "Complaints",
    refresh: "Daily",
    businessDefinition:
      "Monthly time series of complaints created versus resolved, with the open backlog at month end.",
    calculation: "COUNT(created) and COUNT(resolved) GROUP BY month",
    unit: "Complaints",
    sourceFields: ["complaint.created_at", "workflow.resolved_at"],
    dimensions: ["Month", "Service", "Department"],
    filters: ["Date range", "Service"],
    owner: "Planning Team",
    lastUpdated: "2 Aug 2026",
  },
  {
    id: "complaints-by-service",
    name: "Complaints by service",
    measures: "Complaint counts grouped by service or complaint type",
    source: "Complaints + Master data",
    refresh: "Daily",
    businessDefinition:
      "Distribution of complaints across configured complaint types and sub-types.",
    calculation: "COUNT(complaint) GROUP BY service_code",
    unit: "Complaints",
    sourceFields: ["complaint.service_code", "mdms.service_name"],
    dimensions: ["Service", "Sub-type", "Department"],
    filters: ["Date range", "Department"],
    owner: "Planning Team",
    lastUpdated: "2 Aug 2026",
  },
  {
    id: "complaints-by-locality",
    name: "Complaints by locality",
    measures: "Complaint counts grouped by ward or locality",
    source: "Complaints + Boundary",
    refresh: "Daily",
    businessDefinition:
      "Distribution of complaints across the boundary hierarchy (district, sub-district, ward).",
    calculation: "COUNT(complaint) GROUP BY boundary_code",
    unit: "Complaints",
    sourceFields: ["complaint.boundary_code", "boundary.name"],
    dimensions: ["District", "Sub-district", "Ward"],
    filters: ["Jurisdiction", "Date range"],
    owner: "Planning Team",
    lastUpdated: "2 Aug 2026",
  },
  {
    id: "geographic-hotspots",
    name: "Geographic hotspot map",
    measures: "Localities with the highest complaint density",
    source: "Complaints + Boundary",
    refresh: "Daily",
    businessDefinition:
      "Map of complaint density by ward, highlighting boundaries above the city-wide average.",
    calculation: "COUNT(complaint) per ward, normalised against the city average",
    unit: "Complaints per ward",
    sourceFields: ["complaint.boundary_code", "boundary.geometry"],
    dimensions: ["District", "Sub-district", "Ward"],
    filters: ["Jurisdiction", "Service", "Date range"],
    owner: "Planning Team",
    lastUpdated: "2 Aug 2026",
  },
  {
    id: "recurring-complaints",
    name: "Recurring complaints",
    measures: "Repeat complaints for the same issue and locality",
    source: "Complaints",
    refresh: "Daily",
  },
  {
    id: "recurring-categories",
    name: "Recurring issue categories",
    measures: "Complaint categories that repeat most often",
    source: "Complaints + Master data",
    refresh: "Daily",
  },
  {
    id: "resolution-performance",
    name: "Resolution performance",
    measures: "Resolution outcomes and timeliness over the period",
    source: "Complaints + SLA",
    refresh: "Daily",
  },
  {
    id: "geographic-distribution",
    name: "Geographic distribution",
    measures: "Where complaints are being reported across the city",
    source: "Complaints + Boundary",
    refresh: "Daily",
  },
];

export function getKpi(id: string): KpiDefinition | undefined {
  return KPI_DICTIONARY.find((k) => k.id === id);
}

/**
 * KPI composition per dashboard, expressed as references to the Data
 * Dictionary. `null` marks a measure with no dictionary mapping yet.
 */
export const DASHBOARD_KPI_REFS: Record<string, Array<string | { id: string; name: string }>> = {
  resolver: [
    "assigned-complaints",
    "due-today",
    "sla-breached",
    "complaints-resolved",
    "workload-by-status",
    "approaching-sla",
    "recent-activity",
  ],
  "resolver-supervisor": [
    "active-complaints",
    "sla-compliance",
    "sla-breached",
    "escalated-complaints",
    "complaints-by-status",
    "workload-by-resolver",
    "intervention-required",
    { id: "reassignment-churn", name: "Reassignment churn" },
  ],
  planner: [
    "complaint-volume",
    "resolution-rate",
    "avg-resolution-time",
    "recurring-complaints",
    "complaint-trend",
    "complaints-by-service",
    "complaints-by-locality",
    "geographic-hotspots",
    "recurring-categories",
  ],
  citizen: [
    "complaints-received",
    "complaints-resolved",
    "resolution-rate",
    "sla-compliance",
    "complaint-trend",
    "complaints-by-service",
    "resolution-performance",
    "geographic-distribution",
  ],
};

export type DashboardKpiRow = {
  id: string;
  name: string;
  measures: string;
  source: string;
  refresh: string;
  mapped: boolean;
};

export function getDashboardKpiRows(dashboardId: string): DashboardKpiRow[] {
  const refs = DASHBOARD_KPI_REFS[dashboardId] ?? [];
  return refs.map((ref) => {
    const id = typeof ref === "string" ? ref : ref.id;
    const def = getKpi(id);
    if (!def) {
      return {
        id,
        name: typeof ref === "string" ? id : ref.name,
        measures: "Definition not available",
        source: "-",
        refresh: "-",
        mapped: false,
      };
    }
    return {
      id: def.id,
      name: def.name,
      measures: def.measures,
      source: def.source,
      refresh: def.refresh,
      mapped: true,
    };
  });
}
