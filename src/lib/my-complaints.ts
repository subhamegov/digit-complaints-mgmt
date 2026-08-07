/**
 * Shared configuration + derivation for the "My Complaints" workspace.
 *
 * Personas: Field Employee (LME), Grievance Routing Officer (GRO),
 * Department Head (DEPT_HEAD).
 *
 * Everything here derives from the EXISTING complaint dataset / workflow
 * states (src/lib/mock-data.ts stands in for the complaint API). No new
 * complaint records are created. Group membership is mutually exclusive and
 * resolved by the documented priority order, so a complaint appears once.
 */
import {
  COMPLAINTS, OFFICERS, officerOf, complaintTypeOf,
  type Complaint,
} from "./mock-data";
import type { Role } from "./rbac";

export type GroupKey =
  // Assigned to me
  | "action_required"
  | "in_progress"
  | "waiting"
  | "completed"
  // Needs my attention
  | "escalated_to_me"
  | "awaiting_review"
  | "sla_breached"
  | "at_risk_today"
  | "unassigned_stalled"
  | "due_today"
  | "returned"
  | "citizen_response";

export const GROUP_LABEL: Record<GroupKey, string> = {
  action_required: "Action required",
  in_progress: "In progress",
  waiting: "Waiting on others",
  completed: "Completed",
  escalated_to_me: "Escalated to me",
  awaiting_review: "Awaiting my review",
  sla_breached: "SLA breached",
  at_risk_today: "At risk today",
  unassigned_stalled: "Unassigned or stalled",
  due_today: "Due today",
  returned: "Returned for action",
  citizen_response: "Citizen response received",
};

/** Section order for the "Assigned to me" tab. */
export const ASSIGNED_ORDER: GroupKey[] = ["action_required", "in_progress", "waiting", "completed"];

/** Section order for "Needs my attention", per persona. */
export const ATTENTION_ORDER: Record<string, GroupKey[]> = {
  LME: ["action_required", "due_today", "returned", "citizen_response", "at_risk_today"],
  GRO: ["escalated_to_me", "awaiting_review", "sla_breached", "at_risk_today", "unassigned_stalled"],
  DEPT_HEAD: ["escalated_to_me", "awaiting_review", "sla_breached", "at_risk_today", "unassigned_stalled"],
};

/** Groups expanded on first render. Completed stays collapsed. */
export const DEFAULT_EXPANDED: GroupKey[] = [
  "action_required", "escalated_to_me", "awaiting_review", "due_today",
  "returned", "citizen_response", "sla_breached", "at_risk_today", "unassigned_stalled", "in_progress",
];

/** Landing tab per persona. */
export const PERSONA_DEFAULT_TAB: Record<string, "assigned" | "attention" | "org"> = {
  LME: "assigned",
  GRO: "attention",
  DEPT_HEAD: "attention",
};

export const EMPTY_COPY = {
  assigned: "No complaints are currently assigned to you.",
  attention: "Nothing currently requires your intervention.",
  org: "No complaints were found for your organisation in the selected working context.",
  noOrg: "Your organisational structure has not been configured. Contact your administrator.",
};


/* ------------------------------------------------------------------ */
/* Organisation model (read-only reference, sourced from role config)  */
/* ------------------------------------------------------------------ */

export type OrgUnit = {
  id: string;
  name: string;
  kind: "department" | "unit" | "team" | "role";
  jurisdictions: string[];
  members: { id: string; name: string; designation: string }[];
  children?: OrgUnit[];
};

export type OrgProfile = {
  organisation: string;
  department: string;
  role: Role;
  unitId: string;
  reportsTo?: string;
  /** Officer identity the signed-in persona maps to, when applicable. */
  officerId?: string;
  /** Departments visible in "My Organisation's Complaints". */
  scopeDepartments: string[];
  tree: OrgUnit;
};

function membersOf(department: string) {
  return OFFICERS.filter((o) => o.department === department)
    .map((o) => ({ id: o.id, name: o.name, designation: o.designation }));
}

const SANITATION_JURIS = ["W-12", "W-18"];

/**
 * Org profile per persona. Replace with the Access Control / HRMS response
 * when the backend is wired; the shape is intentionally API-like.
 */
export function orgProfileFor(role: Role, organisation: string): OrgProfile | null {
  const sanitation = membersOf("Sanitation");
  const publicWorks = membersOf("Public Works");

  if (role === "LME") {
    return {
      organisation,
      department: "Sanitation",
      role,
      unitId: "unit.sanitation.field",
      reportsTo: "Ward Supervisor · Sanitation Field Team",
      officerId: "EMP-1042",
      scopeDepartments: ["Sanitation"],
      tree: {
        id: "org.root", name: organisation, kind: "department", jurisdictions: ["All localities"], members: [],
        children: [{
          id: "dept.sanitation", name: "Sanitation", kind: "department", jurisdictions: SANITATION_JURIS, members: [],
          children: [
            { id: "unit.sanitation.grievance", name: "Grievance Routing Unit", kind: "unit", jurisdictions: SANITATION_JURIS, members: [] },
            { id: "unit.sanitation.field", name: "Sanitation Field Team", kind: "team", jurisdictions: SANITATION_JURIS, members: sanitation },
          ],
        }],
      },
    };
  }

  if (role === "GRO") {
    return {
      organisation,
      department: "Grievance Routing Unit",
      role,
      unitId: "unit.grievance",
      reportsTo: "Department Head · Public Services",
      scopeDepartments: [],
      tree: {
        id: "org.root", name: organisation, kind: "department", jurisdictions: ["All localities"], members: [],
        children: [{
          id: "unit.grievance", name: "Grievance Routing Unit", kind: "unit", jurisdictions: ["All localities"],
          members: [{ id: "EMP-1002", name: "Manjit Singh", designation: "Grievance Routing Officer" }],
          children: [
            { id: "dept.sanitation", name: "Sanitation", kind: "department", jurisdictions: SANITATION_JURIS, members: sanitation },
            { id: "dept.publicworks", name: "Public Works", kind: "department", jurisdictions: ["W-18", "W-27"], members: publicWorks },
          ],
        }],
      },
    };
  }

  if (role === "DEPT_HEAD") {
    return {
      organisation,
      department: "Public Services",
      role,
      unitId: "dept.publicservices",
      reportsTo: "Office of the Commissioner",
      scopeDepartments: ["Sanitation", "Public Works", "Water Supply", "Sewerage", "Electrical"],
      tree: {
        id: "org.root", name: organisation, kind: "department", jurisdictions: ["All localities"], members: [],
        children: [{
          id: "dept.publicservices", name: "Public Services", kind: "department", jurisdictions: ["All localities"],
          members: [{ id: "EMP-1001", name: "Dr. Anita Sharma", designation: "Department Head" }],
          children: [
            { id: "unit.grievance", name: "Grievance Routing Unit", kind: "unit", jurisdictions: ["All localities"], members: [{ id: "EMP-1002", name: "Manjit Singh", designation: "Grievance Routing Officer" }] },
            { id: "dept.sanitation", name: "Sanitation Team", kind: "team", jurisdictions: SANITATION_JURIS, members: sanitation },
            { id: "dept.publicworks", name: "Roads Maintenance Team", kind: "team", jurisdictions: ["W-18", "W-27"], members: publicWorks },
            { id: "dept.sewerage", name: "Drainage Team", kind: "team", jurisdictions: ["W-12", "W-27"], members: membersOf("Sewerage") },
          ],
        }],
      },
    };
  }

  return null;
}

/* ------------------------------------------------------------------ */
/* Scoping                                                             */
/* ------------------------------------------------------------------ */

const OPEN_STATUSES = ["OPEN", "ASSIGNED", "IN_PROGRESS", "REOPENED"];

export function isCompleted(c: Complaint) {
  return c.status === "RESOLVED" || c.status === "CLOSED" || c.status === "REJECTED";
}

/** Complaints inside the user's authorised organisational + jurisdiction scope. */
export function orgScoped(profile: OrgProfile, jurisdictionCode: string): Complaint[] {
  return COMPLAINTS.filter((c) => {
    if (profile.scopeDepartments.length && !profile.scopeDepartments.includes(c.department)) return false;
    if (jurisdictionCode !== "ALL" && c.ward !== jurisdictionCode) return false;
    return true;
  });
}

/** Complaints the signed-in user is personally responsible for. */
export function personallyOwned(profile: OrgProfile, jurisdictionCode: string): Complaint[] {
  const scoped = orgScoped(profile, jurisdictionCode);
  if (profile.role === "LME") {
    const team = new Set(OFFICERS.filter((o) => o.department === profile.department).map((o) => o.id));
    return scoped.filter((c) => c.assignedOfficerId && team.has(c.assignedOfficerId));
  }
  if (profile.role === "GRO") {
    // Routing responsibility: unassigned intake, returned/reopened work and breaches.
    return scoped.filter((c) => !c.assignedOfficerId || c.status === "REOPENED" || c.slaState !== "WITHIN");
  }
  // Department Head: monitoring + approval responsibility.
  return scoped.filter((c) => c.slaState !== "WITHIN" || c.status === "REOPENED" || isCompleted(c) === false && !c.assignedOfficerId);
}

/* ------------------------------------------------------------------ */
/* Escalation view model (derived from existing SLA + workflow state)   */
/* ------------------------------------------------------------------ */

export type EscalationInfo = {
  level: string;
  from: string;
  to: string;
  reason: string;
  sinceHrs: number;
  requiredAction: string;
};

const ROLE_TITLE: Record<string, string> = {
  LME: "Field Employee",
  GRO: "Grievance Routing Officer",
  DEPT_HEAD: "Department Head",
};

export function escalationOf(c: Complaint, role: Role): EscalationInfo | null {
  const overdueBy = -c.slaRemainingHrs;
  const formallyEscalated = !isCompleted(c) && c.slaState === "BREACHED" && overdueBy >= 24;
  if (!formallyEscalated) return null;
  const level = overdueBy >= 48 ? "Level 3" : "Level 2";
  const officer = officerOf(c.assignedOfficerId);
  return {
    level,
    from: officer ? `${officer.name} · ${officer.designation}` : "Grievance Routing Unit",
    to: ROLE_TITLE[role] ?? "Assigned officer",
    reason: c.reopenCount > 0 ? "Reopened after resolution and still unresolved" : "SLA exceeded without resolution",
    sinceHrs: Math.max(1, overdueBy - c.slaHours > 0 ? overdueBy - c.slaHours : overdueBy),
    requiredAction: role === "LME" ? "Resolve and record closure evidence"
      : role === "GRO" ? "Reassign or correct routing"
      : "Review, add direction or resolve escalation",
  };
}

/* ------------------------------------------------------------------ */
/* Grouping                                                            */
/* ------------------------------------------------------------------ */

function needsActionToday(c: Complaint, role: Role): boolean {
  if (isCompleted(c)) return false;
  if (c.status === "REOPENED") return true;                 // returned for correction
  if (!c.assignedOfficerId && (role === "GRO" || role === "DEPT_HEAD")) return true; // awaiting assignment/approval
  if (c.status === "ASSIGNED" && role === "LME") return true;                        // newly assigned
  return c.slaRemainingHrs > 0 && c.slaRemainingHrs <= 24;   // due today
}

/** Assign each complaint to exactly one group, by documented priority. */
export function groupOf(c: Complaint, role: Role): GroupKey {
  if (needsActionToday(c, role)) return "actionable";
  if (escalationOf(c, role)) return "escalated";
  if (isCompleted(c)) return "completed";
  if (c.slaState === "BREACHED") return "overdue";
  if (c.slaState === "NEARING") return "due_soon";
  if (c.status === "IN_PROGRESS") return "in_progress";
  if (c.status === "OPEN" || c.status === "ASSIGNED") return "waiting";
  return "in_progress";
}

export function groupComplaints(rows: Complaint[], role: Role) {
  const map = new Map<GroupKey, Complaint[]>();
  for (const c of rows) {
    const g = groupOf(c, role);
    map.set(g, [...(map.get(g) ?? []), c]);
  }
  return GROUP_ORDER
    .filter((g) => (map.get(g)?.length ?? 0) > 0)
    .map((g) => ({ key: g, label: GROUP_LABEL[g], rows: map.get(g)! }));
}

/** Waiting reason shown in the Waiting on others group. */
export function waitingReason(c: Complaint): string {
  if (c.status === "OPEN" && !c.assignedOfficerId) return "Awaiting assignment by routing unit";
  if (c.status === "OPEN") return "Awaiting supervisor";
  if (c.department === "Town Planning" || c.department === "Veterinary") return "Awaiting another department";
  return "Awaiting citizen response";
}

/* ------------------------------------------------------------------ */
/* SLA presentation                                                    */
/* ------------------------------------------------------------------ */

export function slaLabel(c: Complaint): string {
  const hrs = c.slaRemainingHrs;
  if (hrs < 0) {
    const over = Math.abs(hrs);
    return over >= 48 ? `${Math.round(over / 24)} days overdue` : `${over} hours overdue`;
  }
  if (hrs <= 24) return "Due today";
  const days = Math.round(hrs / 24);
  return days === 1 ? "Due in 1 day" : `Due in ${days} days`;
}

export function assigneeLabel(c: Complaint): string {
  return officerOf(c.assignedOfficerId)?.name ?? "Unassigned";
}

export function serviceLabel(c: Complaint): string {
  return complaintTypeOf(c.typeCode)?.name ?? c.typeCode;
}

export const STATUS_SENTENCE: Record<string, string> = {
  OPEN: "Pending assignment",
  ASSIGNED: "Assigned",
  IN_PROGRESS: "In progress",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
  REJECTED: "Rejected",
  REOPENED: "Pending reassignment",
};

/* ------------------------------------------------------------------ */
/* Persona action config                                               */
/* ------------------------------------------------------------------ */

export type ActionKey =
  | "open" | "start" | "update" | "resolve" | "request_info"
  | "review" | "assign" | "reassign" | "correct_routing" | "escalate"
  | "add_direction" | "approve" | "monitor" | "resolve_escalation";

export const ACTION_LABEL: Record<ActionKey, string> = {
  open: "Open complaint",
  start: "Start work",
  update: "Add update",
  resolve: "Resolve",
  request_info: "Request information",
  review: "Review",
  assign: "Assign",
  reassign: "Reassign",
  correct_routing: "Correct routing",
  escalate: "Escalate",
  add_direction: "Add direction",
  approve: "Approve",
  monitor: "Monitor",
  resolve_escalation: "Resolve escalation",
};

const PERSONA_ACTIONS: Record<string, ActionKey[]> = {
  LME: ["open", "start", "update", "resolve", "request_info"],
  GRO: ["review", "assign", "reassign", "correct_routing", "escalate"],
  DEPT_HEAD: ["review", "add_direction", "reassign", "approve", "monitor", "resolve_escalation"],
};

/** Actions permitted for this persona on this complaint, given workflow state. */
export function actionsFor(c: Complaint, role: Role): ActionKey[] {
  const all = PERSONA_ACTIONS[role] ?? ["open"];
  const done = isCompleted(c);
  const escalated = !!escalationOf(c, role);
  return all.filter((a) => {
    if (done) return a === "open" || a === "review" || a === "monitor";
    switch (a) {
      case "start": return c.status === "ASSIGNED";
      case "resolve": return c.status === "IN_PROGRESS" || c.status === "ASSIGNED" || c.status === "REOPENED";
      case "assign": return !c.assignedOfficerId;
      case "reassign": return !!c.assignedOfficerId;
      case "escalate": return c.slaState !== "WITHIN";
      case "resolve_escalation": return escalated;
      case "approve": return c.status === "RESOLVED" || c.status === "REOPENED";
      default: return true;
    }
  });
}

/* ------------------------------------------------------------------ */
/* Org tab filters                                                     */
/* ------------------------------------------------------------------ */

export type OrgFilterKey =
  | "all" | "needs_action" | "escalated" | "overdue" | "unassigned"
  | "in_progress" | "waiting" | "completed";

export const ORG_FILTERS: { key: OrgFilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "needs_action", label: "Needs action" },
  { key: "escalated", label: "Escalated" },
  { key: "overdue", label: "Overdue" },
  { key: "unassigned", label: "Unassigned" },
  { key: "in_progress", label: "In progress" },
  { key: "waiting", label: "Waiting" },
  { key: "completed", label: "Completed" },
];

export function matchesOrgFilter(c: Complaint, key: OrgFilterKey, role: Role): boolean {
  switch (key) {
    case "all": return true;
    case "needs_action": return needsActionToday(c, role);
    case "escalated": return !!escalationOf(c, role);
    case "overdue": return c.slaState === "BREACHED" && !isCompleted(c);
    case "unassigned": return !c.assignedOfficerId && !isCompleted(c);
    case "in_progress": return c.status === "IN_PROGRESS";
    case "waiting": return OPEN_STATUSES.includes(c.status) && c.status !== "IN_PROGRESS" && !needsActionToday(c, role);
    case "completed": return isCompleted(c);
  }
}

/** Filters each persona is authorised to use in the organisation tab. */
export const PERSONA_FILTER_FIELDS: Record<string, ("unit" | "assignee" | "status" | "service" | "locality" | "sla" | "date")[]> = {
  LME: ["status", "service", "sla", "date"],
  GRO: ["unit", "assignee", "status", "service", "locality", "sla", "date"],
  DEPT_HEAD: ["unit", "assignee", "status", "service", "locality", "sla", "date"],
};

