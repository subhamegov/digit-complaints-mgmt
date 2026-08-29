/**
 * Shared catalog of console roles available across the admin experience.
 * Used by Users page (assignment dropdown) and Roles & Permissions page
 * to ensure both surfaces stay in sync.
 *
 * Platform Administrator is intentionally excluded - it is a system role
 * managed outside the account administration console.
 */

export type AdminRoleKey =
  | "ROLE_STATE_ADMIN"
  | "ROLE_DEPT_ADMIN"
  | "ROLE_SUPERVISOR"
  | "ROLE_COMPLAINT_OFFICER"
  | "ROLE_CALL_CENTRE_AGENT";

export type AdminRoleDefinition = {
  key: AdminRoleKey;
  label: string;
  description: string;
  scope: "Account" | "Department" | "Team" | "Individual";
};

export const ADMIN_ROLES: AdminRoleDefinition[] = [
  {
    key: "ROLE_STATE_ADMIN",
    label: "State Administrator",
    description:
      "Full account-wide authority. Manages users, roles, configuration, and oversees all complaints across departments.",
    scope: "Account",
  },
  {
    key: "ROLE_DEPT_ADMIN",
    label: "Department Administrator",
    description:
      "Manages users, workflows, and complaints within a single department. Cannot alter account-level configuration.",
    scope: "Department",
  },
  {
    key: "ROLE_SUPERVISOR",
    label: "Supervisor",
    description:
      "Oversees a team of officers and agents. Reassigns work, monitors SLAs, and approves escalations.",
    scope: "Team",
  },
  {
    key: "ROLE_COMPLAINT_OFFICER",
    label: "Complaint Officer",
    description:
      "Handles assigned complaints end-to-end: triage, investigation, communication, and resolution.",
    scope: "Individual",
  },
  {
    key: "ROLE_CALL_CENTRE_AGENT",
    label: "Call Centre Agent",
    description:
      "Captures complaints from inbound calls and citizen interactions. Routes intake to the appropriate queue.",
    scope: "Individual",
  },
];

export const ADMIN_ROLE_OPTIONS = ADMIN_ROLES.map((r) => ({
  key: r.key,
  label: r.label,
}));

export function getRoleLabel(key: string): string {
  return ADMIN_ROLES.find((r) => r.key === key)?.label ?? key;
}
