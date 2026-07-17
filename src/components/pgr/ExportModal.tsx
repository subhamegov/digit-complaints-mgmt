/**
 * Export modal for the Department Head dashboard.
 * Left rail: destinations (config-driven). Right pane: registry of forms.
 */
import { useMemo, useState, type ReactNode } from "react";
import { X, Info, Cloud, FileSpreadsheet, Shield, Key } from "lucide-react";
import { cn } from "@/lib/utils";

const REGIONS = [
  "ap-south-1", "ap-southeast-1", "us-east-1", "us-west-2", "eu-west-1", "eu-central-1",
];

type Destination = {
  id: string;
  name: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
};

const DESTINATIONS: Destination[] = [
  { id: "s3", name: "S3 bucket", subtitle: "Recurring feed", icon: Cloud },
  { id: "excel", name: "Excel", subtitle: "One-time download", icon: FileSpreadsheet },
];

function InfoDot() {
  return (
    <span
      className="inline-flex h-3.5 w-3.5 items-center justify-center text-muted-foreground"
      title="More info"
    >
      <Info className="h-3.5 w-3.5" />
    </span>
  );
}

function FieldLabel({ children, required, tooltip }: { children: ReactNode; required?: boolean; tooltip?: boolean }) {
  return (
    <label className="flex items-center gap-1 text-[12px] font-medium text-foreground">
      <span>
        {children}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </span>
      {tooltip && <InfoDot />}
    </label>
  );
}

function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground border-b border-border pb-1.5">
      {children}
    </h3>
  );
}

const inputCls =
  "h-8 w-full rounded-sm border border-border bg-background px-2 text-[13px] focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";

function S3ExportForm({ onCancel }: { onCancel: () => void }) {
  const [connectionName, setConnectionName] = useState("");
  const [bucketName, setBucketName] = useState("");
  const [folderPath, setFolderPath] = useState("");
  const [region, setRegion] = useState("ap-south-1");
  const [selectEvents, setSelectEvents] = useState("all");
  const [frequency, setFrequency] = useState("15m");
  const [authMethod, setAuthMethod] = useState<"iam" | "keys">("iam");
  const [roleArn, setRoleArn] = useState("");
  const [externalId, setExternalId] = useState("dgt-8f2a-pg-export");
  const [accessKeyId, setAccessKeyId] = useState("");
  const [secretAccessKey, setSecretAccessKey] = useState("");

  const today = new Date().toISOString().slice(0, 10);
  const sampleEpoch = 1721203200;
  const path = `s3://${bucketName || "<bucket_name>"}/${connectionName || "<connection_name>"}${folderPath ? "/" + folderPath.replace(/^\/+|\/+$/g, "") : ""}/export_date=${today}/event_exports_${sampleEpoch}.json.gz`;

  return (
    <div className="space-y-4">
      <SectionHeading>Connection details</SectionHeading>

      <div className="space-y-1.5">
        <FieldLabel required tooltip>Connection name</FieldLabel>
        <input className={inputCls} value={connectionName} onChange={(e) => setConnectionName(e.target.value)} placeholder="my-connection" />
      </div>

      <div className="space-y-1.5">
        <FieldLabel required tooltip>Bucket name</FieldLabel>
        <input className={inputCls} value={bucketName} onChange={(e) => setBucketName(e.target.value)} placeholder="my-bucket" />
      </div>

      <div className="space-y-1.5">
        <FieldLabel tooltip>Folder path</FieldLabel>
        <input className={inputCls} value={folderPath} onChange={(e) => setFolderPath(e.target.value)} placeholder="optional/sub/path" />
      </div>

      <div className="rounded-sm border border-border bg-muted/40 px-2.5 py-2 font-mono text-[11px] break-all text-foreground">
        <span className="text-muted-foreground">File path: </span>{path}
      </div>

      <div className="space-y-1.5">
        <FieldLabel required>Bucket region</FieldLabel>
        <select className={inputCls} value={region} onChange={(e) => setRegion(e.target.value)}>
          {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      <SectionHeading>Export details</SectionHeading>

      <div className="space-y-1.5">
        <FieldLabel required>Select events</FieldLabel>
        <div className="flex flex-col gap-1.5">
          {[
            { v: "all", l: "All events" },
            { v: "manual", l: "Select events manually" },
          ].map((o) => (
            <label key={o.v} className="flex items-center gap-2 text-[13px] cursor-pointer">
              <input type="radio" name="events" value={o.v} checked={selectEvents === o.v} onChange={() => setSelectEvents(o.v)} />
              {o.l}
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <FieldLabel required tooltip>Frequency</FieldLabel>
        <div className="flex flex-col gap-1.5">
          {[
            { v: "15m", l: "Every 15 mins" },
            { v: "daily", l: "Daily" },
            { v: "weekly", l: "Weekly" },
          ].map((o) => (
            <label key={o.v} className="flex items-center gap-2 text-[13px] cursor-pointer">
              <input type="radio" name="frequency" value={o.v} checked={frequency === o.v} onChange={() => setFrequency(o.v)} />
              {o.l}
            </label>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 pt-2">
        <button className="h-8 rounded-sm border border-border bg-surface px-3 text-[12px] font-medium hover:bg-muted">Test connect</button>
        <button className="h-8 rounded-sm bg-primary px-3 text-[12px] font-medium text-primary-foreground hover:opacity-90">Connect</button>
        <button onClick={onCancel} className="h-8 rounded-sm px-3 text-[12px] font-medium text-muted-foreground hover:text-foreground">Cancel</button>
      </div>
      <p className="text-[11px] text-muted-foreground">Any changes will reflect in 15 minutes</p>
    </div>
  );
}

function ExcelExportForm({ onCancel }: { onCancel: () => void }) {
  const [sheets, setSheets] = useState({ list: true, log: true });
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  return (
    <div className="space-y-4">
      <p className="text-[12px] text-muted-foreground">One-time download of the current view. Nothing is saved.</p>

      <div className="space-y-1.5">
        <FieldLabel required>Sheets</FieldLabel>
        <div className="flex flex-col gap-1.5">
          <label className="flex items-center gap-2 text-[13px] cursor-pointer">
            <input type="checkbox" checked={sheets.list} onChange={(e) => setSheets((s) => ({ ...s, list: e.target.checked }))} />
            Complaints list <span className="text-muted-foreground text-[11px]">(ticket grain)</span>
          </label>
          <label className="flex items-center gap-2 text-[13px] cursor-pointer">
            <input type="checkbox" checked={sheets.log} onChange={(e) => setSheets((s) => ({ ...s, log: e.target.checked }))} />
            Complaints log <span className="text-muted-foreground text-[11px]">(event grain)</span>
          </label>
        </div>
      </div>

      <div className="space-y-1.5">
        <FieldLabel required>Date range</FieldLabel>
        <div className="grid grid-cols-2 gap-2">
          <input type="date" className={inputCls} value={start} onChange={(e) => setStart(e.target.value)} />
          <input type="date" className={inputCls} value={end} onChange={(e) => setEnd(e.target.value)} />
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground">
        Active dashboard filters applied · ~1,248 rows
      </p>

      <div className="flex items-center gap-2 pt-2">
        <button className="h-8 rounded-sm bg-primary px-3 text-[12px] font-medium text-primary-foreground hover:opacity-90">Download .xlsx</button>
        <button onClick={onCancel} className="h-8 rounded-sm px-3 text-[12px] font-medium text-muted-foreground hover:text-foreground">Cancel</button>
      </div>
    </div>
  );
}

const FORM_REGISTRY: Record<string, React.ComponentType<{ onCancel: () => void }>> = {
  s3: S3ExportForm,
  excel: ExcelExportForm,
};

export function ExportModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [selectedId, setSelectedId] = useState<string>("s3");
  const FormComponent = useMemo(() => FORM_REGISTRY[selectedId], [selectedId]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative z-10 flex h-[85vh] max-h-[720px] w-[90vw] max-w-[960px] flex-col overflow-hidden rounded-md border border-border bg-background shadow-lg">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-[14px] font-semibold">Export</h2>
          <button
            onClick={onClose}
            className="inline-flex h-7 w-7 items-center justify-center rounded-sm text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex flex-1 overflow-hidden">
          <aside className="flex w-2/5 flex-col border-r border-border bg-muted/30 p-2">
            {DESTINATIONS.map((d) => {
              const Icon = d.icon;
              const active = d.id === selectedId;
              return (
                <button
                  key={d.id}
                  onClick={() => setSelectedId(d.id)}
                  className={cn(
                    "flex items-start gap-2.5 rounded-sm border px-3 py-2.5 text-left transition-colors mb-1",
                    active
                      ? "border-primary bg-primary/10"
                      : "border-transparent hover:bg-muted",
                  )}
                >
                  <Icon className={cn("h-4 w-4 mt-0.5", active ? "text-primary" : "text-muted-foreground")} />
                  <div className="flex-1 min-w-0">
                    <div className={cn("text-[13px] font-medium", active && "text-primary")}>{d.name}</div>
                    <div className="text-[11px] text-muted-foreground">{d.subtitle}</div>
                  </div>
                </button>
              );
            })}
          </aside>
          <main className="flex-1 overflow-y-auto p-4">
            {FormComponent && <FormComponent onCancel={onClose} />}
          </main>
        </div>
      </div>
    </div>
  );
}
