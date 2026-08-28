/**
 * Prototype-only store for the approval-based account creation variation.
 * The existing direct-provisioning journey does not use any of this.
 */
export type RequestStatus = "pending_approval" | "approved" | "rejected";
export type WorkspaceStatus = "not_started" | "provisioning" | "active";

export interface AccountRequest {
  id: string;
  organisationName: string;
  organisationCode: string;
  country: string;
  requesterName: string;
  requesterEmail: string;
  languages: string;
  timezone: string;
  financialYear: string;
  employeeUrl: string;
  citizenUrl: string;
  submittedAt: string;
  status: RequestStatus;
  workspaceStatus: WorkspaceStatus;
  rejectionReason?: string;
}

const KEY = "digit.account-requests.v1";
export const MY_REQUEST_KEY = "digit.account-request.mine";

const DEMO: AccountRequest[] = [
  {
    id: "REQ-001",
    organisationName: "Makueni County Government",
    organisationCode: "KE-MCG-02",
    country: "Kenya",
    requesterName: "Manjit Singh",
    requesterEmail: "manjit.singh@example.gov",
    languages: "English, Swahili",
    timezone: "Africa/Nairobi (EAT)",
    financialYear: "July – June",
    employeeUrl: "makueni.cms.digit.org/employee",
    citizenUrl: "makueni.cms.digit.org",
    submittedAt: "2026-08-26T09:20:00.000Z",
    status: "pending_approval",
    workspaceStatus: "not_started",
  },
  {
    id: "REQ-002",
    organisationName: "Water Services Regulatory Board",
    organisationCode: "KE-WSRB",
    country: "Kenya",
    requesterName: "Anita Rao",
    requesterEmail: "anita.rao@example.gov",
    languages: "English",
    timezone: "Africa/Nairobi (EAT)",
    financialYear: "July – June",
    employeeUrl: "wasreb.cms.digit.org/employee",
    citizenUrl: "wasreb.cms.digit.org",
    submittedAt: "2026-08-24T14:05:00.000Z",
    status: "approved",
    workspaceStatus: "provisioning",
  },
];

function read(): AccountRequest[] {
  if (typeof window === "undefined") return DEMO;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEMO;
    const parsed = JSON.parse(raw) as AccountRequest[];
    return Array.isArray(parsed) && parsed.length ? parsed : DEMO;
  } catch {
    return DEMO;
  }
}

function write(list: AccountRequest[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(list));
}

export function listAccountRequests(): AccountRequest[] {
  return [...read()].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
}

export function getAccountRequest(id: string): AccountRequest | undefined {
  return read().find((r) => r.id === id);
}

export function submitAccountRequest(input: Omit<AccountRequest, "id" | "submittedAt" | "status" | "workspaceStatus">): AccountRequest {
  const list = read();
  const next: AccountRequest = {
    ...input,
    id: `REQ-${String(list.length + 1).padStart(3, "0")}`,
    submittedAt: new Date().toISOString(),
    status: "pending_approval",
    workspaceStatus: "not_started",
  };
  write([next, ...list]);
  if (typeof window !== "undefined") window.sessionStorage.setItem(MY_REQUEST_KEY, next.id);
  return next;
}

export function approveAccountRequest(id: string): AccountRequest | undefined {
  const list = read().map((r) =>
    r.id === id ? { ...r, status: "approved" as const, workspaceStatus: "provisioning" as const, rejectionReason: undefined } : r,
  );
  write(list);
  return list.find((r) => r.id === id);
}

export function rejectAccountRequest(id: string, reason: string): AccountRequest | undefined {
  const list = read().map((r) =>
    r.id === id ? { ...r, status: "rejected" as const, workspaceStatus: "not_started" as const, rejectionReason: reason } : r,
  );
  write(list);
  return list.find((r) => r.id === id);
}

export const REQUEST_STATUS_LABEL: Record<RequestStatus, string> = {
  pending_approval: "Pending approval",
  approved: "Approved",
  rejected: "Rejected",
};

export function formatSubmitted(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
}
