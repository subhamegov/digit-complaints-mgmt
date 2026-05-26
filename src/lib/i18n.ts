/**
 * Lightweight localization shim mirroring the DIGIT localization service contract.
 * Every visible string in the prototype is resolved via t(code) so a future
 * integration can swap this with the DIGIT localization API without UI changes.
 *
 * Codes follow DIGIT conventions:
 *   - COMMON_* for shared UI primitives
 *   - CS_* for PGR (Complaint Service) module
 *   - ACTION_* for reusable action labels
 */

export const messages: Record<string, string> = {
  // Common
  COMMON_DASHBOARD: "Dashboard",
  COMMON_INBOX: "Inbox",
  COMMON_MY_TASKS: "My Tasks",
  COMMON_REPORTS: "Reports",
  COMMON_CONFIGURATION: "Configuration",
  COMMON_USERS: "Users & Roles",
  COMMON_AUDIT_LOG: "Audit Log",
  COMMON_WARD: "Locality",
  COMMON_LOCALITY: "Locality",
  COMMON_MOBILE_NUMBER: "Mobile Number",
  COMMON_NAME: "Name",
  COMMON_ADDRESS: "Address",
  COMMON_DATE: "Date",
  COMMON_FROM: "From",
  COMMON_TO: "To",
  COMMON_VIEW_DETAILS: "View Details",
  COMMON_SEARCH: "Search",
  COMMON_FILTER: "Filter",
  COMMON_RESET: "Reset",
  COMMON_CLOSE: "Close",
  COMMON_CANCEL: "Cancel",
  COMMON_SAVE: "Save",
  COMMON_SUBMIT: "Submit",
  COMMON_DOWNLOAD: "Download",
  COMMON_UPLOAD: "Upload",
  COMMON_EDIT: "Edit",
  COMMON_ADD: "Add",
  COMMON_REMOVE: "Remove",
  COMMON_BACK: "Back",
  COMMON_NEXT: "Next",
  COMMON_TENANT: "ULB",
  COMMON_JURISDICTION: "Jurisdiction",
  COMMON_ROLE: "Role",
  COMMON_SIGN_IN: "Sign In",
  COMMON_SIGN_OUT: "Sign Out",
  COMMON_LANGUAGE: "Language",
  COMMON_NO_DATA: "No records found",
  COMMON_LOADING: "Loading…",
  COMMON_OF: "of",
  COMMON_SHOWING: "Showing",
  COMMON_ALL: "All",
  COMMON_NEW: "New",

  // PGR labels
  CS_HEADER_NEW_COMPLAINT: "Register New Complaint",
  CS_COMPLAINT_NO: "Complaint No.",
  CS_COMPLAINT_TYPE: "Complaint Type",
  CS_COMPLAINT_CATEGORY: "Category",
  CS_COMPLAINT_STATUS: "Complaint Status",
  CS_COMPLAINT_DESCRIPTION: "Description",
  CS_COMPLAINT_LOCATION: "Location",
  CS_COMPLAINT_DETAILS: "Complaint Details",
  CS_CITIZEN_DETAILS: "Citizen Details",
  CS_ASSIGNED_OFFICER: "Assigned Officer",
  CS_DEPARTMENT: "Department",
  CS_SLA_STATUS: "SLA Status",
  CS_SLA_REMAINING: "SLA Remaining",
  CS_PRIORITY: "Priority",
  CS_FILED_ON: "Filed On",
  CS_LAST_UPDATED: "Last Updated",
  CS_CHANNEL: "Channel",
  CS_ATTACHMENTS: "Attachments",
  CS_WORKFLOW_HISTORY: "Workflow History",
  CS_COMMENTS: "Comments & Notes",
  CS_RESOLUTION_NOTE: "Resolution Note",
  CS_ESCALATIONS: "Escalations",
  CS_DASHBOARD_TITLE: "PGR Operations Dashboard",
  CS_TOTAL_COMPLAINTS: "Total Complaints",
  CS_OPEN_COMPLAINTS: "Open",
  CS_RESOLVED_COMPLAINTS: "Resolved",
  CS_SLA_BREACHED: "SLA Breached",
  CS_AVG_RESOLUTION: "Avg. Resolution Time",
  CS_REOPEN_RATE: "Reopen Rate",
  CS_CITIZEN_SATISFACTION: "Citizen Satisfaction",

  // Action labels (reusable)
  ACTION_ASSIGN_OFFICER: "Assign Officer",
  ACTION_REASSIGN: "Reassign",
  ACTION_RESOLVE: "Resolve",
  ACTION_REJECT: "Reject",
  ACTION_REOPEN: "Reopen",
  ACTION_ESCALATE: "Escalate",
  ACTION_APPROVE: "Approve",
  ACTION_ADD_COMMENT: "Add Comment",
  ACTION_UPDATE_STATUS: "Update Status",
  ACTION_REGISTER: "Register Complaint",

  // Statuses
  STATUS_OPEN: "Open",
  STATUS_ASSIGNED: "Assigned",
  STATUS_IN_PROGRESS: "In Progress",
  STATUS_RESOLVED: "Resolved",
  STATUS_REJECTED: "Rejected",
  STATUS_REOPENED: "Reopened",
  STATUS_CLOSED: "Closed",

  SLA_WITHIN: "Within SLA",
  SLA_NEARING: "Nearing Breach",
  SLA_BREACHED: "Breached",

  // Empty states
  EMPTY_INBOX: "No complaints match the current filters.",
  EMPTY_TASKS: "You have no assigned tasks.",
};

export function t(code: string, fallback?: string): string {
  return messages[code] ?? fallback ?? code;
}
