/**
 * RBAC primitives for the PGR prototype.
 *
 * Components consume `useRbac()` and either:
 *   - read `role`, `tenant`, `jurisdiction`
 *   - check `hasPermission(code)` / `hasAnyPermission([...])`
 *   - wrap UI in `<Can perm="…">` / `<Can anyOf={[…]}>`
 *
 * Permission codes are aligned with DIGIT-style action codes so a future
 * Access Control service integration is a one-line swap inside the provider.
 *
 * No access assumption is hard-coded in UI. Components stay permission-aware:
 * pass `permission` to action buttons; table columns declare `requires` in
 * their column definitions; nav items declare `requires` in the registry.
 */

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export type Role =
  | "CSR" // Citizen Service Representative — registers complaints
  | "GRO" // Grievance Routing Officer — assigns / reassigns / rejects
  | "LME" // Last-Mile Employee — resolves
  | "DEPT_HEAD" // Department head — escalations, approvals
  | "ADMIN"; // System admin — configuration, users, audit

export type Permission =
  | "PGR_COMPLAINT_VIEW"
  | "PGR_COMPLAINT_CREATE"
  | "PGR_COMPLAINT_ASSIGN"
  | "PGR_COMPLAINT_REASSIGN"
  | "PGR_COMPLAINT_RESOLVE"
  | "PGR_COMPLAINT_REJECT"
  | "PGR_COMPLAINT_REOPEN"
  | "PGR_COMPLAINT_ESCALATE"
  | "PGR_COMPLAINT_COMMENT"
  | "PGR_INBOX_VIEW"
  | "PGR_TASKS_VIEW"
  | "PGR_DASHBOARD_VIEW"
  | "PGR_REPORTS_VIEW"
  | "PGR_SLA_VIEW"
  | "PGR_ESCALATION_VIEW"
  | "PGR_CITIZEN_PII_VIEW"
  | "MDMS_COMPLAINT_TYPE_MANAGE"
  | "MDMS_WORKFLOW_MANAGE"
  | "HRMS_USER_MANAGE"
  | "AUDIT_LOG_VIEW";

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  CSR: [
    "PGR_DASHBOARD_VIEW",
    "PGR_INBOX_VIEW",
    "PGR_COMPLAINT_VIEW",
    "PGR_COMPLAINT_CREATE",
    "PGR_COMPLAINT_COMMENT",
    "PGR_CITIZEN_PII_VIEW",
  ],
  GRO: [
    "PGR_DASHBOARD_VIEW",
    "PGR_INBOX_VIEW",
    "PGR_TASKS_VIEW",
    "PGR_COMPLAINT_VIEW",
    "PGR_COMPLAINT_ASSIGN",
    "PGR_COMPLAINT_REASSIGN",
    "PGR_COMPLAINT_REJECT",
    "PGR_COMPLAINT_COMMENT",
    "PGR_SLA_VIEW",
    "PGR_ESCALATION_VIEW",
    "PGR_REPORTS_VIEW",
    "PGR_CITIZEN_PII_VIEW",
  ],
  LME: [
    "PGR_TASKS_VIEW",
    "PGR_COMPLAINT_VIEW",
    "PGR_COMPLAINT_RESOLVE",
    "PGR_COMPLAINT_COMMENT",
  ],
  DEPT_HEAD: [
    "PGR_DASHBOARD_VIEW",
    "PGR_INBOX_VIEW",
    "PGR_TASKS_VIEW",
    "PGR_COMPLAINT_VIEW",
    "PGR_COMPLAINT_REASSIGN",
    "PGR_COMPLAINT_ESCALATE",
    "PGR_COMPLAINT_COMMENT",
    "PGR_SLA_VIEW",
    "PGR_ESCALATION_VIEW",
    "PGR_REPORTS_VIEW",
    "PGR_CITIZEN_PII_VIEW",
    "AUDIT_LOG_VIEW",
  ],
  ADMIN: [
    "PGR_DASHBOARD_VIEW",
    "PGR_INBOX_VIEW",
    "PGR_TASKS_VIEW",
    "PGR_COMPLAINT_VIEW",
    "PGR_REPORTS_VIEW",
    "PGR_SLA_VIEW",
    "PGR_ESCALATION_VIEW",
    "MDMS_COMPLAINT_TYPE_MANAGE",
    "MDMS_WORKFLOW_MANAGE",
    "HRMS_USER_MANAGE",
    "AUDIT_LOG_VIEW",
  ],
};

export const ROLE_LABEL: Record<Role, string> = {
  CSR: "Citizen Service Rep.",
  GRO: "Grievance Routing Officer",
  LME: "Field Employee",
  DEPT_HEAD: "Department Head",
  ADMIN: "System Administrator",
};

export type Tenant = { code: string; name: string };
export type Jurisdiction = { code: string; name: string };

export const TENANTS: Tenant[] = [
  { code: "pb.amritsar", name: "Amritsar Municipal Corp." },
  { code: "pb.jalandhar", name: "Jalandhar Municipal Corp." },
  { code: "pb.ludhiana", name: "Ludhiana Municipal Corp." },
];

export const JURISDICTIONS: Jurisdiction[] = [
  { code: "ALL", name: "All Localities" },
  { code: "W-12", name: "Civil Lines" },
  { code: "W-18", name: "Ranjit Avenue" },
  { code: "W-21", name: "Hall Bazaar" },
  { code: "W-27", name: "Cantonment" },
];

interface RbacState {
  role: Role;
  setRole: (r: Role) => void;
  tenant: Tenant;
  setTenant: (t: Tenant) => void;
  jurisdiction: Jurisdiction;
  setJurisdiction: (j: Jurisdiction) => void;
  hasPermission: (p: Permission) => boolean;
  hasAnyPermission: (p: Permission[]) => boolean;
  userName: string;
}

const RbacContext = createContext<RbacState | null>(null);

export function RbacProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>("GRO");
  const [tenant, setTenant] = useState<Tenant>(TENANTS[0]);
  const [jurisdiction, setJurisdiction] = useState<Jurisdiction>(JURISDICTIONS[0]);

  const value = useMemo<RbacState>(() => {
    const perms = new Set(ROLE_PERMISSIONS[role]);
    return {
      role,
      setRole,
      tenant,
      setTenant,
      jurisdiction,
      setJurisdiction,
      hasPermission: (p) => perms.has(p),
      hasAnyPermission: (ps) => ps.some((p) => perms.has(p)),
      userName: roleUser(role),
    };
  }, [role, tenant, jurisdiction]);

  return <RbacContext.Provider value={value}>{children}</RbacContext.Provider>;
}

function roleUser(role: Role): string {
  switch (role) {
    case "CSR": return "Harpreet Kaur";
    case "GRO": return "Manjit Singh";
    case "LME": return "Ramesh Kumar";
    case "DEPT_HEAD": return "Dr. Anita Sharma";
    case "ADMIN": return "Vikram Mehta";
  }
}

export function useRbac(): RbacState {
  const ctx = useContext(RbacContext);
  if (!ctx) throw new Error("useRbac must be used inside RbacProvider");
  return ctx;
}

/** Declarative permission gate. Hides children when not permitted. */
export function Can({
  perm,
  anyOf,
  fallback = null,
  children,
}: {
  perm?: Permission;
  anyOf?: Permission[];
  fallback?: ReactNode;
  children: ReactNode;
}) {
  const { hasPermission, hasAnyPermission } = useRbac();
  const ok = perm
    ? hasPermission(perm)
    : anyOf
    ? hasAnyPermission(anyOf)
    : true;
  return <>{ok ? children : fallback}</>;
}
