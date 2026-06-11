/**
 * Test-User-only seed: ~60 deterministic complaints covering every ward,
 * department, channel, status, age bucket, SLA state, and per-stage timing
 * so every widget on the Test User dashboard reconciles against ONE dataset.
 *
 * NOT used by any other role — see DashboardPage's `canCustomize` branch.
 */
import {
  COMPLAINT_TYPES,
  OFFICERS,
  type Complaint,
  type ComplaintStatus,
  type Channel,
  type Priority,
  type WorkflowStep,
} from "./mock-data";

export interface TestComplaint extends Complaint {
  /** Hours spent in each workflow stage so far. Reconciles per-stage avg. */
  stageHours: {
    pendingAssignment: number;
    assigned: number;
    pendingResolution: number;
  };
  /** 1–5 citizen satisfaction; only present for RESOLVED / CLOSED rows. */
  csat?: number;
  /** Number of times this complaint was reassigned to a different officer. */
  reassignCount: number;
  /** True if the complaint was escalated to L2/L3 during its lifecycle. */
  escalated: boolean;
  /** Sub-type label for the type/subtype crosstab. */
  subtype: string;
}

// Anchor "now" — same value used by mock-data.ts so all timestamps align.
const NOW = new Date("2026-05-23T10:00:00").getTime();
const isoMinus = (h: number) => new Date(NOW - h * 3600_000).toISOString();

export const TEST_USER_WARDS = [
  "Heritage City",
  "Financial District",
  "Town Square",
  "East Village",
] as const;

const LOCALITIES: Record<(typeof TEST_USER_WARDS)[number], string[]> = {
  "Heritage City":      ["Mall Road", "Civil Lines", "Hall Bazaar"],
  "Financial District": ["Crown Plaza", "Trade Centre", "Lawrence Avenue"],
  "Town Square":        ["Clock Tower", "Old Market", "Park Lane"],
  "East Village":       ["Riverside", "Green Park", "New Colony"],
};

const CITIZEN_NAMES = [
  "Harjeet Singh", "Simran Kaur", "Arvind Mehta", "Inderjit Kaur", "Karan Verma",
  "Rakesh Sharma", "Geeta Devi", "Naveen Kumar", "Pooja Aggarwal", "Mohinder Pal",
  "Sunita Rani", "Davinder Singh", "Priya Bhalla", "Ashok Khanna", "Meena Joshi",
  "Vikram Sodhi", "Rita Anand", "Suresh Bedi", "Nisha Chopra", "Tarun Kapoor",
];

const TYPE_TO_OFFICERS: Record<string, string[]> = {
  SWM_GARBAGE:      ["EMP-1042", "EMP-1124"],
  SWM_DEAD_ANIMAL:  ["EMP-1042", "EMP-1124"],
  STR_POTHOLE:      ["EMP-1058"],
  STR_STREETLIGHT:  ["EMP-1071"],
  WS_LEAKAGE:       ["EMP-1089"],
  WS_NO_SUPPLY:     ["EMP-1089"],
  SEW_OVERFLOW:     ["EMP-1103"],
  ENC_ILLEGAL:      ["EMP-1058"],
  STR_STRAY_ANIMAL: ["EMP-1042", "EMP-1124"],
};

const SUBTYPES: Record<string, string> = {
  SWM_GARBAGE:      "Door-to-door collection skipped",
  SWM_DEAD_ANIMAL:  "Stray animal carcass",
  STR_POTHOLE:      "Carriageway pothole",
  STR_STREETLIGHT:  "Pole non-functional",
  WS_LEAKAGE:       "Mainline leakage",
  WS_NO_SUPPLY:     "Supply interruption",
  SEW_OVERFLOW:     "Manhole overflow",
  ENC_ILLEGAL:      "Footpath encroachment",
  STR_STRAY_ANIMAL: "Aggressive pack sighting",
};

const DESCRIPTIONS: Record<string, string[]> = {
  SWM_GARBAGE: [
    "Garbage not lifted for 3 days; heap overflowing on footpath.",
    "Daily collection skipped from market lane.",
    "Mixed waste piling near community park entrance.",
  ],
  SWM_DEAD_ANIMAL: [
    "Dead stray dog on footpath; needs immediate removal.",
    "Carcass near school gate — health hazard for children.",
  ],
  STR_POTHOLE: [
    "Large pothole near block A causing two-wheeler accidents.",
    "Multiple potholes on stretch to government school.",
    "Crater developing after recent rain; lane blocked.",
  ],
  STR_STREETLIGHT: [
    "Streetlight pole non-functional for over a week.",
    "Three consecutive streetlights dark on main road.",
    "Pole flickering — unsafe for night-time pedestrians.",
  ],
  WS_LEAKAGE: [
    "Continuous water leakage from mainline near temple.",
    "Pipeline burst near park gate; road flooded.",
    "Slow leak wetting compound wall and footpath.",
  ],
  WS_NO_SUPPLY: [
    "No water supply since morning — entire street affected.",
    "Tanker did not arrive for scheduled supply.",
  ],
  SEW_OVERFLOW: [
    "Sewerage manhole overflowing onto residential street.",
    "Manhole cover missing; sewage spilling out.",
  ],
  ENC_ILLEGAL: [
    "Unauthorised shop extension blocking public footpath.",
    "Temporary structure on green belt land.",
  ],
  STR_STRAY_ANIMAL: [
    "Pack of stray dogs in school zone, risk to children.",
    "Cattle wandering on arterial road causing congestion.",
  ],
};

const CHANNELS: Channel[] = ["MOBILE_APP", "WEB", "CALL_CENTER", "COUNTER", "WHATSAPP"];

// 60 status assignments — distribution gives every status non-zero presence
// and produces the SLA / age / stage variety the dashboard needs.
const STATUS_PATTERN: ComplaintStatus[] = [
  // 10 OPEN (pending assignment)
  "OPEN","OPEN","OPEN","OPEN","OPEN","OPEN","OPEN","OPEN","OPEN","OPEN",
  // 12 ASSIGNED
  "ASSIGNED","ASSIGNED","ASSIGNED","ASSIGNED","ASSIGNED","ASSIGNED",
  "ASSIGNED","ASSIGNED","ASSIGNED","ASSIGNED","ASSIGNED","ASSIGNED",
  // 16 IN_PROGRESS (pending resolution)
  "IN_PROGRESS","IN_PROGRESS","IN_PROGRESS","IN_PROGRESS",
  "IN_PROGRESS","IN_PROGRESS","IN_PROGRESS","IN_PROGRESS",
  "IN_PROGRESS","IN_PROGRESS","IN_PROGRESS","IN_PROGRESS",
  "IN_PROGRESS","IN_PROGRESS","IN_PROGRESS","IN_PROGRESS",
  // 4 REOPENED
  "REOPENED","REOPENED","REOPENED","REOPENED",
  // 12 RESOLVED
  "RESOLVED","RESOLVED","RESOLVED","RESOLVED","RESOLVED","RESOLVED",
  "RESOLVED","RESOLVED","RESOLVED","RESOLVED","RESOLVED","RESOLVED",
  // 4 CLOSED
  "CLOSED","CLOSED","CLOSED","CLOSED",
  // 2 REJECTED
  "REJECTED","REJECTED",
];

// Ages in hours — covers <1d / 1–3d / 3–7d / >7d buckets and forces a healthy
// mix of WITHIN / NEARING / BREACHED SLA states.
const AGE_PATTERN: number[] = [
  // <24h (12 rows)
   4,  6,  8, 10, 14, 16, 18, 20, 22,  5, 11, 19,
  // 24–72h (16 rows)
  28, 30, 34, 38, 42, 46, 50, 54, 58, 62, 66, 70, 32, 44, 56, 68,
  // 72–168h (18 rows)
  76, 84, 92, 100, 108, 116, 124, 132, 140, 148, 156, 164,
  80, 96, 112, 128, 144, 160,
  // >168h (14 rows)
  176, 192, 208, 224, 240, 260, 280, 300, 320, 336, 200, 252, 288, 312,
];

const TYPES = [
  "SWM_GARBAGE","STR_STREETLIGHT","WS_LEAKAGE","SEW_OVERFLOW",
  "STR_POTHOLE","SWM_DEAD_ANIMAL","WS_NO_SUPPLY","ENC_ILLEGAL","STR_STRAY_ANIMAL",
] as const;

function typeFor(i: number): string {
  return TYPES[i % TYPES.length];
}

function priorityFor(i: number, status: ComplaintStatus): Priority {
  if (status === "OPEN" && i % 3 === 0) return "HIGH";
  const pool: Priority[] = ["LOW", "MEDIUM", "HIGH", "MEDIUM"];
  return pool[i % pool.length];
}

function chooseOfficer(typeCode: string, i: number, status: ComplaintStatus): string | undefined {
  if (status === "OPEN") return undefined;
  const pool = TYPE_TO_OFFICERS[typeCode] ?? OFFICERS.map((o) => o.id);
  return pool[i % pool.length];
}

function buildStageHours(status: ComplaintStatus, age: number, slaHours: number) {
  // Heuristic but consistent:
  //  - pendingAssignment is short (≤ 6h) once anything is assigned.
  //  - assigned dwell is small (≤ 10h) once work has started.
  //  - pendingResolution absorbs the remainder of the lifecycle.
  switch (status) {
    case "OPEN":
      return { pendingAssignment: age, assigned: 0, pendingResolution: 0 };
    case "ASSIGNED": {
      const pa = Math.min(6, Math.max(2, Math.round(age * 0.25)));
      return { pendingAssignment: pa, assigned: age - pa, pendingResolution: 0 };
    }
    case "IN_PROGRESS":
    case "REOPENED": {
      const pa = Math.min(5, Math.max(2, Math.round(age * 0.15)));
      const asg = Math.min(8, Math.max(2, Math.round(age * 0.2)));
      return { pendingAssignment: pa, assigned: asg, pendingResolution: Math.max(1, age - pa - asg) };
    }
    case "RESOLVED":
    case "CLOSED": {
      // Resolution time ≈ slaHours-ish; aim for ~70% on-time among resolved.
      const pa = 3;
      const asg = 6;
      // Decide on-time deterministically by index — handled by caller using a
      // mask, so just clamp pendingResolution to the remainder.
      const pr = Math.max(2, age - pa - asg);
      void slaHours;
      return { pendingAssignment: pa, assigned: asg, pendingResolution: pr };
    }
    case "REJECTED":
      return { pendingAssignment: Math.min(4, age), assigned: 0, pendingResolution: 0 };
  }
}

function buildWorkflow(
  id: string,
  status: ComplaintStatus,
  age: number,
  officerId: string | undefined,
  reassignCount: number,
  escalated: boolean,
): WorkflowStep[] {
  const steps: WorkflowStep[] = [
    { at: isoMinus(age), actor: "Citizen", role: "CITIZEN", action: "FILED", to: "OPEN" },
  ];
  if (status === "OPEN") return steps;
  const pa = Math.min(6, Math.max(2, Math.round(age * 0.2)));
  steps.push({
    at: isoMinus(age - pa), actor: "Manjit Singh", role: "GRO",
    action: "ASSIGNED", from: "OPEN", to: "ASSIGNED",
    note: officerId ? `Routed to ${officerId}` : undefined,
  });
  for (let k = 0; k < reassignCount; k++) {
    steps.push({
      at: isoMinus(age - pa - (k + 1)),
      actor: "Manjit Singh", role: "GRO",
      action: "REASSIGNED", from: "ASSIGNED", to: "ASSIGNED",
      note: "Capacity rebalanced",
    });
  }
  if (status === "ASSIGNED") return steps;
  steps.push({
    at: isoMinus(age - pa - 6), actor: "Officer", role: "LME",
    action: "PICKED_UP", from: "ASSIGNED", to: "IN_PROGRESS",
  });
  if (escalated) {
    steps.push({
      at: isoMinus(Math.max(0, age - pa - 10)), actor: "Dept. Head", role: "DEPT_HEAD",
      action: "ESCALATED", from: "IN_PROGRESS", to: "IN_PROGRESS",
      note: "Escalated to L2",
    });
  }
  if (status === "IN_PROGRESS") return steps;
  if (status === "REOPENED") {
    steps.push({ at: isoMinus(Math.max(0, age - pa - 14)), actor: "Officer", role: "LME", action: "RESOLVED", from: "IN_PROGRESS", to: "RESOLVED" });
    steps.push({ at: isoMinus(Math.max(0, age - pa - 18)), actor: "Citizen", role: "CITIZEN", action: "REOPENED", from: "RESOLVED", to: "REOPENED", note: "Issue recurring" });
    return steps;
  }
  if (status === "REJECTED") {
    return [
      steps[0],
      { at: isoMinus(Math.max(0, age - 2)), actor: "Manjit Singh", role: "GRO", action: "REJECTED", from: "OPEN", to: "REJECTED", note: "Duplicate" },
    ];
  }
  // RESOLVED / CLOSED
  steps.push({ at: isoMinus(Math.max(0, age - pa - 10)), actor: "Officer", role: "LME", action: "RESOLVED", from: "IN_PROGRESS", to: "RESOLVED", note: "Resolved and verified on site" });
  if (status === "CLOSED") {
    steps.push({ at: isoMinus(Math.max(0, age - pa - 14)), actor: "GRO", role: "GRO", action: "CLOSED", from: "RESOLVED", to: "CLOSED" });
  }
  return steps;
}

function build(i: number): TestComplaint {
  const status = STATUS_PATTERN[i];
  const age = AGE_PATTERN[i];
  const typeCode = typeFor(i);
  const type = COMPLAINT_TYPES.find((t) => t.code === typeCode)!;
  const ward = TEST_USER_WARDS[i % 4];
  const locsForWard = LOCALITIES[ward];
  const locality = locsForWard[i % locsForWard.length];
  const channel = CHANNELS[i % CHANNELS.length];
  const priority = priorityFor(i, status);
  const officerId = chooseOfficer(typeCode, i, status);
  const reassignCount = status === "OPEN" ? 0 : ((i * 7) % 11 < 3 ? 1 : (i % 17 === 0 ? 2 : 0));
  const isResolvedLike = status === "RESOLVED" || status === "CLOSED";
  // Force ~70% of resolved rows to be on-time: closed within slaHours.
  const resolvedOnTime = isResolvedLike ? (i % 10 < 7) : false;
  const effectiveAge = isResolvedLike && resolvedOnTime
    ? Math.min(age, type.slaHours - 1)
    : age;
  const stageHours = buildStageHours(status, effectiveAge, type.slaHours);
  const remaining = type.slaHours - effectiveAge;
  const slaState =
    remaining < 0 ? "BREACHED" : remaining < type.slaHours * 0.25 ? "NEARING" : "WITHIN";
  // Escalate ~30% of breached open complaints; never escalate resolved.
  const escalated = !isResolvedLike && slaState === "BREACHED" && (i % 3 === 0);
  const csat = isResolvedLike ? (resolvedOnTime ? 4 + (i % 2) : 3 - (i % 2)) : undefined;
  const descPool = DESCRIPTIONS[typeCode] ?? ["Citizen complaint logged."];
  const description = descPool[i % descPool.length];
  const citizen = { name: CITIZEN_NAMES[i % CITIZEN_NAMES.length], mobile: `98xxxxxx${String(10 + i).slice(-2)}`, masked: false };
  const filedHoursAgo = effectiveAge;
  const lastUpdatedHoursAgo = Math.max(0, filedHoursAgo - Math.max(stageHours.pendingResolution, stageHours.assigned, 1));
  const workflow = buildWorkflow(`PGR-2026-T${String(5000 + i).padStart(4, "0")}`, status, filedHoursAgo, officerId, reassignCount, escalated);

  return {
    id: `PGR-2026-T${String(5000 + i).padStart(4, "0")}`,
    typeCode,
    description,
    status,
    priority,
    channel,
    filedOn: isoMinus(filedHoursAgo),
    lastUpdated: isoMinus(lastUpdatedHoursAgo),
    slaHours: type.slaHours,
    slaRemainingHrs: remaining,
    slaState,
    ward,
    locality,
    address: `${locality}, ${ward}`,
    citizen,
    assignedOfficerId: officerId,
    department: type.department,
    attachments: (i % 4),
    workflow,
    reopenCount: status === "REOPENED" ? 1 : 0,
    stageHours,
    csat,
    reassignCount,
    escalated,
    subtype: SUBTYPES[typeCode] ?? type.name,
  };
}

export const TEST_USER_COMPLAINTS: TestComplaint[] = Array.from(
  { length: STATUS_PATTERN.length },
  (_, i) => build(i),
);

/** Helper: median of an array of numbers (returns 0 for empty input). */
export function median(nums: number[]): number {
  if (nums.length === 0) return 0;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}
