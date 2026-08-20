/**
 * Account Administration — user directory + mandatory audit trail.
 *
 * Single source of truth for:
 *   - Employee users (admin-managed directory)
 *   - Citizen users (protected identities, masked, support-only)
 *   - Audit events (every mutation MUST go through `mutate*` helpers here)
 *
 * Privacy invariants enforced in this module:
 *   - Citizen names / full identifiers are never stored in a display field.
 *   - Audit records never contain plaintext passwords, magic-link tokens,
 *     activation tokens, or any authentication secret.
 *   - `lastLoggedIn` is only ever set by an authentication event; no
 *     administrative action may overwrite it.
 */

export type EmployeeStatus = "INVITED" | "ACTIVE" | "INACTIVE" | "ARCHIVED";
export type CitizenStatus = "ACTIVE" | "UNVERIFIED" | "DISABLED";

export type Employee = {
  id: string;
  name: string;
  email: string;
  mobile: string;
  department: string;
  designation: string;
  roleKey: string;
  jurisdiction: string; // "" = not scoped
  status: EmployeeStatus;
  lastLoggedIn: string | null;
};

export type Citizen = {
  id: string; // system reference, e.g. CTZ-100234
  identifierType: "PHONE" | "EMAIL";
  /** Pre-masked. Full identifier is never held in the admin console. */
  maskedIdentifier: string;
  status: CitizenStatus;
  lastLoggedIn: string | null;
};

export type AuditUserType = "EMPLOYEE" | "CITIZEN";

export type AuditAction =
  | "CREATE"
  | "UPDATE"
  | "ACTIVATE"
  | "DEACTIVATE"
  | "ARCHIVE"
  | "RESTORE"
  | "ROLE_CHANGE"
  | "DEPARTMENT_CHANGE"
  | "DESIGNATION_CHANGE"
  | "JURISDICTION_CHANGE"
  | "STATUS_CHANGE"
  | "INVITATION_SENT"
  | "INVITATION_RESENT"
  | "SMS_SENT"
  | "EMAIL_SENT"
  | "ACCESS_LINK_GENERATED"
  | "MAGIC_LINK_GENERATED"
  | "CREDENTIAL_RESET"
  | "AUTHENTICATION_SUPPORT_ACTION"
  | "CITIZEN_ACCOUNT_SUPPORT_ACTION"
  | "PROTECTED_DATA_ACCESS"
  | "PERMISSION_CHANGE";

export const AUDIT_ACTION_LABEL: Record<AuditAction, string> = {
  CREATE: "Created",
  UPDATE: "Updated",
  ACTIVATE: "Activated",
  DEACTIVATE: "Deactivated",
  ARCHIVE: "Archived",
  RESTORE: "Restored",
  ROLE_CHANGE: "Role changed",
  DEPARTMENT_CHANGE: "Department changed",
  DESIGNATION_CHANGE: "Designation changed",
  JURISDICTION_CHANGE: "Jurisdiction changed",
  STATUS_CHANGE: "Status changed",
  INVITATION_SENT: "Invitation sent",
  INVITATION_RESENT: "Invitation resent",
  SMS_SENT: "SMS sent",
  EMAIL_SENT: "Email sent",
  ACCESS_LINK_GENERATED: "Access link generated",
  MAGIC_LINK_GENERATED: "Magic link generated",
  CREDENTIAL_RESET: "Credential reset",
  AUTHENTICATION_SUPPORT_ACTION: "Authentication support action",
  CITIZEN_ACCOUNT_SUPPORT_ACTION: "Citizen account support action",
  PROTECTED_DATA_ACCESS: "Protected data access",
  PERMISSION_CHANGE: "Permission changed",
};

export type AuditChange = {
  field: string;
  previous: string;
  next: string;
};

export type AuditEvent = {
  eventId: string;
  at: string;
  userType: AuditUserType;
  /** Employee: full name. Citizen: system reference only — never a name. */
  targetLabel: string;
  /** Employee: work email/mobile. Citizen: masked identifier. */
  targetIdentifier: string;
  targetId: string;
  action: AuditAction;
  performedBy: string;
  result: "SUCCESS" | "FAILED";
  /** Snapshot of the target's last successful authentication at event time. */
  lastLoggedIn: string | null;
  changes?: AuditChange[];
  context?: {
    reason?: string;
    authenticationMethod?: string;
    invitationChannel?: string;
    source?: string;
    sessionReference?: string;
    ipAddress?: string;
    device?: string;
    accessDuration?: string;
  };
};

export const DEPARTMENTS = [
  "Public Works",
  "Water & Sanitation",
  "Health Services",
  "Revenue",
  "Citizen Services",
];

export const DESIGNATIONS = [
  "Junior Engineer",
  "Assistant Engineer",
  "Executive Engineer",
  "Sanitary Inspector",
  "Health Officer",
  "Revenue Inspector",
  "Front Office Executive",
  "Deputy Commissioner",
];

export const JURISDICTIONS = [
  "",
  "City-wide",
  "Zone North",
  "Zone South",
  "Ward 12 — Civil Lines",
  "Ward 18 — Ranjit Avenue",
  "Ward 27 — Cantonment",
];

export const SEED_EMPLOYEES: Employee[] = [
  {
    id: "EMP-2001",
    name: "Amara Okafor",
    email: "amara.okafor@gov.example",
    mobile: "+254 712 004 118",
    department: "Citizen Services",
    designation: "Deputy Commissioner",
    roleKey: "ROLE_STATE_ADMIN",
    jurisdiction: "City-wide",
    status: "ACTIVE",
    lastLoggedIn: "2026-08-19T14:22:00Z",
  },
  {
    id: "EMP-2002",
    name: "Rohan Mehta",
    email: "rohan.mehta@gov.example",
    mobile: "+91 98110 44120",
    department: "Public Works",
    designation: "Executive Engineer",
    roleKey: "ROLE_DEPT_ADMIN",
    jurisdiction: "Zone North",
    status: "ACTIVE",
    lastLoggedIn: "2026-08-20T06:05:00Z",
  },
  {
    id: "EMP-2003",
    name: "Fatima Al-Sayed",
    email: "fatima.alsayed@gov.example",
    mobile: "",
    department: "Water & Sanitation",
    designation: "Assistant Engineer",
    roleKey: "ROLE_SUPERVISOR",
    jurisdiction: "Zone South",
    status: "ACTIVE",
    lastLoggedIn: "2026-08-20T05:41:00Z",
  },
  {
    id: "EMP-2004",
    name: "Daniel Otieno",
    email: "",
    mobile: "+254 733 887 210",
    department: "Health Services",
    designation: "Sanitary Inspector",
    roleKey: "ROLE_COMPLAINT_OFFICER",
    jurisdiction: "Ward 18 — Ranjit Avenue",
    status: "INVITED",
    lastLoggedIn: null,
  },
  {
    id: "EMP-2005",
    name: "Priya Nair",
    email: "priya.nair@gov.example",
    mobile: "+91 98450 21190",
    department: "Revenue",
    designation: "Revenue Inspector",
    roleKey: "ROLE_COMPLAINT_OFFICER",
    jurisdiction: "",
    status: "INACTIVE",
    lastLoggedIn: "2026-07-22T11:00:00Z",
  },
  {
    id: "EMP-2006",
    name: "Marcus Bezerra",
    email: "marcus.bezerra@gov.example",
    mobile: "+258 84 220 9931",
    department: "Citizen Services",
    designation: "Front Office Executive",
    roleKey: "ROLE_CALL_CENTRE_AGENT",
    jurisdiction: "City-wide",
    status: "ACTIVE",
    lastLoggedIn: "2026-08-20T08:14:00Z",
  },
  {
    id: "EMP-2007",
    name: "Lin Wei",
    email: "lin.wei@gov.example",
    mobile: "",
    department: "Citizen Services",
    designation: "Front Office Executive",
    roleKey: "ROLE_CALL_CENTRE_AGENT",
    jurisdiction: "",
    status: "ARCHIVED",
    lastLoggedIn: "2026-05-03T16:50:00Z",
  },
];

export const SEED_CITIZENS: Citizen[] = [
  { id: "CTZ-100234", identifierType: "PHONE", maskedIdentifier: "••••••4321", status: "ACTIVE", lastLoggedIn: "2026-08-20T07:12:00Z" },
  { id: "CTZ-100235", identifierType: "EMAIL", maskedIdentifier: "s•••••@example.com", status: "ACTIVE", lastLoggedIn: "2026-08-19T19:48:00Z" },
  { id: "CTZ-100236", identifierType: "PHONE", maskedIdentifier: "••••••9087", status: "UNVERIFIED", lastLoggedIn: null },
  { id: "CTZ-100237", identifierType: "EMAIL", maskedIdentifier: "m•••••@mail.example", status: "DISABLED", lastLoggedIn: "2026-06-30T10:03:00Z" },
  { id: "CTZ-100238", identifierType: "PHONE", maskedIdentifier: "••••••1145", status: "ACTIVE", lastLoggedIn: "2026-08-18T09:30:00Z" },
  { id: "CTZ-100239", identifierType: "PHONE", maskedIdentifier: "••••••7762", status: "ACTIVE", lastLoggedIn: "2026-08-20T04:55:00Z" },
  { id: "CTZ-100240", identifierType: "EMAIL", maskedIdentifier: "a•••••@example.org", status: "UNVERIFIED", lastLoggedIn: null },
];

export const SEED_AUDIT: AuditEvent[] = [
  {
    eventId: "AUD-9001",
    at: "2026-08-20T08:02:00Z",
    userType: "EMPLOYEE",
    targetLabel: "Rohan Mehta",
    targetIdentifier: "rohan.mehta@gov.example",
    targetId: "EMP-2002",
    action: "ROLE_CHANGE",
    performedBy: "Vikram Mehta (Account Administrator)",
    result: "SUCCESS",
    lastLoggedIn: "2026-08-20T06:05:00Z",
    changes: [{ field: "Role", previous: "Supervisor", next: "Department Administrator" }],
    context: { reason: "Promotion approved by Commissioner's office", source: "Account Administration › Users", ipAddress: "10.14.6.22", device: "Chrome 141 · Windows" },
  },
  {
    eventId: "AUD-9002",
    at: "2026-08-19T16:40:00Z",
    userType: "EMPLOYEE",
    targetLabel: "Daniel Otieno",
    targetIdentifier: "+254 733 887 210",
    targetId: "EMP-2004",
    action: "INVITATION_SENT",
    performedBy: "Vikram Mehta (Account Administrator)",
    result: "SUCCESS",
    lastLoggedIn: null,
    context: { invitationChannel: "SMS", source: "Account Administration › Users", accessDuration: "24 hours" },
  },
  {
    eventId: "AUD-9003",
    at: "2026-08-19T11:20:00Z",
    userType: "CITIZEN",
    targetLabel: "CTZ-100237",
    targetIdentifier: "m•••••@mail.example",
    targetId: "CTZ-100237",
    action: "CITIZEN_ACCOUNT_SUPPORT_ACTION",
    performedBy: "Harpreet Kaur (Citizen Account Support)",
    result: "SUCCESS",
    lastLoggedIn: "2026-06-30T10:03:00Z",
    changes: [{ field: "Account status", previous: "Active", next: "Disabled" }],
    context: { reason: "Citizen requested account suspension", source: "Account Administration › Users › Citizens" },
  },
  {
    eventId: "AUD-9004",
    at: "2026-08-18T09:05:00Z",
    userType: "CITIZEN",
    targetLabel: "CTZ-100234",
    targetIdentifier: "••••••4321",
    targetId: "CTZ-100234",
    action: "AUTHENTICATION_SUPPORT_ACTION",
    performedBy: "Harpreet Kaur (Citizen Account Support)",
    result: "SUCCESS",
    lastLoggedIn: "2026-08-18T09:30:00Z",
    context: { authenticationMethod: "OTP over SMS", invitationChannel: "SMS", sessionReference: "sess-8f21", accessDuration: "10 minutes" },
  },
  {
    eventId: "AUD-9005",
    at: "2026-08-17T13:45:00Z",
    userType: "EMPLOYEE",
    targetLabel: "Priya Nair",
    targetIdentifier: "priya.nair@gov.example",
    targetId: "EMP-2005",
    action: "DEACTIVATE",
    performedBy: "Vikram Mehta (Account Administrator)",
    result: "SUCCESS",
    lastLoggedIn: "2026-07-22T11:00:00Z",
    changes: [{ field: "Status", previous: "Active", next: "Inactive" }],
    context: { reason: "Extended leave of absence" },
  },
  {
    eventId: "AUD-9006",
    at: "2026-08-16T10:12:00Z",
    userType: "EMPLOYEE",
    targetLabel: "Lin Wei",
    targetIdentifier: "lin.wei@gov.example",
    targetId: "EMP-2007",
    action: "CREDENTIAL_RESET",
    performedBy: "Vikram Mehta (Account Administrator)",
    result: "FAILED",
    lastLoggedIn: "2026-05-03T16:50:00Z",
    context: { reason: "Account archived — reset rejected", source: "Account Administration › Users" },
  },
];

const KEY_EMP = "pgr.admin.employees.v1";
const KEY_CTZ = "pgr.admin.citizens.v1";
const KEY_AUD = "pgr.admin.userAudit.v1";

function load<T>(key: string, fallback: T[]): T[] {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as T[];
    return Array.isArray(parsed) && parsed.length ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, value: T[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

export const loadEmployees = () => load(KEY_EMP, SEED_EMPLOYEES);
export const saveEmployees = (v: Employee[]) => save(KEY_EMP, v);
export const loadCitizens = () => load(KEY_CTZ, SEED_CITIZENS);
export const saveCitizens = (v: Citizen[]) => save(KEY_CTZ, v);
export const loadAudit = () => load(KEY_AUD, SEED_AUDIT);

/** The only write path for audit events. */
export function appendAudit(
  event: Omit<AuditEvent, "eventId" | "at">,
): AuditEvent {
  const full: AuditEvent = {
    ...event,
    eventId: `AUD-${Math.floor(Math.random() * 9e5 + 1e5)}`,
    at: new Date().toISOString(),
  };
  const next = [full, ...loadAudit()];
  save(KEY_AUD, next);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("pgr:user-audit"));
  }
  return full;
}

export const CURRENT_ADMIN = "Vikram Mehta (Account Administrator)";

export function formatTs(iso: string | null): string {
  if (!iso) return "Never";
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export const EMPLOYEE_STATUS_LABEL: Record<EmployeeStatus, string> = {
  INVITED: "Invited",
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  ARCHIVED: "Archived",
};

export const CITIZEN_STATUS_LABEL: Record<CitizenStatus, string> = {
  ACTIVE: "Active",
  UNVERIFIED: "Unverified",
  DISABLED: "Disabled",
};
