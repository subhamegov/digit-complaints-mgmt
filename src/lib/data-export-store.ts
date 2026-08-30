/**
 * Account Administration > Data & Export (prototype service layer).
 *
 * This module is the single interface the UI uses for export sources,
 * destinations, jobs and runs. Today it is backed by localStorage with
 * account-scoped mock data; every function is shaped so it can be swapped for
 * a real backend call without changing the UI.
 *
 * Isolation invariants (kept even in the prototype):
 *   - Everything is filtered by `ACCOUNT_ID`; nothing from another account is
 *     ever loaded, listed or returned.
 *   - The Working Context locality is never used to scope export data.
 *   - Secrets (passwords, secret access keys, private keys, session tokens,
 *     passphrases) are NEVER stored in the readable records. Only a masked
 *     hint plus a secret-store reference is kept.
 *   - Audit events and run history are written from safe values only.
 */

import { useSyncExternalStore } from "react";
import { appendAudit, CURRENT_ADMIN, type AuditAction } from "@/lib/user-admin-store";

/* ------------------------------------------------------------------ */
/* Account context                                                     */
/* ------------------------------------------------------------------ */

export const ACCOUNT_ID = "acc.makueni.cg";
export const ACCOUNT_NAME = "Makueni County Government";
export const ACCOUNT_TIMEZONE = "Africa/Nairobi";
export const ACCOUNT_ADMIN_EMAIL = "vikram.mehta@makueni.go.ke";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export type SourceType = "TRANSACTIONAL" | "ANALYTICAL";
export type ExportMode = "FULL" | "INCREMENTAL";

export type ExportDataSource = {
  source_id: string;
  account_id: string;
  friendly_name: string;
  source_type: SourceType;
  environment: string;
  supported_export_modes: ExportMode[];
  supported_formats: string[];
  export_enabled: boolean;
  approximate_size?: string;
  last_updated?: string;
};

export type DestinationType = "S3" | "SFTP";
export type ConnectionStatus = "CONNECTED" | "CONNECTION_FAILED" | "NOT_TESTED";

export type ExportDestination = {
  destination_id: string;
  account_id: string;
  name: string;
  type: DestinationType;
  /** Human readable location, e.g. bucket/prefix or host:port/dir. */
  location: string;
  authentication: string;
  /** Masked hint only, e.g. "AKIA****WXYZ". Never a usable secret. */
  secret_hint: string | null;
  /** Reference into the platform secret store. Never the secret itself. */
  secret_ref: string | null;
  region?: string;
  encryption?: string;
  external_id?: string;
  connection_status: ConnectionStatus;
  last_tested_at: string | null;
  created_at: string;
};

export type ScheduleFrequency = "DAILY" | "WEEKLY" | "MONTHLY" | "CUSTOM";

export type ExportSchedule = {
  frequency: ScheduleFrequency;
  time: string; // HH:mm
  day_of_week?: string;
  day_of_month?: string;
  every_n_days?: number;
};

export type RetryPolicy = {
  enabled: boolean;
  attempts: number;
  strategy: "exponential_backoff";
};

export type JobStatus = "ACTIVE" | "PAUSED" | "DRAFT";

export type ExportJob = {
  job_id: string;
  account_id: string;
  name: string;
  source_id: string;
  source_type: SourceType;
  destination_id: string;
  export_mode: ExportMode;
  format: string;
  compression: "GZIP" | "NONE";
  schedule_type: "MANUAL" | "SCHEDULED";
  schedule: ExportSchedule | null;
  timezone: string;
  retry_policy: RetryPolicy;
  notify_on_failure: boolean;
  notification_recipients: string[];
  status: JobStatus;
  created_by: string;
  created_at: string;
  updated_by: string;
  updated_at: string;
};

export type RunStatus =
  | "QUEUED"
  | "RUNNING"
  | "COMPLETED"
  | "COMPLETED_WITH_WARNINGS"
  | "FAILED"
  | "CANCELLED";

export type RunTrigger = "MANUAL" | "SCHEDULED" | "RETRY";

export type ErrorCategory =
  | "SOURCE_UNAVAILABLE"
  | "SOURCE_PERMISSION_DENIED"
  | "EXPORT_GENERATION_FAILED"
  | "DESTINATION_UNAVAILABLE"
  | "DESTINATION_AUTHENTICATION_FAILED"
  | "DESTINATION_PERMISSION_DENIED"
  | "TRANSFER_FAILED"
  | "INSUFFICIENT_STORAGE"
  | "ENCRYPTION_ERROR"
  | "TIMEOUT"
  | "UNKNOWN";

export type TimelineEvent = { stage: string; at: string; detail?: string };

export type ExportRun = {
  run_id: string;
  job_id: string;
  account_id: string;
  source_id: string;
  destination_id: string;
  trigger: RunTrigger;
  triggered_by: string | null;
  parent_run_id: string | null;
  status: RunStatus;
  queued_at: string;
  started_at: string | null;
  completed_at: string | null;
  file_path: string | null;
  file_name: string | null;
  file_size_bytes: number | null;
  checksum: string | null;
  error_category: ErrorCategory | null;
  error_reference_id: string | null;
  error_message_safe: string | null;
  failure_stage: string | null;
  retry_number: number;
  timeline: TimelineEvent[];
  warnings?: string[];
};

/* ------------------------------------------------------------------ */
/* Labels                                                              */
/* ------------------------------------------------------------------ */

export const RUN_STATUS_LABEL: Record<RunStatus, string> = {
  QUEUED: "Queued",
  RUNNING: "Running",
  COMPLETED: "Completed",
  COMPLETED_WITH_WARNINGS: "Completed with warnings",
  FAILED: "Failed",
  CANCELLED: "Cancelled",
};

export const JOB_STATUS_LABEL: Record<JobStatus, string> = {
  ACTIVE: "Active",
  PAUSED: "Paused",
  DRAFT: "Draft",
};

export const TRIGGER_LABEL: Record<RunTrigger, string> = {
  MANUAL: "Manual",
  SCHEDULED: "Scheduled",
  RETRY: "Retry",
};

export const CONNECTION_STATUS_LABEL: Record<ConnectionStatus, string> = {
  CONNECTED: "Connected",
  CONNECTION_FAILED: "Connection failed",
  NOT_TESTED: "Not tested",
};

export const ERROR_CATEGORY_LABEL: Record<ErrorCategory, string> = {
  SOURCE_UNAVAILABLE: "Source unavailable",
  SOURCE_PERMISSION_DENIED: "Source permission denied",
  EXPORT_GENERATION_FAILED: "Export generation failed",
  DESTINATION_UNAVAILABLE: "Destination unavailable",
  DESTINATION_AUTHENTICATION_FAILED: "Destination authentication failed",
  DESTINATION_PERMISSION_DENIED: "Destination permission denied",
  TRANSFER_FAILED: "Transfer failed",
  INSUFFICIENT_STORAGE: "Insufficient storage",
  ENCRYPTION_ERROR: "Encryption error",
  TIMEOUT: "Timed out",
  UNKNOWN: "Unknown error",
};

export const AWS_REGIONS = [
  "af-south-1",
  "ap-south-1",
  "eu-central-1",
  "eu-west-1",
  "me-central-1",
  "us-east-1",
  "us-west-2",
];

export const TIMEZONES = [
  "Africa/Nairobi",
  "Africa/Lagos",
  "Asia/Kolkata",
  "Europe/London",
  "UTC",
];

/* ------------------------------------------------------------------ */
/* Account data source catalogue (backend contract stand-in)           */
/* ------------------------------------------------------------------ */

const SOURCE_CATALOGUE: ExportDataSource[] = [
  {
    source_id: "src.pgr.txn.prod",
    account_id: ACCOUNT_ID,
    friendly_name: "Complaint Management Transaction Store",
    source_type: "TRANSACTIONAL",
    environment: "Production",
    supported_export_modes: ["FULL", "INCREMENTAL"],
    supported_formats: ["Database dump", "JSON Lines"],
    export_enabled: true,
    approximate_size: "42.6 GB",
    last_updated: "2026-08-30T18:40:00.000Z",
  },
  {
    source_id: "src.pgr.txn.staging",
    account_id: ACCOUNT_ID,
    friendly_name: "Complaint Management Transaction Store (Staging)",
    source_type: "TRANSACTIONAL",
    environment: "Staging",
    supported_export_modes: ["FULL"],
    supported_formats: ["Database dump", "JSON Lines"],
    export_enabled: true,
    approximate_size: "3.1 GB",
    last_updated: "2026-08-29T21:05:00.000Z",
  },
  {
    source_id: "src.pgr.analytics.prod",
    account_id: ACCOUNT_ID,
    friendly_name: "Complaint Management Analytics Store",
    source_type: "ANALYTICAL",
    environment: "Production",
    supported_export_modes: ["FULL", "INCREMENTAL"],
    supported_formats: ["Parquet", "CSV"],
    export_enabled: true,
    approximate_size: "11.9 GB",
    last_updated: "2026-08-30T02:00:00.000Z",
  },
  {
    source_id: "src.pgr.analytics.citizen",
    account_id: ACCOUNT_ID,
    friendly_name: "Citizen Satisfaction Analytics Mart",
    source_type: "ANALYTICAL",
    environment: "Production",
    supported_export_modes: ["FULL"],
    supported_formats: ["Parquet", "CSV"],
    export_enabled: true,
    approximate_size: "780 MB",
    last_updated: "2026-08-30T02:10:00.000Z",
  },
];

/**
 * Account-scoped catalogue lookup. In production this is an authorised
 * backend call; the account is derived from the session, never the UI.
 */
export function listDataSources(): ExportDataSource[] {
  return SOURCE_CATALOGUE.filter(
    (s) => s.account_id === ACCOUNT_ID && s.export_enabled,
  );
}

export function getDataSource(id: string): ExportDataSource | undefined {
  return listDataSources().find((s) => s.source_id === id);
}

/* ------------------------------------------------------------------ */
/* Seed destinations / jobs / runs                                     */
/* ------------------------------------------------------------------ */

const SEED_DESTINATIONS: ExportDestination[] = [
  {
    destination_id: "dst-9a41",
    account_id: ACCOUNT_ID,
    name: "Makueni production S3",
    type: "S3",
    location: "makueni-complaint-exports/digit/complaints/exports/",
    authentication: "IAM role",
    secret_hint: null,
    secret_ref: "secret://acc.makueni.cg/dst-9a41/role",
    region: "af-south-1",
    encryption: "Amazon S3 managed encryption",
    external_id: "digit-acc-makueni-7c41f2",
    connection_status: "CONNECTED",
    last_tested_at: "2026-08-30T06:12:00.000Z",
    created_at: "2026-06-14T09:00:00.000Z",
  },
  {
    destination_id: "dst-3b77",
    account_id: ACCOUNT_ID,
    name: "Makueni data exchange SFTP",
    type: "SFTP",
    location: "sftp.makueni.go.ke:22/exports/complaints/",
    authentication: "SSH private key",
    secret_hint: "key ****4f8a",
    secret_ref: "secret://acc.makueni.cg/dst-3b77/ssh-key",
    connection_status: "CONNECTION_FAILED",
    last_tested_at: "2026-08-29T22:41:00.000Z",
    created_at: "2026-07-02T11:30:00.000Z",
  },
];

const SEED_JOBS: ExportJob[] = [
  {
    job_id: "job-1001",
    account_id: ACCOUNT_ID,
    name: "Daily complaint transaction export",
    source_id: "src.pgr.txn.prod",
    source_type: "TRANSACTIONAL",
    destination_id: "dst-9a41",
    export_mode: "INCREMENTAL",
    format: "JSON Lines",
    compression: "GZIP",
    schedule_type: "SCHEDULED",
    schedule: { frequency: "DAILY", time: "01:30" },
    timezone: ACCOUNT_TIMEZONE,
    retry_policy: { enabled: true, attempts: 3, strategy: "exponential_backoff" },
    notify_on_failure: true,
    notification_recipients: [ACCOUNT_ADMIN_EMAIL],
    status: "ACTIVE",
    created_by: CURRENT_ADMIN,
    created_at: "2026-06-14T09:20:00.000Z",
    updated_by: CURRENT_ADMIN,
    updated_at: "2026-08-01T07:05:00.000Z",
  },
  {
    job_id: "job-1002",
    account_id: ACCOUNT_ID,
    name: "Weekly analytics extract",
    source_id: "src.pgr.analytics.prod",
    source_type: "ANALYTICAL",
    destination_id: "dst-3b77",
    export_mode: "FULL",
    format: "Parquet",
    compression: "GZIP",
    schedule_type: "SCHEDULED",
    schedule: { frequency: "WEEKLY", time: "03:00", day_of_week: "Sunday" },
    timezone: ACCOUNT_TIMEZONE,
    retry_policy: { enabled: true, attempts: 2, strategy: "exponential_backoff" },
    notify_on_failure: true,
    notification_recipients: [ACCOUNT_ADMIN_EMAIL, "data.office@makueni.go.ke"],
    status: "ACTIVE",
    created_by: CURRENT_ADMIN,
    created_at: "2026-07-02T12:00:00.000Z",
    updated_by: CURRENT_ADMIN,
    updated_at: "2026-08-20T10:12:00.000Z",
  },
  {
    job_id: "job-1003",
    account_id: ACCOUNT_ID,
    name: "Ad hoc citizen satisfaction extract",
    source_id: "src.pgr.analytics.citizen",
    source_type: "ANALYTICAL",
    destination_id: "dst-9a41",
    export_mode: "FULL",
    format: "CSV",
    compression: "NONE",
    schedule_type: "MANUAL",
    schedule: null,
    timezone: ACCOUNT_TIMEZONE,
    retry_policy: { enabled: false, attempts: 1, strategy: "exponential_backoff" },
    notify_on_failure: true,
    notification_recipients: [ACCOUNT_ADMIN_EMAIL],
    status: "PAUSED",
    created_by: CURRENT_ADMIN,
    created_at: "2026-08-05T08:00:00.000Z",
    updated_by: CURRENT_ADMIN,
    updated_at: "2026-08-25T15:40:00.000Z",
  },
];

function tl(base: string, offsets: [string, number][]): TimelineEvent[] {
  const t = new Date(base).getTime();
  return offsets.map(([stage, sec]) => ({
    stage,
    at: new Date(t + sec * 1000).toISOString(),
  }));
}

const SEED_RUNS: ExportRun[] = [
  {
    run_id: "run-88231",
    job_id: "job-1001",
    account_id: ACCOUNT_ID,
    source_id: "src.pgr.txn.prod",
    destination_id: "dst-9a41",
    trigger: "SCHEDULED",
    triggered_by: null,
    parent_run_id: null,
    status: "COMPLETED",
    queued_at: "2026-08-30T22:30:00.000Z",
    started_at: "2026-08-30T22:30:06.000Z",
    completed_at: "2026-08-30T22:38:41.000Z",
    file_path: "s3://makueni-complaint-exports/digit/complaints/exports/",
    file_name: "complaints_transactional_2026-08-30T223000Z_run-88231.jsonl.gz",
    file_size_bytes: 486_331_904,
    checksum: "sha256:6f2c…a91b",
    error_category: null,
    error_reference_id: null,
    error_message_safe: null,
    failure_stage: null,
    retry_number: 0,
    timeline: tl("2026-08-30T22:30:00.000Z", [
      ["Queued", 0],
      ["Source connection established", 6],
      ["Export started", 9],
      ["Export generated", 340],
      ["Transfer started", 345],
      ["Transfer completed", 505],
      ["Validation completed", 515],
      ["Run completed", 521],
    ]),
  },
  {
    run_id: "run-88198",
    job_id: "job-1002",
    account_id: ACCOUNT_ID,
    source_id: "src.pgr.analytics.prod",
    destination_id: "dst-3b77",
    trigger: "SCHEDULED",
    triggered_by: null,
    parent_run_id: null,
    status: "FAILED",
    queued_at: "2026-08-30T00:00:00.000Z",
    started_at: "2026-08-30T00:00:04.000Z",
    completed_at: "2026-08-30T00:04:12.000Z",
    file_path: null,
    file_name: null,
    file_size_bytes: null,
    checksum: null,
    error_category: "DESTINATION_AUTHENTICATION_FAILED",
    error_reference_id: "ERR-4F21A9",
    error_message_safe:
      "The SFTP server rejected the configured credentials. Ask your SFTP administrator to confirm the authorised key, then test the destination again.",
    failure_stage: "Transfer started",
    retry_number: 0,
    timeline: tl("2026-08-30T00:00:00.000Z", [
      ["Queued", 0],
      ["Source connection established", 4],
      ["Export started", 8],
      ["Export generated", 190],
      ["Transfer started", 196],
    ]),
  },
  {
    run_id: "run-88205",
    job_id: "job-1002",
    account_id: ACCOUNT_ID,
    source_id: "src.pgr.analytics.prod",
    destination_id: "dst-3b77",
    trigger: "RETRY",
    triggered_by: CURRENT_ADMIN,
    parent_run_id: "run-88198",
    status: "FAILED",
    queued_at: "2026-08-30T00:20:00.000Z",
    started_at: "2026-08-30T00:20:05.000Z",
    completed_at: "2026-08-30T00:24:02.000Z",
    file_path: null,
    file_name: null,
    file_size_bytes: null,
    checksum: null,
    error_category: "DESTINATION_AUTHENTICATION_FAILED",
    error_reference_id: "ERR-4F2210",
    error_message_safe:
      "The SFTP server rejected the configured credentials. Ask your SFTP administrator to confirm the authorised key, then test the destination again.",
    failure_stage: "Transfer started",
    retry_number: 1,
    timeline: tl("2026-08-30T00:20:00.000Z", [
      ["Queued", 0],
      ["Source connection established", 5],
      ["Export started", 9],
      ["Export generated", 180],
      ["Transfer started", 188],
    ]),
  },
  {
    run_id: "run-88150",
    job_id: "job-1001",
    account_id: ACCOUNT_ID,
    source_id: "src.pgr.txn.prod",
    destination_id: "dst-9a41",
    trigger: "MANUAL",
    triggered_by: CURRENT_ADMIN,
    parent_run_id: null,
    status: "COMPLETED_WITH_WARNINGS",
    queued_at: "2026-08-29T13:02:00.000Z",
    started_at: "2026-08-29T13:02:07.000Z",
    completed_at: "2026-08-29T13:11:55.000Z",
    file_path: "s3://makueni-complaint-exports/digit/complaints/exports/",
    file_name: "complaints_transactional_2026-08-29T130200Z_run-88150.jsonl.gz",
    file_size_bytes: 402_128_896,
    checksum: "sha256:1d84…77ce",
    error_category: null,
    error_reference_id: null,
    error_message_safe: null,
    failure_stage: null,
    retry_number: 0,
    warnings: ["12 records were skipped because they were being updated during the export."],
    timeline: tl("2026-08-29T13:02:00.000Z", [
      ["Queued", 0],
      ["Source connection established", 7],
      ["Export started", 11],
      ["Export generated", 400],
      ["Transfer started", 406],
      ["Transfer completed", 560],
      ["Validation completed", 578],
      ["Run completed", 595],
    ]),
  },
];

/* ------------------------------------------------------------------ */
/* Persistence                                                         */
/* ------------------------------------------------------------------ */

const KEY = "pgr.data-export.v1";

type Snapshot = {
  destinations: ExportDestination[];
  jobs: ExportJob[];
  runs: ExportRun[];
};

const SEED: Snapshot = {
  destinations: SEED_DESTINATIONS,
  jobs: SEED_JOBS,
  runs: SEED_RUNS,
};

let cache: Snapshot | null = null;
const listeners = new Set<() => void>();

function read(): Snapshot {
  if (cache) return cache;
  if (typeof window === "undefined") return SEED;
  try {
    const raw = window.localStorage.getItem(KEY);
    cache = raw ? (JSON.parse(raw) as Snapshot) : SEED;
  } catch {
    cache = SEED;
  }
  return cache;
}

function write(next: Snapshot) {
  cache = next;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* storage unavailable - keep in-memory state */
    }
  }
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

/** Account-scoped read of everything the Data & Export screens need. */
export function useDataExport(): Snapshot {
  return useSyncExternalStore(subscribe, read, () => SEED);
}

/* ------------------------------------------------------------------ */
/* Audit helper                                                        */
/* ------------------------------------------------------------------ */

function audit(
  action: AuditAction,
  targetLabel: string,
  targetId: string,
  changes?: { field: string; previous: string; next: string }[],
  result: "SUCCESS" | "FAILED" = "SUCCESS",
) {
  appendAudit({
    userType: "CONFIGURATION",
    targetLabel,
    targetIdentifier: `Data & Export - ${ACCOUNT_NAME}`,
    targetId,
    action,
    performedBy: CURRENT_ADMIN,
    result,
    lastLoggedIn: null,
    ...(changes && changes.length ? { changes } : {}),
  });
}

/* ------------------------------------------------------------------ */
/* Formatting helpers                                                  */
/* ------------------------------------------------------------------ */

export function formatBytes(bytes: number | null): string {
  if (bytes == null) return "-";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let v = bytes;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i += 1;
  }
  return `${v.toFixed(v < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
}

export function formatDateTime(iso: string | null): string {
  if (!iso) return "-";
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(new Date(iso));
}

export function formatDuration(from: string | null, to: string | null): string {
  if (!from || !to) return "-";
  const ms = new Date(to).getTime() - new Date(from).getTime();
  if (ms < 0) return "-";
  const s = Math.round(ms / 1000);
  const m = Math.floor(s / 60);
  return m > 0 ? `${m}m ${s % 60}s` : `${s}s`;
}

export function describeSchedule(job: ExportJob): string {
  if (job.schedule_type === "MANUAL" || !job.schedule) return "Manual only";
  const s = job.schedule;
  const at = `${s.time} ${job.timezone}`;
  switch (s.frequency) {
    case "DAILY":
      return `Daily at ${at}`;
    case "WEEKLY":
      return `Weekly on ${s.day_of_week ?? "Monday"} at ${at}`;
    case "MONTHLY":
      return `Monthly on day ${s.day_of_month ?? "1"} at ${at}`;
    default:
      return `Every ${s.every_n_days ?? 2} days at ${at}`;
  }
}

/** Deterministic next-run projection. Manual runs never change this. */
export function nextRunAt(job: ExportJob): string | null {
  if (job.status !== "ACTIVE" || job.schedule_type !== "SCHEDULED" || !job.schedule) {
    return null;
  }
  const [hh, mm] = job.schedule.time.split(":").map(Number);
  const now = new Date();
  const next = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), hh || 0, mm || 0),
  );
  const step =
    job.schedule.frequency === "WEEKLY" ? 7 : job.schedule.frequency === "MONTHLY" ? 30 : 1;
  while (next.getTime() <= now.getTime()) {
    next.setUTCDate(next.getUTCDate() + step);
  }
  return next.toISOString();
}

export function runsForJob(runs: ExportRun[], jobId: string): ExportRun[] {
  return runs
    .filter((r) => r.job_id === jobId)
    .sort((a, b) => b.queued_at.localeCompare(a.queued_at));
}

export function lastRunForJob(runs: ExportRun[], jobId: string): ExportRun | undefined {
  return runsForJob(runs, jobId)[0];
}

export function fileNameFor(job: ExportJob, runId: string, at: string): string {
  const stamp = at.replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z");
  const ext =
    job.format === "Parquet"
      ? "parquet"
      : job.format === "CSV"
        ? "csv"
        : job.format === "JSON Lines"
          ? "jsonl"
          : "dump";
  const base = `complaints_${job.source_type.toLowerCase()}_${stamp}_${runId}.${ext}`;
  return job.compression === "GZIP" ? `${base}.gz` : base;
}

/* ------------------------------------------------------------------ */
/* Mutations - destinations                                            */
/* ------------------------------------------------------------------ */

export type DestinationDraft = {
  name: string;
  type: DestinationType;
  location: string;
  authentication: string;
  /** Masked hint derived from user input. The raw secret is never persisted. */
  secret_hint: string | null;
  region?: string;
  encryption?: string;
  external_id?: string;
};

const id = (p: string) => `${p}-${Math.random().toString(16).slice(2, 6)}`;

export function generateExternalId(): string {
  return `digit-${ACCOUNT_ID.replace(/\./g, "-")}-${Math.random().toString(16).slice(2, 8)}`;
}

export function maskSecret(value: string): string | null {
  const v = value.trim();
  if (!v) return null;
  if (v.length <= 8) return "****";
  return `${v.slice(0, 4)}****${v.slice(-4)}`;
}

export function createDestination(draft: DestinationDraft, tested: boolean): ExportDestination {
  const s = read();
  const dest: ExportDestination = {
    destination_id: id("dst"),
    account_id: ACCOUNT_ID,
    name: draft.name,
    type: draft.type,
    location: draft.location,
    authentication: draft.authentication,
    secret_hint: draft.secret_hint,
    secret_ref: `secret://${ACCOUNT_ID}/${draft.name.toLowerCase().replace(/\s+/g, "-")}`,
    ...(draft.region ? { region: draft.region } : {}),
    ...(draft.encryption ? { encryption: draft.encryption } : {}),
    ...(draft.external_id ? { external_id: draft.external_id } : {}),
    connection_status: tested ? "CONNECTED" : "NOT_TESTED",
    last_tested_at: tested ? new Date().toISOString() : null,
    created_at: new Date().toISOString(),
  };
  write({ ...s, destinations: [...s.destinations, dest] });
  audit("EXPORT_DESTINATION_CREATED", dest.name, dest.destination_id, [
    { field: "Type", previous: "-", next: dest.type },
    { field: "Location", previous: "-", next: dest.location },
    { field: "Authentication", previous: "-", next: dest.authentication },
  ]);
  return dest;
}

export function updateDestination(destinationId: string, patch: Partial<ExportDestination>) {
  const s = read();
  const before = s.destinations.find((d) => d.destination_id === destinationId);
  if (!before) return;
  const next = s.destinations.map((d) =>
    d.destination_id === destinationId ? { ...d, ...patch } : d,
  );
  write({ ...s, destinations: next });
  const changes = Object.keys(patch)
    .filter((k) => !["secret_ref", "secret_hint"].includes(k))
    .map((k) => ({
      field: k,
      previous: String((before as Record<string, unknown>)[k] ?? "-"),
      next: String((patch as Record<string, unknown>)[k] ?? "-"),
    }));
  audit("EXPORT_DESTINATION_UPDATED", before.name, destinationId, changes);
}

export function deleteDestination(destinationId: string): { ok: boolean; reason?: string } {
  const s = read();
  const dest = s.destinations.find((d) => d.destination_id === destinationId);
  if (!dest) return { ok: false, reason: "Destination not found." };
  const inUse = s.jobs.filter(
    (j) => j.destination_id === destinationId && j.status === "ACTIVE",
  );
  if (inUse.length) {
    return {
      ok: false,
      reason: `${inUse.length} active export job${inUse.length > 1 ? "s" : ""} still use this destination. Pause or update them first.`,
    };
  }
  write({ ...s, destinations: s.destinations.filter((d) => d.destination_id !== destinationId) });
  audit("EXPORT_DESTINATION_DELETED", dest.name, destinationId);
  return { ok: true };
}

export type ConnectionTestResult = {
  ok: boolean;
  checks: { label: string; ok: boolean }[];
  message: string;
};

const S3_CHECKS = [
  "Credentials or assumed role are valid",
  "Bucket exists",
  "Bucket region matches configuration",
  "Write access is available",
  "Configured prefix is accessible",
  "Encryption configuration is usable",
];

const SFTP_CHECKS = [
  "Host is reachable",
  "Port is reachable",
  "Host key matches",
  "Authentication succeeds",
  "Remote directory is accessible",
  "Write permission is available",
];

/**
 * Prototype connection test. A real implementation calls the backend, which
 * reads the secret from the secret store; the secret never reaches the UI.
 */
export async function testConnection(
  type: DestinationType,
  destinationId?: string,
): Promise<ConnectionTestResult> {
  await new Promise((r) => setTimeout(r, 900));
  const labels = type === "S3" ? S3_CHECKS : SFTP_CHECKS;
  const s = read();
  const dest = destinationId
    ? s.destinations.find((d) => d.destination_id === destinationId)
    : undefined;
  const failAt = dest && dest.connection_status === "CONNECTION_FAILED" ? 3 : -1;
  const checks = labels.map((label, i) => ({ label, ok: failAt < 0 || i < failAt }));
  const ok = failAt < 0;
  if (dest) {
    const nextDest: ExportDestination = {
      ...dest,
      connection_status: ok ? "CONNECTED" : "CONNECTION_FAILED",
      last_tested_at: new Date().toISOString(),
    };
    write({
      ...s,
      destinations: s.destinations.map((d) =>
        d.destination_id === dest.destination_id ? nextDest : d,
      ),
    });
    audit(
      "EXPORT_DESTINATION_TESTED",
      dest.name,
      dest.destination_id,
      [{ field: "Connection status", previous: dest.connection_status, next: nextDest.connection_status }],
      ok ? "SUCCESS" : "FAILED",
    );
  }
  return {
    ok,
    checks,
    message: ok
      ? "Connection successful"
      : `${labels[failAt]} failed. Check the configuration with your infrastructure team and test again.`,
  };
}

/* ------------------------------------------------------------------ */
/* Mutations - jobs                                                    */
/* ------------------------------------------------------------------ */

export type JobDraft = Omit<
  ExportJob,
  "job_id" | "account_id" | "created_by" | "created_at" | "updated_by" | "updated_at"
>;

export function createJob(draft: JobDraft): ExportJob {
  const s = read();
  const now = new Date().toISOString();
  const job: ExportJob = {
    ...draft,
    job_id: id("job"),
    account_id: ACCOUNT_ID,
    created_by: CURRENT_ADMIN,
    created_at: now,
    updated_by: CURRENT_ADMIN,
    updated_at: now,
  };
  write({ ...s, jobs: [...s.jobs, job] });
  audit("EXPORT_JOB_CREATED", job.name, job.job_id, [
    { field: "Data source", previous: "-", next: getDataSource(job.source_id)?.friendly_name ?? job.source_id },
    { field: "Export scope", previous: "-", next: job.export_mode },
    { field: "Schedule", previous: "-", next: describeSchedule(job) },
    { field: "Status", previous: "-", next: job.status },
  ]);
  return job;
}

export function updateJob(jobId: string, patch: Partial<ExportJob>) {
  const s = read();
  const before = s.jobs.find((j) => j.job_id === jobId);
  if (!before) return;
  const after: ExportJob = {
    ...before,
    ...patch,
    updated_by: CURRENT_ADMIN,
    updated_at: new Date().toISOString(),
  };
  write({ ...s, jobs: s.jobs.map((j) => (j.job_id === jobId ? after : j)) });
  audit("EXPORT_JOB_UPDATED", after.name, jobId, [
    { field: "Schedule", previous: describeSchedule(before), next: describeSchedule(after) },
    { field: "Format", previous: before.format, next: after.format },
  ]);
}

export function setJobStatus(jobId: string, status: JobStatus) {
  const s = read();
  const before = s.jobs.find((j) => j.job_id === jobId);
  if (!before) return;
  const after = { ...before, status, updated_by: CURRENT_ADMIN, updated_at: new Date().toISOString() };
  write({ ...s, jobs: s.jobs.map((j) => (j.job_id === jobId ? after : j)) });
  audit(
    status === "PAUSED" ? "EXPORT_JOB_PAUSED" : "EXPORT_JOB_RESUMED",
    after.name,
    jobId,
    [{ field: "Status", previous: before.status, next: status }],
  );
}

export function duplicateJob(jobId: string): ExportJob | undefined {
  const s = read();
  const src = s.jobs.find((j) => j.job_id === jobId);
  if (!src) return undefined;
  const { job_id: _j, account_id: _a, created_by: _cb, created_at: _ca, updated_by: _ub, updated_at: _ua, ...rest } = src;
  return createJob({ ...rest, name: `${src.name} (copy)`, status: "DRAFT" });
}

export function deleteJob(jobId: string) {
  const s = read();
  const job = s.jobs.find((j) => j.job_id === jobId);
  if (!job) return;
  // Run history is immutable: deleting a job never deletes its runs.
  write({ ...s, jobs: s.jobs.filter((j) => j.job_id !== jobId) });
  audit("EXPORT_JOB_DELETED", job.name, jobId);
}

/* ------------------------------------------------------------------ */
/* Mutations - runs                                                    */
/* ------------------------------------------------------------------ */

function newRun(job: ExportJob, trigger: RunTrigger, parent: ExportRun | null): ExportRun {
  const runId = `run-${Math.floor(Math.random() * 9e4 + 1e4)}`;
  const now = new Date().toISOString();
  return {
    run_id: runId,
    job_id: job.job_id,
    account_id: ACCOUNT_ID,
    source_id: job.source_id,
    destination_id: job.destination_id,
    trigger,
    triggered_by: CURRENT_ADMIN,
    parent_run_id: parent?.run_id ?? null,
    status: "QUEUED",
    queued_at: now,
    started_at: null,
    completed_at: null,
    file_path: null,
    file_name: null,
    file_size_bytes: null,
    checksum: null,
    error_category: null,
    error_reference_id: null,
    error_message_safe: null,
    failure_stage: null,
    retry_number: parent ? parent.retry_number + 1 : 0,
    timeline: [{ stage: "Queued", at: now }],
  };
}

/**
 * Advances a queued run through the simulated execution stages. In production
 * this state is produced by the export worker and streamed to the UI.
 */
function simulate(runId: string) {
  if (typeof window === "undefined") return;
  const advance = (delay: number, fn: (r: ExportRun) => ExportRun) =>
    window.setTimeout(() => {
      const s = read();
      const run = s.runs.find((r) => r.run_id === runId);
      if (!run) return;
      write({ ...s, runs: s.runs.map((r) => (r.run_id === runId ? fn(r) : r)) });
    }, delay);

  advance(1200, (r) => ({
    ...r,
    status: "RUNNING",
    started_at: new Date().toISOString(),
    timeline: [
      ...r.timeline,
      { stage: "Source connection established", at: new Date().toISOString() },
      { stage: "Export started", at: new Date().toISOString() },
    ],
  }));

  advance(4200, (r) => {
    const s = read();
    const job = s.jobs.find((j) => j.job_id === r.job_id);
    const dest = s.destinations.find((d) => d.destination_id === r.destination_id);
    const now = new Date().toISOString();
    // A destination that is known to be failing produces a real failure record.
    if (dest && dest.connection_status === "CONNECTION_FAILED") {
      return {
        ...r,
        status: "FAILED",
        completed_at: now,
        failure_stage: "Transfer started",
        error_category: "DESTINATION_AUTHENTICATION_FAILED",
        error_reference_id: `ERR-${Math.random().toString(16).slice(2, 8).toUpperCase()}`,
        error_message_safe:
          "The destination rejected the configured credentials. Confirm the credentials with your infrastructure team, then test the destination again.",
        timeline: [
          ...r.timeline,
          { stage: "Export generated", at: now },
          { stage: "Transfer started", at: now },
        ],
      };
    }
    return {
      ...r,
      status: "COMPLETED",
      completed_at: now,
      file_path:
        dest?.type === "S3" ? `s3://${dest.location}` : `sftp://${dest?.location ?? "-"}`,
      file_name: job ? fileNameFor(job, r.run_id, r.queued_at) : null,
      file_size_bytes: Math.floor(Math.random() * 4e8 + 6e7),
      checksum: `sha256:${Math.random().toString(16).slice(2, 6)}…${Math.random().toString(16).slice(2, 6)}`,
      timeline: [
        ...r.timeline,
        { stage: "Export generated", at: now },
        { stage: "Transfer started", at: now },
        { stage: "Transfer completed", at: now },
        { stage: "Validation completed", at: now },
        { stage: "Run completed", at: now },
      ],
    };
  });
}

/** Manual execution. Never alters the job's scheduled next run. */
export function runNow(jobId: string): ExportRun | undefined {
  const s = read();
  const job = s.jobs.find((j) => j.job_id === jobId);
  if (!job) return undefined;
  const run = newRun(job, "MANUAL", null);
  write({ ...s, runs: [run, ...s.runs] });
  audit("EXPORT_JOB_MANUALLY_TRIGGERED", job.name, job.job_id, [
    { field: "Run ID", previous: "-", next: run.run_id },
    { field: "Trigger", previous: "-", next: "MANUAL" },
  ]);
  simulate(run.run_id);
  return run;
}

/** Retry creates a NEW run and preserves the original failure record. */
export function retryRun(runId: string): ExportRun | undefined {
  const s = read();
  const failed = s.runs.find((r) => r.run_id === runId);
  if (!failed) return undefined;
  const job = s.jobs.find((j) => j.job_id === failed.job_id);
  if (!job) return undefined;
  const run = newRun(job, "RETRY", failed);
  write({ ...s, runs: [run, ...s.runs] });
  audit("EXPORT_RUN_RETRIED", job.name, run.run_id, [
    { field: "Retried run", previous: failed.run_id, next: run.run_id },
  ]);
  simulate(run.run_id);
  return run;
}

/** Prototype reset used by tests and demos. */
export function resetDataExport() {
  write(SEED);
}
