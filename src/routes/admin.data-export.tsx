import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  ChevronRight,
  Clock3,
  Database,
  Download,
  ExternalLink,
  FileDown,
  History,
  LockKeyhole,
  MoreHorizontal,
  Play,
  Plus,
  RefreshCw,
  Server,
  ShieldCheck,
  Trash2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ACCOUNT_ADMIN_EMAIL,
  ACCOUNT_ID,
  ACCOUNT_NAME,
  ACCOUNT_TIMEZONE,
  AWS_REGIONS,
  CONNECTION_STATUS_LABEL,
  ERROR_CATEGORY_LABEL,
  JOB_STATUS_LABEL,
  RUN_STATUS_LABEL,
  TIMEZONES,
  TRIGGER_LABEL,
  createDestination,
  createJob,
  deleteDestination,
  deleteJob,
  describeSchedule,
  formatBytes,
  formatDateTime,
  formatDuration,
  generateExternalId,
  getDataSource,
  lastRunForJob,
  listDataSources,
  maskSecret,
  nextRunAt,
  retryRun,
  runNow,
  runsForJob,
  setJobStatus,
  testConnection,
  useDataExport,
  type DestinationDraft,
  type DestinationType,
  type ExportDestination,
  type ExportJob,
  type ExportMode,
  type ExportRun,
  type ScheduleFrequency,
  type SourceType,
} from "@/lib/data-export-store";
import { Can, useRbac } from "@/lib/rbac";

export const Route = createFileRoute("/admin/data-export")({
  head: () => ({
    meta: [
      { title: "Data & Export - Account Administration" },
      {
        name: "description",
        content:
          "Configure account-wide complaint exports, secure destinations, scheduled jobs and immutable run history.",
      },
      { property: "og:title", content: "Data & Export - Account Administration" },
      {
        property: "og:description",
        content: "Manage secure transactional and analytical exports for this account.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DataExportPage,
});

const inputClass = "h-9 rounded-sm border-border bg-background text-[12px]";
const compactButton = "h-8 rounded-sm text-[12px]";
const selectClass = "h-9 w-full rounded-sm border border-border bg-background px-3 text-[12px] text-foreground";

function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "COMPLETED" || status === "CONNECTED" || status === "ACTIVE"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : status === "FAILED" || status === "CONNECTION_FAILED"
        ? "border-rose-200 bg-rose-50 text-rose-700"
        : status === "PAUSED"
          ? "border-amber-200 bg-amber-50 text-amber-700"
          : "border-border bg-muted text-muted-foreground";
  const label =
    RUN_STATUS_LABEL[status as keyof typeof RUN_STATUS_LABEL] ??
    CONNECTION_STATUS_LABEL[status as keyof typeof CONNECTION_STATUS_LABEL] ??
    JOB_STATUS_LABEL[status as keyof typeof JOB_STATUS_LABEL] ??
    status;
  return <Badge className={`rounded-sm px-2 py-0.5 text-[10px] font-medium ${tone}`}>{label}</Badge>;
}

function SectionHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        {eyebrow && <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">{eyebrow}</p>}
        <h2 className="mt-1 text-[15px] font-semibold text-foreground">{title}</h2>
        {description && <p className="mt-1 max-w-2xl text-[12px] text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}

function EmptyTable({ title, body, action }: { title: string; body: string; action?: React.ReactNode }) {
  return (
    <div className="border border-dashed border-border bg-surface px-5 py-10 text-center">
      <Database className="mx-auto h-7 w-7 text-muted-foreground" />
      <p className="mt-3 text-[13px] font-semibold text-foreground">{title}</p>
      <p className="mx-auto mt-1 max-w-md text-[12px] text-muted-foreground">{body}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[11px] font-medium text-foreground">{label}</Label>
      {children}
      {hint && <p className="text-[10.5px] leading-4 text-muted-foreground">{hint}</p>}
    </div>
  );
}

function JobSummary({ job, sources, destinations, runs }: { job: ExportJob; sources: ReturnType<typeof listDataSources>; destinations: ExportDestination[]; runs: ExportRun[] }) {
  const source = sources.find((item) => item.source_id === job.source_id);
  const destination = destinations.find((item) => item.destination_id === job.destination_id);
  const last = lastRunForJob(runs, job.job_id);
  return (
    <div className="grid gap-3 border border-border bg-background p-3 sm:grid-cols-2 xl:grid-cols-5">
      <div><p className="text-[10px] uppercase tracking-wide text-muted-foreground">Source</p><p className="mt-1 text-[12px] font-medium text-foreground">{source?.friendly_name ?? job.source_id}</p></div>
      <div><p className="text-[10px] uppercase tracking-wide text-muted-foreground">Destination</p><p className="mt-1 text-[12px] font-medium text-foreground">{destination?.name ?? job.destination_id}</p></div>
      <div><p className="text-[10px] uppercase tracking-wide text-muted-foreground">Schedule</p><p className="mt-1 text-[12px] font-medium text-foreground">{describeSchedule(job)}</p></div>
      <div><p className="text-[10px] uppercase tracking-wide text-muted-foreground">Last run</p><p className="mt-1 text-[12px] font-medium text-foreground">{last ? formatDateTime(last.completed_at ?? last.queued_at) : "Never"}</p></div>
      <div><p className="text-[10px] uppercase tracking-wide text-muted-foreground">Next run</p><p className="mt-1 text-[12px] font-medium text-foreground">{nextRunAt(job) ? formatDateTime(nextRunAt(job)) : "Manual only"}</p></div>
    </div>
  );
}

function JobWizard({ open, onOpenChange, destinations }: { open: boolean; onOpenChange: (open: boolean) => void; destinations: ExportDestination[] }) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("New complaint export");
  const [sourceType, setSourceType] = useState<SourceType>("TRANSACTIONAL");
  const [sourceId, setSourceId] = useState("src.pgr.txn.prod");
  const [mode, setMode] = useState<ExportMode>("INCREMENTAL");
  const [format, setFormat] = useState("JSON Lines");
  const [compression, setCompression] = useState<"GZIP" | "NONE">("GZIP");
  const [destinationId, setDestinationId] = useState(destinations[0]?.destination_id ?? "");
  const [scheduled, setScheduled] = useState(true);
  const [frequency, setFrequency] = useState<ScheduleFrequency>("DAILY");
  const [time, setTime] = useState("02:00");
  const [day, setDay] = useState("Sunday");
  const [timezone, setTimezone] = useState(ACCOUNT_TIMEZONE);
  const [retries, setRetries] = useState("3");
  const [notify, setNotify] = useState(true);
  const [recipients, setRecipients] = useState(ACCOUNT_ADMIN_EMAIL);
  const sources = listDataSources().filter((item) => item.source_type === sourceType);
  const source = getDataSource(sourceId);

  function reset() {
    setStep(0);
    setName("New complaint export");
    setSourceType("TRANSACTIONAL");
    setSourceId("src.pgr.txn.prod");
    setMode("INCREMENTAL");
    setFormat("JSON Lines");
    setCompression("GZIP");
    setScheduled(true);
    setFrequency("DAILY");
    setTime("02:00");
    setDay("Sunday");
    setTimezone(ACCOUNT_TIMEZONE);
    setRetries("3");
    setNotify(true);
    setRecipients(ACCOUNT_ADMIN_EMAIL);
  }
  function close() { onOpenChange(false); reset(); }
  function next() {
    if (step === 0 && !name.trim()) { toast.error("Add a name for this export job."); return; }
    if (step < 3) setStep((value) => value + 1);
    else {
      createJob({
        name: name.trim(), source_id: sourceId, source_type: sourceType, destination_id: destinationId,
        export_mode: mode, format, compression, schedule_type: scheduled ? "SCHEDULED" : "MANUAL",
        schedule: scheduled ? { frequency, time, ...(frequency === "WEEKLY" ? { day_of_week: day } : {}) } : null,
        timezone, retry_policy: { enabled: Number(retries) > 0, attempts: Math.max(1, Number(retries) || 1), strategy: "exponential_backoff" },
        notify_on_failure: notify, notification_recipients: notify ? recipients.split(",").map((item) => item.trim()).filter(Boolean) : [], status: "ACTIVE",
      });
      toast.success("Export job created");
      close();
    }
  }
  function selectClass() { return "h-9 w-full rounded-sm border border-border bg-background px-3 text-[12px] text-foreground"; }
  return (
    <Dialog open={open} onOpenChange={(value) => value ? onOpenChange(true) : close()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto rounded-sm p-0">
        <DialogHeader className="border-b border-border px-5 py-4">
          <DialogTitle className="text-[16px]">Create export job</DialogTitle>
          <DialogDescription className="text-[12px]">Define what this account exports, where it goes and when it runs.</DialogDescription>
        </DialogHeader>
        <div className="border-b border-border px-5 py-3">
          <div className="flex items-center gap-2 overflow-x-auto">
            {["Job details", "Data source", "Scope & format", "Schedule & delivery"].map((label, index) => (
              <div key={label} className="flex min-w-max items-center gap-2">
                <div className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold ${index <= step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{index < step ? <Check className="h-3 w-3" /> : index + 1}</div>
                <span className={`text-[11px] ${index === step ? "font-semibold text-foreground" : "text-muted-foreground"}`}>{label}</span>
                {index < 3 && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-4 px-5 py-5">
          {step === 0 && <>
            <SectionHeading eyebrow="Step 1 of 4" title="Name this export job" description="Use a name your operations and data teams will recognise in the job list." />
            <Field label="Job name"><Input className={inputClass} value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Daily complaint transaction export" /></Field>
            <div className="border border-border bg-muted/30 p-3 text-[11px] text-muted-foreground"><LockKeyhole className="mr-1 inline h-3.5 w-3.5" />Exports are account-wide and are not affected by the current Working Context locality.</div>
          </>}
          {step === 1 && <>
            <SectionHeading eyebrow="Step 2 of 4" title="Choose an account data source" description="The catalogue is generated for this account and only exposes export-enabled sources." />
            <Field label="Source type"><Select value={sourceType} onValueChange={(value) => { const nextType = value as SourceType; setSourceType(nextType); const first = listDataSources().find((item) => item.source_type === nextType); if (first) { setSourceId(first.source_id); setFormat(first.supported_formats[0] ?? "CSV"); setMode(first.supported_export_modes[0] ?? "FULL"); } }}><SelectTrigger className={inputClass}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="TRANSACTIONAL">Transactional</SelectItem><SelectItem value="ANALYTICAL">Analytical</SelectItem></SelectContent></Select></Field>
            <Field label="Data source"><Select value={sourceId} onValueChange={setSourceId}><SelectTrigger className={inputClass}><SelectValue /></SelectTrigger><SelectContent>{sources.map((item) => <SelectItem key={item.source_id} value={item.source_id}>{item.friendly_name}</SelectItem>)}</SelectContent></Select></Field>
            {source && <div className="grid gap-2 border border-border bg-muted/20 p-3 text-[11px] sm:grid-cols-3"><div><span className="text-muted-foreground">Environment</span><p className="mt-0.5 font-medium text-foreground">{source.environment}</p></div><div><span className="text-muted-foreground">Approx. size</span><p className="mt-0.5 font-medium text-foreground">{source.approximate_size}</p></div><div><span className="text-muted-foreground">Modes</span><p className="mt-0.5 font-medium text-foreground">{source.supported_export_modes.join(", ")}</p></div></div>}
          </>}
          {step === 2 && <>
            <SectionHeading eyebrow="Step 3 of 4" title="Set scope and delivery format" description="Full exports include the source snapshot. Incremental exports include changes since the previous successful run." />
            <Field label="Export scope"><Select value={mode} onValueChange={(value) => setMode(value as ExportMode)}><SelectTrigger className={inputClass}><SelectValue /></SelectTrigger><SelectContent>{source?.supported_export_modes.map((item) => <SelectItem key={item} value={item}>{item === "FULL" ? "Full snapshot" : "Incremental changes"}</SelectItem>)}</SelectContent></Select></Field>
            <div className="grid gap-4 sm:grid-cols-2"><Field label="File format"><Select value={format} onValueChange={setFormat}><SelectTrigger className={inputClass}><SelectValue /></SelectTrigger><SelectContent>{source?.supported_formats.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></Field><Field label="Compression"><Select value={compression} onValueChange={(value) => setCompression(value as "GZIP" | "NONE")}><SelectTrigger className={inputClass}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="GZIP">GZIP</SelectItem><SelectItem value="NONE">None</SelectItem></SelectContent></Select></Field></div>
            <Field label="Destination"><Select value={destinationId} onValueChange={setDestinationId}><SelectTrigger className={inputClass}><SelectValue placeholder="Select a destination" /></SelectTrigger><SelectContent>{destinations.map((item) => <SelectItem key={item.destination_id} value={item.destination_id}>{item.name} ({item.type})</SelectItem>)}</SelectContent></Select></Field>
            {!destinations.length && <p className="text-[11px] text-amber-700">Add and test a destination before creating an export job.</p>}
          </>}
          {step === 3 && <>
            <SectionHeading eyebrow="Step 4 of 4" title="Schedule and delivery notifications" description="Scheduled exports use the account timezone. Manual jobs can be run from the job list at any time." />
            <div className="flex items-center justify-between border border-border bg-muted/20 p-3"><div><p className="text-[12px] font-medium text-foreground">Run on a schedule</p><p className="text-[11px] text-muted-foreground">Turn off for a manual-only job.</p></div><Switch checked={scheduled} onCheckedChange={setScheduled} /></div>
            {scheduled && <div className="grid gap-4 sm:grid-cols-2"><Field label="Frequency"><select className={selectClass()} value={frequency} onChange={(event) => setFrequency(event.target.value as ScheduleFrequency)}><option value="DAILY">Daily</option><option value="WEEKLY">Weekly</option><option value="MONTHLY">Monthly</option></select></Field><Field label="Time"><Input type="time" className={inputClass} value={time} onChange={(event) => setTime(event.target.value)} /></Field>{frequency === "WEEKLY" && <Field label="Day"><select className={selectClass()} value={day} onChange={(event) => setDay(event.target.value)}>{["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((item) => <option key={item}>{item}</option>)}</select></Field>}<Field label="Timezone"><select className={selectClass()} value={timezone} onChange={(event) => setTimezone(event.target.value)}>{TIMEZONES.map((item) => <option key={item}>{item}</option>)}</select></Field></div>}
            <div className="grid gap-4 sm:grid-cols-2"><Field label="Retry attempts" hint="Retries use bounded exponential backoff."><Input type="number" min={0} max={5} className={inputClass} value={retries} onChange={(event) => setRetries(event.target.value)} /></Field><Field label="Failure notification recipients" hint="Separate email addresses with commas."><Input className={inputClass} value={recipients} disabled={!notify} onChange={(event) => setRecipients(event.target.value)} /></Field></div>
            <div className="flex items-center gap-2"><Switch checked={notify} onCheckedChange={setNotify} id="notify" /><Label htmlFor="notify" className="text-[11px] text-foreground">Notify recipients when a run fails</Label></div>
          </>}
        </div>
        <DialogFooter className="border-t border-border px-5 py-3"><Button variant="outline" className={compactButton} onClick={step === 0 ? close : () => setStep((value) => value - 1)}>{step === 0 ? "Cancel" : "Back"}</Button><Button className={compactButton} onClick={next} disabled={step === 2 && !destinationId}>{step === 3 ? "Create export job" : "Continue"}<ChevronRight className="ml-1 h-3.5 w-3.5" /></Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DestinationDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [name, setName] = useState("");
  const [type, setType] = useState<DestinationType>("S3");
  const [location, setLocation] = useState("");
  const [authentication, setAuthentication] = useState("IAM role");
  const [secret, setSecret] = useState("");
  const [region, setRegion] = useState(AWS_REGIONS[0]);
  const [encryption, setEncryption] = useState("Amazon S3 managed encryption");
  const [externalId, setExternalId] = useState(generateExternalId());
  const [testing, setTesting] = useState(false);
  const [tested, setTested] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  function reset() { setName(""); setType("S3"); setLocation(""); setAuthentication("IAM role"); setSecret(""); setRegion(AWS_REGIONS[0]); setEncryption("Amazon S3 managed encryption"); setExternalId(generateExternalId()); setTesting(false); setTested(false); setTestResult(null); }
  function close() { onOpenChange(false); reset(); }
  async function test() {
    if (!location.trim()) { toast.error("Add a destination location first."); return; }
    setTesting(true); setTestResult(null);
    const result = await testConnection(type);
    setTested(result.ok); setTestResult(result); setTesting(false);
  }
  function save() {
    if (!name.trim() || !location.trim()) { toast.error("Add a name and destination location."); return; }
    if (!tested) { toast.error("Test the connection successfully before saving."); return; }
    const draft: DestinationDraft = { name: name.trim(), type, location: location.trim(), authentication, secret_hint: maskSecret(secret), ...(type === "S3" ? { region, encryption, external_id: externalId } : {}) };
    createDestination(draft, true); toast.success("Destination added securely"); close();
  }
  return <Dialog open={open} onOpenChange={(value) => value ? onOpenChange(true) : close()}><DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto rounded-sm p-0"><DialogHeader className="border-b border-border px-5 py-4"><DialogTitle className="text-[16px]">Add destination</DialogTitle><DialogDescription className="text-[12px]">Connect an account-managed S3 bucket or SFTP server. Credentials are sent to secure storage and are never shown again.</DialogDescription></DialogHeader><div className="space-y-4 px-5 py-5"><div className="grid gap-4 sm:grid-cols-2"><Field label="Destination name"><Input className={inputClass} value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Production S3" /></Field><Field label="Type"><Select value={type} onValueChange={(value) => { const next = value as DestinationType; setType(next); setAuthentication(next === "S3" ? "IAM role" : "SSH private key"); }}><SelectTrigger className={inputClass}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="S3">Amazon S3</SelectItem><SelectItem value="SFTP">SFTP server</SelectItem></SelectContent></Select></Field></div><Field label={type === "S3" ? "Bucket and prefix" : "Host, port and directory"}><Input className={inputClass} value={location} onChange={(event) => setLocation(event.target.value)} placeholder={type === "S3" ? "bucket-name/path/" : "sftp.example.gov:22/exports/"} /></Field><div className="grid gap-4 sm:grid-cols-2"><Field label="Authentication"><Select value={authentication} onValueChange={setAuthentication}><SelectTrigger className={inputClass}><SelectValue /></SelectTrigger><SelectContent>{type === "S3" ? <><SelectItem value="IAM role">IAM role</SelectItem><SelectItem value="Access key">Access key</SelectItem></> : <><SelectItem value="SSH private key">SSH private key</SelectItem><SelectItem value="Password">Password</SelectItem></>}</SelectContent></Select></Field><Field label="Credential or secret" hint="Stored securely as a reference; only a masked hint remains in this console."><Input type="password" className={inputClass} value={secret} onChange={(event) => setSecret(event.target.value)} placeholder="Enter once" /></Field></div>{type === "S3" && <div className="grid gap-4 sm:grid-cols-2"><Field label="AWS region"><select className={selectClass} value={region} onChange={(event) => setRegion(event.target.value)}>{AWS_REGIONS.map((item) => <option key={item}>{item}</option>)}</select></Field><Field label="Encryption"><select className={selectClass} value={encryption} onChange={(event) => setEncryption(event.target.value)}><option>Amazon S3 managed encryption</option><option>AWS KMS key</option></select></Field></div>}{type === "S3" && <Field label="External ID" hint="Use this value when creating the customer-managed cross-account IAM role."><div className="flex gap-2"><Input className={inputClass} value={externalId} readOnly /><Button variant="outline" className={compactButton} onClick={() => { void navigator.clipboard?.writeText(externalId); toast.success("External ID copied"); }}>Copy</Button></div></Field>}<div className="border border-border bg-muted/20 p-3 text-[11px] text-muted-foreground"><ShieldCheck className="mr-1 inline h-3.5 w-3.5 text-primary" />Connection testing checks reachability, authentication, permissions and write access. It does not expose credentials.</div>{testResult && <div className={`border p-3 text-[11px] ${testResult.ok ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-rose-200 bg-rose-50 text-rose-800"}`}>{testResult.ok ? <Check className="mr-1 inline h-3.5 w-3.5" /> : <XCircle className="mr-1 inline h-3.5 w-3.5" />}{testResult.message}</div>}</div><DialogFooter className="border-t border-border px-5 py-3"><Button variant="outline" className={compactButton} onClick={close}>Cancel</Button><Button variant="outline" className={compactButton} onClick={() => void test()} disabled={testing}><RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${testing ? "animate-spin" : ""}`} />{testing ? "Testing" : "Test connection"}</Button><Button className={compactButton} onClick={save} disabled={!tested}>Save destination</Button></DialogFooter></DialogContent></Dialog>;
}

function RunDetails({ run, job, onClose, onRetry }: { run: ExportRun; job?: ExportJob; onClose: () => void; onRetry: (run: ExportRun) => void }) {
  return <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}><DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto rounded-sm p-0"><DialogHeader className="border-b border-border px-5 py-4"><div className="flex items-center gap-2"><DialogTitle className="text-[16px]">Run {run.run_id}</DialogTitle><StatusBadge status={run.status} /></div><DialogDescription className="text-[12px]">{job?.name ?? run.job_id} · {TRIGGER_LABEL[run.trigger]} trigger{run.retry_number ? ` · Retry ${run.retry_number}` : ""}</DialogDescription></DialogHeader><div className="space-y-5 px-5 py-5">{run.status === "FAILED" && <div className="border border-rose-200 bg-rose-50 p-3"><div className="flex items-center gap-2 text-[12px] font-semibold text-rose-800"><AlertTriangle className="h-4 w-4" />{run.error_category ? ERROR_CATEGORY_LABEL[run.error_category] : "Export failed"}</div><p className="mt-1 text-[11px] leading-5 text-rose-800">{run.error_message_safe}</p><p className="mt-2 text-[10px] text-rose-700">Reference: {run.error_reference_id} · Failed at {run.failure_stage}</p></div>}{run.status === "COMPLETED" || run.status === "COMPLETED_WITH_WARNINGS" ? <div className="grid gap-3 border border-border bg-muted/20 p-3 sm:grid-cols-3"><div><p className="text-[10px] text-muted-foreground">File</p><p className="mt-1 break-all text-[11px] font-medium text-foreground">{run.file_name}</p></div><div><p className="text-[10px] text-muted-foreground">Size</p><p className="mt-1 text-[11px] font-medium text-foreground">{formatBytes(run.file_size_bytes)}</p></div><div><p className="text-[10px] text-muted-foreground">Duration</p><p className="mt-1 text-[11px] font-medium text-foreground">{formatDuration(run.started_at, run.completed_at)}</p></div></div> : null}<div><h3 className="text-[12px] font-semibold text-foreground">Execution timeline</h3><div className="mt-3 space-y-0 border-l border-border pl-4">{run.timeline.map((event) => <div key={`${event.stage}-${event.at}`} className="relative pb-4 last:pb-0"><span className="absolute -left-[21px] top-0.5 h-2.5 w-2.5 rounded-full border-2 border-background bg-primary" /><p className="text-[11px] font-medium text-foreground">{event.stage}</p><p className="mt-0.5 text-[10px] text-muted-foreground">{formatDateTime(event.at)}</p></div>)}</div></div>{run.warnings?.length ? <div className="border border-amber-200 bg-amber-50 p-3 text-[11px] text-amber-800"><AlertTriangle className="mr-1 inline h-3.5 w-3.5" />{run.warnings.join(" ")}</div> : null}</div><DialogFooter className="border-t border-border px-5 py-3"><Button variant="outline" className={compactButton} onClick={onClose}>Close</Button>{run.status === "FAILED" && <Button className={compactButton} onClick={() => onRetry(run)}><RefreshCw className="mr-1.5 h-3.5 w-3.5" />Retry run</Button>}</DialogFooter></DialogContent></Dialog>;
}

function JobsTab({ snapshot, destinations, onCreate }: { snapshot: ReturnType<typeof useDataExport>; destinations: ExportDestination[]; onCreate: () => void }) {
  const [detailJob, setDetailJob] = useState<ExportJob | null>(null);
  const sources = listDataSources();
  const [search, setSearch] = useState("");
  const jobs = snapshot.jobs.filter((job) => job.account_id === ACCOUNT_ID && job.name.toLowerCase().includes(search.toLowerCase()));
  function execute(job: ExportJob) { if (job.status !== "ACTIVE") { toast.error("Resume this job before running it."); return; } runNow(job.job_id); toast.success("Export queued"); }
  return <div className="space-y-5"><SectionHeading eyebrow="Export jobs" title="Scheduled and manual exports" description="Create repeatable exports for transactional or analytical account data. Each run has its own immutable history." action={<Can perm="DATA_EXPORT_JOB_MANAGE"><Button className={compactButton} onClick={onCreate}><Plus className="mr-1.5 h-3.5 w-3.5" />Create export job</Button></Can>} /><div className="flex flex-wrap items-center gap-2"><Input className={`${inputClass} max-w-xs`} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search export jobs" /><span className="text-[11px] text-muted-foreground">{jobs.length} of {snapshot.jobs.length} jobs</span></div>{jobs.length ? <div className="overflow-x-auto border border-border"><table className="w-full min-w-[900px] text-left text-[11px]"><thead className="bg-muted/40 text-[10px] uppercase tracking-wide text-muted-foreground"><tr><th className="px-3 py-2.5 font-medium">Job</th><th className="px-3 py-2.5 font-medium">Source</th><th className="px-3 py-2.5 font-medium">Destination</th><th className="px-3 py-2.5 font-medium">Schedule</th><th className="px-3 py-2.5 font-medium">Last run</th><th className="px-3 py-2.5 font-medium">Status</th><th className="px-3 py-2.5 text-right font-medium">Actions</th></tr></thead><tbody className="divide-y divide-border">{jobs.map((job) => { const last = lastRunForJob(snapshot.runs, job.job_id); const source = sources.find((item) => item.source_id === job.source_id); const dest = destinations.find((item) => item.destination_id === job.destination_id); return <tr key={job.job_id} className="bg-surface align-top"><td className="px-3 py-3"><button className="text-left font-semibold text-foreground hover:text-primary" onClick={() => setDetailJob(job)}>{job.name}</button><p className="mt-1 text-[10px] text-muted-foreground">{job.job_id} · {job.source_type.toLowerCase()}</p></td><td className="px-3 py-3 text-foreground">{source?.friendly_name ?? job.source_id}<p className="mt-1 text-[10px] text-muted-foreground">{job.export_mode} · {job.format}</p></td><td className="px-3 py-3 text-foreground">{dest?.name ?? job.destination_id}<p className="mt-1 text-[10px] text-muted-foreground">{dest?.type}</p></td><td className="px-3 py-3 text-foreground">{describeSchedule(job)}<p className="mt-1 text-[10px] text-muted-foreground">{job.timezone}</p></td><td className="px-3 py-3">{last ? <><StatusBadge status={last.status} /><p className="mt-1 text-[10px] text-muted-foreground">{formatDateTime(last.completed_at ?? last.queued_at)}</p></> : <span className="text-muted-foreground">Never</span>}</td><td className="px-3 py-3"><StatusBadge status={job.status} /></td><td className="px-3 py-3"><div className="flex justify-end gap-1"><Can perm="DATA_EXPORT_RUN"><Button variant="outline" size="icon" className="h-7 w-7" title="Run now" onClick={() => execute(job)}><Play className="h-3 w-3" /></Button></Can><Can perm="DATA_EXPORT_JOB_MANAGE"><Button variant="outline" size="icon" className="h-7 w-7" title={job.status === "PAUSED" ? "Resume job" : "Pause job"} onClick={() => { setJobStatus(job.job_id, job.status === "PAUSED" ? "ACTIVE" : "PAUSED"); toast.success(job.status === "PAUSED" ? "Job resumed" : "Job paused"); }}><Clock3 className="h-3 w-3" /></Button><Button variant="outline" size="icon" className="h-7 w-7" title="Delete job" onClick={() => { deleteJob(job.job_id); toast.success("Job deleted; run history was preserved"); }}><Trash2 className="h-3 w-3" /></Button></Can></div></td></tr>; })}</tbody></table></div> : <EmptyTable title="No export jobs match" body="Create a scheduled or manual export job to begin building an account-wide export history." action={<Button className={compactButton} onClick={onCreate}><Plus className="mr-1.5 h-3.5 w-3.5" />Create export job</Button>} />}{detailJob && <JobDetailDialog job={detailJob} snapshot={snapshot} destinations={destinations} onClose={() => setDetailJob(null)} onRun={execute} />}</div>;
}

function JobDetailDialog({ job, snapshot, destinations, onClose, onRun }: { job: ExportJob; snapshot: ReturnType<typeof useDataExport>; destinations: ExportDestination[]; onClose: () => void; onRun: (job: ExportJob) => void }) {
  const [run, setRun] = useState<ExportRun | null>(null);
  return <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}><DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto rounded-sm p-0"><DialogHeader className="border-b border-border px-5 py-4"><div className="flex items-center gap-2"><DialogTitle className="text-[16px]">{job.name}</DialogTitle><StatusBadge status={job.status} /></div><DialogDescription className="text-[12px]">Read-only job summary and execution history for {ACCOUNT_NAME}.</DialogDescription></DialogHeader><div className="space-y-5 px-5 py-5"><JobSummary job={job} sources={listDataSources()} destinations={destinations} runs={snapshot.runs} /><div><div className="flex items-center justify-between"><h3 className="text-[12px] font-semibold text-foreground">Runs for this job</h3><Can perm="DATA_EXPORT_RUN"><Button className={compactButton} onClick={() => onRun(job)}><Play className="mr-1.5 h-3.5 w-3.5" />Run now</Button></Can></div><div className="mt-2 overflow-x-auto border border-border"><table className="w-full min-w-[600px] text-left text-[11px]"><thead className="bg-muted/40 text-[10px] uppercase tracking-wide text-muted-foreground"><tr><th className="px-3 py-2 font-medium">Run</th><th className="px-3 py-2 font-medium">Started</th><th className="px-3 py-2 font-medium">Duration</th><th className="px-3 py-2 font-medium">Status</th><th className="px-3 py-2"></th></tr></thead><tbody className="divide-y divide-border">{runsForJob(snapshot.runs, job.job_id).map((item) => <tr key={item.run_id}><td className="px-3 py-2.5 font-medium text-foreground">{item.run_id}<p className="text-[10px] font-normal text-muted-foreground">{TRIGGER_LABEL[item.trigger]}</p></td><td className="px-3 py-2.5 text-muted-foreground">{formatDateTime(item.started_at ?? item.queued_at)}</td><td className="px-3 py-2.5 text-muted-foreground">{formatDuration(item.started_at, item.completed_at)}</td><td className="px-3 py-2.5"><StatusBadge status={item.status} /></td><td className="px-3 py-2.5 text-right"><Button variant="ghost" className={compactButton} onClick={() => setRun(item)}>View details</Button></td></tr>)}</tbody></table></div></div></div><DialogFooter className="border-t border-border px-5 py-3"><Button variant="outline" className={compactButton} onClick={onClose}>Close</Button></DialogFooter>{run && <RunDetails run={run} job={job} onClose={() => setRun(null)} onRetry={(failed) => { retryRun(failed.run_id); setRun(null); toast.success("Retry queued as a new run"); }} />}</DialogContent></Dialog>;
}

function DestinationsTab({ destinations, onAdd }: { destinations: ExportDestination[]; onAdd: () => void }) {
  const [testingId, setTestingId] = useState<string | null>(null);
  async function test(destination: ExportDestination) { setTestingId(destination.destination_id); const result = await testConnection(destination.type, destination.destination_id); setTestingId(null); result.ok ? toast.success("Connection successful") : toast.error(result.message); }
  return <div className="space-y-5"><SectionHeading eyebrow="Secure destinations" title="Where exports are delivered" description="Destinations are account-wide. Secrets are kept in secure storage and this screen only shows masked metadata." action={<Can perm="DATA_EXPORT_DESTINATION_MANAGE"><Button className={compactButton} onClick={onAdd}><Plus className="mr-1.5 h-3.5 w-3.5" />Add destination</Button></Can>} />{destinations.length ? <div className="grid gap-3 lg:grid-cols-2">{destinations.map((destination) => <div key={destination.destination_id} className="border border-border bg-surface p-4"><div className="flex items-start justify-between gap-3"><div className="flex items-start gap-3"><div className="flex h-8 w-8 items-center justify-center border border-border bg-muted/30 text-primary">{destination.type === "S3" ? <Server className="h-4 w-4" /> : <ExternalLink className="h-4 w-4" />}</div><div><p className="text-[13px] font-semibold text-foreground">{destination.name}</p><p className="mt-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">{destination.type} · {destination.authentication}</p></div></div><StatusBadge status={destination.connection_status} /></div><dl className="mt-4 grid gap-3 border-t border-border pt-3 text-[11px] sm:grid-cols-2"><div><dt className="text-muted-foreground">Location</dt><dd className="mt-0.5 break-all font-medium text-foreground">{destination.location}</dd></div><div><dt className="text-muted-foreground">Credential</dt><dd className="mt-0.5 font-medium text-foreground">{destination.secret_hint ?? "IAM role reference"}</dd></div><div><dt className="text-muted-foreground">Last tested</dt><dd className="mt-0.5 font-medium text-foreground">{formatDateTime(destination.last_tested_at)}</dd></div><div><dt className="text-muted-foreground">Secret reference</dt><dd className="mt-0.5 break-all font-medium text-foreground">{destination.secret_ref}</dd></div></dl><div className="mt-4 flex flex-wrap gap-2"><Can perm="DATA_EXPORT_DESTINATION_MANAGE"><Button variant="outline" className={compactButton} onClick={() => void test(destination)} disabled={testingId === destination.destination_id}><RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${testingId === destination.destination_id ? "animate-spin" : ""}`} />{testingId === destination.destination_id ? "Testing" : "Test connection"}</Button><Button variant="outline" className={compactButton} onClick={() => { const result = deleteDestination(destination.destination_id); result.ok ? toast.success("Destination deleted") : toast.error(result.reason); }}><Trash2 className="mr-1.5 h-3.5 w-3.5" />Delete</Button></Can></div></div>)}</div> : <EmptyTable title="No destinations configured" body="Add an Amazon S3 or SFTP destination, test its connection, then use it in an export job." action={<Button className={compactButton} onClick={onAdd}><Plus className="mr-1.5 h-3.5 w-3.5" />Add destination</Button>} />}</div>;
}

function HistoryTab({ snapshot }: { snapshot: ReturnType<typeof useDataExport> }) {
  const [status, setStatus] = useState("ALL");
  const [selected, setSelected] = useState<ExportRun | null>(null);
  const [jobFilter, setJobFilter] = useState("ALL");
  const jobs = snapshot.jobs;
  const runs = snapshot.runs.filter((run) => (status === "ALL" || run.status === status) && (jobFilter === "ALL" || run.job_id === jobFilter));
  const jobFor = (id: string) => jobs.find((job) => job.job_id === id);
  return <div className="space-y-5"><SectionHeading eyebrow="Immutable history" title="Export run history" description="Every attempt remains available with its trigger, timeline, safe failure reference and output metadata. Retrying creates a new run." /><div className="flex flex-wrap gap-2"><select className="h-8 rounded-sm border border-border bg-background px-2 text-[11px] text-foreground" value={jobFilter} onChange={(event) => setJobFilter(event.target.value)}><option value="ALL">All jobs</option>{jobs.map((job) => <option key={job.job_id} value={job.job_id}>{job.name}</option>)}</select><select className="h-8 rounded-sm border border-border bg-background px-2 text-[11px] text-foreground" value={status} onChange={(event) => setStatus(event.target.value)}><option value="ALL">All statuses</option><option value="COMPLETED">Completed</option><option value="COMPLETED_WITH_WARNINGS">Completed with warnings</option><option value="FAILED">Failed</option><option value="RUNNING">Running</option><option value="QUEUED">Queued</option></select><span className="flex items-center text-[11px] text-muted-foreground">{runs.length} runs</span></div>{runs.length ? <div className="overflow-x-auto border border-border"><table className="w-full min-w-[950px] text-left text-[11px]"><thead className="bg-muted/40 text-[10px] uppercase tracking-wide text-muted-foreground"><tr><th className="px-3 py-2.5 font-medium">Run</th><th className="px-3 py-2.5 font-medium">Job</th><th className="px-3 py-2.5 font-medium">Trigger</th><th className="px-3 py-2.5 font-medium">Queued</th><th className="px-3 py-2.5 font-medium">Duration</th><th className="px-3 py-2.5 font-medium">Status</th><th className="px-3 py-2.5 font-medium">Output / error</th><th className="px-3 py-2.5"></th></tr></thead><tbody className="divide-y divide-border">{runs.map((run) => <tr key={run.run_id} className="bg-surface"><td className="px-3 py-3 font-semibold text-foreground">{run.run_id}{run.retry_number > 0 && <p className="mt-0.5 text-[10px] font-normal text-muted-foreground">Retry {run.retry_number}</p>}</td><td className="px-3 py-3 text-foreground">{jobFor(run.job_id)?.name ?? run.job_id}</td><td className="px-3 py-3 text-muted-foreground">{TRIGGER_LABEL[run.trigger]}</td><td className="px-3 py-3 text-muted-foreground">{formatDateTime(run.queued_at)}</td><td className="px-3 py-3 text-muted-foreground">{formatDuration(run.started_at, run.completed_at)}</td><td className="px-3 py-3"><StatusBadge status={run.status} /></td><td className="max-w-[260px] px-3 py-3 text-muted-foreground">{run.file_name ? <span className="break-all">{run.file_name}</span> : run.error_message_safe ? <span className="text-rose-700">{run.error_message_safe}</span> : "-"}</td><td className="px-3 py-3 text-right"><Button variant="ghost" className={compactButton} onClick={() => setSelected(run)}>View details</Button></td></tr>)}</tbody></table></div> : <EmptyTable title="No runs found" body="Runs from manual and scheduled jobs will appear here and remain available for audit and download metadata." />}{selected && <RunDetails run={selected} job={jobFor(selected.job_id)} onClose={() => setSelected(null)} onRetry={(failed) => { retryRun(failed.run_id); setSelected(null); toast.success("Retry queued as a new run"); }} />}</div>;
}

function DataExportPage() {
  const { hasPermission } = useRbac();
  const snapshot = useDataExport();
  const [jobWizard, setJobWizard] = useState(false);
  const [destinationDialog, setDestinationDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("jobs");
  const destinations = useMemo(() => snapshot.destinations.filter((item) => item.account_id === ACCOUNT_ID), [snapshot.destinations]);
  if (!hasPermission("DATA_EXPORT_VIEW")) {
    return <div className="p-6"><EmptyTable title="Data & Export is not available" body="Your account role does not have permission to view export configuration or history." /></div>;
  }
  return <div className="flex h-full flex-col"><AdminPageHeader title="Data & Export" subtitle={`Account-wide transactional and analytical exports for ${ACCOUNT_NAME}`} actions={<div className="flex items-center gap-2"><span className="hidden text-[10px] text-muted-foreground sm:inline">Account scope · {ACCOUNT_ID}</span><Can perm="DATA_EXPORT_JOB_MANAGE"><Button className={compactButton} onClick={() => setJobWizard(true)}><Plus className="mr-1.5 h-3.5 w-3.5" />Create export job</Button></Can></div>} /><div className="border-b border-border bg-surface px-4 lg:px-6"><Tabs value={activeTab} onValueChange={setActiveTab}><TabsList className="h-10 rounded-none bg-transparent p-0"><TabsTrigger value="jobs" className="h-10 rounded-none border-b-2 border-transparent px-3 text-[12px] data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none">Export jobs</TabsTrigger><TabsTrigger value="destinations" className="h-10 rounded-none border-b-2 border-transparent px-3 text-[12px] data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none">Destinations</TabsTrigger><TabsTrigger value="history" className="h-10 rounded-none border-b-2 border-transparent px-3 text-[12px] data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none">Run history</TabsTrigger></TabsList></Tabs></div><main className="flex-1 overflow-auto p-4 lg:p-6"><div className="mb-5 flex flex-wrap items-center gap-2 border border-border bg-muted/20 px-3 py-2.5 text-[11px] text-muted-foreground"><ShieldCheck className="h-4 w-4 shrink-0 text-primary" /><span>Exports remain isolated to <strong className="font-semibold text-foreground">{ACCOUNT_NAME}</strong>, regardless of Working Context. Credentials are masked in the console.</span><span className="ml-auto flex items-center gap-1 text-[10px]"><LockKeyhole className="h-3 w-3" />Secure account scope</span></div><Tabs value={activeTab} onValueChange={setActiveTab}><TabsContent value="jobs" className="mt-0"><JobsTab snapshot={snapshot} destinations={destinations} onCreate={() => setJobWizard(true)} /></TabsContent><TabsContent value="destinations" className="mt-0"><DestinationsTab destinations={destinations} onAdd={() => setDestinationDialog(true)} /></TabsContent><TabsContent value="history" className="mt-0"><HistoryTab snapshot={snapshot} /></TabsContent></Tabs></main><JobWizard open={jobWizard} onOpenChange={setJobWizard} destinations={destinations} /><DestinationDialog open={destinationDialog} onOpenChange={setDestinationDialog} /></div>;
}
