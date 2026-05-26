/**
 * Realistic, government-grade seed data for the PGR prototype.
 * No lorem ipsum. Mirrors PGR (Public Grievance Redressal) entities.
 */

export type ComplaintStatus =
  | "OPEN"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "RESOLVED"
  | "REJECTED"
  | "REOPENED"
  | "CLOSED";

export type SlaState = "WITHIN" | "NEARING" | "BREACHED";
export type Channel = "MOBILE_APP" | "WEB" | "CALL_CENTER" | "COUNTER" | "WHATSAPP";
export type Priority = "LOW" | "MEDIUM" | "HIGH";

export interface ComplaintType {
  code: string;
  name: string;
  department: string;
  slaHours: number;
  active: boolean;
}

export const COMPLAINT_TYPES: ComplaintType[] = [
  { code: "SWM_GARBAGE", name: "Garbage not collected", department: "Sanitation", slaHours: 24, active: true },
  { code: "SWM_DEAD_ANIMAL", name: "Dead animal removal", department: "Sanitation", slaHours: 12, active: true },
  { code: "STR_POTHOLE", name: "Pothole on road", department: "Public Works", slaHours: 72, active: true },
  { code: "STR_STREETLIGHT", name: "Streetlight not working", department: "Electrical", slaHours: 48, active: true },
  { code: "WS_LEAKAGE", name: "Water pipeline leakage", department: "Water Supply", slaHours: 24, active: true },
  { code: "WS_NO_SUPPLY", name: "No water supply", department: "Water Supply", slaHours: 12, active: true },
  { code: "SEW_OVERFLOW", name: "Sewerage overflow", department: "Sewerage", slaHours: 8, active: true },
  { code: "STR_STRAY_ANIMAL", name: "Stray animal menace", department: "Veterinary", slaHours: 48, active: true },
  { code: "ENC_ILLEGAL", name: "Illegal encroachment", department: "Town Planning", slaHours: 120, active: true },
  { code: "PARK_MAINT", name: "Park maintenance", department: "Horticulture", slaHours: 96, active: false },
];

export interface Officer {
  id: string;
  name: string;
  designation: string;
  department: string;
  ward: string;
  mobile: string;
  activeLoad: number;
}

export const OFFICERS: Officer[] = [
  { id: "EMP-1042", name: "Ramesh Kumar", designation: "Sanitary Inspector", department: "Sanitation", ward: "W-12", mobile: "98xxxxxx12", activeLoad: 7 },
  { id: "EMP-1058", name: "Surinder Pal", designation: "Junior Engineer", department: "Public Works", ward: "W-18", mobile: "98xxxxxx34", activeLoad: 12 },
  { id: "EMP-1071", name: "Gurmeet Singh", designation: "Lineman", department: "Electrical", ward: "W-21", mobile: "98xxxxxx56", activeLoad: 4 },
  { id: "EMP-1089", name: "Baljeet Kaur", designation: "Water Works Officer", department: "Water Supply", ward: "W-12", mobile: "98xxxxxx78", activeLoad: 9 },
  { id: "EMP-1103", name: "Mohan Lal", designation: "Sewerage Supervisor", department: "Sewerage", ward: "W-27", mobile: "98xxxxxx90", activeLoad: 6 },
  { id: "EMP-1124", name: "Pritam Singh", designation: "Sanitary Inspector", department: "Sanitation", ward: "W-18", mobile: "98xxxxxx11", activeLoad: 5 },
];

export interface WorkflowStep {
  at: string;
  actor: string;
  role: string;
  action: string;
  from?: ComplaintStatus;
  to: ComplaintStatus;
  note?: string;
}

export interface Complaint {
  id: string;
  typeCode: string;
  description: string;
  status: ComplaintStatus;
  priority: Priority;
  channel: Channel;
  filedOn: string;
  lastUpdated: string;
  slaHours: number;
  slaRemainingHrs: number;
  slaState: SlaState;
  ward: string;
  locality: string;
  address: string;
  citizen: {
    name: string;
    mobile: string;
    masked: boolean;
  };
  assignedOfficerId?: string;
  department: string;
  attachments: number;
  workflow: WorkflowStep[];
  reopenCount: number;
}

const today = new Date("2026-05-23T10:00:00");
const isoMinus = (h: number) => new Date(today.getTime() - h * 3600_000).toISOString();

function build(
  id: string,
  typeCode: string,
  status: ComplaintStatus,
  hAgo: number,
  ward: string,
  locality: string,
  citizen: { name: string; mobile: string },
  desc: string,
  opts: Partial<Complaint> = {},
): Complaint {
  const type = COMPLAINT_TYPES.find((c) => c.code === typeCode)!;
  const remaining = type.slaHours - hAgo;
  const slaState: SlaState =
    remaining < 0 ? "BREACHED" : remaining < type.slaHours * 0.25 ? "NEARING" : "WITHIN";
  return {
    id,
    typeCode,
    description: desc,
    status,
    priority: opts.priority ?? "MEDIUM",
    channel: opts.channel ?? "MOBILE_APP",
    filedOn: isoMinus(hAgo),
    lastUpdated: isoMinus(Math.max(0, hAgo - 2)),
    slaHours: type.slaHours,
    slaRemainingHrs: remaining,
    slaState,
    ward,
    locality,
    address: opts.address ?? `${locality}, ${ward}, Amritsar`,
    citizen: { ...citizen, masked: false },
    assignedOfficerId: opts.assignedOfficerId,
    department: type.department,
    attachments: opts.attachments ?? 0,
    workflow: opts.workflow ?? [
      { at: isoMinus(hAgo), actor: "Citizen", role: "CITIZEN", action: "FILED", to: "OPEN" },
    ],
    reopenCount: opts.reopenCount ?? 0,
  };
}

export const COMPLAINTS: Complaint[] = [
  build("PGR-2026-04812", "SWM_GARBAGE", "ASSIGNED", 18, "W-12", "Civil Lines", { name: "Harjeet Singh", mobile: "98xxxxxx21" }, "Garbage has not been lifted from the corner of Lawrence Road for 3 days. Heap is overflowing onto the footpath.", { assignedOfficerId: "EMP-1042", attachments: 2, priority: "HIGH", workflow: [
    { at: isoMinus(18), actor: "Citizen", role: "CITIZEN", action: "FILED", to: "OPEN" },
    { at: isoMinus(16), actor: "Manjit Singh", role: "GRO", action: "ASSIGNED", from: "OPEN", to: "ASSIGNED", note: "Routed to Sanitary Inspector — Civil Lines" },
  ]}),
  build("PGR-2026-04813", "STR_STREETLIGHT", "IN_PROGRESS", 30, "W-18", "Ranjit Avenue", { name: "Simran Kaur", mobile: "98xxxxxx32" }, "Streetlight pole no. RA-118 has been non-functional for over a week. Causing safety concerns at night.", { assignedOfficerId: "EMP-1071", channel: "WEB", workflow: [
    { at: isoMinus(30), actor: "Citizen", role: "CITIZEN", action: "FILED", to: "OPEN" },
    { at: isoMinus(28), actor: "Manjit Singh", role: "GRO", action: "ASSIGNED", from: "OPEN", to: "ASSIGNED" },
    { at: isoMinus(20), actor: "Gurmeet Singh", role: "LME", action: "PICKED_UP", from: "ASSIGNED", to: "IN_PROGRESS", note: "Replacement scheduled for tomorrow morning." },
  ]}),
  build("PGR-2026-04814", "WS_LEAKAGE", "OPEN", 6, "W-21", "Hall Bazaar", { name: "Arvind Mehta", mobile: "98xxxxxx43" }, "Continuous water leakage from main pipeline near Jain Mandir. Significant water wastage.", { channel: "CALL_CENTER", priority: "HIGH" }),
  build("PGR-2026-04815", "SEW_OVERFLOW", "ASSIGNED", 5, "W-27", "Cantonment", { name: "Inderjit Kaur", mobile: "98xxxxxx54" }, "Sewerage manhole overflowing onto residential street. Foul smell and health hazard.", { assignedOfficerId: "EMP-1103", priority: "HIGH", attachments: 1 }),
  build("PGR-2026-04816", "STR_POTHOLE", "RESOLVED", 90, "W-18", "Ranjit Avenue", { name: "Karan Verma", mobile: "98xxxxxx65" }, "Large pothole near Block A market causing two-wheeler accidents.", { assignedOfficerId: "EMP-1058", workflow: [
    { at: isoMinus(90), actor: "Citizen", role: "CITIZEN", action: "FILED", to: "OPEN" },
    { at: isoMinus(86), actor: "Manjit Singh", role: "GRO", action: "ASSIGNED", from: "OPEN", to: "ASSIGNED" },
    { at: isoMinus(72), actor: "Surinder Pal", role: "LME", action: "PICKED_UP", from: "ASSIGNED", to: "IN_PROGRESS" },
    { at: isoMinus(40), actor: "Surinder Pal", role: "LME", action: "RESOLVED", from: "IN_PROGRESS", to: "RESOLVED", note: "Patchwork completed and verified on site." },
  ]}),
  build("PGR-2026-04817", "SWM_DEAD_ANIMAL", "OPEN", 9, "W-12", "Civil Lines", { name: "Rakesh Sharma", mobile: "98xxxxxx76" }, "Dead stray dog on Mall Road footpath. Needs immediate removal.", { priority: "HIGH" }),
  build("PGR-2026-04818", "WS_NO_SUPPLY", "ASSIGNED", 10, "W-12", "Civil Lines", { name: "Geeta Devi", mobile: "98xxxxxx87" }, "No water supply since morning in Lane 4. Entire street affected.", { assignedOfficerId: "EMP-1089", priority: "HIGH" }),
  build("PGR-2026-04819", "STR_STREETLIGHT", "IN_PROGRESS", 36, "W-21", "Hall Bazaar", { name: "Naveen Kumar", mobile: "98xxxxxx98" }, "Three consecutive streetlights non-functional on bazaar main road.", { assignedOfficerId: "EMP-1071" }),
  build("PGR-2026-04820", "ENC_ILLEGAL", "OPEN", 48, "W-27", "Cantonment", { name: "Resident Welfare Assn.", mobile: "98xxxxxx10" }, "Unauthorised construction of shop extension blocking public footpath.", { channel: "COUNTER", priority: "MEDIUM" }),
  build("PGR-2026-04821", "SWM_GARBAGE", "REJECTED", 60, "W-18", "Ranjit Avenue", { name: "Anonymous", mobile: "98xxxxxx20" }, "Garbage near community park.", { workflow: [
    { at: isoMinus(60), actor: "Citizen", role: "CITIZEN", action: "FILED", to: "OPEN" },
    { at: isoMinus(58), actor: "Manjit Singh", role: "GRO", action: "REJECTED", from: "OPEN", to: "REJECTED", note: "Duplicate of PGR-2026-04812. Closed as duplicate." },
  ]}),
  build("PGR-2026-04822", "STR_STRAY_ANIMAL", "ASSIGNED", 28, "W-12", "Civil Lines", { name: "Sunita Rani", mobile: "98xxxxxx31" }, "Pack of stray dogs in school zone — risk to children during morning hours.", { assignedOfficerId: "EMP-1042", priority: "HIGH" }),
  build("PGR-2026-04823", "STR_POTHOLE", "IN_PROGRESS", 50, "W-27", "Cantonment", { name: "Davinder Singh", mobile: "98xxxxxx42" }, "Multiple potholes on stretch leading to government school.", { assignedOfficerId: "EMP-1058" }),
  build("PGR-2026-04824", "SWM_GARBAGE", "RESOLVED", 110, "W-21", "Hall Bazaar", { name: "Market Association", mobile: "98xxxxxx53" }, "Daily garbage collection skipped from main market area.", { assignedOfficerId: "EMP-1124", reopenCount: 1, workflow: [
    { at: isoMinus(110), actor: "Citizen", role: "CITIZEN", action: "FILED", to: "OPEN" },
    { at: isoMinus(106), actor: "Manjit Singh", role: "GRO", action: "ASSIGNED", from: "OPEN", to: "ASSIGNED" },
    { at: isoMinus(82), actor: "Pritam Singh", role: "LME", action: "RESOLVED", from: "ASSIGNED", to: "RESOLVED" },
    { at: isoMinus(60), actor: "Market Association", role: "CITIZEN", action: "REOPENED", from: "RESOLVED", to: "REOPENED", note: "Issue recurring." },
    { at: isoMinus(40), actor: "Pritam Singh", role: "LME", action: "RESOLVED", from: "REOPENED", to: "RESOLVED" },
  ]}),
  build("PGR-2026-04825", "WS_LEAKAGE", "OPEN", 3, "W-18", "Ranjit Avenue", { name: "Pooja Aggarwal", mobile: "98xxxxxx64" }, "Pipeline burst near park gate — water flooding the road.", { priority: "HIGH" }),
  build("PGR-2026-04826", "SEW_OVERFLOW", "IN_PROGRESS", 7, "W-12", "Civil Lines", { name: "Mohinder Pal", mobile: "98xxxxxx75" }, "Manhole cover missing and sewage spilling.", { assignedOfficerId: "EMP-1103", priority: "HIGH" }),
];

export function getComplaint(id: string): Complaint | undefined {
  return COMPLAINTS.find((c) => c.id === id);
}

export function complaintTypeOf(code: string): ComplaintType | undefined {
  return COMPLAINT_TYPES.find((c) => c.code === code);
}

export function officerOf(id?: string): Officer | undefined {
  return id ? OFFICERS.find((o) => o.id === id) : undefined;
}

// Aggregations for dashboard / SLA / reports
export function dashboardSummary() {
  const total = COMPLAINTS.length;
  const open = COMPLAINTS.filter((c) => ["OPEN", "ASSIGNED", "IN_PROGRESS", "REOPENED"].includes(c.status)).length;
  const resolved = COMPLAINTS.filter((c) => c.status === "RESOLVED" || c.status === "CLOSED").length;
  const breached = COMPLAINTS.filter((c) => c.slaState === "BREACHED").length;
  const reopens = COMPLAINTS.filter((c) => c.reopenCount > 0).length;
  return {
    total,
    open,
    resolved,
    breached,
    avgResolutionHrs: 42,
    reopenRate: Math.round((reopens / total) * 100),
    satisfaction: 4.1,
  };
}

export function byDepartment() {
  const map = new Map<string, { open: number; resolved: number; breached: number }>();
  for (const c of COMPLAINTS) {
    const m = map.get(c.department) ?? { open: 0, resolved: 0, breached: 0 };
    if (c.status === "RESOLVED" || c.status === "CLOSED") m.resolved++;
    else m.open++;
    if (c.slaState === "BREACHED") m.breached++;
    map.set(c.department, m);
  }
  return Array.from(map, ([department, v]) => ({ department, ...v }));
}

export function byWard() {
  const map = new Map<string, number>();
  for (const c of COMPLAINTS) map.set(c.ward, (map.get(c.ward) ?? 0) + 1);
  return Array.from(map, ([ward, total]) => ({ ward, total }));
}

export function trend7d() {
  return [
    { day: "Mon", filed: 38, resolved: 31 },
    { day: "Tue", filed: 42, resolved: 35 },
    { day: "Wed", filed: 51, resolved: 40 },
    { day: "Thu", filed: 47, resolved: 44 },
    { day: "Fri", filed: 58, resolved: 49 },
    { day: "Sat", filed: 36, resolved: 38 },
    { day: "Sun", filed: 21, resolved: 24 },
  ];
}

export interface AuditEntry {
  at: string;
  actor: string;
  role: string;
  action: string;
  entity: string;
  entityId: string;
  meta?: string;
}

export const AUDIT_LOG: AuditEntry[] = [
  { at: isoMinus(1), actor: "Manjit Singh", role: "GRO", action: "ASSIGNED", entity: "Complaint", entityId: "PGR-2026-04815", meta: "→ EMP-1103" },
  { at: isoMinus(2), actor: "Gurmeet Singh", role: "LME", action: "STATUS_UPDATED", entity: "Complaint", entityId: "PGR-2026-04813", meta: "ASSIGNED → IN_PROGRESS" },
  { at: isoMinus(3), actor: "Vikram Mehta", role: "ADMIN", action: "CONFIG_UPDATED", entity: "ComplaintType", entityId: "SEW_OVERFLOW", meta: "SLA 12h → 8h" },
  { at: isoMinus(5), actor: "Harpreet Kaur", role: "CSR", action: "CREATED", entity: "Complaint", entityId: "PGR-2026-04825" },
  { at: isoMinus(6), actor: "Manjit Singh", role: "GRO", action: "REJECTED", entity: "Complaint", entityId: "PGR-2026-04821", meta: "Duplicate" },
  { at: isoMinus(8), actor: "Dr. Anita Sharma", role: "DEPT_HEAD", action: "ESCALATED", entity: "Complaint", entityId: "PGR-2026-04812", meta: "To Commissioner" },
  { at: isoMinus(12), actor: "Vikram Mehta", role: "ADMIN", action: "USER_CREATED", entity: "Employee", entityId: "EMP-1124" },
  { at: isoMinus(20), actor: "Surinder Pal", role: "LME", action: "RESOLVED", entity: "Complaint", entityId: "PGR-2026-04816" },
];

export const ESCALATIONS = COMPLAINTS
  .filter((c) => c.slaState === "BREACHED" || c.slaState === "NEARING")
  .map((c) => ({
    id: c.id,
    typeCode: c.typeCode,
    ward: c.ward,
    department: c.department,
    breachedBy: Math.max(0, -c.slaRemainingHrs),
    slaState: c.slaState,
    assignedOfficerId: c.assignedOfficerId,
    level: c.slaState === "BREACHED" ? (c.slaRemainingHrs < -48 ? "L3" : "L2") : "L1",
  }));
